// 相册元信息（用户在配置文件中填写）
export type GalleryAlbum = {
	id: string; // URL slug + 目录名，如 "japan-2025"
	name: string; // 相册名称
	description?: string; // 相册描述
	date?: string; // 日期
	location?: string; // 拍摄地点
	tags?: string[]; // 标签（用于首页筛选）
	cover?: string; // 手动指定封面（可选，省略则自动取 cover.* 或第一张）
	password?: string; // 加密密码（非空时启用加密）
	passwordHint?: string; // 密码提示
};

// 单张照片的元信息（来自相册目录下可选的 photos.json）
export type GalleryPhoto = {
	src: string; // 图片地址
	description?: string; // 这张照片的描述（全屏散落模式点击放大后显示在便签上）
	date?: string; // 拍摄日期（不填则回退到相册日期）
	tags?: string[]; // 标签（不填则回退到相册标签）
};

// 相册配置
export type GalleryConfig = {
	albums: GalleryAlbum[];
	columnWidth?: number; // 瀑布流最小列宽(px)，默认 240，浏览器根据容器宽度自动计算列数
};
