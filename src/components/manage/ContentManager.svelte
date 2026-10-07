<script lang="ts">
/**
 * 内容管理中枢（/manage/）
 * - 认证守卫：未登录显示 GitHub 登录引导
 * - 侧边栏模块导航（分组）：内容 / 面试 / 项目
 * - 文章 → PostManager；相册 → GalleryManager；日记 → DiaryManager；
 *   其余集合（回忆/面经/八股/Hot100/手撕/项目）→ CollectionManager（schema 驱动）
 */
import { onMount } from "svelte";
import GalleryManager from "./GalleryManager.svelte";
import PostManager from "./PostManager.svelte";
import DiaryManager from "./DiaryManager.svelte";
import CollectionManager from "./CollectionManager.svelte";
import { COLLECTION_CONFIGS, type CollectionConfig } from "./collection-config";

interface GithubUser {
	login: string;
	avatar_url: string;
	name: string | null;
}

interface ModuleItem {
	id: string;
	label: string;
	desc: string;
	icon: string;
}

interface ModuleGroup {
	label: string;
	items: ModuleItem[];
}

// ---- 模块分组（侧边栏） ----
const GROUPS: ModuleGroup[] = [
	{
		label: "内容",
		items: [
			{
				id: "posts",
				label: "文章",
				desc: "创建、编辑、发布与删除博客文章",
				icon: "M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.4-9A2 2 0 0 0 12 5.6L5.6 12H3l1 4 4-1 6.4-6.4a2 2 0 0 0 0-2.8L20.6 5.4a2 2 0 0 0 0-2.8Z",
			},
			{
				id: "diary",
				label: "日记",
				desc: "管理公开与私密日记（public/diary/index.json）",
				icon: "M4 5h16v14H4zM8.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM4 15l4-4 3 3 4-4 5 5",
			},
			{
				id: "memories",
				label: "回忆",
				desc: "管理日记回忆条目（封面 + 标题/日期/摘要 + 长文）",
				icon: "M12 21s-8-4.5-8-11a4 4 0 0 1 8-2 4 4 0 0 1 8 2c0 6.5-8 11-8 11Z",
			},
			{
				id: "gallery",
				label: "相册",
				desc: "管理相册、照片元信息与封面",
				icon: "M3 7a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm5 5a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z",
			},
		],
	},
	{
		label: "面试",
		items: [
			{
				id: "interviews",
				label: "面经",
				desc: "管理面试复盘（公司 / 岗位 / 轮次 / 结果 / 被问到的题）",
				icon: "M4 5h16v14H4zM8 9h8M8 13h5M8 17h8",
			},
			{
				id: "questions",
				label: "八股",
				desc: "管理八股文知识点（答案即正文，默认折叠便于自测）",
				icon: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
			},
			{
				id: "hot100",
				label: "Hot100",
				desc: "管理 LeetCode Hot100 题解（思路与代码进正文）",
				icon: "M5 3v18l15-9zM19 3v18",
			},
			{
				id: "handcraft",
				label: "手撕",
				desc: "管理手撕题（手写代码 / 场景设计）",
				icon: "M7 2h10l3 7-8 13L4 9z",
			},
		],
	},
	{
		label: "项目",
		items: [
			{
				id: "projects",
				label: "项目",
				desc: "管理项目页条目（方案与复盘进正文）",
				icon: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
			},
		],
	},
];

const ALL_ITEMS: ModuleItem[] = GROUPS.flatMap((g) => g.items);

// ---- 认证状态 ----
let authenticated = $state(false);
let checkingAuth = $state(true);
let user = $state<GithubUser | null>(null);

// ---- 模块切换（基于 URL ?module=，深链安全）----
function moduleFromUrl(): string {
	if (typeof window === "undefined") return "posts"; // SSR 阶段无 location
	const p = new URLSearchParams(location.search).get("module");
	return p && ALL_ITEMS.some((m) => m.id === p) ? p : "posts";
}

let activeModule = $state("posts");

function switchModule(id: string) {
	activeModule = id;
	const u = new URL(location.href);
	u.searchParams.set("module", id);
	history.replaceState(null, "", u.pathname + u.search);
	window.scrollTo({ top: 0 });
}

// 当前激活的集合配置（回忆/面经/八股/Hot100/手撕/项目 命中）
const activeConfig = $derived<CollectionConfig | undefined>(
	COLLECTION_CONFIGS[activeModule],
);

// ---- 认证检查 ----
async function checkAuth() {
	try {
		const res = await fetch("/api/auth/status/", {
			credentials: "same-origin",
		});
		const data = await res.json();
		authenticated = data.authenticated === true;
		user = data.user ?? null;
	} catch {
		authenticated = false;
		user = null;
	}
	checkingAuth = false;
}

onMount(() => {
	activeModule = moduleFromUrl();
	void checkAuth();
});
</script>

{#if checkingAuth}
	<div class="flex min-h-screen items-center justify-center p-5">
		<div class="card flex items-center gap-3 px-5 py-4 text-sm text-secondary">
			<span class="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand"></span>
			正在检查登录状态…
		</div>
	</div>
{:else if !authenticated}
	<div class="flex min-h-screen items-center justify-center p-5">
		<div class="card w-full max-w-md p-8 text-center">
			<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-2xl">
				<svg class="h-7 w-7 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.4-9A2 2 0 0 0 12 5.6L5.6 12H3l1 4 4-1 6.4-6.4a2 2 0 0 0 0-2.8L20.6 5.4a2 2 0 0 0 0-2.8Z" />
				</svg>
			</div>
			<h1 class="text-lg font-bold">内容管理</h1>
			<p class="mt-2 text-sm text-secondary">
				需要登录 GitHub 才能管理文章、日记、相册与面试/项目内容
			</p>
			<a
				href="/api/auth/login/"
				class="brand-btn mt-6 w-full justify-center gap-2"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305 1.23-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
				</svg>
				使用 GitHub 登录
			</a>
		</div>
	</div>
{:else}
	<div class="mx-auto flex w-full max-w-6xl gap-5 px-5 py-6">
		<!-- 侧边栏：分组模块导航 + 账号信息 -->
		<aside class="card sticky top-20 h-fit w-56 shrink-0 p-3">
			<nav class="flex flex-col gap-3">
				{#each GROUPS as group}
					<div class="flex flex-col gap-1">
						<p class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-secondary/70">{group.label}</p>
						{#each group.items as m}
							<button
								type="button"
								class:active={activeModule === m.id}
								class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-brand/10 active:bg-brand/10"
								onclick={() => switchModule(m.id)}
							>
								<svg class="h-[1.1rem] w-[1.1rem] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									<path d={m.icon} />
								</svg>
								<span>{m.label}</span>
							</button>
						{/each}
					</div>
				{/each}
			</nav>

			<div class="mt-3 border-t border-border pt-3">
				<div class="flex items-center gap-2.5 px-2 py-1.5">
					<img
						src={user?.avatar_url}
						alt=""
						class="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border"
					/>
					<div class="min-w-0">
						<p class="truncate text-xs font-semibold">{user?.name || user?.login}</p>
						<p class="truncate text-[11px] text-secondary">@{user?.login}</p>
					</div>
				</div>
				<a
					href="/write/"
					class="brand-btn mt-2 w-full gap-2 text-xs"
				>
					<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
					</svg>
					写文章
				</a>
			</div>
		</aside>

		<!-- 主内容区 -->
		<main class="min-w-0 flex-1">
			<div class="mb-5">
				<h1 class="text-xl font-bold">内容管理</h1>
				<p class="mt-1 text-sm text-secondary">
					{ALL_ITEMS.find((m) => m.id === activeModule)?.desc}
				</p>
			</div>

			{#if activeModule === "posts"}
				<PostManager />
			{:else if activeModule === "gallery"}
				<GalleryManager />
			{:else if activeModule === "diary"}
				<DiaryManager />
			{:else if activeConfig}
				<CollectionManager config={activeConfig} />
			{:else}
				<div class="card flex flex-col items-center gap-3 p-12 text-center">
					<svg class="h-8 w-8 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M12 21s-8-4.5-8-11a4 4 0 0 1 8-2 4 4 0 0 1 8 2c0 6.5-8 11-8 11Z" />
					</svg>
					<p class="text-sm text-secondary">该模块暂未接入</p>
				</div>
			{/if}
		</main>
	</div>
{/if}

<style>
	nav button.active {
		color: var(--treasure-brand);
		background: color-mix(in srgb, var(--treasure-brand) 12%, transparent);
		font-weight: 600;
	}
</style>
