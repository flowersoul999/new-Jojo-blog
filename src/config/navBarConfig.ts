import {
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/navBarConfig";

// ============================================================================
// 导航栏配置 - 根据顺序动态生成导航栏链接
// NavBar Configuration - Dynamically generate navigation bar links based on order
// ============================================================================
const getDynamicNavBarConfig = (): NavBarConfig => {
	// 基础导航栏链接
	const links: NavBarLink[] = [
		// 主页
		LinkPresets.Home,
	];

	// 文章及其子菜单
	links.push({
		name: "文章",
		url: "#",
		icon: "material-symbols:article",
		children: [
			// 归档
			LinkPresets.Archive,

			// 分类
			LinkPresets.Categories,

			// 标签
			LinkPresets.Tags,
		],
	});

	// 技能（修行路四张技能图 + 修行录，全部合并为一个入口，点开第一个是计算机基础）
	links.push({
		name: "技能",
		url: "#",
		icon: "material-symbols:account-tree-rounded",
		children: [
			// 计算机基础技能图（补科班底子：数学 / 组原 / 操作系统 / 网络 / 数据库 …）
			LinkPresets.CsSkills,

			// 前端技能图
			LinkPresets.Skills,

			// 后端技能图（在前端基础上往全栈转：运行时 / 接口 / 数据 / 安全 / 运维 / 架构）
			LinkPresets.BackendSkills,

			// Agent 开发技能图（大模型应用：提示 / RAG / 工具编排 / 评测 / 上线）
			LinkPresets.AgentSkills,

			// 修行录：与修行路无先后关系，不计修为、无门禁
			LinkPresets.MusicRecord,
			LinkPresets.EnglishRecord,
		],
	});

	// 面试（求职准备：面经 / 八股 / Hot100 / 手撕题）
	links.push(LinkPresets.Interview);

	// 站点统计（暂时隐藏，页面仍可通过 /analytics/ 访问）
	// links.push(LinkPresets.Analytics);

	// 友链（暂时隐藏，页面仍可通过 /friends/ 访问）
	// links.push(LinkPresets.Friends);

	// 朋友圈（暂时隐藏，页面仍可通过 /moments/ 访问）
	// links.push(LinkPresets.Moments);

	// 留言板
	links.push(LinkPresets.Guestbook);

	// 我的及其子菜单
	links.push({
		name: "我的",
		url: "#",
		icon: "material-symbols:person",
		children: [
			// 实习经历（Golden Experience）
			LinkPresets.Internship,

			// 做过的项目
			LinkPresets.Projects,

			// 相册
			LinkPresets.Gallery,

			// 追番
			LinkPresets.Anime,

			// 番组计划
			LinkPresets.Bangumi,

			// 百宝箱
			LinkPresets.Treasure,

			// 日记
			LinkPresets.Diary,

			// 回忆
			LinkPresets.Memories,

			// 工具
			LinkPresets.Tools,
		],
	});

	// 关于及其子菜单
	links.push({
		name: "关于",
		url: "#",
		icon: "material-symbols:info",
		children: [
			// 关于页面
			LinkPresets.About,

			// 动态表情
			LinkPresets.Lottie,

			// 博客更新日志
			LinkPresets.BlogChangelog,

			// 开往：独立博客友链接力
			LinkPresets.Travellings,
		],
	});

	// 文档链接
	// links.push({
	// 	name: "文档",
	// 	url: "https://docs-rainzt.cn",
	// 	external: true,
	// 	icon: "material-symbols:docs",
	// });

	return { links } as NavBarConfig;
};

// 导航搜索配置
export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

// ============================================================================
// 链接预设 - 可自由自定义导航栏链接的名称、图标和URL
// Link Presets - Allows free customization of the name, icon, and URL of navigation bar links
// ============================================================================
export const LinkPresets: Record<string, NavBarLink> = {
	Home: {
		name: "主页",
		url: "/",
		icon: "material-symbols:home",
	},
	Travellings: {
		name: "开往",
		url: "https://www.travellings.cn/go.html",
		external: true,
		iconImage: "https://www.travellings.cn/assets/travelling.png",
	},
	Archive: {
		name: "归档",
		url: "/archive/",
		icon: "material-symbols:archive",
	},
	Categories: {
		name: "分类",
		url: "/categories/",
		icon: "material-symbols:folder-open-rounded",
	},
	Tags: {
		name: "标签",
		url: "/tags/",
		icon: "material-symbols:tag-rounded",
	},
	Tools: {
		name: "工具",
		url: "/tools/",
		icon: "material-symbols:construction-rounded",
	},
	Skills: {
		name: "前端技能图",
		url: "/skills/",
		icon: "material-symbols:account-tree-rounded",
	},
	CsSkills: {
		name: "计算机基础",
		url: "/cs/",
		icon: "material-symbols:school",
	},
	BackendSkills: {
		name: "后端技能图",
		url: "/backend/",
		icon: "material-symbols:storage",
	},
	AgentSkills: {
		name: "Agent 开发",
		url: "/agent/",
		icon: "material-symbols:smart-toy",
	},
	MusicRecord: {
		name: "音乐（修行录）",
		url: "/music/",
		icon: "material-symbols:music-note",
	},
	EnglishRecord: {
		name: "英语（修行录）",
		url: "/english/",
		icon: "material-symbols:translate",
	},
	Interview: {
		name: "面试",
		url: "/interview/",
		icon: "material-symbols:work",
		pageKey: "interview",
	},
	Friends: {
		name: "友链",
		url: "/friends/",
		icon: "material-symbols:group",
		pageKey: "friends",
	},
	Moments: {
		name: "朋友圈",
		url: "/moments/",
		icon: "material-symbols:rss-feed-rounded",
	},
	Guestbook: {
		name: "留言",
		url: "/guestbook/",
		icon: "material-symbols:chat",
		pageKey: "guestbook",
	},
	About: {
		name: "关于我",
		url: "/about/",
		icon: "material-symbols:person",
	},
	Lottie: {
		name: "动态表情",
		url: "/lottie/",
		icon: "material-symbols:auto-awesome-rounded",
	},
	Analytics: {
		name: "站点统计",
		url: "/analytics/",
		icon: "material-symbols:monitoring-rounded",
	},
	Internship: {
		name: "Golden Experience",
		url: "/internship/",
		icon: "material-symbols:auto-awesome-rounded",
		pageKey: "internship",
	},
	Projects: {
		name: "项目",
		url: "/projects/",
		icon: "material-symbols:widgets-rounded",
		pageKey: "projects",
		activePaths: ["/projects/"],
	},
	BlogChangelog: {
		name: "博客日志",
		url: "/blog-changelog/",
		icon: "material-symbols:auto-stories-rounded",
	},
	Bangumi: {
		name: "番组计划",
		url: "/bangumi/",
		icon: "material-symbols:movie",
		pageKey: "bangumi",
	},
	Treasure: {
		name: "百宝箱",
		url: "/treasure/",
		icon: "material-symbols:extension-rounded",
	},
	Gallery: {
		name: "相册",
		url: "/gallery/",
		icon: "material-symbols:photo-library",
		pageKey: "gallery",
	},
	Anime: {
		name: "追番",
		url: "/anime/",
		icon: "material-symbols:live-tv",
		pageKey: "anime",
	},
	Diary: {
		name: "日志",
		url: "/life/",
		icon: "material-symbols:timeline",
		pageKey: "diary",
		activePaths: ["/diary/", "/life/"],
	},
	Memories: {
		name: "回忆",
		url: "/memories/",
		icon: "material-symbols:history-rounded",
	},
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
