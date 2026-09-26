import type { APIRoute } from "astro";

export const prerender = false;

interface LyricLine {
	time: number;
	text: string;
}

/** 解析 LRC 文本 → [{ time: 秒, text }] */
function parseLrc(lrcText: string): LyricLine[] {
	if (!lrcText) return [];
	const lines = lrcText.split(/\r?\n/);
	const result: LyricLine[] = [];
	const tsRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

	for (const raw of lines) {
		tsRegex.lastIndex = 0;
		const text = raw.replace(tsRegex, "").trim();
		if (!text) continue;
		let match: RegExpExecArray | null;
		tsRegex.lastIndex = 0;
		while ((match = tsRegex.exec(raw)) !== null) {
			const m = Number.parseInt(match[1], 10);
			const s = Number.parseInt(match[2], 10);
			const ms = match[3]
				? Number.parseInt(match[3].padEnd(3, "0").slice(0, 3), 10)
				: 0;
			result.push({ time: m * 60 + s + ms / 1000, text });
		}
	}
	return result.sort((a, b) => a.time - b.time);
}

const BROWSER_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

/** ===== QQ 音乐 ===== */
async function qqSearch(keyword: string, artist?: string): Promise<string | null> {
	const api = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?p=1&n=8&w=${encodeURIComponent(keyword)}&format=json`;
	const res = await fetch(api, {
		headers: { ...BROWSER_HEADERS, Referer: "https://y.qq.com/" },
	});
	if (!res.ok) return null;
	const json = (await res.json().catch(() => null)) as any;
	const list = json?.data?.song?.list;
	if (!Array.isArray(list) || list.length === 0) return null;
	const pick = pickByArtist(list, artist, (it) => it?.singer?.map?.((s: any) => s?.name).filter(Boolean).join(" "));
	return pick?.songmid || list[0].songmid || null;
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

/** ===== 网易云（降级） ===== */
async function neteaseSearch(keyword: string, artist?: string): Promise<number | null> {
	const api = `https://music.163.com/api/search/get/web?s=${encodeURIComponent(keyword)}&type=1&limit=8`;
	const res = await fetch(api, {
		headers: { ...BROWSER_HEADERS, Referer: "https://music.163.com/" },
	});
	if (!res.ok) return null;
	const json = (await res.json().catch(() => null)) as any;
	const list = json?.result?.songs;
	if (!Array.isArray(list) || list.length === 0) return null;
	const pick = pickByArtist(list, artist, (it) => it?.artists?.map?.((a: any) => a?.name).filter(Boolean).join(" "));
	return pick?.id || list[0].id || null;
}

/**
 * 从搜索结果中挑选歌手最匹配的一条：
 * 歌手名包含关键词（或反之）优先，其次取第一条。
 */
function pickByArtist<T>(list: T[], artist: string | undefined, getArtists: (item: T) => unknown): T {
	const name = artist?.split(/[/、]/)[0]?.trim();
	if (!name) return list[0];
	const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
	const target = norm(name);
	let best: T | null = null;
	for (const item of list) {
		const raw = getArtists(item);
		if (typeof raw !== "string" || !raw) continue;
		const a = norm(raw);
		if (a === target || a.includes(target) || target.includes(a)) {
			best = item;
			break;
		}
	}
	return best || list[0];
}

async function neteaseLyric(trackId: number): Promise<string | null> {
	const api = `https://music.163.com/api/song/lyric?id=${trackId}&lv=-1&tv=-1`;
	const res = await fetch(api, {
		headers: { ...BROWSER_HEADERS, Referer: "https://music.163.com/" },
	});
	if (!res.ok) return null;
	const json = (await res.json().catch(() => null)) as any;
	return json?.lrc?.lyric || null;
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
	const fullQuery = artist
		? `${q} ${artist.split(/[/、]/)[0]}`
		: q;

	let lrcText: string | null = null;
	let source = "";

	try {
		const songmid = await qqSearch(fullQuery, artist);
		if (songmid) {
			lrcText = await qqLyric(songmid);
			if (lrcText) source = "qq";
		}
	} catch (err) {
		console.warn("[lyrics] QQ failed:", err);
	}

	if (!lrcText) {
		try {
			const trackId = await neteaseSearch(fullQuery, artist);
			if (trackId) {
				lrcText = await neteaseLyric(trackId);
				if (lrcText) source = "netease";
			}
		} catch (err) {
			console.warn("[lyrics] Netease failed:", err);
		}
	}

	if (!lrcText) return json({ code: 1, msg: "未找到歌词" }, 404);

	const lrc = parseLrc(lrcText);
	return json({ code: 0, source, lrc });
};
