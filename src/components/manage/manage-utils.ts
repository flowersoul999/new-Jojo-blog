// 内容管理台共享小工具（仅浏览器端 Svelte 管理组件使用）
// 封装 /api/content/* 的调用约定与文件处理杂项，避免各模块重复实现

/** 格式化文件大小：B / KB / MB */
export function formatSize(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** /api/content/list 返回的目录项（仅取用到的字段） */
export interface ApiListEntry {
	name: string;
	path: string;
	type: string;
	sha?: string;
	size?: number;
}

/** /api/content/read 的响应（文本文件 content 为字符串，图片为 base64Content） */
export interface ApiReadResponse {
	path: string;
	content: string | null;
	sha: string;
	name: string;
	encoding?: string;
	base64Content?: string;
}

/**
 * 项目配置 trailingSlash: "always"，API 目录端点必须带尾斜杠，
 * 否则 dev 直接 404（线上可能被重定向丢 query）。这里做统一兜底：
 * 仅处理 /api/ 下、末段不含「.」（非文件）、且未以 / 结尾的相对路径。
 */
function withTrailingSlash(url: string): string {
	if (!url.startsWith("/api/")) return url;
	const q = url.indexOf("?");
	const pathname = q >= 0 ? url.slice(0, q) : url;
	const search = q >= 0 ? url.slice(q) : "";
	if (pathname.endsWith("/")) return url;
	const lastSeg = pathname.split("/").pop() || "";
	if (lastSeg.includes(".")) return url;
	return `${pathname}/${search}`;
}

/** GET JSON，非 2xx 或返回体 ok:false 时抛出中文错误 */
export async function apiGet<T = unknown>(url: string): Promise<T> {
	const res = await fetch(withTrailingSlash(url), {
		credentials: "same-origin",
	});
	const data = (await res.json().catch(() => ({}))) as Record<
		string,
		unknown
	> & { ok?: boolean; error?: string };
	if (!res.ok || data.ok === false) {
		throw new Error(data.error || `请求失败：HTTP ${res.status}`);
	}
	return data as T;
}

/** POST JSON，非 2xx 或返回体 ok:false 时抛出中文错误 */
export async function apiPost<T = unknown>(
	url: string,
	body: unknown,
): Promise<T> {
	const res = await fetch(withTrailingSlash(url), {
		method: "POST",
		credentials: "same-origin",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const data = (await res.json().catch(() => ({}))) as Record<
		string,
		unknown
	> & { ok?: boolean; error?: string };
	if (!res.ok || data.ok === false) {
		throw new Error(data.error || `请求失败：HTTP ${res.status}`);
	}
	return data as T;
}

/** 读取文件为 base64 dataURL（GIF 等不压缩场景使用） */
export function readFileAsDataUrl(file: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error ?? new Error("文件读取失败"));
		reader.readAsDataURL(file);
	});
}

/** 去掉 dataURL 的 `data:xxx;base64,` 前缀，得到纯 base64 */
export function stripDataUrlPrefix(dataUrl: string): string {
	const idx = dataUrl.indexOf(",");
	return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

/** 把标签输入框文本拆成数组（兼容中英文逗号、顿号、空格） */
export function splitTags(text: string): string[] {
	return text
		.split(/[,，、\s]+/)
		.map((t) => t.trim())
		.filter(Boolean);
}

/** 今天的日期 YYYY-MM-DD（本地时区） */
export function todayText(): string {
	const d = new Date();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${d.getFullYear()}-${mm}-${dd}`;
}
