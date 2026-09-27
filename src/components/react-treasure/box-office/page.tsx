"use client";

import { Film } from "lucide-react";
// 实时电影票房：大盘汇总 + 在映影片排名
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import ToolShell from "../tool-shell";

interface Movie {
	rank: number;
	movie_id: number;
	movie_name: string;
	release_info: string;
	box_office: string;
	box_office_rate: string;
	show_count_rate: string;
	avg_show_view: string;
	sum_box_office: string;
	detail_url: string;
}
interface BoxOfficeResult {
	update_time: string;
	market: { box_office: string; view_count: string };
	list: Movie[];
}

export default function BoxOfficePage(): ReactElement {
	const [data, setData] = useState<BoxOfficeResult | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		fetch("/api/uapis?path=misc/movie-box-office")
			.then((res) => res.json().then((d) => ({ ok: res.ok, data: d })))
			.then(({ ok, data }) => {
				if (!ok) setError(data.message || "获取失败");
				else setData(data);
			})
			.catch((e) => setError(e instanceof Error ? e.message : "网络错误"))
			.finally(() => setLoading(false));
	}, []);

	const rankColors = ["bg-amber-500", "bg-slate-400", "bg-amber-700"];

	return (
		<ToolShell
			icon={Film}
			title="实时票房"
			desc="看看今天大家都在为什么电影买单"
			wide
		>
			{loading && (
				<div className="flex h-[300px] items-center justify-center">
					<span className="text-sm text-slate-400 animate-pulse">
						票房数据加载中...
					</span>
				</div>
			)}
			{error && !loading && (
				<div className="flex h-[300px] items-center justify-center text-sm text-rose-500">
					{error}
				</div>
			)}
			{data && !loading && (
				<div className="space-y-3">
					{/* 大盘汇总 */}
					<div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-sm font-bold">今日大盘</span>
							<span className="text-[10px] tabular-nums text-slate-400">
								{data.update_time}
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div className="text-center">
								<p className="text-xl font-black text-amber-600">
									{data.market.box_office}
								</p>
								<p className="text-[10px] text-slate-500">总票房</p>
							</div>
							<div className="text-center">
								<p className="text-xl font-black text-orange-600">
									{data.market.view_count}
								</p>
								<p className="text-[10px] text-slate-500">总人次</p>
							</div>
						</div>
					</div>

					{/* 影片列表 */}
					<div className="space-y-2">
						{data.list.slice(0, 15).map((movie) => (
							<a
								key={movie.movie_id}
								href={movie.detail_url}
								target="_blank"
								rel="noopener noreferrer"
								className="block rounded-2xl border p-3 transition-colors hover:bg-slate-50"
							>
								<div className="flex items-center gap-2">
									<span
										className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
											rankColors[movie.rank - 1] || "bg-slate-300"
										}`}
									>
										{movie.rank}
									</span>
									<span className="min-w-0 flex-1 truncate text-sm font-bold">
										{movie.movie_name}
									</span>
									{movie.release_info && (
										<span className="shrink-0 text-[10px] text-slate-400">
											{movie.release_info}
										</span>
									)}
									<div className="shrink-0 text-right">
										<p className="text-sm font-bold text-amber-600">
											{movie.box_office}
										</p>
										<p className="text-[10px] text-slate-400">
											{movie.box_office_rate}
										</p>
									</div>
								</div>
								<div className="mt-1.5 flex items-center gap-3 pl-7 text-[10px] text-slate-400">
									<span>排片 {movie.show_count_rate}</span>
									<span>场均 {movie.avg_show_view}人</span>
									<span>累计 {movie.sum_box_office}</span>
								</div>
							</a>
						))}
					</div>
				</div>
			)}
		</ToolShell>
	);
}
