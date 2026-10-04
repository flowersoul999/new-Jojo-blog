/**
 * 修仙剧情库：隐藏剧情 + 飞剑传书 + 触发器映射。
 *
 * 设计原则：
 *   - 本文件是「纯数据」，不 import cultivation.ts，避免循环依赖。
 *   - cultivation.ts 在每次「斩妖」（勾选清单）后读取这里的映射，决定解锁哪几封信。
 *   - 「心魔劫」按 图×方向 自动生成（每个方向一篇），文风是仙侠 + JOJO 梗。
 *   - 突破大典（境界跨越）配一封「传书」，由神秘老者点评这一跃。
 *   - 四图学满分别触发「初成」彩蛋；全图 100% 触发终局「飞升」。
 */
import { AG_GROUPS } from "@/data/agentSkills";
import { BE_GROUPS } from "@/data/backendSkills";
import { CS_GROUPS } from "@/data/csSkills";
import type { GraphId } from "@/data/cultivation";
import { GROUPS as FE_GROUPS } from "@/data/skills";

export interface Story {
	/** 唯一 id（也是解锁集合里的键） */
	id: string;
	/** 信件标题 */
	title: string;
	/** 落款 / 寄信人 */
	from: string;
	/** 正文段落 */
	paragraphs: string[];
}

/** 一张图的中文名（对应 GRAPH_JOURNEY 的 name，但这里是静态副本，避免反向 import） */
const GRAPH_NAME: Record<GraphId, string> = {
	cs: "计算机基础",
	fe: "前端",
	be: "后端",
	ag: "Agent 开发",
};

/** 四张图的方向分组（带中文名），用来批量生成「心魔劫」 */
const GROUP_MAP: Record<GraphId, { id: string; name: string }[]> = {
	cs: CS_GROUPS,
	fe: FE_GROUPS,
	be: BE_GROUPS,
	ag: AG_GROUPS,
};

/* ----------------------- 心魔劫：图 × 方向，自动生成 ----------------------- */

function groupStory(graph: GraphId, g: { id: string; name: string }): Story {
	const gname = g.name;
	const line = `你以为参透了「${gname}」，便算过了这一关？`;
	return {
		id: `grp-${graph}-${g.id}`,
		title: `${GRAPH_NAME[graph]}·${gname} 心魔劫`,
		from: "无名老者",
		paragraphs: [
			`${line}`,
			"少年，心魔从不长在外面。它藏在你以为「已经会了」的地方——每一次你勾掉一项，它便退一分；可你退得越快，它笑得越轻。",
			`「${gname}」这一脉，你今日起算真正踏了进来。前路还有更多方向等着你，但记住：路不是用来走完的，是用来被你一步步踩实的。`,
			"——你的下一句话，老夫已经听到了：「这关，我过了。」",
		],
	};
}

/* ----------------------------- 剧情注册表 ----------------------------- */

export const STORIES: Record<string, Story> = {};

/** 首杀：第一次勾掉任意一条清单 */
STORIES["first-slay"] = {
	id: "first-slay",
	title: "初入山门·第一封传书",
	from: "无名老者",
	paragraphs: [
		"你这凡人，居然敢入此门。",
		"方才那一剑，是你斩下的第一只妖。它不大，甚至称不上凶，但老夫看得真切——你动了手，便再没有回头路。",
		"修行之路，本就是「斩一只妖，长一分修为」。你勾掉的每一条，都是一只曾拦在你面前的拦路虎。",
		"「我不做人了，JOJO！」——不，你不必成仙成魔，你只需把今天这一关，一关关过下去。",
	],
};

/** 突破大典配套传书：境界下标 → 剧情 id */
export const REALM_STORY: Record<number, string> = {};
const realmLetters: { idx: number; title: string; paragraphs: string[] }[] = [
	{
		idx: 1,
		title: "筑基·传书",
		paragraphs: [
			"筑基成。你不再是刚入门的散修了。",
			"老夫当年筑基，也是在同一个夜晚——灵台忽地清明，仿佛整个世界都慢了半拍。你此刻站的地方，叫做「前端之地」，门已为你而开。",
			"去吧。那里的妖，比基础关凶得多，但也香得多。",
		],
	},
	{
		idx: 2,
		title: "结丹·传书",
		paragraphs: [
			"金丹凝结，脱胎换骨。",
			"后端之地，从此对你敞开。老夫得提醒你：那里的水，比表面上深。你以为会了 CRUD 便是会了后端？不，那只是刚把鞋脱在岸边。",
			"沉下去，才看得到水下的东西。",
		],
	},
	{
		idx: 3,
		title: "元婴·传书",
		paragraphs: [
			"元婴大成，神识离体。",
			"Agent 之地，是老夫当年都不敢轻易踏入的禁区——那里养的不是妖，是你亲手造出来的「器灵」。你既要教它们听话，又怕它们太听话。",
			"这一关，老夫只能送你到门口了。",
		],
	},
	{
		idx: 4,
		title: "化神·传书",
		paragraphs: [
			"化神。你已是一界之内，有名有姓的人物了。",
			"从今往后，没有新的地图为你打开——因为地图，已经全在你脚下。剩下的路，是你自己走出来的。",
			"「你的下一句话，我早就听过了。」",
		],
	},
	{
		idx: 8,
		title: "渡劫·传书",
		paragraphs: [
			"渡劫。雷在头顶，也在心里。",
			"这一关没有妖可斩，因为最后的妖，是你自己。",
		],
	},
];
for (const r of realmLetters) {
	const id = `realm-${r.idx}`;
	STORIES[id] = {
		id,
		title: r.title,
		from: "无名老者",
		paragraphs: r.paragraphs,
	};
	REALM_STORY[r.idx] = id;
}

/** 整图学满的「初成」彩蛋：图 → 剧情 id */
export const GRAPH_STORY: Partial<Record<GraphId, string>> = {};
const graphEggs: { graph: GraphId; title: string; paragraphs: string[] }[] = [
	{
		graph: "cs",
		title: "计算机基础·初成",
		paragraphs: [
			"基础关，你踏平了。",
			"老夫见过太多人，基础没打牢就急着去学法术，最后卡在半山腰下不来。你没有。",
			"「饭要一口一口吃，路要一步一步走。」——这句话老夫说了八百年，今天终于有人听得进去。",
		],
	},
	{
		graph: "fe",
		title: "前端·剑意初成",
		paragraphs: [
			"前端这一脉，你算是把剑磨亮了。",
			"别人写页面是堆砖头，你写页面是铸剑——每一根线、每一帧动画，都是剑意。",
			"「欧拉！」——对，就是这个气势，把它带到下一关去。",
		],
	},
	{
		graph: "be",
		title: "后端·道心初成",
		paragraphs: [
			"后端的水，你总算蹚到了底。",
			"分布式、存储、并发……这些曾经让你夜里睡不着的妖，如今都成了你案头的茶。",
			"道心稳了，才扛得住更大的劫。",
		],
	},
	{
		graph: "ag",
		title: "Agent·器灵认主",
		paragraphs: [
			"你造出来的「器灵」，认你为主了。",
			"这一脉，老夫当年只敢远观。你不仅进去了，还把它驯得服服帖帖。",
			"「这是我最后的波纹了……不对，是最后一个 token。」",
		],
	},
];
for (const e of graphEggs) {
	const id = `graph-${e.graph}`;
	STORIES[id] = {
		id,
		title: e.title,
		from: "无名老者",
		paragraphs: e.paragraphs,
	};
	GRAPH_STORY[e.graph] = id;
}

/** 全图圆满的终局 */
export const FINALE_STORY = "finale-ascend";
STORIES[FINALE_STORY] = {
	id: FINALE_STORY,
	title: "飞升·终章",
	from: "无名老者（已化作星光）",
	paragraphs: [
		"四图皆满，修行功德圆满。",
		"你回头看时，才发现那座叫「计算机基础」的山，早已被你踩成了平地；而那些曾让你夜不能寐的妖，如今都成了你故事里的注脚。",
		"老夫这一程，送你到此处，便要化作星光了。但别误会——不是老夫度了你，是你自己，一刀一刀，砍出了这条路。",
		"「人类的赞歌，是勇气的赞歌。」去吧，少年。门外的世界，比这四张图大得多。",
	],
};

/** 首杀剧情 id */
export const FIRST_SLAY_STORY = "first-slay";

/** 运行期把心魔劫补进注册表（放在最后，避免上面 import 的 GROUPS 还没就绪） */
for (const graph of Object.keys(GROUP_MAP) as GraphId[]) {
	for (const g of GROUP_MAP[graph]) {
		STORIES[`grp-${graph}-${g.id}`] = groupStory(graph, g);
	}
}

/** 按 id 取剧情，取不到返回 null（防御性，避免渲染崩） */
export function getStory(id: string): Story | null {
	return STORIES[id] ?? null;
}
