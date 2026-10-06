import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

/**
 * 移除文件扩展名（.md, .mdx, .markdown）
 * 用于将 Astro v5 Content Layer API 的 id 转换为 URL 友好的 slug
 */
export function removeFileExtension(id: string): string {
	return id.replace(/\.(md|mdx|markdown)$/i, "");
}

export function pathsEqual(path1: string, path2: string): boolean {
	const normalizedPath1 = path1.replace(/^\/|\/$/g, "").toLowerCase();
	const normalizedPath2 = path2.replace(/^\/|\/$/g, "").toLowerCase();
	return normalizedPath1 === normalizedPath2;
}

/**
 * 智能拼接URL，正确处理网络URL和本地路径
 */
function joinUrl(...parts: string[]): string {
	// 如果第一个部分是网络URL，直接返回拼接后的结果（不处理协议头的//）
	if (
		parts[0]?.startsWith("http://") ||
		parts[0]?.startsWith("https://") ||
		parts[0]?.startsWith("//")
	) {
		return parts.join("").replace(/(?<!:)\/+/g, "/");
	}

	// 本地路径正常拼接
	const joined = parts.join("/");
	return joined.replace(/\/+/g, "/");
}

export function getPostUrlBySlug(slug: string): string {
	// 移除文件扩展名（如 .md, .mdx 等）
	const slugWithoutExt = removeFileExtension(slug);
	return url(`/posts/${slugWithoutExt}/`);
}

export function getTagUrl(tag: string): string {
	if (!tag) return url("/archive/");
	return url(`/archive/?tag=${encodeURIComponent(tag.trim())}`);
}

export function getCategoryUrl(category: string | null): string {
	if (
		!category ||
		category.trim() === "" ||
		category.trim().toLowerCase() === i18n(I18nKey.uncategorized).toLowerCase()
	)
		return url("/archive/?uncategorized=true");
	return url(`/archive/?category=${encodeURIComponent(category.trim())}`);
}

export function getDir(path: string): string {
	// 移除文件扩展名
	const pathWithoutExt = removeFileExtension(path);
	const lastSlashIndex = pathWithoutExt.lastIndexOf("/");
	if (lastSlashIndex < 0) {
		return "/";
	}
	return pathWithoutExt.substring(0, lastSlashIndex + 1);
}

export function getFileDirFromPath(filePath: string): string {
	return filePath.replace(/^src\//, "").replace(/\/[^/]+$/, "");
}

/**
 * `import.meta.glob` 用的本地图片匹配模式。
 *
 * ⚠️ 千万不要写成 `"../../**"`：这两个调用点在 `src/pages/posts/` 与
 * `src/pages/api/` 下，往上两级正好是整个 `src/**`，等价于把全站所有
 * `.astro` / `.svelte` / `.tsx` 组件一起拉进构建图。后果是 Astro 会把
 * 全站每个页面的 CSS 都注入到文章页 —— 实测单个文章页 `<head>` 里有
 * 57 个 `<link rel="stylesheet">`（连 /diary/、/tools/、/moments/ 的都在），
 * 体积、请求数、样式重算时间（实测 24s）同时爆炸。
 *
 * 限定图片扩展名即可，glob key 的形态（`../../<path>`）完全不变。
 */
export const LOCAL_IMAGE_GLOB =
	"../../**/*.{png,jpg,jpeg,webp,avif,gif,svg,bmp,ico}";

export function getSearchUrl(query: string): string {
	return url(`/search/?q=${encodeURIComponent(query.trim())}`);
}

export function url(path: string): string {
	// 关键修复：如果是网络URL，直接返回原地址
	if (
		path.startsWith("http://") ||
		path.startsWith("https://") ||
		path.startsWith("//")
	) {
		return path;
	}

	// 只有本地相对路径才添加BASE_URL
	return joinUrl("", import.meta.env.BASE_URL, path);
}
