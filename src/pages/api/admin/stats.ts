import type { APIRoute } from "astro";
import { type AdminAuthError, requireAdmin } from "@/utils/admin-auth";
import {
	aggregateStats,
	cleanupExpired,
	readSettings,
} from "@/utils/analytics-store";

export const prerender = false;

// 聚合结果 60s 缓存（serverless 实例内有效）
const statsCache = new Map<string, { at: number; value: unknown }>();
const STATS_TTL = 60_000;

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

	const daysParam = Number(url.searchParams.get("days") || 30);
	const days = Number.isFinite(daysParam)
		? Math.min(Math.max(Math.round(daysParam), 7), 365)
		: 30;
	const cacheKey = `days=${days}`;

	const cached = statsCache.get(cacheKey);
	if (cached && Date.now() - cached.at < STATS_TTL) {
		return new Response(JSON.stringify({ ok: true, data: cached.value }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		// 顺带懒清理过期事件文件（24h 内至多一次）
		const settings = await readSettings();
		await cleanupExpired(settings.retentionDays);
		const result = await aggregateStats(days);
		statsCache.set(cacheKey, { at: Date.now(), value: result });
		if (statsCache.size > 5) {
			const oldest = [...statsCache.entries()].sort(
				(a, b) => a[1].at - b[1].at,
			)[0];
			if (oldest) statsCache.delete(oldest[0]);
		}
		return new Response(JSON.stringify({ ok: true, data: result }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "统计聚合失败";
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
