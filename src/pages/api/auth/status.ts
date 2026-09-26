import type { APIRoute } from "astro";
import { getAuthToken, getGithubUser, isLocalDev } from "@/utils/editor-auth";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
	// 本地开发模式：直接返回已认证状态，无需 GitHub 登录
	if (isLocalDev) {
		return new Response(
			JSON.stringify({
				authenticated: true,
				user: {
					login: "local-dev",
					avatar_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'%3E%3Cpath d='M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.5h19.6v-2.5c0-3.3-6.5-4.9-9.8-4.9z'/%3E%3C/svg%3E",
					name: "本地开发者",
				},
			}),
			{ headers: { "Content-Type": "application/json" } },
		);
	}

	const token = getAuthToken(cookies);

	// 没有 token，返回未认证状态
	if (!token) {
		return new Response(JSON.stringify({ authenticated: false }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	// 验证 token 有效性并获取用户信息
	const user = await getGithubUser(token);

	if (!user) {
		return new Response(JSON.stringify({ authenticated: false }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response(JSON.stringify({ authenticated: true, user }), {
		headers: { "Content-Type": "application/json" },
	});
};
