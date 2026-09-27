"use client";

import { Sparkles, StickyNote, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

interface Wish {
	id: string;
	content: string;
	name: string;
	date: string; // YYYY-MM-DD
	color: string;
	rotate: number; // -3 ~ 3
}

const STORAGE_KEY = "treasure-wishes";
const MAX_LEN = 60;

const COLORS = [
	"#FEF9C3",
	"#FCE7F3",
	"#DBEAFE",
	"#DCFCE7",
	"#F3E8FF",
	"#FFEDD5",
];
const DECORATIONS = ["📌", "🖇️"];

function toDateStr(d: Date): string {
	const y = d.getFullYear();
	const m = (d.getMonth() + 1).toString().padStart(2, "0");
	const day = d.getDate().toString().padStart(2, "0");
	return `${y}-${m}-${day}`;
}

/** 基于 id 的确定性哈希：让每张便签的装饰固定，重渲染不抖动 */
function hashId(id: string): number {
	let h = 0;
	for (let i = 0; i < id.length; i++) {
		h = (h * 31 + id.charCodeAt(i)) % 997;
	}
	return h;
}

export default function WishWallPage(): ReactElement {
	const [wishes, setWishes] = useState<Wish[] | null>(null); // null = 未从 localStorage 读取
	const [content, setContent] = useState("");
	const [name, setName] = useState("");

	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			setWishes(raw ? (JSON.parse(raw) as Wish[]) : []);
		} catch {
			setWishes([]);
		}
	}, []);

	const persist = useCallback((list: Wish[]) => {
		setWishes(list);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
		} catch {
			/* ignore */
		}
	}, []);

	const handleAdd = () => {
		if (!content.trim() || !wishes) return;
		const wish: Wish = {
			id: `${Date.now()}`,
			content: content.trim(),
			name: name.trim() || "匿名",
			date: toDateStr(new Date()),
			color: COLORS[Math.floor(Math.random() * COLORS.length)],
			rotate: Math.round(Math.random() * 6 - 3),
		};
		persist([wish, ...wishes]);
		setContent("");
		setName("");
	};

	const handleDelete = (id: string) => {
		if (!wishes) return;
		if (!window.confirm("确定撕掉这张便签吗？")) return;
		persist(wishes.filter((w) => w.id !== id));
	};

	return (
		<div className="mx-auto w-full max-w-2xl px-6 pt-8 pb-12 max-sm:px-4">
			<div className="mb-10 text-center">
				<h1 className="font-averia flex items-center justify-center gap-2 text-3xl font-medium">
					<Sparkles className="text-brand h-7 w-7" />
					许愿墙
				</h1>
				<p className="text-secondary mt-2 text-sm">
					写下愿望贴上墙，等它悄悄实现
				</p>
			</div>

			{/* 写愿望表单 */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-card mb-6 rounded-3xl border p-6 backdrop-blur-sm"
			>
				<textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="写下你的愿望，如：希望今年能去看一次海"
					maxLength={MAX_LEN}
					rows={3}
					className="bg-secondary/20 focus:border-brand w-full resize-none rounded-xl border border-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400"
				/>
				<div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="署名（可选，默认匿名）"
						maxLength={12}
						className="bg-secondary/20 focus:border-brand min-w-0 flex-1 rounded-xl border border-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400"
					/>
					<div className="flex items-center justify-between gap-3 sm:justify-end">
						<span className="text-secondary shrink-0 text-xs">
							{content.length}/{MAX_LEN}
						</span>
						<button
							type="button"
							onClick={handleAdd}
							disabled={!content.trim()}
							className="bg-brand flex shrink-0 items-center justify-center gap-1 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
						>
							<StickyNote className="h-4 w-4" />
							贴上去
						</button>
					</div>
				</div>
			</motion.div>

			{/* 便签墙 */}
			{wishes === null ? (
				<div className="text-secondary py-6 text-center text-sm">加载中...</div>
			) : wishes.length === 0 ? (
				<div className="border-dashed text-secondary rounded-3xl border-2 py-10 text-center text-sm">
					墙面还空着，写下第一个愿望吧 📝
				</div>
			) : (
				<>
					<div className="text-secondary mb-4 text-center text-xs">
						已贴 {wishes.length} 个愿望
					</div>
					<div className="columns-2 gap-4 sm:columns-3">
						{wishes.map((wish, index) => {
							const h = hashId(wish.id);
							const decor = DECORATIONS[h % DECORATIONS.length];
							return (
								<motion.div
									key={wish.id}
									initial={{ opacity: 0, y: -30 }}
									animate={{ opacity: 1, y: 0, rotate: wish.rotate }}
									whileHover={{ rotate: 0 }}
									transition={{
										type: "spring",
										stiffness: 260,
										damping: 20,
										delay: Math.min(index * 0.04, 0.4),
									}}
									className="group relative mb-4 break-inside-avoid rounded-xl p-4 shadow-sm"
									style={{ backgroundColor: wish.color }}
								>
									<span
										className={`absolute -top-2.5 text-lg select-none ${h % 2 === 0 ? "left-3" : "right-3"}`}
									>
										{decor}
									</span>
									<p
										className="break-words text-sm leading-relaxed"
										style={{ color: "#334155" }}
									>
										{wish.content}
									</p>
									<div className="mt-3 flex items-center gap-2 text-xs">
										<span className="truncate text-slate-500">
											—— {wish.name}
										</span>
										<span className="ml-auto shrink-0 text-slate-400">
											{wish.date}
										</span>
										<button
											type="button"
											onClick={() => handleDelete(wish.id)}
											className="shrink-0 rounded-md p-1 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500 max-sm:opacity-50"
											title="撕掉这张便签"
										>
											<Trash2 className="h-3.5 w-3.5" />
										</button>
									</div>
								</motion.div>
							);
						})}
					</div>
				</>
			)}

			<p className="text-secondary mt-6 text-center text-xs">
				愿望保存在你的浏览器本地
			</p>
		</div>
	);
}
