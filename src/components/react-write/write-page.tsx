"use client";

// 图片压缩工具（算法与质量参数和 jojo-blog 完全一致：WebP 0.8）
import { compressImage } from "@utils/image-compress";
import {
	Eye,
	FileUp,
	FolderOpen,
	Loader2,
	Plus,
	Save,
	Send,
	Trash2,
	X,
} from "lucide-react";
// 线上发文编辑器（UI 迁移自 jojoblog /write，存储适配 Aemeath）
// - 文章：src/content/posts/{slug}.md（Astro content collection，frontmatter 由表单生成）
// - 图片：public/blogs/{slug}/{hash}.ext，正文以 /blogs/{slug}/x.png 引用
// - 读写全部走站点 /api/content/* 端点（本地 DEV 直接写文件，线上经 GitHub Contents API）
import { type ReactElement, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	buildPostMarkdown,
	defaultPostMeta,
	parsePostMarkdown,
} from "./frontmatter";

// ---------- 类型 ----------

type GithubUser = { login: string; avatar_url: string; name: string | null };

type ImageItem =
	| { id: string; type: "url"; url: string }
	| {
			id: string;
			type: "file";
			filename: string; // 压缩后的文件名（扩展名为 .webp）
			dataUrl: string; // 压缩后的 WebP dataURL（同时用作预览与上传）
			width: number; // 压缩后宽度
			height: number; // 压缩后高度
			size: number; // 压缩后字节数
			hash?: string; // 原始文件 SHA-256，用于会话内去重与幂等上传
	  };

type PostForm = {
	slug: string;
	title: string;
	md: string;
	tags: string[];
	date: string;
	description: string;
	category: string;
	draft: boolean;
};

type PostListItem = { name: string; path: string; type: "file" | "dir" };

type Draft = {
	id: string;
	savedAt: number;
	form: PostForm;
	coverUrl: string;
};

// 发布任务快照：本地 DEV 下写入 src/content 或 public 会触发 Vite 全量刷新，
// 导致进行中的 fetch 被页面 reload 中断（服务端其实已写成功）。
// 任务持久化到 sessionStorage，刷新后自动续跑（图片按 hash 幂等上传）。
type JobImage =
	| { id: string; kind: "url"; url: string }
	| {
			id: string;
			kind: "file";
			hash: string;
			ext: string;
			publicPath: string;
			confirmed: boolean;
	  };

type PublishJob = {
	slug: string;
	action: "create" | "edit";
	title: string;
	md: string;
	tags: string[];
	date: string;
	description: string;
	category: string;
	draft: boolean;
	images: JobImage[];
	cover: JobImage | null;
	startedAt: number;
};

const JOB_KEY = "aemeath-write-publish-job";
const DRAFTS_KEY = "aemeath-write-drafts";

// 图片压缩质量（与 jojo-blog 的 diary-image-uploader 保持一致：WebP 80%）
const IMAGE_QUALITY = 0.8;
// 单张图片大小上限：超过则拒绝。防止超大图在解码/压缩时拖垮浏览器内存，
// 也避免上传超出 GitHub Contents API 的 base64 体积限制
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;

// ---------- 工具 ----------

function todayDate(): string {
	const d = new Date();
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function emptyForm(): PostForm {
	return {
		slug: "",
		title: "",
		md: "",
		tags: [],
		date: todayDate(),
		description: "",
		category: "",
		draft: false,
	};
}

async function sha256Hex(data: Blob): Promise<string> {
	const buffer = await data.arrayBuffer();
	const digest = await crypto.subtle.digest("SHA-256", buffer);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/** 人类可读的文件大小（B / KB / MB） */
function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function slugify(name: string): string {
	return (
		name
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
			.replace(/^-+|-+$/g, "") || `post-${Date.now()}`
	);
}

// marked 由 CDN 懒加载（与主站内容编辑器一致）
let markedReady: Promise<void> | null = null;
function loadMarked(): Promise<void> {
	if (markedReady) return markedReady;
	markedReady = new Promise((resolve) => {
		if (typeof (window as any).marked !== "undefined") {
			resolve();
			return;
		}
		const script = document.createElement("script");
		script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
		script.onload = () => resolve();
		script.onerror = () => resolve();
		document.head.appendChild(script);
	});
	return markedReady;
}

// ---------- 小组件 ----------

function TagInput({
	tags,
	onChange,
}: {
	tags: string[];
	onChange: (v: string[]) => void;
}): ReactElement {
	const [value, setValue] = useState("");
	const add = () => {
		const v = value.trim();
		if (v && !tags.includes(v)) onChange([...tags, v]);
		setValue("");
	};
	return (
		<div className="bg-card w-full rounded-lg border px-3 py-2">
			{tags.length > 0 && (
				<div className="mb-2 flex flex-wrap gap-2">
					{tags.map((tag, i) => (
						<span
							key={tag}
							className="flex items-center gap-1.5 rounded-md bg-brand/15 px-2 py-0.5 text-xs text-brand"
						>
							#{tag}
							<button
								type="button"
								onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
							>
								×
							</button>
						</span>
					))}
				</div>
			)}
			<input
				type="text"
				placeholder="添加标签（按回车）"
				className="w-full bg-transparent text-sm outline-none"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						add();
					}
				}}
			/>
		</div>
	);
}

// ---------- 主组件 ----------

export default function WritePage(): ReactElement {
	// 认证
	const [authState, setAuthState] = useState<"checking" | "anon" | "authed">(
		"checking",
	);
	const [, setUser] = useState<GithubUser | null>(null);

	// 模式与表单
	const [mode, setMode] = useState<"create" | "edit">("create");
	const [originalSlug, setOriginalSlug] = useState<string | null>(null);
	const [form, setForm] = useState<PostForm>(emptyForm());
	const [images, setImages] = useState<ImageItem[]>([]);
	const [cover, setCover] = useState<ImageItem | null>(null);

	// 文章列表
	const [postList, setPostList] = useState<PostListItem[]>([]);
	const [selectedPost, setSelectedPost] = useState("");

	// UI 状态
	const [publishing, setPublishing] = useState(false);
	// 图片压缩进度：index 当前文件序号，total 本次总文件数，name 当前文件名
	const [processing, setProcessing] = useState<{
		index: number;
		total: number;
		name: string;
	} | null>(null);
	// 发布上传进度：done 已完成张数，total 待处理张数，label 阶段文案
	const [publishProgress, setPublishProgress] = useState<{
		done: number;
		total: number;
		label: string;
	} | null>(null);
	// 拖拽高亮目标（cover=封面区，grid=图片网格）
	const [dragTarget, setDragTarget] = useState<"none" | "cover" | "grid">(
		"none",
	);
	const dragCountRef = useRef(0);
	const [previewHtml, setPreviewHtml] = useState<string | null>(null);
	const [showDrafts, setShowDrafts] = useState(false);
	const [drafts, setDrafts] = useState<Draft[]>([]);
	const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const mdFileRef = useRef<HTMLInputElement>(null);
	const coverFileRef = useRef<HTMLInputElement>(null);
	const imagesFileRef = useRef<HTMLInputElement>(null);
	const [urlInput, setUrlInput] = useState("");

	const update = (patch: Partial<PostForm>) =>
		setForm((f) => ({ ...f, ...patch }));
	const coverPreview = cover
		? cover.type === "url"
			? cover.url
			: cover.dataUrl
		: "";

	// ---------- 初始化：认证 + 文章列表 + 草稿 ----------
	// 仅在挂载时执行一次：runJob/hydrateFromJob 每次渲染都会重建，加入依赖会导致重复请求
	// biome-ignore lint/correctness/useExhaustiveDependencies: 仅挂载执行一次，runJob/hydrateFromJob 每次渲染重建，加入依赖会导致重复请求
	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/auth/status/", {
					credentials: "same-origin",
				});
				const data = await res.json();
				if (data.authenticated) {
					setAuthState("authed");
					setUser(data.user || null);
					const listRes = await fetch(
						"/api/content/list/?path=src/content/posts",
					);
					if (listRes.ok) {
						const list = (await listRes.json()) as PostListItem[];
						setPostList(
							list.filter(
								(item) =>
									item.type === "file" && /\.(md|mdx)$/i.test(item.name),
							),
						);
					}
					// dev 下写文件触发的全量刷新可能打断发布：有快照就自动续跑
					try {
						const jobRaw = sessionStorage.getItem(JOB_KEY);
						if (jobRaw) {
							const pendingJob = JSON.parse(jobRaw) as PublishJob;
							hydrateFromJob(pendingJob);
							toast.info("检测到未完成的发布，正在自动续跑…");
							void runJob(pendingJob, new Map());
						}
					} catch {
						sessionStorage.removeItem(JOB_KEY);
					}
				} else {
					setAuthState("anon");
				}
			} catch {
				setAuthState("anon");
			}
			try {
				const raw = localStorage.getItem(DRAFTS_KEY);
				if (raw) setDrafts(JSON.parse(raw) as Draft[]);
			} catch {
				/* ignore */
			}
		})();
	}, []);

	// ---------- 图片处理 ----------
	// 拖拽高亮辅助：dragenter/dragleave 用计数器避免在子元素间移动时高亮闪烁
	const makeDropHandlers = (
		target: "cover" | "grid",
		onDrop?: (e: React.DragEvent<HTMLElement>) => void,
	) => ({
		onDragEnter: (e: React.DragEvent<HTMLElement>) => {
			e.preventDefault();
			dragCountRef.current += 1;
			setDragTarget(target);
		},
		onDragOver: (e: React.DragEvent<HTMLElement>) => e.preventDefault(),
		onDragLeave: (e: React.DragEvent<HTMLElement>) => {
			e.preventDefault();
			dragCountRef.current = Math.max(0, dragCountRef.current - 1);
			if (dragCountRef.current === 0) setDragTarget("none");
		},
		onDrop: (e: React.DragEvent<HTMLElement>) => {
			e.preventDefault();
			dragCountRef.current = 0;
			setDragTarget("none");
			onDrop?.(e);
		},
	});

	// 添加图片：统一入口（点击选择 / 拖拽 / 粘贴都走这里）
	// 图片先按 jojo-blog 的算法压缩为 WebP（quality 0.8），再进入图片列表；
	// 压缩失败 / 超限 / 非图片文件会被拦截并提示，不影响其它图片继续处理
	const addFiles = async (files: FileList | File[]): Promise<ImageItem[]> => {
		const arr = Array.from(files);
		const imageFiles = arr.filter((f) => f.type.startsWith("image/"));
		const skippedNotImage = arr.length - imageFiles.length;
		if (skippedNotImage > 0) {
			toast.warning(`${skippedNotImage} 个文件不是图片，已自动忽略`);
		}
		if (imageFiles.length === 0) return [];

		// 与当前会话中已添加的图片按原始文件 hash 去重
		const existingHashes = new Set(
			images
				.filter(
					(it): it is Extract<ImageItem, { type: "file" }> =>
						it.type === "file" && !!it.hash,
				)
				.map((it) => it.hash),
		);
		const seen = new Set<string>();

		const newItems: ImageItem[] = [];
		let failed = 0;
		let duplicate = 0;
		for (let i = 0; i < imageFiles.length; i++) {
			const file = imageFiles[i];

			// 超大图直接拒绝，避免解码/压缩时内存溢出
			if (file.size > MAX_IMAGE_SIZE) {
				toast.error(
					`${file.name} 超过大小上限（${formatSize(MAX_IMAGE_SIZE)}），已跳过`,
				);
				failed++;
				continue;
			}

			let hash = "";
			try {
				hash = await sha256Hex(file);
			} catch {
				toast.error(`${file.name} 读取失败，已跳过`);
				failed++;
				continue;
			}
			if (existingHashes.has(hash) || seen.has(hash)) {
				duplicate++;
				continue;
			}
			seen.add(hash);

			// 压缩进度提示
			setProcessing({
				index: newItems.length + failed + duplicate + 1,
				total: imageFiles.length,
				name: file.name,
			});
			try {
				const { dataUrl, width, height, size } = await compressImage(file, {
					quality: IMAGE_QUALITY,
				});
				newItems.push({
					id: Math.random().toString(36).slice(2, 10),
					type: "file",
					filename: file.name.replace(/\.[^.]+$/, ".webp"),
					dataUrl,
					width,
					height,
					size,
					hash,
				});
			} catch (err) {
				console.error("图片压缩失败:", file.name, err);
				toast.error(
					`${file.name} 压缩失败（${formatSize(file.size)}），已跳过`,
				);
				failed++;
			}
		}
		setProcessing(null);

		if (duplicate > 0) toast.info(`${duplicate} 张图片已存在，不重复添加`);
		if (newItems.length > 0) {
			setImages((prev) => [...newItems, ...prev]);
			toast.success(`已添加 ${newItems.length} 张图片（已自动压缩为 WebP）`);
		}
		return newItems;
	};

	const addUrlImage = () => {
		const url = urlInput.trim();
		if (!url) return;
		if (images.some((it) => it.type === "url" && it.url === url)) {
			toast.info("该图片已在列表中");
			return;
		}
		setImages((prev) => [
			{ id: Math.random().toString(36).slice(2, 10), type: "url", url },
			...prev,
		]);
		setUrlInput("");
	};

	const deleteImage = (id: string) => {
		setImages((prev) => prev.filter((it) => it.id !== id));
		setCover((c) => (c?.id === id ? null : c));
	};

	const insertMarkdown = (text: string) => {
		const ta = textareaRef.current;
		if (!ta) {
			update({ md: form.md + text });
			return;
		}
		ta.focus();
		const { selectionStart, selectionEnd, value } = ta;
		const next =
			value.slice(0, selectionStart) + text + value.slice(selectionEnd);
		update({ md: next });
		requestAnimationFrame(() => {
			ta.setSelectionRange(
				selectionStart + text.length,
				selectionStart + text.length,
			);
			ta.focus();
		});
	};

	// ---------- 编辑器快捷键 / 粘贴图片（移植自 jojo）----------
	const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		const ta = textareaRef.current;
		if (!ta) return;
		const { selectionStart, selectionEnd, value } = ta;
		const selected = value.substring(selectionStart, selectionEnd);

		if ((e.ctrlKey || e.metaKey) && e.key === "b") {
			e.preventDefault();
			insertMarkdown(`**${selected || "文字"}**`);
			return;
		}
		if ((e.ctrlKey || e.metaKey) && e.key === "i") {
			e.preventDefault();
			insertMarkdown(`*${selected || "文字"}*`);
			return;
		}
		if ((e.ctrlKey || e.metaKey) && e.key === "k") {
			e.preventDefault();
			insertMarkdown(`[${selected || "文字"}](url)`);
			return;
		}
		if (e.key === "Tab") {
			e.preventDefault();
			insertMarkdown(e.shiftKey ? "" : "\t");
		}
	};

	const onPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
		const files: File[] = [];
		for (const item of Array.from(e.clipboardData.items)) {
			if (item.type.startsWith("image/")) {
				const file = item.getAsFile();
				if (file) files.push(file);
			}
		}
		if (files.length === 0) return;
		e.preventDefault();
		const added = await addFiles(files);
		const md = added
			.map((it) =>
				it.type === "url" ? `![](${it.url})` : `![](local-image:${it.id})`,
			)
			.join("\n");
		if (md) insertMarkdown(md);
	};

	// ---------- 加载已有文章 ----------
	const loadPost = async (filePath: string) => {
		if (!filePath) return;
		if (
			form.md &&
			!window.confirm("当前内容尚未发布，确定切换文章吗？未保存内容将丢失。")
		) {
			setSelectedPost("");
			return;
		}
		try {
			const res = await fetch(
				`/api/content/read/?path=${encodeURIComponent(filePath)}`,
			);
			if (!res.ok) throw new Error((await res.json()).error || "读取失败");
			const data = await res.json();
			const raw: string = data.content ?? "";
			const { meta, body } = parsePostMarkdown(raw);

			// 解析正文里已有的网络图/本站图
			const urlImages: ImageItem[] = [];
			const imgRegex = /!\[.*?\]\(([^)]+)\)/g;
			let m = imgRegex.exec(body);
			while (m !== null) {
				const u = m[1];
				if (
					u &&
					!u.startsWith("local-image:") &&
					!urlImages.some((it) => it.type === "url" && it.url === u)
				) {
					urlImages.push({
						id: Math.random().toString(36).slice(2, 10),
						type: "url",
						url: u,
					});
				}
				m = imgRegex.exec(body);
			}

			const slug =
				filePath
					.split("/")
					.pop()
					?.replace(/\.(md|mdx)$/i, "") || "";
			setMode("edit");
			setOriginalSlug(slug);
			setImages(urlImages);
			setCover(
				meta.image ? { id: "cover", type: "url", url: meta.image } : null,
			);
			setForm({
				slug,
				title: meta.title,
				md: body,
				tags: meta.tags,
				date: meta.published || todayDate(),
				description: meta.description,
				category: meta.category,
				draft: meta.draft,
			});
			setPublishedUrl(null);
			toast.success("文章已载入编辑器");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "加载失败");
			setSelectedPost("");
		}
	};

	const resetToCreate = () => {
		setMode("create");
		setOriginalSlug(null);
		setForm(emptyForm());
		setImages([]);
		setCover(null);
		setSelectedPost("");
		setPublishedUrl(null);
	};

	// ---------- 草稿箱 ----------
	const saveDraft = () => {
		if (!form.title.trim() && !form.slug.trim()) {
			toast.error("请先填写标题或 slug 再存草稿");
			return;
		}
		const draft: Draft = {
			id: `${Date.now()}`,
			savedAt: Date.now(),
			form,
			coverUrl: cover?.type === "url" ? cover.url : "",
		};
		const next = [
			draft,
			...drafts.filter((d) => d.form.slug !== form.slug),
		].slice(0, 20);
		setDrafts(next);
		localStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
		toast.success("草稿已存入本地浏览器");
	};

	const loadDraft = (draft: Draft) => {
		setMode("create");
		setOriginalSlug(null);
		setSelectedPost("");
		setForm(draft.form);
		setImages([]);
		setCover(
			draft.coverUrl ? { id: "cover", type: "url", url: draft.coverUrl } : null,
		);
		setShowDrafts(false);
		toast.success("草稿已载入");
	};

	const deleteDraft = (id: string) => {
		const next = drafts.filter((d) => d.id !== id);
		setDrafts(next);
		localStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
	};

	// ---------- 发布（任务快照，可跨 dev 全量刷新续跑）----------

	const fileExt = (filename: string): string =>
		(filename.match(/\.[^.]+$/)?.[0] || ".png").toLowerCase();

	const headExists = async (url: string): Promise<boolean> => {
		try {
			const res = await fetch(url, { method: "HEAD" });
			return res.ok;
		} catch {
			return false;
		}
	};

	// 用任务快照回填编辑器（续跑 / 发布成功后保持界面一致）
	const hydrateFromJob = (job: PublishJob) => {
		setMode(job.action === "edit" ? "edit" : "create");
		if (job.action === "edit") setOriginalSlug(job.slug);
		setForm({
			slug: job.slug,
			title: job.title,
			md: job.md,
			tags: job.tags,
			date: job.date,
			description: job.description,
			category: job.category,
			draft: job.draft,
		});
		const toUrlItem = (img: JobImage): ImageItem =>
			img.kind === "url"
				? { id: img.id, type: "url", url: img.url }
				: { id: img.id, type: "url", url: img.publicPath };
		setImages(job.images.map(toUrlItem));
		setCover(job.cover ? toUrlItem(job.cover) : null);
	};

	const runJob = async (job: PublishJob, liveFiles: Map<string, string>) => {
		setPublishing(true);
		try {
			// 1. 图片：快照已确认 / 目标 URL 已存在则跳过；否则用本次会话里的压缩 dataURL 上传
			const all: JobImage[] = [
				...job.images,
				...(job.cover ? [job.cover] : []),
			];
			const fileJobs = all.filter((img) => img.kind === "file");
			setPublishProgress({
				done: 0,
				total: fileJobs.length,
				label: "正在上传图片…",
			});
			const handled = new Set<string>();
			for (const img of all) {
				if (img.kind === "url" || handled.has(img.id)) continue;
				handled.add(img.id);
				if (!img.confirmed) {
					const exists = await headExists(img.publicPath);
					if (exists) {
						img.confirmed = true;
					} else {
						const dataUrl = liveFiles.get(img.id);
						if (!dataUrl) {
							throw new Error(
								"页面已刷新且部分图片尚未上传，请重新添加图片后再发布",
							);
						}
						const filename = `${img.hash}${img.ext}`;
						toast.info(`上传图片 ${filename.slice(0, 12)}…`);
						const res = await fetch("/api/content/write/", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								path: `public/blogs/${job.slug}/${filename}`,
								content: dataUrl.split(",")[1] || "",
								encoding: "base64",
								message: `Upload image ${filename}`,
							}),
						});
						if (!res.ok)
							throw new Error(
								(await res.json()).error || `图片上传失败：${filename}`,
							);
						img.confirmed = true;
					}
					// 写入后 dev 可能立刻全量刷新，尽快落盘快照
					sessionStorage.setItem(JOB_KEY, JSON.stringify({ ...job }));
				}
				setPublishProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
			}

			// 2. 正文占位符替换为最终路径
			let bodyMd = job.md;
			for (const img of all) {
				if (img.kind === "file") {
					bodyMd = bodyMd
						.split(`(local-image:${img.id})`)
						.join(`(${img.publicPath})`);
				}
			}
			bodyMd = bodyMd.replace(/\(local-image:[^)]+\)/g, "()");
			const coverPath = job.cover
				? job.cover.kind === "url"
					? job.cover.url
					: job.cover.publicPath
				: "";

			// 3. 组装 frontmatter + 正文（高级字段由 defaultPostMeta 默认值补齐，Phase 3 开放编辑）
			const fullMd = buildPostMarkdown(
				{
					...defaultPostMeta(),
					title: job.title.trim(),
					published: job.date,
					description: job.description,
					tags: job.tags,
					category: job.category,
					draft: job.draft,
					image: coverPath,
				},
				bodyMd,
			);

			// 4. 远端内容已一致（刷新续跑）就视为完成，否则写入文章文件
			const postPath = `src/content/posts/${job.slug}.md`;
			let remote = "";
			try {
				const readRes = await fetch(
					`/api/content/read/?path=${encodeURIComponent(postPath)}`,
				);
				if (readRes.ok) {
					const data = await readRes.json();
					remote = String(data.content ?? "").replace(/\r\n/g, "\n");
				}
			} catch {
				/* 读取失败则按新写入处理 */
			}
			if (remote !== fullMd.replace(/\r\n/g, "\n")) {
				setPublishProgress({
					done: 0,
					total: 1,
					label: job.action === "edit" ? "正在更新文章…" : "正在发布文章…",
				});
				toast.info(job.action === "edit" ? "正在更新文章…" : "正在发布文章…");
				const res = await fetch("/api/content/write/", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						path: postPath,
						content: fullMd,
						message: `${job.action === "edit" ? "更新文章" : "新增文章"}: ${job.slug}`,
					}),
				});
				if (!res.ok) throw new Error((await res.json()).error || "保存失败");
			}

			// 5. 成功（dev 下若页面被刷新，续跑会从远端一致性检查走到这里）
			sessionStorage.removeItem(JOB_KEY);
			hydrateFromJob({ ...job, md: bodyMd });
			setPublishedUrl(`/posts/${job.slug}/`);
			toast.success(job.action === "edit" ? "文章已更新！" : "文章发布成功！");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "发布失败");
		} finally {
			setPublishing(false);
			setPublishProgress(null);
		}
	};

	const publish = async () => {
		if (!form.title.trim()) return toast.error("请填写标题");
		const slug = form.slug.trim() || slugify(form.title);
		if (mode === "edit" && originalSlug && originalSlug !== slug) {
			return toast.error("编辑模式下不支持修改 slug，请保持原 slug");
		}
		if (!form.md.trim()) return toast.error("正文不能为空");

		const toJobImage = (it: ImageItem): JobImage =>
			it.type === "url"
				? { id: it.id, kind: "url", url: it.url }
				: {
						id: it.id,
						kind: "file",
						hash: it.hash || "",
						ext: fileExt(it.filename),
						publicPath: `/blogs/${slug}/${it.hash || ""}${fileExt(it.filename)}`,
						confirmed: false,
					};
		const jobImages: JobImage[] = images.map(toJobImage);
		const jobCover: JobImage | null = cover ? toJobImage(cover) : null;

		// 正文引用了但图片列表里已不存在的占位符无法上传，提前拦截
		for (const match of form.md.matchAll(/local-image:([^)]+)/g)) {
			if (!images.some((it) => it.id === match[1])) {
				return toast.error("存在已失效的粘贴图片，请删除对应占位符后重新粘贴");
			}
		}
		if (
			[...jobImages, ...(jobCover ? [jobCover] : [])].some(
				(i) => i.kind === "file" && !i.hash,
			)
		) {
			return toast.error("部分图片尚未完成处理，请稍后重试");
		}

		const job: PublishJob = {
			slug,
			action: mode,
			title: form.title.trim(),
			md: form.md,
			tags: form.tags,
			date: form.date,
			description: form.description,
			category: form.category,
			draft: form.draft,
			images: jobImages,
			cover: jobCover,
			startedAt: Date.now(),
		};
		sessionStorage.setItem(JOB_KEY, JSON.stringify(job));

		// 本次会话内的压缩 dataURL 引用（刷新后丢失，届时依赖 HEAD 检查跳过已传图片）
		const liveFiles = new Map<string, string>();
		for (const it of [...images, ...(cover ? [cover] : [])]) {
			if (it.type === "file") liveFiles.set(it.id, it.dataUrl);
		}
		await runJob(job, liveFiles);
	};

	const removePost = async () => {
		const target = originalSlug || form.slug;
		if (!target) return toast.error("缺少 slug，无法删除");
		if (
			!window.confirm(`确定删除《${form.title || target}》吗？此操作不可恢复。`)
		)
			return;
		try {
			const res = await fetch("/api/content/delete/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path: `src/content/posts/${target}.md` }),
			});
			if (!res.ok) throw new Error((await res.json()).error || "删除失败");
			toast.success("文章已删除");
			resetToCreate();
			setPostList((prev) => prev.filter((p) => p.name !== `${target}.md`));
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "删除失败");
		}
	};

	const openPreview = async () => {
		await loadMarked();
		const marked = (window as any).marked;
		const html = marked ? marked.parse(form.md) : `<pre>${form.md}</pre>`;
		setPreviewHtml(String(html));
	};

	const importMdFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const text = await file.text();
		const { meta, body } = parsePostMarkdown(text);
		update({
			title: meta.title || file.name.replace(/\.mdx?$/i, ""),
			md: body,
		});
		if (!form.slug)
			update({ slug: slugify(file.name.replace(/\.mdx?$/i, "")) });
		toast.success("已导入 Markdown 文件");
		e.target.value = "";
	};

	// ---------- 渲染：认证守卫 ----------
	if (authState === "checking") {
		return (
			<div className="treasure-root flex min-h-screen items-center justify-center">
				<Loader2 className="h-5 w-5 animate-spin text-brand" />
				<span className="ml-2 text-sm text-secondary">加载中…</span>
			</div>
		);
	}

	if (authState === "anon") {
		return (
			<div className="treasure-root flex min-h-screen items-center justify-center px-4">
				<div className="card w-full max-w-md p-8 text-center">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
						<Send className="h-6 w-6 text-brand" />
					</div>
					<h1 className="text-lg font-bold">登录后即可在线写文章</h1>
					<p className="mt-2 text-sm leading-relaxed text-secondary">
						使用 GitHub 账号登录后，可以直接在网站上发布、编辑和删除文章，
						改动会提交到仓库并自动触发部署。
					</p>
					<a
						href="/api/auth/login/"
						className="brand-btn mx-auto mt-6 gap-2 bg-gray-900"
						style={{ background: "#24292f" }}
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
						</svg>
						GitHub 登录
					</a>
				</div>
			</div>
		);
	}

	// ---------- 渲染：编辑器 ----------
	return (
		<div className="treasure-root min-h-screen px-4 pb-16 pt-20">
			<input
				ref={mdFileRef}
				type="file"
				accept=".md,.mdx"
				className="hidden"
				onChange={importMdFile}
			/>
			<input
				ref={coverFileRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={async (e) => {
					const added = await addFiles(e.target.files || []);
					if (added[0]) setCover(added[0]);
					e.target.value = "";
				}}
			/>
			<input
				ref={imagesFileRef}
				type="file"
				accept="image/*"
				multiple
				className="hidden"
				onChange={(e) => {
					void addFiles(e.target.files || []);
					e.target.value = "";
				}}
			/>

			<div className="mx-auto max-w-6xl">
				{/* 顶栏 */}
				<div className="mb-6 flex flex-wrap items-center gap-3">
					<h1 className="text-xl font-bold">
						{mode === "edit" ? "编辑文章" : "写文章"}
					</h1>
					<span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs text-brand">
						{mode === "edit" ? `编辑中：${originalSlug}` : "新建"}
					</span>

					{/* 编辑已有文章 */}
					<div className="flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-xs">
						<FolderOpen className="h-3.5 w-3.5 text-secondary" />
						<select
							value={selectedPost}
							onChange={(e) => {
								setSelectedPost(e.target.value);
								if (e.target.value) void loadPost(e.target.value);
							}}
							className="max-w-[180px] bg-transparent outline-none"
						>
							<option value="">选择已有文章…</option>
							{postList.map((p) => (
								<option key={p.path} value={p.path}>
									{p.name}
								</option>
							))}
						</select>
					</div>

					<div className="ml-auto flex flex-wrap items-center gap-2">
						<button
							type="button"
							className="brand-btn !bg-transparent !text-current border"
							onClick={resetToCreate}
						>
							<Plus className="mr-1 h-3.5 w-3.5" /> 新建
						</button>
						<button
							type="button"
							className="brand-btn !bg-transparent !text-current border"
							onClick={() => mdFileRef.current?.click()}
						>
							<FileUp className="mr-1 h-3.5 w-3.5" /> 导入 MD
						</button>
						<button
							type="button"
							className="brand-btn !bg-transparent !text-current border"
							onClick={() => setShowDrafts(true)}
						>
							<Save className="mr-1 h-3.5 w-3.5" /> 草稿箱
							{drafts.length ? ` (${drafts.length})` : ""}
						</button>
						<button
							type="button"
							className="brand-btn !bg-transparent !text-current border"
							onClick={() => void openPreview()}
						>
							<Eye className="mr-1 h-3.5 w-3.5" /> 预览
						</button>
						<button
							type="button"
							className="brand-btn !bg-transparent !text-current border"
							onClick={saveDraft}
						>
							存草稿
						</button>
						{mode === "edit" && (
							<button
								type="button"
								className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
								onClick={() => void removePost()}
							>
								<Trash2 className="mr-1 inline h-3.5 w-3.5" /> 删除
							</button>
						)}
						<button
							type="button"
							className="brand-btn"
							disabled={publishing}
							onClick={() => void publish()}
						>
							{publishing ? (
								<Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
							) : (
								<Send className="mr-1 h-3.5 w-3.5" />
							)}
							{mode === "edit" ? "更新发布" : "发布文章"}
						</button>
					</div>
				</div>

				{publishedUrl && (
					<div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-300">
						<span>发布成功！站点重建后文章即可访问。</span>
						<a
							href={publishedUrl}
							className="rounded-lg bg-green-600 px-3 py-1 text-xs text-white"
						>
							查看文章
						</a>
						<button
							type="button"
							className="ml-auto text-xs underline"
							onClick={resetToCreate}
						>
							再写一篇
						</button>
					</div>
				)}

				{/* 发布 / 上传进度 */}
				{publishProgress && (
					<div className="mb-4 flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm text-brand">
						<Loader2 className="h-4 w-4 shrink-0 animate-spin" />
						<span className="min-w-0 truncate">{publishProgress.label}</span>
						<div className="ml-auto h-1.5 w-32 shrink-0 overflow-hidden rounded-full bg-brand/15">
							<div
								className="h-full rounded-full bg-brand transition-all"
								style={{
									width: `${
										(publishProgress.done /
											Math.max(publishProgress.total, 1)) *
										100
									}%`,
								}}
							/>
						</div>
					</div>
				)}

				{/* 主体 */}
				<div className="flex flex-col gap-6 lg:flex-row">
					{/* 左：编辑器 */}
					<div className="card min-w-0 flex-1 p-5">
						<div className="mb-3 flex gap-3">
							<input
								type="text"
								placeholder="文章标题"
								className="bg-card flex-1 rounded-lg border px-3 py-2 text-sm"
								value={form.title}
								onChange={(e) => update({ title: e.target.value })}
							/>
							<input
								type="text"
								placeholder="slug（留空自动生成）"
								className="bg-card w-52 rounded-lg border px-3 py-2 text-sm"
								value={form.slug}
								onChange={(e) => update({ slug: e.target.value })}
								disabled={mode === "edit"}
							/>
						</div>
						<textarea
							ref={textareaRef}
							placeholder="在这里写 Markdown 正文…支持 Ctrl+B 加粗、Ctrl+I 斜体、Ctrl+K 链接、直接粘贴/拖拽图片"
							className="bg-card h-[68vh] w-full resize-none rounded-xl border p-4 text-sm leading-relaxed outline-none"
							value={form.md}
							onChange={(e) => update({ md: e.target.value })}
							onKeyDown={onKeyDown}
							onPaste={(e) => void onPaste(e)}
						/>
					</div>

					{/* 右：封面 / 元信息 / 图片 */}
					<div className="w-full shrink-0 space-y-5 lg:w-80">
						{/* 封面 */}
						<div className="card p-4">
							<h2 className="text-sm font-semibold">封面</h2>
							<div
								className={`bg-card mt-3 h-36 cursor-pointer overflow-hidden rounded-xl border ${
									dragTarget === "cover"
										? "border-brand bg-brand/5 ring-2 ring-brand/40"
										: ""
								}`}
								{...makeDropHandlers("cover", async (e) => {
									const added = await addFiles(e.dataTransfer.files);
									if (added[0]) setCover(added[0]);
								})}
								onClick={() => coverFileRef.current?.click()}
							>
								{coverPreview ? (
									<div className="group relative h-full w-full">
										<img
											src={coverPreview}
											alt="cover"
											className="h-full w-full object-cover"
										/>
										<button
											type="button"
											className="absolute right-1.5 top-1.5 hidden rounded-full bg-black/60 p-1 text-white group-hover:block"
											onClick={(e) => {
												e.stopPropagation();
												setCover(null);
											}}
										>
											<X className="h-3.5 w-3.5" />
										</button>
									</div>
								) : (
									<div className="grid h-full w-full place-items-center text-3xl text-neutral-400 hover:bg-black/5">
										+
									</div>
								)}
							</div>
							<p className="mt-1.5 text-[11px] text-secondary">
								点击或拖入图片设置封面（自动压缩为 WebP）
							</p>
						</div>

						{/* 元信息 */}
						<div className="card p-4">
							<h2 className="text-sm font-semibold">元信息</h2>
							<div className="mt-3 space-y-2.5">
								<textarea
									rows={2}
									placeholder="一句话摘要（SEO / 列表展示）"
									className="bg-card block w-full resize-none rounded-lg border p-2.5 text-sm"
									value={form.description}
									onChange={(e) => update({ description: e.target.value })}
								/>
								<TagInput
									tags={form.tags}
									onChange={(tags) => update({ tags })}
								/>
								<input
									type="text"
									placeholder="分类（如：前端基础）"
									className="bg-card w-full rounded-lg border px-3 py-2 text-sm"
									value={form.category}
									onChange={(e) => update({ category: e.target.value })}
								/>
								<input
									type="date"
									className="bg-card w-full rounded-lg border px-3 py-2 text-sm"
									value={form.date}
									onChange={(e) => update({ date: e.target.value })}
								/>
								<label className="flex cursor-pointer select-none items-center gap-2 text-sm text-secondary">
									<input
										type="checkbox"
										checked={form.draft}
										onChange={(e) => update({ draft: e.target.checked })}
										className="h-4 w-4 accent-(--treasure-brand)"
									/>
									存为草稿（draft: true，不在列表公开）
								</label>
							</div>
						</div>

						{/* 图片管理 */}
						<div className="card p-4">
							<h2 className="text-sm font-semibold">图片</h2>
							{/* 压缩进度指示 */}
							{processing && (
								<div className="mt-3 flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 text-xs text-brand">
									<Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
									<span className="min-w-0 truncate">
										正在压缩 {processing.index}/{processing.total}：
										{processing.name}
									</span>
									<div className="ml-auto h-1 w-16 shrink-0 overflow-hidden rounded-full bg-brand/20">
										<div className="h-full w-1/2 animate-pulse rounded-full bg-brand" />
									</div>
								</div>
							)}
							<div className="mt-3 flex gap-2">
								<input
									type="text"
									placeholder="粘贴图片 URL…"
									className="bg-card min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-sm"
									value={urlInput}
									onChange={(e) => setUrlInput(e.target.value)}
								/>
								<button
									type="button"
									className="rounded-lg border px-3 py-1.5 text-sm"
									onClick={addUrlImage}
								>
									添加
								</button>
							</div>
							<div className="mt-3 grid grid-cols-4 gap-2">
								<div
									className={`bg-card grid aspect-square cursor-pointer place-items-center rounded-lg border text-2xl text-neutral-400 hover:bg-brand/10 ${
										dragTarget === "grid"
											? "border-brand bg-brand/10 text-brand ring-2 ring-brand/40"
											: ""
									}`}
									onClick={() => imagesFileRef.current?.click()}
									{...makeDropHandlers("grid", (e) => {
										void addFiles(e.dataTransfer.files);
									})}
								>
									+
								</div>
								{images.map((item) => {
									const src = item.type === "url" ? item.url : item.dataUrl;
									const markdown =
										item.type === "url"
											? `![](${item.url})`
											: `![](local-image:${item.id})`;
									const isCover = cover?.id === item.id;
									return (
										<div
											key={item.id}
											className={`group relative aspect-square overflow-hidden rounded-lg border ${
												isCover ? "ring-2 ring-brand" : ""
											}`}
										>
											<img
												src={src}
												alt=""
												className="h-full w-full cursor-grab object-cover active:cursor-grabbing"
												draggable
												onDragStart={(e) => {
													e.dataTransfer.setData("text/plain", markdown);
													e.dataTransfer.setData("text/markdown", markdown);
												}}
												onClick={() => insertMarkdown(markdown)}
												title={
													item.type === "file"
														? `${item.filename} · ${item.width}×${item.height} · ${formatSize(item.size)}，点击插入正文，或拖到编辑器`
														: "点击插入正文，或拖到编辑器"
												}
											/>
											{isCover && (
												<span className="absolute left-1 top-1 rounded bg-brand px-1.5 py-0.5 text-[10px] text-white">
													封面
												</span>
											)}
											{item.type === "file" && (
												<span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] leading-none text-white/90">
													{formatSize(item.size)}
												</span>
											)}
											<button
												type="button"
												className="absolute right-1 top-1 hidden rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white group-hover:block"
												onClick={() => deleteImage(item.id)}
											>
												删
											</button>
										</div>
									);
								})}
							</div>
							<p className="mt-2 text-[11px] leading-relaxed text-secondary">
								点图插入正文，也可拖拽；上传图自动压缩为 WebP（质量
								80%），单张不超过
								{formatSize(MAX_IMAGE_SIZE)}，发布时存到 public/blogs/
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Markdown 预览弹层 */}
			{previewHtml !== null && (
				<div
					className="fixed inset-0 z-[90] overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
					onClick={() => setPreviewHtml(null)}
				>
					<div
						className="treasure-root mx-auto my-6 max-w-3xl rounded-2xl p-8 shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-bold">{form.title || "预览"}</h2>
							<button
								type="button"
								className="rounded-lg border px-3 py-1.5 text-sm"
								onClick={() => setPreviewHtml(null)}
							>
								关闭预览
							</button>
						</div>
						<article
							className="write-preview"
							// eslint-disable-next-line react/no-danger
							// biome-ignore lint/security/noDangerouslySetInnerHtml: 此处为本地 Markdown 预览，内容来自已登录作者自己在编辑器里撰写的草稿并交由 marked 渲染，非第三方/外部输入
							dangerouslySetInnerHTML={{ __html: previewHtml }}
						/>
					</div>
				</div>
			)}

			{/* 草稿箱弹层 */}
			{showDrafts && (
				<div
					className="fixed inset-0 z-[90] overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
					onClick={() => setShowDrafts(false)}
				>
					<div
						className="treasure-root mx-auto my-10 max-w-2xl rounded-2xl p-6 shadow-2xl"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-bold">本地草稿箱</h2>
							<button
								type="button"
								className="rounded-lg border px-3 py-1.5 text-sm"
								onClick={() => setShowDrafts(false)}
							>
								关闭
							</button>
						</div>
						{drafts.length === 0 ? (
							<p className="py-10 text-center text-sm text-secondary">
								还没有草稿
							</p>
						) : (
							<ul className="space-y-2">
								{drafts.map((d) => (
									<li
										key={d.id}
										className="bg-card flex items-center gap-3 rounded-lg border px-4 py-3"
									>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">
												{d.form.title || d.form.slug || "未命名"}
											</p>
											<p className="text-xs text-secondary">
												{new Date(d.savedAt).toLocaleString("zh-CN")}
											</p>
										</div>
										<button
											type="button"
											className="rounded-lg bg-brand px-3 py-1.5 text-xs text-white"
											onClick={() => loadDraft(d)}
										>
											载入
										</button>
										<button
											type="button"
											className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-500"
											onClick={() => deleteDraft(d.id)}
										>
											删除
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
