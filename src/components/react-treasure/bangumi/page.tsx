"use client";

import { Clapperboard, Settings } from "lucide-react";
import { motion } from "motion/react";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

type Category = "anime" | "book";
type Status = "wish" | "doing" | "done";

const STORAGE_KEY = "treasure-bangumi-user";

const CATEGORY_TABS: {
	key: Category;
	label: string;
	subjectType: number;
	emoji: string;
}[] = [
	{ key: "anime", label: "动画", subjectType: 2, emoji: "📺" },
	{ key: "book", label: "图书", subjectType: 1, emoji: "📖" },
];

const STATUS_TABS: { key: Status; label: string; type: number }[] = [
	{ key: "wish", label: "想看", type: 1 },
	{ key: "doing", label: "在看", type: 3 },
	{ key: "done", label: "看过", type: 2 },
];

interface BangumiSubject {
	name: string;
	name_cn: string;
	images?: { common?: string | null } | null;
	rating?: { score?: number } | null;
}

interface CollectionItem {
	subject_id: number;
	comment: string;
	subject: BangumiSubject;
}

export default function BangumiPage(): ReactElement {
	const [userLoaded, setUserLoaded] = useState(false);
	const [username, setUsername] = useState("");
	const [inputName, setInputName] = useState("");
	const [showSettings, setShowSettings] = useState(false);
	const [category, setCategory] = useState<Category>("anime");
	const [status, setStatus] = useState<Status>("wish");
	const [items, setItems] = useState<CollectionItem[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) setUsername(saved);
		} catch {
			/* ignore */
		}
		setUserLoaded(true);
	}, []);

	const fetchData = useCallback(async () => {
		const name = username.trim();
		if (!name) return;
		setLoading(true);
		setError("");
		try {
			const subjectType =
				CATEGORY_TABS.find((t) => t.key === category)?.subjectType ?? 2;
			const type = STATUS_TABS.find((t) => t.key === status)?.type ?? 1;
			// 注意：不要手动设置 User-Agent，浏览器环境会自动携带，手动设置反而会被拒绝
			const res = await fetch(
				`https://api.bgm.tv/v0/users/${encodeURIComponent(name)}/collections?subject_type=${subjectType}&type=${type}&limit=50&offset=0`,
			);
			if (!res.ok) {
				throw new Error(
					res.status === 404
						? "这个 Bangumi 用户不存在"
						: `请求失败 (${res.status})`,
				);
			}
			const json = (await res.json()) as {
				data?: CollectionItem[];
				total?: number;
			};
			setItems(json.data ?? []);
			setTotal(json.total ?? 0);
		} catch (e) {
			setItems([]);
			setTotal(0);
			setError(
				e instanceof Error && e.message
					? `${e.message}，请检查网络或用户名是否正确`
					: "请求失败，请检查网络或用户名是否正确",
			);
		} finally {
			setLoading(false);
		}
	}, [username, category, status]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const saveUser = (name: string) => {
		const trimmed = name.trim();
		if (!trimmed) return;
		try {
			localStorage.setItem(STORAGE_KEY, trimmed);
		} catch {
			/* ignore */
		}
		setUsername(trimmed);
		setShowSettings(false);
	};

	const currentEmoji =
		CATEGORY_TABS.find((t) => t.key === category)?.emoji ?? "📺";
	const rated = items.filter((i) => (i.subject?.rating?.score ?? 0) > 0);
	const avgScore = rated.length
		? (
				rated.reduce((sum, i) => sum + (i.subject.rating?.score ?? 0), 0) /
				rated.length
			).toFixed(1)
		: "--";

	return (
		<div className="mx-auto w-full max-w-2xl px-6 pt-8 pb-12 max-sm:px-4">
			<div className="mb-10 text-center">
				<h1 className="font-averia flex items-center justify-center gap-2 text-3xl font-medium">
					<Clapperboard className="text-brand h-7 w-7" />
					追番观影清单
				</h1>
				<p className="text-secondary mt-2 text-sm">
					我的追番与观影收藏，来自 Bangumi
				</p>
			</div>

			{!userLoaded ? (
				<div className="text-secondary py-6 text-center text-sm">加载中...</div>
			) : !username ? (
				/* 首次使用：输入 Bangumi 用户名 */
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-card rounded-3xl border p-6 backdrop-blur-sm max-sm:p-5"
				>
					<div className="text-center">
						<div className="text-4xl">🎬</div>
						<h2 className="mt-3 text-sm font-medium">连接你的 Bangumi 账户</h2>
						<p className="text-secondary mt-1 text-xs">
							输入 Bangumi 用户名（不是用户 ID），同步你的追番 / 观影收藏
						</p>
					</div>
					<div className="mt-5 flex flex-col gap-3 sm:flex-row">
						<input
							value={inputName}
							onChange={(e) => setInputName(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && saveUser(inputName)}
							placeholder="Bangumi 用户名"
							maxLength={30}
							className="bg-secondary/20 focus:border-brand min-w-0 flex-1 rounded-xl border border-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400"
						/>
						<button
							type="button"
							onClick={() => saveUser(inputName)}
							disabled={!inputName.trim()}
							className="bg-brand shrink-0 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
						>
							开始同步
						</button>
					</div>
					<p className="text-secondary mt-4 text-center text-xs">
						用户名仅保存在你的浏览器本地
					</p>
				</motion.div>
			) : (
				<>
					{/* 类型 + 状态 两组 tab */}
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-5 flex flex-col items-center gap-2.5"
					>
						<div className="bg-secondary/20 flex rounded-full p-1">
							{CATEGORY_TABS.map((tab) => (
								<button
									type="button"
									key={tab.key}
									onClick={() => setCategory(tab.key)}
									className={`rounded-full px-5 py-1.5 text-xs font-medium transition-colors ${
										category === tab.key
											? "bg-brand text-white"
											: "text-secondary"
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>
						<div className="bg-secondary/20 flex rounded-full p-1">
							{STATUS_TABS.map((tab) => (
								<button
									type="button"
									key={tab.key}
									onClick={() => setStatus(tab.key)}
									className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
										status === tab.key
											? "bg-brand text-white"
											: "text-secondary"
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>
					</motion.div>

					{/* 统计行 + 用户名修改入口 */}
					<div className="text-secondary mb-4 flex items-center justify-between text-xs">
						<span>
							共 {total} 部 · 平均分 {avgScore}
						</span>
						<button
							type="button"
							onClick={() => {
								setInputName(username);
								setShowSettings(true);
							}}
							className="flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors hover:bg-secondary/20"
						>
							<Settings className="h-3.5 w-3.5" />
							<span className="max-w-24 truncate">{username}</span>
						</button>
					</div>

					{/* 内容区 */}
					{loading ? (
						/* 加载骨架：pulse 灰块网格 */
						<div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
							{Array.from({ length: 8 }).map((_, i) => (
								<div key={i}>
									<div className="bg-secondary/20 aspect-[3/4] animate-pulse rounded-xl" />
									<div className="bg-secondary/20 mt-2 h-3 w-3/4 animate-pulse rounded" />
									<div className="bg-secondary/20 mt-1.5 h-3 w-1/3 animate-pulse rounded" />
								</div>
							))}
						</div>
					) : error ? (
						/* 错误提示 */
						<div className="border-dashed text-secondary rounded-3xl border-2 px-6 py-10 text-center text-sm">
							<div className="text-3xl">😵</div>
							<div className="mt-2">{error}</div>
						</div>
					) : items.length === 0 ? (
						/* 空状态 */
						<div className="border-dashed text-secondary rounded-3xl border-2 py-10 text-center text-sm">
							<div className="text-3xl">{currentEmoji}</div>
							<div className="mt-2">
								这个分类下还没有收藏，去 Bangumi 添加一个吧 🌱
							</div>
						</div>
					) : (
						/* 封面墙 */
						<div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
							{items.map((item, index) => {
								const subject = item.subject;
								const title = subject?.name_cn || subject?.name || "未知标题";
								const score = subject?.rating?.score ?? 0;
								const cover = subject?.images?.common;
								return (
									<motion.a
										key={item.subject_id}
										href={`https://bgm.tv/subject/${item.subject_id}`}
										target="_blank"
										rel="noreferrer"
										initial={{ opacity: 0, y: 12 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: Math.min(index, 12) * 0.04 }}
										className="group block transition-transform duration-300 hover:-translate-y-1"
									>
										{cover ? (
											<img
												src={cover}
												alt={title}
												loading="lazy"
												className="aspect-[3/4] w-full rounded-xl border object-cover transition-transform duration-300 group-hover:scale-[1.03]"
											/>
										) : (
											<div className="bg-secondary/20 flex aspect-[3/4] w-full items-center justify-center rounded-xl border text-2xl">
												{currentEmoji}
											</div>
										)}
										<div className="mt-1.5 line-clamp-2 min-h-[2.5em] text-xs leading-relaxed font-medium">
											{title}
										</div>
										<div className="text-brand mt-0.5 text-xs font-medium">
											⭐ {score > 0 ? score : "--"}
										</div>
										{item.comment && (
											<p className="text-secondary mt-1 line-clamp-2 text-xs italic">
												“{item.comment}”
											</p>
										)}
									</motion.a>
								);
							})}
						</div>
					)}

					<p className="text-secondary mt-6 text-center text-xs">
						数据来自 Bangumi 开放 API · 每页展示 50 条
					</p>
				</>
			)}

			{/* 修改用户名弹窗 */}
			{showSettings && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
					onClick={() => setShowSettings(false)}
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.15 }}
						onClick={(e) => e.stopPropagation()}
						className="bg-card w-full max-w-sm rounded-3xl border p-6"
					>
						<div className="text-sm font-medium">修改 Bangumi 用户名</div>
						<input
							value={inputName}
							onChange={(e) => setInputName(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && saveUser(inputName)}
							placeholder="Bangumi 用户名"
							maxLength={30}
							className="bg-secondary/20 focus:border-brand mt-4 w-full rounded-xl border border-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400"
						/>
						<div className="mt-4 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setShowSettings(false)}
								className="bg-secondary/20 text-secondary rounded-xl px-4 py-2 text-sm transition-opacity hover:opacity-80"
							>
								取消
							</button>
							<button
								type="button"
								onClick={() => saveUser(inputName)}
								disabled={!inputName.trim()}
								className="bg-brand rounded-xl px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
							>
								保存
							</button>
						</div>
					</motion.div>
				</div>
			)}
		</div>
	);
}
