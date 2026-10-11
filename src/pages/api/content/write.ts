import type { APIRoute } from "astro";
import {
	GITHUB_REPO,
	isLocalDev,
	requireAuth,
	writeLocalFile,
	writeLocalFileBinary,
} from "@/utils/editor-auth";

export const prerender = false;

// 单文件上传的体积上限（原始字节，非 base64 长度）
//
// 为什么必须是硬闸门：这些媒体最终会写进 git 仓库，一旦大对象入库，
// 之后每一次 commit / CI checkout / Vercel 部署都要搬运它，表现就是
// 「提交变慢、部署卡住、clone 假死」，而且历史包袱极难清掉。
// 另外 Serverless 平台对请求体有远低于此的上限，放过去也只是换一个地方失败，
// 不如在服务端明确拒绝并给出可读的错误。
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

// 由 base64 串反推原始字节数（base64 会让体积膨胀约 1/3）
function approxBytesFromBase64(b64: string): number {
	const cleaned = b64.trim().replace(/=+$/, "");
	return Math.floor((cleaned.length * 3) / 4);
}

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
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		// 从请求体获取参数
		// encoding 为 "base64" 时 content 视为不含 data: 前缀的 base64（用于图片等二进制文件）
		const body = (await request.json()) as {
			path: string;
			content: string;
			message?: string;
			sha?: string;
			encoding?: "utf8" | "base64";
		};

		const { path, content, sha, encoding } = body;

		if (!path || content === undefined) {
			return new Response(
				JSON.stringify({ ok: false, error: "缺少必填参数 path 或 content" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		const isBinary = encoding === "base64";

		// 体积闸门：二进制（图片 / 视频）与文本内容一视同仁，超限一律拒绝
		const approxBytes = approxBytesFromBase64(content);
		if (approxBytes > MAX_UPLOAD_BYTES) {
			// 这里不复用后面的 filename：它声明在闸门之后，提前引用会踩 TDZ
			const shownName = path.split("/").pop() || path;
			const sizeMb = (approxBytes / 1024 / 1024).toFixed(1);
			const limitMb = String(MAX_UPLOAD_BYTES / 1024 / 1024);
			return new Response(
				JSON.stringify({
					ok: false,
					error:
						`${shownName} 约 ${sizeMb} MB，` +
						`超过单文件 ${limitMb} MB 上限，已取消上传。` +
						"请压缩或裁剪后重试。",
				}),
				{ status: 413, headers: { "Content-Type": "application/json" } },
			);
		}

		// 本地开发模式：直接写入本地文件系统
		if (isLocalDev) {
			const result = isBinary
				? writeLocalFileBinary(path, content)
				: writeLocalFile(path, content);
			return new Response(JSON.stringify(result), {
				headers: { "Content-Type": "application/json" },
			});
		}

		const { owner, name, branch } = GITHUB_REPO;

		// 默认 commit 消息
		const filename = path.split("/").pop() || path;
		const message = body.message || `Update ${filename}`;

		// 二进制内容已是 base64；文本内容需先编码
		const base64Content = isBinary ? content : encodeBase64(content);

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
			return new Response(JSON.stringify({ ok: false, error: errorText }), {
				status: response.status,
				headers: { "Content-Type": "application/json" },
			});
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
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
