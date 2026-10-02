// 图片压缩工具 —— 算法移植自 jojo-blog 的 src/lib/image-compress.ts
// 保持完全相同的压缩算法与质量设定：
//   createImageBitmap 解码 → canvas 等比缩放 → toBlob('image/webp', 0.8)
// 额外补充：
//   1. 旧浏览器（无 createImageBitmap）回退到 <img> 元素解码，保证跨浏览器一致行为
//   2. 解码失败抛出明确中文错误信息，方便上层做「压缩失败」错误处理
//   3. compressImage 返回 dataUrl / width / height / size，与 jojo-blog 完全一致

export type CompressOptions = {
	quality?: number;
	maxWidth?: number;
	maxHeight?: number;
};

/** 解码结果：现代浏览器为 ImageBitmap，回退路径为 HTMLImageElement */
type DecodedImage = {
	source: ImageBitmap | HTMLImageElement;
	width: number;
	height: number;
};

/** 解码图片文件。优先使用 createImageBitmap（异步、不阻塞主线程、内存友好） */
async function decodeImage(file: File): Promise<DecodedImage> {
	if (typeof createImageBitmap === "function") {
		try {
			const bitmap = await createImageBitmap(file);
			return { source: bitmap, width: bitmap.width, height: bitmap.height };
		} catch {
			// 部分浏览器对某些编码（如 HEIC）解码失败，抛给上层统一处理
			throw new Error("无法解码该图片，可能格式不受支持或文件已损坏");
		}
	}
	// 旧浏览器回退：通过 <img> 加载后取自然尺寸
	const url = URL.createObjectURL(file);
	try {
		const img = new Image();
		img.decoding = "async";
		await new Promise<void>((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = () => reject(new Error("无法解码该图片，可能格式不受支持或文件已损坏"));
			img.src = url;
		});
		return { source: img, width: img.naturalWidth, height: img.naturalHeight };
	} finally {
		URL.revokeObjectURL(url);
	}
}

/**
 * 压缩图片为 WebP，并返回 dataURL（与 jojo-blog 的 compressImage 保持一致）
 * @param file - 原始图片文件
 * @param options - quality 默认 0.8；maxWidth / maxHeight 可选等比缩放上限
 * @returns { dataUrl, width, height, size } 压缩后的 dataURL、宽高与字节数
 */
export async function compressImage(
	file: File,
	options: CompressOptions = {},
): Promise<{
	dataUrl: string;
	width: number;
	height: number;
	size: number;
}> {
	const { quality = 0.8, maxWidth, maxHeight } = options;

	const decoded = await decodeImage(file);
	let width = decoded.width;
	let height = decoded.height;

	// 等比缩放到最大宽度/高度（与 jojo-blog 相同的缩放策略）
	if (maxWidth && width > maxWidth) {
		const ratio = maxWidth / width;
		width = maxWidth;
		height = Math.round(height * ratio);
	}
	if (maxHeight && height > maxHeight) {
		const ratio = maxHeight / height;
		height = maxHeight;
		width = Math.round(width * ratio);
	}

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("无法初始化画布");
	ctx.drawImage(decoded.source, 0, 0, width, height);

	// 输出 WebP，质量与 jojo-blog 一致（0.8）
	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(result) => {
				if (result) resolve(result);
				else reject(new Error("无法生成 WEBP 文件"));
			},
			"image/webp",
			quality,
		);
	});

	const dataUrl = await blobToDataUrl(blob);
	return { dataUrl, width, height, size: blob.size };
}

/** Blob → base64 dataURL */
function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}
