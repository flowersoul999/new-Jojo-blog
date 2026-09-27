// 每日信息数据层：法定节假日（本地数据）、每日一言
// 所有外部请求均带 localStorage 缓存与降级方案，失败不影响页面主体

/* ---------------------------------- 法定节假日 ---------------------------------- */

export interface HolidayInfo {
	name: string;
	start: string; // YYYY-MM-DD
	days: number;
}

// 2026 年国务院放假安排 + 2027 元旦（已可预测）
// 后续年份公布后在此追加即可
export const HOLIDAYS: HolidayInfo[] = [
	{ name: "元旦", start: "2026-01-01", days: 1 },
	{ name: "春节", start: "2026-02-15", days: 8 },
	{ name: "清明节", start: "2026-04-04", days: 3 },
	{ name: "劳动节", start: "2026-05-01", days: 5 },
	{ name: "端午节", start: "2026-06-19", days: 3 },
	{ name: "中秋节", start: "2026-09-25", days: 3 },
	{ name: "国庆节", start: "2026-10-01", days: 7 },
	{ name: "元旦", start: "2027-01-01", days: 1 },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateStr(d: Date): string {
	const y = d.getFullYear();
	const m = (d.getMonth() + 1).toString().padStart(2, "0");
	const day = d.getDate().toString().padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function parseDate(str: string): Date {
	const [y, m, d] = str.split("-").map(Number);
	return new Date(y, m - 1, d);
}

/** 今天的日期 key（本地时区） */
export function getTodayKey(now: Date = new Date()): string {
	return toDateStr(now);
}

/** 今天处于假期中则返回假期信息，否则 null */
export function getOngoingHoliday(now: Date = new Date()): HolidayInfo | null {
	const today = toDateStr(now);
	return (
		HOLIDAYS.find(
			(h) =>
				today >= h.start &&
				today <=
					toDateStr(
						new Date(parseDate(h.start).getTime() + (h.days - 1) * DAY_MS),
					),
		) || null
	);
}

/** 距下一个假期（未开始）的倒计时 */
export function getNextHoliday(
	now: Date = new Date(),
): (HolidayInfo & { daysLeft: number }) | null {
	const todayStart = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
	).getTime();
	const upcoming = HOLIDAYS.map((h) => ({
		...h,
		startTime: parseDate(h.start).getTime(),
	}))
		.filter((h) => h.startTime >= todayStart)
		.sort((a, b) => a.startTime - b.startTime)[0];
	if (!upcoming) return null;
	const { startTime, ...holiday } = upcoming;
	return {
		...holiday,
		daysLeft: Math.round((startTime - todayStart) / DAY_MS),
	};
}

/** 距本周末（周六）还有几天：0 表示今天就是周六/周日 */
export function getDaysUntilWeekend(now: Date = new Date()): number {
	const day = now.getDay(); // 0 周日
	if (day === 0) return 0;
	return 6 - day; // 周六
}

/* ---------------------------------- 每日一言 ---------------------------------- */

export interface Hitokoto {
	text: string;
	from: string;
}

// 降级备用（API 失败时按日期取一条，保证有内容）
const FALLBACK_QUOTES: Hitokoto[] = [
	{ text: "把日子过成诗，简单而精致。", from: "Jojo" },
	{ text: "慢慢来，比较快。", from: "Jojo" },
	{ text: "今天也要元气满满哦！", from: "Jojo" },
	{ text: "代码和人生一样，都是不断重构的过程。", from: "Jojo" },
	{ text: "星光不问赶路人，时光不负有心人。", from: "Jojo" },
	{ text: "摸鱼不是懒惰，是给自己充充电。", from: "Jojo" },
	{ text: "保持热爱，奔赴山海。", from: "Jojo" },
	{ text: "生活明朗，万物可爱。", from: "Jojo" },
];

/** 每日一言（hitokoto API，当日缓存，失败降级内置句子） */
export async function fetchHitokoto(now: Date = new Date()): Promise<Hitokoto> {
	const key = `hitokoto-${getTodayKey(now)}`;
	try {
		const cached = localStorage.getItem(key);
		if (cached) return JSON.parse(cached) as Hitokoto;
	} catch {
		/* ignore */
	}

	try {
		const res = await fetch(
			"https://v1.hitokoto.cn/?c=i&c=k&c=d&max_length=40",
			{ signal: AbortSignal.timeout(5000) },
		);
		if (res.ok) {
			const data = (await res.json()) as { hitokoto: string; from: string };
			const result: Hitokoto = {
				text: data.hitokoto,
				from: data.from || "佚名",
			};
			try {
				localStorage.setItem(key, JSON.stringify(result));
			} catch {
				/* ignore */
			}
			return result;
		}
	} catch {
		/* ignore */
	}

	// 降级：按日期 hash 从备用池取
	const hash = simpleHash(getTodayKey(now));
	return FALLBACK_QUOTES[hash % FALLBACK_QUOTES.length];
}

/* ---------------------------------- 工具 ---------------------------------- */

export function simpleHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}
