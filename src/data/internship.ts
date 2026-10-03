// ============================================================================
// Golden Experience · 实习经历页配置
// ----------------------------------------------------------------------------
// 这里是页面的「固定几块」：页头信息、指标、技能熟练度、技术标签、
// 收获卡片、高光时刻、复盘总结。时间线上那些「一条一条会长」的阶段记录
// 在 src/content/internship/*.md 里，改那边不用动这个文件。
// ============================================================================

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

export const internshipProfile: InternshipProfile = {
	title: "Golden Experience",
	tagline: "实习经历 · 在共享用工 SaaS 里打怪升级的这几个月",
	// 对外一律用昵称，不放真名
	name: "jojo",
	role: "前端开发实习生",
	team: "共享用工 SaaS · 中控端 / 超管端",
	period: "2026.06 – 至今",
	status: "在职中",
	intro:
		"第一次进真实的业务项目，第一次在几十个包的仓库里找代码，也第一次意识到「能跑」离「写对」还有挺远一段路。这里记下我每个阶段做了什么、想明白了什么。",
	avatar: "",
	metrics: [
		{
			label: "实习时长",
			value: "4 个月",
			hint: "2026.06 起",
			icon: "schedule-rounded",
		},
		{
			label: "项目工作区",
			value: "39 个",
			hint: "pnpm monorepo",
			icon: "grid-view-rounded",
		},
		{
			label: "独立交付",
			value: "2+ 个",
			hint: "从定位到自测走完整流程",
			icon: "rocket-launch-outline",
		},
	],
	links: [
		{
			label: "GitHub",
			href: "https://github.com/flowersoul999",
			icon: "arrow-outward-rounded",
			external: true,
		},
	],
};

export const internshipSkills: InternshipSkill[] = [
	{ name: "Vue 3 / tsx 组件开发", level: 78 },
	{ name: "vxe-table 表格与数据流", level: 72 },
	{ name: "Git 分支协作与冲突处理", level: 80 },
	{ name: "pnpm monorepo 组织", level: 68 },
	{ name: "接口层封装与联调", level: 70 },
];

export const internshipStackGroups: InternshipStackGroup[] = [
	{
		title: "日常在用的",
		items: ["Vue 3", "TypeScript", "tsx", "vxe-table", "Axios", "Vben Admin"],
	},
	{
		title: "工程与协作",
		items: ["pnpm 工作区", "Vite", "Git 分支策略", "Code Review", "接口联调"],
	},
];

export const internshipTakeaways: InternshipTakeaway[] = [
	{
		icon: "code-blocks-rounded",
		title: "技术能力",
		points: [
			"从「照着改」到能自己定位问题的根因",
			"搞清了大表格组件的渲染方式与刷新时机",
			"学会把重复逻辑抽到公共层，而不是到处复制",
		],
	},
	{
		icon: "menu-book-rounded",
		title: "工程规范",
		points: [
			"提交前先自己看一遍 diff，别把问题留给 review",
			"commit message 要写清「为什么」，而不只是「改了哪」",
			"动公共包之前先搜一遍有谁在引用",
		],
	},
	{
		icon: "groups-rounded",
		title: "业务与协作",
		points: [
			"先读懂业务再动手，比先写代码省时间",
			"联调时主动对齐字段类型和异常分支",
			"不确定就早一点问，卡住的成本更高",
		],
	},
];

export const internshipHighlights: InternshipHighlight[] = [
	{
		title: "协议列表返回时不刷新",
		problem:
			"从详情页返回列表，看到的还是进去之前那份旧数据，必须手动刷新一次才能拿到最新的。",
		solution:
			"一开始我直接补了一次查询请求，被问「你知道它为什么没刷新吗」才发现没定位到根因。顺着查询参数的变更链路走了一遍，找到返回后重新查询的条件没有被满足，改对那个点。",
		result: "返回列表即可看到最新数据，去掉了手动刷新这一步。",
		tags: ["vxe-table", "Vue 3", "数据流"],
	},
	{
		title: "服务单金额的长尾小数",
		problem:
			"金额直接按浮点结果渲染，出现 1999.9000000001 这种长尾小数，展示很难看也不统一。",
		solution:
			"没有在出问题的那个页面就地格式化，而是把展示口径收到公共 utils 里统一处理，页面不再各写一套。",
		result: "全站金额展示口径一致，以后要调整只改一处就生效。",
		tags: ["TypeScript", "公共库", "展示规范"],
	},
];

export const internshipRetro: InternshipRetro = {
	summary:
		"这几个月最大的变化，是从「拿到需求就开始写」，变成「先搞清数据从哪来、往哪去，再动手」。想清楚再写表面上慢一点，但少了大量返工。",
	next: [
		"继续补后端与全栈能力，能自己把接口和数据流完整串起来",
		"把个人项目的工程化程度做得更接近真实业务项目",
		"往下多走一层：除了页面，也想弄明白构建、部署和性能这几件事",
	],
};

/** 页面 SEO 元信息 */
export const internshipMeta = {
	title: "Golden Experience",
	description:
		"一份前端实习的成长记录：在共享用工 SaaS 的中控端项目里，从读代码到独立承接模块，每个阶段做了什么、想明白了什么。",
};
