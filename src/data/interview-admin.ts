// 面试板块后台：每个内容集合的字段声明。
// 表单是配置驱动的 —— 加一列 / 改个选项名只改这里，InterviewAdmin.astro 不用动。
// 字段名必须与 src/content.config.ts 里的 schema 一一对应，否则 Zod 会拒掉文件。

export type AdminFieldType =
	| "text"
	| "textarea"
	| "date"
	| "number"
	| "select"
	| "tags"
	| "nums";

export interface AdminField {
	name: string;
	label: string;
	type: AdminFieldType;
	/** select 的候选项 */
	options?: string[];
	/** 新建时的默认值 */
	value?: string;
	placeholder?: string;
	required?: boolean;
	/** 独占整行 */
	wide?: boolean;
	/** 标签后面的灰色小字 */
	hint?: string;
	/**
	 * 不写进 frontmatter 的字段：
	 * body = Markdown 正文本身，filename = 只用来决定文件路径。
	 */
	virtual?: boolean;
	min?: number;
	max?: number;
	rows?: number;
}

export interface AdminCollection {
	/** 按钮和弹窗标题里用的名字，例如「八股文」 */
	label: string;
	/** 仓库相对路径 */
	dir: string;
	fields: AdminField[];
	/** 文件名留空时，用这些字段拼 slug */
	slugFrom: string[];
}

/** 每个集合都有的「文件名」输入框，只影响路径，不写进 YAML */
const FILENAME_FIELD: AdminField = {
	name: "filename",
	label: "文件名",
	type: "text",
	wide: true,
	virtual: true,
	hint: "留空则自动生成，只在新建时生效",
};

export const ADMIN_COLLECTIONS = {
	interviews: {
		label: "面经",
		dir: "src/content/interviews",
		slugFrom: ["company", "stage"],
		fields: [
			{
				name: "company",
				label: "公司",
				type: "text",
				required: true,
				placeholder: "某电商中台",
			},
			{
				name: "position",
				label: "岗位",
				type: "text",
				required: true,
				placeholder: "前端开发实习生",
			},
			{ name: "date", label: "日期", type: "date", required: true },
			{
				name: "stage",
				label: "轮次",
				type: "select",
				value: "一面",
				options: ["笔试", "一面", "二面", "三面", "技术面", "HR 面", "终面"],
			},
			{
				name: "result",
				label: "结果",
				type: "select",
				value: "待定",
				options: ["待定", "已约", "offer", "挂"],
			},
			{
				name: "difficulty",
				label: "难度 1-5",
				type: "number",
				value: "3",
				min: 1,
				max: 5,
			},
			{
				name: "tags",
				label: "标签（逗号分隔）",
				type: "tags",
				wide: true,
				placeholder: "CSS, HTTP, Vue",
			},
			{
				name: "summary",
				label: "一句话摘要",
				type: "text",
				wide: true,
				placeholder: "节奏极快，25 分钟问了十几个问题。",
			},
			FILENAME_FIELD,
			{
				name: "body",
				label: "正文（Markdown）",
				type: "textarea",
				wide: true,
				virtual: true,
				rows: 14,
				placeholder: "## 流程\n\n## 被问到的题\n\n- …",
			},
		],
	},
	questions: {
		label: "八股文",
		dir: "src/content/questions",
		slugFrom: ["question"],
		fields: [
			{
				name: "category",
				label: "领域",
				type: "text",
				required: true,
				placeholder: "CSS",
				hint: "决定归到哪一组",
			},
			{
				name: "level",
				label: "难度",
				type: "select",
				value: "基础",
				options: ["基础", "进阶", "高频"],
			},
			{
				name: "question",
				label: "问题",
				type: "text",
				required: true,
				wide: true,
				placeholder: "什么是 BFC？它能解决哪些实际问题？",
			},
			{
				name: "frequency",
				label: "被问频次 1-5",
				type: "number",
				value: "3",
				min: 1,
				max: 5,
			},
			{
				name: "source",
				label: "关联面经",
				type: "text",
				hint: "interviews 里的文件名，可留空",
			},
			{
				name: "tags",
				label: "标签（逗号分隔）",
				type: "tags",
				wide: true,
				placeholder: "布局, 清除浮动",
			},
			FILENAME_FIELD,
			{
				name: "body",
				label: "答案（Markdown）",
				type: "textarea",
				wide: true,
				virtual: true,
				rows: 16,
				placeholder: "## 一句话答案\n\n…",
			},
		],
	},
	hot100: {
		label: "Hot100",
		dir: "src/content/hot100",
		slugFrom: ["title"],
		fields: [
			{
				name: "no",
				label: "题号",
				type: "number",
				required: true,
				min: 1,
				placeholder: "1",
			},
			{
				name: "title",
				label: "题目",
				type: "text",
				required: true,
				placeholder: "两数之和",
			},
			{
				name: "difficulty",
				label: "难度",
				type: "select",
				value: "中等",
				options: ["简单", "中等", "困难"],
			},
			{
				name: "category",
				label: "分类",
				type: "select",
				value: "技巧",
				options: [
					"哈希",
					"双指针",
					"滑动窗口",
					"子串",
					"普通数组",
					"矩阵",
					"链表",
					"二叉树",
					"图论",
					"回溯",
					"二分查找",
					"栈",
					"堆",
					"贪心算法",
					"动态规划",
					"多维动态规划",
					"技巧",
				],
			},
			{
				name: "complexity",
				label: "复杂度",
				type: "text",
				placeholder: "O(n) / O(n)",
			},
			{
				name: "leetcode",
				label: "力扣链接",
				type: "text",
				placeholder: "https://leetcode.cn/problems/two-sum/",
			},
			{
				name: "keyIdea",
				label: "一句话思路",
				type: "text",
				wide: true,
				placeholder: "用哈希表边遍历边补数，O(n) 一遍过。",
			},
			{
				name: "related",
				label: "相似题号",
				type: "nums",
				wide: true,
				placeholder: "15, 18",
			},
			{
				name: "related",
				label: "相似题号",
				type: "nums",
				wide: true,
				placeholder: "15, 18",
			},
			FILENAME_FIELD,
			{
				name: "body",
				label: "题解（Markdown）",
				type: "textarea",
				wide: true,
				virtual: true,
				rows: 16,
				placeholder: "```js\n// code\n```",
			},
		],
	},
	handcraft: {
		label: "手撕题",
		dir: "src/content/handcraft",
		slugFrom: ["title"],
		fields: [
			{
				name: "title",
				label: "标题",
				type: "text",
				required: true,
				wide: true,
				placeholder: "手写 Promise.all",
			},
			{
				name: "kind",
				label: "类型",
				type: "select",
				value: "手写代码",
				options: ["手写代码", "场景设计"],
			},
			{
				name: "difficulty",
				label: "难度",
				type: "select",
				value: "中等",
				options: ["简单", "中等", "困难"],
			},
			{
				name: "scenario",
				label: "场景背景",
				type: "text",
				wide: true,
				placeholder: "一句话说清要解决什么问题",
			},
			{
				name: "tags",
				label: "标签（逗号分隔）",
				type: "tags",
				wide: true,
				placeholder: "异步, Promise",
			},
			{
				name: "summary",
				label: "一句话摘要",
				type: "text",
				wide: true,
				placeholder: "易错点在哪",
			},
			FILENAME_FIELD,
			{
				name: "body",
				label: "代码 / 正文（Markdown）",
				type: "textarea",
				wide: true,
				virtual: true,
				rows: 16,
				placeholder: "```js\n// code\n```",
			},
		],
	},
} satisfies Record<string, AdminCollection>;

export type AdminCollectionKey = keyof typeof ADMIN_COLLECTIONS;
