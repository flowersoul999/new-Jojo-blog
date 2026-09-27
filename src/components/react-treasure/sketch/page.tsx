"use client";

import { Download, Eraser, Palette, Trash2, Undo2 } from "lucide-react";
import { motion } from "motion/react";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

const COLORS = [
	"#334155",
	"#ef4444",
	"#f59e0b",
	"#22c55e",
	"#3b82f6",
	"#a855f7",
	"#ec4899",
	"#14b8a6",
];
const SIZES = [
	{ label: "细", value: 4 },
	{ label: "中", value: 8 },
	{ label: "粗", value: 16 },
];
const MAX_UNDO = 10;

export default function SketchPage(): ReactElement {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const drawingRef = useRef(false);
	const undoStackRef = useRef<string[]>([]);
	const [color, setColor] = useState(COLORS[0]);
	const [size, setSize] = useState(8);
	const [eraser, setEraser] = useState(false);
	const [canUndo, setCanUndo] = useState(false);

	// 初始化画布（白色底，适配高分屏）
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const parent = canvas.parentElement!;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const cssWidth = parent.clientWidth;
		const cssHeight = Math.round(cssWidth * 0.75);
		canvas.width = cssWidth * dpr;
		canvas.height = cssHeight * dpr;
		canvas.style.width = `${cssWidth}px`;
		canvas.style.height = `${cssHeight}px`;
		const ctx = canvas.getContext("2d")!;
		ctx.scale(dpr, dpr);
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, cssWidth, cssHeight);
	}, []);

	const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		return { x: e.clientX - rect.left, y: e.clientY - rect.top };
	};

	const pushSnapshot = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const data = canvas.toDataURL("image/png");
		if (undoStackRef.current.length >= MAX_UNDO) undoStackRef.current.shift();
		undoStackRef.current.push(data);
		setCanUndo(true);
	};

	const handleDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		pushSnapshot();
		canvas.setPointerCapture(e.pointerId);
		drawingRef.current = true;
		const ctx = canvas.getContext("2d")!;
		const { x, y } = getPos(e);
		ctx.beginPath();
		ctx.moveTo(x, y);
		// 单击也画一个点
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle = eraser ? "#ffffff" : color;
		ctx.lineWidth = eraser ? size * 3 : size;
		ctx.lineTo(x + 0.01, y + 0.01);
		ctx.stroke();
	};

	const handleMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!drawingRef.current) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const { x, y } = getPos(e);
		ctx.strokeStyle = eraser ? "#ffffff" : color;
		ctx.lineWidth = eraser ? size * 3 : size;
		ctx.lineTo(x, y);
		ctx.stroke();
	};

	const handleUp = () => {
		drawingRef.current = false;
	};

	const handleUndo = () => {
		const canvas = canvasRef.current;
		const data = undoStackRef.current.pop();
		if (!canvas || !data) return;
		const ctx = canvas.getContext("2d")!;
		const img = new Image();
		img.onload = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
			ctx.restore();
		};
		img.src = data;
		setCanUndo(undoStackRef.current.length > 0);
	};

	const handleClear = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		pushSnapshot();
		const ctx = canvas.getContext("2d")!;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
	};

	const handleDownload = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const link = document.createElement("a");
		link.download = `涂鸦-${new Date().toLocaleDateString("zh-CN").replaceAll("/", "")}.png`;
		link.href = canvas.toDataURL("image/png");
		link.click();
	};

	return (
		<div className="mx-auto w-full max-w-2xl px-6 pt-8 pb-12 max-sm:px-4">
			<div className="mb-10 text-center">
				<h1 className="font-averia flex items-center justify-center gap-2 text-3xl font-medium">
					<Palette className="text-brand h-7 w-7" />
					涂鸦板
				</h1>
				<p className="text-secondary mt-2 text-sm">随手画画，给心情放个假</p>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-card rounded-3xl border p-5 backdrop-blur-sm"
			>
				{/* 工具栏 */}
				<div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3">
					{/* 颜色 */}
					<div className="flex items-center gap-2">
						{COLORS.map((c) => (
							<button
								type="button"
								key={c}
								onClick={() => {
									setColor(c);
									setEraser(false);
								}}
								className={`h-6 w-6 rounded-full transition-transform ${color === c && !eraser ? "scale-125 ring-2 ring-gray-400 ring-offset-2" : ""} ${c === "#334155" ? "" : "shadow-inner"}`}
								style={{ backgroundColor: c }}
								title={`颜色 ${c}`}
							/>
						))}
					</div>

					{/* 笔粗细 */}
					<div className="bg-secondary/20 flex items-center gap-1 rounded-full p-1">
						{SIZES.map((s) => (
							<button
								type="button"
								key={s.value}
								onClick={() => setSize(s.value)}
								className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
									size === s.value && !eraser
										? "bg-brand text-white"
										: "text-secondary"
								}`}
							>
								{s.label}
							</button>
						))}
					</div>

					{/* 橡皮 */}
					<button
						type="button"
						onClick={() => setEraser((v) => !v)}
						className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors ${
							eraser
								? "bg-brand text-white"
								: "bg-secondary/30 text-secondary hover:text-brand"
						}`}
					>
						<Eraser className="h-3.5 w-3.5" />
						橡皮
					</button>
				</div>

				{/* 画布 */}
				<div className="overflow-hidden rounded-2xl border shadow-inner">
					<canvas
						ref={canvasRef}
						onPointerDown={handleDown}
						onPointerMove={handleMove}
						onPointerUp={handleUp}
						onPointerLeave={handleUp}
						className="block w-full cursor-crosshair touch-none bg-white"
					/>
				</div>

				{/* 操作按钮 */}
				<div className="mt-4 flex items-center justify-center gap-3">
					<button
						type="button"
						onClick={handleUndo}
						disabled={!canUndo}
						className="text-secondary hover:text-brand flex items-center gap-1.5 rounded-xl bg-secondary/30 px-4 py-2 text-xs transition-colors disabled:opacity-40"
					>
						<Undo2 className="h-4 w-4" />
						撤销
					</button>
					<button
						type="button"
						onClick={handleClear}
						className="text-secondary hover:text-red-500 flex items-center gap-1.5 rounded-xl bg-secondary/30 px-4 py-2 text-xs transition-colors"
					>
						<Trash2 className="h-4 w-4" />
						清空
					</button>
					<button
						type="button"
						onClick={handleDownload}
						className="bg-brand flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
					>
						<Download className="h-4 w-4" />
						保存图片
					</button>
				</div>
			</motion.div>
		</div>
	);
}
