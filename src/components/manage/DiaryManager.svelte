<script lang="ts">
/**
 * 日记管理模块（/manage/?module=diary）
 * 数据源：public/diary/index.json（整体一个 JSON 数组，走 /api/content/read 拿 sha）
 * - 列表：标题 / 日期 / 私密徽标 / 媒体数
 * - 编辑：标题 / 内容 / 日期 / 标签 / 是否私密 / 心情；保存 = 改数组条目后整体写回
 * - 删除：从数组移除条目（图片 / 视频文件保留不动，提示用户去 GitHub 删）
 * ⚠️ 媒体文件（public/diary/images|videos）不在此处管理，避免误删用户素材
 */
import { onMount } from "svelte";
import Modal from "./Modal.svelte";
import {
	type ApiReadResponse,
	apiGet,
	apiPost,
	splitTags,
} from "./manage-utils";

interface DiaryEntry {
	slug: string;
	title: string;
	content: string;
	date: string;
	tags: string[];
	images: { url: string }[];
	isPrivate: boolean;
	mood: string;
}

const DIARY_PATH = "public/diary/index.json";

// ---- 状态 ----
let entries = $state<DiaryEntry[]>([]);
let loading = $state(true);
let error = $state("");
let saving = $state(false);
let fileSha = $state<string | undefined>(undefined);

// ---- 编辑态 ----
let showForm = $state(false);
let editing = $state<DiaryEntry | null>(null);
let formTitle = $state("");
let formContent = $state("");
let formDate = $state(""); // datetime-local 格式 2026-10-05T23:52
let formTags = $state("");
let formPrivate = $state(false);
let formMood = $state("neutral");
let formError = $state("");

const MOODS = ["neutral", "happy", "sad", "angry", "tired", "excited"];

const sortedEntries = $derived(
	[...entries].sort((a, b) => String(b.date).localeCompare(String(a.date))),
);

// ---- 加载 ----
async function load() {
	loading = true;
	error = "";
	try {
		const data = await apiGet<ApiReadResponse>(
			`/api/content/read/?path=${encodeURIComponent(DIARY_PATH)}`,
		);
		fileSha = data.sha || undefined;
		let parsed: DiaryEntry[] = [];
		if (typeof data.content === "string") {
			try {
				parsed = JSON.parse(data.content);
			} catch {
				parsed = [];
			}
		}
		entries = Array.isArray(parsed) ? parsed : [];
	} catch (e) {
		error = e instanceof Error ? e.message : "加载失败";
	} finally {
		loading = false;
	}
}

onMount(() => void load());

function fmtDate(s: string): string {
	// 2026-10-05T23:52 -> 2026-10-05 23:52
	return s.replace("T", " ").slice(0, 16);
}

function toLocalInput(s: string): string {
	// 兼容 "2026-10-05T23:52" 与 "2026-10-05 23:52"
	return s.replace(" ", "T").slice(0, 16);
}

function openEdit(entry: DiaryEntry) {
	editing = entry;
	formTitle = entry.title;
	formContent = entry.content;
	formDate = toLocalInput(entry.date);
	formTags = (entry.tags ?? []).join(", ");
	formPrivate = !!entry.isPrivate;
	formMood = entry.mood || "neutral";
	formError = "";
	showForm = true;
}

function closeForm() {
	if (saving) return;
	showForm = false;
	editing = null;
}

async function save() {
	formError = "";
	if (!formTitle.trim()) {
		formError = "请填写标题";
		return;
	}
	const tags = splitTags(formTags);
	const dateStr = formDate.replace("T", " ").slice(0, 16);
	saving = true;
	try {
		let next: DiaryEntry[];
		if (editing) {
			next = entries.map((e) =>
				e.slug === editing.slug
					? {
							...e,
							title: formTitle.trim(),
							content: formContent,
							date: dateStr,
							tags,
							isPrivate: formPrivate,
							mood: formMood,
						}
					: e,
			);
		} else {
			const slug = `diary-${dateStr.slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8)}`;
			next = [
				...entries,
				{
					slug,
					title: formTitle.trim(),
					content: formContent,
					date: dateStr,
					tags,
					images: [],
					isPrivate: formPrivate,
					mood: formMood,
				},
			];
		}
		await apiPost("/api/content/write/", {
			path: DIARY_PATH,
			content: JSON.stringify(next, null, 2),
			sha: fileSha,
			message: `${editing ? "更新" : "新建"}日记：${formTitle.trim()}`,
		});
		showForm = false;
		editing = null;
		await load();
	} catch (e) {
		formError = e instanceof Error ? e.message : "保存失败";
	} finally {
		saving = false;
	}
}

async function remove(entry: DiaryEntry) {
	const media = (entry.images ?? []).length;
	const sure = window.confirm(
		`确定删除日记《${entry.title}》吗？\n${
			media > 0
				? `该日记含 ${media} 张图片，删除后图片文件仍保留在 public/diary/images，需手动清理。\n`
				: ""
		}slug：${entry.slug}`,
	);
	if (!sure) return;
	try {
		const next = entries.filter((e) => e.slug !== entry.slug);
		await apiPost("/api/content/write/", {
			path: DIARY_PATH,
			content: JSON.stringify(next, null, 2),
			sha: fileSha,
			message: `删除日记：${entry.slug}`,
		});
		await load();
	} catch (e) {
		alert(e instanceof Error ? e.message : "删除失败");
	}
}
</script>

<div class="mb-4 flex flex-wrap items-center gap-2">
	<p class="text-xs text-secondary">日记数据存于 public/diary/index.json，媒体文件不在此管理</p>
	<button type="button" class="brand-btn ml-auto gap-1.5 text-xs" onclick={() => openEdit({
		slug: '', title: '', content: '', date: new Date().toISOString().slice(0,16).replace('T',' '), tags: [], images: [], isPrivate: false, mood: 'neutral'
	})}>
		<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M12 5v14M5 12h14" />
		</svg>
		写新日记
	</button>
</div>

{#if loading}
	<div class="card flex items-center justify-center gap-3 p-10 text-sm text-secondary">
		<span class="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand"></span>
		正在加载日记…
	</div>
{:else if error}
	<div class="card flex flex-col items-center gap-3 p-10 text-center">
		<p class="text-sm text-red-500">{error}</p>
		<button type="button" class="brand-btn mt-1 text-xs" onclick={() => void load()}>重试</button>
	</div>
{:else if sortedEntries.length === 0}
	<div class="card flex flex-col items-center gap-3 p-12 text-center">
		<p class="text-sm text-secondary">还没有日记，点右上角「写新日记」添加第一条</p>
	</div>
{:else}
	<div class="flex flex-col gap-2.5">
		{#each sortedEntries as entry (entry.slug)}
			<div class="card flex items-start gap-3 p-3.5">
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-center gap-2">
						<p class="truncate text-sm font-semibold">{entry.title}</p>
						{#if entry.isPrivate}
							<span class="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">私密</span>
						{/if}
						{#if (entry.images ?? []).length > 0}
							<span class="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] text-brand">{(entry.images ?? []).length} 图</span>
						{/if}
					</div>
					<p class="mt-0.5 truncate text-xs text-secondary">{fmtDate(entry.date)}</p>
				</div>
				<div class="flex shrink-0 gap-1.5">
					<button type="button" class="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10" onclick={() => openEdit(entry)}>编辑</button>
					<button type="button" class="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10" onclick={() => void remove(entry)}>删除</button>
				</div>
			</div>
		{/each}
	</div>
{/if}

{#if showForm}
	<Modal title={editing ? "编辑日记" : "写新日记"} onClose={closeForm} wide>
		<div class="flex flex-col gap-3">
			<label class="block">
				<span class="mb-1 block text-xs font-semibold text-secondary">标题</span>
				<input type="text" bind:value={formTitle} class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50" />
			</label>
			<label class="block">
				<span class="mb-1 block text-xs font-semibold text-secondary">内容</span>
				<textarea bind:value={formContent} rows="8" class="w-full resize-y rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm outline-none focus:border-brand/50"></textarea>
			</label>
			<div class="flex flex-wrap gap-3">
				<label class="block">
					<span class="mb-1 block text-xs font-semibold text-secondary">日期</span>
					<input type="datetime-local" bind:value={formDate} class="h-9 rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50" />
				</label>
				<label class="block">
					<span class="mb-1 block text-xs font-semibold text-secondary">心情</span>
					<select bind:value={formMood} class="h-9 rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50">
						{#each MOODS as m}<option value={m}>{m}</option>{/each}
					</select>
				</label>
				<label class="flex items-end gap-2 pb-1">
					<input type="checkbox" bind:checked={formPrivate} class="accent-[var(--treasure-brand)]" />
					<span class="text-xs text-secondary">私密</span>
				</label>
			</div>
			<label class="block">
				<span class="mb-1 block text-xs font-semibold text-secondary">标签（逗号分隔）</span>
				<input type="text" bind:value={formTags} placeholder="国庆, 生活" class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50" />
			</label>
			{#if formError}
				<p class="text-xs text-red-500">{formError}</p>
			{/if}
		</div>
		{#snippet footer()}
			<div class="flex justify-end gap-2">
				<button type="button" class="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10" disabled={saving} onclick={closeForm}>取消</button>
				<button type="button" class="brand-btn text-xs disabled:opacity-50" disabled={saving} onclick={() => void save()}>{saving ? "保存中…" : "保存"}</button>
			</div>
		{/snippet}
	</Modal>
{/if}
