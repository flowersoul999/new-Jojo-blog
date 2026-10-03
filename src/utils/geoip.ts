/**
 * IP 归属地解析（服务端）
 *
 * 精度分层，按顺序尝试，首个成功者返回：
 * 1. 腾讯位置服务 IP 定位（需配置环境变量 TENCENT_MAP_KEY）
 *    - 同时支持 IPv4 / IPv6，国内最高精确到区/县，返回 UTF-8 JSON
 *    - 免费额度个人开发者每日 1 万次，足够博客使用
 * 2. 太平洋网络 IP 库（无需密钥，仅支持 IPv4，响应为 GBK 编码）
 *    - 国内多数 IP 可到市，部分到区/县
 * 3. 托管平台请求头兜底（Vercel 的 x-vercel-ip-city 等）
 *    - 无需外部请求，一般到市级；IPv6 在未配置密钥时也只能到这一层
 *
 * 说明：免费海外 IP 库（ip-api / ipwho.is 等）对国内 IPv6 定位经常跨省错位，
 * 因此不作为国内 IP 的数据源，避免展示错误的“详细地址”。
 *
 * 结果按 IP 内存缓存 24 小时，避免每次上报都请求外部接口。
 */

export interface GeoInfo {
	/** ISO 国家代码，如 CN；拿不到代码时可能为中文国名或空串 */
	cc: string;
	/** 国家以下地区拼接串，如 "广东省广州市黄埔区"，无数据为空串 */
	rg: string;
	/** 本次定位的精度等级 */
	level: "district" | "city" | "province" | "country" | "none";
	/** 数据来源，便于后台诊断展示 */
	source: "tencent" | "pconline" | "header" | "none";
}

const GEO_TTL = 24 * 60 * 60 * 1000;
const GEO_CACHE_MAX = 3000;
const FETCH_TIMEOUT = 4000;

const geoCache = new Map<string, { geo: GeoInfo; at: number; ttl: number }>();

/** 最近一次定位诊断（后台展示用，避免「只到国家」时无从排查） */
export interface GeoDiag {
	at: number;
	source: string;
	level: string;
	cc: string;
	rg: string;
	note: string;
}
let geoDiag: GeoDiag = {
	at: 0,
	source: "none",
	level: "none",
	cc: "",
	rg: "",
	note: "尚未有上报触发定位",
};
export function getGeoDiag(): GeoDiag {
	return geoDiag;
}

const EMPTY_GEO: GeoInfo = { cc: "", rg: "", level: "none", source: "none" };

/**
 * 本轮定位过程中产生的提示（各数据源查询时写入，resolveGeo 收尾时读入诊断）。
 * 早期实现直接修改 geoDiag.note，但失败时不更新 at/source，
 * 导致后台出现「at:0 + 有提示」的割裂展示，故改为独立变量统一收口。
 */
let lastNote = "";

/** 是否配置了区县级数据源（用于后台诊断） */
export function districtSourceReady(): boolean {
	return !!(import.meta.env.TENCENT_MAP_KEY || process.env.TENCENT_MAP_KEY);
}

function isIPv4(ip: string): boolean {
	return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip);
}

/** 本机 / 内网 / 无效地址不做外部查询 */
function isSkippableIp(ip: string): boolean {
	if (!ip || ip === "unknown") return true;
	if (ip === "::1" || ip.startsWith("127.")) return true;
	if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
	if (ip.startsWith("169.254.") || ip.startsWith("fc") || ip.startsWith("fd"))
		return true;
	if (ip.startsWith("172.")) {
		const seg = Number(ip.split(".")[1]);
		if (Number.isFinite(seg) && seg >= 16 && seg <= 31) return true;
	}
	return false;
}

/** 拼接省/市/区，自动去重（如直辖市 province 与 city 同名） */
function joinRegion(parts: Array<string | undefined | null>): string {
	const result: string[] = [];
	for (const raw of parts) {
		const part = (raw || "").trim();
		if (part && !result.includes(part)) result.push(part);
	}
	return result.join("");
}

async function fetchWithTimeout(url: string): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
	try {
		return await fetch(url, {
			signal: controller.signal,
			headers: { Accept: "application/json, text/plain, */*" },
		});
	} finally {
		clearTimeout(timer);
	}
}

/** 腾讯位置服务：v4/v6 均支持，国内可到区县 */
async function queryTencent(ip: string): Promise<GeoInfo | null> {
	const key = import.meta.env.TENCENT_MAP_KEY || process.env.TENCENT_MAP_KEY;
	if (!key) return null;
	const url = `https://apis.map.qq.com/ws/location/v1/ip?ip=${encodeURIComponent(ip)}&key=${encodeURIComponent(key)}&output=json`;
	let payload: unknown;
	try {
		const res = await fetchWithTimeout(url);
		if (!res.ok) return null;
		payload = await res.json();
	} catch {
		lastNote = "腾讯定位请求失败（网络/超时），已退回兜底";
		return null;
	}
	const root = payload as { status?: number; message?: string };
	const data = (
		payload as {
			result?: { ad_info?: Record<string, string> };
		}
	)?.result?.ad_info;
	if (root.status !== 0 || !data) {
		// 按腾讯官方状态码给出可操作的排查提示（文案对应官网状态码表）
		const status = root.status ?? "?";
		const hintMap: Record<number, string> = {
			110: "请求来源未被授权（检查 key 的域名/IP 安全设置）",
			111: "签名验证失败（key 启用了 SN 校验，需改用带签名的调用方式）",
			112: "服务器出口 IP 未被授权（Vercel 出口 IP 动态，授权 IP 请留空）",
			113: "此功能未被授权（需在控制台为 key 申请 IP 定位配额）",
			120: "此 key 每秒请求量已达上限（限流，稍后自动恢复）",
			121: "此 key 每日调用量已达上限（请到控制台查看配额与今日用量，警惕 key 被盗用）",
			190: "无效的 KEY（核对 Vercel 中 TENCENT_MAP_KEY 的值）",
			199: "此 key 未开启 WebServiceAPI 功能（请到 key 设置中勾选启用）",
			311: "key 格式错误（核对是否多了空格/换行）",
		};
		lastNote = `腾讯定位返回 status=${status}：${hintMap[root.status ?? -1] || root.message || "未知错误"}`;
		return null;
	}

	const nation = (data.nation || "").trim();
	const province = (data.province || "").trim();
	const city = (data.city || "").trim();
	const district = (data.district || "").trim();
	if (!province && !city && !district && !nation) return null;

	let level: GeoInfo["level"] = "country";
	if (district) level = "district";
	else if (city) level = "city";
	else if (province) level = "province";

	return {
		// 国内统一使用 CN 代码，海外拿不到 ISO 代码时直接用中文国名（展示层原样透传）
		cc: nation === "中国" || nation === "" ? "CN" : nation,
		rg: joinRegion([province, city, district]),
		level,
		source: "tencent",
	};
}

/** 太平洋 IP 库：GBK 编码、仅 IPv4，部分 IP 可到区县 */
async function queryPconline(ip: string): Promise<GeoInfo | null> {
	if (!isIPv4(ip)) return null;
	let buffer: ArrayBuffer;
	try {
		const res = await fetchWithTimeout(
			`https://whois.pconline.com.cn/ipJson.jsp?json=true&ip=${encodeURIComponent(ip)}`,
		);
		if (!res.ok) return null;
		buffer = await res.arrayBuffer();
	} catch {
		return null;
	}

	// 该源固定 GBK；部分精简运行时不支持 GBK 解码器，此时直接放弃，不猜测编码
	let text: string;
	try {
		text = new TextDecoder("gbk").decode(buffer);
	} catch {
		return null;
	}
	let data: { err?: string; pro?: string; city?: string; region?: string };
	try {
		data = JSON.parse(text);
	} catch {
		return null;
	}
	if (data.err || (!data.pro && !data.city && !data.region)) return null;

	const province = (data.pro || "").trim();
	const city = (data.city || "").trim();
	const district = (data.region || "").trim();
	let level: GeoInfo["level"] = "country";
	if (district) level = "district";
	else if (city) level = "city";
	else if (province) level = "province";

	return {
		cc: "CN",
		rg: joinRegion([province, city, district]),
		level,
		source: "pconline",
	};
}

/** 托管平台请求头里的免费地理信息（通常仅到国家）
 * 注意：本站为 Cloudflare 代理加速 + Vercel 部署，x-vercel-ip-* 反映的是
 * Cloudflare 出口 IP 而非访客真实 IP，不可信；优先采用 cf-ipcountry，
 * 且不使用 x-vercel-ip-city，避免把访客误标到 Cloudflare 出口城市。
 * 市/区精度交由腾讯位置服务（配 key）或太平洋库负责。 */
function geoFromHeaders(request: Request): GeoInfo {
	const cc =
		request.headers.get("cf-ipcountry") ||
		request.headers.get("x-vercel-ip-country") ||
		"";
	if (cc) {
		return { cc, rg: "", level: "country", source: "header" };
	}
	return EMPTY_GEO;
}

/**
 * 解析单个 IP 的归属地（带缓存）
 * 任何外部异常都不得影响上报主流程，失败时退回到请求头信息
 */
export async function resolveGeo(
	ip: string,
	request: Request,
): Promise<GeoInfo> {
	if (isSkippableIp(ip)) return EMPTY_GEO;

	// 重置本轮提示，避免上次失败的文案污染本次诊断
	lastNote = "";

	const cached = geoCache.get(ip);
	if (cached && Date.now() - cached.at < cached.ttl) return cached.geo;

	const headerGeo = geoFromHeaders(request);
	let geo: GeoInfo = headerGeo;
	try {
		// 有区县数据源密钥时（v4/v6 都支持）优先使用
		geo = (await queryTencent(ip)) || headerGeo;
		// 未配置密钥 / 查询失败：IPv4 走免费太平洋库尝试补省市区
		if (geo.source !== "tencent" && isIPv4(ip)) {
			const pc = await queryPconline(ip);
			if (pc) {
				// 太平洋只覆盖国内；若它给出的精度不低于请求头，则采用，并保留国家代码
				geo = {
					cc: pc.cc || headerGeo.cc,
					rg: pc.rg || headerGeo.rg,
					level: pc.rg ? pc.level : headerGeo.level,
					source: pc.rg ? "pconline" : headerGeo.source,
				};
			}
		}
	} catch {
		geo = headerGeo;
	}

	if (geoCache.size >= GEO_CACHE_MAX) geoCache.clear();
	// 缓存策略：定位到省及以上才算「有效结果」，长缓存 24 小时；
	// 仅有国家/无结果（多为外部源暂时失败或配额耗尽）只短缓存 5 分钟，
	// 避免外部服务恢复后（如刚领取配额）仍长时间返回空归属地。
	const ttl =
		geo.level === "district" || geo.level === "city" || geo.level === "province"
			? GEO_TTL
			: 5 * 60 * 1000;
	geoCache.set(ip, { geo, at: Date.now(), ttl });

	// 记录本轮定位结果，供后台诊断展示：无论成功失败都更新，
	// 失败时把数据源写入 lastNote 的具体原因一并带出
	const defaultNote =
		geo.source === "tencent"
			? "腾讯定位成功"
			: geo.source === "pconline"
				? "腾讯未配置/失败，已用太平洋库（仅 IPv4，多到市）"
				: districtSourceReady()
					? "已配置 key 但各数据源均未给出归属地，仅兜底到国家"
					: "未配置 TENCENT_MAP_KEY，仅兜底到国家（Cloudflare/Vercel 请求头）";
	geoDiag = {
		at: Date.now(),
		source: geo.source,
		level: geo.level,
		cc: geo.cc,
		rg: geo.rg,
		note: lastNote || defaultNote,
	};
	lastNote = "";
	return geo;
}
