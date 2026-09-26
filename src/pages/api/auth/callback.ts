import type { APIRoute } from "astro";
import { getGithubUser } from "@/utils/editor-auth";

export const prerender = false;

// Token cookie 有效期：7 天（秒）
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

// cookie 安全设置
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: true,
	sameSite: "lax" as const,
	path: "/",
	maxAge: TOKEN_COOKIE_MAX_AGE,
};

export const GET: APIRoute = async ({
	url,
	cookies,
	site,
	request,
	redirect,
}) => {
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");

	// 从 cookie 中读取之前存储的 state
	const storedState = cookies.get("oauth_state")?.value;

	// CSRF 保护：验证 state 匹配
	if (!code || !state || !storedState || state !== storedState) {
		return redirect("/?auth_error=1", 302);
	}

	// 从环境变量获取 OAuth 配置
	const clientId =
		import.meta.env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
	const clientSecret =
		import.meta.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		return redirect("/?auth_error=1", 302);
	}

	// 构造回调地址（需与登录时一致）
	const redirectUri = site
		? `${site.href}api/auth/callback`
		: `${new URL(request.url).origin}/api/auth/callback`;

	try {
		// 用 code 交换 access token
		const tokenResponse = await fetch(
			"https://github.com/login/oauth/access_token",
			{
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					client_id: clientId,
					client_secret: clientSecret,
					code,
					redirect_uri: redirectUri,
				}),
			},
		);

		if (!tokenResponse.ok) {
			return redirect("/?auth_error=1", 302);
		}

		const tokenData = await tokenResponse.json();

		if (!tokenData.access_token) {
			return redirect("/?auth_error=1", 302);
		}

		const accessToken: string = tokenData.access_token;

		// 将 token 存入 cookie
		cookies.set("github_token", accessToken, COOKIE_OPTIONS);

		// 删除 oauth_state cookie
		cookies.delete("oauth_state", { path: "/" });

		// 获取用户信息并存入 cookie
		const user = await getGithubUser(accessToken);
		if (user) {
			cookies.set("github_user", JSON.stringify(user), COOKIE_OPTIONS);
		}

		// 认证成功，重定向到首页
		return redirect("/", 302);
	} catch {
		return redirect("/?auth_error=1", 302);
	}
};
