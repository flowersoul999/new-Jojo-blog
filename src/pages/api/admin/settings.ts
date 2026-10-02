import type { APIRoute } from "astro";
import { type AdminAuthError, requireAdmin } from "@/utils/admin-auth";
import {
	cleanupExpired,
	readSettings,
	writeSettings,
} from "@/utils/analytics-store";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
	try {
		await requireAdmin(cookies);
	} catch (error) {
		const err = error as AdminAuthError;
		return new Response(JSON.stringify({ ok: false, error: err.message }), {
			status: err.status || 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const settings = await readSettings();
		return new Response(JSON.stringify({ ok: true, data: settings }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "读取设置失败";
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const PUT: APIRoute = async ({ cookies, request }) => {
	try {
		await requireAdmin(cookies);
	} catch (error) {
		const err = error as AdminAuthError;
		return new Response(JSON.stringify({ ok: false, error: err.message }), {
			status: err.status || 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		return new Response(JSON.stringify({ ok: false, error: "无效的 JSON" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	if (typeof raw !== "object" || raw === null) {
		return new Response(JSON.stringify({ ok: false, error: "参数错误" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const input = raw as Record<string, unknown>;
	// 白名单校验：必须是合法 GitHub 登录名的字符串数组
	if (input.adminLogins !== undefined) {
		if (
			!Array.isArray(input.adminLogins) ||
			input.adminLogins.some(
				(x) => typeof x !== "string" || !/^[A-Za-z0-9-]{1,39}$/.test(x),
			)
		) {
			return new Response(
				JSON.stringify({
					ok: false,
					error: "adminLogins 必须是合法 GitHub 登录名数组",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	}

	try {
		const settings = await writeSettings({
			enabled: typeof input.enabled === "boolean" ? input.enabled : undefined,
			recordIp:
				typeof input.recordIp === "boolean" ? input.recordIp : undefined,
			maskIp: typeof input.maskIp === "boolean" ? input.maskIp : undefined,
			recordActions:
				typeof input.recordActions === "boolean"
					? input.recordActions
					: undefined,
			adminLogins: Array.isArray(input.adminLogins)
				? (input.adminLogins as string[]).filter((x) => x.trim())
				: undefined,
			retentionDays:
				Number(input.retentionDays) > 0
					? Math.round(Number(input.retentionDays))
					: undefined,
		});
		return new Response(JSON.stringify({ ok: true, data: settings }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "保存设置失败";
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

/** 立即清理过期事件文件 */
export const POST: APIRoute = async ({ cookies }) => {
	try {
		await requireAdmin(cookies);
	} catch (error) {
		const err = error as AdminAuthError;
		return new Response(JSON.stringify({ ok: false, error: err.message }), {
			status: err.status || 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const settings = await readSettings();
		const removed = await cleanupExpired(settings.retentionDays, true);
		return new Response(JSON.stringify({ ok: true, removed }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "清理失败";
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
