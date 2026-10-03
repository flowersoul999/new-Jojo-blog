import type { APIRoute } from "astro";
import {
	appendEvents,
	cleanText,
	type EventType,
	readSettings,
	type StoredEvent,
} from "@/utils/analytics-store";
import { isLocalDev } from "@/utils/editor-auth";
import { resolveGeo } from "@/utils/geoip";

export const prerender = false;

// ============================================================================
// 校验与防滥用
// ============================================================================

const MAX_BODY_SIZE = 64 * 1024; // 64KB
const MAX_EVENTS_PER_BATCH = 50;
const MAX_PATH_LENGTH = 300;
const MAX_REF_LENGTH = 300;
const MAX_VID_LENGTH = 64;
const MAX_ACTION_LENGTH = 40;
const MAX_LABEL_LENGTH = 120;
const MAX_TS_SKEW_MS = 5 * 60 * 1000; // 客户端时间允许 ±5 分钟
const MAX_EN_SKEW_PAST = 12 * 60 * 60 * 1000; // 页面进入时间最多回溯 12 小时

const BOT_PATTERN =
	/bot|spider|crawl|slurp|bingpreview|mediapartners|scrapy|headless|phantom|curl|wget|python-requests|java\/|okhttp|go-http|facebookexternalhit|whatsapp|twitterbot|applebot|telegrambot|semrush/i;

/** 校验 path：必须以 / 开头、去除 query/hash、拒绝路径穿越与异常字符 */
function sanitizePath(raw: string): string | null {
	if (typeof raw !== "string") return null;
	const path = raw.split(/[?#]/)[0];
	if (!path.startsWith("/")) return null;
	if (path.length > MAX_PATH_LENGTH) return null;
	if (path.includes("..")) return null;
	// 拒绝 ASCII 控制字符（0x00–0x1f 与 DEL 0x7f），防止日志伪造等脏输入
	for (const ch of path) {
		const code = ch.codePointAt(0) ?? 0;
		if (code <= 0x1f || code === 0x7f) return null;
	}
	return path;
}

function sanitizeString(value: unknown, max: number): string {
	return typeof value === "string" ? value.slice(0, max) : "";
}

/** 内存令牌桶：每 IP 每分钟 60 条（威慑级别，多 isolate 下按实例独立） */
const rateBuckets = new Map<string, { tokens: number; at: number }>();
const RATE_PER_MIN = 60;
const RATE_MAX_BUCKETS = 5000;

function rateLimitOk(ip: string): boolean {
	const now = Date.now();
	const bucket = rateBuckets.get(ip);
	if (!bucket || now - bucket.at >= 60_000) {
		if (rateBuckets.size >= RATE_MAX_BUCKETS) {
			// 桶数量过多时清理过期条目
			for (const [key, b] of rateBuckets) {
				if (now - b.at >= 60_000) rateBuckets.delete(key);
			}
		}
		rateBuckets.set(ip, { tokens: RATE_PER_MIN - 1, at: now });
		return true;
	}
	if (bucket.tokens <= 0) return false;
	bucket.tokens -= 1;
	return true;
}

/** 同源校验：Origin / Referer 若存在则必须与本站同源 */
function originAllowed(request: Request): boolean {
	const origin = request.headers.get("origin");
	if (origin) {
		try {
			return new URL(origin).origin === new URL(request.url).origin;
		} catch {
			return false;
		}
	}
	const referer = request.headers.get("referer");
	if (referer) {
		try {
			return new URL(referer).origin === new URL(request.url).origin;
		} catch {
			return false;
		}
	}
	// 无 Origin/Referer（如 curl），放行
	return true;
}

// ============================================================================
// 服务端信息附加
// ============================================================================

function getClientIp(request: Request): string {
	const cf = request.headers.get("cf-connecting-ip");
	if (cf) return cf;
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0].trim() || "unknown";
	return request.headers.get("x-real-ip") || "unknown";
}

/** 解析 UA，产出设备/系统/浏览器三字段（弃原始 UA 以减小文件体积） */
function parseUa(ua: string): { dev: string; os: string; br: string } {
	const lower = ua.toLowerCase();
	let dev = "桌面端";
	if (/ipad|tablet/i.test(ua)) dev = "平板";
	else if (/mobile|iphone|ipod|android|harmonyos/i.test(ua)) dev = "移动端";

	let os = "其他";
	if (/iphone|ipod|ios/i.test(ua)) os = "iOS";
	else if (/ipad/i.test(ua)) os = "iPadOS";
	else if (/android|harmonyos/i.test(ua)) os = "Android";
	else if (/windows/i.test(ua)) os = "Windows";
	else if (/mac os x|macintosh/i.test(ua)) os = "macOS";
	else if (/linux/i.test(ua)) os = "Linux";

	let br = "其他";
	if (/edg(e)?\//i.test(ua)) br = "Edge";
	else if (/chrome|crios/i.test(ua)) br = "Chrome";
	else if (/firefox|fxios/i.test(ua)) br = "Firefox";
	else if (/safari/i.test(ua)) br = "Safari";
	else if (/opera|opr/i.test(ua)) br = "Opera";
	else if (/micromessenger/i.test(ua)) br = "微信";
	else if (/qq\/(?![0-9])|qqbrowser/i.test(ua)) br = "QQ 浏览器";
	else if (lower.includes("weibo")) br = "微博";

	return { dev, os, br };
}

// ============================================================================
// 上报接口
// ============================================================================

/** 静默丢弃时在响应头标注原因，后台诊断 / 浏览器 Network 可直接定位问题 */
function skipResponse(reason: string): Response {
	return new Response(null, {
		status: 204,
		headers: { "x-analytics-skip": reason },
	});
}

export const POST: APIRoute = async ({ request }) => {
	// 同源校验（放行无来源头请求）
	if (!originAllowed(request)) {
		return new Response(JSON.stringify({ ok: false, error: "非法来源" }), {
			status: 403,
			headers: { "Content-Type": "application/json" },
		});
	}

	const settings = await readSettings();
	// 统计关闭 / 生产未配置写入 token → 静默丢弃（响应头写明原因）
	if (!settings.enabled) {
		return skipResponse("disabled");
	}
	if (!isLocalDev) {
		const token =
			import.meta.env.ANALYTICS_TOKEN || process.env.ANALYTICS_TOKEN || "";
		if (!token) {
			return skipResponse("no-token");
		}
	}

	// 体积限制
	const contentLength = Number(request.headers.get("content-length") || 0);
	if (contentLength > MAX_BODY_SIZE) {
		return new Response(JSON.stringify({ ok: false, error: "请求过大" }), {
			status: 413,
			headers: { "Content-Type": "application/json" },
		});
	}

	let body: { events?: unknown };
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ ok: false, error: "无效的 JSON" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const rawEvents = Array.isArray(body?.events) ? body.events : [];
	if (rawEvents.length === 0 || rawEvents.length > MAX_EVENTS_PER_BATCH) {
		return new Response(
			JSON.stringify({ ok: false, error: "事件数量超出限制" }),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	const ip = getClientIp(request);
	if (!rateLimitOk(ip)) {
		return new Response(JSON.stringify({ ok: false, error: "请求过于频繁" }), {
			status: 429,
			headers: { "Content-Type": "application/json" },
		});
	}

	const ua = request.headers.get("user-agent") || "";
	if (BOT_PATTERN.test(ua)) {
		return skipResponse("bot");
	}

	const { dev, os, br } = parseUa(ua);
	// IP 归属地：解析到省/市/区（geoip.ts 内置腾讯/太平洋/请求头三层降级）
	const { cc, rg } = await resolveGeo(ip, request);
	const serverNow = Date.now();

	const events: StoredEvent[] = [];
	for (const raw of rawEvents) {
		if (typeof raw !== "object" || raw === null) continue;
		const item = raw as Record<string, unknown>;

		const path = sanitizePath(item.p as string);
		if (!path) continue;

		const vid = sanitizeString(item.v, MAX_VID_LENGTH);
		if (!/^[A-Za-z0-9_-]{8,64}$/.test(vid)) continue;

		// 事件类型：p 浏览 / d 停留补报 / a 行为；非法值按浏览处理
		const ty: EventType =
			item.ty === "p" || item.ty === "d" || item.ty === "a" ? item.ty : "p";
		if (ty === "a" && !settings.recordActions) continue;

		// 会话 ID（可选，缺失时聚合层以 vid 兜底）
		const sidRaw = sanitizeString(item.sid, MAX_VID_LENGTH);
		const sid = /^[A-Za-z0-9_-]{8,64}$/.test(sidRaw) ? sidRaw : "";

		const clientTs = Number(item.t);
		// 客户端时间超出容差则使用服务端时间，防止回填历史
		const ts =
			Number.isFinite(clientTs) &&
			Math.abs(clientTs - serverNow) <= MAX_TS_SKEW_MS
				? clientTs
				: serverNow;

		// 页面进入时间：允许略晚于服务端时间、最多回溯 12 小时
		let enter: number | undefined;
		const enterTs = Number(item.en);
		if (
			Number.isFinite(enterTs) &&
			enterTs <= serverNow + 60_000 &&
			enterTs >= serverNow - MAX_EN_SKEW_PAST
		) {
			enter = enterTs;
		}

		let dwell = Number(item.d);
		if (!Number.isFinite(dwell) || dwell < 0) dwell = 0;
		if (dwell > 24 * 60 * 60 * 1000) dwell = 24 * 60 * 60 * 1000;

		// 行为事件必须带行为名
		const action = cleanText(item.ac, MAX_ACTION_LENGTH);
		if (ty === "a" && !action) continue;
		const label = cleanText(item.al, MAX_LABEL_LENGTH);

		events.push({
			v: vid,
			ty,
			p: path,
			r: sanitizeString(item.r, MAX_REF_LENGTH),
			d: Math.round(dwell),
			t: ts,
			ip: settings.recordIp ? ip.slice(0, 64) : "",
			cc,
			rg,
			os,
			br,
			dev,
			sid,
			en: enter,
			ac: ty === "a" ? action : "",
			al: ty === "a" ? label : "",
		});
	}

	if (events.length === 0) {
		return skipResponse("no-events");
	}

	try {
		await appendEvents(events);
	} catch (error) {
		const message = error instanceof Error ? error.message : "写入失败";
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response(JSON.stringify({ ok: true, accepted: events.length }), {
		headers: { "Content-Type": "application/json" },
	});
};
