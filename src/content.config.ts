import { defineCollection } from "astro:content";
import type { CollectionConfig } from "astro/content/config";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

type PostData = {
	title: string;
	published: Date;
	updated?: Date;
	draft: boolean;
	description: string;
	aiSummary: string;
	aiPolished: boolean;
	image: string;
	tags: string[];
	category: string | null;
	lang: string;
	pinned: boolean;
	pinnedOrder?: number;
	author: string;
	sourceLink: string;
	licenseName: string;
	licenseUrl: string;
	comment: boolean;
	password: string;
	passwordHint: string;
	prevTitle: string;
	prevSlug: string;
	nextTitle: string;
	nextSlug: string;
};

type PostsCollection = CollectionConfig<z.ZodType<PostData>>;
type SpecCollection = CollectionConfig<z.ZodType<Record<string, never>>>;

/** 回忆页条目：封面 + 标题/日期/摘要，正文即详情弹窗里的长文 */
type MemoriesData = {
	title: string;
	date: Date;
	summary: string;
	image: string;
};

type MemoriesCollection = CollectionConfig<z.ZodType<MemoriesData>>;

/** 面经：一次面试 = 一篇记录（公司 / 轮次 / 结果 / 被问到的题） */
type InterviewData = {
	company: string;
	position: string;
	date: Date;
	stage: string;
	result: string;
	difficulty: number;
	tags: string[];
	summary: string;
	draft: boolean;
};

type InterviewCollection = CollectionConfig<z.ZodType<InterviewData>>;

/** 八股文：一个知识点 = 一条问答（答案即正文，默认折叠便于自测） */
type QuestionData = {
	category: string;
	question: string;
	level: string;
	frequency: number;
	tags: string[];
	source: string;
	draft: boolean;
};

type QuestionCollection = CollectionConfig<z.ZodType<QuestionData>>;

/** 算法 Hot100：一题 = 一条题解（元数据进 schema，思路与代码进正文） */
type Hot100Data = {
	no: number;
	title: string;
	difficulty: string;
	category: string;
	leetcode: string;
	keyIdea: string;
	complexity: string;
	related: number[];
	draft: boolean;
};

type Hot100Collection = CollectionConfig<z.ZodType<Hot100Data>>;

/** 手撕题：手写代码（防抖 / Promise.all…）与场景设计（并发请求池 / 分片上传…） */
type HandcraftData = {
	title: string;
	kind: string;
	difficulty: string;
	scenario: string;
	tags: string[];
	summary: string;
	draft: boolean;
};

type HandcraftCollection = CollectionConfig<z.ZodType<HandcraftData>>;

/** 项目页条目：一个项目 = 一篇长文（元数据进 schema，方案与复盘进正文） */
type ProjectsData = {
	title: string;
	/** 一句话价值：说清「它解决了什么」，卡片和 SEO 都用它 */
	summary: string;
	/** 我的角色，例如「独立开发」「前端实习生」 */
	role: string;
	/** 起止时间 */
	start: Date;
	end?: Date;
	/** 在研 / 已完成 / 已归档 */
	status: string;
	/** 实习 / 个人 / 课程 / 实验 */
	category: string;
	/** 主要语言，可多选 */
	languages: string[];
	/** 技术栈标签，用于筛选 */
	stack: string[];
	/** 2-4 个量化指标 */
	metrics: { label: string; value: string }[];
	/** 仓库 / 演示 / 文档 */
	links: { label: string; href: string; icon: string }[];
	repo: string;
	license: string;
	/** 精选项目会单独提到顶部 */
	featured: boolean;
	/** 展示顺序（数字越小越靠前） */
	order: number;
	/** 项目图标 emoji 或字符，留空则用标题首字 */
	icon: string;
	draft: boolean;
};

type ProjectsCollection = CollectionConfig<z.ZodType<ProjectsData>>;

const postsCollection: PostsCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		aiSummary: z.string().optional().default(""),
		aiPolished: z.boolean().optional().default(true),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),
		pinnedOrder: z.number().optional(),
		author: z.string().optional().default(""),
		sourceLink: z.string().optional().default(""),
		licenseName: z.string().optional().default(""),
		licenseUrl: z.string().optional().default(""),
		comment: z.boolean().optional().default(true),
		password: z.string().optional().default(""),
		passwordHint: z.string().optional().default(""),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

const specCollection: SpecCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spec" }),
	schema: z.object({}),
});

const memoriesCollection: MemoriesCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/memories" }),
	schema: z.object({
		title: z.string(),
		date: z.date(),
		summary: z.string().optional().default(""),
		image: z.string(),
	}),
});

const interviewCollection: InterviewCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/interviews" }),
	schema: z.object({
		// 公司名，写不出来时可以只写类型，例如「某电商中台」
		company: z.string(),
		position: z.string(),
		date: z.date(),
		// 轮次：笔试 / 一面 / 二面 / 三面 / HR 面 / 终面
		stage: z.string().optional().default("一面"),
		// 结果：offer / 挂 / 待定 / 已约
		result: z.string().optional().default("待定"),
		// 主观难度 1-5
		difficulty: z.number().optional().default(3),
		tags: z.array(z.string()).optional().default([]),
		summary: z.string().optional().default(""),
		draft: z.boolean().optional().default(false),
	}),
});

const questionCollection: QuestionCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/questions" }),
	schema: z.object({
		// 领域：HTML / CSS / JavaScript / 浏览器 / 网络 / 工程化 / Vue / React / 手写题
		category: z.string(),
		question: z.string(),
		// 难度：基础 / 进阶 / 高频
		level: z.string().optional().default("基础"),
		// 被问到的频次 1-5，用来排「优先复习」顺序
		frequency: z.number().optional().default(3),
		tags: z.array(z.string()).optional().default([]),
		// 关联面经 slug（interviews 里的文件名），用于反查「这题在哪场面试被问过」
		source: z.string().optional().default(""),
		draft: z.boolean().optional().default(false),
	}),
});

const hot100Collection: Hot100Collection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/hot100" }),
	schema: z.object({
		// LeetCode 题号，列表按它排序
		no: z.number(),
		title: z.string(),
		difficulty: z.string().optional().default("中等"),
		// 官方 17 类：哈希 / 双指针 / 滑动窗口 / 子串 / 普通数组 / 矩阵 /
		// 链表 / 二叉树 / 图论 / 回溯 / 二分查找 / 栈 / 堆 / 贪心算法 /
		// 动态规划 / 多维动态规划 / 技巧
		category: z.string().optional().default("技巧"),
		leetcode: z.string().optional().default(""),
		// 一句话核心思路，卡片上直接显示
		keyIdea: z.string().optional().default(""),
		// 时间 / 空间复杂度，例如 "O(n) / O(n)"
		complexity: z.string().optional().default(""),
		// 相似题题号，用于串联同类题
		related: z.array(z.number()).optional().default([]),
		draft: z.boolean().optional().default(false),
	}),
});

const handcraftCollection: HandcraftCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/handcraft" }),
	schema: z.object({
		title: z.string(),
		// 手写代码 | 场景设计
		kind: z.string().optional().default("手写代码"),
		difficulty: z.string().optional().default("中等"),
		// 场景设计题的题面背景，一句话说清要解决什么问题
		scenario: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		summary: z.string().optional().default(""),
		draft: z.boolean().optional().default(false),
	}),
});

const projectsCollection: ProjectsCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
	schema: z.object({
		title: z.string(),
		summary: z.string().optional().default(""),
		role: z.string().optional().default("独立开发"),
		start: z.date(),
		end: z.date().optional(),
		status: z.string().optional().default("已完成"),
		category: z.string().optional().default("个人"),
		languages: z.array(z.string()).optional().default([]),
		stack: z.array(z.string()).optional().default([]),
		metrics: z
			.array(
				z.object({
					label: z.string(),
					value: z.string(),
				}),
			)
			.optional()
			.default([]),
		links: z
			.array(
				z.object({
					label: z.string(),
					href: z.string(),
					icon: z.string().optional().default("material-symbols:open-in-new"),
				}),
			)
			.optional()
			.default([]),
		repo: z.string().optional().default(""),
		license: z.string().optional().default(""),
		featured: z.boolean().optional().default(false),
		order: z.number().optional().default(0),
		icon: z.string().optional().default(""),
		draft: z.boolean().optional().default(false),
	}),
});

export const collections: {
	posts: typeof postsCollection;
	spec: typeof specCollection;
	memories: typeof memoriesCollection;
	interviews: typeof interviewCollection;
	questions: typeof questionCollection;
	hot100: typeof hot100Collection;
	handcraft: typeof handcraftCollection;
	projects: typeof projectsCollection;
} = {
	posts: postsCollection,
	spec: specCollection,
	memories: memoriesCollection,
	interviews: interviewCollection,
	questions: questionCollection,
	hot100: hot100Collection,
	handcraft: handcraftCollection,
	projects: projectsCollection,
};
