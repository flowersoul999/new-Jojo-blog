import {
	Fish,
	Sparkles,
	CloudSun,
	CalendarHeart,
	Timer,
	Palette,
	BookOpenText,
	Hourglass,
	Sailboat,
	Gamepad2,
	Star,
	Leaf,
	Clapperboard,
	History,
	BarChart3,
	Wrench,
	Bookmark,
	Network,
	Telescope,
	MessageCircle,
	MessagesSquare,
	ChevronRight,
	Flame,
	Ticket,
	Coffee,
	ImagePlus,
	MonitorSmartphone,
	ScrollText,
	Moon,
	CircleDollarSign,
	QrCode,
	Truck,
	Smartphone,
} from 'lucide-react'
// lucide-react 新版移除了品牌图标，GitHub 图标来自本地内联组件
import { Github } from './lib/github-icon'

export interface TreasureItem {
	icon: unknown
	title: string
	description: string
	href: string
	emoji: string
	/** 百宝箱首页分组 */
	group?: '资讯查询' | '图片壁纸' | '休闲玩法' | '生活实用' | '我的花园'
	/** 是否外链（外链卡片打开新标签页） */
	external?: boolean
}

export const ITEMS: TreasureItem[] = [
	// —— 资讯查询 ——
	{ icon: Flame, title: '全网热榜', description: '20 个平台实时热搜', href: '/treasure/hot-board/', emoji: '🔥', group: '资讯查询' },
	{ icon: Ticket, title: '实时票房', description: '今日电影大盘排名', href: '/treasure/box-office/', emoji: '🎟️', group: '资讯查询' },
	{ icon: Github, title: 'GitHub 查询', description: '用户资料 · 仓库数据', href: '/treasure/github/', emoji: '🐙', group: '资讯查询' },

	// —— 图片壁纸 ——
	{ icon: ImagePlus, title: '随机图片', description: '萌宠 · ACG · 风景 · 表情包', href: '/treasure/random-image/', emoji: '🎴', group: '图片壁纸' },
	{ icon: MonitorSmartphone, title: '4K 壁纸', description: '超清动漫风景壁纸', href: '/treasure/random-4k/', emoji: '🖥️', group: '图片壁纸' },

	// —— 休闲玩法 ——
	{ icon: Coffee, title: '毒鸡汤', description: '干了这碗负能量', href: '/treasure/soul-soup/', emoji: '🥣', group: '休闲玩法' },
	{ icon: ScrollText, title: '观音灵签', description: '求一支今日指引', href: '/treasure/lottery/', emoji: '🧧', group: '休闲玩法' },
	{ icon: Moon, title: '星座运势', description: '12 星座每日运势', href: '/treasure/horoscope/', emoji: '✨', group: '休闲玩法' },
	{ icon: CircleDollarSign, title: '抛硬币', description: '让命运帮你决定', href: '/treasure/coin-flip/', emoji: '🪙', group: '休闲玩法' },
	{ icon: Sparkles, title: '今日运势', description: '每天一支专属神签', href: '/treasure/fortune/', emoji: '🎐', group: '休闲玩法' },
	{ icon: Star, title: '塔罗牌', description: '三张牌指引方向', href: '/treasure/tarot/', emoji: '🔮', group: '休闲玩法' },
	{ icon: Gamepad2, title: '小游戏合集', description: '摸鱼也能很快乐', href: '/treasure/games/', emoji: '🎮', group: '休闲玩法' },
	{ icon: Fish, title: '摸鱼日历', description: '节日倒计时 · 每日一言', href: '/treasure/fish-calendar/', emoji: '🐟', group: '休闲玩法' },

	// —— 生活实用 ——
	{ icon: QrCode, title: '二维码生成', description: '文本 · 网址 · WiFi', href: '/treasure/qrcode/', emoji: '🔳', group: '生活实用' },
	{ icon: Truck, title: '快递查询', description: '全网快递轨迹追踪', href: '/treasure/tracking/', emoji: '📦', group: '生活实用' },
	{ icon: Smartphone, title: '手机归属', description: '查归属地和运营商', href: '/treasure/phone-info/', emoji: '📱', group: '生活实用' },
	{ icon: CloudSun, title: '天气与穿衣', description: '实时天气 · 穿衣提示', href: '/treasure/weather/', emoji: '🌤️', group: '生活实用' },
	{ icon: CalendarHeart, title: '倒数日', description: '重要的日子值得期待', href: '/treasure/countdown/', emoji: '⏳', group: '生活实用' },

	// —— 我的花园（原有小工具）——
	{ icon: Timer, title: '番茄钟', description: '专注 25 分钟小神器', href: '/treasure/pomodoro/', emoji: '🍅', group: '我的花园' },
	{ icon: Palette, title: '涂鸦板', description: '随手画画放个假', href: '/treasure/sketch/', emoji: '🎨', group: '我的花园' },
	{ icon: BookOpenText, title: '每日英语', description: '每天一个温柔单词', href: '/treasure/daily-english/', emoji: '📖', group: '我的花园' },
	{ icon: Hourglass, title: '时间胶囊', description: '写给未来的信', href: '/treasure/time-capsule/', emoji: '💌', group: '我的花园' },
	{ icon: Sailboat, title: '漂流瓶', description: '匿名写下心情', href: '/treasure/drift-bottle/', emoji: '🏝️', group: '我的花园' },
	{ icon: Leaf, title: '许愿墙', description: '悄悄许个愿吧', href: '/treasure/wish-wall/', emoji: '🌿', group: '我的花园' },
	{ icon: Clapperboard, title: '今日影视', description: '每日一部好片推荐', href: '/treasure/bangumi/', emoji: '🎬', group: '我的花园' },
	{ icon: History, title: '时间轴', description: '我的成长时间轴', href: '/treasure/timeline/', emoji: '🕰️', group: '我的花园' },
	{ icon: BarChart3, title: '学习打卡', description: '坚持就是胜利', href: '/treasure/checkin/', emoji: '📈', group: '我的花园' },
	{ icon: Wrench, title: '开发者工具箱', description: '格式化 · 转换 · 正则', href: '/treasure/dev-tools/', emoji: '🔧', group: '我的花园' },
	{ icon: Bookmark, title: '书签管理', description: '整理你的收藏', href: '/treasure/bookmarks/', emoji: '🔖', group: '我的花园' },
	{ icon: Network, title: '技能树', description: '可视化你的技能成长', href: '/treasure/skill-tree/', emoji: '🌳', group: '我的花园' },
	{ icon: Telescope, title: '星空地图', description: '仰望同一片星空', href: '/treasure/star-map/', emoji: '🌟', group: '我的花园' },
	{ icon: MessageCircle, title: '弹幕留言', description: '飞一样的评论', href: '/treasure/danmaku/', emoji: '💬', group: '我的花园' },
	{ icon: MessagesSquare, title: '现在在做什么', description: '实时状态', href: '/treasure/now/', emoji: '💭', group: '我的花园' },
	{ icon: ChevronRight, title: '年度报告', description: '回首这一年', href: '/treasure/annual-report/', emoji: '📊', group: '我的花园' },
]
