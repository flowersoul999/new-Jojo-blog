// 服务端内容索引工具（仅 API 路由使用，不得在客户端 import）
// - 读 posts/memories 目录文件 → 解析 frontmatter（复用 frontmatter.ts 纯函数）
// - 构建文章列表 + 正文图片引用倒排索引
// - 数据源由调用方注入（本地 fs / GitHub API），本模块保持纯解析逻辑

import {
	type PostMeta,
	buildPostMarkdown,
	defaultPostMeta,
	parsePostMarkdown,
} from "@/components/react-write/frontmatter";

/** 文章列表项（posts-index API 输出结构） */
export interface PostIndexItem {
	slug: string;
	path: string;
	title: string;
	published: string;
	draft: boolean;
	pinned: boolean;
	pinnedOrder: number | null;
	category: string;
	tags: string[];
	updated: string;
	image: string;
}

export interface PostsIndex {
	posts: PostIndexItem[];
	/** 正文图片引用倒排索引：图片 URL（含 /blogs/ 前缀）→ 引用它的文章 slug 列表 */
	imageRefs: Record<string, string[]>;
}

/** 回忆条目（memories-index API 输出结构） */
export interface MemoryIndexItem {
	slug: string;
	path: string;
	title: string;
	date: string;
	summary: string;
	image: string;
	/** 正文（用于编辑回填） */
	body: string;
}

/** 从正文中提取本站图片路径（/blogs/...） */
export function extractImageRefs(body: string): string[] {
	const refs: string[] = [];
	const regex = /\/blogs\/[^)"'\s]+/g;
	let m = regex.exec(body);
	while (m !== null) {
		const u = m[0];
		if (!refs.includes(u)) refs.push(u);
		m = regex.exec(body);
	}
	return refs;
}

export interface FileItemLike {
	path: string;
	name?: string; // 本地 listLocalDirRecursive 无 name 字段，由 path 推导
}

/** 读取文件的回调（由 API 路由注入本地 fs 或 GitHub 实现） */
export type ReadFn = (path: string) => Promise<{ content: string | null }>;

/** 由文件列表构建文章索引 */
export async function buildPostsIndex(
	files: FileItemLike[],
	read: ReadFn,
): Promise<PostsIndex> {
	const posts: PostIndexItem[] = [];
	const imageRefs: Record<string, string[]> = {};

	// 兼容两种文件项格式：带 name 的（GitHub/list.ts 非递归）与只有 path 的（listLocalDirRecursive）
	const fileName = (f: FileItemLike) => f.name || f.path.split("/").pop() || "";
	const mdFiles = files.filter((f) => /\.(md|mdx)$/i.test(fileName(f)));
	for (const file of mdFiles) {
		const slug = fileName(file).replace(/\.(md|mdx)$/i, "");
		try {
			const { content } = await read(file.path);
			if (content == null) continue;
			const { meta, body } = parsePostMarkdown(content);
			posts.push({
				slug,
				path: file.path,
				title: meta.title,
				published: meta.published,
				draft: meta.draft,
				pinned: meta.pinned,
				pinnedOrder:
					meta.pinnedOrder === "" ? null : Number(meta.pinnedOrder) || null,
				category: meta.category,
				tags: meta.tags,
				updated: meta.updated,
				image: meta.image,
			});
			// 图片引用倒排索引：正文 + 封面（frontmatter image）中的 /blogs/ 图片
			// 封面引用对图片模块的「可能被 N 篇引用」徽标同样有效
			const refs = new Set<string>();
			for (const ref of extractImageRefs(body)) refs.add(ref);
			if (/\/blogs\//.test(meta.image)) refs.add(meta.image);
			for (const ref of refs) {
				if (!imageRefs[ref]) imageRefs[ref] = [];
				if (!imageRefs[ref].includes(slug)) imageRefs[ref].push(slug);
			}
		} catch {
			// 单文件解析失败不影响整体
			continue;
		}
	}

	posts.sort((a, b) =>
		a.published === b.published
			? a.slug.localeCompare(b.slug)
			: b.published.localeCompare(a.published),
	);
	return { posts, imageRefs };
}

/** 由文件列表构建回忆索引 */
export async function buildMemoriesIndex(
	files: FileItemLike[],
	read: ReadFn,
): Promise<MemoryIndexItem[]> {
	const entries: MemoryIndexItem[] = [];

	// 兼容两种文件项格式：带 name 的（GitHub/list.ts 非递归）与只有 path 的（listLocalDirRecursive）
	const fileName = (f: FileItemLike) => f.name || f.path.split("/").pop() || "";
	const mdFiles = files.filter((f) => /\.(md|mdx)$/i.test(fileName(f)));
	for (const file of mdFiles) {
		const slug = fileName(file).replace(/\.(md|mdx)$/i, "");
		try {
			const { content } = await read(file.path);
			if (content == null) continue;
			const parsed = parseMemoryMarkdown(content);
			entries.push({ slug, path: file.path, ...parsed });
		} catch {
			continue;
		}
	}

	entries.sort((a, b) => b.date.localeCompare(a.date));
	return entries;
}

/** 解析回忆 frontmatter（title/date/summary/image + 正文） */
export function parseMemoryMarkdown(raw: string): {
	title: string;
	date: string;
	summary: string;
	image: string;
	body: string;
} {
	const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
	if (!fmMatch) {
		return { title: "", date: "", summary: "", image: "", body: raw };
	}
	const fmBlock = fmMatch[1];
	const body = fmMatch[2];
	let title = "";
	let date = "";
	let summary = "";
	let image = "";
	const unquote = (v: string) => v.trim().replace(/^["']|["']$/g, "");
	for (const line of fmBlock.split(/\r?\n/)) {
		const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
		if (!kv) continue;
		const value = unquote(kv[2]);
		switch (kv[1]) {
			case "title":
				title = value;
				break;
			case "date":
				date = value.slice(0, 10);
				break;
			case "summary":
				summary = value;
				break;
			case "image":
				image = value;
				break;
		}
	}
	return { title, date, summary, image, body };
}

/** 生成回忆 Markdown（复用 posts 的 yaml 转义规则，构造完整 frontmatter） */
export function buildMemoryMarkdown(
	meta: { title: string; date: string; summary: string; image: string },
	body: string,
): string {
	const quote = (v: string) =>
		`"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
	const lines = [
		"---",
		`title: ${quote(meta.title)}`,
		`date: ${quote(meta.date)}`,
		`summary: ${quote(meta.summary)}`,
		`image: ${quote(meta.image)}`,
		"---",
		"",
		body.trim(),
		"",
	];
	return lines.join("\n");
}

/** 组装文章 frontmatter（复用 frontmatter.ts 的生成逻辑，供 API 侧校验用） */
export { buildPostMarkdown, defaultPostMeta };
export type { PostMeta };
