import type { APIRoute } from "astro";
import {
	GITHUB_REPO,
	isLocalDev,
	requireAuth,
	writeLocalFile,
} from "@/utils/editor-auth";

export const prerender = false;

/** 与 src/data/internship.data.json 保持一致的结构（只声明用到的字段） */
interface InternshipPayload {
	profile: {
		title: string;
		tagline: string;
		name: string;
		role: string;
		team: string;
		period: string;
		status: string;
		intro: string;
		avatar: string;
		metrics: Array<{
			label: string;
			value: string;
			hint?: string;
			icon: string;
		}>;
		links: Array<{
			label: string;
			href: string;
			icon: string;
			external?: boolean;
		}>;
	};
	phases: Array<{
		id: string;
		order: number;
		period: string;
		title: string;
		summary: string;
		did: string[];
		learned: string[];
		stack: string[];
		body: string;
	}>;
	skills: Array<{ name: string; level: number; note?: string }>;
	stackGroups: Array<{ title: string; items: string[] }>;
	takeaways: Array<{ icon: string; title: string; points: string[] }>;
	highlights: Array<{
		title: string;
		problem: string;
		solution: string;
		result: string;
		tags: string[];
	}>;
	retro: { summary: string; next: string[] };
	meta: { title: string; description: string };
}

const DATA_PATH = "src/data/internship.data.json";

/** 阶段 id 只允许安全字符，避免被拼进路径或 HTML 属性时出问题 */
const SAFE_ID = /^[a-zA-Z0-9_-]{1,60}$/;

function fail(message: string, status = 400) {
	return new Response(JSON.stringify({ ok: false, error: message }), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

/** 字符串数组：过滤空项但保留原顺序 */
function cleanList(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => (typeof item === "string" ? item.trim() : ""))
		.filter((item) => item.length > 0);
}

/**
 * 校验并规整前端传来的结构化数据。
 * 目的是拦掉「类型不对 / 缺字段」这类会让 JSON 写坏、进而让站点构建失败的情况 ——
 * 用户在表单里看不到代码，所以校验必须在这里做足。
 */
function normalize(input: unknown): InternshipPayload | string {
	if (!input || typeof input !== "object") return "数据格式不对";
	const d = input as Record<string, unknown>;

	const str = (v: unknown, fallback = "") =>
		typeof v === "string" ? v : fallback;
	const num = (v: unknown, fallback = 0) => {
		const n = typeof v === "number" ? v : Number(v);
		return Number.isFinite(n) ? n : fallback;
	};
	const list = (v: unknown) => cleanList(v);
	const arr = (v: unknown) => (Array.isArray(v) ? v : []);

	// ---- profile ----
	const rawProfile = (d.profile ?? {}) as Record<string, unknown>;
	const metrics = arr(rawProfile.metrics)
		.map((m) => {
			const row = (m ?? {}) as Record<string, unknown>;
			const label = str(row.label).trim();
			if (!label) return null;
			return {
				label,
				value: str(row.value).trim(),
				hint: str(row.hint).trim() || undefined,
				icon: str(row.icon).trim() || "star-rounded",
			};
		})
		.filter((m): m is NonNullable<typeof m> => m !== null);

	const links = arr(rawProfile.links)
		.map((l) => {
			const row = (l ?? {}) as Record<string, unknown>;
			const label = str(row.label).trim();
			const href = str(row.href).trim();
			if (!label || !href) return null;
			return {
				label,
				href,
				icon: str(row.icon).trim() || "arrow-outward-rounded",
				external: row.external === true,
			};
		})
		.filter((l): l is NonNullable<typeof l> => l !== null);

	// ---- phases ----
	const seenIds = new Set<string>();
	const phases = arr(d.phases)
		.map((p, index) => {
			const row = (p ?? {}) as Record<string, unknown>;
			const title = str(row.title).trim();
			if (!title) return null;
			let id = str(row.id).trim();
			// id 非法或撞车时按标题生成一个安全的，再不行就用序号兜底
			if (!SAFE_ID.test(id) || seenIds.has(id)) {
				const base =
					`${String(index + 1).padStart(2, "0")}-` +
						title
							.toLowerCase()
							.replace(/[^a-z0-9]+/g, "-")
							.replace(/^-+|-+$/g, "")
							.slice(0, 40) || "phase";
				id = base;
				let n = 2;
				while (seenIds.has(id)) id = `${base}-${n++}`;
			}
			seenIds.add(id);
			return {
				id,
				order: num(row.order, index + 1),
				period: str(row.period).trim(),
				title,
				summary: str(row.summary).trim(),
				did: list(row.did),
				learned: list(row.learned),
				stack: list(row.stack),
				body: str(row.body),
			};
		})
		.filter((p): p is NonNullable<typeof p> => p !== null)
		.sort((a, b) => a.order - b.order)
		.map((p, index) => ({ ...p, order: index + 1 }));

	// ---- skills：level 必须夹在 0-100，否则进度条会画飞 ----
	const skills = arr(d.skills)
		.map((s) => {
			const row = (s ?? {}) as Record<string, unknown>;
			const name = str(row.name).trim();
			if (!name) return null;
			const level = Math.max(0, Math.min(100, Math.round(num(row.level, 50))));
			const note = str(row.note).trim();
			return { name, level, ...(note ? { note } : {}) };
		})
		.filter((s): s is NonNullable<typeof s> => s !== null);

	const stackGroups = arr(d.stackGroups)
		.map((g) => {
			const row = (g ?? {}) as Record<string, unknown>;
			const title = str(row.title).trim();
			const items = list(row.items);
			if (!title && items.length === 0) return null;
			return { title, items };
		})
		.filter((g): g is NonNullable<typeof g> => g !== null);

	const takeaways = arr(d.takeaways)
		.map((t) => {
			const row = (t ?? {}) as Record<string, unknown>;
			const title = str(row.title).trim();
			const points = list(row.points);
			if (!title && points.length === 0) return null;
			return {
				icon: str(row.icon).trim() || "star-rounded",
				title,
				points,
			};
		})
		.filter((t): t is NonNullable<typeof t> => t !== null);

	const highlights = arr(d.highlights)
		.map((h) => {
			const row = (h ?? {}) as Record<string, unknown>;
			const title = str(row.title).trim();
			if (!title) return null;
			return {
				title,
				problem: str(row.problem).trim(),
				solution: str(row.solution).trim(),
				result: str(row.result).trim(),
				tags: list(row.tags),
			};
		})
		.filter((h): h is NonNullable<typeof h> => h !== null);

	const rawRetro = (d.retro ?? {}) as Record<string, unknown>;
	const rawMeta = (d.meta ?? {}) as Record<string, unknown>;

	return {
		profile: {
			title: str(rawProfile.title, "Golden Experience").trim(),
			tagline: str(rawProfile.tagline).trim(),
			name: str(rawProfile.name).trim(),
			role: str(rawProfile.role).trim(),
			team: str(rawProfile.team).trim(),
			period: str(rawProfile.period).trim(),
			status: str(rawProfile.status).trim(),
			intro: str(rawProfile.intro).trim(),
			avatar: str(rawProfile.avatar).trim(),
			metrics,
			links,
		},
		phases,
		skills,
		stackGroups,
		takeaways,
		highlights,
		retro: {
			summary: str(rawRetro.summary).trim(),
			next: list(rawRetro.next),
		},
		meta: {
			title: str(rawMeta.title).trim(),
			description: str(rawMeta.description).trim(),
		},
	};
}

export const POST: APIRoute = async ({ cookies, request }) => {
	let token: string;
	try {
		token = requireAuth(cookies);
	} catch (error) {
		const message = error instanceof Error ? error.message : "认证失败";
		return fail(message, 401);
	}

	let payload: InternshipPayload;
	try {
		const body = (await request.json()) as { data?: unknown };
		const result = normalize(body?.data);
		if (typeof result === "string") return fail(result);
		payload = result;
	} catch (error) {
		return fail(error instanceof Error ? error.message : "请求体解析失败", 400);
	}

	// 标题是 SEO 与页头都要用的东西，空了会让页面没标题
	if (!payload.meta.title) payload.meta.title = "Golden Experience";

	// 缩进用 tab：与仓库里 biome 的格式化结果保持一致。
	// （程序写入 src/data 的 JSON 都走这个约定，避免出现大段纯缩进 diff）
	const content = `${JSON.stringify(payload, null, "\t")}\n`;
	const message = "Update internship page content";

	try {
		if (isLocalDev) {
			const result = writeLocalFile(DATA_PATH, content);
			return new Response(JSON.stringify(result), {
				headers: { "Content-Type": "application/json" },
			});
		}

		const { owner, name, branch } = GITHUB_REPO;
		// 不带 sha 提交：GitHub Contents API 在「文件已存在」时必须带 sha，
		// 所以先读一次拿当前 sha（读失败就当新建，让服务端给出行号）
		let sha: string | undefined;
		try {
			const current = await fetch(
				`https://api.github.com/repos/${owner}/${name}/contents/${DATA_PATH}?ref=${branch}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/vnd.github+json",
						"User-Agent": "Aemeath-Blog",
					},
				},
			);
			if (current.ok) {
				const data = (await current.json()) as { sha?: string };
				if (data.sha) sha = data.sha;
			}
		} catch {
			// 读不到就按新建处理
		}

		const requestBody: Record<string, string> = {
			message,
			content: btoa(unescape(encodeURIComponent(content))),
			branch,
		};
		if (sha) requestBody.sha = sha;

		const response = await fetch(
			`https://api.github.com/repos/${owner}/${name}/contents/${DATA_PATH}`,
			{
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/vnd.github+json",
					"User-Agent": "Aemeath-Blog",
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			},
		);

		if (!response.ok) {
			return fail(await response.text(), response.status);
		}

		return new Response(JSON.stringify({ ok: true, commit: { message } }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return fail(error instanceof Error ? error.message : "保存失败", 500);
	}
};
