import type { APIRoute } from "astro";

export const prerender = false;

// OAuth state cookie 有效期：15 分钟（秒）
const STATE_COOKIE_MAX_AGE = 60 * 15;

/**
 * 生成随机 state 字符串，用于 CSRF 保护
 */
function generateState(): string {
	return crypto.randomUUID();
}

export const GET: APIRoute = async ({ cookies, site, request, redirect }) => {
	// 从环境变量获取 GitHub OAuth 客户端 ID
	const clientId =
		import.meta.env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;

	if (!clientId) {
		return new Response("GitHub OAuth 未配置：缺少 GITHUB_CLIENT_ID", {
			status: 500,
		});
	}

	// 生成随机 state 并存入 cookie（CSRF 保护）
	const state = generateState();
	cookies.set("oauth_state", state, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: STATE_COOKIE_MAX_AGE,
	});

	// 构造回调地址，优先使用 Astro.site，为空则用请求来源
	const redirectUri = site
		? `${site.href}api/auth/callback`
		: `${new URL(request.url).origin}/api/auth/callback`;

	// 构造 GitHub OAuth 授权 URL
	const authUrl = new URL("https://github.com/login/oauth/authorize");
	authUrl.searchParams.set("client_id", clientId);
	authUrl.searchParams.set("redirect_uri", redirectUri);
	authUrl.searchParams.set("scope", "repo");
	authUrl.searchParams.set("state", state);

	// 302 重定向到 GitHub 授权页面
	return redirect(authUrl.href, 302);
};
