// ============================================================================
// 项目页配置 · 固定几块
// ----------------------------------------------------------------------------
// 这里是页面的「不随项目增减而变」的部分：页头、统计口径、分类与状态定义。
// 一个个项目本身在 src/content/projects/*.md 里，加项目不用动这个文件。
// ============================================================================

export interface ProjectProfile {
	/** 页面主标题 */
	title: string;
	/** 英文 kicker */
	kicker: string;
	/** 一句话定位 */
	tagline: string;
	/** 页头下方那段自述 */
	intro: string;
	/** 头像 / 站标方块里的字符 */
	mark: string;
}

export interface ProjectLink {
	label: string;
	href: string;
	icon: string;
	external?: boolean;
}

export interface ProjectMeta {
	title: string;
	description: string;
}

/** 分类定义：顺序即筛选栏里的顺序 */
export interface ProjectCategory {
	key: string;
	label: string;
	icon: string;
	desc: string;
}

/** 状态定义：顺序即筛选栏里的顺序 */
export interface ProjectStatus {
	key: string;
	label: string;
	/** 徽章色调，对应 --pj-tone-* */
	tone: "green" | "blue" | "gray";
}

export const projectMeta: ProjectMeta = {
	title: "项目",
	description:
		"这里放我做过的项目——学校实训、课程作业、AI 方向的实验，还有实习期间真正上线的东西。每个项目都写清楚背景、方案、踩过的坑，以及事后复盘学到了什么。",
};

export const projectProfile: ProjectProfile = {
	title: "项目",
	kicker: "PROJECTS · 造物",
	tagline: "写过的东西都留在这儿，包括写砸的。",
	mark: "PJ",
	intro:
		"从学校的 Java Web 实训开始，一路做到实习期间的中后台，再到最近在啃的 AI Agent。这些项目有课程作业，也有自己想清楚要做什么才动手的东西。我更在意每个项目里「为什么这么设计」和「哪里踩了坑」，所以详情页基本都按背景 → 方案 → 实现 → 踩坑 → 复盘的顺序写。",
};

export const projectLinks: ProjectLink[] = [
	{
		label: "GitHub 主页",
		href: "https://github.com/flowersoul999",
		icon: "material-symbols:code-braces",
		external: true,
	},
	{
		label: "实习经历",
		href: "/internship/",
		icon: "material-symbols:workspace-premium-rounded",
	},
	{
		label: "技能图",
		href: "/skills/",
		icon: "material-symbols:account-tree-rounded",
	},
];

export const PROJECT_CATEGORIES: ProjectCategory[] = [
	{
		key: "实习",
		label: "实习",
		icon: "material-symbols:workspace-premium-rounded",
		desc: "公司里真实在跑、有用户在用的东西",
	},
	{
		key: "个人",
		label: "个人",
		icon: "material-symbols:rocket-launch-rounded",
		desc: "自己想做就做的，没有deadline 那种",
	},
	{
		key: "课程",
		label: "课程",
		icon: "material-symbols:school",
		desc: "为交作业做的，目标是搞懂原理",
	},
	{
		key: "实验",
		label: "实验",
		icon: "material-symbols:science",
		desc: "练手和验证想法的，代码质量参差",
	},
];

export const PROJECT_STATUSES: ProjectStatus[] = [
	{
		key: "在研",
		label: "在研",
		tone: "green",
	},
	{
		key: "已完成",
		label: "已完成",
		tone: "blue",
	},
	{
		key: "已归档",
		label: "已归档",
		tone: "gray",
	},
];

/** 项目墙 / 详情页顶部这几个板块，id 要和组件里的 section id 对上 */
export const PROJECT_ANCHORS = [
	{ id: "wall", label: "项目墙", icon: "material-symbols:grid-view-rounded" },
	{
		id: "timeline",
		label: "时间线",
		icon: "material-symbols:timeline",
	},
	{ id: "stack", label: "技术栈", icon: "material-symbols:layers-rounded" },
];

/** 时间线页和项目墙上方的跳转入口 */
export const PROJECT_VIEWS = [
	{ key: "wall", label: "项目墙", href: "/projects/" },
	{ key: "timeline", label: "时间线", href: "/projects/timeline/" },
	{ key: "stack", label: "技术栈", href: "/projects/stack/" },
];

/** key → 分类，用于取图标和说明 */
export const PROJECT_CATEGORY_MAP: Record<string, ProjectCategory> =
	Object.fromEntries(PROJECT_CATEGORIES.map((c) => [c.key, c]));

/** key → 状态，用于取色调 */
export const PROJECT_STATUS_MAP: Record<string, ProjectStatus> =
	Object.fromEntries(PROJECT_STATUSES.map((s) => [s.key, s]));
