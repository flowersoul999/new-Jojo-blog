<script lang="ts">
/**
 * 导航栏账号控件
 * - 未登录：显示「GitHub 登录」按钮，跳转 /api/auth/login/ 走 OAuth 授权
 * - 已登录：显示头像，点击展开菜单（写文章 / 内容管理 / 退出登录）
 * variant 适配桌面端（紧凑按钮）与移动端菜单（整行列表）两种形态。
 */
import { onMount } from "svelte";

interface GithubUser {
	login: string;
	avatar_url: string;
	name: string | null;
}

interface Props {
	variant?: "desktop" | "mobile";
}

let { variant = "desktop" }: Props = $props();

// 认证状态
let authenticated = $state(false);
let user = $state<GithubUser | null>(null);
let open = $state(false);

// GitHub 品牌图标路径（内联，避免依赖构建期图标扫描）
const GITHUB_PATH =
	"M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z";

// 检查认证状态
async function checkAuth() {
	try {
		const res = await fetch("/api/auth/status/", { credentials: "same-origin" });
		const data = await res.json();
		authenticated = data.authenticated === true;
		user = data.user ?? null;
	} catch {
		authenticated = false;
		user = null;
	}
}

onMount(() => {
	void checkAuth();

	// 点击组件外部时收起菜单
	const onDocClick = (e: MouseEvent) => {
		if (!(e.target instanceof Element)) return;
		if (!e.target.closest("[data-nav-account]")) open = false;
	};
	document.addEventListener("click", onDocClick);
	return () => document.removeEventListener("click", onDocClick);
});

// 打开内容管理面板（ContentEditor 监听该事件）
function openManager() {
	open = false;
	window.dispatchEvent(new CustomEvent("content-editor:open"));
}

// 退出登录
async function logout() {
	open = false;
	await fetch("/api/auth/logout/", { method: "POST", credentials: "same-origin" });
	location.reload();
}

const displayName = $derived(user?.name || user?.login || "");
</script>

{#if variant === "desktop"}
	{#if !authenticated}
		<a
			href="/api/auth/login/"
			class="theme-btn btn-plain scale-animation h-11 gap-1.5 rounded-lg px-3 text-sm font-semibold active:scale-90"
			title="使用 GitHub 登录"
			aria-label="使用 GitHub 登录"
		>
			<svg class="h-[1.1rem] w-[1.1rem]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d={GITHUB_PATH} />
			</svg>
			<span class="hidden sm:inline">登录</span>
		</a>
	{:else}
		<div class="relative" data-nav-account>
			<button
				type="button"
				class="btn-plain scale-animation h-11 rounded-full active:scale-90"
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label="账号菜单"
				onclick={() => (open = !open)}
			>
				<img
					src={user?.avatar_url}
					alt={displayName}
					class="h-9 w-9 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/20"
				/>
			</button>

			{#if open}
				<div
					class="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-black/5 bg-(--card-bg) p-1.5 shadow-xl dark:border-white/10"
					role="menu"
				>
					<div class="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
						<img src={user?.avatar_url} alt="" class="h-8 w-8 rounded-full object-cover" />
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold">{displayName}</p>
							<p class="truncate text-xs text-black/50 dark:text-white/50">@{user?.login}</p>
						</div>
					</div>
					<div class="my-1 h-px bg-black/5 dark:bg-white/10"></div>
					<a
						href="/write/"
						class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
						role="menuitem"
					>
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
						</svg>
						写文章
					</a>
					<button
						type="button"
						class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
						onclick={openManager}
						role="menuitem"
					>
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
						</svg>
						内容管理
					</button>
					<button
						type="button"
						class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-red-500 hover:bg-red-500/10"
						onclick={logout}
						role="menuitem"
					>
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
						</svg>
						退出登录
					</button>
				</div>
			{/if}
		</div>
	{/if}
{:else}
	<div class="mt-4 border-t border-black/10 pt-3 dark:border-white/10" data-nav-account>
		{#if !authenticated}
			<a
				href="/api/auth/login/"
				data-mobile-menu-close
				class="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
				style="background:#24292f;"
			>
				<svg class="h-[1.1rem] w-[1.1rem]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d={GITHUB_PATH} />
				</svg>
				使用 GitHub 登录
			</a>
		{:else}
			<div class="flex items-center gap-3 px-1 pb-2">
				<img src={user?.avatar_url} alt="" class="h-10 w-10 rounded-full object-cover" />
				<div class="min-w-0">
					<p class="truncate text-sm font-semibold">{displayName}</p>
					<p class="truncate text-xs text-black/50 dark:text-white/50">@{user?.login}</p>
				</div>
			</div>
			<a
				href="/write/"
				data-mobile-menu-close
				class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
				</svg>
				写文章
			</a>
			<button
				type="button"
				data-mobile-menu-close
				class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
				onclick={openManager}
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
				</svg>
				内容管理
			</button>
			<button
				type="button"
				data-mobile-menu-close
				class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-red-500 hover:bg-red-500/10"
				onclick={logout}
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
				</svg>
				退出登录
			</button>
		{/if}
	</div>
{/if}