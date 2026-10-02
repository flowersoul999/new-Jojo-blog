/**
 * 自托管统计：数据存取与聚合
 * - 设置读写（analytics/settings.json）
 * - 事件按日文件追加（analytics/events/YYYY-MM-DD.json）
 * - 按日文件内容级缓存（TTL + LRU），聚合零重复 API 调用
 * - 统计聚合：KPI / 趋势 / 设备 / 浏览器 / 地域 / 热门内容 / IP 明细
 * 生产环境使用 ANALYTICS_TOKEN 访问 GitHub，本地开发直写本地文件系统。
 */
import {
	deleteLocalFile,
	GITHUB_REPO,
	isLocalDev,
	listLocalDir,
	readLocalFile,
	writeLocalFile,
} from "./editor-auth";
import {
	type ContentsItem,
	deleteFile,
	listDir,
	NotFoundError,
	readFile,
	writeFile,
} from "./github-content";

// ============================================================================
// 常量与类型
// ============================================================================

export const EVENTS_DIR = "analytics/events";
export const SETTINGS_PATH = "analytics/settings.json";
export const TIMEZONE = "Asia/Shanghai";

export interface AnalyticsSettings {
	/** 埋点总开关 */
	enabled: boolean;
	/** 是否记录访客 IP */
	recordIp: boolean;
	/** 展示时脱敏 IP 后段 */
	maskIp: boolean;
	/** 后台管理员 GitHub 登录名白名单 */
	adminLogins: string[];
	/** 事件保留天数（过期文件懒清理） */
	retentionDays: number;
}

export const DEFAULT_SETTINGS: AnalyticsSettings = {
	enabled: true,
	recordIp: true,
	maskIp: true,
	adminLogins: [GITHUB_REPO.owner],
	retentionDays: 90,
};

/** 落盘事件字段（精简） */
export interface StoredEvent {
	v: string; // vid
	p: string; // path
	r: string; // referrer
	d: number; // dwell（毫秒）
	t: number; // 服务端落盘时间戳（毫秒）
	ip: string; // 访客 IP（recordIp=false 时为空）
	cc: string; // 国家代码
	os: string;
	br: string;
	dev: string;
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

export interface TopPath {
	path: string;
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
}

export interface BehaviorRow {
	ts: number;
	path: string;
	dwell: number;
	ip: string;
	country: string;
}

export interface StatsResult {
	today: { pv: number; uv: number };
	yesterday: { pv: number; uv: number };
	cumulative: { pv: number; uv: number };
	trend: DayPoint[];
	devices: LabelValue[];
	browsers: LabelValue[];
	countries: LabelValue[];
	topPaths: TopPath[];
	behaviors: BehaviorRow[];
	ipList: IpRow[];
	totalIpCount: number;
	rangeDays: number;
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

/** 解析服务端统计写入 token（生产必填，本地开发不需要） */
function resolveToken(): string {
	return import.meta.env.ANALYTICS_TOKEN || process.env.ANALYTICS_TOKEN || "";
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
		maskIp: raw.maskIp !== false,
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
				const file = await readFile(token, SETTINGS_PATH);
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
			const current = await readFile(token, SETTINGS_PATH);
			sha = current.sha;
		} catch (error) {
			if (!(error instanceof NotFoundError)) throw error;
		}
		await writeFile(token, SETTINGS_PATH, content, { sha });
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

	let sha: string | undefined;
	let existing: StoredEvent[] = [];
	try {
		const current = await readFile(token, filePath);
		sha = current.sha;
		existing = JSON.parse(current.content) as StoredEvent[];
	} catch (error) {
		if (!(error instanceof NotFoundError)) throw error;
	}

	await writeFile(token, filePath, JSON.stringify(existing.concat(events)), {
		sha,
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
				const file = await readFile(token, `${EVENTS_DIR}/${dateKey}.json`);
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
				type: "file",
				sha: f.sha,
				size: f.size,
			}));
	} else {
		const token = resolveToken();
		if (!token) return [];
		items = await listDir(token, EVENTS_DIR);
	}
	return items
		.map((f) => f.name.replace(/\.json$/, ""))
		.filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name))
		.sort()
		.reverse();
}

/** 加载日期范围（含首尾）内所有事件，按文件倒序返回 */
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
// 聚合
// ============================================================================

/** 按 path 汇总：PV / UV / 平均停留 */
function aggregateByPath(
	events: StoredEvent[],
): Map<
	string,
	{ pv: number; uv: Set<string>; dwellTotal: number; dwellCount: number }
> {
	const map = new Map<
		string,
		{ pv: number; uv: Set<string>; dwellTotal: number; dwellCount: number }
	>();
	for (const e of events) {
		let entry = map.get(e.p);
		if (!entry) {
			entry = { pv: 0, uv: new Set(), dwellTotal: 0, dwellCount: 0 };
			map.set(e.p, entry);
		}
		entry.pv += 1;
		entry.uv.add(e.v);
		if (e.d > 0) {
			entry.dwellTotal += e.d;
			entry.dwellCount += 1;
		}
	}
	return map;
}

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

	// KPI
	const countKpi = (list: StoredEvent[]) => {
		const uv = new Set(list.map((e) => e.v));
		return { pv: list.length, uv: uv.size };
	};
	const today = countKpi(byDay.get(todayKey) || []);
	const yesterday = countKpi(byDay.get(yesterdayKey) || []);
	const cumulative = countKpi(cumulativeEvents);

	// 趋势（零填充）
	const trend: DayPoint[] = keys.map((d) => {
		const list = byDay.get(d) || [];
		return { date: d, pv: list.length, uv: new Set(list.map((e) => e.v)).size };
	});

	// 分布
	const devices = new Map<string, number>();
	const browsers = new Map<string, number>();
	const countries = new Map<string, number>();
	for (const e of rangeEvents) {
		devices.set(e.dev || "未知", (devices.get(e.dev || "未知") || 0) + 1);
		browsers.set(e.br || "未知", (browsers.get(e.br || "未知") || 0) + 1);
		countries.set(e.cc || "未知", (countries.get(e.cc || "未知") || 0) + 1);
	}

	// 热门内容
	const pathAgg = aggregateByPath(rangeEvents);
	const topPaths: TopPath[] = [...pathAgg.entries()]
		.map(([path, v]) => ({
			path,
			pv: v.pv,
			uv: v.uv.size,
			avgDwell: v.dwellCount ? Math.round(v.dwellTotal / v.dwellCount) : 0,
		}))
		.sort((a, b) => b.pv - a.pv)
		.slice(0, 20);

	// 行为流（最近 50 条）
	const behaviors: BehaviorRow[] = [...rangeEvents]
		.sort((a, b) => b.t - a.t)
		.slice(0, 50)
		.map((e) => ({
			ts: e.t,
			path: e.p,
			dwell: e.d,
			ip: e.ip,
			country: countryName(e.cc),
		}));

	// IP 明细
	const settings = await readSettings();
	const ipMap = new Map<
		string,
		{ pv: number; uv: Set<string>; lastSeen: number; cc: string }
	>();
	for (const e of rangeEvents) {
		if (!e.ip) continue;
		let entry = ipMap.get(e.ip);
		if (!entry) {
			entry = { pv: 0, uv: new Set(), lastSeen: 0, cc: e.cc };
			ipMap.set(e.ip, entry);
		}
		entry.pv += 1;
		entry.uv.add(e.v);
		if (e.t > entry.lastSeen) entry.lastSeen = e.t;
	}
	const ipList: IpRow[] = [...ipMap.entries()]
		.map(([ip, v]) => ({
			ip: maskIpAddress(ip, settings.maskIp),
			pv: v.pv,
			uv: v.uv.size,
			lastSeen: v.lastSeen,
			country: countryName(v.cc),
		}))
		.sort((a, b) => b.lastSeen - a.lastSeen);

	return {
		today,
		yesterday,
		cumulative,
		trend,
		devices: toLabelValue(devices),
		browsers: toLabelValue(browsers),
		countries: toLabelValue(countries).slice(0, 12),
		topPaths,
		behaviors: behaviors.map((b) => ({
			...b,
			ip: maskIpAddress(b.ip, settings.maskIp),
		})),
		ipList,
		totalIpCount: ipList.length,
		rangeDays: days,
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
			ip: maskIpAddress(e.ip, settings.maskIp),
			cc: countryName(e.cc),
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
	let removed = 0;
	for (const date of all) {
		if (date >= cutoff) continue;
		try {
			if (isLocalDev) {
				deleteLocalFile(`${EVENTS_DIR}/${date}.json`);
			} else {
				const token = resolveToken();
				if (!token) return removed;
				const file = await readFile(token, `${EVENTS_DIR}/${date}.json`);
				await deleteFile(token, `${EVENTS_DIR}/${date}.json`, file.sha);
			}
			dayCache.delete(date);
			removed += 1;
		} catch {
			// 单个文件清理失败不影响其他文件
		}
	}
	return removed;
}
