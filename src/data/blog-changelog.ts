export type BlogChangelogTone = "blue" | "mint" | "gold" | "violet";

export type BlogChangelogEntry = {
	date: string;
	version: string;
	displayDate: string;
	kind: string;
	title: string;
	summary: string;
	details: string[];
	tags: string[];
	tone: BlogChangelogTone;
};

/**
 * jojo 博客本身的建设记录。
 * 按仓库真实提交整理，记录从旧站迁移到新主题以来的内容、页面和部署变化。
 */
export const blogChangelogEntries: BlogChangelogEntry[] = [
	{
		date: "2026-09-27",
		version: "V1.1.0",
		displayDate: "2026 年 9 月 27 日",
		kind: "音乐与写作",
		title: "把音乐、写作和相册接回新站",
		summary:
			"迁移 jojo 博客全部 11 首音乐，新增线上写作页，并让相册支持全屏散落拍立得模式。",
		details: [
			"迁移 jojo 博客全部 11 首音乐到主题原生播放器歌单，播放器与新站主题保持一致。",
			"音乐播放器新增波浪流动进度条、底部居中浮动歌词卡片和悬浮迷你播放器三种形态。",
			"新增线上写作页 /write/：登录后可以直接在网站里写文章并发布到仓库。",
			"相册照片支持全屏散落拍立得模式，可自由拖动、点击放大查看。",
			"站点品牌名 Joestar 统一改为 jojo，关于页与全站身份信息全部替换为 jojo。",
			"移除左下角未登录状态的 GitHub 登录浮动按钮，登录入口收敛到编辑器内部。",
		],
		tags: ["音乐", "写作", "相册", "品牌"],
		tone: "gold",
	},
	{
		date: "2026-09-26",
		version: "V1.0.0",
		displayDate: "2026 年 9 月 26 日",
		kind: "内容迁移与改版",
		title: "把旧 jojo 博客整体搬进新主题",
		summary:
			"从旧 jojo 博客迁移文章、相册和百宝箱，重建日记页与 Tab 轮盘，并全站统一为 jojo 品牌。",
		details: [
			"从旧 jojo 博客迁移 33 篇文章，文章内容、分类和标签整体搬迁到新主题。",
			"相册替换为 life-fragments 相册；百宝箱工具箱迁移为主题内的 React 岛屿组件。",
			"新增日记页 /diary/，支持全屏沉浸模式与可以拖动、漂浮的纸张。",
			"新增 Tab 径向轮盘，按住 Tab 键即可呼出快速导航菜单。",
			"番组计划清空默认收藏并显示友好空状态；隐藏站点信息侧栏卡片。",
			"隐藏导航栏中的站点统计、友链和朋友圈入口，页面仍可通过地址直接访问。",
			"全站品牌由 Rain / 朝朝听雨统一替换为 jojo，站点地址更新为 jojocode.cn。",
			"配置 Vercel 适配器支持 Cloudflare 与 Vercel 双平台部署，并加入 GitHub OAuth 在线编辑器。",
		],
		tags: ["迁移", "日记", "百宝箱", "品牌", "部署"],
		tone: "blue",
	},
	{
		date: "2026-09-16",
		version: "V0.9.0",
		displayDate: "2026 年 9 月 16 日",
		kind: "主题就绪",
		title: "主题与文档对齐，准备公共快照",
		summary:
			"整理主题文档、对齐公共说明，并准备公共快照，作为迁移前的基线版本。",
		details: [
			"对齐公共文档，让说明与主题当前状态保持一致。",
			"整理并准备公共快照，作为后续品牌替换与内容迁移的基线。",
		],
		tags: ["文档", "快照"],
		tone: "mint",
	},
	{
		date: "2026-09-08",
		version: "V0.1.0",
		displayDate: "2026 年 9 月 8 日",
		kind: "改版起点",
		title: "同步本地站点到公共快照",
		summary: "把本地站点状态同步到公共快照，作为 jojo 博客改版的起点。",
		details: [
			"将本地站点状态同步到公共快照，保留主题既有的页面与结构。",
			"作为后续品牌替换与内容迁移的起点提交。",
		],
		tags: ["同步", "起点"],
		tone: "violet",
	},
];