import type { APIRoute } from "astro";
import { type AdminAuthError, requireAdmin } from "@/utils/admin-auth";
import { exportEvents, type StoredEvent } from "@/utils/analytics-store";

export const prerender = false;

const CSV_COLUMNS = [
	"time",
	"date",
	"path",
	"referrer",
	"ip",
	"country",
	"os",
	"browser",
	"device",
	"dwell_ms",
	"vid",
] as const;

/** CSV 字段转义 */
function csvCell(value: string | number): string {
	const text = String(value ?? "");
	if (/[",\n\r]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

/** 时间戳 → Asia/Shanghai 可读时间 */
function fmtTime(ts: number): string {
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
			fmtTime(e.t),
			new Intl.DateTimeFormat("en-CA", {
				timeZone: "Asia/Shanghai",
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			}).format(e.t),
			csvCell(e.p ?? ""),
			csvCell(e.r ?? ""),
			csvCell(e.ip ?? ""),
			csvCell(e.cc ?? ""),
			csvCell(e.os ?? ""),
			csvCell(e.br ?? ""),
			csvCell(e.dev ?? ""),
			String(e.d ?? 0),
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
