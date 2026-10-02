/**
 * 后台管理鉴权：仅站长本人（或 settings 中的白名单）可访问
 * 注意：github_user cookie 不可信，必须通过 GitHub API 重验证用户身份
 */
import type { AstroCookies } from "astro";
import { readSettings } from "./analytics-store";
import { getAuthToken, getGithubUser, isLocalDev } from "./editor-auth";

export class AdminAuthError extends Error {
	constructor(
		message: string,
		readonly status = 401,
	) {
		super(message);
		this.name = "AdminAuthError";
	}
}

/**
 * 校验当前请求是否为站长本人
 * 本地开发模式直接放行（返回 local-dev）
 * @returns 站长 GitHub 登录名
 */
export async function requireAdmin(
	cookies: AstroCookies,
): Promise<{ login: string }> {
	if (isLocalDev) {
		return { login: "local-dev" };
	}

	const token = getAuthToken(cookies);
	if (!token) {
		throw new AdminAuthError("未授权：请先登录 GitHub");
	}

	const user = await getGithubUser(token);
	if (!user) {
		throw new AdminAuthError("未授权：GitHub 身份验证失败");
	}

	const settings = await readSettings();
	const allowed = settings.adminLogins.length > 0 ? settings.adminLogins : [];
	if (!allowed.includes(user.login)) {
		throw new AdminAuthError("无权限：仅站长本人可访问后台", 403);
	}

	return { login: user.login };
}

/**
 * 判断 GitHub 登录用户是否为站长（供前端菜单 / 状态接口使用）
 * 返回 false 不抛错，便于在响应中安全携带
 */
export async function isAdminLogin(cookies: AstroCookies): Promise<boolean> {
	if (isLocalDev) return true;
	const token = getAuthToken(cookies);
	if (!token) return false;
	const user = await getGithubUser(token);
	if (!user) return false;
	const settings = await readSettings();
	const allowed = settings.adminLogins.length > 0 ? settings.adminLogins : [""];
	return allowed.includes(user.login);
}
