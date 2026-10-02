// 画廊「添加照片」共享运行时模块
//
// 复刻 old-Jojo-blog 的图片上传体验：
//  - 仅 GitHub 登录后显示入口按钮（未登录时整个模块静默关闭）
//  - 前端 canvas 压缩为 WebP（复用 image-compress.ts 的算法：toBlob('image/webp', 0.8)）
//  - 描述 / 标签 / 日期对本批次所有图片生效
//  - 图片通过 /api/content/write (encoding='base64') 写入 public/gallery/{albumId}/，
//    并把单图元信息合并写回 photos.json（读旧数据 → 合并 → 带 sha 写回）
//  - 每次写入就是一次 GitHub commit，会触发线上自动重新部署，成功后新图即可见
//
// 组件用法：
//   const upload = await createGalleryUpload(host, { onUploaded });
//   upload.setAlbum(albumId);   // 确定当前相册时调用（无相册传 null 会隐藏入口）

import { compressImage } from "@/utils/image-compress";

export interface GalleryUpload {
	/** 设置当前相册 id；null 表示无可上传相册（隐藏入口按钮） */
	setAlbum: (id: string | null) => void;
}

export interface CreateOptions {
	/** 入口按钮插入的容器（相册标题栏 head，按钮会追加到容器末尾） */
	host: HTMLElement;
	/** 上传完成（含部署提示）后回调 */
	onUploaded?: (albumId: string) => void;
}

// ---- 小工具 ----
function makeBase64NoPrefix(dataUrl: string): string {
	const idx = dataUrl.indexOf(",");
	return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

function h<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className: string,
	text?: string,
): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text != null) node.textContent = text;
	return node;
}

// 注入一次全局样式（弹窗挂在 body 下，需独立样式，避免受组件作用域限制）
let styleInjected = false;
function ensureStyles() {
	if (styleInjected) return;
	styleInjected = true;
	const style = document.createElement("style");
	style.id = "gallery-upload-sheet";
	style.textContent = `
  .gu-btn{display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 13px;border-radius:999px;
    font-size:.8rem;font-weight:600;color:rgba(92,68,24,.92);background:rgba(255,253,244,.95);
    border:1px solid rgba(150,118,52,.3);cursor:pointer;transition:transform .18s ease,background .18s ease,box-shadow .18s ease;
    box-shadow:0 2px 8px rgba(90,66,20,.08);}
  .gu-btn:hover{transform:scale(1.05);box-shadow:0 4px 14px rgba(120,80,20,.16);}
  .gu-btn .gu-plus{font-size:15px;line-height:1;font-weight:800;}
  .gu-ov{position:fixed;inset:0;z-index:950;display:flex;align-items:center;justify-content:center;
    padding:20px;background:rgba(24,20,10,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    opacity:0;transition:opacity .22s ease;}
  .gu-ov.gu-on{opacity:1;}
  .gu-modal{width:min(560px,100%);max-height:88vh;display:flex;flex-direction:column;gap:14px;padding:20px;
    background:#fdfaf1;border-radius:16px;border:1px solid rgba(150,118,52,.28);color:#4a3d26;
    box-shadow:0 24px 60px rgba(60,40,10,.4);transform:translateY(8px);transition:transform .22s ease;overflow:hidden;}
  .gu-ov.gu-on .gu-modal{transform:translateY(0);}
  .gu-title{font-size:1.15rem;font-weight:800;color:#4a3d26;}
  .gu-sub{font-size:.78rem;color:rgba(74,61,38,.62);}
  .gu-drop{position:relative;border:1.5px dashed rgba(150,118,52,.5);border-radius:12px;background:rgba(255,255,255,.5);
    cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
    min-height:110px;transition:background .18s ease,border-color .18s ease;}
  .gu-drop.gu-drag{border-color:#c9a34f;background:rgba(255,248,220,.85);}
  .gu-drop-icon{font-size:26px;line-height:1;color:rgba(150,118,52,.7);}
  .gu-drop-text{font-size:.82rem;color:rgba(74,61,38,.7);}
  .gu-thumbs{display:flex;flex-wrap:wrap;gap:8px;}
  .gu-thumb{position:relative;width:86px;height:86px;border-radius:10px;overflow:hidden;border:2px solid #fff;
    box-shadow:0 3px 10px rgba(90,66,20,.25);}
  .gu-thumb img{width:100%;height:100%;object-fit:cover;display:block;}
  .gu-thumb-rm{position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;border:none;cursor:pointer;
    background:rgba(0,0,0,.6);color:#fff;font-size:13px;line-height:1;display:flex;align-items:center;justify-content:center;}
  .gu-count{font-size:.76rem;color:rgba(74,61,38,.6);}
  .gu-field label{display:block;font-size:.8rem;font-weight:600;color:rgba(74,61,38,.8);margin-bottom:5px;}
  .gu-field input,.gu-field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(150,118,52,.35);
    background:rgba(255,255,255,.6);color:#4a3d26;border-radius:9px;padding:8px 10px;font-size:.86rem;outline:none;}
  .gu-field input:focus,.gu-field textarea:focus{border-color:#c9a34f;background:#fff;}
  .gu-field textarea{resize:vertical;min-height:52px;}
  .gu-row{display:flex;gap:10px;}
  .gu-row > .gu-field{flex:1;}
  .gu-status{font-size:.82rem;min-height:1.2em;word-break:break-word;}
  .gu-status.gu-err{color:#c0392b;}
  .gu-status.gu-ok{color:#1e8449;}
  .gu-btns{display:flex;gap:10px;margin-top:2px;}
  .gu-btn2{flex:1;padding:9px;border-radius:10px;border:1px solid rgba(150,118,52,.35);background:rgba(255,255,255,.6);
    color:#4a3d26;font-size:.86rem;font-weight:600;cursor:pointer;transition:background .18s ease;}
  .gu-btn2:hover{background:#f4ecd6;}
  .gu-btn2.gu-main{background:#7a59b3;border-color:#7a59b3;color:#fff;}
  .gu-btn2.gu-main:hover{background:#6d4da3;}
  .gu-btn2:disabled{opacity:.55;cursor:not-allowed;pointer-events:none;}
  @media(max-width:767.98px){.gu-thumb{width:74px;height:74px;}}
  `;
	document.head.appendChild(style);
}

// 读取相册目录下的 photos.json，返回 { map, existed }
// map 统一为「记录数组」，兼容对象 / 数组两种既有写法
async function readPhotoMeta(
	albumId: string,
): Promise<{ records: Record<string, any>[]; sha: string | null }> {
	const path = `public/gallery/${albumId}/photos.json`;
	try {
		const res = await fetch(
			`/api/content/read/?path=${encodeURIComponent(path)}`,
		);
		if (!res.ok) return { records: [], sha: null };
		const data = await res.json();
		if (data && typeof data.content === "string") {
			let records: Record<string, any>[] = [];
			try {
				const raw = JSON.parse(data.content);
				if (Array.isArray(raw)) records = raw as Record<string, any>[];
				else if (raw && typeof raw === "object") {
					// 对象写法 { 文件名: {...} } → 转成记录数组，避免破坏原格式
					records = Object.entries(raw)
						.filter(([, v]) => v && typeof v === "object")
						.map(([key, v]) => ({ src: key, ...(v as any) }));
				}
			} catch {
				records = [];
			}
			return { records, sha: typeof data.sha === "string" ? data.sha : null };
		}
		return { records: [], sha: null };
	} catch {
		return { records: [], sha: null };
	}
}

// 把新增记录合并进既有列表：同名 src 覆盖，否则追加
function mergeRecords(
	existing: Record<string, any>[],
	added: Record<string, any>[],
): Record<string, any>[] {
	const next = existing.map((r) => ({ ...r }));
	for (const record of added) {
		const idx = next.findIndex((r) => r.src === record.src);
		if (idx >= 0) next[idx] = { ...next[idx], ...record };
		else next.push({ ...record });
	}
	return next;
}

function start(
	host: HTMLElement,
	onUploaded?: (id: string) => void,
): GalleryUpload {
	ensureStyles();

	let currentAlbum: string | null = null;
	let modal: HTMLElement | null = null;
	// 页面卸载时清理
	window.addEventListener("pagehide", () => {
		if (modal) {
			modal.remove();
			modal = null;
		}
	});

	// 入口按钮
	const btn = h("button", "gu-btn", "");
	btn.innerHTML = '<span class="gu-plus">＋</span> 添加照片';
	btn.title = "上传图片到当前相册";
	btn.addEventListener("click", () => {
		if (currentAlbum) openModal(currentAlbum);
	});
	host.appendChild(btn);

	function refresh() {
		if (btn) btn.style.display = currentAlbum ? "inline-flex" : "none";
	}

	// ---- 弹窗状态 ----
	type Picked = {
		file: File;
		dataUrl: string;
		width: number;
		height: number;
		size: number;
	};
	let picked: Picked[] = [];

	function openModal(albumId: string) {
		// 复用同一个弹窗，减少重复创建
		let body = document.body;
		const removeExisting = () => {
			if (modal) {
				modal.remove();
				modal = null;
				document.removeEventListener("keydown", escHandler);
			}
		};
		removeExisting();

		picked = [];
		const ov = h("div", "gu-ov");
		const box = h("div", "gu-modal");
		box.innerHTML = `
		  <div>
			<div class="gu-title">上传照片</div>
			<div class="gu-sub" data-sub>相册：${albumId}</div>
		  </div>
		  <button type="button" class="gu-drop" data-drop>…</button>
		  <div class="gu-thumbs" data-thumbs hidden></div>
		  <div class="gu-count" data-count></div>
		  <div class="gu-field">
			<label>描述（本批次图片共用，可留空）</label>
			<textarea data-desc placeholder="这组照片的说明…"></textarea>
		  </div>
		  <div class="gu-row">
			<div class="gu-field"><label>标签（用逗号或顿号分隔）</label>
			  <input type="text" data-tags placeholder="旅行, 风景"></div>
			<div class="gu-field"><label>日期</label>
			  <input type="date" data-date></div>
		  </div>
		  <div class="gu-status" data-status></div>
		  <div class="gu-btns">
			<button type="button" class="gu-btn2" data-cancel>取消</button>
			<button type="button" class="gu-btn2 gu-main" data-upload disabled>开始上传</button>
		  </div>
		`;
		// 填默认日期
		const dateInput = box.querySelector<HTMLInputElement>("[data-date]");
		if (dateInput) {
			const d = new Date();
			const mm = String(d.getMonth() + 1).padStart(2, "0");
			const dd = String(d.getDate()).padStart(2, "0");
			dateInput.value = `${d.getFullYear()}-${mm}-${dd}`;
		}

		const drop = box.querySelector<HTMLElement>("[data-drop]") as HTMLElement;
		const thumbsEl = box.querySelector<HTMLElement>(
			"[data-thumbs]",
		) as HTMLElement;
		const countEl = box.querySelector<HTMLElement>(
			"[data-count]",
		) as HTMLElement;
		const statusEl = box.querySelector<HTMLElement>(
			"[data-status]",
		) as HTMLElement;
		const uploadBtn = box.querySelector<HTMLButtonElement>(
			"[data-upload]",
		) as HTMLButtonElement;
		const cancelBtn = box.querySelector<HTMLButtonElement>(
			"[data-cancel]",
		) as HTMLButtonElement;
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = "image/*";
		fileInput.multiple = true;
		fileInput.hidden = true;
		box.appendChild(fileInput);

		let uploading = false;

		function setStatus(text: string, type: "info" | "err" | "ok" = "info") {
			statusEl.textContent = text;
			statusEl.className =
				"gu-status" +
				(type === "err" ? " gu-err" : type === "ok" ? " gu-ok" : "");
		}
		function setDropEmpty() {
			drop.innerHTML = `<div class="gu-drop-icon">⌁</div>
			  <div class="gu-drop-text">点击选择图片，或将图片拖到这里（可多选）</div>`;
		}
		setDropEmpty();

		function renderThumbs() {
			thumbsEl.innerHTML = "";
			const all = box.querySelectorAll<HTMLElement>("[data-thumb-rm]");
			all.forEach((b) => {
				b.remove();
			});
			if (picked.length === 0) {
				thumbsEl.hidden = true;
				countEl.textContent = "";
			} else {
				thumbsEl.hidden = false;
				countEl.textContent = `已选择 ${picked.length} 张图片`;
				picked.forEach((p, i) => {
					const t = h("div", "gu-thumb");
					const img = h("img", "", "");
					img.src = p.dataUrl;
					img.alt = `预览 ${i + 1}`;
					const rm = h("button", "gu-thumb-rm", "×");
					rm.type = "button";
					rm.dataset.thumbRm = "1";
					rm.addEventListener("click", (e) => {
						e.stopPropagation();
						picked.splice(i, 1);
						renderThumbs();
						uploadBtn.disabled = picked.length === 0;
					});
					t.append(img, rm);
					thumbsEl.appendChild(t);
				});
			}
		}

		async function addFiles(files: File[]) {
			if (uploading) return;
			for (const file of files) {
				if (!file.type.startsWith("image/")) {
					setStatus(`「${file.name}」不是图片文件，已跳过`, "err");
					continue;
				}
				try {
					const c = await compressImage(file, {
						maxWidth: 1920,
						maxHeight: 1920,
					});
					picked.push({
						file,
						dataUrl: c.dataUrl,
						width: c.width,
						height: c.height,
						size: c.size,
					});
				} catch (e) {
					setStatus(
						`压缩「${file.name}」失败：${e instanceof Error ? e.message : "未知错误"}`,
						"err",
					);
				}
			}
			renderThumbs();
			uploadBtn.disabled = picked.length === 0;
		}

		drop.addEventListener("click", () => fileInput.click());
		fileInput.addEventListener("change", () => {
			if (fileInput.files) addFiles(Array.from(fileInput.files));
			fileInput.value = "";
		});
		// 拖拽
		["dragover", "dragenter"].forEach((ev) => {
			drop.addEventListener(ev, (e) => {
				e.preventDefault();
				drop.classList.add("gu-drag");
			});
		});
		["dragleave", "drop"].forEach((ev) => {
			drop.addEventListener(ev, (e) => {
				e.preventDefault();
				drop.classList.remove("gu-drag");
			});
		});
		drop.addEventListener("drop", (e) => {
			const dt = (e as DragEvent).dataTransfer;
			if (dt && dt.files) addFiles(Array.from(dt.files));
		});

		function close() {
			body = document.body;
			if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
			modal = null;
			document.removeEventListener("keydown", escHandler);
		}

		async function doUpload() {
			if (uploading || picked.length === 0) return;
			uploading = true;
			uploadBtn.disabled = true;
			cancelBtn.disabled = true;

			const desc = (
				box.querySelector<HTMLTextAreaElement>("[data-desc]")?.value || ""
			).trim();
			const tagsRaw =
				box.querySelector<HTMLInputElement>("[data-tags]")?.value || "";
			const dateVal =
				box.querySelector<HTMLInputElement>("[data-date]")?.value || "";
			const tags = tagsRaw
				.split(/[,，、\s]+/)
				.map((t) => t.trim())
				.filter(Boolean);

			const base = `public/gallery/${albumId}/`;
			try {
				// 1) 逐张上传图片
				const uploaded: Record<string, any>[] = [];
				for (let i = 0; i < picked.length; i++) {
					const p = picked[i];
					setStatus(`正在上传 ${i + 1}/${picked.length}：${p.file.name}…`);
					const ext = "webp";
					const filename = `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
					const imgPath = `${base}${filename}`;
					const writeRes = await fetch("/api/content/write/", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							path: imgPath,
							content: makeBase64NoPrefix(p.dataUrl),
							encoding: "base64",
							message: `添加相册图片：${albumId}/${filename}`,
						}),
					});
					const writeData = await writeRes.json().catch(() => ({}));
					if (!writeRes.ok) {
						throw new Error(
							(writeData && writeData.error) || `图片 ${p.file.name} 上传失败`,
						);
					}
					const meta: Record<string, any> = { src: filename };
					if (desc) meta.description = desc;
					if (tags.length) meta.tags = tags;
					if (dateVal) meta.date = dateVal;
					uploaded.push(meta);
				}

				// 2) 合并写回 photos.json
				setStatus("正在更新相册信息…");
				const { records, sha } = await readPhotoMeta(albumId);
				const merged = mergeRecords(records, uploaded);
				const jsonPath = `${base}photos.json`;
				const jsonRes = await fetch("/api/content/write/", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						path: jsonPath,
						content: JSON.stringify(merged, null, "\t"),
						sha: sha || undefined,
						message: `更新相册 ${albumId} 图片信息`,
					}),
				});
				const jsonData = await jsonRes.json().catch(() => ({}));
				if (!jsonRes.ok) {
					throw new Error((jsonData && jsonData.error) || "更新相册信息失败");
				}

				setStatus(
					`上传成功，共 ${picked.length} 张。重新部署完成后即可看到。`,
					"ok",
				);
				uploading = false;
				cancelBtn.disabled = false;
				uploadBtn.disabled = true;
				onUploaded?.(albumId);
			} catch (e) {
				uploading = false;
				cancelBtn.disabled = false;
				uploadBtn.disabled = picked.length === 0;
				setStatus(e instanceof Error ? e.message : "上传失败", "err");
			}
		}

		uploadBtn.addEventListener("click", doUpload);
		cancelBtn.addEventListener("click", close);
		ov.addEventListener("click", (e) => {
			if (e.target === ov) close();
		});
		const escHandler = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
		};
		document.addEventListener("keydown", escHandler);

		body.appendChild(ov);
		modal = ov;
		requestAnimationFrame(() =>
			requestAnimationFrame(() => ov.classList.add("gu-on")),
		);
	}

	refresh();

	return {
		setAlbum: (id) => {
			currentAlbum = id;
			refresh();
		},
	};
}

export async function createGalleryUpload(
	opts: CreateOptions,
): Promise<GalleryUpload | null> {
	// 仅登录后启用
	try {
		const res = await fetch("/api/auth/status/", {
			credentials: "same-origin",
		});
		const data = await res.json();
		if (!(data && data.authenticated === true)) return null;
	} catch {
		return null;
	}
	return start(opts.host, opts.onUploaded);
}
