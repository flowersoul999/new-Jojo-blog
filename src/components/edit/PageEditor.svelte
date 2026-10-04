<script lang="ts">
/**
 * 页面内编辑按钮 + 弹窗编辑器
 * ---------------------------------------------------------------------------
 * 只有登录了 GitHub 才渲染（GET /api/auth/status/），未登录时页面上什么都不出现。
 *
 * 为什么不走后端新接口：/api/content/read 与 /api/content/write 已经能读写
 * 仓库里任意文本文件（本地 dev 下直接读写本地磁盘），这里只是套一层 UI。
 *
 * 安全策略：
 *   - 内容文件（.md / .json）：直接编辑直接保存
 *   - 源码文件（.ts / .astro / .js ...）：折叠在「高级」区，且必须勾选
 *     「我确认语法正确」才允许保存；保存前跑一次轻量语法体检（括号配对 +
 *     JSON.parse），不通过就拒绝提交，避免一个逗号让 Vercel 构建炸掉。
 */
import { onMount } from "svelte";
import Modal from "@/components/manage/Modal.svelte";
import { apiGet, apiPost } from "@/components/manage/manage-utils";

/** 页面声明的一条可编辑文件 */
interface EditableFile {
	/** 仓库相对路径，例如 src/data/internship.ts */
	path: string;
	/** 展示名 */
	label: string;
	/** 一句话说明这个文件管什么 */
	hint?: string;
}

interface Props {
	/** 弹窗标题，例如「编辑实习经历页」 */
	title: string;
	/** 页面上的按钮文案 */
	buttonLabel?: string;
	/** 本页可编辑的文件清单 */
	files: EditableFile[];
}

let { title, buttonLabel = "编辑此页", files }: Props = $props();

// ---- 登录态 ----
let authed = $state(false);
let user = $state<{
	login: string;
	avatar_url: string;
	name: string | null;
} | null>(null);

// ---- 弹窗 ----
let open = $state(false);
let activePath = $state("");
let content = $state("");
let original = $state("");
let sha = $state("");
let loading = $state(false);
let saving = $state(false);
let dirty = $derived(content !== original);
// 源码文件需要二次确认
let ack = $state(false);
let error = $state("");
let saved = $state(false);

// 非源码文件（.md / .json）允许直接保存
const SAFE_EXT = /\.(md|json|jsonc|txt|csv|ya?ml)$/i;
const isSource = $derived(activePath ? !SAFE_EXT.test(activePath) : false);
const activeFile = $derived(files.find((f) => f.path === activePath) ?? null);
const dirtyCount = $derived(files.filter((f) => f.dirty).length);

interface FileState {
	dirty?: boolean;
}

/** 轻量语法体检：只查最容易手滑的两类问题，不做完整解析 */
function lintSyntax(path: string, text: string): string | null {
	// JSON 直接交给 JSON.parse
	if (/\.jsonc?$/i.test(path)) {
		try {
			JSON.parse(text);
		} catch (e) {
			return `JSON 格式错误：${e instanceof Error ? e.message : "解析失败"}`;
		}
		return null;
	}

	// 其余文本类：剥掉注释与字符串后检查括号配对
	let depthCurly = 0;
	let depthParen = 0;
	let depthBracket = 0;
	let inLineComment = false;
	let inBlockComment = false;
	let inStr: '"' | "'" | "`" | null = null;

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		const next = text[i + 1];

		if (inLineComment) {
			if (ch === "\n") inLineComment = false;
			continue;
		}
		if (inBlockComment) {
			if (ch === "*" && next === "/") {
				inBlockComment = false;
				i++;
			}
			continue;
		}
		if (inStr) {
			if (ch === "\\") {
				i++;
				continue;
			}
			if (ch === inStr) inStr = null;
			continue;
		}
		if (ch === "/" && next === "/") {
			inLineComment = true;
			i++;
			continue;
		}
		if (ch === "/" && next === "*") {
			inBlockComment = true;
			i++;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === "`") {
			inStr = ch;
			continue;
		}
		if (ch === "{") depthCurly++;
		else if (ch === "}") depthCurly--;
		else if (ch === "(") depthParen++;
		else if (ch === ")") depthParen--;
		else if (ch === "[") depthBracket++;
		else if (ch === "]") depthBracket--;

		if (depthCurly < 0 || depthParen < 0 || depthBracket < 0) {
			return `括号提前闭合（第 ${i + 1} 个字符附近），请检查是否多打了 } ) ]`;
		}
	}

	if (depthCurly !== 0) {
		return depthCurly > 0
			? `有 ${depthCurly} 个 { 没有闭合`
			: `有 ${-depthCurly} 个 } 没有对应 {`;
	}
	if (depthParen !== 0) {
		return depthParen > 0
			? `有 ${depthParen} 个 ( 没有闭合`
			: `有 ${-depthParen} 个 ) 没有对应 (`;
	}
	if (depthBracket !== 0) {
		return depthBracket > 0
			? `有 ${depthBracket} 个 [ 没有闭合`
			: `有 ${-depthBracket} 个 ] 没有对应 [`;
	}
	return null;
}

async function checkAuth() {
	try {
		const data = await apiGet<{
			authenticated?: boolean;
			user?: { login: string; avatar_url: string; name: string | null };
		}>("/api/auth/status/");
		authed = data.authenticated === true;
		user = data.user ?? null;
	} catch {
		authed = false;
		user = null;
	}
}

onMount(() => {
	void checkAuth();
});

async function selectFile(path: string) {
	// 有未保存改动时先拦一道
	if (dirty && activePath !== path) {
		const ok = window.confirm(
			`「${activeFile?.label ?? activePath}」还有未保存的改动，切换后会丢失。\n继续吗？`,
		);
		if (!ok) return;
	}

	loading = true;
	error = "";
	saved = false;
	ack = false;
	try {
		const data = await apiGet<{
			content: string | null;
			sha: string;
			encoding?: string;
		}>(`/api/content/read/?path=${encodeURIComponent(path)}`);
		if (data.content === null) {
			throw new Error("这是二进制文件，不支持在此编辑");
		}
		activePath = path;
		content = data.content;
		original = data.content;
		sha = data.sha;
		markClean(path);
	} catch (e) {
		error = e instanceof Error ? e.message : "读取失败";
		activePath = "";
		content = "";
		original = "";
		sha = "";
	} finally {
		loading = false;
	}
}

// 记录哪些文件已被本会话改动（用于文件清单上的小圆点）
const touched = $state<Record<string, boolean>>({});
function markClean(path: string) {
	touched[path] = false;
}
function markDirty(path: string, value: boolean) {
	touched[path] = value;
}

const canSave = $derived(
	dirty && !saving && !loading && (isSource ? ack : true),
);

async function save() {
	if (!activePath || !canSave) return;

	// 源码文件保存前再体检一次
	if (isSource) {
		const problem = lintSyntax(activePath, content);
		if (problem) {
			error = `语法体检没通过：${problem}`;
			return;
		}
	}

	const sure = window.confirm(
		isSource
			? `即将修改源码文件 ${activePath}。\n\n语法错误会导致站点构建失败、Vercel 部署不出来。\n确定要提交吗？`
			: `保存 ${activeFile?.label ?? activePath} 到 GitHub？\n提交后 Vercel 会自动重新部署。`,
	);
	if (!sure) return;

	saving = true;
	error = "";
	try {
		await apiPost("/api/content/write/", {
			path: activePath,
			content,
			sha: sha || undefined,
			message: `Update ${activePath.split("/").pop()}`,
		});
		original = content;
		saved = true;
		markDirty(activePath, false);
		// 关键：blob sha 在写入后已变化，必须重读一次。
		// 否则下一次保存不带 sha，GitHub Contents API 会返回 422。
		try {
			const fresh = await apiGet<{ sha: string }>(
				`/api/content/read/?path=${encodeURIComponent(activePath)}`,
			);
			sha = fresh.sha;
		} catch {
			// 重读失败就退回「不带 sha」，让服务端 409/422 兜底
			sha = "";
		}
	} catch (e) {
		error = e instanceof Error ? e.message : "保存失败";
	} finally {
		saving = false;
	}
}

function close() {
	if (dirty) {
		const ok = window.confirm("还有未保存的改动，确定关闭吗？");
		if (!ok) return;
	}
	open = false;
	error = "";
	saved = false;
	ack = false;
	// 重置选中态，下次打开从头开始
	activePath = "";
	content = "";
	original = "";
	sha = "";
}

function onInput(value: string) {
	content = value;
	if (activePath) markDirty(activePath, value !== original);
}

// 弹窗打开时先加载第一个文件
async function openModal() {
	open = true;
	if (!activePath && files.length > 0) await selectFile(files[0].path);
}
</script>

{#if authed}
	<button
		type="button"
		class="pe-trigger"
		onclick={openModal}
		title={`以 ${user?.login ?? "GitHub"} 身份编辑「${title}」`}
	>
		<svg
			width="15"
			height="15"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
		</svg>
		<span>{buttonLabel}</span>
		{#if user?.avatar_url}
			<img class="pe-trigger__avatar" src={user.avatar_url} alt="" />
		{/if}
	</button>
{/if}

{#if open}
	<Modal {title} onClose={close} wide>
		<div class="pe">
			<!-- 文件清单 -->
			<aside class="pe-list" aria-label="可编辑文件">
				<p class="pe-list__hint">
					改动会直接提交到 GitHub <code>main</code> 分支，Vercel 随后自动部署。
				</p>
				<ul class="pe-list__ul">
					{#each files as file (file.path)}
						<li>
							<button
								type="button"
								class="pe-file"
								class:is-active={file.path === activePath}
								onclick={() => selectFile(file.path)}
							>
								<span class="pe-file__label">
									{file.label}
									{#if touched[file.path]}
										<span class="pe-file__dot" title="本会话已修改"></span>
									{/if}
								</span>
								<code class="pe-file__path">{file.path}</code>
								{#if file.hint}
									<span class="pe-file__hint">{file.hint}</span>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			</aside>

			<!-- 编辑区 -->
			<section class="pe-edit">
				{#if loading}
					<p class="pe-msg">正在读取文件…</p>
				{:else if !activeFile}
					<p class="pe-msg">从左侧选一个文件开始编辑。</p>
				{:else}
					<div class="pe-edit__bar">
						<code class="pe-edit__path">{activeFile.path}</code>
						<span class="pe-edit__meta">
							{#if isSource}
								<span class="pe-tag pe-tag--warn">源码</span>
							{:else}
								<span class="pe-tag">内容</span>
							{/if}
							{#if dirty}
								<span class="pe-tag pe-tag--dirty">未保存</span>
							{/if}
						</span>
					</div>

					{#if isSource}
						<label class="pe-warn">
							<input type="checkbox" bind:checked={ack} />
							<span>
								<b>这是源码文件。</b>改错了会导致构建失败、整站部署不出来。
								保存前会自动检查括号配对，但仍建议改完去 GitHub 上看一眼 diff。
							</span>
						</label>
					{/if}

					{#if error}
						<p class="pe-msg pe-msg--error">{error}</p>
					{/if}
					{#if saved}
						<p class="pe-msg pe-msg--ok">
							已提交到 GitHub。等 Vercel 部署完（通常 1-2 分钟）刷新页面即可看到改动。
						</p>
					{/if}

					<textarea
						class="pe-textarea"
						value={content}
						oninput={(e) => onInput(e.currentTarget.value)}
						spellcheck="false"
						autocapitalize="off"
						autocomplete="off"
						aria-label={`编辑 ${activeFile.path}`}
					></textarea>

					<div class="pe-actions">
						<button
							type="button"
							class="btn-text"
							disabled={!dirty}
							onclick={() => {
								onInput(original);
								if (activePath) markDirty(activePath, false);
							}}
						>
							还原
						</button>
						<button
							type="button"
							class="btn-text"
							onclick={() => {
								activePath = "";
								content = "";
								original = "";
							}}
						>
							关闭
						</button>
						<button
							type="button"
							class="btn-primary"
							disabled={!canSave}
							onclick={save}
						>
							{saving ? "提交中…" : "保存并部署"}
						</button>
					</div>
				{/if}
			</section>
		</div>
	</Modal>
{/if}

<style>
	/* ------------------------------------------------------------------
	   触发按钮：放在页面头部右上角，跟标题同区
	   ------------------------------------------------------------------ */
	.pe-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.8rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
		background: color-mix(in srgb, var(--primary) 10%, transparent);
		color: var(--primary);
		font-size: 0.76rem;
		font-weight: 700;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background 200ms ease,
			transform 200ms ease;
	}
	.pe-trigger:hover {
		background: color-mix(in srgb, var(--primary) 20%, transparent);
		transform: translateY(-1px);
	}
	.pe-trigger__avatar {
		width: 1.05rem;
		height: 1.05rem;
		border-radius: 999px;
		object-fit: cover;
	}

	/* ------------------------------------------------------------------
	   弹窗内部：左文件清单 + 右编辑区
	   ------------------------------------------------------------------ */
	.pe {
		display: grid;
		grid-template-columns: minmax(0, 15rem) minmax(0, 1fr);
		gap: 1rem;
		align-items: start;
	}
	@media (max-width: 767px) {
		.pe {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.pe-list {
		min-width: 0;
	}
	.pe-list__hint {
		margin: 0 0 0.6rem;
		font-size: 0.68rem;
		line-height: 1.6;
		color: color-mix(in srgb, var(--text-color) 60%, transparent);
	}
	.pe-list__hint code {
		font-size: 0.66rem;
		padding: 0 0.2em;
		border-radius: 4px;
		background: rgba(127, 127, 127, 0.14);
	}
	.pe-list__ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		max-height: min(22rem, 46vh);
		overflow-y: auto;
	}

	.pe-file {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		width: 100%;
		padding: 0.45rem 0.6rem;
		border-radius: 10px;
		border: 1px solid transparent;
		background: transparent;
		text-align: left;
		cursor: pointer;
		transition:
			background 160ms ease,
			border-color 160ms ease;
	}
	.pe-file:hover {
		background: rgba(127, 127, 127, 0.1);
	}
	.pe-file.is-active {
		border-color: color-mix(in srgb, var(--primary) 40%, transparent);
		background: color-mix(in srgb, var(--primary) 10%, transparent);
	}
	.pe-file__label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		font-weight: 700;
	}
	.pe-file__dot {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 999px;
		background: var(--primary);
	}
	.pe-file__path {
		font-size: 0.63rem;
		opacity: 0.6;
		word-break: break-all;
	}
	.pe-file__hint {
		font-size: 0.68rem;
		line-height: 1.5;
		opacity: 0.7;
	}

	.pe-edit {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		min-width: 0;
	}
	.pe-edit__bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.pe-edit__path {
		font-size: 0.72rem;
		word-break: break-all;
		opacity: 0.75;
	}
	.pe-edit__meta {
		display: inline-flex;
		gap: 0.3rem;
	}
	.pe-tag {
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		font-size: 0.62rem;
		font-weight: 700;
		background: rgba(127, 127, 127, 0.16);
	}
	.pe-tag--warn {
		background: rgba(217, 119, 6, 0.18);
		color: #b45309;
	}
	.pe-tag--dirty {
		background: color-mix(in srgb, var(--primary) 18%, transparent);
		color: var(--primary);
	}

	.pe-warn {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.55rem 0.65rem;
		border-radius: 10px;
		border: 1px solid rgba(217, 119, 6, 0.35);
		background: rgba(217, 119, 6, 0.09);
		font-size: 0.7rem;
		line-height: 1.65;
		cursor: pointer;
	}
	.pe-warn input {
		margin-top: 0.2rem;
		flex: none;
	}
	html.dark .pe-warn {
		color: #e5e7eb;
	}

	.pe-msg {
		margin: 0;
		padding: 0.5rem 0.65rem;
		border-radius: 10px;
		font-size: 0.72rem;
		line-height: 1.6;
		background: rgba(127, 127, 127, 0.12);
	}
	.pe-msg--error {
		background: rgba(220, 38, 38, 0.12);
		color: #b91c1c;
	}
	.pe-msg--ok {
		background: rgba(31, 157, 107, 0.14);
		color: #15803d;
	}
	html.dark .pe-msg--error {
		color: #fca5a5;
	}
	html.dark .pe-msg--ok {
		color: #6ee7b7;
	}

	/* 高度跟着弹窗走：Modal 卡片有 max-height，正文区才是滚动容器，
	   所以这里用 min()/vh 收敛，别再写死 26rem 把卡片顶出一屏。 */
	.pe-textarea {
		width: 100%;
		min-height: min(26rem, 46vh);
		padding: 0.7rem 0.8rem;
		border-radius: 12px;
		border: 1px solid rgba(127, 127, 127, 0.3);
		background: rgba(127, 127, 127, 0.06);
		color: inherit;
		font-family: "JetBrains Mono Variable", ui-monospace, monospace;
		font-size: 0.76rem;
		line-height: 1.75;
		resize: vertical;
		outline: none;
	}
	.pe-textarea:focus {
		border-color: color-mix(in srgb, var(--primary) 55%, transparent);
	}

	.pe-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.pe-actions :global(.btn-text),
	.pe-actions :global(.btn-primary) {
		padding: 0.4rem 0.9rem;
		border-radius: 999px;
		font-size: 0.76rem;
		font-weight: 700;
		cursor: pointer;
		border: 1px solid transparent;
		transition: opacity 160ms ease;
	}
	.pe-actions :global(.btn-text) {
		background: rgba(127, 127, 127, 0.14);
		color: inherit;
	}
	.pe-actions :global(.btn-primary) {
		background: var(--primary);
		color: #fff;
	}
	.pe-actions :global(button:disabled) {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
