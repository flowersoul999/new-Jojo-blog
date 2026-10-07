import type { APIRoute } from "astro";
import { parseFrontmatter } from "@/utils/collection-frontmatter";
import {
	GITHUB_REPO,
	isLocalDev,
	listLocalDirRecursive,
	readLocalFile,
	requireAuth,
} from "@/utils/editor-auth";

export const prerender = false;

// ---------------------------------------------------------------------------
// GET /api/content/collection-index/?dir=src/content/interviews[&refresh=1]
// 通用集合索引：列出某 src/content/<collection> 目录下所有 md/mdx，
// 解析 frontmatter（纯语法，类型语义交给前端字段配置），一次请求返回
// { items: [{ slug, path, data, body }] }，供管理台列表 / 编辑回填用。
// 按 dir 维度做 60s 内存缓存，避免 N 次读请求打满 GitHub API 配额。
// ---------------------------------------------------------------------------

const CACHE_TTL = 60_000;
const cache = new Map<string, { ts: number; data: unknown }>();

function decodeBase64Utf8(base64: string): string {
	const binary = atob(base64.replace(/\n/g, ""));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new TextDecoder("utf-8").decode(bytes);
}

async function listCollectionFiles(
	token: string,
	dir: string,
): Promise<Array<{ path: string; name: string }>> {
	if (isLocalDev) {
		return listLocalDirRecursive(dir).map((f) => ({
			path: f.path,
			name: f.path.split("/").pop() || f.path,
		}));
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
	const prefix = dir.replace(/^\/+/, "").replace(/\/+$/, "");
	const items: Array<{ path: string; name: string }> = [];
	for (const entry of treeData.tree || []) {
		if (entry.type !== "blob") continue;
		if (!entry.path.startsWith(`${prefix}/`)) continue;
		const rel = entry.path.slice(prefix.length + 1);
		if (!rel) continue;
		items.push({ path: entry.path, name: rel.split("/").pop() || rel });
	}
	return items;
}

async function readCollectionFile(
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
			? decodeBase64Utf8(data.content)
			: (data.content ?? null);
	return { content };
}

export const GET: APIRoute = async ({ cookies, url }) => {
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

	const dir = url.searchParams.get("dir");
	if (!dir) {
		return new Response(
			JSON.stringify({ ok: false, error: "缺少必填参数 dir" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const refresh = url.searchParams.get("refresh") === "1";
	if (!refresh) {
		const hit = cache.get(dir);
		if (hit && Date.now() - hit.ts < CACHE_TTL) {
			return new Response(JSON.stringify(hit.data), {
				headers: { "Content-Type": "application/json" },
			});
		}
	}

	try {
		const files = (await listCollectionFiles(token, dir)).filter((f) =>
			/\.(md|mdx)$/i.test(f.name),
		);
		const items: Array<{
			slug: string;
			path: string;
			data: Record<string, unknown>;
			body: string;
		}> = [];
		for (const file of files) {
			const slug = file.name.replace(/\.(md|mdx)$/i, "");
			try {
				const { content } = await readCollectionFile(token, file.path);
				if (content == null) continue;
				const { data, body } = parseFrontmatter(content);
				items.push({ slug, path: file.path, data, body });
			} catch {
				// 单文件解析失败不影响整体
			}
		}
		const payload = { items };
		cache.set(dir, { ts: Date.now(), data: payload });
		return new Response(JSON.stringify(payload), {
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
