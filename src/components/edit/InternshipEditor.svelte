<script lang="ts">
/**
 * 实习经历页 · 所见即所得编辑器
 * ---------------------------------------------------------------------------
 * 设计目标（用户明确要求）：**直接改文字、随便增删、不出现任何代码**。
 * 所以这里没有「文件清单 + 源码 textarea」，而是：
 *   - 每个字段是一个输入框 / 文本域
 *   - 每个数组是一张可增删的卡片（阶段、指标、技能、收获、高光…）
 *   - 长文正文用「块编辑器」：所见即所得，所见即 markdown 渲染后的样子
 *     （工具栏是「加粗 / 小标题 / 列表 / 引用 / 代码」按钮，不是 markdown 符号）
 *   - 保存时把结构化数据 POST 到 /api/internship/save/，服务端写回
 *     src/data/internship.data.json，Vercel 自动重新部署
 *
 * 登录态：未登录时整个组件不渲染，页面上不会出现按钮。
 */
import { onMount } from "svelte";
import Modal from "@/components/manage/Modal.svelte";
import { apiGet, apiPost } from "@/components/manage/manage-utils";
import {
	type Block,
	emptyBlock,
	inlineToText,
	parseInline,
	parseMarkdown,
	serializeBlocks,
} from "./md-blocks";

interface Props {
	/** 页面当前渲染用的数据（来自 JSON，作为编辑起点） */
	initial: InternshipShape;
}

interface InternshipShape {
	profile: {
		title: string;
		tagline: string;
		name: string;
		role: string;
		team: string;
		period: string;
		status: string;
		intro: string;
		avatar: string;
		metrics: Array<{
			label: string;
			value: string;
			hint?: string;
			icon: string;
		}>;
		links: Array<{
			label: string;
			href: string;
			icon: string;
			external?: boolean;
		}>;
	};
	phases: Array<{
		id: string;
		order: number;
		period: string;
		title: string;
		summary: string;
		did: string[];
		learned: string[];
		stack: string[];
		body: string;
	}>;
	skills: Array<{ name: string; level: number; note?: string }>;
	stackGroups: Array<{ title: string; items: string[] }>;
	takeaways: Array<{ icon: string; title: string; points: string[] }>;
	highlights: Array<{
		title: string;
		problem: string;
		solution: string;
		result: string;
		tags: string[];
	}>;
	retro: { summary: string; next: string[] };
	meta: { title: string; description: string };
}

let { initial }: Props = $props();

// ---- 登录态 ----
let authed = $state(false);
let user = $state<{ login: string; avatar_url: string } | null>(null);

async function checkAuth() {
	try {
		const data = await apiGet<{
			authenticated?: boolean;
			user?: { login: string; avatar_url: string };
		}>("/api/auth/status/");
		authed = data.authenticated === true;
		user = data.user ?? null;
	} catch {
		authed = false;
	}
}

onMount(() => {
	void checkAuth();
});

// ---- 编辑状态 ----
let open = $state(false);
let draft = $state<InternshipShape | null>(null);
let saving = $state(false);
let error = $state("");
let okMsg = $state(false);

/** 当前展开的分区 */
let tab = $state<
	"profile" | "phases" | "skills" | "takeaways" | "highlights" | "retro"
>("profile");

/** 每个阶段正文的块结构，按阶段 id 存（避免每次输入都重新 parse） */
let phaseBlocks = $state<Record<string, Block[]>>({});

/** 正在编辑正文的阶段 id */
let bodyPhase = $state("");

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

const dirty = $state({ value: false });
function markDirty() {
	dirty.value = true;
	okMsg = false;
}

async function openModal() {
	draft = clone(initial);
	// 预解析所有阶段正文，切到该阶段时直接用
	const map: Record<string, Block[]> = {};
	for (const phase of draft.phases) {
		map[phase.id] = parseMarkdown(phase.body ?? "");
	}
	phaseBlocks = map;
	bodyPhase = "";
	error = "";
	okMsg = false;
	dirty.value = false;
	open = true;
}

function close() {
	if (dirty.value) {
		const sure = window.confirm("还有没保存的改动，确定关掉吗？");
		if (!sure) return;
	}
	open = false;
	draft = null;
	phaseBlocks = {};
}

// ============================ 通用字段操作 ============================

function setProfile<K extends keyof InternshipShape["profile"]>(
	key: K,
	value: InternshipShape["profile"][K],
) {
	if (!draft) return;
	(draft.profile as Record<string, unknown>)[key as string] = value;
	markDirty();
}

// ============================ 阶段增删 ============================

function addPhase() {
	if (!draft) return;
	const n = draft.phases.length + 1;
	const id = `phase-${Date.now().toString(36)}`;
	draft.phases.push({
		id,
		order: n,
		period: "",
		title: "新阶段",
		summary: "",
		did: [],
		learned: [],
		stack: [],
		body: "",
	});
	phaseBlocks[id] = [emptyBlock("paragraph")];
	tab = "phases";
	bodyPhase = id;
	markDirty();
}

function removePhase(index: number) {
	if (!draft) return;
	const phase = draft.phases[index];
	if (!phase) return;
	const sure = window.confirm(
		`确定删掉阶段「${phase.title || "未命名"}」吗？\n它的时间线卡片、要点和正文都会一起消失，保存后生效。`,
	);
	if (!sure) return;
	phaseBlocks[phase.id] = [];
	draft.phases.splice(index, 1);
	draft.phases.forEach((p, i) => {
		p.order = i + 1;
	});
	markDirty();
}

function movePhase(index: number, dir: -1 | 1) {
	if (!draft) return;
	const to = index + dir;
	if (to < 0 || to >= draft.phases.length) return;
	const [item] = draft.phases.splice(index, 1);
	draft.phases.splice(to, 0, item);
	draft.phases.forEach((p, i) => {
		p.order = i + 1;
	});
	markDirty();
}

// ============================ 正文块编辑 ============================

function ensureBlocks(phaseId: string): Block[] {
	if (!phaseBlocks[phaseId]) {
		phaseBlocks[phaseId] = [emptyBlock("paragraph")];
	}
	return phaseBlocks[phaseId];
}

function toggleBody(phaseId: string) {
	if (bodyPhase === phaseId) {
		// 收起前把块写回 markdown
		syncBody(phaseId);
		bodyPhase = "";
		return;
	}
	if (bodyPhase) syncBody(bodyPhase);
	bodyPhase = phaseId;
	if (!phaseBlocks[phaseId]) {
		const phase = draft?.phases.find((p) => p.id === phaseId);
		phaseBlocks[phaseId] = phase
			? parseMarkdown(phase.body ?? "")
			: [emptyBlock("paragraph")];
	}
}

function syncBody(phaseId: string) {
	if (!draft) return;
	const phase = draft.phases.find((p) => p.id === phaseId);
	const blocks = phaseBlocks[phaseId];
	if (!phase || !blocks) return;
	phase.body = serializeBlocks(blocks);
	markDirty();
}

function updateBlock(phaseId: string, blockId: string, value: string) {
	const blocks = ensureBlocks(phaseId);
	const block = blocks.find((b) => b.id === blockId);
	if (!block) return;
	if (block.kind === "code") block.code = value;
	else if (block.kind === "bullets" || block.kind === "numbers") {
		// 列表类：一次编辑整块，按行拆
		const lines = value.split("\n");
		block.items = lines
			.map((l) => l.replace(/^([-*]|\d+[.)])\s+/, "").trim())
			.filter(Boolean);
	} else if (block.kind === "paragraph") block.html = value;
	else block.inline = parseInline(value);
	syncBody(phaseId);
}

function addBlock(phaseId: string, kind: Block["kind"], afterId?: string) {
	const blocks = ensureBlocks(phaseId);
	const next = emptyBlock(kind);
	const idx = afterId ? blocks.findIndex((b) => b.id === afterId) : -1;
	if (idx >= 0) blocks.splice(idx + 1, 0, next);
	else blocks.push(next);
	syncBody(phaseId);
}

function removeBlock(phaseId: string, blockId: string) {
	const blocks = ensureBlocks(phaseId);
	const idx = blocks.findIndex((b) => b.id === blockId);
	if (idx >= 0) blocks.splice(idx, 1);
	syncBody(phaseId);
}

function moveBlock(phaseId: string, blockId: string, dir: -1 | 1) {
	const blocks = ensureBlocks(phaseId);
	const idx = blocks.findIndex((b) => b.id === blockId);
	const to = idx + dir;
	if (idx < 0 || to < 0 || to >= blocks.length) return;
	const [item] = blocks.splice(idx, 1);
	blocks.splice(to, 0, item);
	syncBody(phaseId);
}

/** 取出某一段的纯文本（跨类型通用） */
function blockText(block: Block): string {
	if (block.kind === "code") return block.code;
	if (block.kind === "bullets" || block.kind === "numbers") {
		return block.items.join("\n");
	}
	if (block.kind === "paragraph") return block.html;
	return inlineToText(block.inline);
}

function toggleBold(phaseId: string, blockId: string) {
	const blocks = ensureBlocks(phaseId);
	const block = blocks.find((b) => b.id === blockId);
	if (!block) return;
	if (block.kind === "paragraph") {
		block.html = block.html.includes("**")
			? block.html.replace(/\*\*/g, "")
			: `**${block.html}**`;
	} else if (block.kind === "heading" || block.kind === "quote") {
		const text = inlineToText(block.inline);
		block.inline = parseInline(
			text.includes("**") ? text.replace(/\*\*/g, "") : `**${text}**`,
		);
	}
	syncBody(phaseId);
}

/**
 * 转换段落类型。
 * 一律按 blockId 定位（不靠 each 的索引）—— 索引在列表被增删后会错位，
 * 而按 id 找永远指向正确的那一段。
 */
function changeBlockType(
	phaseId: string,
	blockId: string,
	kind: "paragraph" | "heading" | "bullets" | "numbers" | "quote" | "code",
) {
	const blocks = ensureBlocks(phaseId);
	const index = blocks.findIndex((b) => b.id === blockId);
	if (index < 0) return;
	const block = blocks[index];
	if (block.kind === kind) return;

	// 同为行内型（heading/quote）之间切换时保留原 inline，其余从纯文本重建
	if (
		(block.kind === "heading" || block.kind === "quote") &&
		(kind === "heading" || kind === "quote")
	) {
		blocks[index] = { kind, id: block.id, inline: block.inline } as Block;
		syncBody(phaseId);
		return;
	}

	const text = blockText(block);
	switch (kind) {
		case "paragraph":
			blocks[index] = { kind: "paragraph", id: block.id, html: text };
			break;
		case "heading":
			blocks[index] = {
				kind: "heading",
				id: block.id,
				level: 2,
				inline: parseInline(text),
			};
			break;
		case "bullets":
		case "numbers":
			blocks[index] = {
				kind,
				id: block.id,
				items: text
					.split(/\n+/)
					.map((t) => t.trim())
					.filter(Boolean),
			};
			break;
		case "quote":
			blocks[index] = {
				kind: "quote",
				id: block.id,
				inline: parseInline(text),
			};
			break;
		case "code":
			blocks[index] = { kind: "code", id: block.id, code: text };
			break;
	}
	syncBody(phaseId);
}
function toggleCodeInline(phaseId: string, blockId: string) {
	const blocks = ensureBlocks(phaseId);
	const block = blocks.find((b) => b.id === blockId);
	if (!block) return;
	if (block.kind === "paragraph") {
		block.html = block.html.includes("`")
			? block.html.replace(/`/g, "")
			: `\`${block.html}\``;
	} else if (block.kind === "heading" || block.kind === "quote") {
		const text = inlineToText(block.inline);
		block.inline = parseInline(
			text.includes("`") ? text.replace(/`/g, "") : `\`${text}\``,
		);
	}
	syncBody(phaseId);
}
// ============================ 保存 ============================

async function save() {
	if (!draft) return;
	if (bodyPhase) syncBody(bodyPhase);

	const sure = window.confirm(
		"保存后这份实习经历的内容会更新到 GitHub，Vercel 大概一两分钟后自动部署。\n确定保存吗？",
	);
	if (!sure) return;

	saving = true;
	error = "";
	try {
		await apiPost("/api/internship/save/", { data: draft });
		dirty.value = false;
		okMsg = true;
	} catch (e) {
		error = e instanceof Error ? e.message : "保存失败";
	} finally {
		saving = false;
	}
}

const canSave = $derived(!!draft && (dirty.value || okMsg) && !saving);
</script>

{#if authed}
	<button
		type="button"
		class="pe-trigger"
		onclick={openModal}
		title={`以 ${user?.login ?? "GitHub"} 身份编辑这页内容`}
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
		<span>编辑此页</span>
		{#if user?.avatar_url}
			<img class="pe-trigger__avatar" src={user.avatar_url} alt="" />
		{/if}
	</button>
{/if}

{#if open && draft}
	<Modal title="编辑实习经历" onClose={close} wide>
		<div class="pe">
			<!-- 分区导航 -->
			<nav class="pe-tabs" aria-label="编辑分区">
				<button class:is-on={tab === "profile"} onclick={() => (tab = "profile")}>
					页头
				</button>
				<button class:is-on={tab === "phases"} onclick={() => (tab = "phases")}>
					阶段时间线
					<span class="pe-tabs__num">{draft.phases.length}</span>
				</button>
				<button class:is-on={tab === "skills"} onclick={() => (tab = "skills")}>
					技能成长
				</button>
				<button class:is-on={tab === "takeaways"} onclick={() => (tab = "takeaways")}>
					收获
				</button>
				<button class:is-on={tab === "highlights"} onclick={() => (tab = "highlights")}>
					高光时刻
				</button>
				<button class:is-on={tab === "retro"} onclick={() => (tab = "retro")}>
					复盘
				</button>
			</nav>

			<div class="pe-body">
				{#if error}
					<p class="pe-alert pe-alert--err">{error}</p>
				{/if}
				{#if okMsg}
					<p class="pe-alert pe-alert--ok">
						已保存到 GitHub。等 Vercel 部署完（通常 1-2 分钟）刷新页面就能看到改动。
					</p>
				{/if}

				<!-- ============ 页头 ============ -->
				{#if tab === "profile"}
					<div class="pe-sec">
						<h4 class="pe-sec__title">基本信息</h4>
						<label class="pe-field">
							<span>页面大标题</span>
							<input
								value={draft.profile.title}
								oninput={(e) => setProfile("title", e.currentTarget.value)}
							/>
						</label>
						<label class="pe-field">
							<span>副标题</span>
							<input
								value={draft.profile.tagline}
								oninput={(e) => setProfile("tagline", e.currentTarget.value)}
							/>
						</label>
						<div class="pe-grid2">
							<label class="pe-field">
								<span>姓名 / 昵称</span>
								<input
									value={draft.profile.name}
									oninput={(e) => setProfile("name", e.currentTarget.value)}
								/>
							</label>
							<label class="pe-field">
								<span>职位</span>
								<input
									value={draft.profile.role}
									oninput={(e) => setProfile("role", e.currentTarget.value)}
								/>
							</label>
							<label class="pe-field">
								<span>团队 / 业务线</span>
								<input
									value={draft.profile.team}
									oninput={(e) => setProfile("team", e.currentTarget.value)}
								/>
							</label>
							<label class="pe-field">
								<span>起止时间</span>
								<input
									value={draft.profile.period}
									oninput={(e) => setProfile("period", e.currentTarget.value)}
								/>
							</label>
							<label class="pe-field">
								<span>状态</span>
								<input
									value={draft.profile.status}
									oninput={(e) => setProfile("status", e.currentTarget.value)}
								/>
							</label>
							<label class="pe-field">
								<span>头像路径（留空不显示）</span>
								<input
									value={draft.profile.avatar}
									placeholder="例如 /images/jojo.webp"
									oninput={(e) => setProfile("avatar", e.currentTarget.value)}
								/>
							</label>
						</div>
						<label class="pe-field">
							<span>自我介绍</span>
							<textarea
								rows="3"
								value={draft.profile.intro}
								oninput={(e) => setProfile("intro", e.currentTarget.value)}
							></textarea>
						</label>
					</div>

					<div class="pe-sec">
						<div class="pe-sec__bar">
							<h4 class="pe-sec__title">关键指标</h4>
							<button
								class="pe-mini"
								onclick={() => {
									draft?.profile.metrics.push({
										label: "新指标",
										value: "",
										hint: "",
										icon: "star-rounded",
									});
									markDirty();
								}}
							>
								+ 加一个
							</button>
						</div>
						{#each draft.profile.metrics as metric, i (i)}
							<div class="pe-card">
								<div class="pe-card__bar">
									<span class="pe-card__title">指标 {i + 1}</span>
									<div class="pe-card__ops">
										<button
											class="pe-icon"
											title="上移"
											disabled={i === 0}
											onclick={() => {
												if (!draft) return;
												const arr = draft.profile.metrics;
												const [it] = arr.splice(i, 1);
												arr.splice(i - 1, 0, it);
												markDirty();
											}}
										>
											↑
										</button>
										<button
											class="pe-icon"
											title="下移"
											disabled={i === draft.profile.metrics.length - 1}
											onclick={() => {
												if (!draft) return;
												const arr = draft.profile.metrics;
												const [it] = arr.splice(i, 1);
												arr.splice(i + 1, 0, it);
												markDirty();
											}}
										>
											↓
										</button>
										<button
											class="pe-icon pe-icon--danger"
											title="删除"
											onclick={() => {
												if (!draft) return;
												if (!confirm(`删掉指标「${metric.label}」？`)) return;
												draft.profile.metrics.splice(i, 1);
												markDirty();
											}}
										>
											✕
										</button>
									</div>
								</div>
								<div class="pe-grid2">
									<label class="pe-field">
										<span>名称</span>
										<input
											value={metric.label}
											oninput={(e) => {
												if (!draft) return;
												metric.label = e.currentTarget.value;
												markDirty();
											}}
										/>
									</label>
									<label class="pe-field">
										<span>数值</span>
										<input
											value={metric.value}
											oninput={(e) => {
												metric.value = e.currentTarget.value;
												markDirty();
											}}
										/>
									</label>
								</div>
								<label class="pe-field">
									<span>补充说明（可留空）</span>
									<input
										value={metric.hint ?? ""}
										oninput={(e) => {
											metric.hint = e.currentTarget.value;
											markDirty();
										}}
									/>
								</label>
							</div>
						{/each}
					</div>
				{/if}

				<!-- ============ 阶段时间线 ============ -->
				{#if tab === "phases"}
					<div class="pe-sec">
						<div class="pe-sec__bar">
							<h4 class="pe-sec__title">阶段卡片</h4>
							<button class="pe-mini pe-mini--primary" onclick={addPhase}>
								+ 加一个阶段
							</button>
						</div>

						{#each draft.phases as phase, i (phase.id)}
							<div class="pe-card pe-card--phase">
								<div class="pe-card__bar">
									<span class="pe-card__title">阶段 {i + 1}</span>
									<div class="pe-card__ops">
										<button class="pe-icon" title="上移" disabled={i === 0} onclick={() => movePhase(i, -1)}>↑</button>
										<button
											class="pe-icon"
											title="下移"
											disabled={i === draft.phases.length - 1}
											onclick={() => movePhase(i, 1)}
										>
											↓
										</button>
										<button class="pe-icon pe-icon--danger" title="删除" onclick={() => removePhase(i)}>✕</button>
									</div>
								</div>

								<div class="pe-grid2">
									<label class="pe-field">
										<span>阶段名称</span>
										<input
											value={phase.title}
											oninput={(e) => {
												phase.title = e.currentTarget.value;
												markDirty();
											}}
										/>
									</label>
									<label class="pe-field">
										<span>时间段</span>
										<input
											value={phase.period}
											placeholder="例如 2026.10 – 至今"
											oninput={(e) => {
												phase.period = e.currentTarget.value;
												markDirty();
											}}
										/>
									</label>
								</div>

								<label class="pe-field">
									<span>一句话概括</span>
									<textarea
										rows="2"
										value={phase.summary}
										oninput={(e) => {
											phase.summary = e.currentTarget.value;
											markDirty();
										}}
									></textarea>
								</label>

								<!-- 「做了什么」 -->
								<div class="pe-list">
									<div class="pe-list__bar">
										<span>做了什么</span>
										<button
											class="pe-mini"
											onclick={() => {
												phase.did.push("新的一条");
												markDirty();
											}}
										>
											+ 一条
										</button>
									</div>
									{#each phase.did as row, ri (ri)}
										<div class="pe-row">
											<input
												value={row}
												oninput={(e) => {
													phase.did[ri] = e.currentTarget.value;
													markDirty();
												}}
											/>
											<button
												class="pe-icon pe-icon--danger"
												title="删除这条"
												onclick={() => {
													phase.did.splice(ri, 1);
													markDirty();
												}}
											>
												✕
											</button>
										</div>
									{/each}
								</div>

								<!-- 「学到了什么」 -->
								<div class="pe-list">
									<div class="pe-list__bar">
										<span>学到了什么</span>
										<button
											class="pe-mini"
											onclick={() => {
												phase.learned.push("新的一条");
												markDirty();
											}}
										>
											+ 一条
										</button>
									</div>
									{#each phase.learned as row, ri (ri)}
										<div class="pe-row">
											<input
												value={row}
												oninput={(e) => {
													phase.learned[ri] = e.currentTarget.value;
													markDirty();
												}}
											/>
											<button
												class="pe-icon pe-icon--danger"
												title="删除这条"
												onclick={() => {
													phase.learned.splice(ri, 1);
													markDirty();
												}}
											>
												✕
											</button>
										</div>
									{/each}
								</div>

								<!-- 技术标签 -->
								<div class="pe-field">
									<span>技术标签（用逗号隔开）</span>
									<input
										value={phase.stack.join("、")}
										oninput={(e) => {
											phase.stack = e.currentTarget.value
												.split(/[,，、]/)
												.map((s) => s.trim())
												.filter(Boolean);
											markDirty();
										}}
									/>
								</div>

								<!-- 正文：所见即所得块编辑器 -->
								<div class="pe-body-edit">
									<button class="pe-toggle" onclick={() => toggleBody(phase.id)}>
										{bodyPhase === phase.id ? "收起正文" : "编辑正文（长文）"}
									</button>

									{#if bodyPhase === phase.id}
										<div class="pe-blocks">
											<div class="pe-blocks__tip">
												直接像平时打字一样改就行。左边几个小按钮是排版用的（加粗、小标题、列表、引用、代码），
												底下看到的就是页面最终显示的样子。
											</div>

											{#each phaseBlocks[phase.id] ?? [] as block, bi (block.id)}
												<div class="pe-block">
													<div class="pe-block__tools">
														{#if block.kind === "paragraph" || block.kind === "heading" || block.kind === "quote"}
															<button title="加粗" onclick={() => toggleBold(phase.id, block.id)}><b>B</b></button>
															<button title="行内代码" onclick={() => toggleCodeInline(phase.id, block.id)}><code>&lt;&gt;</code></button>
														{/if}
														{#if block.kind !== "code"}
															<button title="变成小标题" onclick={() => changeBlockType(phase.id, block.id, "heading")}>H</button>
															<button title="变成正文" onclick={() => changeBlockType(phase.id, block.id, "paragraph")}>¶</button>
															<button title="变成列表" onclick={() => changeBlockType(phase.id, block.id, "bullets")}>•</button>
															<button title="变成编号列表" onclick={() => changeBlockType(phase.id, block.id, "numbers")}>1.</button>
															<button title="变成引用" onclick={() => changeBlockType(phase.id, block.id, "quote")}>&ldquo;</button>
															<button title="变成代码块" onclick={() => changeBlockType(phase.id, block.id, "code")}>{'{}'}</button>
														{/if}
														<button title="上移" disabled={bi === 0} onclick={() => moveBlock(phase.id, block.id, -1)}>↑</button>
														<button title="下移" disabled={bi === (phaseBlocks[phase.id]?.length ?? 0) - 1} onclick={() => moveBlock(phase.id, block.id, 1)}>↓</button>
														<button title="删除这段" class="pe-icon--danger" onclick={() => removeBlock(phase.id, block.id)}>✕</button>
													</div>

													<textarea
														class="pe-block__input"
														rows={block.kind === "code" ? 4 : block.kind === "bullets" || block.kind === "numbers" ? Math.max(2, block.items.length) : 2}
														value={block.kind === "code" ? block.code : block.kind === "bullets" || block.kind === "numbers" ? block.items.join("\n") : block.kind === "paragraph" ? block.html : inlineToText(block.inline)}
														oninput={(e) => updateBlock(phase.id, block.id, e.currentTarget.value)}
														placeholder={block.kind === "bullets" || block.kind === "numbers" ? "一行一条" : "直接写文字"}
													></textarea>
												</div>
											{/each}

											<div class="pe-blocks__add">
												<span>加一段：</span>
												<button class="pe-mini" onclick={() => addBlock(phase.id, "paragraph")}>正文</button>
												<button class="pe-mini" onclick={() => addBlock(phase.id, "heading")}>小标题</button>
												<button class="pe-mini" onclick={() => addBlock(phase.id, "bullets")}>列表</button>
												<button class="pe-mini" onclick={() => addBlock(phase.id, "quote")}>引用</button>
												<button class="pe-mini" onclick={() => addBlock(phase.id, "code")}>代码</button>
											</div>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- ============ 技能成长 ============ -->
				{#if tab === "skills"}
					<div class="pe-sec">
						<div class="pe-sec__bar">
							<h4 class="pe-sec__title">上手程度</h4>
							<button
								class="pe-mini pe-mini--primary"
								onclick={() => {
									draft?.skills.push({ name: "新技能", level: 60 });
									markDirty();
								}}
							>
								+ 加一项
							</button>
						</div>
						{#each draft.skills as skill, i (i)}
							<div class="pe-card">
								<div class="pe-card__bar">
									<span class="pe-card__title">技能 {i + 1}</span>
									<div class="pe-card__ops">
										<button class="pe-icon" title="上移" disabled={i === 0} onclick={() => { if (!draft) return; const a = draft.skills; const [it] = a.splice(i, 1); a.splice(i - 1, 0, it); markDirty(); }}>↑</button>
										<button class="pe-icon" title="下移" disabled={i === draft.skills.length - 1} onclick={() => { if (!draft) return; const a = draft.skills; const [it] = a.splice(i, 1); a.splice(i + 1, 0, it); markDirty(); }}>↓</button>
										<button class="pe-icon pe-icon--danger" title="删除" onclick={() => { if (!draft) return; if (!confirm(`删掉技能「${skill.name}」？`)) return; draft.skills.splice(i, 1); markDirty(); }}>✕</button>
									</div>
								</div>
								<label class="pe-field">
									<span>技能名</span>
									<input value={skill.name} oninput={(e) => { skill.name = e.currentTarget.value; markDirty(); }} />
								</label>
								<label class="pe-field">
									<span>熟练度：{skill.level}%</span>
									<input
										type="range"
										min="0"
										max="100"
										step="1"
										value={skill.level}
										oninput={(e) => { skill.level = Number(e.currentTarget.value); markDirty(); }}
									/>
								</label>
								<label class="pe-field">
									<span>备注（可留空）</span>
									<input value={skill.note ?? ""} oninput={(e) => { skill.note = e.currentTarget.value; markDirty(); }} />
								</label>
							</div>
						{/each}
					</div>

					<div class="pe-sec">
						<div class="pe-sec__bar">
							<h4 class="pe-sec__title">技术标签分组</h4>
							<button
								class="pe-mini pe-mini--primary"
								onclick={() => {
									draft?.stackGroups.push({ title: "新分组", items: [] });
									markDirty();
								}}
							>
								+ 加一个分组
							</button>
						</div>
						{#each draft.stackGroups as group, gi (gi)}
							<div class="pe-card">
								<div class="pe-card__bar">
									<span class="pe-card__title">分组 {gi + 1}</span>
									<button class="pe-icon pe-icon--danger" title="删除分组" onclick={() => { if (!draft) return; if (!confirm(`删掉分组「${group.title}」？`)) return; draft.stackGroups.splice(gi, 1); markDirty(); }}>✕</button>
								</div>
								<label class="pe-field">
									<span>分组名</span>
									<input value={group.title} oninput={(e) => { group.title = e.currentTarget.value; markDirty(); }} />
								</label>
								<label class="pe-field">
									<span>标签（用逗号隔开）</span>
									<input
										value={group.items.join("、")}
										oninput={(e) => {
											group.items = e.currentTarget.value.split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
											markDirty();
										}}
									/>
								</label>
							</div>
						{/each}
					</div>
				{/if}

				<!-- ============ 收获 ============ -->
				{#if tab === "takeaways"}
					<div class="pe-sec">
						<div class="pe-sec__bar">
							<h4 class="pe-sec__title">收获卡片</h4>
							<button
								class="pe-mini pe-mini--primary"
								onclick={() => {
									draft?.takeaways.push({ icon: "star-rounded", title: "新的一类", points: [] });
									markDirty();
								}}
							>
								+ 加一张
							</button>
						</div>
						{#each draft.takeaways as item, ti (ti)}
							<div class="pe-card">
								<div class="pe-card__bar">
									<span class="pe-card__title">卡片 {ti + 1}</span>
									<div class="pe-card__ops">
										<button class="pe-icon" title="上移" disabled={ti === 0} onclick={() => { if (!draft) return; const a = draft.takeaways; const [it] = a.splice(ti, 1); a.splice(ti - 1, 0, it); markDirty(); }}>↑</button>
										<button class="pe-icon" title="下移" disabled={ti === draft.takeaways.length - 1} onclick={() => { if (!draft) return; const a = draft.takeaways; const [it] = a.splice(ti, 1); a.splice(ti + 1, 0, it); markDirty(); }}>↓</button>
										<button class="pe-icon pe-icon--danger" title="删除" onclick={() => { if (!draft) return; if (!confirm(`删掉「${item.title}」这张卡片？`)) return; draft.takeaways.splice(ti, 1); markDirty(); }}>✕</button>
									</div>
								</div>
								<label class="pe-field">
									<span>标题</span>
									<input value={item.title} oninput={(e) => { item.title = e.currentTarget.value; markDirty(); }} />
								</label>
								<div class="pe-list">
									<div class="pe-list__bar">
										<span>要点</span>
										<button class="pe-mini" onclick={() => { item.points.push("新的要点"); markDirty(); }}>+ 一条</button>
									</div>
									{#each item.points as point, pi (pi)}
										<div class="pe-row">
											<input value={point} oninput={(e) => { item.points[pi] = e.currentTarget.value; markDirty(); }} />
											<button class="pe-icon pe-icon--danger" title="删除" onclick={() => { item.points.splice(pi, 1); markDirty(); }}>✕</button>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- ============ 高光时刻 ============ -->
				{#if tab === "highlights"}
					<div class="pe-sec">
						<div class="pe-sec__bar">
							<h4 class="pe-sec__title">高光案例</h4>
							<button
								class="pe-mini pe-mini--primary"
								onclick={() => {
									draft?.highlights.push({ title: "新的案例", problem: "", solution: "", result: "", tags: [] });
									markDirty();
								}}
							>
								+ 加一个案例
							</button>
						</div>
						{#each draft.highlights as item, hi (hi)}
							<div class="pe-card">
								<div class="pe-card__bar">
									<span class="pe-card__title">案例 {hi + 1}</span>
									<div class="pe-card__ops">
										<button class="pe-icon" title="上移" disabled={hi === 0} onclick={() => { if (!draft) return; const a = draft.highlights; const [it] = a.splice(hi, 1); a.splice(hi - 1, 0, it); markDirty(); }}>↑</button>
										<button class="pe-icon" title="下移" disabled={hi === draft.highlights.length - 1} onclick={() => { if (!draft) return; const a = draft.highlights; const [it] = a.splice(hi, 1); a.splice(hi + 1, 0, it); markDirty(); }}>↓</button>
										<button class="pe-icon pe-icon--danger" title="删除" onclick={() => { if (!draft) return; if (!confirm(`删掉「${item.title}」？`)) return; draft.highlights.splice(hi, 1); markDirty(); }}>✕</button>
									</div>
								</div>
								<label class="pe-field">
									<span>案例标题</span>
									<input value={item.title} oninput={(e) => { item.title = e.currentTarget.value; markDirty(); }} />
								</label>
								<label class="pe-field">
									<span>问题：现象是什么</span>
									<textarea rows="2" value={item.problem} oninput={(e) => { item.problem = e.currentTarget.value; markDirty(); }}></textarea>
								</label>
								<label class="pe-field">
									<span>方案：怎么定位、怎么改</span>
									<textarea rows="3" value={item.solution} oninput={(e) => { item.solution = e.currentTarget.value; markDirty(); }}></textarea>
								</label>
								<label class="pe-field">
									<span>结果：改完的变化</span>
									<textarea rows="2" value={item.result} oninput={(e) => { item.result = e.currentTarget.value; markDirty(); }}></textarea>
								</label>
								<label class="pe-field">
									<span>标签（用逗号隔开）</span>
									<input
										value={item.tags.join("、")}
										oninput={(e) => {
											item.tags = e.currentTarget.value.split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
											markDirty();
										}}
									/>
								</label>
							</div>
						{/each}
					</div>
				{/if}

				<!-- ============ 复盘 ============ -->
				{#if tab === "retro"}
					<div class="pe-sec">
						<h4 class="pe-sec__title">总结</h4>
						<label class="pe-field">
							<span>复盘正文</span>
							<textarea rows="5" value={draft.retro.summary} oninput={(e) => { if (!draft) return; draft.retro.summary = e.currentTarget.value; markDirty(); }}></textarea>
						</label>
						<div class="pe-list">
							<div class="pe-list__bar">
								<span>接下来想做的</span>
								<button class="pe-mini" onclick={() => { if (!draft) return; draft.retro.next.push("新的目标"); markDirty(); }}>+ 一条</button>
							</div>
							{#each draft.retro.next as goal, gi (gi)}
								<div class="pe-row">
									<input value={goal} oninput={(e) => { if (!draft) return; draft.retro.next[gi] = e.currentTarget.value; markDirty(); }} />
									<button class="pe-icon pe-icon--danger" title="删除" onclick={() => { if (!draft) return; draft.retro.next.splice(gi, 1); markDirty(); }}>✕</button>
								</div>
							{/each}
						</div>
					</div>

					<div class="pe-sec">
						<h4 class="pe-sec__title">页面 SEO（搜索结果里显示的那段字）</h4>
						<label class="pe-field">
							<span>页面标题</span>
							<input value={draft.meta.title} oninput={(e) => { if (!draft) return; draft.meta.title = e.currentTarget.value; markDirty(); }} />
						</label>
						<label class="pe-field">
							<span>页面描述</span>
							<textarea rows="3" value={draft.meta.description} oninput={(e) => { if (!draft) return; draft.meta.description = e.currentTarget.value; markDirty(); }}></textarea>
						</label>
					</div>
				{/if}
			</div>

			<div class="pe-tabs-hint">改动会直接写回仓库数据文件，Vercel 随后自动部署。</div>
		</div>

		<!-- 底部操作条：走 Modal 的 footer 插槽，才能钉在卡片底部不跟着正文滚 -->
		{#snippet footer()}
			<div class="pe-foot">
				<span class="pe-foot__hint">
					{dirty.value ? "有没保存的改动" : okMsg ? "已保存" : "还没改任何东西"}
				</span>
				<button class="pe-btn" onclick={close}>关掉</button>
				<button class="pe-btn pe-btn--primary" disabled={!canSave} onclick={save}>
					{saving ? "保存中…" : "保存并部署"}
				</button>
			</div>
		{/snippet}
	</Modal>
{/if}

<style>
	/* ---------------- 触发按钮 ---------------- */
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

	/* ---------------- 整体布局 ---------------- */
	.pe {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		min-width: 0;
	}

	.pe-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		padding-bottom: 0.7rem;
		border-bottom: 1px solid color-mix(in srgb, var(--text-color) 12%, transparent);
	}
	.pe-tabs button {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		border: 1px solid transparent;
		background: color-mix(in srgb, var(--text-color) 6%, transparent);
		font-size: 0.76rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--text-color) 72%, transparent);
		cursor: pointer;
		transition: background 160ms ease;
	}
	.pe-tabs button:hover {
		background: color-mix(in srgb, var(--text-color) 11%, transparent);
	}
	.pe-tabs button.is-on {
		background: color-mix(in srgb, var(--primary) 16%, transparent);
		color: var(--primary);
		border-color: color-mix(in srgb, var(--primary) 38%, transparent);
	}
	.pe-tabs__num {
		font-size: 0.64rem;
		padding: 0 0.3rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--text-color) 12%, transparent);
	}

	/* 正文区不再自己限高 / 自己滚：滚动统一交给 Modal 的 .mo-scroll，
	   底部操作条才能真正钉在卡片底部（以前内层 max-height 会先滚出视口）。 */
	.pe-body {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		min-height: 0;
	}

	.pe-tabs-hint {
		margin-top: 0.15rem;
		font-size: 0.68rem;
		line-height: 1.6;
		color: color-mix(in srgb, var(--text-color) 52%, transparent);
	}

	/* ---------------- 提示条 ---------------- */
	.pe-alert {
		margin: 0;
		padding: 0.55rem 0.7rem;
		border-radius: 10px;
		font-size: 0.75rem;
		line-height: 1.6;
	}
	.pe-alert--err {
		background: rgb(220 38 38 / 0.12);
		color: #b91c1c;
	}
	.pe-alert--ok {
		background: rgb(31 157 107 / 0.14);
		color: #15803d;
	}
	:global(html.dark) .pe-alert--err {
		color: #fca5a5;
	}
	:global(html.dark) .pe-alert--ok {
		color: #6ee7b7;
	}

	/* ---------------- 分区 ---------------- */
	.pe-sec {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.pe-sec__bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		flex-wrap: wrap;
	}
	.pe-sec__title {
		margin: 0;
		font-size: 0.88rem;
		font-weight: 800;
		color: var(--text-color);
	}

	/* ---------------- 字段 ---------------- */
	.pe-field {
		display: flex;
		flex-direction: column;
		gap: 0.28rem;
		min-width: 0;
	}
	.pe-field > span {
		font-size: 0.7rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--text-color) 62%, transparent);
	}
	.pe-field input:not([type]),
	.pe-field textarea,
	.pe-row input,
	.pe-block__input {
		width: 100%;
		padding: 0.45rem 0.6rem;
		border-radius: 9px;
		border: 1px solid color-mix(in srgb, var(--text-color) 18%, transparent);
		background: color-mix(in srgb, var(--text-color) 4%, transparent);
		color: var(--text-color);
		font-size: 0.8rem;
		line-height: 1.65;
		outline: none;
		transition: border-color 160ms ease;
	}
	.pe-field input:focus,
	.pe-field textarea:focus,
	.pe-row input:focus,
	.pe-block__input:focus {
		border-color: color-mix(in srgb, var(--primary) 55%, transparent);
	}
	.pe-field textarea {
		resize: vertical;
	}
	.pe-field input[type="range"] {
		width: 100%;
		accent-color: var(--primary);
	}

	.pe-grid2 {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.6rem;
	}
	@media (min-width: 640px) {
		.pe-grid2 {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	/* ---------------- 卡片 ---------------- */
	.pe-card {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		padding: 0.75rem 0.8rem;
		border-radius: 13px;
		border: 1px solid color-mix(in srgb, var(--text-color) 14%, transparent);
		background: color-mix(in srgb, var(--text-color) 3%, transparent);
	}
	.pe-card--phase {
		border-color: color-mix(in srgb, var(--primary) 30%, transparent);
		background: color-mix(in srgb, var(--primary) 4%, transparent);
	}
	.pe-card__bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.pe-card__title {
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		color: color-mix(in srgb, var(--text-color) 55%, transparent);
	}
	.pe-card__ops {
		display: flex;
		gap: 0.2rem;
	}

	/* ---------------- 按钮 ---------------- */
	.pe-icon {
		width: 1.6rem;
		height: 1.6rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 7px;
		border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
		background: transparent;
		font-size: 0.72rem;
		color: color-mix(in srgb, var(--text-color) 70%, transparent);
		cursor: pointer;
		transition: background 140ms ease;
	}
	.pe-icon:hover:not(:disabled) {
		background: color-mix(in srgb, var(--text-color) 10%, transparent);
	}
	.pe-icon:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.pe-icon--danger:hover:not(:disabled) {
		background: rgb(220 38 38 / 0.15);
		color: #dc2626;
	}

	.pe-mini {
		padding: 0.22rem 0.6rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--text-color) 18%, transparent);
		background: transparent;
		font-size: 0.7rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--text-color) 72%, transparent);
		cursor: pointer;
		transition: background 140ms ease;
	}
	.pe-mini:hover {
		background: color-mix(in srgb, var(--text-color) 9%, transparent);
	}
	.pe-mini--primary {
		border-color: color-mix(in srgb, var(--primary) 40%, transparent);
		background: color-mix(in srgb, var(--primary) 12%, transparent);
		color: var(--primary);
	}

	.pe-btn {
		padding: 0.45rem 1rem;
		border-radius: 999px;
		border: 1px solid transparent;
		background: color-mix(in srgb, var(--text-color) 9%, transparent);
		color: var(--text-color);
		font-size: 0.78rem;
		font-weight: 700;
		cursor: pointer;
	}
	.pe-btn--primary {
		background: var(--primary);
		color: #fff;
	}
	.pe-btn:disabled {
		opacity: 0.42;
		cursor: not-allowed;
	}

	/* ---------------- 行内列表 ---------------- */
	.pe-list {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.5rem 0.55rem;
		border-radius: 10px;
		background: color-mix(in srgb, var(--text-color) 4%, transparent);
	}
	.pe-list__bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.1rem;
	}
	.pe-list__bar > span {
		font-size: 0.72rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--primary) 85%, var(--text-color));
	}
	.pe-row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.pe-row input {
		flex: 1;
		min-width: 0;
	}

	/* ---------------- 正文块编辑器 ---------------- */
	.pe-body-edit {
		margin-top: 0.15rem;
	}
	.pe-toggle {
		padding: 0.35rem 0.8rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--primary) 35%, transparent);
		background: color-mix(in srgb, var(--primary) 10%, transparent);
		color: var(--primary);
		font-size: 0.73rem;
		font-weight: 700;
		cursor: pointer;
	}
	.pe-blocks {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.55rem;
		padding: 0.7rem 0.75rem;
		border-radius: 12px;
		border: 1px dashed color-mix(in srgb, var(--text-color) 22%, transparent);
		background: color-mix(in srgb, var(--text-color) 3%, transparent);
	}
	.pe-blocks__tip {
		font-size: 0.69rem;
		line-height: 1.65;
		color: color-mix(in srgb, var(--text-color) 58%, transparent);
	}
	.pe-block {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.pe-block__tools {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem;
	}
	.pe-block__tools button {
		min-width: 1.5rem;
		height: 1.5rem;
		padding: 0 0.3rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
		background: transparent;
		font-size: 0.68rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--text-color) 68%, transparent);
		cursor: pointer;
	}
	.pe-block__tools button:hover:not(:disabled) {
		background: color-mix(in srgb, var(--text-color) 10%, transparent);
	}
	.pe-block__tools button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.pe-block__input {
		font-family: inherit;
	}

	.pe-blocks__add {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.3rem;
		padding-top: 0.35rem;
		border-top: 1px dashed color-mix(in srgb, var(--text-color) 16%, transparent);
	}
	.pe-blocks__add > span {
		font-size: 0.7rem;
		color: color-mix(in srgb, var(--text-color) 55%, transparent);
	}

	/* ---------------- 底部条 ---------------- */
	/* 外框（padding + 上边框）由 Modal 的 .mo-foot 提供，这里只排内部三块 */
	.pe-foot {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.pe-foot__hint {
		margin-right: auto;
		font-size: 0.7rem;
		color: color-mix(in srgb, var(--text-color) 55%, transparent);
	}
</style>
