import type { APIRoute } from "astro";
import { requireAuth, GITHUB_REPO, isLocalDev, readLocalFile } from "@/utils/editor-auth";

export const prerender = false;

// GitHub Contents API 返回的文件项
interface GitHubContentItem {
	name: string;
	path: string;
	type: string;
	sha: string;
	size: number;
	content?: string;
	encoding?: string;
}

// 将 base64 字符串解码为 UTF-8 字符串（严格模式，二进制文件会抛错）
function decodeBase64Utf8(base64: string): string {
	const binary = atob(base64.replace(/\n/g, ""));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	// 使用 fatal 模式，遇到无效 UTF-8 序列时抛错（用于检测二进制文件）
	return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export const GET: APIRoute = async ({ cookies, url }) => {
	// 认证检查
	let token: string;
	try {
		token = requireAuth(cookies);
	} catch (error) {
		const message = error instanceof Error ? error.message : "认证失败";
		return new Response(
			JSON.stringify({ ok: false, error: message }),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}

	try {
		// 本地开发模式：直接读取本地文件系统
		if (isLocalDev) {
			const path = url.searchParams.get("path");
			if (!path) {
				return new Response(
					JSON.stringify({ ok: false, error: "缺少必填参数 path" }),
					{ status: 400, headers: { "Content-Type": "application/json" } },
				);
			}
			const data = readLocalFile(path);
			return new Response(JSON.stringify(data), {
				headers: { "Content-Type": "application/json" },
			});
		}

		const { owner, name, branch } = GITHUB_REPO;

		// 从 query 参数获取文件路径（必填）
		const path = url.searchParams.get("path");
		if (!path) {
			return new Response(
				JSON.stringify({ ok: false, error: "缺少必填参数 path" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// 调用 GitHub Contents API 获取文件
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
			return new Response(
				JSON.stringify({ ok: false, error: errorText }),
				{ status: response.status, headers: { "Content-Type": "application/json" } },
			);
		}

		const data: GitHubContentItem = await response.json();
		const rawContent = data.content || "";
		const sha = data.sha;
		const fileName = data.name;

		// 尝试将 base64 content 解码为 UTF-8 字符串
		try {
			const content =
				data.encoding === "base64"
					? decodeBase64Utf8(rawContent)
					: rawContent;

			return new Response(
				JSON.stringify({ path, content, sha, name: fileName }),
				{ headers: { "Content-Type": "application/json" } },
			);
		} catch {
			// 解码失败，说明是二进制文件（图片等），返回 base64 原始内容
			return new Response(
				JSON.stringify({
					path,
					content: null,
					sha,
					name: fileName,
					encoding: "base64",
					base64Content: rawContent,
				}),
				{ headers: { "Content-Type": "application/json" } },
			);
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "未知错误";
		return new Response(
			JSON.stringify({ ok: false, error: message }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
