import type { APIRoute } from "astro";
import {
	GITHUB_REPO,
	isLocalDev,
	listLocalDir,
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
		// 本地开发模式：直接读取本地文件系统
		if (isLocalDev) {
			const path = url.searchParams.get("path") || "src/content/posts";
			const items = listLocalDir(path);
			return new Response(JSON.stringify(items), {
				headers: { "Content-Type": "application/json" },
			});
		}

		const { owner, name, branch } = GITHUB_REPO;

		// 从 query 参数获取路径，默认为文章目录
		const path = url.searchParams.get("path") || "src/content/posts";

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
