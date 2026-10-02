import type { APIRoute } from "astro";
import { type AdminAuthError, requireAdmin } from "@/utils/admin-auth";
import {
	exportEvents,
	moduleOf,
	type StoredEvent,
} from "@/utils/analytics-store";

export const prerender = false;

const CSV_COLUMNS = [
	"time",
	"date",
	"type",
	"path",
	"module",
	"action",
	"label",
	"referrer",
	"ip",
	"country",
	"os",
	"browser",
	"device",
	"dwell_ms",
	"session",
	"enter_time",
	"vid",
] as const;

/** 事件类型 → 中文 */
const TYPE_NAMES: Record<string, string> = {
	p: "页面浏览",
	d: "停留补报",
	a: "操作行为",
};

/** CSV 字段转义 */
function csvCell(value: string | number): string {
	const text = String(value ?? "");
	if (/[",\n\r]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

/** 毫秒时间戳 → 可读时间（Asia/Shanghai） */
function fmtTs(ts: number | undefined): string {
	if (!ts) return "";
	return new Intl.DateTimeFormat("zh-CN", {
		timeZone: "Asia/Shanghai",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).format(ts);
}

function toCsv(events: StoredEvent[]): string {
	const header = CSV_COLUMNS.join(",");
	const rows = events.map((e) =>
		[
			fmtTs(e.t),
			new Intl.DateTimeFormat("en-CA", {
				timeZone: "Asia/Shanghai",
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			}).format(e.t),
			TYPE_NAMES[e.ty ?? "p"] || "页面浏览",
			csvCell(e.p ?? ""),
			csvCell(moduleOf(e.p ?? "")),
			csvCell(e.ac ?? ""),
			csvCell(e.al ?? ""),
			csvCell(e.r ?? ""),
			csvCell(e.ip ?? ""),
			csvCell(e.cc ?? ""),
			csvCell(e.os ?? ""),
			csvCell(e.br ?? ""),
			csvCell(e.dev ?? ""),
			String(e.d ?? 0),
			csvCell(e.sid ?? ""),
			fmtTs(e.en),
			csvCell(e.v ?? ""),
		].join(","),
	);
	return `\ufeff${header}\n${rows.join("\n")}`;
}

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

	const from = url.searchParams.get("from") || "";
	const to = url.searchParams.get("to") || "";
	const format = (url.searchParams.get("format") || "csv").toLowerCase();

	try {
		const events = await exportEvents(from, to);
		if (format === "json") {
			return new Response(
				JSON.stringify({ ok: true, count: events.length, events }),
				{
					headers: {
						"Content-Type": "application/json; charset=utf-8",
						"Content-Disposition": `attachment; filename="analytics-events.json"`,
					},
				},
			);
		}
		return new Response(toCsv(events), {
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": `attachment; filename="analytics-events.csv"`,
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "导出失败";
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
