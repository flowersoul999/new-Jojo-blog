import type { APIRoute } from "astro";

export const prerender = false;

interface LyricChar {
	/** 该字/词片段的文本（可能是多字词组或英文单词） */
	text: string;
	/** 该字开始演唱的时间（秒，绝对时间） */
	time: number;
	/** 该字持续时长（秒） */
	dur: number;
}

interface LyricLine {
	/** 本行开始时间（秒） */
	time: number;
	/** 本行纯文本 */
	text: string;
	/** 本行持续时间（秒，YRC 才有） */
	dur?: number;
	/** 逐字片段；存在时前端可做精确逐字高亮 */
	chars?: LyricChar[];
}

/** 解析行级 LRC 文本 → [{ time: 秒, text }] */
function parseLrc(lrcText: string): LyricLine[] {
	if (!lrcText) return [];
	const lines = lrcText.split(/\r?\n/);
	const result: LyricLine[] = [];
	const tsRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

	for (const raw of lines) {
		tsRegex.lastIndex = 0;
		const text = raw.replace(tsRegex, "").trim();
		if (!text) continue;
		let match = tsRegex.exec(raw);
		while (match !== null) {
			const m = Number.parseInt(match[1], 10);
			const s = Number.parseInt(match[2], 10);
			const ms = match[3]
				? Number.parseInt(match[3].padEnd(3, "0").slice(0, 3), 10)
				: 0;
			result.push({ time: m * 60 + s + ms / 1000, text });
			match = tsRegex.exec(raw);
		}
	}
	return result.sort((a, b) => a.time - b.time);
}

/**
 * 解析网易云 YRC 逐字歌词 → 统一中间表示（IR）
 *
 * 行格式：
 *   [行开始ms,行持续ms](字开始ms,字持续ms,标记)字片段(字开始ms,字持续ms,标记)字片段
 * - 括号内的字时间戳为「绝对毫秒」（首字时间通常等于行开始时间）
 * - 文件头部的作词/作曲等元信息是独立 JSON 行（t 为负数），直接跳过
 * - 只有 [开始,持续] 而无括号片段的行是间奏标记，亦跳过
 */
function parseYrc(yrcText: string): LyricLine[] {
	const result: LyricLine[] = [];
	for (const raw of yrcText.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line || line.startsWith("{")) continue;

		const head = /^\[(-?\d+),(\d+)\]/.exec(line);
		if (!head) continue;
		const lineStart = Number(head[1]) / 1000;
		const lineDur = Number(head[2]) / 1000;
		if (lineStart < 0) continue;

		const body = line.slice(head[0].length);
		const chars: LyricChar[] = [];
		// 逐字标记：(开始ms,持续ms,演唱标记0/1)
		const tagRe = /\((-?\d+),(\d+),\d+\)/g;
		let tag: RegExpExecArray | null = tagRe.exec(body);
		let lastEnd = 0;
		while (tag !== null) {
			// 文本位于「上一个标记结束」与「当前标记开始」之间
			const piece = body.slice(lastEnd, tag.index);
			lastEnd = tag.index + tag[0].length;
			if (piece) {
				const charTime = Number(tag[1]) / 1000;
				const charDur = Number(tag[2]) / 1000;
				chars.push({
					text: piece,
					// 钳制：个别曲目首字可能早于行起点
					time: Math.max(lineStart, charTime),
					// 兜底极短时长，避免字内进度分母为 0
					dur: Math.max(0.02, charDur),
				});
			}
			tag = tagRe.exec(body);
		}
		if (chars.length === 0) continue; // 间奏空行

		// 尾部若还有未被任何标记覆盖的文本（罕见），并入最后一个字
		const tail = body.slice(lastEnd);
		if (tail) chars[chars.length - 1].text += tail;

		const text = chars.map((c) => c.text).join("");
		if (!text.trim()) continue;
		result.push({ time: lineStart, dur: lineDur, text, chars });
	}
	return result.sort((a, b) => a.time - b.time);
}

const BROWSER_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

/**
 * 歌名标准化：小写、去空白，剔除 Live / Remix / 伴奏 / 括号补充等版本标记，
 * 使「不遗憾 (Live)」「不遗憾（正版）」与「不遗憾」视为同一首歌。
 */
function normalizeTitle(s: string): string {
	return s
		.toLowerCase()
		.replace(/[（(\[【][^）)\]】]*[）)\]】]/g, "") // 去掉所有括号及其内容
		.replace(
			/(live|remix|dj版??|伴奏|cover|片段|纯音乐|official|正版|原唱|主题曲|剪辑版)/g,
			"",
		)
		.replace(/[\s\-—_·.,，。!！?？'‘’"“”:：|/\\]+/g, "");
}

/**
 * 判断候选歌曲标题是否与目标歌名一致。
 * 严格的歌名匹配是「歌手排序」之前的闸门：歌手再吻合，歌名不符也必须淘汰
 * （例如搜索「不遗憾」时不能误选歌手相同的《不将就》）。
 */
function titleMatches(
	candidate: unknown,
	title: string,
	artist: string | undefined,
): boolean {
	if (typeof candidate !== "string" || !candidate) return false;
	const c = normalizeTitle(candidate);
	const t = normalizeTitle(title);
	if (!c || !t) return false;
	if (c === t) return true;
	// 兼容搬运标题「歌名+歌手名」拼接，如「不遗憾李荣浩（正版）」
	const a = artist ? normalizeTitle(artist.split(/[/、]/)[0]) : "";
	return !!a && c === t + a;
}

/**
 * 按歌手匹配度重排搜索结果：歌手名互相包含的排最前，其余保持原顺序。
 * 用于在多个同名版本（翻唱/Live/片段）中优先选官方原唱版本。
 *
 * 注意：调用方必须先用 titleMatches 过滤歌名不一致的候选，
 * 歌手匹配度永远不能凌驾于歌名匹配之上。
 */
function rankByArtist<T>(
	list: T[],
	artist: string | undefined,
	getArtists: (item: T) => unknown,
): T[] {
	const name = artist?.split(/[/、]/)[0]?.trim();
	if (!name) return list;
	const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
	const target = norm(name);
	const matched: T[] = [];
	const rest: T[] = [];
	for (const item of list) {
		const raw = getArtists(item);
		if (typeof raw === "string" && raw) {
			const a = norm(raw);
			if (a === target || a.includes(target) || target.includes(a)) {
				matched.push(item);
				continue;
			}
		}
		rest.push(item);
	}
	return matched.concat(rest);
}

/**
 * 搜索结果排序统一入口：先按「歌名必须一致」过滤，再按歌手匹配度排序。
 * 返回的候选歌名全部与目标一致，只是版本（原唱/翻唱/Live）不同。
 */
function rankSongs<T>(
	list: T[],
	title: string,
	artist: string | undefined,
	getTitle: (item: T) => unknown,
	getArtists: (item: T) => unknown,
): T[] {
	const sameTitle = list.filter((item) =>
		titleMatches(getTitle(item), title, artist),
	);
	return rankByArtist(sameTitle, artist, getArtists);
}

/** ===== QQ 音乐：返回「歌名一致 + 歌手优先」的候选 songmid ===== */
async function qqSearchIds(
	keyword: string,
	title: string,
	artist: string | undefined,
	limit = 5,
): Promise<string[]> {
	const api = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?p=1&n=8&w=${encodeURIComponent(keyword)}&format=json`;
	const res = await fetch(api, {
		headers: { ...BROWSER_HEADERS, Referer: "https://y.qq.com/" },
	});
	if (!res.ok) return [];
	const json = (await res.json().catch(() => null)) as any;
	const list = json?.data?.song?.list;
	if (!Array.isArray(list) || list.length === 0) return [];
	return rankSongs(
		list,
		title,
		artist,
		(it: any) => it?.name,
		(it: any) =>
			it?.singer
				?.map?.((s: any) => s?.name)
				.filter(Boolean)
				.join(" "),
	)
		.slice(0, limit)
		.map((it: any) => it?.songmid)
		.filter(Boolean);
}

async function qqLyric(songmid: string): Promise<string | null> {
	const api = `https://i.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${songmid}&g_tk=5381&format=json&nobase64=1&inCharset=utf8&outCharset=utf-8&loginUin=0&hostUin=0&needNewCode=0`;
	const res = await fetch(api, {
		headers: { ...BROWSER_HEADERS, Referer: "https://y.qq.com/" },
	});
	if (!res.ok) return null;
	const json = (await res.json().catch(() => null)) as any;
	return json?.lyric || null;
}

/** ===== 网易云：返回「歌名一致 + 歌手优先」的候选歌曲 id ===== */
async function neteaseSearchIds(
	keyword: string,
	title: string,
	artist: string | undefined,
	limit = 5,
): Promise<number[]> {
	const api = `https://music.163.com/api/search/get/web?s=${encodeURIComponent(keyword)}&type=1&limit=8`;
	const res = await fetch(api, {
		headers: { ...BROWSER_HEADERS, Referer: "https://music.163.com/" },
	});
	if (!res.ok) return [];
	const json = (await res.json().catch(() => null)) as any;
	const list = json?.result?.songs;
	if (!Array.isArray(list) || list.length === 0) return [];
	return rankSongs(
		list,
		title,
		artist,
		(it: any) => it?.name,
		(it: any) =>
			it?.artists
				?.map?.((a: any) => a?.name)
				.filter(Boolean)
				.join(" "),
	)
		.slice(0, limit)
		.map((it: any) => it?.id)
		.filter((x: unknown) => Number.isFinite(x));
}

interface NeteaseBundle {
	yrc: LyricLine[] | null;
	lrc: LyricLine[] | null;
}

/**
 * 网易云逐字 + 行级歌词（v1 接口一次同时返回）
 * yv=1 → yrc 字段（逐字），lv=1 → lrc 字段（行级）
 */
async function neteaseLyricBundle(
	trackId: number,
): Promise<NeteaseBundle | null> {
	const api = `https://music.163.com/api/song/lyric/v1?id=${trackId}&lv=1&yv=1&tv=-1&rv=1&kv=-1`;
	const res = await fetch(api, {
		headers: { ...BROWSER_HEADERS, Referer: "https://music.163.com/" },
	});
	if (!res.ok) return null;
	const json = (await res.json().catch(() => null)) as any;
	const yrc = json?.yrc?.lyric ? parseYrc(json.yrc.lyric) : [];
	const lrc = json?.lrc?.lyric ? parseLrc(json.lrc.lyric) : [];
	return {
		yrc: yrc.length > 0 ? yrc : null,
		lrc: lrc.length > 0 ? lrc : null,
	};
}

export const GET: APIRoute = async ({ url }) => {
	const q = url.searchParams.get("q")?.trim() || "";
	const artist = url.searchParams.get("artist")?.trim() || "";

	const json = (body: unknown, status = 200) =>
		new Response(JSON.stringify(body), {
			status,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "public, max-age=86400",
			},
		});

	if (!q) return json({ code: 1, msg: "缺少 q 参数" }, 400);

	// 优先 "歌名 歌手" 提高准确率
	const fullQuery = artist ? `${q} ${artist.split(/[/、]/)[0]}` : q;

	// QQ 与网易云并行搜索候选版本（q 为原始歌名，用于严格歌名匹配闸门）
	const [qqIds, neIds] = await Promise.all([
		qqSearchIds(fullQuery, q, artist).catch(() => [] as string[]),
		neteaseSearchIds(fullQuery, q, artist).catch(() => [] as number[]),
	]);

	// 1) 网易云逐字歌词：前 3 个候选并行请求，取第一个带 YRC 的版本
	let bundles: (NeteaseBundle | null)[] = [];
	if (neIds.length > 0) {
		bundles = await Promise.all(
			neIds.slice(0, 3).map((id) => neteaseLyricBundle(id).catch(() => null)),
		);
		for (const b of bundles) {
			if (b?.yrc && b.yrc.length > 0) {
				return json({
					code: 0,
					source: "netease-yrc",
					word: true,
					lrc: b.yrc,
				});
			}
		}
	}

	// 2) QQ 行级歌词：前 2 个候选依次尝试
	for (const songmid of qqIds.slice(0, 2)) {
		try {
			const lrcText = await qqLyric(songmid);
			if (lrcText) {
				const lrc = parseLrc(lrcText);
				if (lrc.length > 0) {
					return json({ code: 0, source: "qq", word: false, lrc });
				}
			}
		} catch (err) {
			console.warn("[lyrics] QQ lyric failed:", err);
		}
	}

	// 3) 网易云行级歌词：复用上面已请求的结果，避免重复网络开销
	for (const b of bundles) {
		if (b?.lrc && b.lrc.length > 0) {
			return json({ code: 0, source: "netease", word: false, lrc: b.lrc });
		}
	}

	return json({ code: 1, msg: "未找到歌词" }, 404);
};
