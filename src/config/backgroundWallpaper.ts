import type { BackgroundWallpaperConfig } from "@/types/backgroundWallpaper";

const originalWallpaperImages = Array.from(
	{ length: 24 },
	(_, index) =>
		`/assets/images/wallpaper/wallpaper-${String(index + 1).padStart(2, "0")}.webp`,
);

const importedWutheringWavesImages = Array.from(
	{ length: 23 },
	(_, index) =>
		`/assets/images/wallpaper/wallpaper-${String(index + 25).padStart(2, "0")}.webp`,
);

const wutheringWavesWallpaperImages = [
	originalWallpaperImages[0],
	...importedWutheringWavesImages,
];
const otherWallpaperImages = originalWallpaperImages.slice(1);
const desktopWallpaperImages = [
	...wutheringWavesWallpaperImages,
	...otherWallpaperImages,
];

const mobileOnlyWutheringWavesImages = Array.from(
	{ length: 3 },
	(_, index) =>
		`/assets/images/wallpaper/wallpaper-mobile-${String(index + 1).padStart(2, "0")}.webp`,
);
const mobileWallpaperImages = [
	...mobileOnlyWutheringWavesImages,
	...wutheringWavesWallpaperImages,
	...otherWallpaperImages,
];

/**
 * 背景视频总清单 —— 导航栏播放按钮按这个顺序轮播。
 * **数组下标就是 `playerUrl` 的下标**，面板选片、播放器取片都靠它，别随意重排。
 *
 * 命名规范：文件名带日期版本号（CDN 强缓存，同名替换不生效）。
 */
const playerVideos = [
	{ src: "/assets/videos/bg-20260928.mp4" },
	{
		src: "/assets/videos/bg-20261006-wlop.mp4",
		label: "WLOP · Aeolian3",
		poster: "/assets/videos/thumbs/bg-20261006-wlop.webp",
	},
];

/**
 * 显示设置面板「动态壁纸」一栏**只列**这几支 —— 元素是上面 playerVideos 的下标。
 *
 * ⚠️ 下标必须**显式写死**：面板按 index 选中、播放器按同一 index 取片。
 * 曾经用「数组位置」当索引，一旦面板清单是 playerUrl 的子集就会错位，
 * 出现「选了 A 播出来的是 B」。没列进来的片子仍可由导航栏播放按钮轮播到。
 */
const selectableDynamicWallpaperIndices = [1];

export const backgroundWallpaper: BackgroundWallpaperConfig = {
	// 壁纸模式："banner" 横幅壁纸，"fullscreen" 全屏壁纸，"overlay" 全屏透明，"none" 纯色背景无壁纸
	mode: "fullscreen",
	// 是否允许用户通过导航栏切换壁纸模式
	// 且同时维护多种壁纸模式过于复杂（已经屎山代码），在切换时有时候可能会出现一些奇怪的过渡效果或者bug
	// 推荐只选择自己喜欢的模式并关闭切换功能
	switchable: true,
	// 是否启用背景视频播放，配置后将在导航栏显示视频播放按钮
	playerEnable: true,
	/**
	 * 背景图片配置
	 * 图片路径支持三种格式：
	 * 1. public 目录（以 "/" 开头，不优化）："/assets/images/banner.avif"
	 * 2. src 目录（不以 "/" 开头，自动优化但会增加构建时间，推荐）："assets/images/banner.avif"
	 * 3. 远程 URL："https://example.com/banner.jpg"
	 * 注意：远程URL和public目录的图片不会被优化，请确保图片体积足够小以免影响加载速度
	 *
	 * 建议不要替换d1-d6，m1-m6这些默认示例图片，但你可以删除掉节省空间
	 * 因为以后可能会更换示例图片，导致你自定义的图片被覆盖
	 * 所以建议使用自己的图片的时候命名为其他名称，不要使用d1-d6，m1-m6这些名称
	 *
	 * 如果只使用一张图片或者使用随机图API，推荐直接使用字符串格式：
	 * desktop: "https://t.alcy.cc/pc",   // 随机图API
	 * desktop: "assets/images/DesktopWallpaper/d1.webp", // 单张图片
	 *
	 * mobile: "https://t.alcy.cc/mp", // 随机图API
	 * mobile: "assets/images/MobileWallpaper/m1.webp", // 单张图片
	 *
	 * 支持配置多张图片（数组），每次刷新页面随机显示一张：
	 * desktop: [
	 * "assets/images/DesktopWallpaper/d1.webp",
	 * "assets/images/DesktopWallpaper/d2.webp",
	 * ],
	 *
	 * mobile:[
	 *   "assets/images/MobileWallpaper/m1.webp",
	 *   "assets/images/MobileWallpaper/m2.webp",
	 * ],
	 */
	src: {
		// 桌面背景图片（支持单张或多张随机）
		// desktop: "assets/images/DesktopWallpaper/d1.webp",
		desktop: desktopWallpaperImages,
		// 移动背景图片（支持单张或多张随机）
		// mobile: "assets/images/MobileWallpaper/m1.webp",
		mobile: mobileWallpaperImages,
		// 背景视频播放地址（由文件顶部的 playerVideos 派生，勿在此单独增删）
		// 支持远程视频URL，本地视频请放在 public/assets/videos/ 目录下
		// bg-20260928：720p 带音轨，42MB / 248s（导航栏播放按钮可轮播到，但不在面板可选清单里）
		// bg-20261006-wlop：720p 带音轨，19MB / 174s（由 1080p / 214MB 源片重压而来）
		// 未选中动态壁纸时**不随页面加载预加载**，只有点导航栏播放按钮才按需拉取，因此体积不影响首屏；
		// 一旦访客在显示设置面板里选中了某支，它就等同于壁纸，会随页面加载自动静音起播。
		playerUrl: playerVideos.map((item) => item.src),
		// 面板可选的动态壁纸清单：index 指回 playerUrl 的下标，必须是显式的
		playerItems: selectableDynamicWallpaperIndices.map((index) => ({
			...playerVideos[index],
			index,
		})),
	},
	// 横幅壁纸和全屏壁纸共享配置
	common: {
		// 壁纸遮罩暗度，让横幅文字显示更清晰，0-1之间，值越大越暗
		dimOpacity: 0.2,
		// 多视频播放模式："order" 顺序循环，"random" 随机切换（仅当 playerUrl 为数组时生效）
		playerMode: "random",
		// 主页横幅文字
		homeText: {
			// 是否启用主页横幅文字
			enable: true,
			// 是否允许用户通过控制面板切换横幅标题显示
			switchable: true,
			// 主页横幅主标题
			title: "物物而不物于物，念念而不念于念；",
			// 主页横幅主标题字体大小
			titleSize: "3.8rem",
			// 主页横幅副标题
			subtitle: [
				"把重复交给脚本，把思考留给自己。",
				"工具负责提速，判断与创造仍然属于人。",
				"在每一次调试里，把复杂留给代码，把从容还给生活。",
				"记录解决问题的过程，也收藏一路生长的痕迹。",
				"自动化不是替代双手，而是为真正重要的事腾出时间。",
				"让 AI 参与工作，把真实的感受留在文字里。",
			],
			// 主页横幅副标题字体大小
			subtitleSize: "1.5rem",
			typewriter: {
				// 是否启用打字机效果
				// 打字机开启 → 循环显示所有副标题
				// 打字机关闭 → 每次刷新随机显示一条副标题
				enable: true,
				// 打字速度（毫秒）
				speed: 100,
				// 删除速度（毫秒）
				deleteSpeed: 50,
				// 完全显示后的暂停时间（毫秒）
				pauseTime: 2000,
			},
		},
		// 导航栏配置
		navbar: {
			// 导航栏透明模式："semi" 半透明，"full" 完全透明，"semifull" 动态透明
			transparentMode: "semifull",
			// 是否开启毛玻璃模糊效果，开启可能会影响页面性能，如果不开启则是半透明，请根据自己的喜好开启
			enableBlur: true,
			// 毛玻璃模糊度
			blur: 5,
		},
		// 水波纹动画效果配置，开启会影响页面性能，请根据自己的喜好开启
		waves: {
			enable: {
				// 桌面端是否启用水波纹动画效果
				desktop: true,
				// 移动端是否启用水波纹动画效果
				mobile: true,
			},
			// 是否允许用户通过控制面板切换水波纹动画
			switchable: true,
		},
		// 渐变过渡效果配置，当水波纹关闭时自动启用，提供壁纸底部到背景色的平滑过渡
		gradient: {
			enable: {
				// 桌面端是否启用渐变过渡
				desktop: true,
				// 移动端是否启用渐变过渡
				mobile: true,
			},
			// 渐变高度
			height: "10%",
			// 是否允许用户通过控制面板切换渐变过渡
			switchable: true,
		},
		// 壁纸轮播配置，横幅壁纸和全屏壁纸共享，仅在配置多张图片时生效
		carousel: {
			// 是否启用壁纸轮播；关闭时保持每次刷新随机显示一张
			enable: true,
			// 轮播切换间隔（毫秒）
			interval: 5000,
			// 过渡效果: 'fade' 渐变 | 'zoom' 缩放 | 'slide' 滑动 | 'kenburns' 旋转木马
			transitionEffect: "zoom",
			// 是否允许用户通过控制面板切换壁纸轮播
			switchable: true,
		},
	},
	// Banner模式特有配置
	banner: {
		// 图片位置
		// 支持所有CSS object-position值，如: 'top', 'center', 'bottom', 'left top', 'right bottom', '25% 75%', '10px 20px'..
		// 如果不知道怎么配置百分百之类的配置，推荐直接使用：'center'居中，'top'顶部居中，'bottom' 底部居中，'left'左侧居中，'right'右侧居中
		position: "0% 20%",
	},
	// 全屏透明覆盖模式特有配置
	overlay: {
		// 是否允许用户通过控制面板调整全屏透明模式参数
		switchable: {
			opacity: true,
			blur: true,
			cardOpacity: true,
		},
		// 层级，确保壁纸在背景层
		zIndex: -1,
		// 壁纸透明度
		opacity: 0.8,
		// 背景模糊度
		blur: 10,
		// 卡片透明度，0-1之间，值越小越透明
		cardOpacity: 0.5,
	},
	// 全屏壁纸模式特有配置
	fullscreen: {
		// 图片位置
		position: "center",
	},
};
