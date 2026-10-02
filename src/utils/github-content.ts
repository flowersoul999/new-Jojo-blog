/**
 * GitHub Contents API 通用封装
 * - 支持 listDir / readFile / writeFile / deleteFile
 * - token 参数化：后台管理用用户 OAuth token，统计写入用 ANALYTICS_TOKEN
 * - writeFile 内置 409/422 并发冲突重试（重读 → 合并 → 重写）
 */
import { GITHUB_REPO } from "./editor-auth";

export interface ContentsItem {
	name: string;
	path: string;
	type: "dir" | "file";
	sha: string;
	size: number;
}

export interface ReadFileResult {
	sha: string;
	content: string; // 解码后的 UTF-8 文本
	size: number;
}

export interface WriteFileResult {
	sha: string;
}

/** 文件不存在（404）时抛出的错误类型 */
export class NotFoundError extends Error {
	constructor(path: string) {
		super(`文件不存在：${path}`);
		this.name = "NotFoundError";
	}
}

/** 将 UTF-8 字符串编码为 base64 */
function encodeBase64(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/** 将 base64 解码为 UTF-8 字符串 */
function decodeBase64(base64: string): string {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new TextDecoder().decode(bytes);
}

/** 组装 GitHub API 请求头 */
function ghHeaders(
	token: string,
	extra: Record<string, string> = {},
): HeadersInit {
	return {
		Authorization: `Bearer ${token}`,
		Accept: "application/vnd.github+json",
		"User-Agent": "Aemeath-Blog",
		"Content-Type": "application/json",
		...extra,
	};
}

/** 列出目录内容 */
export async function listDir(
	token: string,
	dirPath: string,
): Promise<ContentsItem[]> {
	const cleanPath = dirPath.replace(/^\/+/, "").replace(/\/+$/, "");
	const response = await fetch(
		`https://api.github.com/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.name}/contents/${encodeURI(cleanPath)}`,
		{ headers: ghHeaders(token) },
	);
	if (!response.ok) {
		if (response.status === 404) return [];
		throw new Error(
			`listDir 失败：${response.status} ${await response.text()}`,
		);
	}
	const data = (await response.json()) as ContentsItem[];
	return Array.isArray(data) ? data : [];
}

/**
 * 读取文件内容（文本）
 * 文件不存在时抛出 NotFoundError
 */
export async function readFile(
	token: string,
	filePath: string,
): Promise<ReadFileResult> {
	const cleanPath = filePath.replace(/^\/+/, "");
	const response = await fetch(
		`https://api.github.com/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.name}/contents/${encodeURI(cleanPath)}`,
		{ headers: ghHeaders(token) },
	);
	if (!response.ok) {
		if (response.status === 404) throw new NotFoundError(cleanPath);
		throw new Error(
			`readFile 失败：${response.status} ${await response.text()}`,
		);
	}
	const data = (await response.json()) as {
		sha: string;
		content: string;
		size: number;
	};
	return {
		sha: data.sha,
		content: decodeBase64(data.content),
		size: data.size,
	};
}

interface WriteOptions {
	/** 已知的当前文件 SHA（首次创建可不传） */
	sha?: string;
	/** 重试次数（默认 3） */
	retries?: number;
	/**
	 * 冲突合并回调：当写入遇到 409/422 时会重读最新内容，
	 * 调用此回调合并，再以新 SHA 重试。
	 * 返回 null 表示放弃写入。
	 */
	onConflict?: (latestContent: string) => string | null;
	/** 提交消息 */
	message?: string;
}

/** 写入文件（UTF-8 文本），带 409/422 冲突重试 */
export async function writeFile(
	token: string,
	filePath: string,
	content: string,
	options: WriteOptions = {},
): Promise<WriteFileResult> {
	const cleanPath = filePath.replace(/^\/+/, "");
	const maxRetries = Math.max(0, options.retries ?? 3);
	const message = options.message || `Update ${cleanPath.split("/").pop()}`;
	const base64Content = encodeBase64(content);
	let sha = options.sha;

	const put = async (currentSha: string | undefined) => {
		const body: Record<string, string> = {
			message,
			content: base64Content,
			branch: GITHUB_REPO.branch,
		};
		if (currentSha) body.sha = currentSha;
		return fetch(
			`https://api.github.com/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.name}/contents/${encodeURI(cleanPath)}`,
			{ method: "PUT", headers: ghHeaders(token), body: JSON.stringify(body) },
		);
	};

	let attempt = 0;
	while (true) {
		attempt += 1;
		const response = await put(sha);
		if (response.ok) {
			const data = (await response.json()) as { content?: { sha?: string } };
			return { sha: data.content?.sha || "" };
		}
		// 409 冲突 / 422 校验失败（通常由并发写入导致 SHA 过期）
		if (
			(response.status === 409 || response.status === 422) &&
			options.onConflict &&
			attempt <= maxRetries
		) {
			// 重读最新内容
			let latest: ReadFileResult | null = null;
			try {
				latest = await readFile(token, cleanPath);
			} catch {
				// 文件可能刚被删除，重试创建
				latest = null;
			}
			const merged = latest
				? options.onConflict(latest.content)
				: options.onConflict("");
			if (merged === null) {
				throw new Error(`写入失败（冲突后放弃）：${cleanPath}`);
			}
			sha = latest?.sha;
			// 冲突后以合并内容重写，需重置 base64
			// 注：base64Content 由外部传入的 content 计算，合并逻辑需要重新编码
			if (merged !== content) {
				return writeFile(token, cleanPath, merged, {
					...options,
					sha,
					retries: maxRetries - attempt + 1,
				});
			}
			await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
			continue;
		}
		throw new Error(
			`writeFile 失败：${response.status} ${await response.text()}`,
		);
	}
}

/** 删除文件 */
export async function deleteFile(
	token: string,
	filePath: string,
	sha: string,
): Promise<void> {
	const cleanPath = filePath.replace(/^\/+/, "");
	const response = await fetch(
		`https://api.github.com/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.name}/contents/${encodeURI(cleanPath)}`,
		{
			method: "DELETE",
			headers: ghHeaders(token),
			body: JSON.stringify({
				message: `Delete ${cleanPath.split("/").pop()}`,
				sha,
				branch: GITHUB_REPO.branch,
			}),
		},
	);
	if (!response.ok) {
		throw new Error(
			`deleteFile 失败：${response.status} ${await response.text()}`,
		);
	}
}
