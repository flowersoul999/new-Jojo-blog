<script lang="ts">
import { onMount } from "svelte";
import Icon from "@/components/common/Icon.svelte";

// GitHub 用户信息
interface GithubUser {
	login: string;
	avatar_url: string;
	name: string | null;
}

// 文件/目录项类型
interface FileItem {
	name: string;
	path: string;
	type: "file" | "dir";
	sha: string;
	size: number;
}

// 文件内容响应
interface FileContent {
	path: string;
	content: string | null;
	sha: string;
	name: string;
	encoding?: string;
	base64Content?: string;
}

// 认证状态
let authenticated = false;
let user: GithubUser | null = null;
let checkingAuth = true;

// 编辑器开关
let open = false;

// 当前浏览路径（相对仓库根目录）
let currentPath = "src/content/posts";
// 文件列表
let files: FileItem[] = [];
// 面包屑路径段
let pathSegments: string[] = [];

// 当前打开的文件
let activeFile: FileContent | null = null;
let editingContent = "";
let originalSha = "";
let originalContent = "";
// 编辑模式：edit | preview
let mode: "edit" | "preview" = "edit";

let loading = false;
let saving = false;
let statusMsg = "";
let statusType: "info" | "success" | "error" = "info";

// marked 库是否已加载
let markedLoaded = false;

// 可编辑的文本文件扩展名
const TEXT_EXTENSIONS = [".md", ".mdx", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".css", ".styl", ".html", ".astro", ".yml", ".yaml", ".txt"];

// 判断是否为可编辑文本文件
function isEditable(name: string): boolean {
	return TEXT_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext));
}

// 判断是否为图片文件
function isImage(name: string): boolean {
	return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
}

// 检查认证状态
async function checkAuth() {
	checkingAuth = true;
	try {
		const res = await fetch("/api/auth/status/", { credentials: "same-origin" });
		const data = await res.json();
		authenticated = data.authenticated === true;
		user = data.user || null;
	} catch {
		authenticated = false;
		user = null;
	} finally {
		checkingAuth = false;
	}
}

// 加载文件列表
async function loadFiles(path = currentPath) {
	loading = true;
	statusMsg = "";
	try {
		const res = await fetch(`/api/content/list/?path=${encodeURIComponent(path)}`);
		if (!res.ok) throw new Error((await res.json()).error || "加载失败");
		const data = await res.json();
		files = Array.isArray(data) ? data : [];
		currentPath = path;
		pathSegments = path.split("/").filter(Boolean);
	} catch (e) {
		statusMsg = e instanceof Error ? e.message : "加载失败";
		statusType = "error";
		files = [];
	} finally {
		loading = false;
	}
}

// 读取文件
async function readFile(path: string, name: string) {
	if (!isEditable(name) && !isImage(name)) {
		statusMsg = `暂不支持编辑 ${name}`;
		statusType = "info";
		return;
	}
	loading = true;
	statusMsg = "";
	try {
		const res = await fetch(`/api/content/read/?path=${encodeURIComponent(path)}`);
		if (!res.ok) throw new Error((await res.json()).error || "读取失败");
		const data: FileContent = await res.json();
		activeFile = data;
		originalContent = data.content ?? "";
		editingContent = data.content ?? "";
		originalSha = data.sha;
		mode = "edit";
	} catch (e) {
		statusMsg = e instanceof Error ? e.message : "读取失败";
		statusType = "error";
	} finally {
		loading = false;
	}
}

// 保存文件
async function saveFile() {
	if (!activeFile) return;
	saving = true;
	statusMsg = "保存中...";
	statusType = "info";
	try {
		const res = await fetch("/api/content/write/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				path: activeFile.path,
				content: editingContent,
				sha: originalSha,
				message: `Update ${activeFile.name} via web editor`,
			}),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "保存失败");
		originalContent = editingContent;
		originalSha = data.commit?.sha || originalSha;
		statusMsg = "已保存并提交到 GitHub";
		statusType = "success";
		loadFiles();
	} catch (e) {
		statusMsg = e instanceof Error ? e.message : "保存失败";
		statusType = "error";
	} finally {
		saving = false;
	}
}

// 删除文件
async function deleteFile() {
	if (!activeFile) return;
	if (!confirm(`确定删除 ${activeFile.name} 吗？此操作不可恢复。`)) return;
	saving = true;
	statusMsg = "删除中...";
	statusType = "info";
	try {
		const res = await fetch("/api/content/delete/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ path: activeFile.path, sha: originalSha }),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "删除失败");
		activeFile = null;
		statusMsg = "已删除";
		statusType = "success";
		loadFiles();
	} catch (e) {
		statusMsg = e instanceof Error ? e.message : "删除失败";
		statusType = "error";
	} finally {
		saving = false;
	}
}

// 新建文件
async function newFile() {
	const name = prompt("请输入文件名（可包含子目录，如 notes/my-post.md）：");
	if (!name) return;
	const fullPath = `${currentPath}/${name}`.replace(/\/+/g, "/");
	const exists = files.some((f) => f.path === fullPath);
	if (exists) {
		statusMsg = "文件已存在";
		statusType = "error";
		return;
	}
	activeFile = {
		path: fullPath,
		name: name.split("/").pop() || name,
		content: "",
		sha: "",
	};
	editingContent = "";
	originalContent = "";
	originalSha = "";
	mode = "edit";
	statusMsg = "新文件，保存时会创建";
	statusType = "info";
}

// 退出登录
async function logout() {
	await fetch("/api/auth/logout/", { method: "POST" });
	open = false;
	authenticated = false;
	user = null;
}

// 渲染 Markdown 预览
function renderPreview(): string {
	if (!markedLoaded || typeof (window as any).marked === "undefined") {
		return editingContent;
	}
	try {
		return (window as any).marked.parse(editingContent);
	} catch {
		return editingContent;
	}
}

// 跳转到父目录
function goToParent() {
	if (pathSegments.length <= 1) {
		loadFiles("");
	} else {
		loadFiles(pathSegments.slice(0, -1).join("/"));
	}
}

// 跳转到指定目录段
function goToSegment(index: number) {
	loadFiles(pathSegments.slice(0, index + 1).join("/"));
}

onMount(() => {
	checkAuth().then(() => {
		if (authenticated) {
			loadFiles();
		}
	});
	// 动态加载 marked 用于预览
	if (typeof (window as any).marked === "undefined") {
		const script = document.createElement("script");
		script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
		script.onload = () => {
			markedLoaded = true;
		};
		document.head.appendChild(script);
	} else {
		markedLoaded = true;
	}
});
</script>

<!-- 认证检查中不显示任何内容 -->
{#if !checkingAuth}
	{#if user}
		<!-- 已登录：写文章 + 内容管理 浮动按钮组（未登录不显示浮动入口） -->
		{#if !open}
			<div class="fixed bottom-6 left-6 z-[100] flex flex-col items-start gap-2">
				<a
					href="/write/"
					class="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105"
					style="background: linear-gradient(135deg, hsl(var(--hue,250),65%,55%) 0%, hsl(calc(var(--hue,250) + 40), 70%, 55%) 100%);"
				>
					<Icon icon="material-symbols:edit-square" class="text-lg" />
					<span>写文章</span>
				</a>
				<button
					class="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105 dark:bg-white dark:text-gray-900"
					on:click={() => (open = true)}
					aria-label="打开内容编辑器"
				>
					<Icon icon="material-symbols:edit-note" class="text-lg" />
					<span>内容管理</span>
				</button>
			</div>
		{/if}

		<!-- 编辑器全屏面板 -->
		{#if open}
			<div
				class="fixed inset-0 z-[200] flex flex-col bg-[var(--page-bg,#fff)] dark:bg-[#1a1a1a] text-[color:var(--ink,#202124)] dark:text-white"
			>
				<!-- 顶部栏 -->
				<header class="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
					<div class="flex items-center gap-3">
						<button
							class="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10"
							on:click={() => (open = false)}
							aria-label="关闭编辑器"
						>
							<Icon icon="material-symbols:close" class="text-xl" />
						</button>
						<h2 class="text-lg font-bold">内容编辑器</h2>
						{#if activeFile}
							<span class="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
								{activeFile.path}
							</span>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						<img src={user.avatar_url} alt={user.login} class="h-7 w-7 rounded-full" />
						<span class="text-sm">{user.name || user.login}</span>
						<button
							class="rounded-lg border border-black/10 px-3 py-1.5 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
							on:click={logout}
						>
							退出登录
						</button>
					</div>
				</header>

				<!-- 主体区域 -->
				<div class="flex flex-1 overflow-hidden">
					<!-- 左侧文件树 -->
					<aside class="flex w-64 shrink-0 flex-col border-r border-black/10 dark:border-white/10">
						<!-- 面包屑导航 -->
						<div class="flex items-center gap-1 overflow-x-auto border-b border-black/10 px-3 py-2 text-sm dark:border-white/10">
							<button
								class="shrink-0 rounded px-1.5 py-0.5 hover:bg-black/5 dark:hover:bg-white/10"
								on:click={() => loadFiles("")}
							>
								<Icon icon="material-symbols:home" class="text-base" />
							</button>
							{#if pathSegments.length > 1}
								<button
									class="shrink-0 rounded px-1.5 py-0.5 hover:bg-black/5 dark:hover:bg-white/10"
									on:click={goToParent}
								>
									<Icon icon="material-symbols:arrow-upward" class="text-base" />
								</button>
							{/if}
							{#each pathSegments as seg, i}
								<span class="text-black/30 dark:text-white/30">/</span>
								<button
									class="shrink-0 rounded px-1.5 py-0.5 hover:bg-black/5 dark:hover:bg-white/10"
									on:click={() => goToSegment(i)}
								>
									{seg}
								</button>
							{/each}
						</div>

						<!-- 操作按钮 -->
						<div class="flex gap-2 px-3 py-2">
							<button
								class="flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-white hover:opacity-90"
								style="background: hsl(var(--hue,250),65%,55%);"
								on:click={newFile}
							>
								<Icon icon="material-symbols:add" class="inline text-base" /> 新建
							</button>
							<button
								class="rounded-lg border border-black/10 px-2 py-1.5 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
								on:click={() => loadFiles()}
								aria-label="刷新"
							>
								<Icon icon="material-symbols:refresh" class="text-base" />
							</button>
						</div>

						<!-- 文件列表 -->
						<div class="flex-1 overflow-y-auto px-1 pb-2">
							{#if loading}
								<div class="px-3 py-6 text-center text-sm text-black/40 dark:text-white/40">加载中...</div>
							{:else if files.length === 0}
								<div class="px-3 py-6 text-center text-sm text-black/40 dark:text-white/40">空目录</div>
							{:else}
								{#each files as file}
									<button
										class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
										on:click={() => (file.type === "dir" ? loadFiles(file.path) : readFile(file.path, file.name))}
									>
										<Icon
											icon={file.type === "dir" ? "material-symbols:folder" : isImage(file.name) ? "material-symbols:image" : "material-symbols:description"}
											class={(file.type === "dir" ? "text-[#f5a623]" : "") + " shrink-0"}
										/>
										<span class="truncate">{file.name}</span>
										{#if file.type === "file" && !isEditable(file.name) && !isImage(file.name)}
											<span class="ml-auto text-[10px] text-black/30 dark:text-white/30">只读</span>
										{/if}
									</button>
								{/each}
							{/if}
						</div>
					</aside>

					<!-- 右侧编辑区 -->
					<main class="flex flex-1 flex-col overflow-hidden">
						{#if !activeFile}
							<div class="flex flex-1 items-center justify-center text-black/40 dark:text-white/40">
								<div class="text-center">
									<Icon icon="material-symbols:edit-document" class="text-5xl" />
									<p class="mt-3">从左侧选择一个文件开始编辑</p>
								</div>
							</div>
						{:else if activeFile.encoding === "base64" && activeFile.content === null}
							<!-- 二进制文件预览 -->
							<div class="flex flex-1 items-center justify-center p-4">
								{#if isImage(activeFile.name)}
									<img
										src={`data:image/${activeFile.name.split(".").pop()};base64,${activeFile.base64Content}`}
										alt={activeFile.name}
										class="max-h-full max-w-full rounded-lg shadow-lg"
									/>
								{:else}
									<div class="text-center text-black/40 dark:text-white/40">
										<Icon icon="material-symbols:file-present" class="text-5xl" />
										<p class="mt-3">{activeFile.name} 是二进制文件</p>
									</div>
								{/if}
							</div>
						{:else}
							<!-- 工具栏 -->
							<div class="flex items-center gap-2 border-b border-black/10 px-4 py-2 dark:border-white/10">
								<button
									class="rounded-lg px-3 py-1 text-sm font-semibold {mode === 'edit' ? 'bg-black/5 dark:bg-white/10' : ''}"
									on:click={() => (mode = "edit")}
								>
									编辑
								</button>
								<button
									class="rounded-lg px-3 py-1 text-sm font-semibold {mode === 'preview' ? 'bg-black/5 dark:bg-white/10' : ''}"
									on:click={() => (mode = "preview")}
								>
									预览
								</button>
								<div class="flex-1"></div>
								<button
									class="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10"
									on:click={deleteFile}
									disabled={saving}
								>
									删除
								</button>
								<button
									class="rounded-lg px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
									style="background: hsl(var(--hue,250),65%,55%);"
									on:click={saveFile}
									disabled={saving || editingContent === originalContent}
								>
									{saving ? "保存中..." : "保存到 GitHub"}
								</button>
							</div>

							<!-- 编辑 / 预览区 -->
							<div class="flex-1 overflow-hidden">
								{#if mode === "edit"}
									<textarea
										bind:value={editingContent}
										class="h-full w-full resize-none bg-transparent p-4 font-mono text-sm outline-none"
										spellcheck="false"
										placeholder="在这里输入内容..."
									></textarea>
								{:else}
									<div class="prose-custom h-full overflow-y-auto p-6">
										{@html renderPreview()}
									</div>
								{/if}
							</div>
						{/if}
					</main>
				</div>

				<!-- 状态栏 -->
				{#if statusMsg}
					<div
						class="border-t border-black/10 px-4 py-2 text-sm dark:border-white/10 {statusType === 'success' ? 'text-green-500' : statusType === 'error' ? 'text-red-500' : 'text-black/60 dark:text-white/60'}"
					>
						{statusMsg}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
{/if}

<style>
.prose-custom :global(h1) { font-size: 2em; font-weight: 700; margin: 0.67em 0; }
.prose-custom :global(h2) { font-size: 1.5em; font-weight: 700; margin: 0.75em 0; }
.prose-custom :global(h3) { font-size: 1.17em; font-weight: 700; margin: 0.83em 0; }
.prose-custom :global(p) { margin: 1em 0; line-height: 1.7; }
.prose-custom :global(ul), .prose-custom :global(ol) { padding-left: 1.5em; margin: 1em 0; }
.prose-custom :global(li) { margin: 0.3em 0; }
.prose-custom :global(code) { background: rgba(0,0,0,0.06); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.85em; }
.prose-custom :global(pre) { background: #1e1e1e; color: #e0e0e0; padding: 1em; border-radius: 8px; overflow-x: auto; }
.prose-custom :global(pre code) { background: none; padding: 0; color: inherit; }
.prose-custom :global(blockquote) { border-left: 3px solid hsl(var(--hue,250),65%,55%); padding-left: 1em; color: rgba(0,0,0,0.6); margin: 1em 0; }
.prose-custom :global(a) { color: hsl(var(--hue,250),65%,55%); text-decoration: underline; }
.prose-custom :global(img) { max-width: 100%; border-radius: 8px; }
.prose-custom :global(table) { border-collapse: collapse; margin: 1em 0; }
.prose-custom :global(th), .prose-custom :global(td) { border: 1px solid rgba(0,0,0,0.1); padding: 0.5em 1em; }
</style>
