import fs from "node:fs";
import path from "node:path";
import type { GalleryAlbum, GalleryPhoto } from "@/types/config";
import { url } from "@/utils/url-utils";

function withBase(assetPath: string): string {
	if (!assetPath) return "";
	if (/^(https?:)?\/\//i.test(assetPath) || /^(data|blob):/i.test(assetPath)) {
		return assetPath;
	}
	const normalizedPath = assetPath.startsWith("/")
		? assetPath
		: `/${assetPath}`;
	const base = import.meta.env.BASE_URL || "/";
	if (base !== "/" && normalizedPath.startsWith(base)) {
		return normalizedPath;
	}
	return url(normalizedPath);
}

/**
 * 扫描相册目录中的所有图片文件
 */
export function scanAlbumPhotos(albumId: string): string[] {
	const dir = path.join(process.cwd(), "public", "gallery", albumId);
	if (!fs.existsSync(dir)) return [];
	const files = fs
		.readdirSync(dir)
		.filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f))
		.sort();
	// 将 cover.* 排到第一位
	const coverIdx = files.findIndex((f) => /^cover\./i.test(f));
	if (coverIdx > 0) {
		const [coverFile] = files.splice(coverIdx, 1);
		files.unshift(coverFile);
	}
	const localPhotos = files.map((f) => withBase(`/gallery/${albumId}/${f}`));

	// 读取 urls.txt 中的远程图片 URL
	const urlsFile = path.join(dir, "urls.txt");
	let remotePhotos: string[] = [];
	if (fs.existsSync(urlsFile)) {
		remotePhotos = fs
			.readFileSync(urlsFile, "utf-8")
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith("#"));
	}

	return [...localPhotos, ...remotePhotos];
}

/**
 * 获取相册封面图
 * 优先级：手动指定 > cover.* 文件 > 第一张图片
 */
export function getAlbumCover(album: GalleryAlbum, photos: string[]): string {
	if (album.cover) return withBase(album.cover);
	const coverFile = photos.find((p) => /\/cover\./i.test(p));
	return coverFile || photos[0] || "";
}

/**
 * 读取相册目录下可选的 photos.json 单图元信息。
 * 支持两种写法：
 *   { "cat.webp": { "description": "...", "tags": ["猫"], "date": "2026-09-01" } }
 *   [{ "src": "cat.webp" 或完整 URL, "description": "..." }]
 * 键既可以是文件名，也可以是 urls.txt 里的完整远程地址。
 */
function readPhotoMetaMap(
	albumId: string,
): Map<string, Omit<GalleryPhoto, "src">> {
	const metaFile = path.join(
		process.cwd(),
		"public",
		"gallery",
		albumId,
		"photos.json",
	);
	if (!fs.existsSync(metaFile)) return new Map();
	try {
		const raw = JSON.parse(fs.readFileSync(metaFile, "utf-8"));
		const map = new Map<string, Omit<GalleryPhoto, "src">>();
		if (Array.isArray(raw)) {
			for (const item of raw) {
				if (!item || typeof item !== "object" || !item.src) continue;
				const { src, ...rest } = item;
				map.set(String(src), rest);
			}
		} else if (raw && typeof raw === "object") {
			for (const [key, value] of Object.entries(raw)) {
				if (value && typeof value === "object")
					map.set(key, value as Omit<GalleryPhoto, "src">);
			}
		}
		return map;
	} catch (err) {
		console.warn(`[gallery] 解析 photos.json 失败 (${albumId}):`, err);
		return new Map();
	}
}

/**
 * 扫描相册照片并附带 photos.json 中的描述/日期/标签
 */
export function scanAlbumPhotoItems(albumId: string): GalleryPhoto[] {
	const photos = scanAlbumPhotos(albumId);
	const metaMap = readPhotoMetaMap(albumId);
	return photos.map((src) => {
		const fileName = decodeURIComponent(src.split("/").pop() || "");
		const meta = metaMap.get(fileName) || metaMap.get(src) || {};
		return { src, ...meta };
	});
}
