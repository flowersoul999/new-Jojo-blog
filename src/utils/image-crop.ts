// 图片裁剪 + 压缩一体化工具
// 上传图片时先打开模态裁剪画布：拖拽定位、滚轮/滑块缩放、纵横比预设
// 确认后把裁剪区域按比例绘制到输出画布并压缩为 WebP（quality 0.8，与全站压缩算法一致）
// 取消时 resolve(null)，上层跳过该图
//
// 交互模型：
//   - 裁剪框始终为固定纵横比（预设 chips 或调用方锁定），中心默认，可拖拽平移
//   - 图片在裁剪框下方，可拖拽平移 / 缩放；系统自动把图片 clamp 到「完全覆盖裁剪框」
//   - 自由比例 = 「原始比例」（即整图无裁切），再按需切换预设

import { blobToDataUrl, decodeImageFile } from "@utils/image-compress";

/** 裁剪框纵横比预设（"original" 表示用原图比例，等价无裁切） */
export type CropAspectPreset =
	| "original"
	| "1:1"
	| "4:3"
	| "3:4"
	| "16:9"
	| "9:16"
	| "16:10";

export const CROP_ASPECTS: Array<{
	id: CropAspectPreset;
	label: string;
	ratio: number | null;
}> = [
	{ id: "original", label: "原始", ratio: null },
	{ id: "1:1", label: "1:1", ratio: 1 },
	{ id: "4:3", label: "4:3", ratio: 4 / 3 },
	{ id: "3:4", label: "3:4", ratio: 3 / 4 },
	{ id: "16:9", label: "16:9", ratio: 16 / 9 },
	{ id: "16:10", label: "16:10", ratio: 16 / 10 },
	{ id: "9:16", label: "9:16", ratio: 9 / 16 },
];

export type CropResult = {
	dataUrl: string;
	width: number; // 输出宽（裁剪后）
	height: number; // 输出高（裁剪后）
	size: number; // 输出字节数
	sourceWidth: number; // 原图宽
	sourceHeight: number; // 原图高
	wasCropped: boolean; // 是否发生了实际裁切
};

export type CropDialogOptions = {
	quality?: number; // WebP 质量，默认 0.8
	maxOutput?: number; // 输出最长边上限，默认 1600
	aspect?: CropAspectPreset | number | null; // 初始纵横比；数字表示锁定（如封面 16/10），null=原始
	title?: string;
};

const DIALOG_CSS = `
	.aemeath-crop-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);}
	.aemeath-crop-dialog{width:min(680px,100%);background:var(--treasure-bg,#f7f8fa);color:var(--treasure-text,#334f52);border:1px solid var(--treasure-default-border);border-radius:1rem;box-shadow:0 20px 60px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden;font-family:var(--treasure-font-display,"PingFang SC",sans-serif);}
	.aemeath-crop-header{padding:.9rem 1.1rem;font-size:.95rem;font-weight:600;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--treasure-default-border);}
	.aemeath-crop-close{background:none;border:none;cursor:pointer;font-size:1.2rem;line-height:1;color:var(--treasure-secondary,#7b888e);padding:.2rem .4rem;}
	.aemeath-crop-stage{position:relative;margin:.9rem;height:min(46vh,340px);background:#000;border-radius:.75rem;overflow:hidden;touch-action:none;}
	.aemeath-crop-img{position:absolute;max-width:none;user-select:none;-webkit-user-drag:none;cursor:grab;}
	.aemeath-crop-img.panning{cursor:grabbing;}
	.aemeath-crop-box{position:absolute;box-shadow:0 0 0 9999px rgba(0,0,0,.55);border:1.5px dashed rgba(255,255,255,.9);cursor:move;touch-action:none;}
	.aemeath-crop-grid{position:absolute;inset:0;pointer-events:none;}
	.aemeath-crop-grid::before,.aemeath-crop-grid::after{content:"";position:absolute;background:rgba(255,255,255,.45);}
	.aemeath-crop-grid::before{left:33.33%;top:0;bottom:0;width:1px;}
	.aemeath-crop-grid::after{top:33.33%;left:0;right:0;height:1px;}
	.aemeath-crop-controls{padding:0 1.1rem .8rem;display:flex;flex-direction:column;gap:.7rem;}
	.aemeath-crop-aspects{display:flex;flex-wrap:wrap;gap:.4rem;}
	.aemeath-crop-chip{background:transparent;border:1px solid var(--treasure-default-border);color:var(--treasure-text,#334f52);border-radius:.5rem;padding:.28rem .65rem;font-size:.75rem;cursor:pointer;}
	.aemeath-crop-chip.active{background:var(--treasure-brand,#35bfab);border-color:var(--treasure-brand,#35bfab);color:#fff;font-weight:600;}
	.aemeath-crop-chip:disabled{opacity:.4;cursor:not-allowed;}
	.aemeath-crop-zoom{display:flex;align-items:center;gap:.6rem;font-size:.75rem;color:var(--treasure-secondary,#7b888e);}
	.aemeath-crop-zoom input{flex:1;}
	.aemeath-crop-actions{display:flex;justify-content:flex-end;gap:.5rem;padding:0 1.1rem 1rem;}
	.aemeath-crop-btn{border-radius:.6rem;padding:.5rem 1.1rem;font-size:.85rem;cursor:pointer;border:1px solid var(--treasure-default-border);background:transparent;color:var(--treasure-text,#334f52);}
	.aemeath-crop-btn.primary{background:linear-gradient(135deg,var(--treasure-brand,#35bfab),var(--treasure-brand-secondary,#1fc9e7));border-color:transparent;color:#fff;font-weight:600;}
	.aemeath-crop-btn.primary:disabled{opacity:.5;cursor:not-allowed;}
`;

/** 打开裁剪画布；确认返回 CropResult，取消返回 null */
export function openImageCrop(
	file: File,
	options: CropDialogOptions = {},
): Promise<CropResult | null> {
	const quality = options.quality ?? 0.8;
	const maxOutput = options.maxOutput ?? 1600;
	const title = options.title ?? "裁剪图片";

	return new Promise<CropResult | null>((resolve) => {
		let settled = false;
		let decodedSource: ImageBitmap | HTMLImageElement | null = null;
		let sourceW = 0;
		let sourceH = 0;
		let overlay: HTMLDivElement | null = null;
		let styleEl: HTMLStyleElement | null = null;
		let onKey: ((e: KeyboardEvent) => void) | null = null;

		const done = (value: CropResult | null) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve(value);
		};

		// ---------- 解码 ----------
		void decodeImageFile(file)
			.then((decoded) => {
				decodedSource = decoded.source;
				sourceW = decoded.width;
				sourceH = decoded.height;
				if (!sourceW || !sourceH) {
					done(null);
					return;
				}
				buildDialog();
			})
			.catch(() => done(null));

		// ---------- DOM ----------
		function buildDialog() {
			if (!decodedSource) return;
			styleEl = document.createElement("style");
			styleEl.textContent = DIALOG_CSS;
			document.head.appendChild(styleEl);

			overlay = document.createElement("div");
			overlay.className = "aemeath-crop-overlay";
			overlay.innerHTML = `
				<div class="aemeath-crop-dialog" role="dialog" aria-modal="true" aria-label="${title}">
					<div class="aemeath-crop-header">
						<span>${title}</span>
						<button type="button" class="aemeath-crop-close" aria-label="取消">×</button>
					</div>
					<div class="aemeath-crop-stage">
						<img class="aemeath-crop-img" alt="" draggable="false" />
						<div class="aemeath-crop-box">
							<div class="aemeath-crop-grid"></div>
						</div>
					</div>
					<div class="aemeath-crop-controls">
						<div class="aemeath-crop-aspects"></div>
						<div class="aemeath-crop-zoom">
							<span>缩放</span>
							<input type="range" min="1" max="20" step="0.01" value="1" />
							<span class="aemeath-crop-zoomval">100%</span>
						</div>
					</div>
					<div class="aemeath-crop-actions">
						<button type="button" class="aemeath-crop-btn">取消</button>
						<button type="button" class="aemeath-crop-btn primary">确定</button>
					</div>
				</div>
			`;
			document.body.appendChild(overlay);

			// 元素必然存在（刚由模板创建），用 helper 取引用避免非空断言
			function must<T extends Element>(selector: string): T {
				const el = overlay?.querySelector<T>(selector);
				if (!el) throw new Error(`裁剪画布缺少元素: ${selector}`);
				return el;
			}
			const stage = must<HTMLDivElement>(".aemeath-crop-stage");
			const img = must<HTMLImageElement>(".aemeath-crop-img");
			const box = must<HTMLDivElement>(".aemeath-crop-box");
			const aspectsWrap = must<HTMLDivElement>(".aemeath-crop-aspects");
			const zoomRange = must<HTMLInputElement>(".aemeath-crop-zoom input");
			const zoomVal = must<HTMLSpanElement>(".aemeath-crop-zoomval");
			const cancelBtn = must<HTMLButtonElement>(
				".aemeath-crop-actions .aemeath-crop-btn",
			);
			const okBtn = must<HTMLButtonElement>(".aemeath-crop-actions .primary");
			const closeBtn = must<HTMLButtonElement>(".aemeath-crop-close");

			// ---------- 状态 ----------
			const view = { w: 0, h: 0 };
			let baseScale = 1;
			let zoom = 1;
			let panX = 0;
			let panY = 0;
			let aspectRatio: number | null = null; // null = 原始比例
			let crop = { x: 0, y: 0, w: 0, h: 0 };
			const dragState = { mode: "none" as "none" | "pan" | "box" };
			let lastPointer = { x: 0, y: 0 };

			// 初始纵横比：锁定比例 > 传入预设 > 原始比例
			if (typeof options.aspect === "number") {
				aspectRatio = options.aspect;
			} else {
				const preset = CROP_ASPECTS.find(
					(p) => p.id === (options.aspect ?? "original"),
				);
				aspectRatio = preset?.ratio ?? null;
			}

			// 统一把解码源绘制到临时 canvas 转 dataURL 预览（HTMLImageElement / ImageBitmap 均适用）
			// 预览分辨率最大 1600，避免超大图转 base64 卡顿
			const previewScale = Math.min(1, 1600 / Math.max(sourceW, sourceH));
			const tmp = document.createElement("canvas");
			tmp.width = Math.max(1, Math.round(sourceW * previewScale));
			tmp.height = Math.max(1, Math.round(sourceH * previewScale));
			const tctx = tmp.getContext("2d");
			if (tctx) {
				tctx.drawImage(
					decodedSource as CanvasImageSource,
					0,
					0,
					tmp.width,
					tmp.height,
				);
				img.src = tmp.toDataURL("image/png");
			}
			img.onload = init;
			if (img.complete && img.naturalWidth) init();

			function init() {
				if (view.w && view.h) return; // 只测量一次
				const rect = stage.getBoundingClientRect();
				view.w = rect.width || 640;
				view.h = rect.height || 400;
				baseScale = Math.min(view.w / sourceW, view.h / sourceH);
				applyAspect();
				render();
			}

			function currentRatio(): number {
				return aspectRatio ?? sourceW / sourceH;
			}

			// 裁剪框尺寸：宽取可视区 80%，超出高度 72% 则按高度收缩
			function computeCropSize(): { w: number; h: number } {
				const ratio = currentRatio();
				let w = view.w * 0.8;
				let h = w / ratio;
				if (h > view.h * 0.72) {
					h = view.h * 0.72;
					w = h * ratio;
				}
				return { w: Math.round(w), h: Math.round(h) };
			}

			function applyAspect() {
				const { w, h } = computeCropSize();
				crop = {
					x: Math.round((view.w - w) / 2),
					y: Math.round((view.h - h) / 2),
					w,
					h,
				};
				clampCrop();
			}

			function clampCrop() {
				crop.x = Math.max(0, Math.min(crop.x, view.w - crop.w));
				crop.y = Math.max(0, Math.min(crop.y, view.h - crop.h));
				crop.w = Math.min(crop.w, view.w);
				crop.h = Math.min(crop.h, view.h);
			}

			// 保证图片覆盖裁剪框的最小缩放
			function minZoom(): number {
				const { w, h } = computeCropSize();
				const zx = w / (baseScale * sourceW);
				const zy = h / (baseScale * sourceH);
				return Math.max(1, Math.max(zx, zy));
			}

			// 把 pan 约束到「图片完全覆盖裁剪框」
			function clampPan() {
				const w = sourceW * baseScale * zoom;
				const h = sourceH * baseScale * zoom;
				const imgLeft = (view.w - w) / 2 + panX;
				const imgTop = (view.h - h) / 2 + panY;
				const minLeft = crop.x + crop.w - w;
				const maxLeft = crop.x;
				const minTop = crop.y + crop.h - h;
				const maxTop = crop.y;
				const newLeft = Math.min(Math.max(imgLeft, minLeft), maxLeft);
				const newTop = Math.min(Math.max(imgTop, minTop), maxTop);
				panX = newLeft - (view.w - w) / 2;
				panY = newTop - (view.h - h) / 2;
			}

			function render() {
				const z = Math.max(zoom, minZoom());
				zoom = z;
				const w = sourceW * baseScale * z;
				const h = sourceH * baseScale * z;
				clampPan();
				const imgLeft = (view.w - w) / 2 + panX;
				const imgTop = (view.h - h) / 2 + panY;
				img.style.left = `${imgLeft}px`;
				img.style.top = `${imgTop}px`;
				img.style.width = `${w}px`;
				img.style.height = `${h}px`;
				box.style.left = `${crop.x}px`;
				box.style.top = `${crop.y}px`;
				box.style.width = `${crop.w}px`;
				box.style.height = `${crop.h}px`;
				zoomRange.value = String(Math.min(z, Number(zoomRange.max)));
				zoomVal.textContent = `${Math.round(z * 100)}%`;
			}

			// ---------- 纵横比 chips ----------
			const isLocked = typeof options.aspect === "number";
			function ratioToPreset(r: number): CropAspectPreset {
				const hit = CROP_ASPECTS.find(
					(p) => p.ratio !== null && Math.abs(p.ratio - r) < 0.001,
				);
				return (hit?.id as CropAspectPreset) ?? "original";
			}
			function isActiveChip(preset: (typeof CROP_ASPECTS)[number]): boolean {
				if (isLocked) return aspectRatio === options.aspect;
				const current = aspectRatio; // 局部捕获，便于类型收窄
				return (
					preset.id === (current === null ? "original" : ratioToPreset(current))
				);
			}
			CROP_ASPECTS.forEach((preset) => {
				const chip = document.createElement("button");
				chip.type = "button";
				chip.className = "aemeath-crop-chip";
				chip.textContent = preset.label;
				chip.disabled = isLocked;
				chip.classList.toggle("active", isActiveChip(preset));
				chip.addEventListener("click", () => {
					aspectRatio = preset.ratio;
					applyAspect();
					render();
					aspectsWrap
						.querySelectorAll<HTMLButtonElement>(".aemeath-crop-chip")
						.forEach((c, i) => {
							c.classList.toggle("active", isActiveChip(CROP_ASPECTS[i]));
						});
				});
				aspectsWrap.appendChild(chip);
			});

			// ---------- 交互 ----------
			img.addEventListener("pointerdown", (e) => {
				if (e.button !== 0) return;
				dragState.mode = "pan";
				img.classList.add("panning");
				lastPointer = { x: e.clientX, y: e.clientY };
				e.preventDefault();
			});
			box.addEventListener("pointerdown", (e) => {
				if (e.button !== 0) return;
				dragState.mode = "box";
				lastPointer = { x: e.clientX, y: e.clientY };
				e.preventDefault();
				e.stopPropagation();
			});
			const onPointerMove = (e: PointerEvent) => {
				const dx = e.clientX - lastPointer.x;
				const dy = e.clientY - lastPointer.y;
				lastPointer = { x: e.clientX, y: e.clientY };
				if (dragState.mode === "pan") {
					panX += dx;
					panY += dy;
					clampPan();
					render();
				} else if (dragState.mode === "box") {
					crop.x += dx;
					crop.y += dy;
					clampCrop();
					render();
				}
			};
			const onPointerUp = () => {
				dragState.mode = "none";
				img.classList.remove("panning");
			};
			window.addEventListener("pointermove", onPointerMove);
			window.addEventListener("pointerup", onPointerUp);
			stage.addEventListener(
				"wheel",
				(e) => {
					e.preventDefault();
					const delta = e.deltaY > 0 ? 0.9 : 1.1;
					zoom = Math.min(20, Math.max(minZoom(), zoom * delta));
					render();
				},
				{ passive: false },
			);
			zoomRange.addEventListener("input", () => {
				zoom = Number(zoomRange.value);
				render();
			});

			// ---------- 确认 ----------
			function computeCropRect(): {
				x: number;
				y: number;
				w: number;
				h: number;
			} {
				const z = Math.max(zoom, minZoom());
				const w = sourceW * baseScale * z;
				const h = sourceH * baseScale * z;
				const imgLeft = (view.w - w) / 2 + panX;
				const imgTop = (view.h - h) / 2 + panY;
				const sx = (crop.x - imgLeft) / z / baseScale;
				const sy = (crop.y - imgTop) / z / baseScale;
				const sw = crop.w / z / baseScale;
				const sh = crop.h / z / baseScale;
				const x = Math.max(0, Math.min(sourceW - 1, sx));
				const y = Math.max(0, Math.min(sourceH - 1, sy));
				return {
					x,
					y,
					w: Math.max(1, Math.min(sourceW - x, sw)),
					h: Math.max(1, Math.min(sourceH - y, sh)),
				};
			}

			okBtn.addEventListener("click", () => {
				okBtn.disabled = true;
				const rect = computeCropRect();
				const wasCropped =
					rect.w < sourceW - 1 ||
					rect.h < sourceH - 1 ||
					rect.x > 1 ||
					rect.y > 1;
				const longest = Math.max(rect.w, rect.h);
				const scaleOut = longest > maxOutput ? maxOutput / longest : 1;
				const outW = Math.max(1, Math.round(rect.w * scaleOut));
				const outH = Math.max(1, Math.round(rect.h * scaleOut));
				const canvas = document.createElement("canvas");
				canvas.width = outW;
				canvas.height = outH;
				const ctx = canvas.getContext("2d");
				if (!ctx || !decodedSource) {
					okBtn.disabled = false;
					done(null);
					return;
				}
				ctx.drawImage(
					decodedSource as CanvasImageSource,
					rect.x,
					rect.y,
					rect.w,
					rect.h,
					0,
					0,
					outW,
					outH,
				);
				canvas.toBlob(
					(blob) => {
						if (!blob) {
							okBtn.disabled = false;
							done(null);
							return;
						}
						void blobToDataUrl(blob)
							.then((dataUrl) =>
								done({
									dataUrl,
									width: outW,
									height: outH,
									size: blob.size,
									sourceWidth: sourceW,
									sourceHeight: sourceH,
									wasCropped,
								}),
							)
							.catch(() => done(null));
					},
					"image/webp",
					quality,
				);
			});

			const cancel = () => done(null);
			cancelBtn.addEventListener("click", cancel);
			closeBtn.addEventListener("click", cancel);
			overlay.addEventListener("click", (e) => {
				if (e.target === overlay) cancel();
			});
			onKey = (e: KeyboardEvent) => {
				if (e.key === "Escape") cancel();
				else if (e.key === "Enter" && !(e.target instanceof HTMLInputElement)) {
					e.preventDefault();
					okBtn.click();
				}
			};
			window.addEventListener("keydown", onKey);
		}

		function cleanup() {
			if (onKey) window.removeEventListener("keydown", onKey);
			if (overlay) overlay.remove();
			if (styleEl) styleEl.remove();
		}
	});
}
