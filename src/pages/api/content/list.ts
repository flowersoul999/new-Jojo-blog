import type { APIRoute } from "astro";
import {
	GITHUB_REPO,
	isLocalDev,
	listLocalDir,
	listLocalDirRecursive,
	requireAuth,
} from "@/utils/editor-auth";

export const prerender = false;

// GitHub Contents API 返回的文件/目录项
interface GitHubContentItem {
	name: string;
	path: string;
	type: string;
	sha: string;
	size: number;
	content?: string;
	encoding?: string;
}

// 将 base64 字符串解码为 UTF-8 字符串
function decodeBase64(base64: string): string {
	const binary = atob(base64.replace(/\n/g, ""));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new TextDecoder("utf-8").decode(bytes);
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

	try {
		// 是否递归列出（生产走 Git Trees API，本地走递归 walk）
		const recursive = url.searchParams.get("recursive") === "1";

		// 本地开发模式：直接读取本地文件系统
		if (isLocalDev) {
			const path = url.searchParams.get("path") || "src/content/posts";
			if (recursive) {
				return new Response(JSON.stringify(listLocalDirRecursive(path)), {
					headers: { "Content-Type": "application/json" },
				});
			}
			const items = listLocalDir(path);
			return new Response(JSON.stringify(items), {
				headers: { "Content-Type": "application/json" },
			});
		}

		const { owner, name, branch } = GITHUB_REPO;

		// 从 query 参数获取路径，默认为文章目录
		const path = url.searchParams.get("path") || "src/content/posts";

		// 递归模式：一次拉取整棵 git tree，按 path 前缀过滤
		if (recursive) {
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
				const errorText = await treeResponse.text();
				return new Response(JSON.stringify({ ok: false, error: errorText }), {
					status: treeResponse.status,
					headers: { "Content-Type": "application/json" },
				});
			}
			const treeData = await treeResponse.json();
			if (treeData.truncated) {
				return new Response(
					JSON.stringify({
						ok: false,
						error: "仓库文件树过大，GitHub 截断了结果，请使用非递归模式",
					}),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
			const basePath = path.replace(/^\/+/, "").replace(/\/+$/, "");
			const prefix = basePath ? `${basePath}/` : "";
			const items: Array<{
				name: string;
				path: string;
				type: "file" | "dir";
				size: number;
			}> = [];
			for (const entry of treeData.tree || []) {
				if (entry.type !== "blob") continue;
				if (prefix && !entry.path.startsWith(prefix)) continue;
				const rel = prefix ? entry.path.slice(prefix.length) : entry.path;
				if (!rel) continue;
				items.push({
					name: rel.split("/").pop() || rel,
					path: entry.path,
					type: "file",
					size: entry.size || 0,
				});
			}
			return new Response(JSON.stringify(items), {
				headers: { "Content-Type": "application/json" },
			});
		}

		// 调用 GitHub Contents API 列出目录或文件
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${name}/contents/${path}?ref=${branch}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/vnd.github+json",
					"User-Agent": "Aemeath-Blog",
				},
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			return new Response(JSON.stringify({ ok: false, error: errorText }), {
				status: response.status,
				headers: { "Content-Type": "application/json" },
			});
		}

		const data: GitHubContentItem | GitHubContentItem[] = await response.json();

		// 如果返回的是数组（目录），映射为简化的文件列表
		if (Array.isArray(data)) {
			const items = data.map((item) => ({
				name: item.name,
				path: item.path,
				type: item.type,
				sha: item.sha,
				size: item.size,
			}));
			return new Response(JSON.stringify(items), {
				headers: { "Content-Type": "application/json" },
			});
		}

		// 如果返回的是单个文件，返回文件内容（base64 解码后的字符串）
		const content =
			data.encoding === "base64" && data.content
				? decodeBase64(data.content)
				: data.content;

		return new Response(
			JSON.stringify({
				name: data.name,
				path: data.path,
				type: data.type,
				sha: data.sha,
				size: data.size,
				content,
			}),
			{ headers: { "Content-Type": "application/json" } },
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : "未知错误";
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
