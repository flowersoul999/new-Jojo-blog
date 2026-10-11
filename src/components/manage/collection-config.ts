// 各内容集合的管理台字段配置（schema 驱动）
// CollectionManager 只读这份配置即可渲染列表 + 新建/编辑表单，无需为每个集合写组件。
import type { FieldType, SubField } from "@/utils/collection-frontmatter";

export interface CollectionField {
	key: string;
	label: string;
	type: FieldType;
	required?: boolean;
	placeholder?: string;
	/** select 选项 */
	options?: string[];
	/** objectList 的子字段 */
	subFields?: SubField[];
	/** 列表卡片副标题/信息用，不参与表单 */
	colSpan?: number;
}

export interface CollectionConfig {
	id: string;
	label: string;
	desc: string;
	/** 侧边栏图标（svg path） */
	icon: string;
	/** 集合目录（仓库相对） */
	dir: string;
	/** 列表标题字段 */
	titleKey: string;
	/** 列表副标题字段 */
	subtitleKey?: string;
	/** 排序 / 展示日期字段 */
	dateKey?: string;
	/** 草稿布尔字段（存在则在筛选里启用「草稿」） */
	draftKey?: string;
	/** 列表额外展示的徽标字段（如 result / difficulty） */
	badges?: string[];
	fields: CollectionField[];
	/** 新建文件名来源：提示文案 */
	slugHint: string;
}

const ICON = {
	memories: "M12 21s-8-4.5-8-11a4 4 0 0 1 8-2 4 4 0 0 1 8 2c0 6.5-8 11-8 11Z",
	interview: "M4 5h16v14H4zM8 9h8M8 13h5M8 17h8",
	question: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
	hot100: "M5 3v18l15-9zM19 3v18",
	handcraft: "M7 2h10l3 7-8 13L4 9z",
	projects:
		"M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
};

export const COLLECTION_CONFIGS: Record<string, CollectionConfig> = {
	memories: {
		id: "memories",
		label: "回忆",
		desc: "管理日记回忆条目（封面 + 标题/日期/摘要 + 长文）",
		icon: ICON.memories,
		dir: "src/content/memories",
		titleKey: "title",
		subtitleKey: "summary",
		dateKey: "date",
		slugHint: "回忆文件名（小写英文 / 数字 / 短横，如 first-snow）",
		fields: [
			{ key: "title", label: "标题", type: "text", required: true },
			{ key: "date", label: "日期", type: "date", required: true },
			{
				key: "image",
				label: "封面路径",
				type: "text",
				placeholder: "/memories/first-snow.svg",
			},
			{
				key: "summary",
				label: "摘要",
				type: "textarea",
				placeholder: "一句话摘要，展示在回忆页卡片上",
			},
		],
	},

	interviews: {
		id: "interviews",
		label: "面经",
		desc: "管理面试复盘（公司 / 岗位 / 轮次 / 结果 / 被问到的题）",
		icon: ICON.interview,
		dir: "src/content/interviews",
		titleKey: "company",
		subtitleKey: "position",
		dateKey: "date",
		draftKey: "draft",
		badges: ["stage", "result", "difficulty"],
		slugHint:
			"面经文件名（建议 日期-公司-轮次，如 2026-08-startup-tech-round）",
		fields: [
			{ key: "company", label: "公司", type: "text", required: true },
			{ key: "position", label: "岗位", type: "text", required: true },
			{ key: "date", label: "日期", type: "date", required: true },
			{
				key: "stage",
				label: "轮次",
				type: "select",
				options: ["笔试", "一面", "二面", "三面", "HR 面", "终面"],
			},
			{
				key: "result",
				label: "结果",
				type: "select",
				options: ["offer", "挂", "待定", "已约"],
			},
			{ key: "difficulty", label: "主观难度(1-5)", type: "number" },
			{
				key: "tags",
				label: "标签",
				type: "tags",
				placeholder: "CSS, HTTP, Vue",
			},
			{
				key: "summary",
				label: "摘要",
				type: "textarea",
				placeholder: "一句话复盘感受",
			},
			{ key: "draft", label: "草稿", type: "boolean" },
		],
	},

	questions: {
		id: "questions",
		label: "八股",
		desc: "管理八股文知识点（答案即正文，默认折叠便于自测）",
		icon: ICON.question,
		dir: "src/content/questions",
		titleKey: "question",
		subtitleKey: "category",
		draftKey: "draft",
		badges: ["level", "frequency"],
		slugHint: "八股文件名（知识点短名，如 css-bfc）",
		fields: [
			{ key: "category", label: "领域", type: "text", required: true },
			{ key: "question", label: "问题", type: "text", required: true },
			{
				key: "level",
				label: "难度",
				type: "select",
				options: ["基础", "进阶", "高频"],
			},
			{ key: "frequency", label: "频次(1-5)", type: "number" },
			{ key: "tags", label: "标签", type: "tags", placeholder: "BFC, 布局" },
			{
				key: "source",
				label: "关联面经 slug",
				type: "text",
				placeholder: "2026-08-startup-tech-round（可选）",
			},
			{ key: "draft", label: "草稿", type: "boolean" },
		],
	},

	hot100: {
		id: "hot100",
		label: "Hot100",
		desc: "管理 LeetCode Hot100 题解（思路与代码进正文）",
		icon: ICON.hot100,
		dir: "src/content/hot100",
		titleKey: "title",
		subtitleKey: "category",
		draftKey: "draft",
		badges: ["difficulty", "complexity"],
		slugHint: "题解文件名（题号-短名，如 001-two-sum）",
		fields: [
			{ key: "no", label: "题号", type: "number", required: true },
			{ key: "title", label: "题名", type: "text", required: true },
			{
				key: "difficulty",
				label: "难度",
				type: "select",
				options: ["简单", "中等", "困难"],
			},
			{ key: "category", label: "分类", type: "text" },
			{
				key: "leetcode",
				label: "LeetCode 链接",
				type: "text",
				placeholder: "https://leetcode.cn/problems/...",
			},
			{ key: "keyIdea", label: "核心思路", type: "textarea" },
			{
				key: "complexity",
				label: "复杂度",
				type: "text",
				placeholder: "O(n) / O(n)",
			},
			{
				key: "related",
				label: "相似题号",
				type: "tags",
				placeholder: "15, 167",
			},
			{ key: "draft", label: "草稿", type: "boolean" },
		],
	},

	handcraft: {
		id: "handcraft",
		label: "手撕",
		desc: "管理手撕题（手写代码 / 场景设计）",
		icon: ICON.handcraft,
		dir: "src/content/handcraft",
		titleKey: "title",
		subtitleKey: "kind",
		draftKey: "draft",
		badges: ["difficulty", "scenario"],
		slugHint: "手撕文件名（如 debounce）",
		fields: [
			{ key: "title", label: "标题", type: "text", required: true },
			{
				key: "kind",
				label: "类型",
				type: "select",
				options: ["手写代码", "场景设计"],
			},
			{
				key: "difficulty",
				label: "难度",
				type: "select",
				options: ["简单", "中等", "困难"],
			},
			{ key: "scenario", label: "场景背景", type: "textarea" },
			{ key: "tags", label: "标签", type: "tags", placeholder: "防抖, 闭包" },
			{ key: "summary", label: "摘要", type: "textarea" },
			{ key: "draft", label: "草稿", type: "boolean" },
		],
	},

	projects: {
		id: "projects",
		label: "项目",
		desc: "管理项目页条目（方案与复盘进正文）",
		icon: ICON.projects,
		dir: "src/content/projects",
		titleKey: "title",
		subtitleKey: "role",
		dateKey: "start",
		draftKey: "draft",
		badges: ["status", "category", "featured"],
		slugHint: "项目文件名（如 aemeath-blog）",
		fields: [
			{ key: "title", label: "标题", type: "text", required: true },
			{ key: "summary", label: "一句话价值", type: "textarea" },
			{ key: "role", label: "我的角色", type: "text" },
			{ key: "start", label: "开始日期", type: "date" },
			{ key: "end", label: "结束日期(可选)", type: "date" },
			{
				key: "status",
				label: "状态",
				type: "select",
				options: ["在研", "已完成", "已归档"],
			},
			{
				key: "category",
				label: "分类",
				type: "select",
				options: ["实习", "个人", "课程", "实验"],
			},
			{
				key: "languages",
				label: "主要语言",
				type: "tags",
				placeholder: "TypeScript, Astro",
			},
			{
				key: "stack",
				label: "技术栈",
				type: "tags",
				placeholder: "Astro, Svelte 5",
			},
			{
				key: "metrics",
				label: "量化指标",
				type: "objectList",
				subFields: [
					{ key: "label", label: "指标名", type: "text" },
					{ key: "value", label: "数值", type: "text" },
				],
			},
			{
				key: "links",
				label: "相关链接",
				type: "objectList",
				subFields: [
					{ key: "label", label: "名称", type: "text" },
					{ key: "href", label: "链接", type: "text" },
					{ key: "icon", label: "图标", type: "text" },
				],
			},
			{ key: "repo", label: "仓库地址", type: "text" },
			{ key: "license", label: "协议", type: "text" },
			{ key: "featured", label: "精选", type: "boolean" },
			{ key: "order", label: "展示顺序", type: "number" },
			{ key: "icon", label: "图标字符", type: "text" },
			{ key: "draft", label: "草稿", type: "boolean" },
		],
	},
};
