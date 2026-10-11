<script lang="ts">
/**
 * 通用集合管理组件（schema 驱动）
 * 由 collection-config.ts 的 CollectionConfig 渲染：列表 + 筛选 + 新建/编辑 + 删除。
 * 数据源：GET /api/content/collection-index/?dir=...（已解析 frontmatter）
 * 保存：buildMarkdown → POST /api/content/write/（编辑先读 sha）；删除：/api/content/delete/
 */
import { onMount } from "svelte";
import { buildMarkdown, type FieldValue } from "@/utils/collection-frontmatter";
import type { CollectionConfig, CollectionField } from "./collection-config";
import Modal from "./Modal.svelte";
import {
	type ApiReadResponse,
	apiGet,
	apiPost,
	splitTags,
} from "./manage-utils";

let { config }: { config: CollectionConfig } = $props();

interface Item {
	slug: string;
	path: string;
	data: Record<string, FieldValue>;
	body: string;
}

// ---- 状态 ----
let items = $state<Item[]>([]);
let loading = $state(true);
let error = $state("");
let saving = $state(false);

const hasDraft = $derived(!!config.draftKey);
let filter = $state<"all" | "published" | "draft">("all");

const FILTERS = $derived(
	hasDraft
		? [
				{ id: "all", label: "全部" },
				{ id: "published", label: "已发布" },
				{ id: "draft", label: "草稿" },
			]
		: [{ id: "all", label: "全部" }],
);

// ---- 编辑态 ----
let showForm = $state(false);
let editing = $state<Item | null>(null);
let formSlug = $state("");
let formValues = $state<Record<string, FieldValue>>({});
let formBody = $state("");
let formError = $state("");

const visibleItems = $derived.by(() => {
	const draftKey = config.draftKey;
	let list = items;
	if (draftKey) {
		if (filter === "draft")
			list = list.filter((i) => i.data[draftKey] === true);
		else if (filter === "published")
			list = list.filter((i) => i.data[draftKey] !== true);
	}
	const dateKey = config.dateKey;
	return [...list].sort((a, b) => {
		if (dateKey) {
			const da = String(a.data[dateKey] ?? "");
			const db = String(b.data[dateKey] ?? "");
			if (da !== db) return db.localeCompare(da);
		}
		return String(a.data[config.titleKey] ?? "").localeCompare(
			String(b.data[config.titleKey] ?? ""),
		);
	});
});

const filterCounts = $derived.by(() => {
	const draftKey = config.draftKey;
	const c = { all: items.length, published: 0, draft: 0 };
	if (draftKey) {
		for (const i of items) {
			if (i.data[draftKey] === true) c.draft++;
			else c.published++;
		}
	} else {
		c.published = items.length;
	}
	return c;
});

// ---- 加载 ----
async function load(refresh = false) {
	loading = true;
	error = "";
	try {
		const data = await apiGet<{ items: Item[] }>(
			`/api/content/collection-index/?dir=${encodeURIComponent(config.dir)}${
				refresh ? "&refresh=1" : ""
			}`,
		);
		items = data.items ?? [];
	} catch (e) {
		error = e instanceof Error ? e.message : "加载失败";
	} finally {
		loading = false;
	}
}

onMount(() => void load());

// ---- 类型 coerce：原始值 → 表单值 ----
function toFormValue(
	field: CollectionField,
	raw: FieldValue | undefined,
): FieldValue {
	if (raw === undefined) {
		if (field.type === "boolean") return false;
		if (field.type === "tags" || field.type === "objectList") return [];
		if (field.type === "number") return "";
		return "";
	}
	return raw;
}

function openNew() {
	editing = null;
	formSlug = "";
	formValues = {};
	for (const f of config.fields) {
		formValues[f.key] = toFormValue(f, undefined);
	}
	formBody = "";
	formError = "";
	showForm = true;
}

function openEdit(item: Item) {
	editing = item;
	formSlug = item.slug;
	formValues = {};
	for (const f of config.fields) {
		formValues[f.key] = toFormValue(f, item.data[f.key]);
	}
	formBody = item.body;
	formError = "";
	showForm = true;
}

function closeForm() {
	if (saving) return;
	showForm = false;
	editing = null;
}

// ---- 序列化表单值 → FieldValue（按类型） ----
function coerceValue(field: CollectionField, v: FieldValue): FieldValue {
	switch (field.type) {
		case "number":
			return v === "" || v == null ? 0 : Number(v);
		case "boolean":
			return v === true || v === "true";
		case "tags":
			return Array.isArray(v) ? (v as string[]) : splitTags(String(v ?? ""));
		case "objectList":
			return Array.isArray(v) ? (v as Record<string, string>[]) : [];
		default:
			return v == null ? "" : String(v);
	}
}

async function save() {
	formError = "";
	const slug = formSlug.trim();
	if (!slug) {
		formError = "请填写文件名";
		return;
	}
	if (!/^[a-zA-Z0-9._-]+$/.test(slug)) {
		formError = "文件名只能包含字母、数字、点、下划线和短横";
		return;
	}
	const path = `${config.dir}/${slug}.md`;

	// 组装值
	const values: Record<string, FieldValue> = {};
	for (const f of config.fields) {
		values[f.key] = coerceValue(f, formValues[f.key]);
	}

	const content = buildMarkdown(
		config.fields.map((f) => ({
			key: f.key,
			type: f.type,
			subFields: f.subFields,
		})),
		values,
		formBody,
	);

	saving = true;
	try {
		let sha: string | undefined;
		if (editing) {
			// 编辑：先读最新 sha（避免并发覆盖）
			try {
				const meta = await apiGet<ApiReadResponse>(
					`/api/content/read/?path=${encodeURIComponent(path)}`,
				);
				sha = meta.sha || undefined;
			} catch {
				// 读不到 sha 直接尝试写入
			}
		}
		await apiPost("/api/content/write/", {
			path,
			content,
			sha,
			message: `${editing ? "更新" : "新建"}${config.label}：${slug}`,
		});
		showForm = false;
		editing = null;
		await load(true);
	} catch (e) {
		formError = e instanceof Error ? e.message : "保存失败";
	} finally {
		saving = false;
	}
}

async function remove(item: Item) {
	const sure = window.confirm(
		`确定删除《${String(item.data[config.titleKey] ?? item.slug)}》吗？\n文件：${item.path}`,
	);
	if (!sure) return;
	try {
		await apiPost("/api/content/delete/", {
			path: item.path,
			message: `删除${config.label}：${item.slug}`,
		});
		await load(true);
	} catch (e) {
		alert(e instanceof Error ? e.message : "删除失败");
	}
}

// ---- 列表展示辅助 ----
function badgeText(key: string, item: Item): string {
	const v = item.data[key];
	if (v === undefined || v === null || v === "") return "";
	if (typeof v === "boolean") return v ? "是" : "否";
	if (Array.isArray(v)) return `${v.length} 项`;
	return String(v);
}
</script>

<!-- 工具栏 -->
<div class="mb-4 flex flex-wrap items-center gap-2">
	<div class="flex flex-wrap gap-1.5">
		{#each FILTERS as f}
			<button
				type="button"
				class:active={filter === (f.id as typeof filter)}
				class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-brand/10"
				onclick={() => (filter = f.id as typeof filter)}
			>
				{f.label}
				<span class="rounded-full bg-black/5 px-1.5 text-[10px] text-secondary dark:bg-white/10">
					{filterCounts[f.id as keyof typeof filterCounts] ?? 0}
				</span>
			</button>
		{/each}
	</div>
	<button type="button" class="brand-btn ml-auto gap-1.5 text-xs" onclick={openNew}>
		<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M12 5v14M5 12h14" />
		</svg>
		新建{config.label}
	</button>
</div>

{#if loading}
	<div class="card flex items-center justify-center gap-3 p-10 text-sm text-secondary">
		<span class="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand"></span>
		正在加载{config.label}…
	</div>
{:else if error}
	<div class="card flex flex-col items-center gap-3 p-10 text-center">
		<p class="text-sm text-red-500">{error}</p>
		<button type="button" class="brand-btn mt-1 text-xs" onclick={() => void load()}>重试</button>
	</div>
{:else if visibleItems.length === 0}
	<div class="card flex flex-col items-center gap-3 p-12 text-center">
		<p class="text-sm text-secondary">还没有{config.label}内容，点右上角「新建{config.label}」添加第一条</p>
	</div>
{:else}
	<div class="flex flex-col gap-2.5">
		{#each visibleItems as item (item.path)}
			<div class="card flex items-start gap-3 p-3.5">
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-center gap-2">
						<p class="truncate text-sm font-semibold">{String(item.data[config.titleKey] ?? item.slug)}</p>
						{#if config.draftKey && item.data[config.draftKey] === true}
							<span class="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">草稿</span>
						{/if}
						{#each config.badges ?? [] as b}
							{#if badgeText(b, item)}
								<span class="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] text-brand">{badgeText(b, item)}</span>
							{/if}
						{/each}
					</div>
					{#if config.subtitleKey && item.data[config.subtitleKey]}
						<p class="mt-0.5 truncate text-xs text-secondary">{String(item.data[config.subtitleKey])}</p>
					{/if}
					<p class="mt-1 truncate font-mono text-[11px] text-secondary/70">{item.slug}.md</p>
				</div>
				<div class="flex shrink-0 gap-1.5">
					<button
						type="button"
						class="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
						onclick={() => openEdit(item)}
					>
						编辑
					</button>
					<button
						type="button"
						class="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10"
						onclick={() => void remove(item)}
					>
						删除
					</button>
				</div>
			</div>
		{/each}
	</div>
{/if}

<!-- 新建 / 编辑 弹窗 -->
{#if showForm}
	<Modal title={`${editing ? "编辑" : "新建"}${config.label}`} onClose={closeForm} wide>
		<div class="flex flex-col gap-3">
			<!-- 文件名（slug） -->
			<label class="block">
				<span class="mb-1 block text-xs font-semibold text-secondary">文件名</span>
				<input
					type="text"
					bind:value={formSlug}
					disabled={!!editing}
					placeholder={config.slugHint}
					class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50 disabled:opacity-60"
				/>
			</label>

			<!-- 字段 -->
			{#each config.fields as f (f.key)}
				{@const val = formValues[f.key]}
				<label class="block">
					<span class="mb-1 block text-xs font-semibold text-secondary">
						{f.label}{#if f.required}<span class="text-red-500"> *</span>{/if}
					</span>

					{#if f.type === "textarea"}
						<textarea
							bind:value={formValues[f.key]}
							rows="3"
							placeholder={f.placeholder}
							class="w-full resize-y rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm outline-none focus:border-brand/50"
						></textarea>
					{:else if f.type === "date"}
						<input
							type="date"
							bind:value={formValues[f.key]}
							class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
						/>
					{:else if f.type === "number"}
						<input
							type="number"
							bind:value={formValues[f.key]}
							placeholder={f.placeholder}
							class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
						/>
					{:else if f.type === "boolean"}
						<input type="checkbox" bind:checked={formValues[f.key]} class="accent-[var(--treasure-brand)]" />
					{:else if f.type === "select"}
						<select
							bind:value={formValues[f.key]}
							class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
						>
							<option value="">（未设置）</option>
							{#each f.options ?? [] as opt}
								<option value={opt}>{opt}</option>
							{/each}
						</select>
					{:else if f.type === "tags"}
						<input
							type="text"
							value={(Array.isArray(val) ? (val as string[]) : []).join(", ")}
							oninput={(e) => (formValues[f.key] = splitTags((e.target as HTMLInputElement).value))}
							placeholder={f.placeholder}
							class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
						/>
					{:else if f.type === "objectList"}
						{@const list = (Array.isArray(val) ? (val as Record<string, string>[]) : [])}
						<div class="rounded-lg border border-border p-2.5">
							{#each list as row, ri (ri)}
								<div class="mb-2 rounded-md bg-black/5 p-2 dark:bg-white/5">
									<div class="flex flex-wrap gap-2">
										{#each f.subFields ?? [] as sf}
											<input
												type="text"
												value={row[sf.key] ?? ""}
												oninput={(e) => {
													row[sf.key] = (e.target as HTMLInputElement).value;
													formValues[f.key] = [...list];
												}}
												placeholder={sf.label}
												class="h-8 min-w-[8rem] flex-1 rounded-md border border-border bg-card px-2 text-xs outline-none focus:border-brand/50"
											/>
										{/each}
										<button
											type="button"
											class="h-8 rounded-md border border-border px-2 text-xs text-red-500 hover:bg-red-500/10"
											onclick={() => {
												list.splice(ri, 1);
												formValues[f.key] = [...list];
											}}
										>删</button>
									</div>
								</div>
							{/each}
							<button
								type="button"
								class="text-xs font-medium text-brand hover:underline"
								onclick={() => {
									const blank: Record<string, string> = {};
									for (const sf of f.subFields ?? []) blank[sf.key] = "";
									formValues[f.key] = [...list, blank];
								}}
							>+ 添加一项</button>
						</div>
					{:else}
						<input
							type="text"
							bind:value={formValues[f.key]}
							placeholder={f.placeholder}
							class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
						/>
					{/if}
				</label>
			{/each}

			<!-- 正文 -->
			<label class="block">
				<span class="mb-1 block text-xs font-semibold text-secondary">正文（Markdown）</span>
				<textarea
					bind:value={formBody}
					rows="8"
					class="w-full resize-y rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs outline-none focus:border-brand/50"
				></textarea>
			</label>

			{#if formError}
				<p class="text-xs text-red-500">{formError}</p>
			{/if}
		</div>

		{#snippet footer()}
			<div class="flex justify-end gap-2">
				<button
					type="button"
					class="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
					disabled={saving}
					onclick={closeForm}
				>取消</button>
				<button
					type="button"
					class="brand-btn text-xs disabled:opacity-50"
					disabled={saving}
					onclick={() => void save()}
				>
					{saving ? "保存中…" : "保存"}
				</button>
			</div>
		{/snippet}
	</Modal>
{/if}

<style>
	button.active {
		color: var(--treasure-brand);
		background: color-mix(in srgb, var(--treasure-brand) 12%, transparent);
		font-weight: 600;
	}
</style>
