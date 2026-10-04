// ============================================================================
// Golden Experience · 实习经历页配置
// ----------------------------------------------------------------------------
// 数据本体在同目录的 internship.data.json —— 因为站内「编辑此页」要能直接
// 改文字、增删条目，所以内容必须是纯 JSON（能安全序列化回去），而不是
// 写死在这个文件里的对象字面量。
//
// 这里只保留：类型定义 + 从 JSON 读出后按原名导出，
// 所以页面与组件的 import 路径和用法都不用改。
// ============================================================================
import raw from "./internship.data.json";

export interface InternshipMetric {
	/** 指标名，例如「实习时长」 */
	label: string;
	/** 指标值，例如「4 个月」 */
	value: string;
	/** 可选补充说明，鼠标悬停时显示 */
	hint?: string;
	/** material-symbols 图标名 */
	icon: string;
}

export interface InternshipLink {
	label: string;
	href: string;
	icon: string;
	external?: boolean;
}

export interface InternshipProfile {
	/** 页面主标题（英文名，替身梗） */
	title: string;
	/** 中文副标题，一句话说明这是什么 */
	tagline: string;
	/** 左侧大标题：姓名 */
	name: string;
	/** 职位 */
	role: string;
	/** 所在团队 / 业务线 */
	team: string;
	/** 起止时间 */
	period: string;
	/** 状态徽章文案 */
	status: string;
	/** 页头下方的一段自我介绍 */
	intro: string;
	/** 头像或公司 logo，放 public/ 下可写 "/xxx.webp"，留空则不渲染图片 */
	avatar: string;
	metrics: InternshipMetric[];
	links: InternshipLink[];
}

export interface InternshipSkill {
	name: string;
	/** 熟练度 0-100，只影响进度条长度 */
	level: number;
	note?: string;
}

export interface InternshipStackGroup {
	title: string;
	items: string[];
}

export interface InternshipTakeaway {
	icon: string;
	title: string;
	points: string[];
}

export interface InternshipHighlight {
	title: string;
	/** 问题 —— 现象是什么 */
	problem: string;
	/** 方案 —— 怎么定位、怎么改 */
	solution: string;
	/** 结果 —— 改完有什么变化 */
	result: string;
	tags: string[];
}

export interface InternshipRetro {
	summary: string;
	next: string[];
}

/**
 * 阶段记录（时间线卡片）。
 * 原先放在 src/content/internship/*.md 里，现在并入 JSON 一起编辑，
 * body 是 Markdown 源码，渲染时走 rehype 渲染成 HTML。
 */
export interface InternshipPhase {
	/** 稳定标识，同时用作 React key 与锚点 */
	id: string;
	order: number;
	period: string;
	title: string;
	summary: string;
	did: string[];
	learned: string[];
	stack: string[];
	/** 展开区正文（Markdown） */
	body: string;
}

export interface InternshipData {
	profile: InternshipProfile;
	phases: InternshipPhase[];
	skills: InternshipSkill[];
	stackGroups: InternshipStackGroup[];
	takeaways: InternshipTakeaway[];
	highlights: InternshipHighlight[];
	retro: InternshipRetro;
	meta: { title: string; description: string };
}

export const internshipData = raw as InternshipData;

export const internshipProfile = internshipData.profile;
export const internshipPhases = internshipData.phases;
export const internshipSkills = internshipData.skills;
export const internshipStackGroups = internshipData.stackGroups;
export const internshipTakeaways = internshipData.takeaways;
export const internshipHighlights = internshipData.highlights;
export const internshipRetro = internshipData.retro;
export const internshipMeta = internshipData.meta;

/** 数据文件路径：站内编辑器读写的就是它 */
export const INTERNSHIP_DATA_PATH = "src/data/internship.data.json";
