<script lang="ts">
/**
 * 首页标语管理模块（/manage/?module=slogans）
 * - 数据源：src/data/homeSlogans.data.json（全屏壁纸主页大标题下方那句话）
 * - 可增 / 删 / 改每一句，并设置多句时的轮播间隔（秒）
 * - 保存：先读最新 sha 再整体重写 JSON（GitHub Contents API 更新已存在文件必须带 sha）
 * - 前台由 HomeWallpaperDecor 读取该 JSON，多句时按间隔自动轮换
 */
import { onMount } from "svelte";
import { type ApiReadResponse, apiGet, apiPost } from "./manage-utils";

/** 仓库相对路径，与 src/data/homeSlogans.ts 的 HOME_SLOGANS_PATH 保持一致 */
const SLOGANS_PATH = "src/data/homeSlogans.data.json";
const DEFAULT_INTERVAL = 20;
const MIN_INTERVAL = 3;
const MAX_INTERVAL = 600;

// ---- 状态 ----
let slogans = $state<string[]>([]);
let intervalSeconds = $state(DEFAULT_INTERVAL);
let enabled = $state(true);
let loading = $state(true);
let saving = $state(false);
let error = $state("");
let saved = $state(false);
let dirty = $state(false);

function clampInterval(value: number): number {
	const n = Math.floor(Number(value));
	if (!Number.isFinite(n)) return DEFAULT_INTERVAL;
	return Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, n));
}

function cleanSlogans(list: string[]): string[] {
	return list.map((text) => String(text ?? "").trim()).filter(Boolean);
}

/** 按固定字段顺序序列化，保证 diff 稳定（每次保存不会因为 key 顺序抖动） */
function serialize(): string {
	const data = {
		enabled,
		intervalSeconds: clampInterval(intervalSeconds),
		slogans: cleanSlogans(slogans),
	};
	return `${JSON.stringify(data, null, 2)}\n`;
}

function markDirty() {
	dirty = true;
	saved = false;
	error = "";
}

// ---- 加载 ----
async function load() {
	loading = true;
	error = "";
	try {
		const data = await apiGet<ApiReadResponse>(
			`/api/content/read/?path=${encodeURIComponent(SLOGANS_PATH)}`,
		);
		const raw: unknown = data.content ? JSON.parse(data.content) : null;
		const obj = (raw && typeof raw === "object" ? raw : {}) as Record<
			string,
			unknown
		>;
		const list = Array.isArray(obj.slogans) ? obj.slogans : [];
		const cleaned = cleanSlogans(list.map((s) => String(s ?? "")));
		slogans = cleaned.length > 0 ? cleaned : [""];
		intervalSeconds = clampInterval(Number(obj.intervalSeconds));
		enabled = obj.enabled !== false;
		dirty = false;
		saved = false;
	} catch (e) {
		// 文件缺失（线上仓库还没有这个文件）时给一份可编辑的空模板
		slogans = [""];
		intervalSeconds = DEFAULT_INTERVAL;
		enabled = true;
		error =
			e instanceof Error && /404|Not Found/i.test(e.message)
				? ""
				: e instanceof Error
					? e.message
					: "加载失败";
	} finally {
		loading = false;
	}
}

onMount(() => {
	void load();
});

// ---- 增删改 ----
function addSlogan() {
	slogans = [...slogans, ""];
	markDirty();
}

function removeSlogan(index: number) {
	if (slogans.length <= 1) {
		// 至少留一行，直接清空内容即可
		slogans = [""];
	} else {
		slogans = slogans.filter((_, i) => i !== index);
	}
	markDirty();
}

// ---- 保存 ----
/** 回读一次确认是否真的写进去了（dev 下写 src/ 会触发 Vite 全量刷新，可能打断响应） */
async function verifyWritten(expected: string): Promise<boolean> {
	try {
		const meta = await apiGet<ApiReadResponse>(
			`/api/content/read/?path=${encodeURIComponent(SLOGANS_PATH)}&t=${Date.now()}`,
		);
		const actual = typeof meta.content === "string" ? meta.content.trim() : "";
		return actual.length > 0 && actual === expected.trim();
	} catch {
		return false;
	}
}

async function save() {
	const cleaned = cleanSlogans(slogans);
	if (cleaned.length === 0) {
		error = "至少写一句标语再保存";
		return;
	}
	slogans = cleaned;

	saving = true;
	error = "";
	saved = false;
	// 先本地收敛一次（去掉空行 / 修正间隔），再序列化提交
	const payload = serialize();
	intervalSeconds = clampInterval(intervalSeconds);

	try {
		// 更新已存在文件必须带 sha，先读一次
		let sha: string | undefined;
		try {
			const meta = await apiGet<ApiReadResponse>(
				`/api/content/read/?path=${encodeURIComponent(SLOGANS_PATH)}`,
			);
			sha = meta.sha || undefined;
		} catch {
			// 读不到则按新建提交
		}

		try {
			await apiPost("/api/content/write/", {
				path: SLOGANS_PATH,
				content: payload,
				sha,
				message: "更新首页标语",
			});
		} catch (e) {
			if (!(await verifyWritten(payload))) throw e;
		}

		dirty = false;
		saved = true;
	} catch (e) {
		error = e instanceof Error ? e.message : "保存失败";
	} finally {
		saving = false;
	}
}

const cleanedCount = $derived(cleanSlogans(slogans).length);
</script>

{#if loading}
	<div class="card flex items-center justify-center gap-3 p-10 text-sm text-secondary">
		<span class="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand"></span>
		正在读取首页标语…
	</div>
{:else}
	<div class="space-y-4">
		<div class="card p-4">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="min-w-0">
					<h2 class="text-sm font-semibold">首页标语</h2>
					<p class="mt-1 text-xs leading-relaxed text-secondary">
						显示在全屏壁纸主页大标题的下方。写多句时，每 {intervalSeconds}
						秒自动换一句；只写一句就固定不动。
					</p>
				</div>
				<label class="flex shrink-0 cursor-pointer select-none items-center gap-2 text-xs text-secondary">
					<input
						type="checkbox"
						bind:checked={enabled}
						onchange={markDirty}
						class="h-4 w-4 accent-[var(--treasure-brand)]"
					/>
					启用标语
				</label>
			</div>

			<!-- 标语列表 -->
			<div class="mt-4 space-y-2">
				{#each slogans as _text, i (i)}
					<div class="flex items-center gap-2">
						<span class="w-5 shrink-0 text-center text-[11px] text-secondary">{i + 1}</span>
						<input
							type="text"
							bind:value={slogans[i]}
							oninput={markDirty}
							placeholder="输入一句标语…"
							maxlength="80"
							class="h-9 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-brand/50"
						/>
						<button
							type="button"
							class="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
							onclick={() => removeSlogan(i)}
						>
							删除
						</button>
					</div>
				{/each}
			</div>

			<div class="mt-3 flex flex-wrap items-center gap-2">
				<button
					type="button"
					class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-brand/10 hover:text-brand"
					onclick={addSlogan}
				>
					+ 添加一句
				</button>
				<span class="text-[11px] text-secondary">
					共 {cleanedCount} 句{cleanedCount > 1 ? "（会自动轮播）" : ""}
				</span>
			</div>

			<!-- 轮播间隔 -->
			<div class="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
				<span class="text-xs text-secondary">轮播间隔</span>
				<input
					type="number"
					min={MIN_INTERVAL}
					max={MAX_INTERVAL}
					bind:value={intervalSeconds}
					oninput={markDirty}
					class="h-8 w-20 rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
				/>
				<span class="text-xs text-secondary">
					秒（{MIN_INTERVAL}–{MAX_INTERVAL}，多于一句时才生效）
				</span>
			</div>

			{#if error}
				<p class="mt-3 break-words text-xs text-red-500">{error}</p>
			{/if}
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<button
				type="button"
				class="brand-btn text-xs disabled:opacity-50"
				disabled={saving}
				onclick={() => void save()}
			>
				{saving ? "保存中…" : "保存"}
			</button>
			<button
				type="button"
				class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10"
				disabled={saving}
				onclick={() => void load()}
			>
				重新读取
			</button>
			{#if dirty}
				<span class="text-xs text-amber-600 dark:text-amber-400">有未保存的修改</span>
			{:else if saved}
				<span class="text-xs text-emerald-600 dark:text-emerald-400">
					已保存，站点重新部署后线上生效
				</span>
			{/if}
		</div>
	</div>
{/if}
