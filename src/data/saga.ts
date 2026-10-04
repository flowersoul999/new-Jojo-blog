/**
 * 话本引擎：把「彻底点亮一个技能」变成连载小说的一章。
 *
 * 与既有「飞剑传书彩蛋」的区别：
 *   - 彩蛋是零星的小纸条，解锁即出现；
 *   - 话本是连载：章节有固定顺序，**挣得**和**发放**分开。
 *
 * 两条保证连续性的规则：
 *   1. 挣得（earned）：点亮哪个技能，就挣得它对应的那一章；顺序随你。
 *   2. 发放（pump）：永远按章序发。第 N 回还没到，第 N+1 回绝不会弹出来，
 *      哪怕你已经点亮了很后面的技能——这样读到的永远是连着的下一段。
 *   3. 每次只发一回：存量补课时不会一次性灌几十回。
 *
 * 读完一封时由 StoryInbox 调 pumpSaga()，于是「读→下一回自动到手」形成节奏。
 */
import {
	type GraphId,
	unlockedStoryIds,
	unlockStoryIds,
} from "@/data/cultivation";
import type { Story } from "@/data/cultivationStories";
import { type SagaRaw, VOL1_CHAPTERS } from "@/data/saga/vol1";

/** 话本的一回（比 Story 多了卷、序号、归属技能） */
export interface SagaChapter {
	id: string;
	graph: GraphId;
	/** 对应的技能 id；null = 楔子，不绑定技能 */
	skillId: string | null;
	/** 卷内序号，0 = 楔子，1 = 第一回 */
	no: number;
	/** 卷名，如「第一卷·演算天梯」 */
	volume: string;
	title: string;
	paragraphs: string[];
}

/** 一卷的配置：一张图 = 一卷 */
interface Volume {
	graph: GraphId;
	name: string;
	prefix: string;
	raw: SagaRaw[];
}

const VOLUMES: Volume[] = [
	{
		graph: "cs",
		name: "第一卷·演算天梯",
		prefix: "saga-cs",
		raw: VOL1_CHAPTERS,
	},
];

/** 全卷按「先卷后章」展开成一维数组，顺序即章序 */
const CHAPTERS: SagaChapter[] = [];
for (const v of VOLUMES) {
	v.raw.forEach((r, i) => {
		CHAPTERS.push({
			id: `${v.prefix}-${String(i).padStart(3, "0")}`,
			graph: v.graph,
			skillId: r.skillId,
			no: i,
			volume: v.name,
			title: r.title,
			paragraphs: r.paragraphs,
		});
	});
}

const BY_ID: Record<string, SagaChapter> = {};
const BY_KEY: Record<string, SagaChapter> = {};
for (const c of CHAPTERS) {
	BY_ID[c.id] = c;
	if (c.skillId) BY_KEY[`${c.graph}:${c.skillId}`] = c;
}

/** 已挣得的章节 id（持久）：挣得 ≠ 发放，发放还要看章序 */
const EARNED_KEY = "aemeath-saga-earned";

function readEarned(): Set<string> {
	if (typeof localStorage === "undefined") return new Set();
	try {
		const raw = localStorage.getItem(EARNED_KEY);
		if (!raw) return new Set();
		const v = JSON.parse(raw);
		return new Set(Array.isArray(v) ? (v as string[]) : []);
	} catch {
		return new Set();
	}
}

function writeEarned(set: Set<string>): void {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(EARNED_KEY, JSON.stringify([...set]));
	} catch {
		/* 隐私模式忽略 */
	}
}

/** id 是不是话本章节（飞剑传书收件箱用它区分两种信） */
export function isSagaId(id: string): boolean {
	return id.startsWith("saga-");
}

/** 按 id 取章节（不是话本 id 返回 null） */
export function getSagaChapter(id: string): SagaChapter | null {
	return BY_ID[id] ?? null;
}

/** 把章节包装成「飞剑传书」能显示的一封信 */
export function getSagaStory(id: string): Story | null {
	const c = BY_ID[id];
	if (!c) return null;
	return {
		id: c.id,
		title: c.no === 0 ? `楔子 · ${c.title}` : `第 ${c.no} 回 · ${c.title}`,
		from: c.volume,
		paragraphs: c.paragraphs,
	};
}

/** 全站共有几回（含楔子），给排错用 */
export function sagaChapterCount(): number {
	return CHAPTERS.length;
}

/**
 * 发放：找出「章序最靠前的一封已挣得、但还没发放」的章节发出去。
 * 前面还有没挣得的章节时直接停下——这是连续性的关键：不跳章、不剧透。
 * 每次只发一封。
 */
export function pumpSaga(): string[] {
	const earned = readEarned();
	const unlocked = unlockedStoryIds();
	for (const c of CHAPTERS) {
		if (!earned.has(c.id)) break;
		if (unlocked.has(c.id)) continue;
		return unlockStoryIds([c.id]);
	}
	return [];
}

/** 卷首的楔子（第一次点亮任何技能时顺手挣得） */
function earnPrologue(graph: GraphId, set: Set<string>): boolean {
	let changed = false;
	for (const c of CHAPTERS) {
		if (c.graph !== graph || c.skillId !== null) continue;
		if (set.has(c.id)) continue;
		set.add(c.id);
		changed = true;
	}
	return changed;
}

/**
 * 点亮了一个技能：挣得它那一回，然后尝试发放。
 * 幂等 —— 反复点亮同一个技能不会重复挣得。
 */
export function earnChapterForSkill(graph: GraphId, skillId: string): string[] {
	const set = readEarned();
	let changed = earnPrologue(graph, set);
	const ch = BY_KEY[`${graph}:${skillId}`];
	if (ch && !set.has(ch.id)) {
		set.add(ch.id);
		changed = true;
	}
	if (changed) writeEarned(set);
	return pumpSaga();
}

/**
 * 存量补课：一次性把「当前已经满级的技能」的章节都记为挣得，
 * 但发放仍然走 pumpSaga() 一次一封，不会把人淹没。
 */
export function syncMaxedSkills(graph: GraphId, skillIds: string[]): string[] {
	const set = readEarned();
	let changed = false;
	for (const id of skillIds) {
		const ch = BY_KEY[`${graph}:${id}`];
		if (ch && !set.has(ch.id)) {
			set.add(ch.id);
			changed = true;
		}
	}
	if (changed) changed = earnPrologue(graph, set) || changed;
	if (changed) writeEarned(set);
	return pumpSaga();
}
