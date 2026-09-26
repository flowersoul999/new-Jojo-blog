import type { AstroCookies } from "astro";
import fs from "node:fs";
import path from "node:path";

// GitHub 仓库配置
export const GITHUB_REPO = {
	owner: "Jarvis0227",
	name: "Aemeath",
	branch: "main",
} as const;

// 是否为本地开发模式（DEV 下直接读写本地文件，无需 GitHub 认证）
export const isLocalDev = import.meta.env.DEV;

// 本地项目根目录（src 的父目录）
const PROJECT_ROOT = process.cwd();

// 存储访问令牌的 cookie 名称
const TOKEN_COOKIE = "github_token";

// GitHub 用户信息类型
export interface GithubUser {
	login: string;
	avatar_url: string;
	name: string | null;
}

/**
 * 从 Astro cookies 中读取 GitHub 访问令牌
 * @param cookies Astro cookies 对象
 * @returns token 字符串或 undefined
 */
export function getAuthToken(cookies: AstroCookies): string | undefined {
	return cookies.get(TOKEN_COOKIE)?.value;
}

/**
 * 要求用户已认证，如果没有 token 则抛出 401 错误
 * 本地开发模式下直接返回空 token（无需认证）
 * @param cookies Astro cookies 对象
 * @returns GitHub 访问令牌
 */
export function requireAuth(cookies: AstroCookies): string {
	// 本地开发模式跳过认证
	if (isLocalDev) return "";

	const token = getAuthToken(cookies);
	if (!token) {
		throw new Error("未授权：请先登录 GitHub");
	}
	return token;
}

/**
 * 使用 token 调用 GitHub API 获取用户信息
 * @param token GitHub 访问令牌
 * @returns 用户信息对象或 null（token 无效或请求失败时）
 */
export async function getGithubUser(token: string): Promise<GithubUser | null> {
	try {
		const response = await fetch("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github+json",
				"User-Agent": "Aemeath-Blog",
			},
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		return {
			login: data.login,
			avatar_url: data.avatar_url,
			name: data.name,
		};
	} catch {
		return null;
	}
}

// ============================================================================
// 本地文件系统操作（开发模式专用，直接读写 src 目录下的文件）
// ============================================================================

/**
 * 将仓库相对路径解析为本地绝对路径，并校验不越界
 */
export function resolveLocalPath(relPath: string): string {
	const cleanPath = relPath.replace(/^\/+/, "").replace(/\\/g, "/");
	const target = path.resolve(PROJECT_ROOT, cleanPath);
	const relative = path.relative(PROJECT_ROOT, target);
	if (relative.startsWith("..") || path.isAbsolute(relative)) {
		throw new Error("路径越界：只能操作项目目录内的文件");
	}
	return target;
}

/**
 * 列出目录内容（本地）
 */
export function listLocalDir(relPath: string) {
	const target = resolveLocalPath(relPath || ".");
	if (!fs.existsSync(target)) return [];
	const entries = fs.readdirSync(target, { withFileTypes: true });
	return entries.map((entry) => {
		const full = path.join(target, entry.name);
		const stat = fs.statSync(full);
		return {
			name: entry.name,
			path: path.relative(PROJECT_ROOT, full).replace(/\\/g, "/"),
			type: entry.isDirectory() ? "dir" : "file",
			sha: "local",
			size: stat.size,
		};
	});
}

/**
 * 读取文件内容（本地）
 */
export function readLocalFile(relPath: string) {
	const target = resolveLocalPath(relPath);
	if (!fs.existsSync(target)) throw new Error(`文件不存在：${relPath}`);
	const stat = fs.statSync(target);
	if (stat.isDirectory()) throw new Error(`路径是目录：${relPath}`);

	const buffer = fs.readFileSync(target);
	// 尝试用 UTF-8 解码，失败则视为二进制
	try {
		const content = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
		return { path: relPath, content, sha: "local", name: path.basename(target) };
	} catch {
		return {
			path: relPath,
			content: null,
			sha: "local",
			name: path.basename(target),
			encoding: "base64",
			base64Content: buffer.toString("base64"),
		};
	}
}

/**
 * 写入文件（本地）
 */
export function writeLocalFile(relPath: string, content: string) {
	const target = resolveLocalPath(relPath);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, content, "utf8");
	return { ok: true, commit: { sha: "local", message: `Update ${path.basename(target)}` } };
}

/**
 * 删除文件（本地）
 */
export function deleteLocalFile(relPath: string) {
	const target = resolveLocalPath(relPath);
	if (!fs.existsSync(target)) throw new Error(`文件不存在：${relPath}`);
	fs.unlinkSync(target);
	return { ok: true };
}
