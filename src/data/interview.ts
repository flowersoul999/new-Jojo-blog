/**
 * 面试板块的模块清单（导航、首页入口卡、子页切换都读这一份）
 *
 * 加新模块的步骤：
 *   1. 在 src/content.config.ts 注册同名集合
 *   2. 在这里追加一条
 *   3. 写 src/pages/interview/<key>.astro
 */
export type InterviewModule = {
	/** 与子页路径、content 集合名保持一致 */
	key: string;
	name: string;
	href: string;
	icon: string;
	/** 卡片右上角的短标签 */
	hint: string;
	/** 一句话说明这个模块放什么 */
	desc: string;
};

export const INTERVIEW_MODULES: InterviewModule[] = [
	{
		key: "experience",
		name: "面经",
		href: "/interview/experience/",
		icon: "material-symbols:forum",
		hint: "一场一篇",
		desc: "公司、轮次、结果，以及当场被问到的每一个问题。重点在我事后写下的复盘。",
	},
	{
		key: "questions",
		name: "八股文",
		href: "/interview/questions/",
		icon: "material-symbols:menu-book",
		hint: "自测卡",
		desc: "按领域归档的知识点。答案默认收起来，先自己讲一遍再展开对照。",
	},
	{
		key: "hot100",
		name: "算法 Hot100",
		href: "/interview/hot100/",
		icon: "material-symbols:code",
		hint: "刷题进度",
		desc: "力扣官方 100 题，按分类铺开。每道题记的是「这题的关键在哪」，不是抄题解。",
	},
	{
		key: "handcraft",
		name: "手撕题",
		href: "/interview/handcraft/",
		icon: "material-symbols:edit",
		hint: "手写 + 场景",
		desc: "白板手写代码，和「给你一个场景，你怎么设计」的开放题。两块是连在一起考的。",
	},
];

/** key → 模块，用于按 key 取标题等信息 */
export const INTERVIEW_MODULE_MAP: Record<string, InterviewModule> =
	Object.fromEntries(INTERVIEW_MODULES.map((m) => [m.key, m]));
