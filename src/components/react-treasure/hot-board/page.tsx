"use client";

import { Flame } from "lucide-react";
// 全网热榜：20 个平台实时热搜，数据走自家 /api/uapis 代理
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import ToolShell from "../tool-shell";

const PLATFORMS = [
	{ id: "weibo", name: "微博", color: "#e6162d" },
	{ id: "zhihu", name: "知乎", color: "#0066ff" },
	{ id: "douyin", name: "抖音", color: "#111" },
	{ id: "bilibili", name: "B站", color: "#00a1d6" },
	{ id: "baidu", name: "百度", color: "#2932e1" },
	{ id: "toutiao", name: "头条", color: "#f85959" },
	{ id: "tieba", name: "贴吧", color: "#4e6ef2" },
	{ id: "douban-movie", name: "豆瓣电影", color: "#00b51d" },
	{ id: "hupu", name: "虎扑", color: "#e74c3c" },
	{ id: "v2ex", name: "V2EX", color: "#333" },
	{ id: "ithome", name: "IT之家", color: "#d32f2f" },
	{ id: "36kr", name: "36氪", color: "#0479ff" },
	{ id: "juejin", name: "掘金", color: "#1e80ff" },
	{ id: "sspai", name: "少数派", color: "#d7191a" },
	{ id: "netease-music", name: "网易云", color: "#c20c0c" },
	{ id: "qq-music", name: "QQ音乐", color: "#31c27c" },
	{ id: "lol", name: "LOL", color: "#c89b3c" },
	{ id: "genshin", name: "原神", color: "#e8a946" },
	{ id: "honkai", name: "崩坏3", color: "#6c3fa0" },
	{ id: "starrail", name: "星铁", color: "#5b7fab" },
];

interface HotItem {
	index: number;
	title: string;
	hot_value: string;
	url: string;
}
interface HotResult {
	update_time: string;
	list: HotItem[];
}

function formatHot(val: string) {
	const n = Number(val);
	if (Number.isNaN(n)) return val;
	if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`;
	if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
	return n.toLocaleString();
}

export default function HotBoardPage(): ReactElement {
	const [platform, setPlatform] = useState("weibo");
	const [result, setResult] = useState<HotResult | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const fetchHot = useCallback(async (type: string) => {
		setPlatform(type);
		setLoading(true);
		setError("");
		setResult(null);
		try {
			const res = await fetch(`/api/uapis?path=misc/hotboard&type=${type}`);
			const data = await res.json();
			if (!res.ok) setError(data.message || "查询失败");
			else setResult(data);
		} catch (e) {
			setError(e instanceof Error ? e.message : "网络错误");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchHot("weibo");
	}, [fetchHot]);

	const currentColor =
		PLATFORMS.find((p) => p.id === platform)?.color || "#e6162d";

	return (
		<ToolShell icon={Flame} title="全网热榜" desc="摸鱼五分钟，尽知天下事" wide>
			<div className="flex flex-wrap gap-1.5">
				{PLATFORMS.map((p) => (
					<button
						key={p.id}
						type="button"
						onClick={() => fetchHot(p.id)}
						className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
							platform === p.id
								? "text-white shadow-md"
								: "bg-slate-100 text-slate-600 hover:bg-slate-200"
						}`}
						style={platform === p.id ? { backgroundColor: p.color } : undefined}
					>
						{p.name}
					</button>
				))}
			</div>

			<div className="mt-4 min-h-[300px]">
				{loading && (
					<div className="flex h-[300px] items-center justify-center">
						<span className="text-sm text-slate-400 animate-pulse">
							热榜加载中...
						</span>
					</div>
				)}
				{error && !loading && (
					<div className="flex h-[300px] items-center justify-center text-sm text-rose-500">
						{error}
					</div>
				)}
				{result && !loading && (
					<div className="space-y-0.5">
						{result.update_time && (
							<p className="mb-2 text-[11px] text-slate-400">
								更新于 {result.update_time}
							</p>
						)}
						{result.list.map((item, i) => (
							<a
								key={i}
								href={item.url}
								target="_blank"
								rel="noopener noreferrer"
								className="group flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-slate-100"
							>
								<span
									className={`h-5 w-5 shrink-0 text-center text-[10px] font-bold leading-5 ${
										i < 3 ? "rounded text-white" : "text-slate-400"
									}`}
									style={i < 3 ? { backgroundColor: currentColor } : undefined}
								>
									{item.index || i + 1}
								</span>
								<span className="flex-1 truncate text-sm text-slate-700 transition-colors group-hover:text-brand">
									{item.title}
								</span>
								{item.hot_value && (
									<span className="shrink-0 text-[10px] tabular-nums text-slate-400">
										{formatHot(item.hot_value)}
									</span>
								)}
							</a>
						))}
						{result.list.length === 0 && (
							<p className="py-8 text-center text-sm text-slate-400">
								暂无数据
							</p>
						)}
					</div>
				)}
			</div>
		</ToolShell>
	);
}
