import type { APIRoute } from "astro";
import { requireAuth, GITHUB_REPO, isLocalDev, deleteLocalFile } from "@/utils/editor-auth";

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
			message?: string;
			sha?: string;
		};

		const { path } = body;

		if (!path) {
			return new Response(
				JSON.stringify({ ok: false, error: "缺少必填参数 path" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// 本地开发模式：直接删除本地文件
		if (isLocalDev) {
			const result = deleteLocalFile(path);
			return new Response(JSON.stringify(result), {
				headers: { "Content-Type": "application/json" },
			});
		}

		const { owner, name, branch } = GITHUB_REPO;

		let sha = body.sha;

		// 如果没有提供 sha，先调用 Contents API GET 获取文件的 sha
		if (!sha) {
			const getResponse = await fetch(
				`https://api.github.com/repos/${owner}/${name}/contents/${path}?ref=${branch}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/vnd.github+json",
						"User-Agent": "Aemeath-Blog",
					},
				},
			);

			if (!getResponse.ok) {
				const errorText = await getResponse.text();
				return new Response(
					JSON.stringify({ ok: false, error: errorText }),
					{
						status: getResponse.status,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			const fileData: GitHubContentItem = await getResponse.json();
			sha = fileData.sha;
		}

		// 默认 commit 消息
		const filename = path.split("/").pop() || path;
		const message = body.message || `Delete ${filename}`;

		// 调用 GitHub Contents API DELETE 删除文件
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${name}/contents/${path}`,
			{
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/vnd.github+json",
					"User-Agent": "Aemeath-Blog",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					message,
					sha,
					branch,
				}),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			return new Response(
				JSON.stringify({ ok: false, error: errorText }),
				{ status: response.status, headers: { "Content-Type": "application/json" } },
			);
		}

		return new Response(
			JSON.stringify({ ok: true }),
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
