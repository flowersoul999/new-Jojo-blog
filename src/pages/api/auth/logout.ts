import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
	// 删除认证相关 cookie
	cookies.delete("github_token", { path: "/" });
	cookies.delete("github_user", { path: "/" });

	return new Response(JSON.stringify({ ok: true }), {
		headers: { "Content-Type": "application/json" },
	});
};
