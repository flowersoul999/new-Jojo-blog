<script lang="ts">
/**
 * 文章管理模块：列表 / 状态筛选 / 新建 / 编辑 / 删除
 * 数据源：GET /api/content/posts-index/（含 60s 服务端缓存，删除后带 refresh=1 重新拉取）
 */
import { onMount } from "svelte";

interface PostItem {
	slug: string;
	path: string;
	title: string;
	published: string;
	draft: boolean;
	pinned: boolean;
	pinnedOrder: number | null;
	category: string;
	tags: string[];
	updated: string;
	image: string;
}

// ---- 状态 ----
let posts = $state<PostItem[]>([]);
let loading = $state(true);
let error = $state("");
let deleting = $state(false);

// 筛选：all | draft | published | pinned
let filter = $state<"all" | "draft" | "published" | "pinned">("all");

const FILTERS = [
	{ id: "all", label: "全部" },
	{ id: "draft", label: "草稿" },
	{ id: "published", label: "已发布" },
	{ id: "pinned", label: "已置顶" },
] as const;

// ---- 数据加载 ----
async function loadPosts(refresh = false) {
	loading = true;
	error = "";
	try {
		const res = await fetch(
			`/api/content/posts-index/${refresh ? "?refresh=1" : ""}`,
			{ credentials: "same-origin" },
		);
		if (!res.ok) throw new Error(`请求失败：HTTP ${res.status}`);
		const data = await res.json();
		posts = data.posts ?? [];
	} catch (e) {
		error = e instanceof Error ? e.message : "加载失败";
	} finally {
		loading = false;
	}
}

onMount(() => {
	void loadPosts();
});

const visiblePosts = $derived.by(() => {
	let list = posts;
	if (filter === "draft") list = posts.filter((p) => p.draft);
	else if (filter === "published") list = posts.filter((p) => !p.draft);
	else if (filter === "pinned") list = posts.filter((p) => p.pinned);
	return [...list].sort((a, b) =>
		a.published === b.published
			? a.slug.localeCompare(b.slug)
			: b.published.localeCompare(a.published),
	);
});

const filterCounts = $derived({
	all: posts.length,
	draft: posts.filter((p) => p.draft).length,
	published: posts.filter((p) => !p.draft).length,
	pinned: posts.filter((p) => p.pinned).length,
});

// ---- 删除 ----
async function deletePost(post: PostItem) {
	const sure = window.confirm(
		`确定删除文章《${post.title}》吗？\n文件：${post.path}\n\n若文章中引用了 /blogs/ 下的图片，请到「图片」模块一并清理。`,
	);
	if (!sure) return;
	deleting = true;
	try {
		const res = await fetch("/api/content/delete/", {
			method: "POST",
			credentials: "same-origin",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ path: post.path }),
		});
		if (!res.ok) throw new Error(`删除失败：HTTP ${res.status}`);
		await loadPosts(true);
	} catch (e) {
		alert(e instanceof Error ? e.message : "删除失败");
	} finally {
		deleting = false;
	}
}
</script>

<!-- 工具栏：筛选 + 新建 -->
<div class="mb-4 flex flex-wrap items-center gap-2">
	<div class="flex flex-wrap gap-1.5">
		{#each FILTERS as f}
			<button
				type="button"
				class:active={filter === f.id}
				class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-brand/10 active:bg-brand/10"
				onclick={() => (filter = f.id)}
			>
				{f.label}
				<span class="rounded-full bg-black/5 px-1.5 text-[10px] text-secondary dark:bg-white/10">
					{filterCounts[f.id]}
				</span>
			</button>
		{/each}
	</div>
	<a href="/write/" class="brand-btn ml-auto gap-1.5 text-xs">
		<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M12 5v14M5 12h14" />
		</svg>
		新建文章
	</a>
</div>

<!-- 加载态 -->
{#if loading}
	<div class="card flex items-center justify-center gap-3 p-10 text-sm text-secondary">
		<span class="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand"></span>
		正在加载文章列表…
	</div>
{:else if error}
	<div class="card flex flex-col items-center gap-3 p-10 text-center">
		<p class="text-sm text-red-500">{error}</p>
		<p class="text-xs text-secondary">
			本地开发读取 src/content/posts；线上以 GitHub 仓库为准
		</p>
		<button
			type="button"
			class="brand-btn mt-1 text-xs"
			onclick={() => void loadPosts()}
		>
			重试
		</button>
	</div>
{:else if visiblePosts.length === 0}
	<div class="card flex flex-col items-center gap-3 p-12 text-center">
		<svg class="h-10 w-10 text-brand/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M4 4h16v16H4zM4 8h16M8 4v4" />
		</svg>
		{#if posts.length === 0}
			<p class="text-sm text-secondary">本地/仓库暂无文章，点「新建文章」发布第一篇</p>
		{:else}
			<p class="text-sm text-secondary">当前筛选下没有文章</p>
		{/if}
		<a href="/write/" class="brand-btn mt-1 gap-1.5 text-xs">
			<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M12 5v14M5 12h14" />
			</svg>
			新建文章
		</a>
	</div>
{:else}
	<ul class="card flex flex-col divide-y divide-border overflow-hidden">
		{#each visiblePosts as post}
			<li class="flex items-center gap-4 p-3.5 transition-colors hover:bg-brand/5">
				<!-- 封面缩略图（统一 16:10） -->
				<a
					href={`/write/?edit=${encodeURIComponent(post.slug)}`}
					class="relative block aspect-[16/10] w-36 shrink-0 overflow-hidden rounded-lg bg-brand/10"
					title={`编辑《${post.title}》`}
				>
					{#if post.image}
						<img
							src={post.image}
							alt=""
							class="h-full w-full object-cover"
							loading="lazy"
							decoding="async"
						/>
					{:else}
						<div class="flex h-full w-full items-center justify-center">
							<svg class="h-6 w-6 text-brand/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.4-9A2 2 0 0 0 12 5.6L5.6 12H3l1 4 4-1 6.4-6.4a2 2 0 0 0 0-2.8L20.6 5.4a2 2 0 0 0 0-2.8Z" />
							</svg>
						</div>
					{/if}
				</a>

				<!-- 标题 + 元信息 -->
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-center gap-2">
						<a
							href={`/write/?edit=${encodeURIComponent(post.slug)}`}
							class="truncate text-sm font-semibold hover:text-brand"
							title={post.title}
						>
							{post.title || post.slug}
						</a>
						{#if post.pinned}
							<span class="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand">
								置顶{#if post.pinnedOrder != null} #{post.pinnedOrder}{/if}
							</span>
						{/if}
						{#if post.draft}
							<span class="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
								草稿
							</span>
						{:else}
							<span class="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
								已发布
							</span>
						{/if}
					</div>
					<p class="mt-1 truncate text-xs text-secondary">{post.slug}.md</p>
					<div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-secondary">
						{#if post.category}<span class="font-medium text-brand">{post.category}</span>{/if}
						<span>{post.published}</span>
						{#if post.updated}<span>更新于 {post.updated}</span>{/if}
						{#each post.tags as tag}<span class="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">{tag}</span>{/each}
					</div>
				</div>

				<!-- 操作 -->
				<div class="flex shrink-0 items-center gap-1.5">
					<a
						href={`/write/?edit=${encodeURIComponent(post.slug)}`}
						class="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-brand/10 hover:text-brand"
					>
						编辑
					</a>
					<button
						type="button"
						class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
						disabled={deleting}
						onclick={() => void deletePost(post)}
					>
						删除
					</button>
				</div>
			</li>
		{/each}
	</ul>
{/if}

<style>
	button.active {
		color: var(--treasure-brand);
		background: color-mix(in srgb, var(--treasure-brand) 12%, transparent);
		font-weight: 600;
	}
</style>
