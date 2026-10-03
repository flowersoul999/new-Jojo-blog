/**
 * 自托管统计：数据存取与聚合
 * - 设置读写（analytics/settings.json）
 * - 事件按日文件追加（analytics/events/YYYY-MM-DD.json）
 * - 按日文件内容级缓存（TTL + LRU），聚合零重复 API 调用
 * - 统计聚合：KPI / 趋势 / 时段 / 设备 / 浏览器 / 地域 / 模块 / 热门内容 /
 *   行为流 / IP 明细 / 访客会话时间线 / 采集诊断
 * 生产环境使用 ANALYTICS_TOKEN 访问 GitHub，本地开发直写本地文件系统。
 * 数据仓库可用 ANALYTICS_REPO_OWNER / ANALYTICS_REPO_NAME / ANALYTICS_REPO_BRANCH
 * 指向独立私有仓库，避免访客 IP 明文暴露在公开主仓库。
 */
import {
	deleteLocalFile,
	GITHUB_REPO,
	isLocalDev,
	listLocalDir,
	readLocalFile,
	writeLocalFile,
} from "./editor-auth";
import { type GeoDiag, getGeoDiag } from "./geoip";
import {
	type ContentsItem,
	deleteFile,
	listDir,
	NotFoundError,
	type RepoRef,
	readFile,
	writeFile,
} from "./github-content";

// ============================================================================
// 常量与类型
// ============================================================================

export const EVENTS_DIR = "analytics/events";
export const SETTINGS_PATH = "analytics/settings.json";
export const TIMEZONE = "Asia/Shanghai";
/** 会话切分：相邻事件间隔超过 30 分钟视为新一次访问 */
export const SESSION_GAP_MS = 30 * 60 * 1000;

export interface AnalyticsSettings {
	/** 埋点总开关 */
	enabled: boolean;
	/** 是否记录访客 IP */
	recordIp: boolean;
	/** 展示时脱敏 IP 后段 */
	maskIp: boolean;
	/** 是否采集用户操作行为（点击等交互事件） */
	recordActions: boolean;
	/** 后台管理员 GitHub 登录名白名单 */
	adminLogins: string[];
	/** 事件保留天数（过期文件懒清理） */
	retentionDays: number;
}

export const DEFAULT_SETTINGS: AnalyticsSettings = {
	enabled: true,
	recordIp: false,
	maskIp: false,
	recordActions: true,
	adminLogins: [GITHUB_REPO.owner],
	retentionDays: 90,
};

/** 事件类型：p=页面浏览，d=页面停留补报，a=操作行为（缺省按 p 兼容旧数据） */
export type EventType = "p" | "d" | "a";

/** 落盘事件字段（精简，单字母键减小文件体积） */
export interface StoredEvent {
	v: string; // vid（访客 ID）
	ty?: EventType; // 事件类型
	p: string; // path
	r?: string; // referrer
	d?: number; // dwell（页面停留毫秒，d 类事件为增量）
	t: number; // 服务端落盘时间戳（毫秒）
	ip?: string; // 访客 IP（recordIp=false 时为空）
	cc?: string; // 国家代码
	rg?: string; // 国家以下地区（省/市/区拼接，如「广东省广州市黄埔区」）
	os?: string;
	br?: string;
	dev?: string;
	sid?: string; // 会话 ID（同一标签页一次访问共享）
	en?: number; // 进入该页面的时间戳（与 sid/p 联合定位页面片段）
	ac?: string; // 行为名（a 类事件）
	al?: string; // 行为补充标签（a 类事件）
}

export interface DayPoint {
	date: string;
	pv: number;
	uv: number;
}

export interface LabelValue {
	label: string;
	value: number;
}

export interface HourPoint {
	hour: number;
	pv: number;
	uv: number;
}

export interface TopPath {
	path: string;
	module: string;
	pv: number;
	uv: number;
	avgDwell: number;
}

export interface IpRow {
	ip: string;
	pv: number;
	uv: number;
	lastSeen: number;
	country: string;
	/** 省/市/区拼接串（如「广东省广州市黄埔区」），无数据为空 */
	region?: string;
}

export interface BehaviorRow {
	ts: number;
	path: string;
	dwell: number;
	ip: string;
	country: string;
	vid: string;
}

export interface ActionRow {
	ts: number;
	path: string;
	action: string;
	label: string;
	ip: string;
	country: string;
	vid: string;
}

export interface VisitorRow {
	vid: string;
	ip: string;
	ips: string[];
	country: string;
	/** 省/市/区拼接串（如「广东省广州市黄埔区」），无数据为空 */
	region?: string;
	dev: string;
	os: string;
	br: string;

	firstTs: number;
	lastTs: number;
	sessions: number;
	pv: number;
	actions: number;
	pageCount: number;
}

export interface SessionPage {
	path: string;
	enter: number;
	dwell: number;
	views: number;
}

export interface SessionAction {
	ts: number;
	path: string;
	action: string;
	label: string;
}

export interface VisitorSession {
	start: number;
	end: number;
	pv: number;
	pages: SessionPage[];
	actions: SessionAction[];
}

export interface VisitorDetail {
	vid: string;
	ip: string;
	ips: string[];
	country: string;
	/** 省/市/区拼接串（如「广东省广州市黄埔区」），无数据为空 */
	region?: string;
	dev: string;
	os: string;
	br: string;
	firstTs: number;
	lastTs: number;
	sessions: VisitorSession[];
}

export interface AnalyticsDiagnostics {
	env: "local" | "production";
	/** 服务端写入令牌是否就绪（本地恒为 true） */
	tokenConfigured: boolean;
	enabled: boolean;
	recordIp: boolean;
	recordActions: boolean;
	repo: {
		owner: string;
		name: string;
		branch: string;
		isMainRepo: boolean;
	};
	/** 数据写入公开仓库且开启 IP 记录时为 true（隐私风险提示） */
	ipExposed: boolean;
	dayFiles: number;
	latestDay: string | null;
	latestEventTs: number | null;
	eventsToday: number;
	serverTime: number;
	storeError: string;
	/** 最近一次 IP→地域定位的诊断快照（来源/层级/原因），用于排查“只到国家”的问题 */
	geoDiag: GeoDiag;
}

export interface StatsResult {
	today: { pv: number; uv: number };
	yesterday: { pv: number; uv: number };
	cumulative: { pv: number; uv: number };
	trend: DayPoint[];
	hourly: HourPoint[];
	devices: LabelValue[];
	browsers: LabelValue[];
	countries: LabelValue[];
	modules: LabelValue[];
	topPaths: TopPath[];
	actions: LabelValue[];
	actionStream: ActionRow[];
	behaviors: BehaviorRow[];
	visitors: VisitorRow[];
	totalVisitors: number;
	ipList: IpRow[];
	totalIpCount: number;
	rangeDays: number;
	diagnostics: AnalyticsDiagnostics;
}

// ============================================================================
// 工具
// ============================================================================

/** Asia/Shanghai 时区的日期键 YYYY-MM-DD */
export function dayKey(ts: number): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(ts);
}

/** 近 n 天（含 endTs 当天）的日期键列表 */
export function lastNDayKeys(n: number, endTs: number = Date.now()): string[] {
	const keys: string[] = [];
	for (let i = n - 1; i >= 0; i--) {
		keys.push(dayKey(endTs - i * 86_400_000));
	}
	return keys;
}

/** 读取任意环境变量（Vite 注入与 Node 运行时兜底） */
function envPick(key: string): string {
	const fromMeta = (
		import.meta.env as unknown as Record<string, string | undefined>
	)[key];
	return fromMeta || process.env[key] || "";
}

/** 解析服务端统计写入 token（生产必填，本地开发不需要） */
function resolveToken(): string {
	return envPick("ANALYTICS_TOKEN");
}

/** 统计数据所在仓库（可用环境变量指向独立私有仓库） */
export function analyticsRepo(): RepoRef {
	return {
		owner: envPick("ANALYTICS_REPO_OWNER") || GITHUB_REPO.owner,
		name: envPick("ANALYTICS_REPO_NAME") || GITHUB_REPO.name,
		branch: envPick("ANALYTICS_REPO_BRANCH") || GITHUB_REPO.branch,
	};
}

/** IP 展示脱敏：192.168.1.23 → 192.168.1.*；IPv6 保留前三组 */
export function maskIpAddress(ip: string, mask: boolean): string {
	if (!mask || !ip) return ip;
	if (ip.includes(":")) {
		const parts = ip.split(":");
		return `${parts.slice(0, 3).join(":")}:*`;
	}
	const parts = ip.split(".");
	if (parts.length !== 4) return ip;
	parts[3] = "*";
	return parts.join(".");
}

/** 去除 ASCII 控制字符、压缩空白并截断（用于行为名/标签消毒） */
export function cleanText(raw: unknown, max: number): string {
	if (typeof raw !== "string") return "";
	let out = "";
	for (const ch of raw) {
		const code = ch.codePointAt(0) ?? 0;
		if (code <= 0x1f || code === 0x7f) continue;
		out += ch;
	}
	return out.replace(/\s+/g, " ").trim().slice(0, max);
}

/** Asia/Shanghai 时区的小时数（0-23） */
export function hourOf(ts: number): number {
	const h = Number(
		new Intl.DateTimeFormat("en-US", {
			timeZone: TIMEZONE,
			hour: "2-digit",
			hour12: false,
		}).format(ts),
	);
	return h % 24;
}

/** 路径 → 站点模块名（用于「用户访问过哪些模块」统计） */
const MODULE_RULES: Array<[RegExp, string]> = [
	[/^\/$/, "首页"],
	[/^\/posts(\/|$)/, "博客文章"],
	[/^\/diary(\/|$)/, "日记"],
	[/^\/gallery(\/|$)/, "相册"],
	[/^\/treasure(\/|$)/, "百宝箱"],
	[/^\/tags(\/|$)/, "标签"],
	[/^\/categories(\/|$)/, "分类"],
	[/^\/search/, "搜索"],
	[/^\/archive/, "归档"],
	[/^\/(friends|links)(\/|$)/, "友情链接"],
	[/^\/guestbook/, "留言板"],
	[/^\/moments/, "说说"],
	[/^\/life/, "生活"],
	[/^\/(bangumi|anime)(\/|$)/, "番组计划"],
	[/^\/about/, "关于"],
	[/^\/tools/, "工具"],
	[/^\/write/, "写作"],
	[/^\/(manage|memories)(\/|$)/, "内容管理"],
	[/^\/rss/, "订阅"],
	[/^\/api/, "接口"],
];

export function moduleOf(path: string): string {
	for (const [re, label] of MODULE_RULES) {
		if (re.test(path)) return label;
	}
	return path.split("/")[1] ? "其他页面" : "其他";
}

/** 国家代码 → 中文名（覆盖常用国家，未命中回退代码本身） */
const COUNTRY_NAMES: Record<string, string> = {
	CN: "中国",
	US: "美国",
	JP: "日本",
	KR: "韩国",
	SG: "新加坡",
	HK: "中国香港",
	TW: "中国台湾",
	MO: "中国澳门",
	GB: "英国",
	DE: "德国",
	FR: "法国",
	RU: "俄罗斯",
	CA: "加拿大",
	AU: "澳大利亚",
	IN: "印度",
	BR: "巴西",
	NL: "荷兰",
	SE: "瑞典",
	FI: "芬兰",
	NO: "挪威",
	DK: "丹麦",
	PL: "波兰",
	UA: "乌克兰",
	IT: "意大利",
	ES: "西班牙",
	CH: "瑞士",
	AT: "奥地利",
	BE: "比利时",
	IE: "爱尔兰",
	NZ: "新西兰",
	MY: "马来西亚",
	TH: "泰国",
	VN: "越南",
	PH: "菲律宾",
	ID: "印度尼西亚",
	AE: "阿联酋",
	SA: "沙特阿拉伯",
	TR: "土耳其",
	IL: "以色列",
	EG: "埃及",
	ZA: "南非",
	MX: "墨西哥",
	AR: "阿根廷",
	CL: "智利",
	CO: "哥伦比亚",
	UNKNOWN: "未知",
};

export function countryName(code: string): string {
	if (!code) return COUNTRY_NAMES.UNKNOWN;
	return COUNTRY_NAMES[code] || code;
}

// ============================================================================
// 设置
// ============================================================================

let settingsCache: { value: AnalyticsSettings; at: number } | null = null;
const SETTINGS_TTL = 60_000;

function normalizeSettings(raw: Partial<AnalyticsSettings>): AnalyticsSettings {
	return {
		enabled: raw.enabled !== false,
		recordIp: raw.recordIp !== false,
		maskIp: raw.maskIp === true,
		recordActions: raw.recordActions !== false,
		adminLogins:
			Array.isArray(raw.adminLogins) && raw.adminLogins.length > 0
				? raw.adminLogins.filter((x) => typeof x === "string" && x.trim())
				: [GITHUB_REPO.owner],
		retentionDays:
			Number(raw.retentionDays) > 0
				? Math.min(Number(raw.retentionDays), 3650)
				: 90,
	};
}

/** 读取设置（带 60s 缓存，读取失败回退默认值） */
export async function readSettings(): Promise<AnalyticsSettings> {
	if (settingsCache && Date.now() - settingsCache.at < SETTINGS_TTL) {
		return settingsCache.value;
	}
	let settings = DEFAULT_SETTINGS;
	try {
		if (isLocalDev) {
			try {
				const file = readLocalFile(SETTINGS_PATH);
				if (file.content)
					settings = normalizeSettings(JSON.parse(file.content));
			} catch {
				// 本地未创建设置文件时使用默认值
			}
		} else {
			const token = resolveToken();
			if (token) {
				const file = await readFile(token, SETTINGS_PATH, analyticsRepo());
				if (file.content)
					settings = normalizeSettings(JSON.parse(file.content));
			}
		}
	} catch {
		// 设置读取失败时使用默认值，避免功能整体不可用
	}
	settingsCache = { value: settings, at: Date.now() };
	return settings;
}

/** 写入设置（后台管理调用），并刷新缓存 */
export async function writeSettings(
	raw: Partial<AnalyticsSettings>,
): Promise<AnalyticsSettings> {
	const next = normalizeSettings(raw);
	if (isLocalDev) {
		writeLocalFile(SETTINGS_PATH, JSON.stringify(next, null, 2));
	} else {
		const token = resolveToken();
		if (!token) throw new Error("未配置 ANALYTICS_TOKEN，无法保存设置");
		const content = JSON.stringify(next, null, 2);
		let sha: string | undefined;
		try {
			const current = await readFile(token, SETTINGS_PATH, analyticsRepo());
			sha = current.sha;
		} catch (error) {
			if (!(error instanceof NotFoundError)) throw error;
		}
		await writeFile(token, SETTINGS_PATH, content, {
			sha,
			repo: analyticsRepo(),
		});
	}
	settingsCache = { value: next, at: Date.now() };
	return next;
}

// ============================================================================
// 事件写入
// ============================================================================

/**
 * 追加批量事件到当日文件
 * 并发冲突时通过 readFile + merge 重试，最多 3 次
 */
export async function appendEvents(events: StoredEvent[]): Promise<void> {
	if (events.length === 0) return;
	const dateKey = dayKey(Date.now());
	const filePath = `${EVENTS_DIR}/${dateKey}.json`;

	if (isLocalDev) {
		let existing: StoredEvent[] = [];
		try {
			const file = readLocalFile(filePath);
			if (file.content) existing = JSON.parse(file.content) as StoredEvent[];
		} catch {
			// 当日文件还不存在
		}
		writeLocalFile(filePath, JSON.stringify(existing.concat(events)));
		return;
	}

	const token = resolveToken();
	if (!token) return;

	const repo = analyticsRepo();
	let sha: string | undefined;
	let existing: StoredEvent[] = [];
	try {
		const current = await readFile(token, filePath, repo);
		sha = current.sha;
		existing = JSON.parse(current.content) as StoredEvent[];
	} catch (error) {
		if (!(error instanceof NotFoundError)) throw error;
	}

	await writeFile(token, filePath, JSON.stringify(existing.concat(events)), {
		sha,
		repo,
		onConflict: (latest) => {
			let base: StoredEvent[] = [];
			try {
				base = latest ? (JSON.parse(latest) as StoredEvent[]) : [];
			} catch {
				base = [];
			}
			return JSON.stringify(base.concat(events));
		},
		message: `Update analytics ${dateKey}`,
	});
}

// ============================================================================
// 按日读取 + 缓存
// ============================================================================

const dayCache = new Map<string, { events: StoredEvent[]; at: number }>();
const DAY_TTL = 60_000;
const DAY_CACHE_MAX = 20;

/** 读取某日事件（60s 内容级缓存 + LRU） */
export async function loadDay(dateKey: string): Promise<StoredEvent[]> {
	const cached = dayCache.get(dateKey);
	if (cached && Date.now() - cached.at < DAY_TTL) return cached.events;

	let events: StoredEvent[] = [];
	if (isLocalDev) {
		try {
			const file = readLocalFile(`${EVENTS_DIR}/${dateKey}.json`);
			if (file.content) events = JSON.parse(file.content) as StoredEvent[];
		} catch {
			// 该日无数据
		}
	} else {
		const token = resolveToken();
		if (token) {
			try {
				const file = await readFile(
					token,
					`${EVENTS_DIR}/${dateKey}.json`,
					analyticsRepo(),
				);
				if (file.content) events = JSON.parse(file.content) as StoredEvent[];
			} catch (error) {
				if (!(error instanceof NotFoundError)) throw error;
			}
		}
	}

	if (dayCache.size >= DAY_CACHE_MAX) {
		const oldest = [...dayCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
		if (oldest) dayCache.delete(oldest[0]);
	}
	dayCache.set(dateKey, { events, at: Date.now() });
	return events;
}

/** 列出所有事件日期（按名称倒序） */
async function listEventDates(): Promise<string[]> {
	let items: ContentsItem[] = [];
	if (isLocalDev) {
		const local = listLocalDir(EVENTS_DIR);
		items = local
			.filter((f) => f.type === "file")
			.map((f) => ({
				name: f.name,
				path: f.path,
				type: "file" as const,
				sha: f.sha,
				size: f.size,
			}));
	} else {
		const token = resolveToken();
		if (!token) return [];
		items = await listDir(token, EVENTS_DIR, analyticsRepo());
	}
	return items
		.map((f) => f.name.replace(/\.json$/, ""))
		.filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name))
		.sort()
		.reverse();
}

/** 加载日期范围（含首尾）内所有事件 */
async function loadRange(
	startDate: string,
	endDate: string,
): Promise<{ events: StoredEvent[]; dates: string[] }> {
	const all = await listEventDates();
	const dates = all.filter((d) => d >= startDate && d <= endDate);
	const loaded = await Promise.all(dates.map((d) => loadDay(d)));
	return { events: loaded.flat(), dates };
}

// ============================================================================
// 会话构建
// ============================================================================

interface SessionData {
	sid: string;
	vid: string;
	start: number;
	end: number;
	pv: number;
	ips: string[];
	cc: string;
	rg: string;
	os: string;
	br: string;
	dev: string;
	pages: Map<
		string,
		{ path: string; enter: number; dwell: number; views: number }
	>;
	pageOrder: string[];
	actions: SessionAction[];
}

/** 页面片段键：同一次进入（en）的 p/d 事件合并为一条页面停留记录 */
function pageKeyOf(e: StoredEvent): string {
	return `${e.en ?? e.t}|${e.p}`;
}

/**
 * 将事件流组装为会话：
 * - 优先使用客户端 sid；同 sid 相邻事件间隔超过 30 分钟再切分会话
 * - p 事件计 PV 与页面进入；d 事件累加停留；a 事件入行为时间线
 */
function buildSessions(events: StoredEvent[]): SessionData[] {
	const sorted = [...events].sort((a, b) => a.t - b.t);
	const chains = new Map<
		string,
		{ session: SessionData; lastT: number; seq: number }
	>();
	const result: SessionData[] = [];

	const pushIp = (s: SessionData, ip?: string) => {
		if (!ip) return;
		const idx = s.ips.indexOf(ip);
		if (idx >= 0) s.ips.splice(idx, 1);
		s.ips.unshift(ip);
	};

	for (const e of sorted) {
		const baseSid = e.sid || e.v;
		let chain = chains.get(baseSid);
		if (!chain || e.t - chain.lastT > SESSION_GAP_MS) {
			const seq = chain ? chain.seq + 1 : 0;
			const session: SessionData = {
				sid: `${baseSid}#${seq}`,
				vid: e.v,
				start: e.ty === "p" && e.en ? e.en : e.t,
				end: e.t,
				pv: 0,
			ips: [],
			cc: e.cc || "",
			rg: e.rg || "",
			os: e.os || "",
				br: e.br || "",
				dev: e.dev || "",
				pages: new Map(),
				pageOrder: [],
				actions: [],
			};
			chain = { session, lastT: e.t, seq };
			chains.set(baseSid, chain);
			result.push(session);
		}
		const s = chain.session;
		chain.lastT = e.t;
		if (e.t > s.end) s.end = e.t;
		if (e.ip) pushIp(s, e.ip);
		if (e.cc) s.cc = e.cc;
		if (e.rg) s.rg = e.rg;
		if (e.os) s.os = e.os;
		if (e.br) s.br = e.br;
		if (e.dev) s.dev = e.dev;

		if ((e.ty ?? "p") === "p") {
			s.pv += 1;
			const key = pageKeyOf(e);
			let page = s.pages.get(key);
			if (!page) {
				page = { path: e.p, enter: e.en ?? e.t, dwell: 0, views: 0 };
				s.pages.set(key, page);
				s.pageOrder.push(key);
			}
			page.views += 1;
			if ((e.en ?? e.t) < page.enter) page.enter = e.en ?? e.t;
			if ((e.en ?? e.t) < s.start) s.start = e.en ?? e.t;
			if ((e.d ?? 0) > page.dwell) page.dwell = e.d ?? 0;
		} else if (e.ty === "d") {
			let page = s.pages.get(pageKeyOf(e));
			if (!page) {
				// p 事件可能落在统计范围外，按同路径最后一页兜底
				for (let i = s.pageOrder.length - 1; i >= 0; i--) {
					const candidate = s.pages.get(s.pageOrder[i]);
					if (candidate && candidate.path === e.p) {
						page = candidate;
						break;
					}
				}
			}
			if (page) page.dwell += e.d ?? 0;
		} else if (e.ty === "a") {
			s.actions.push({
				ts: e.t,
				path: e.p,
				action: e.ac || "操作",
				label: e.al || "",
			});
		}
	}

	return result;
}

// ============================================================================
// 聚合
// ============================================================================

function toLabelValue(
	map: Map<string, number> | Record<string, number>,
	sortDesc = true,
): LabelValue[] {
	const entries = map instanceof Map ? [...map.entries()] : Object.entries(map);
	return entries
		.filter(([, v]) => v > 0)
		.map(([label, value]) => ({ label, value }))
		.sort((a, b) => (sortDesc ? b.value - a.value : a.value - b.value));
}

/** 从会话列表汇总访客维度 */
function aggregateVisitors(
	sessions: SessionData[],
	mask: boolean,
): VisitorRow[] {
	const map = new Map<
		string,
		{
			ips: string[];
			cc: string;
			rg: string;
			os: string;
			br: string;
			dev: string;
			firstTs: number;
			lastTs: number;
			sessionCount: number;
			pv: number;
			actions: number;
			pages: Set<string>;
		}
	>();

	for (const s of sessions) {
		let row = map.get(s.vid);
		if (!row) {
			row = {
				ips: [],
				cc: "",
				rg: "",
				os: "",
				br: "",
				dev: "",
				firstTs: s.start,
				lastTs: s.end,
				sessionCount: 0,
				pv: 0,
				actions: 0,
				pages: new Set(),
			};
			map.set(s.vid, row);
		}
		for (const ip of s.ips) {
			if (!row.ips.includes(ip)) row.ips.push(ip);
		}
		if (s.start < row.firstTs) row.firstTs = s.start;
		if (s.end > row.lastTs) row.lastTs = s.end;
		row.cc = s.cc || row.cc;
		row.rg = s.rg || row.rg;
		row.os = s.os || row.os;
		row.br = s.br || row.br;
		row.dev = s.dev || row.dev;
		row.sessionCount += 1;
		row.pv += s.pv;
		row.actions += s.actions.length;
		for (const key of s.pageOrder) {
			const page = s.pages.get(key);
			if (page) row.pages.add(page.path);
		}
	}

	return [...map.entries()]
		.map(([vid, v]) => ({
			vid,
			ip: maskIpAddress(v.ips[0] || "", mask),
			ips: v.ips.slice(0, 3).map((ip) => maskIpAddress(ip, mask)),
			country: countryName(v.cc),
			region: v.rg || "",
			dev: v.dev || "未知",
			os: v.os || "未知",
			br: v.br || "未知",
			firstTs: v.firstTs,
			lastTs: v.lastTs,
			sessions: v.sessionCount,
			pv: v.pv,
			actions: v.actions,
			pageCount: v.pages.size,
		}))
		.sort((a, b) => b.lastTs - a.lastTs)
		.slice(0, 500);
}

/**
 * 核心聚合：返回后台仪表盘所需全部统计
 * @param days 趋势/排行统计范围（默认 30 天）
 */
export async function aggregateStats(days = 30): Promise<StatsResult> {
	const now = Date.now();
	const todayKey = dayKey(now);
	const yesterdayKey = dayKey(now - 86_400_000);

	// 趋势范围 + 累计范围（累计最多读 400 个文件，防止极端情况超时）
	const keys = lastNDayKeys(days, now);
	const allDates = await listEventDates();
	const cumulativeDates = allDates.slice(0, 400);
	const union = new Set([...allDates, ...keys]);

	const loaded = await Promise.all([...union].map((d) => loadDay(d)));
	const byDay = new Map<string, StoredEvent[]>();
	[...union].forEach((d, i) => {
		byDay.set(d, loaded[i]);
	});

	const rangeEvents = keys.flatMap((d) => byDay.get(d) || []);
	const cumulativeEvents = cumulativeDates.flatMap((d) => byDay.get(d) || []);
	// 仅页面浏览事件参与 PV/UV 与分布统计（d 停留补报、a 行为不重复计 PV）
	const pageEvents = rangeEvents.filter((e) => (e.ty ?? "p") === "p");
	const actionEvents = rangeEvents.filter((e) => e.ty === "a");

	// 页面停留：新版 d 事件按 vid/sid/en/p 汇总，旧版 p 事件自带 d 直接使用
	const dwellMap = new Map<string, number>();
	for (const e of rangeEvents) {
		if (e.ty !== "d") continue;
		const key = `${e.v}|${e.sid || e.v}|${e.en ?? ""}|${e.p}`;
		dwellMap.set(key, (dwellMap.get(key) || 0) + (e.d ?? 0));
	}
	const effectiveDwell = (e: StoredEvent): number => {
		const key = `${e.v}|${e.sid || e.v}|${e.en ?? ""}|${e.p}`;
		return Math.max(e.d ?? 0, dwellMap.get(key) || 0);
	};

	// KPI
	const countKpi = (list: StoredEvent[]) => {
		const uv = new Set(list.map((e) => e.v));
		return { pv: list.length, uv: uv.size };
	};
	const today = countKpi(
		(byDay.get(todayKey) || []).filter((e) => (e.ty ?? "p") === "p"),
	);
	const yesterday = countKpi(
		(byDay.get(yesterdayKey) || []).filter((e) => (e.ty ?? "p") === "p"),
	);
	const cumulative = countKpi(
		cumulativeEvents.filter((e) => (e.ty ?? "p") === "p"),
	);

	// 趋势（零填充）
	const trend: DayPoint[] = keys.map((d) => {
		const list = (byDay.get(d) || []).filter((e) => (e.ty ?? "p") === "p");
		return { date: d, pv: list.length, uv: new Set(list.map((e) => e.v)).size };
	});

	// 24 小时访问时段（按 Asia/Shanghai）
	const hourly: HourPoint[] = Array.from({ length: 24 }, (_, hour) => ({
		hour,
		pv: 0,
		uv: 0,
	}));
	const hourlyUv = Array.from({ length: 24 }, () => new Set<string>());
	for (const e of pageEvents) {
		const h = hourOf(e.en && e.en <= e.t ? e.en : e.t);
		hourly[h].pv += 1;
		hourlyUv[h].add(e.v);
	}
	hourly.forEach((point) => {
		point.uv = hourlyUv[point.hour].size;
	});

	// 分布
	const devices = new Map<string, number>();
	const browsers = new Map<string, number>();
	const countries = new Map<string, number>();
	const modules = new Map<string, number>();
	for (const e of pageEvents) {
		devices.set(e.dev || "未知", (devices.get(e.dev || "未知") || 0) + 1);
		browsers.set(e.br || "未知", (browsers.get(e.br || "未知") || 0) + 1);
		countries.set(e.cc || "未知", (countries.get(e.cc || "未知") || 0) + 1);
		const module = moduleOf(e.p);
		modules.set(module, (modules.get(module) || 0) + 1);
	}

	// 热门内容（停留用 d 事件补全）
	const pathAgg = new Map<
		string,
		{ pv: number; uv: Set<string>; dwellTotal: number; dwellCount: number }
	>();
	for (const e of pageEvents) {
		let entry = pathAgg.get(e.p);
		if (!entry) {
			entry = { pv: 0, uv: new Set(), dwellTotal: 0, dwellCount: 0 };
			pathAgg.set(e.p, entry);
		}
		entry.pv += 1;
		entry.uv.add(e.v);
		const dwell = effectiveDwell(e);
		if (dwell > 0) {
			entry.dwellTotal += dwell;
			entry.dwellCount += 1;
		}
	}
	const topPaths: TopPath[] = [...pathAgg.entries()]
		.map(([path, v]) => ({
			path,
			module: moduleOf(path),
			pv: v.pv,
			uv: v.uv.size,
			avgDwell: v.dwellCount ? Math.round(v.dwellTotal / v.dwellCount) : 0,
		}))
		.sort((a, b) => b.pv - a.pv)
		.slice(0, 20);

	// 行为类型汇总 + 行为流
	const actionCounts = new Map<string, number>();
	for (const e of actionEvents) {
		const name = e.ac || "操作";
		actionCounts.set(name, (actionCounts.get(name) || 0) + 1);
	}

	const settings = await readSettings();
	const mask = settings.maskIp;
	const actionStream: ActionRow[] = [...actionEvents]
		.sort((a, b) => b.t - a.t)
		.slice(0, 80)
		.map((e) => ({
			ts: e.t,
			path: e.p,
			action: e.ac || "操作",
			label: e.al || "",
			ip: maskIpAddress(e.ip || "", mask),
			country: countryName(e.cc || ""),
			vid: e.v,
		}));

	// 最近页面访问
	const behaviors: BehaviorRow[] = [...pageEvents]
		.sort((a, b) => b.t - a.t)
		.slice(0, 50)
		.map((e) => ({
			ts: e.t,
			path: e.p,
			dwell: effectiveDwell(e),
			ip: maskIpAddress(e.ip || "", mask),
			country: countryName(e.cc || ""),
			vid: e.v,
		}));

	// 会话与访客
	const sessions = buildSessions(rangeEvents);
	const visitors = aggregateVisitors(sessions, mask);

	// IP 明细
	const ipMap = new Map<
		string,
		{ pv: number; uv: Set<string>; lastSeen: number; cc: string; rg: string }
	>();
	for (const e of pageEvents) {
		if (!e.ip) continue;
		let entry = ipMap.get(e.ip);
		if (!entry) {
			entry = {
				pv: 0,
				uv: new Set(),
				lastSeen: 0,
				cc: e.cc || "",
				rg: e.rg || "",
			};
			ipMap.set(e.ip, entry);
		}
		entry.pv += 1;
		entry.uv.add(e.v);
		if (e.t > entry.lastSeen) entry.lastSeen = e.t;
		// 归属地优先取更精准的 rg；同 IP 多次上报以非空者覆盖
		if (e.rg && !entry.rg) entry.rg = e.rg;
	}
	const ipList: IpRow[] = [...ipMap.entries()]
		.map(([ip, v]) => ({
			ip: maskIpAddress(ip, mask),
			pv: v.pv,
			uv: v.uv.size,
			lastSeen: v.lastSeen,
			country: countryName(v.cc),
			region: v.rg || "",
		}))
		.sort((a, b) => b.lastSeen - a.lastSeen);

	const diagnostics = await getDiagnostics(allDates);

	return {
		today,
		yesterday,
		cumulative,
		trend,
		hourly,
		devices: toLabelValue(devices),
		browsers: toLabelValue(browsers),
		countries: toLabelValue(countries).slice(0, 12),
		modules: toLabelValue(modules),
		topPaths,
		actions: toLabelValue(actionCounts).slice(0, 20),
		actionStream,
		behaviors,
		visitors,
		totalVisitors: visitors.length,
		ipList,
		totalIpCount: ipList.length,
		rangeDays: days,
		diagnostics,
	};
}

// ============================================================================
// 访客详情（会话时间线）
// ============================================================================

const VID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/** 单个访客近 n 天的会话明细：访问时间段 + 页面轨迹 + 操作行为 */
export async function getVisitorDetail(
	vid: string,
	days = 30,
): Promise<VisitorDetail | null> {
	if (!VID_PATTERN.test(vid)) return null;
	const now = Date.now();
	const keys = lastNDayKeys(Math.min(Math.max(days, 7), 365), now);
	const startDate = keys[0];
	const endDate = keys[keys.length - 1];
	const { events } = await loadRange(startDate, endDate);
	const mine = events.filter((e) => e.v === vid);
	if (mine.length === 0) return null;

	const settings = await readSettings();
	const sessions = buildSessions(mine);
	const latest = sessions[sessions.length - 1];
	const allIps = [...new Set(sessions.flatMap((s) => s.ips))];

	return {
		vid,
		ip: maskIpAddress(allIps[0] || "", settings.maskIp),
		ips: allIps.slice(0, 5).map((ip) => maskIpAddress(ip, settings.maskIp)),
		country: countryName(latest?.cc || ""),
		region: latest?.rg || "",
		dev: latest?.dev || "未知",
		os: latest?.os || "未知",
		br: latest?.br || "未知",
		firstTs: sessions.reduce(
			(m, s) => Math.min(m, s.start),
			Number.POSITIVE_INFINITY,
		),
		lastTs: sessions.reduce((m, s) => Math.max(m, s.end), 0),
		sessions: sessions
			.map((s) => ({
				start: s.start,
				end: s.end,
				pv: s.pv,
				pages: s.pageOrder
					.map((key) => {
						const page = s.pages.get(key);
						return page
							? {
									path: page.path,
									enter: page.enter,
									dwell: page.dwell,
									views: page.views,
								}
							: null;
					})
					.filter((p): p is SessionPage => p !== null),
				actions: s.actions,
			}))
			.reverse(),
	};
}

// ============================================================================
// 采集诊断
// ============================================================================

/** 主站仓库公开（数据写入主仓库且记录 IP 时存在隐私暴露） */
const MAIN_REPO_PUBLIC = true;

/** 诊断采集链路状态，供后台首页直接展示失败原因 */
export async function getDiagnostics(
	knownDates?: string[],
): Promise<AnalyticsDiagnostics> {
	const settings = await readSettings();
	const repo = analyticsRepo();
	const isMainRepo =
		repo.owner === GITHUB_REPO.owner && repo.name === GITHUB_REPO.name;
	const tokenConfigured = isLocalDev || !!resolveToken();

	let dayFiles = 0;
	let latestDay: string | null = null;
	let latestEventTs: number | null = null;
	let eventsToday = 0;
	let storeError = "";
	try {
		const dates = knownDates ?? (await listEventDates());
		dayFiles = dates.length;
		latestDay = dates[0] ?? null;
		if (latestDay) {
			const latestEvents = await loadDay(latestDay);
			latestEventTs = latestEvents.reduce((max, e) => Math.max(max, e.t), 0);
			if (latestEventTs === 0) latestEventTs = null;
		}
		const todayK = dayKey(Date.now());
		if (dates.includes(todayK)) {
			const todayEvents = await loadDay(todayK);
			eventsToday = todayEvents.filter((e) => (e.ty ?? "p") === "p").length;
		}
	} catch (error) {
		storeError = error instanceof Error ? error.message : "存储读取失败";
	}

	return {
		env: isLocalDev ? "local" : "production",
		tokenConfigured,
		enabled: settings.enabled,
		recordIp: settings.recordIp,
		recordActions: settings.recordActions,
		repo: {
			owner: repo.owner,
			name: repo.name,
			branch: repo.branch,
			isMainRepo,
		},
		ipExposed: settings.recordIp && isMainRepo && MAIN_REPO_PUBLIC,
		dayFiles,
		latestDay,
		latestEventTs,
		eventsToday,
		serverTime: Date.now(),
		storeError,
		geoDiag: getGeoDiag(),
	};
}

// ============================================================================
// 数据导出
// ============================================================================

/** 导出日期范围内的事件（脱敏按设置），供 CSV / JSON 使用 */
export async function exportEvents(
	from: string,
	to: string,
): Promise<StoredEvent[]> {
	const startDate = /^\d{4}-\d{2}-\d{2}$/.test(from)
		? from
		: dayKey(Date.now() - 30 * 86_400_000);
	const endDate = /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : dayKey(Date.now());
	const { events } = await loadRange(startDate, endDate);
	const settings = await readSettings();
	return events
		.map((e) => ({
			...e,
			ip: maskIpAddress(e.ip || "", settings.maskIp),
			cc: e.cc ? countryName(e.cc) : "",
		}))
		.sort((a, b) => a.t - b.t);
}

// ============================================================================
// 过期清理（懒执行）
// ============================================================================

let lastCleanupAt = 0;
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;

/**
 * 清理超过保留天数的事件文件
 * 每 isolate 24h 至多自动执行一次；force 用于设置页"立即清理"
 */
export async function cleanupExpired(
	retentionDays: number,
	force = false,
): Promise<number> {
	const now = Date.now();
	if (!force && now - lastCleanupAt < CLEANUP_INTERVAL) return 0;
	lastCleanupAt = now;

	const all = await listEventDates();
	const cutoff = dayKey(now - retentionDays * 86_400_000);
	const repo = analyticsRepo();
	let removed = 0;
	for (const date of all) {
		if (date >= cutoff) continue;
		try {
			if (isLocalDev) {
				deleteLocalFile(`${EVENTS_DIR}/${date}.json`);
			} else {
				const token = resolveToken();
				if (!token) return removed;
				const file = await readFile(token, `${EVENTS_DIR}/${date}.json`, repo);
				await deleteFile(token, `${EVENTS_DIR}/${date}.json`, file.sha, repo);
			}
			dayCache.delete(date);
			removed += 1;
		} catch {
			// 单个文件清理失败不影响其他文件
		}
	}
	return removed;
}
