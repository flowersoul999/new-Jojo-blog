/**
 * 修仙体系：把站内四张技能图串成一条「凡人修仙传」式的修行路。
 *
 * 规则很简单：
 *   修为 = 每勾一条学习清单，按该技能**方向的重要度权重**（1~5）得修为。
 *   一个技能的总修为 = 清单条数（难度）× 方向权重（重要度）——
 *   越难、越重要的技能，学满给的修为越多，不需要再单独标难度系数。
 *
 * 境界（凡人修仙传）：炼气 → 筑基 → 结丹 → 元婴 → 化神 → 炼虚 → 合体 → 大乘 → 渡劫。
 * 门禁按全局修为占比算（总修为随数据自动变化，阈值用百分比而不是写死的数字）：
 *   炼气入道只能进计算机基础；筑基开前端；结丹开后端；元婴开 Agent；
 *   化神以后没有新图，纯境界爬升，渡劫即修行圆满。
 *
 * 进度来源与 SkillTree.svelte 完全同源：四个 localStorage 键里的
 * `Record<skillId, 勾选索引[]>`（兼容旧版数字 / id 数组格式）；
 * 没有存档（SSR / 新访客）时按各图 PRESET 兜底——和技能图首屏渲染用的是同一份数据，
 * 所以不会出现「面板和图显示的境界对不上」。
 */
import { AG_CHECKS } from "@/data/agentChecks";
import { AG_PRESET, AG_SKILLS } from "@/data/agentSkills";
import { BE_CHECKS } from "@/data/backendChecks";
import { BE_PRESET, BE_SKILLS } from "@/data/backendSkills";
import { CS_CHECKS } from "@/data/csChecks";
import { CS_PRESET, CS_SKILLS } from "@/data/csSkills";
import {
	FINALE_STORY,
	FIRST_SLAY_STORY,
	GRAPH_STORY,
	REALM_STORY,
} from "@/data/cultivationStories";
import { SKILL_CHECKS } from "@/data/skillChecks";
import { SKILLS as FE_SKILLS, PRESET } from "@/data/skills";

/** 站内四张技能图的统一标识（cs 是入道起点，fe/be/ag 按境界依次解锁） */
export type GraphId = "cs" | "fe" | "be" | "ag";

/** 一个境界：minPct 是达到该境界所需的全局修为占比 */
export interface Realm {
	name: string;
	minPct: number;
	/** 该境界的一句话注解（凡人修仙传味儿） */
	note: string;
}

export const REALMS: Realm[] = [
	{
		name: "炼气期",
		minPct: 0,
		note: "引气入体，踏入修仙之门。凡人入道，先从计算机基础打坐。",
	},
	{
		name: "筑基期",
		minPct: 8,
		note: "筑就道基，寿元倍增，可御器飞行——前端技能图已对你敞开。",
	},
	{
		name: "结丹期",
		minPct: 18,
		note: "凝结金丹，脱胎换骨，不再是凡俗散修——后端技能图已解锁。",
	},
	{
		name: "元婴期",
		minPct: 30,
		note: "元婴大成，神识离体，一念千里——Agent 开发图已解锁。",
	},
	{ name: "化神期", minPct: 44, note: "炼化神识，明悟大道，一界知名。" },
	{ name: "炼虚期", minPct: 58, note: "炼虚合道，身融虚空。" },
	{ name: "合体期", minPct: 72, note: "法体合一，移山填海。" },
	{ name: "大乘期", minPct: 86, note: "大乘之境，人界已少有敌手。" },
	{
		name: "渡劫期",
		minPct: 100,
		note: "天劫加身，渡过便是真仙。四图圆满，修行功德圆满。",
	},
];

/** 方向重要度权重：每勾一条清单得多少修为（1~5）。核心地基给高权重。 */
const XP_WEIGHTS: Record<GraphId, Record<string, number>> = {
	// 计算机：数据结构与算法、OS、网络、数据库是科班硬通货
	cs: {
		"cs-math": 3,
		"cs-lang": 3,
		"cs-dsa": 5,
		"cs-hw": 2,
		"cs-os": 4,
		"cs-net": 4,
		"cs-db": 4,
		"cs-compiler": 2,
		"cs-se": 3,
		"cs-adv": 2,
	},
	// 前端：语言基石是本命，框架与工程化次之；服务端目录级知识权重低（后端图里另有细账）
	fe: {
		"lang-basics": 5,
		"type-system": 3,
		browser: 3,
		framework: 4,
		engineering: 3,
		quality: 2,
		visual: 2,
		backend: 2,
		architecture: 3,
		growth: 2,
	},
	// 后端：数据与存储最值钱；「已有基础」两个方块是送的，只给象征性修为
	be: {
		"be-start": 1,
		"be-lang": 3,
		"be-web": 4,
		"be-data": 5,
		"be-sec": 3,
		"be-ops": 3,
		"be-arch": 4,
	},
	// Agent：工具与编排是核心手艺，模型基础与评测次之
	ag: {
		"ag-foundation": 4,
		"ag-prompt": 3,
		"ag-rag": 4,
		"ag-tool": 5,
		"ag-memory": 3,
		"ag-eval": 4,
		"ag-app": 3,
	},
};

/** 一张图在修行路上的元数据 */
export interface JourneyGraph {
	id: GraphId;
	name: string;
	href: string;
	/** 解锁所需境界在 REALMS 里的下标（cs=0 炼气即可入） */
	realmIndex: number;
	/** 图鉴上的门槛说明（如「需筑基期」；入道图写「凡人入道」） */
	gateLabel: string;
	storageKey: string;
	skills: { id: string; group: string }[];
	checks: Record<string, unknown[]>;
	preset: Record<string, number>;
}

export const GRAPH_JOURNEY: JourneyGraph[] = [
	{
		id: "cs",
		name: "计算机基础",
		href: "/cs/",
		realmIndex: 0,
		gateLabel: "凡人入道",
		storageKey: "aemeath-cs-tree",
		skills: CS_SKILLS,
		checks: CS_CHECKS,
		preset: CS_PRESET,
	},
	{
		id: "fe",
		name: "前端技能图",
		href: "/skills/",
		realmIndex: 1,
		gateLabel: "需筑基期",
		storageKey: "aemeath-skill-tree",
		skills: FE_SKILLS,
		checks: SKILL_CHECKS,
		preset: PRESET,
	},
	{
		id: "be",
		name: "后端技能图",
		href: "/backend/",
		realmIndex: 2,
		gateLabel: "需结丹期",
		storageKey: "aemeath-backend-tree",
		skills: BE_SKILLS,
		checks: BE_CHECKS,
		preset: BE_PRESET,
	},
	{
		id: "ag",
		name: "Agent 开发",
		href: "/agent/",
		realmIndex: 3,
		gateLabel: "需元婴期",
		storageKey: "aemeath-agent-tree",
		skills: AG_SKILLS,
		checks: AG_CHECKS,
		preset: AG_PRESET,
	},
];

/** 按 id 找修行路上的图（找不到视为炼气期锁定态，防御性兜底） */
export function journeyOf(id: GraphId): JourneyGraph {
	return GRAPH_JOURNEY.find((g) => g.id === id) ?? GRAPH_JOURNEY[0];
}

/** SkillTree 的等级上限规则：有清单按条数，没清单退回 5 */
function capOf(g: JourneyGraph, id: string): number {
	return g.checks[id]?.length ?? 5;
}

/** 游客「只想看看」的放行标记（仅当前标签页生效，关掉就恢复结界） */
const BYPASS_KEY = "aemeath-realm-bypass";

export interface CultivationState {
	/** 当前修为 / 全局总修为 */
	xp: number;
	totalXp: number;
	pct: number;
	/** 当前境界下标（0=炼气） */
	realmIndex: number;
	realm: Realm;
	/** 下一境界；渡劫期已是顶点则为 null */
	next: Realm | null;
	/** 距下一境界还差多少修为（next 为 null 时为 0） */
	toNextXp: number;
	/** 各图是否对当前访客开放（含游客放行标记） */
	unlocked: Record<GraphId, boolean>;
}

/** 读取一张图的掌握度：skillId → 已勾条数（兼容 SkillTree 的三代存档格式） */
function readGraphLevels(g: JourneyGraph): Record<string, number> {
	const levels: Record<string, number> = {};
	let stored: unknown = null;
	if (typeof localStorage !== "undefined") {
		try {
			const raw = localStorage.getItem(g.storageKey);
			if (raw) stored = JSON.parse(raw);
		} catch {
			stored = null;
		}
	}
	if (stored == null) {
		// 没有存档（SSR / 新访客）：与 SkillTree 首屏一样按出厂预设算
		for (const s of g.skills)
			levels[s.id] = Math.min(capOf(g, s.id), g.preset[s.id] ?? 0);
		return levels;
	}
	if (Array.isArray(stored)) {
		// 最老格式：已点亮 id 的数组，每个按 2 级算（与 SkillTree.readStored 一致）
		const ids = new Set(g.skills.map((s) => s.id));
		for (const id of stored)
			if (typeof id === "string" && ids.has(id))
				levels[id] = Math.min(capOf(g, id), 2);
		return levels;
	}
	if (typeof stored === "object") {
		for (const s of g.skills) {
			const v = (stored as Record<string, unknown>)[s.id];
			if (typeof v === "number")
				levels[s.id] = Math.min(capOf(g, s.id), Math.max(0, v));
			else if (Array.isArray(v))
				levels[s.id] = Math.min(capOf(g, s.id), v.length);
		}
	}
	return levels;
}

/** 汇总四张图算出修为与境界 */
export function computeCultivation(
	levelsByGraph: Record<GraphId, Record<string, number>>,
): {
	xp: number;
	totalXp: number;
} {
	let xp = 0;
	let totalXp = 0;
	for (const g of GRAPH_JOURNEY) {
		const weights = XP_WEIGHTS[g.id];
		const levels = levelsByGraph[g.id] ?? {};
		for (const s of g.skills) {
			const cap = capOf(g, s.id);
			const w = weights[s.group] ?? 1;
			totalXp += cap * w;
			xp += Math.min(cap, levels[s.id] ?? 0) * w;
		}
	}
	return { xp, totalXp };
}

/** 当前快照：读四个存档键 + 游客放行标记，算境界与各图解锁状态 */
export function snapshot(): CultivationState {
	const levelsByGraph = {} as Record<GraphId, Record<string, number>>;
	for (const g of GRAPH_JOURNEY) levelsByGraph[g.id] = readGraphLevels(g);
	const { xp, totalXp } = computeCultivation(levelsByGraph);
	const pct = totalXp > 0 ? (xp / totalXp) * 100 : 0;

	let realmIndex = 0;
	for (let i = 0; i < REALMS.length; i++)
		if (pct >= REALMS[i].minPct) realmIndex = i;
	const realm = REALMS[realmIndex];
	const next = realmIndex + 1 < REALMS.length ? REALMS[realmIndex + 1] : null;
	const nextXp = next ? Math.ceil((next.minPct / 100) * totalXp) : 0;

	let bypassed = false;
	if (typeof sessionStorage !== "undefined") {
		try {
			bypassed = sessionStorage.getItem(BYPASS_KEY) === "1";
		} catch {
			bypassed = false;
		}
	}
	const unlocked = {} as Record<GraphId, boolean>;
	for (const g of GRAPH_JOURNEY)
		unlocked[g.id] = bypassed || realmIndex >= g.realmIndex;

	return {
		xp,
		totalXp,
		pct,
		realmIndex,
		realm,
		next,
		toNextXp: next ? Math.max(0, nextXp - xp) : 0,
		unlocked,
	};
}

/** SkillTree 勾选后要广播的事件名（persist() 里 dispatch，面板与结界监听它刷新） */
export const CULTIVATION_EVENT = "aemeath-cultivation-changed";

/** 游客放行：点下后当前标签页内四图全开 */
export function letVisitorThrough(): void {
	try {
		sessionStorage.setItem(BYPASS_KEY, "1");
	} catch {
		/* 隐私模式写不进就算了 */
	}
	if (typeof window !== "undefined")
		window.dispatchEvent(new CustomEvent(CULTIVATION_EVENT));
}

/* ===========================================================================
 * 沉浸层：斩妖 / 连斩 / 修为日志 / 隐藏剧情触发器
 *
 * 这一层把「勾选一条清单」包装成一次「斩妖」：给修为、记日志、连斩计数，
 * 并在跨境界 / 学满方向 / 首杀 / 全图圆满时解锁隐藏的「飞剑传书」剧情。
 * 所有事件都挂在 window 上，供 SkillTree（飘字 + 音效）、CultivationPanel
 * （修行手札）、BreakthroughRite（突破大典）、StoryInbox（飞剑传书收件箱）各自监听。
 * =========================================================================== */

/** 勾选一条清单后广播的「斩妖」事件（detail 见 SlayResult） */
export const SLAY_EVENT = "aemeath-slay";
/** 跨过境界阈值时广播（detail: { from, to, realmName }） */
export const BREAKTHROUGH_EVENT = "aemeath-breakthrough";
/** 解锁一封新剧情时广播（detail: { ids: string[] }） */
export const STORY_EVENT = "aemeath-story-unlocked";

const LOG_KEY = "aemeath-cultivation-log";
const STORIES_KEY = "aemeath-stories-unlocked";
const LOG_CAP = 600;

export interface SlayLogEntry {
	ts: number;
	graph: GraphId;
	skillId: string;
	index: number;
	title: string;
	xp: number;
}

export interface SlayInput {
	graph: GraphId;
	skillId: string;
	index: number;
	title: string;
	/** 本次勾选前的境界下标（用来判断有没有跨过阈值） */
	beforeRealm: number;
}

export interface SlayResult {
	xpGained: number;
	/** 连斩数（3 秒内连续勾选累计，单次为 1） */
	combo: number;
	/** 本次解锁的剧情 id（已去重，不含之前解锁过的） */
	stories: string[];
	/** 本次跨到的境界下标（没跨境界则为 null） */
	breakthroughTo: number | null;
}

/** 某技能所属方向（从修行路引的技能表里查） */
function groupOf(graph: GraphId, skillId: string): string | undefined {
	const g = GRAPH_JOURNEY.find((x) => x.id === graph);
	return g?.skills.find((s) => s.id === skillId)?.group;
}

/** 勾一条清单得多少修为（方向权重） */
export function weightOf(graph: GraphId, skillId: string): number {
	const group = groupOf(graph, skillId);
	return (group && XP_WEIGHTS[graph]?.[group]) || 1;
}

/* ---------- 连斩：模块级状态，整页会话内累计 ---------- */
let lastSlayAt = 0;
let comboCount = 0;

/* ---------------- 修为日志（修行手札的数据源） ---------------- */
function readLog(): SlayLogEntry[] {
	if (typeof localStorage === "undefined") return [];
	try {
		const raw = localStorage.getItem(LOG_KEY);
		if (!raw) return [];
		const v = JSON.parse(raw);
		return Array.isArray(v) ? (v as SlayLogEntry[]) : [];
	} catch {
		return [];
	}
}

function appendLog(entry: SlayLogEntry): number {
	if (typeof localStorage === "undefined") return 0;
	const log = readLog();
	log.push(entry);
	if (log.length > LOG_CAP) log.splice(0, log.length - LOG_CAP);
	try {
		localStorage.setItem(LOG_KEY, JSON.stringify(log));
	} catch {
		/* 隐私模式忽略 */
	}
	return log.length;
}

export function getCultivationLog(): SlayLogEntry[] {
	return readLog();
}

/* ---------------- 已解锁剧情集合（去重 + 持久化） ---------------- */
function readUnlockedStories(): Set<string> {
	if (typeof localStorage === "undefined") return new Set();
	try {
		const raw = localStorage.getItem(STORIES_KEY);
		if (!raw) return new Set();
		const v = JSON.parse(raw);
		return new Set(Array.isArray(v) ? (v as string[]) : []);
	} catch {
		return new Set();
	}
}

/** 解锁一批剧情，返回其中「本次新解锁」的 id 并广播 STORY_EVENT */
function unlockStories(ids: string[]): string[] {
	if (typeof localStorage === "undefined" || ids.length === 0) return [];
	const set = readUnlockedStories();
	const fresh = ids.filter((id) => !set.has(id));
	if (fresh.length === 0) return [];
	for (const id of fresh) set.add(id);
	try {
		localStorage.setItem(STORIES_KEY, JSON.stringify([...set]));
	} catch {
		/* 忽略 */
	}
	if (typeof window !== "undefined")
		window.dispatchEvent(
			new CustomEvent(STORY_EVENT, { detail: { ids: fresh } }),
		);
	return fresh;
}

/* ---------------- 方向 / 整图 是否学满 ---------------- */
function isGroupComplete(graph: GraphId, group: string): boolean {
	const g = GRAPH_JOURNEY.find((x) => x.id === graph);
	if (!g) return false;
	const levels = readGraphLevels(g);
	let done = 0;
	let total = 0;
	for (const s of g.skills) {
		if (s.group !== group) continue;
		done += Math.min(levels[s.id] ?? 0, g.checks[s.id]?.length ?? 0);
		total += g.checks[s.id]?.length ?? 0;
	}
	return total > 0 && done >= total;
}

function isGraphComplete(graph: GraphId): boolean {
	const g = GRAPH_JOURNEY.find((x) => x.id === graph);
	if (!g) return false;
	const levels = readGraphLevels(g);
	for (const s of g.skills) {
		if ((levels[s.id] ?? 0) < (g.checks[s.id]?.length ?? 0)) return false;
	}
	return true;
}

/**
 * 斩妖主入口：SkillTree 在「勾上一条清单」后调用。
 * 负责给修为、写日志、连斩计数、判断跨境界与各类隐藏剧情触发。
 */
export function recordSlay(input: SlayInput): SlayResult {
	const xpGained = weightOf(input.graph, input.skillId);
	const logLen = appendLog({
		ts: Date.now(),
		graph: input.graph,
		skillId: input.skillId,
		index: input.index,
		title: input.title,
		xp: xpGained,
	});

	const now = Date.now();
	comboCount = now - lastSlayAt <= 3000 ? comboCount + 1 : 1;
	lastSlayAt = now;

	const after = snapshot().realmIndex;
	const breakthroughTo = after > input.beforeRealm ? after : null;

	const stories: string[] = [];
	if (logLen === 1) stories.push(FIRST_SLAY_STORY);
	const group = groupOf(input.graph, input.skillId);
	if (group && isGroupComplete(input.graph, group))
		stories.push(`grp-${input.graph}-${group}`);
	if (isGraphComplete(input.graph))
		stories.push(GRAPH_STORY[input.graph] as string);
	if (breakthroughTo !== null) {
		for (let r = input.beforeRealm + 1; r <= breakthroughTo; r++)
			if (REALM_STORY[r]) stories.push(REALM_STORY[r]);
	}
	if (after >= REALMS.length - 1 || snapshot().pct >= 100)
		stories.push(FINALE_STORY);

	const fresh = unlockStories(stories);

	if (breakthroughTo !== null && typeof window !== "undefined") {
		const realm = REALMS[breakthroughTo];
		window.dispatchEvent(
			new CustomEvent(BREAKTHROUGH_EVENT, {
				detail: {
					from: input.beforeRealm,
					to: breakthroughTo,
					realmName: realm.name,
				},
			}),
		);
	}
	if (typeof window !== "undefined")
		window.dispatchEvent(new CustomEvent(CULTIVATION_EVENT));

	return { xpGained, combo: comboCount, stories: fresh, breakthroughTo };
}
