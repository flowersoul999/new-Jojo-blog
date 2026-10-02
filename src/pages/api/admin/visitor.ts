import type { APIRoute } from "astro";
import { type AdminAuthError, requireAdmin } from "@/utils/admin-auth";
import { getVisitorDetail } from "@/utils/analytics-store";

export const prerender = false;

/** 单个访客的会话时间线：访问时间段 + 页面轨迹 + 操作行为 */
export const GET: APIRoute = async ({ cookies, url }) => {
	try {
		await requireAdmin(cookies);
	} catch (error) {
		const err = error as AdminAuthError;
		return new Response(JSON.stringify({ ok: false, error: err.message }), {
			status: err.status || 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const vid = String(url.searchParams.get("vid") || "");
	const daysParam = Number(url.searchParams.get("days") || 30);
	const days = Number.isFinite(daysParam)
		? Math.min(Math.max(Math.round(daysParam), 7), 365)
		: 30;

	try {
		const detail = await getVisitorDetail(vid, days);
		if (!detail) {
			return new Response(
				JSON.stringify({ ok: false, error: "未找到该访客记录" }),
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		return new Response(JSON.stringify({ ok: true, data: detail }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "访客详情加载失败";
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
