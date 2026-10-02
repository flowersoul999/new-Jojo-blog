import type { APIRoute } from "astro";
import { galleryConfig } from "@/config/galleryConfig";
import {
	GITHUB_REPO,
	isLocalDev,
	listLocalDir,
	requireAuth,
} from "@/utils/editor-auth";

export const prerender = false;

// ---------------------------------------------------------------------------
// GET /api/gallery/index/
// 返回相册列表（含每册照片数），供相册管理模块使用：
//   { "albums": [{ id, name, description, date, location, tags,
//                  password, passwordHint, cover, photoCount }] }
// 元信息来自 src/config/galleryConfig.ts，photoCount 实时数 public/gallery/{id}/ 下图片。
// ---------------------------------------------------------------------------

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

/** 统计相册目录下的图片数量（本地 fs 或 GitHub Contents API） */
async function countAlbumPhotos(
	token: string,
	albumId: string,
): Promise<number> {
	if (isLocalDev) {
		const items = listLocalDir(`public/gallery/${albumId}`);
		return items.filter(
			(item) => item.type === "file" && IMAGE_EXT.test(item.name),
		).length;
	}

	const { owner, name, branch } = GITHUB_REPO;
	const response = await fetch(
		`https://api.github.com/repos/${owner}/${name}/contents/public/gallery/${albumId}?ref=${branch}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github+json",
				"User-Agent": "Aemeath-Blog",
			},
		},
	);
	if (!response.ok) return 0;
	const data = await response.json();
	if (!Array.isArray(data)) return 0;
	return data.filter(
		(item) => item.type === "file" && IMAGE_EXT.test(item.name),
	).length;
}

export const GET: APIRoute = async ({ cookies }) => {
	// 认证检查
	let token: string;
	try {
		token = requireAuth(cookies);
	} catch (error) {
		const message = error instanceof Error ? error.message : "认证失败";
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const albums: Array<{
			id: string;
			name: string;
			description: string;
			date: string;
			location: string;
			tags: string[];
			password: string;
			passwordHint: string;
			cover: string;
			photoCount: number;
		}> = [];
		for (const album of galleryConfig.albums) {
			const photoCount = await countAlbumPhotos(token, album.id);
			albums.push({
				id: album.id,
				name: album.name,
				description: album.description ?? "",
				date: album.date ?? "",
				location: album.location ?? "",
				tags: album.tags ?? [],
				password: album.password ?? "",
				passwordHint: album.passwordHint ?? "",
				cover: album.cover ?? "",
				photoCount,
			});
		}
		return new Response(JSON.stringify({ albums }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "未知错误";
		return new Response(JSON.stringify({ ok: false, error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
