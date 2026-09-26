import type { APIRoute } from "astro";
import { requireAuth, GITHUB_REPO, isLocalDev, writeLocalFile } from "@/utils/editor-auth";

export const prerender = false;

// GitHub Contents API PUT 返回的响应
interface GitHubPutResponse {
	content: {
		name: string;
		path: string;
		sha: string;
	};
	commit: {
		sha: string;
		message: string;
	};
}

// 将 UTF-8 字符串编码为 base64
function encodeBase64(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

export const POST: APIRoute = async ({ cookies, request }) => {
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
		// 从请求体获取参数
		const body = (await request.json()) as {
			path: string;
			content: string;
			message?: string;
			sha?: string;
		};

		const { path, content, sha } = body;

		if (!path || content === undefined) {
			return new Response(
				JSON.stringify({ ok: false, error: "缺少必填参数 path 或 content" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// 本地开发模式：直接写入本地文件系统
		if (isLocalDev) {
			const result = writeLocalFile(path, content);
			return new Response(JSON.stringify(result), {
				headers: { "Content-Type": "application/json" },
			});
		}

		const { owner, name, branch } = GITHUB_REPO;

		// 默认 commit 消息
		const filename = path.split("/").pop() || path;
		const message = body.message || `Update ${filename}`;

		// 将内容转为 base64
		const base64Content = encodeBase64(content);

		// 调用 GitHub Contents API PUT 写入文件
		const requestBody: Record<string, string> = {
			message,
			content: base64Content,
			branch,
		};
		if (sha) {
			requestBody.sha = sha;
		}

		const response = await fetch(
			`https://api.github.com/repos/${owner}/${name}/contents/${path}`,
			{
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/vnd.github+json",
					"User-Agent": "Aemeath-Blog",
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			return new Response(
				JSON.stringify({ ok: false, error: errorText }),
				{ status: response.status, headers: { "Content-Type": "application/json" } },
			);
		}

		const data: GitHubPutResponse = await response.json();

		return new Response(
			JSON.stringify({
				ok: true,
				commit: {
					sha: data.commit.sha,
					message: data.commit.message,
				},
			}),
			{ headers: { "Content-Type": "application/json" } },
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : "未知错误";
		return new Response(
			JSON.stringify({ ok: false, error: message }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
};
