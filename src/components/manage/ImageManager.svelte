<script lang="ts">
/**
 * 图片管理模块（/manage/?module=images）
 * - 数据源：public/blogs/ 递归文件树（GET /api/content/list/?recursive=1）
 * - 引用关系：GET /api/content/posts-index/ 的 imageRefs（图片 URL → 文章 slug）
 * - 上传：canvas 压缩为 WebP（质量 0.8，与发文编辑器一致）；GIF 保留原样不压缩
 * - 替换：保留原文件名，按原扩展名输出（PNG→PNG、JPEG→JPEG、WebP/AVIF→WebP），文章引用不断链
 * - 删除：被文章引用时强提示，确认后仍可删除
 */
import { onMount } from "svelte";
import { compressImage } from "@/utils/image-compress";
import Modal from "./Modal.svelte";
import {
	type ApiListEntry,
	type ApiReadResponse,
	apiGet,
	apiPost,
	formatSize,
	readFileAsDataUrl,
	stripDataUrlPrefix,
} from "./manage-utils";

interface ImageItem {
	name: string;
	path: string; // 仓库相对路径 public/blogs/...
	size: number;
	category: string; // public/blogs 下的一级目录
	rawUrl: string; // /blogs/技术总结/x.jpg（未编码，用于匹配 imageRefs）
	viewUrl: string; // encodeURI 后，用于 <img src>
}

interface PickedImage {
	file: File;
	dataUrl: string;
	size: number;
	isGif: boolean;
}

// ---- 列表状态 ----
let images = $state<ImageItem[]>([]);
let refs = $state<Record<string, string[]>>({});
let postTitles = $state<Record<string, string>>({});
let loading = $state(true);
let error = $state("");
let activeCategory = $state("all");
let keyword = $state("");
let busyPath = $state("");
let copiedUrl = $state("");

// ---- 上传弹窗状态 ----
let showUpload = $state(false);
let uploadMode = $state<"existing" | "new">("existing");
let uploadCategory = $state("");
let newCategory = $state("");
let picked = $state<PickedImage[]>([]);
let uploading = $state(false);
let uploadDone = $state(false);
let uploadStatus = $state("");
let uploadError = $state("");
let dragActive = $state(false);
let uploadInputEl = $state<HTMLInputElement>();
let replaceInputEl = $state<HTMLInputElement>();
let replaceTarget = $state<ImageItem | null>(null);

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)$/i;

// ---- 数据加载 ----
async function load(refresh = false) {
	loading = true;
	error = "";
	try {
		// posts-index 只取用到的字段（文章标题与图片引用倒排索引）
		const [listData, indexData] = await Promise.all([
			apiGet<ApiListEntry[]>(
				"/api/content/list/?path=public/blogs&recursive=1",
			),
			apiGet<{
				posts: Array<{ slug: string; title: string }>;
				imageRefs: Record<string, string[]>;
			}>(`/api/content/posts-index/${refresh ? "?refresh=1" : ""}`),
		]);
		// 本地递归列表（listLocalDirRecursive）只有 path 没有 name，需从 path 推导，
		// 与 posts-index API 的兼容写法保持一致
		const entries = (Array.isArray(listData) ? listData : []).map((it) => ({
			...it,
			name: it.name || it.path.split("/").pop() || "",
		}));
		const items: ImageItem[] = entries
			.filter((it) => it.type === "file" && IMAGE_RE.test(it.name))
			.map((it) => {
				const rel = it.path.slice("public/blogs/".length);
				const category = rel.includes("/") ? rel.split("/")[0] : "未分类";
				const rawUrl = `/${it.path.slice("public/".length)}`;
				return {
					name: it.name,
					path: it.path,
					size: it.size ?? 0,
					category,
					rawUrl,
					viewUrl: encodeURI(rawUrl),
				};
			});
		images = items;
		refs = indexData.imageRefs || {};
		const map: Record<string, string> = {};
		for (const p of indexData.posts || []) {
			map[p.slug] = p.title || p.slug;
		}
		postTitles = map;
		if (!categories.includes(uploadCategory)) {
			uploadCategory = categories[0] || "";
			uploadMode = categories.length ? "existing" : "new";
		}
	} catch (e) {
		error = e instanceof Error ? e.message : "加载失败";
	} finally {
		loading = false;
	}
}

onMount(() => {
	void load();
});

// ---- 派生：分类 / 筛选结果 ----
const categories = $derived.by(() =>
	[...new Set(images.map((i) => i.category))].sort((a, b) =>
		a.localeCompare(b, "zh-CN"),
	),
);

const categoryCounts = $derived.by(() => {
	const counts: Record<string, number> = { all: images.length };
	for (const img of images) {
		counts[img.category] = (counts[img.category] || 0) + 1;
	}
	return counts;
});

const visibleImages = $derived.by(() => {
	const kw = keyword.trim().toLowerCase();
	return images
		.filter((i) => activeCategory === "all" || i.category === activeCategory)
		.filter((i) => !kw || i.name.toLowerCase().includes(kw))
		.sort(
			(a, b) =>
				a.category.localeCompare(b.category, "zh-CN") ||
				a.name.localeCompare(b.name, "zh-CN"),
		);
});

function refSlugs(img: ImageItem): string[] {
	return refs[img.rawUrl] || [];
}

// ---- 复制链接 ----
async function copyUrl(img: ImageItem) {
	try {
		await navigator.clipboard.writeText(location.origin + img.viewUrl);
		copiedUrl = img.rawUrl;
		window.setTimeout(() => {
			if (copiedUrl === img.rawUrl) copiedUrl = "";
		}, 1600);
	} catch {
		// 剪贴板权限被拒时静默（部分浏览器需 https）
	}
}

// ---- 删除 ----
async function removeImage(img: ImageItem) {
	const used = refSlugs(img);
	const refText =
		used.length > 0
			? `该图片正被 ${used.length} 篇文章引用：\n${used
					.map((s) => `《${postTitles[s] || s}》`)
					.join("、")}\n删除后这些位置会显示裂图，请先回文章里替换或移除。\n\n`
			: "";
	const sure = window.confirm(
		`确定删除这张图片吗？\n${refText}文件：${img.path}`,
	);
	if (!sure) return;
	busyPath = img.path;
	try {
		await apiPost("/api/content/delete/", {
			path: img.path,
			message: `删除图片 ${img.name}`,
		});
		await load(used.length > 0);
	} catch (e) {
		alert(e instanceof Error ? e.message : "删除失败");
	} finally {
		busyPath = "";
	}
}

// ---- 替换（保留原文件名与扩展名）----
function onReplaceClick(img: ImageItem) {
	replaceTarget = img;
	if (replaceInputEl) replaceInputEl.value = "";
	replaceInputEl?.click();
}

async function onReplaceFile(e: Event) {
	const input = e.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file || !replaceTarget) return;
	const img = replaceTarget;
	try {
		if (!file.type.startsWith("image/")) {
			throw new Error("请选择图片文件");
		}
		busyPath = img.path;
		const lower = img.name.toLowerCase();
		let dataUrl: string;
		if (lower.endsWith(".gif")) {
			if (!file.name.toLowerCase().endsWith(".gif")) {
				throw new Error(
					"该图片是 GIF，替换时也请选择 GIF 文件（动图压缩会丢失动画）",
				);
			}
			dataUrl = await readFileAsDataUrl(file);
		} else {
			const type = lower.endsWith(".png")
				? "image/png"
				: lower.endsWith(".jpg") || lower.endsWith(".jpeg")
					? "image/jpeg"
					: "image/webp";
			const c = await compressImage(file, {
				type,
				quality: type === "image/jpeg" ? 0.85 : 0.8,
			});
			dataUrl = c.dataUrl;
		}
		// 更新已存在文件必须带 sha（GitHub Contents API 要求），先读一次
		let sha: string | undefined;
		try {
			const meta = await apiGet<ApiReadResponse>(
				`/api/content/read/?path=${encodeURIComponent(img.path)}`,
			);
			sha = meta.sha || undefined;
		} catch {
			// 读不到 sha 时直接尝试写入
		}
		await apiPost("/api/content/write/", {
			path: img.path,
			content: stripDataUrlPrefix(dataUrl),
			encoding: "base64",
			sha,
			message: `替换图片 ${img.name}`,
		});
		alert("替换成功，平台重新部署完成后线上生效。");
		await load();
	} catch (err) {
		alert(err instanceof Error ? err.message : "替换失败");
	} finally {
		busyPath = "";
		replaceTarget = null;
		input.value = "";
	}
}

// ---- 上传弹窗 ----
function openUpload() {
	picked = [];
	uploadDone = false;
	uploadStatus = "";
	uploadError = "";
	uploading = false;
	dragActive = false;
	if (!categories.includes(uploadCategory)) {
		uploadCategory = categories[0] || "";
		uploadMode = categories.length ? "existing" : "new";
	}
	newCategory = "";
	showUpload = true;
}

function closeUpload() {
	if (uploading) return;
	showUpload = false;
}

async function addFiles(files: File[]) {
	uploadError = "";
	for (const file of files) {
		if (!file.type.startsWith("image/")) {
			uploadError = `「${file.name}」不是图片文件，已跳过`;
			continue;
		}
		try {
			if (file.name.toLowerCase().endsWith(".gif")) {
				// GIF 不压缩，保留动画
				picked.push({
					file,
					dataUrl: await readFileAsDataUrl(file),
					size: file.size,
					isGif: true,
				});
			} else {
				const c = await compressImage(file, { quality: 0.8 });
				picked.push({
					file,
					dataUrl: c.dataUrl,
					size: c.size,
					isGif: false,
				});
			}
		} catch (err) {
			uploadError = `压缩「${file.name}」失败：${
				err instanceof Error ? err.message : "未知错误"
			}`;
		}
	}
}

function onPickChange(e: Event) {
	const input = e.target as HTMLInputElement;
	if (input.files) void addFiles(Array.from(input.files));
	input.value = "";
}

function onDrop(e: DragEvent) {
	e.preventDefault();
	dragActive = false;
	if (uploading) return;
	if (e.dataTransfer?.files) void addFiles(Array.from(e.dataTransfer.files));
}

function removePicked(idx: number) {
	if (uploading) return;
	picked = picked.filter((_, i) => i !== idx);
}

function validateCategory(): string {
	const category = uploadMode === "new" ? newCategory.trim() : uploadCategory;
	if (!category) {
		throw new Error(uploadMode === "new" ? "请输入新分类名称" : "请选择分类");
	}
	if (/[\\/:*?"<>|]/.test(category) || category === "." || category === "..") {
		throw new Error('分类名不能包含 \\ / : * ? " < > | 等特殊字符');
	}
	if (category.length > 40) throw new Error("分类名最长 40 个字符");
	return category;
}

async function doUpload() {
	if (uploading || picked.length === 0) return;
	let category: string;
	try {
		category = validateCategory();
	} catch (e) {
		uploadError = e instanceof Error ? e.message : "分类不合法";
		return;
	}
	uploading = true;
	uploadError = "";
	try {
		for (let i = 0; i < picked.length; i++) {
			const p = picked[i];
			uploadStatus = `正在上传 ${i + 1}/${picked.length}：${p.file.name}`;
			const ext = p.isGif ? "gif" : "webp";
			const filename = `img-${Date.now()}-${i}-${Math.random()
				.toString(36)
				.slice(2, 8)}.${ext}`;
			await apiPost("/api/content/write/", {
				path: `public/blogs/${category}/${filename}`,
				content: stripDataUrlPrefix(p.dataUrl),
				encoding: "base64",
				message: `上传图片 ${category}/${filename}`,
			});
		}
		uploadStatus = `上传成功，共 ${picked.length} 张。平台重新部署完成后即可使用。`;
		uploadDone = true;
		picked = [];
		await load(true);
	} catch (e) {
		uploadError = e instanceof Error ? e.message : "上传失败";
	} finally {
		uploading = false;
	}
}
</script>

<!-- 工具栏：分类筛选 + 搜索 + 上传 -->
<div class="mb-4 flex flex-wrap items-center gap-2">
	<div class="flex flex-wrap gap-1.5">
		<button
			type="button"
			class:active={activeCategory === "all"}
			class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-brand/10"
			onclick={() => (activeCategory = "all")}
		>
			全部
			<span class="rounded-full bg-black/5 px-1.5 text-[10px] text-secondary dark:bg-white/10">
				{categoryCounts.all ?? 0}
			</span>
		</button>
		{#each categories as cat (cat)}
			<button
				type="button"
				class:active={activeCategory === cat}
				class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-brand/10"
				onclick={() => (activeCategory = cat)}
			>
				{cat}
				<span class="rounded-full bg-black/5 px-1.5 text-[10px] text-secondary dark:bg-white/10">
					{categoryCounts[cat] ?? 0}
				</span>
			</button>
		{/each}
	</div>
	<input
		type="search"
		bind:value={keyword}
		placeholder="搜索文件名…"
		class="h-8 w-36 rounded-full border border-border bg-card px-3 text-xs outline-none transition-all focus:w-48 focus:border-brand/50 sm:w-44 sm:focus:w-56"
	/>
	<button
		type="button"
		class="brand-btn ml-auto gap-1.5 text-xs"
		onclick={openUpload}
	>
		<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M12 5v14M5 12h14" />
		</svg>
		上传图片
	</button>
</div>

{#if loading}
	<div class="card flex items-center justify-center gap-3 p-10 text-sm text-secondary">
		<span class="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand"></span>
		正在加载图片库…
	</div>
{:else if error}
	<div class="card flex flex-col items-center gap-3 p-10 text-center">
		<p class="text-sm text-red-500">{error}</p>
		<p class="text-xs text-secondary">本地开发读取 public/blogs；线上以 GitHub 仓库为准</p>
		<button type="button" class="brand-btn mt-1 text-xs" onclick={() => void load()}>
			重试
		</button>
	</div>
{:else if images.length === 0}
	<div class="card flex flex-col items-center gap-3 p-12 text-center">
		<svg class="h-10 w-10 text-brand/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M4 5h16v14H4zM8.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM4 15l4-4 3 3 4-4 5 5" />
		</svg>
		<p class="text-sm text-secondary">图片库还是空的，点「上传图片」放入第一批素材</p>
		<button type="button" class="brand-btn mt-1 gap-1.5 text-xs" onclick={openUpload}>
			<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M12 5v14M5 12h14" />
			</svg>
			上传图片
		</button>
	</div>
{:else if visibleImages.length === 0}
	<div class="card p-10 text-center text-sm text-secondary">
		没有符合筛选条件的图片
	</div>
{:else}
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
		{#each visibleImages as img (img.path)}
			<div class="card group overflow-hidden p-0">
				<!-- 缩略图 -->
				<div class="relative aspect-[4/3] overflow-hidden bg-brand/10">
					<img
						src={img.viewUrl}
						alt={img.name}
						loading="lazy"
						decoding="async"
						class="h-full w-full object-cover"
					/>
					<!-- 引用数徽标 -->
					{#if refSlugs(img).length > 0}
						<span
							class="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white"
							title={refSlugs(img)
								.map((s) => postTitles[s] || s)
								.join("、")}
						>
							{refSlugs(img).length} 篇文章引用
						</span>
					{/if}
					<!-- 悬浮操作层 -->
					<div class="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
						<button
							type="button"
							class="rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-800 transition-transform hover:scale-105"
							disabled={busyPath === img.path}
							onclick={() => copyUrl(img)}
						>
							{copiedUrl === img.rawUrl ? "已复制" : "复制链接"}
						</button>
						<button
							type="button"
							class="rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-800 transition-transform hover:scale-105"
							disabled={busyPath === img.path}
							onclick={() => onReplaceClick(img)}
						>
							替换
						</button>
						<button
							type="button"
							class="rounded-lg bg-red-500/90 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-transform hover:scale-105"
							disabled={busyPath === img.path}
							onclick={() => void removeImage(img)}
						>
							删除
						</button>
					</div>
					{#if busyPath === img.path}
						<div class="absolute inset-0 flex items-center justify-center bg-black/40">
							<span class="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
						</div>
					{/if}
				</div>
				<!-- 信息条 -->
				<div class="px-2.5 py-2">
					<p class="truncate text-xs font-medium" title={img.name}>{img.name}</p>
					<p class="mt-0.5 flex items-center justify-between text-[10px] text-secondary">
						<span class="truncate">{img.category}</span>
						<span class="shrink-0">{formatSize(img.size)}</span>
					</p>
				</div>
			</div>
		{/each}
	</div>
{/if}

<!-- 隐藏的替换文件选择器 -->
<input
	bind:this={replaceInputEl}
	type="file"
	accept="image/*"
	class="hidden"
	onchange={(e) => void onReplaceFile(e)}
/>

<!-- 上传弹窗 -->
{#if showUpload}
	<Modal title="上传图片" onClose={closeUpload} wide>
		<!-- 目标分类 -->
		<div class="mb-4">
			<p class="mb-2 text-xs font-semibold text-secondary">保存到分类（public/blogs/分类名/）</p>
			<div class="flex flex-wrap gap-2">
				<label class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs has-[:checked]:border-brand has-[:checked]:bg-brand/10">
					<input type="radio" class="accent-[var(--treasure-brand)]" bind:group={uploadMode} value="existing" disabled={categories.length === 0} />
					已有分类
				</label>
				<label class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs has-[:checked]:border-brand has-[:checked]:bg-brand/10">
					<input type="radio" class="accent-[var(--treasure-brand)]" bind:group={uploadMode} value="new" />
					新建分类
				</label>
			</div>
			<div class="mt-2">
				{#if uploadMode === "existing"}
					<select
						bind:value={uploadCategory}
						class="h-9 w-full max-w-xs rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
					>
						{#each categories as cat (cat)}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				{:else}
					<input
						type="text"
						bind:value={newCategory}
						placeholder="输入分类名，如：前端、生活、旅行"
						maxlength="40"
						class="h-9 w-full max-w-xs rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
					/>
				{/if}
			</div>
		</div>

		<!-- 拖拽选择区 -->
		<button
			type="button"
			class="flex min-h-[110px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-colors {dragActive
				? 'border-brand bg-brand/5'
				: 'border-border'}"
			disabled={uploading}
			onclick={() => uploadInputEl?.click()}
			ondragover={(e) => {
				e.preventDefault();
				dragActive = true;
			}}
			ondragleave={() => (dragActive = false)}
			ondrop={onDrop}
		>
			<svg class="h-6 w-6 text-brand/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M12 16V4m0 0L8 8m4-4 4 4" />
				<path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
			</svg>
			<span class="text-xs text-secondary">点击选择图片，或把图片拖到这里（可多选）</span>
			<span class="text-[10px] text-secondary/70">自动压缩为 WebP，GIF 保留原样</span>
		</button>
		<input
			bind:this={uploadInputEl}
			type="file"
			accept="image/*"
			multiple
			class="hidden"
			onchange={onPickChange}
		/>

		<!-- 已选缩略图 -->
		{#if picked.length > 0}
			<div class="mt-3">
				<p class="mb-2 text-xs text-secondary">已选择 {picked.length} 张</p>
				<div class="flex flex-wrap gap-2">
					{#each picked as p, i (p.file.name + i)}
						<div class="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-card shadow">
							<img src={p.dataUrl} alt="" class="h-full w-full object-cover" />
							{#if p.isGif}
								<span class="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] font-bold text-white">GIF</span>
							{/if}
							<button
								type="button"
								class="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-red-500"
								disabled={uploading}
								aria-label="移除"
								onclick={() => removePicked(i)}
							>
								×
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- 状态 -->
		{#if uploadError}
			<p class="mt-3 break-words text-xs text-red-500">{uploadError}</p>
		{/if}
		{#if uploadStatus}
			<p class="mt-3 break-words text-xs {uploadDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-secondary'}">
				{uploadStatus}
			</p>
		{/if}

		<!-- 按钮 -->
		<div class="mt-4 flex justify-end gap-2">
			{#if uploadDone}
				<button type="button" class="brand-btn text-xs" onclick={closeUpload}>完成</button>
			{:else}
				<button type="button" class="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10" disabled={uploading} onclick={closeUpload}>
					取消
				</button>
				<button
					type="button"
					class="brand-btn text-xs disabled:opacity-50"
					disabled={uploading || picked.length === 0}
					onclick={() => void doUpload()}
				>
					{uploading ? "上传中…" : `开始上传${picked.length ? `（${picked.length} 张）` : ""}`}
				</button>
			{/if}
		</div>
	</Modal>
{/if}

<style>
	button.active {
		color: var(--treasure-brand);
		background: color-mix(in srgb, var(--treasure-brand) 12%, transparent);
		font-weight: 600;
	}
</style>
