<script lang="ts">
/**
 * 相册管理模块（/manage/?module=gallery）
 * - 相册清单来自构建时的 galleryConfig（import 快照），照片数量/封面实时拉仓库
 * - 新建相册 / 编辑相册信息：整体重写 src/config/galleryConfig.ts（写前读取最新 sha）
 * - 照片管理（public/gallery/{album}/）：
 *     上传（canvas 压缩 WebP 1920，与相册前台 GalleryUpload 一致）
 *     编辑描述/标签/日期（写回 photos.json，保持原有数组/对象格式不破坏）
 *     删除照片（同步清理 photos.json 记录）
 *     设为封面（复制为 cover.{ext}，替换旧封面；前台封面优先级：cover 字段 > cover.* > 第一张）
 * - 所有写入都是 GitHub commit，平台重新部署后前台生效
 */
import { onMount } from "svelte";
import { galleryConfig } from "@/config/galleryConfig";
import type { GalleryAlbum } from "@/types/galleryConfig";
import { compressImage } from "@/utils/image-compress";
import Modal from "./Modal.svelte";
import {
	type ApiListEntry,
	type ApiReadResponse,
	apiGet,
	apiPost,
	formatSize,
	readFileAsDataUrl,
	splitTags,
	stripDataUrlPrefix,
	todayText,
} from "./manage-utils";

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)$/i;
const CONFIG_PATH = "src/config/galleryConfig.ts";

interface PhotoFile {
	name: string;
	path: string;
	size: number;
	viewUrl: string;
	isCover: boolean;
}

interface PhotoRecord {
	src: string;
	description?: string;
	tags?: string[];
	date?: string;
	[key: string]: unknown; // 保留 photos.json 中的未知字段
}

interface PickedImage {
	file: File;
	dataUrl: string;
	size: number;
}

// ---- 相册清单（import 快照的可变副本，配置写回后就地更新）----
let albums = $state<GalleryAlbum[]>(
	galleryConfig.albums.map((a) => ({
		...a,
		tags: a.tags ? [...a.tags] : [],
	})),
);
const columnWidth = galleryConfig.columnWidth ?? 240;

let view = $state<"list" | "detail">("list");
let currentId = $state("");
const currentAlbum = $derived(albums.find((a) => a.id === currentId) ?? null);

// 列表页实时统计：相册 id → 照片数 / 封面 URL
let statsLoading = $state(true);
let albumStats = $state<Record<string, { count: number; cover: string }>>({});

// ---- 详情状态 ----
let detailLoading = $state(false);
let photos = $state<PhotoFile[]>([]);
let records = $state<PhotoRecord[]>([]);
let metaMode = $state<"array" | "object">("object");
let busyPhoto = $state("");

// ---- 弹窗：新建/编辑相册 ----
let albumModal = $state<"create" | "edit" | null>(null);
let formId = $state("");
let formName = $state("");
let formDescription = $state("");
let formLocation = $state("");
let formDate = $state("");
let formTagsText = $state("");
let formError = $state("");
let formSaving = $state(false);

// ---- 弹窗：上传照片 ----
let showUpload = $state(false);
let picked = $state<PickedImage[]>([]);
let batchDesc = $state("");
let batchTagsText = $state("");
let batchDate = $state("");
let uploading = $state(false);
let uploadStatus = $state("");
let uploadError = $state("");
let uploadDone = $state(false);
let dragActive = $state(false);
let uploadInputEl = $state<HTMLInputElement>();

// ---- 弹窗：编辑照片信息 ----
let editPhotoName = $state("");
let photoDesc = $state("");
let photoTagsText = $state("");
let photoDate = $state("");
let photoSaving = $state(false);
let photoFormError = $state("");

// ====================================================================
// 列表页
// ====================================================================

async function loadStats() {
	statsLoading = true;
	await Promise.all(
		albums.map(async (album) => {
			try {
				const files = await apiGet<ApiListEntry[]>(
					`/api/content/list/?path=${encodeURIComponent(`public/gallery/${album.id}`)}`,
				);
				const names = (Array.isArray(files) ? files : [])
					.filter((f) => f.type === "file" && IMAGE_RE.test(f.name))
					.map((f) => f.name)
					.sort((a, b) => {
						const ac = /^cover\./i.test(a) ? 0 : 1;
						const bc = /^cover\./i.test(b) ? 0 : 1;
						return ac - bc || a.localeCompare(b);
					});
				const coverName =
					names.find((n) => /^cover\./i.test(n)) || names[0] || "";
				albumStats[album.id] = {
					count: names.length,
					cover: coverName
						? encodeURI(`/gallery/${album.id}/${coverName}`)
						: "",
				};
			} catch {
				albumStats[album.id] = { count: 0, cover: "" };
			}
		}),
	);
	statsLoading = false;
}

onMount(() => {
	void loadStats();
});

function openCreateAlbum() {
	albumModal = "create";
	formId = "";
	formName = "";
	formDescription = "";
	formLocation = "";
	formDate = todayText();
	formTagsText = "";
	formError = "";
}

function openEditAlbum(album: GalleryAlbum) {
	albumModal = "edit";
	formId = album.id;
	formName = album.name;
	formDescription = album.description || "";
	formLocation = album.location || "";
	formDate = album.date || "";
	formTagsText = (album.tags || []).join(", ");
	formError = "";
}

/** 生成 galleryConfig.ts 文件内容（TS 接受 JSON 风格对象字面量，靠 import 的结构化数据重生成，避免正则改源码） */
function serializeConfig(next: GalleryAlbum[], colW: number): string {
	const albumJson = JSON.stringify(next, null, "\t");
	const indented = albumJson
		.split("\n")
		.map((line, idx) => (idx === 0 ? line : `\t${line}`))
		.join("\n");
	return `import type { GalleryConfig } from "@/types/galleryConfig";

// 相册配置（可在 /manage/ 内容管理台维护，也可手动编辑本文件）
export const galleryConfig: GalleryConfig = {
\t// 相册列表
\t// id: 相册唯一标识符（目录名与 URL），对应 public/gallery/{id}/ 目录
\t// cover: 手动指定封面图（可选，默认取 cover.* 文件，再没有则用第一张图片）
\t// name: 相册名称；description: 描述；location: 拍摄地点
\t// date: 日期 YYYY-MM-DD；tags: 标签；password/passwordHint: 访问密码与提示（可选）
\talbums: ${indented},

\t// 瀑布流最小列宽(px)，浏览器根据容器宽度自动计算列数，默认 240
\tcolumnWidth: ${colW},
};
`;
}

async function saveAlbumFromForm() {
	const name = formName.trim();
	const id = formId.trim();
	if (!name) {
		formError = "请填写相册名称";
		return;
	}
	if (albumModal === "create") {
		if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
			formError =
				"相册 id 只能包含小写字母、数字和中划线（如 life-fragments），将用作目录名和网址";
			return;
		}
		if (albums.some((a) => a.id === id)) {
			formError = "已存在相同 id 的相册";
			return;
		}
	}
	const tags = splitTags(formTagsText);
	const mode = albumModal;
	formSaving = true;
	formError = "";
	try {
		const base: GalleryAlbum =
			mode === "edit"
				? { ...(albums.find((a) => a.id === id) as GalleryAlbum) }
				: { id, name };
		const updated: GalleryAlbum = {
			...base,
			id,
			name,
			description: formDescription.trim() || undefined,
			location: formLocation.trim() || undefined,
			date: formDate || undefined,
			tags,
		};
		const finalAlbums =
			mode === "create"
				? [...albums, updated]
				: albums.map((a) => (a.id === id ? updated : a));
		// 读取最新 sha 后整体重写配置
		let sha: string | undefined;
		try {
			const data = await apiGet<ApiReadResponse>(
				`/api/content/read/?path=${encodeURIComponent(CONFIG_PATH)}`,
			);
			sha = data.sha || undefined;
		} catch {
			// 读不到则按新建提交
		}
		await apiPost("/api/content/write/", {
			path: CONFIG_PATH,
			content: serializeConfig(finalAlbums, columnWidth),
			sha,
			message: mode === "create" ? `新建相册 ${name}` : `更新相册信息 ${name}`,
		});
		albums = finalAlbums;
		albumModal = null;
		// 新建后直接进入详情，方便立刻上传照片（前台相册页需等重新部署才出现）
		if (mode === "create") {
			await openAlbum(id);
		}
	} catch (e) {
		formError = e instanceof Error ? e.message : "保存失败";
	} finally {
		formSaving = false;
	}
}

// ====================================================================
// 详情页
// ====================================================================

async function openAlbum(id: string) {
	currentId = id;
	view = "detail";
	await loadDetail();
}

function backToList() {
	view = "list";
	currentId = "";
	void loadStats();
}

async function loadDetail() {
	detailLoading = true;
	const base = `public/gallery/${currentId}`;
	let files: ApiListEntry[] = [];
	try {
		files = await apiGet<ApiListEntry[]>(
			`/api/content/list/?path=${encodeURIComponent(base)}`,
		);
	} catch {
		files = [];
	}
	photos = (Array.isArray(files) ? files : [])
		.filter((f) => f.type === "file" && IMAGE_RE.test(f.name))
		.map((f) => ({
			name: f.name,
			path: f.path,
			size: f.size ?? 0,
			viewUrl: encodeURI(`/${f.path.slice("public/".length)}`),
			isCover: /^cover\./i.test(f.name),
		}))
		.sort((a, b) => {
			const ac = a.isCover ? 0 : 1;
			const bc = b.isCover ? 0 : 1;
			return ac - bc || a.name.localeCompare(b.name);
		});
	await loadRecords();
	detailLoading = false;
}

async function loadRecords() {
	records = [];
	metaMode = "object";
	try {
		const data = await apiGet<ApiReadResponse>(
			`/api/content/read/?path=${encodeURIComponent(`public/gallery/${currentId}/photos.json`)}`,
		);
		if (typeof data.content !== "string") return;
		const raw: unknown = JSON.parse(data.content);
		if (Array.isArray(raw)) {
			metaMode = "array";
			records = raw.filter(
				(r): r is PhotoRecord =>
					r != null &&
					typeof r === "object" &&
					typeof (r as PhotoRecord).src === "string",
			);
		} else if (raw && typeof raw === "object") {
			metaMode = "object";
			records = Object.entries(raw as Record<string, unknown>)
				.filter(([, v]) => v && typeof v === "object")
				.map(([src, v]) => ({ src, ...(v as object) }));
		}
	} catch {
		// photos.json 不存在时为空
	}
}

function recordOf(name: string): PhotoRecord | undefined {
	return records.find((r) => r.src === name);
}

/** 按当前 photos.json 的原有格式（数组/对象）序列化 */
function serializeRecords(next: PhotoRecord[]): string {
	const cleaned = next.map((r) => {
		const { src, description, tags, date, ...rest } = r;
		const out: PhotoRecord = { ...rest, src };
		if (description) out.description = description;
		if (Array.isArray(tags) && tags.length) out.tags = tags;
		if (date) out.date = date;
		return out;
	});
	if (metaMode === "array") {
		return JSON.stringify(cleaned, null, "\t");
	}
	const obj: Record<string, unknown> = {};
	for (const r of cleaned) {
		const { src, ...rest } = r;
		obj[src] = rest;
	}
	return JSON.stringify(obj, null, "\t");
}

/** 写回 photos.json（写前重读 sha，降低与前台上传并发冲突概率） */
async function writePhotosJson(next: PhotoRecord[], message: string) {
	const jsonPath = `public/gallery/${currentId}/photos.json`;
	let sha: string | undefined;
	try {
		const data = await apiGet<ApiReadResponse>(
			`/api/content/read/?path=${encodeURIComponent(jsonPath)}`,
		);
		sha = data.sha || undefined;
	} catch {
		// 文件尚不存在
	}
	await apiPost("/api/content/write/", {
		path: jsonPath,
		content: serializeRecords(next),
		sha,
		message,
	});
	records = next;
}

// ---- 设为封面 ----
async function setCover(photo: PhotoFile) {
	if (photo.isCover) return;
	const sure = window.confirm(
		`把「${photo.name}」设为相册封面吗？\n旧的封面文件会被替换，前台重新部署后生效。`,
	);
	if (!sure) return;
	busyPhoto = photo.path;
	try {
		// 1) 读取所选图片的二进制内容（read API 对图片返回 base64Content）
		const data = await apiGet<ApiReadResponse>(
			`/api/content/read/?path=${encodeURIComponent(photo.path)}`,
		);
		const base64 = data.base64Content;
		if (!base64) throw new Error("读取图片内容失败");
		const ext = photo.name.split(".").pop()?.toLowerCase() || "webp";

		// 2) 删除旧封面文件
		const oldCovers = photos.filter((p) => p.isCover);
		for (const old of oldCovers) {
			await apiPost("/api/content/delete/", {
				path: old.path,
				message: "替换相册旧封面",
			});
		}

		// 3) 写入新封面
		const newCoverName = `cover.${ext}`;
		await apiPost("/api/content/write/", {
			path: `public/gallery/${currentId}/${newCoverName}`,
			content: base64,
			encoding: "base64",
			message: `设置相册封面 ${newCoverName}`,
		});

		// 4) 同步 photos.json：旧封面记录移除，新封面记录沿用所选照片的描述
		const oldCoverNames = new Set(oldCovers.map((p) => p.name));
		let next = records.filter((r) => !oldCoverNames.has(r.src));
		next = next.filter((r) => r.src !== newCoverName);
		const sourceRec = records.find((r) => r.src === photo.name);
		next.push({ ...(sourceRec || {}), src: newCoverName });
		await writePhotosJson(next, "更新封面照片信息");

		await loadDetail();
		await loadStats();
	} catch (e) {
		alert(e instanceof Error ? e.message : "设置封面失败");
	} finally {
		busyPhoto = "";
	}
}

// ---- 删除照片 ----
async function deletePhoto(photo: PhotoFile) {
	const sure = window.confirm(
		`确定删除照片「${photo.name}」吗？${
			photo.isCover
				? "\n该照片是当前封面，删除后前台将回退显示第一张照片。"
				: ""
		}`,
	);
	if (!sure) return;
	busyPhoto = photo.path;
	try {
		await apiPost("/api/content/delete/", {
			path: photo.path,
			message: `删除相册照片 ${photo.name}`,
		});
		if (records.some((r) => r.src === photo.name)) {
			await writePhotosJson(
				records.filter((r) => r.src !== photo.name),
				`移除照片记录 ${photo.name}`,
			);
		}
		await loadDetail();
		await loadStats();
	} catch (e) {
		alert(e instanceof Error ? e.message : "删除失败");
	} finally {
		busyPhoto = "";
	}
}

// ---- 编辑照片信息 ----
function openPhotoModal(photo: PhotoFile) {
	const rec = recordOf(photo.name);
	editPhotoName = photo.name;
	photoDesc = rec?.description || "";
	photoTagsText = (rec?.tags || []).join(", ");
	photoDate = rec?.date || "";
	photoFormError = "";
}

async function savePhotoMeta() {
	photoSaving = true;
	photoFormError = "";
	try {
		const next = records.filter((r) => r.src !== editPhotoName);
		next.push({
			src: editPhotoName,
			description: photoDesc.trim() || undefined,
			tags: splitTags(photoTagsText),
			date: photoDate || undefined,
		});
		await writePhotosJson(next, `更新照片信息 ${editPhotoName}`);
		editPhotoName = "";
	} catch (e) {
		photoFormError = e instanceof Error ? e.message : "保存失败";
	} finally {
		photoSaving = false;
	}
}

// ---- 上传照片 ----
function openUpload() {
	picked = [];
	batchDesc = "";
	batchTagsText = "";
	batchDate = todayText();
	uploadStatus = "";
	uploadError = "";
	uploadDone = false;
	uploading = false;
	dragActive = false;
	showUpload = true;
}

async function addFiles(files: File[]) {
	uploadError = "";
	for (const file of files) {
		if (!file.type.startsWith("image/")) {
			uploadError = `「${file.name}」不是图片文件，已跳过`;
			continue;
		}
		try {
			// 动图保留原样，其余压缩为 WebP（与前台相册上传一致：上限 1920）
			if (file.name.toLowerCase().endsWith(".gif")) {
				picked.push({
					file,
					dataUrl: await readFileAsDataUrl(file),
					size: file.size,
				});
			} else {
				const c = await compressImage(file, {
					maxWidth: 1920,
					maxHeight: 1920,
				});
				picked.push({ file, dataUrl: c.dataUrl, size: c.size });
			}
		} catch (e) {
			uploadError = `压缩「${file.name}」失败：${
				e instanceof Error ? e.message : "未知错误"
			}`;
		}
	}
}

function onPickChange(e: Event) {
	const input = e.target as HTMLInputElement;
	if (input.files) void addFiles(Array.from(input.files));
	input.value = "";
}

function onDrop(e: DragEvent) {
	e.preventDefault();
	dragActive = false;
	if (!uploading && e.dataTransfer?.files) {
		void addFiles(Array.from(e.dataTransfer.files));
	}
}

async function doUpload() {
	if (uploading || picked.length === 0) return;
	uploading = true;
	uploadError = "";
	const desc = batchDesc.trim();
	const tags = splitTags(batchTagsText);
	const dateVal = batchDate || "";
	try {
		const added: PhotoRecord[] = [];
		for (let i = 0; i < picked.length; i++) {
			const p = picked[i];
			uploadStatus = `正在上传 ${i + 1}/${picked.length}：${p.file.name}`;
			const ext = p.file.name.toLowerCase().endsWith(".gif") ? "gif" : "webp";
			const filename = `p-${Date.now()}-${i}-${Math.random()
				.toString(36)
				.slice(2, 8)}.${ext}`;
			await apiPost("/api/content/write/", {
				path: `public/gallery/${currentId}/${filename}`,
				content: stripDataUrlPrefix(p.dataUrl),
				encoding: "base64",
				message: `添加相册图片 ${currentId}/${filename}`,
			});
			const meta: PhotoRecord = { src: filename };
			if (desc) meta.description = desc;
			if (tags.length) meta.tags = tags;
			if (dateVal) meta.date = dateVal;
			added.push(meta);
		}
		uploadStatus = "正在更新相册信息…";
		const merged = [...records];
		for (const rec of added) {
			const idx = merged.findIndex((r) => r.src === rec.src);
			if (idx >= 0) merged[idx] = { ...merged[idx], ...rec };
			else merged.push(rec);
		}
		await writePhotosJson(merged, `更新相册 ${currentId} 图片信息`);
		uploadStatus = `上传成功，共 ${picked.length} 张。重新部署完成后即可看到。`;
		uploadDone = true;
		picked = [];
		await loadDetail();
		await loadStats();
	} catch (e) {
		uploadError = e instanceof Error ? e.message : "上传失败";
	} finally {
		uploading = false;
	}
}
</script>

{#if view === "list"}
	<!-- 相册列表 -->
	<div class="mb-4 flex items-center gap-2">
		<p class="text-xs text-secondary">
			{statsLoading ? "正在统计相册照片…" : `共 ${albums.length} 个相册`}
		</p>
		<button type="button" class="brand-btn ml-auto gap-1.5 text-xs" onclick={openCreateAlbum}>
			<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M12 5v14M5 12h14" />
			</svg>
			新建相册
		</button>
	</div>

	{#if albums.length === 0}
		<div class="card flex flex-col items-center gap-3 p-12 text-center">
			<svg class="h-10 w-10 text-brand/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M3 7a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm5 5a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z" />
			</svg>
			<p class="text-sm text-secondary">还没有相册，点「新建相册」创建第一个</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each albums as album (album.id)}
				<div class="card group overflow-hidden p-0">
					<!-- 封面 -->
					<button
						type="button"
						class="relative block aspect-[16/10] w-full overflow-hidden bg-brand/10 text-left"
						onclick={() => void openAlbum(album.id)}
						title="管理照片"
					>
						{#if albumStats[album.id]?.cover}
							<img
								src={albumStats[album.id]?.cover}
								alt={album.name}
								loading="lazy"
								decoding="async"
								class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>
						{:else}
							<div class="flex h-full w-full items-center justify-center">
								<svg class="h-8 w-8 text-brand/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									<path d="M3 7a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm5 5a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z" />
								</svg>
							</div>
						{/if}
						<span class="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
							{statsLoading ? "…" : `${albumStats[album.id]?.count ?? 0} 张`}
						</span>
					</button>
					<!-- 信息 -->
					<div class="p-3.5">
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold">{album.name}</p>
								<p class="mt-0.5 text-[11px] text-secondary">
									{#if album.date}<span>{album.date}</span>{/if}
									{#if album.location}<span>{album.date ? " · " : ""}{album.location}</span>{/if}
								</p>
							</div>
							<button
								type="button"
								class="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-brand/10 hover:text-brand"
								onclick={() => openEditAlbum(album)}
							>
								编辑信息
							</button>
						</div>
						{#if album.description}
							<p class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-secondary">{album.description}</p>
						{/if}
						{#if album.tags?.length}
							<div class="mt-2 flex flex-wrap gap-1">
								{#each album.tags as tag (tag)}
									<span class="rounded bg-black/5 px-1.5 py-0.5 text-[10px] text-secondary dark:bg-white/10">{tag}</span>
								{/each}
							</div>
						{/if}
						<a
							href={`/gallery/${album.id}/`}
							target="_blank"
							rel="noreferrer"
							class="mt-2 inline-block text-[11px] font-medium text-brand hover:underline"
						>
							查看前台相册 →
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
{:else}
	<!-- 相册详情 -->
	<div class="mb-4">
		<button
			type="button"
			class="mb-3 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-brand"
			onclick={backToList}
		>
			<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="m15 18-6-6 6-6" />
			</svg>
			返回相册列表
		</button>
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div class="min-w-0">
				<h2 class="text-lg font-bold">{currentAlbum?.name || currentId}</h2>
				<p class="mt-0.5 text-xs text-secondary">
					{#if currentAlbum?.date}<span>{currentAlbum.date}</span>{/if}
					{#if currentAlbum?.location}<span>{currentAlbum?.date ? " · " : ""}{currentAlbum.location}</span>{/if}
					{#if currentAlbum?.tags?.length}
						<span class="ml-2">
							{#each currentAlbum.tags as tag (tag)}
								<span class="mr-1 rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">{tag}</span>
							{/each}
						</span>
					{/if}
				</p>
			</div>
			<div class="flex shrink-0 gap-2">
				<button
					type="button"
					class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-brand/10"
					onclick={() => currentAlbum && openEditAlbum(currentAlbum)}
				>
					编辑相册信息
				</button>
				<button type="button" class="brand-btn gap-1.5 text-xs" onclick={openUpload}>
					<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M12 5v14M5 12h14" />
					</svg>
					上传照片
				</button>
			</div>
		</div>
	</div>

	{#if detailLoading}
		<div class="card flex items-center justify-center gap-3 p-10 text-sm text-secondary">
			<span class="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand"></span>
			正在加载照片…
		</div>
	{:else if photos.length === 0}
		<div class="card flex flex-col items-center gap-3 p-12 text-center">
			<svg class="h-10 w-10 text-brand/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M4 5h16v14H4zM8.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM4 15l4-4 3 3 4-4 5 5" />
			</svg>
			<p class="text-sm text-secondary">这个相册还没有照片，点「上传照片」添加</p>
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{#each photos as photo (photo.path)}
				<div class="card group overflow-hidden p-0">
					<div class="relative aspect-square overflow-hidden bg-brand/10">
						<img
							src={photo.viewUrl}
							alt={recordOf(photo.name)?.description || photo.name}
							loading="lazy"
							decoding="async"
							class="h-full w-full object-cover"
						/>
						{#if photo.isCover}
							<span class="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
								封面
							</span>
						{/if}
						<div class="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
							{#if !photo.isCover}
								<button
									type="button"
									class="rounded-lg bg-white/90 px-2 py-1.5 text-[11px] font-semibold text-neutral-800 hover:scale-105"
									disabled={busyPhoto === photo.path}
									onclick={() => void setCover(photo)}
								>
									设封面
								</button>
							{/if}
							<button
								type="button"
								class="rounded-lg bg-white/90 px-2 py-1.5 text-[11px] font-semibold text-neutral-800 hover:scale-105"
								disabled={busyPhoto === photo.path}
								onclick={() => openPhotoModal(photo)}
							>
								编辑
							</button>
							<button
								type="button"
								class="rounded-lg bg-red-500/90 px-2 py-1.5 text-[11px] font-semibold text-white hover:scale-105"
								disabled={busyPhoto === photo.path}
								onclick={() => void deletePhoto(photo)}
							>
								删除
							</button>
						</div>
						{#if busyPhoto === photo.path}
							<div class="absolute inset-0 flex items-center justify-center bg-black/40">
								<span class="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
							</div>
						{/if}
					</div>
					<div class="px-2.5 py-2">
						<p class="truncate text-[11px]" title={recordOf(photo.name)?.description || ""}>
							{recordOf(photo.name)?.description || photo.name}
						</p>
						<p class="mt-0.5 text-[10px] text-secondary">{formatSize(photo.size)}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
{/if}

<!-- 新建 / 编辑相册弹窗 -->
{#if albumModal}
	<Modal
		title={albumModal === "create" ? "新建相册" : "编辑相册信息"}
		onClose={() => (albumModal = null)}
	>
		<div class="flex flex-col gap-3.5">
			<div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
				<div>
					<label class="mb-1 block text-xs font-semibold text-secondary" for="album-id">相册 ID（目录名与网址）</label>
					<input
						id="album-id"
						type="text"
						bind:value={formId}
						disabled={albumModal === "edit"}
						placeholder="life-fragments"
						class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50 disabled:opacity-60"
					/>
				</div>
				<div>
					<label class="mb-1 block text-xs font-semibold text-secondary" for="album-name">相册名称</label>
					<input
						id="album-name"
						type="text"
						bind:value={formName}
						placeholder="生活碎片"
						class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
					/>
				</div>
			</div>
			<div>
				<label class="mb-1 block text-xs font-semibold text-secondary" for="album-desc">描述</label>
				<textarea
					id="album-desc"
					bind:value={formDescription}
					rows="2"
					class="w-full resize-y rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-brand/50"
				></textarea>
			</div>
			<div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
				<div>
					<label class="mb-1 block text-xs font-semibold text-secondary" for="album-location">拍摄地点</label>
					<input
						id="album-location"
						type="text"
						bind:value={formLocation}
						placeholder="广州"
						class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
					/>
				</div>
				<div>
					<label class="mb-1 block text-xs font-semibold text-secondary" for="album-date">日期</label>
					<input
						id="album-date"
						type="date"
						bind:value={formDate}
						class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
					/>
				</div>
			</div>
			<div>
				<label class="mb-1 block text-xs font-semibold text-secondary" for="album-tags">标签（逗号分隔）</label>
				<input
					id="album-tags"
					type="text"
					bind:value={formTagsText}
					placeholder="生活, 猫猫"
					class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
				/>
			</div>
			{#if formError}
				<p class="text-xs text-red-500">{formError}</p>
			{/if}
			<div class="flex justify-end gap-2">
				<button
					type="button"
					class="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
					onclick={() => (albumModal = null)}
				>
					取消
				</button>
				<button
					type="button"
					class="brand-btn text-xs disabled:opacity-50"
					disabled={formSaving}
					onclick={() => void saveAlbumFromForm()}
				>
					{formSaving ? "保存中…" : "保存"}
				</button>
			</div>
			{#if albumModal === "create"}
				<p class="-mt-1 text-[10px] leading-relaxed text-secondary">
					保存即向仓库提交一次配置更改，平台重新部署后前台相册页才会出现新相册；部署完成前就可以先在这里上传照片。
				</p>
			{/if}
		</div>
	</Modal>
{/if}

<!-- 上传照片弹窗 -->
{#if showUpload}
	<Modal title={`上传照片到「${currentAlbum?.name || currentId}」`} onClose={() => (showUpload = false)} wide>
		<button
			type="button"
			class="flex min-h-[110px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-colors {dragActive
				? 'border-brand bg-brand/5'
				: 'border-border'}"
			disabled={uploading}
			onclick={() => uploadInputEl?.click()}
			ondragover={(e) => {
				e.preventDefault();
				dragActive = true;
			}}
			ondragleave={() => (dragActive = false)}
			ondrop={onDrop}
		>
			<svg class="h-6 w-6 text-brand/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M12 16V4m0 0L8 8m4-4 4 4" />
				<path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
			</svg>
			<span class="text-xs text-secondary">点击选择图片，或把图片拖到这里（可多选）</span>
			<span class="text-[10px] text-secondary/70">自动压缩为 WebP，GIF 保留原样</span>
		</button>
		<input
			bind:this={uploadInputEl}
			type="file"
			accept="image/*"
			multiple
			class="hidden"
			onchange={onPickChange}
		/>

		{#if picked.length > 0}
			<div class="mt-3">
				<p class="mb-2 text-xs text-secondary">已选择 {picked.length} 张</p>
				<div class="flex flex-wrap gap-2">
					{#each picked as p, i (p.file.name + i)}
						<div class="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-card shadow">
							<img src={p.dataUrl} alt="" class="h-full w-full object-cover" />
							{#if p.file.name.toLowerCase().endsWith(".gif")}
								<span class="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] font-bold text-white">GIF</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
			<div class="sm:col-span-2">
				<label class="mb-1 block text-xs font-semibold text-secondary" for="batch-desc">描述（本批次共用，可留空）</label>
				<textarea
					id="batch-desc"
					bind:value={batchDesc}
					rows="2"
					placeholder="这组照片的说明…"
					class="w-full resize-y rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-brand/50"
				></textarea>
			</div>
			<div>
				<label class="mb-1 block text-xs font-semibold text-secondary" for="batch-tags">标签（逗号分隔）</label>
				<input
					id="batch-tags"
					type="text"
					bind:value={batchTagsText}
					placeholder="旅行, 风景"
					class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
				/>
			</div>
			<div>
				<label class="mb-1 block text-xs font-semibold text-secondary" for="batch-date">日期</label>
				<input
					id="batch-date"
					type="date"
					bind:value={batchDate}
					class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
				/>
			</div>
		</div>

		{#if uploadError}
			<p class="mt-3 break-words text-xs text-red-500">{uploadError}</p>
		{/if}
		{#if uploadStatus}
			<p class="mt-3 break-words text-xs {uploadDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-secondary'}">
				{uploadStatus}
			</p>
		{/if}

		<div class="mt-4 flex justify-end gap-2">
			{#if uploadDone}
				<button type="button" class="brand-btn text-xs" onclick={() => (showUpload = false)}>完成</button>
			{:else}
				<button
					type="button"
					class="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
					disabled={uploading}
					onclick={() => (showUpload = false)}
				>
					取消
				</button>
				<button
					type="button"
					class="brand-btn text-xs disabled:opacity-50"
					disabled={uploading || picked.length === 0}
					onclick={() => void doUpload()}
				>
					{uploading ? "上传中…" : `开始上传${picked.length ? `（${picked.length} 张）` : ""}`}
				</button>
			{/if}
		</div>
	</Modal>
{/if}

<!-- 编辑照片信息弹窗 -->
{#if editPhotoName}
	<Modal title={`编辑照片信息 · ${editPhotoName}`} onClose={() => (editPhotoName = "")}>
		<div class="flex flex-col gap-3.5">
			<div>
				<label class="mb-1 block text-xs font-semibold text-secondary" for="photo-desc">描述</label>
				<textarea
					id="photo-desc"
					bind:value={photoDesc}
					rows="3"
					class="w-full resize-y rounded-lg border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-brand/50"
				></textarea>
			</div>
			<div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
				<div>
					<label class="mb-1 block text-xs font-semibold text-secondary" for="photo-tags">标签（逗号分隔）</label>
					<input
						id="photo-tags"
						type="text"
						bind:value={photoTagsText}
						class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
					/>
				</div>
				<div>
					<label class="mb-1 block text-xs font-semibold text-secondary" for="photo-date">拍摄日期</label>
					<input
						id="photo-date"
						type="date"
						bind:value={photoDate}
						class="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm outline-none focus:border-brand/50"
					/>
				</div>
			</div>
			{#if photoFormError}
				<p class="text-xs text-red-500">{photoFormError}</p>
			{/if}
			<div class="flex justify-end gap-2">
				<button
					type="button"
					class="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
					onclick={() => (editPhotoName = "")}
				>
					取消
				</button>
				<button
					type="button"
					class="brand-btn text-xs disabled:opacity-50"
					disabled={photoSaving}
					onclick={() => void savePhotoMeta()}
				>
					{photoSaving ? "保存中…" : "保存"}
				</button>
			</div>
		</div>
	</Modal>
{/if}
