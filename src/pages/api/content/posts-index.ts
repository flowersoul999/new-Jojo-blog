import type { APIRoute } from "astro";
import { buildPostsIndex, type PostsIndex } from "@/utils/content-index";
import {
	GITHUB_REPO,
	isLocalDev,
	listLocalDirRecursive,
	readLocalFile,
	requireAuth,
} from "@/utils/editor-auth";

export const prerender = false;

// ---------------------------------------------------------------------------
// GET /api/content/posts-index/
// 一次请求同时服务「文章模块列表」与「图片模块引用徽标」：
//   { "posts": [{ slug, path, title, published, draft, pinned, pinnedOrder,
//                 category, tags, updated, image }],
//     "imageRefs": { "/blogs/技术总结/fe-fund-html.jpg": ["技术总结"] } }
// 目录不存在时返回 posts: []（不报错），DEV 以本地为准、线上以 GitHub 为准。
// ---------------------------------------------------------------------------

// 服务端 60s 内存缓存，避免 posts-index 的 N+1 次 GitHub 读请求打满 API 配额
let cacheTs = 0;
let cacheData: PostsIndex | null = null;
const CACHE_TTL = 60_000;

// 将 base64 字符串解码为 UTF-8 字符串
function decodeBase64(base64: string): string {
	const binary = atob(base64.replace(/\n/g, ""));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new TextDecoder("utf-8").decode(bytes);
}

/** 列出 src/content/posts 下的 md/mdx 文件（扁平列表，含仓库相对路径） */
async function listPostFiles(
	token: string,
): Promise<Array<{ path: string; name?: string }>> {
	if (isLocalDev) {
		return listLocalDirRecursive("src/content/posts");
	}

	const { owner, name, branch } = GITHUB_REPO;
	const treeResponse = await fetch(
		`https://api.github.com/repos/${owner}/${name}/git/trees/${branch}?recursive=1`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github+json",
				"User-Agent": "Aemeath-Blog",
			},
		},
	);
	if (!treeResponse.ok) {
		throw new Error(`GitHub 文件树请求失败：HTTP ${treeResponse.status}`);
	}
	const treeData = await treeResponse.json();
	if (treeData.truncated) {
		throw new Error("仓库文件树过大，GitHub 截断了结果");
	}

	const prefix = "src/content/posts/";
	const items: Array<{ path: string; name: string }> = [];
	for (const entry of treeData.tree || []) {
		if (entry.type !== "blob") continue;
		if (!entry.path.startsWith(prefix)) continue;
		const rel = entry.path.slice(prefix.length);
		if (!rel) continue;
		items.push({ path: entry.path, name: rel.split("/").pop() || rel });
	}
	return items;
}

/** 读取单个文章文件（本地 fs 或 GitHub Contents API），失败返回 content: null */
async function readPostFile(
	token: string,
	filePath: string,
): Promise<{ content: string | null }> {
	if (isLocalDev) {
		try {
			const res = readLocalFile(filePath);
			return { content: typeof res.content === "string" ? res.content : null };
		} catch {
			return { content: null };
		}
	}

	const { owner, name, branch } = GITHUB_REPO;
	const response = await fetch(
		`https://api.github.com/repos/${owner}/${name}/contents/${filePath}?ref=${branch}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github+json",
				"User-Agent": "Aemeath-Blog",
			},
		},
	);
	if (!response.ok) return { content: null };
	const data = await response.json();
	const content =
		data.encoding === "base64" && data.content
			? decodeBase64(data.content)
			: (data.content ?? null);
	return { content };
}

export const GET: APIRoute = async ({ cookies, url }) => {
	// 认证检查
	let token: string;
	try {
		token = requireAuth(cookies);
	} catch (error) {
		const message = error instanceof Error ? error.message : "认证失败";
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	// ?refresh=1 手动失效缓存（写文章/删文章后由前端调用）
	const refresh = url.searchParams.get("refresh") === "1";
	if (!refresh && cacheData && Date.now() - cacheTs < CACHE_TTL) {
		return new Response(JSON.stringify(cacheData), {
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const files = await listPostFiles(token);
		const index = await buildPostsIndex(files, (p) => readPostFile(token, p));
		cacheTs = Date.now();
		cacheData = index;
		return new Response(JSON.stringify(index), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "未知错误";
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
