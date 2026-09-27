"use client";

import { Coffee } from "lucide-react";
// 毒鸡汤：笑着干了这碗负能量
import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import ToolShell from "../tool-shell";

export default function SoulSoupPage(): ReactElement {
	const [quote, setQuote] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [count, setCount] = useState(0);

	const fetchQuote = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const res = await fetch("https://v2.xxapi.cn/api/dujitang");
			const json = await res.json();
			if (json.code === 200 && json.data) {
				setQuote(json.data);
				setCount((c) => c + 1);
			} else {
				setError("鸡汤摊暂时收摊了，稍后再来");
			}
		} catch {
			setError("网络不给力，碗都端不稳了");
		} finally {
			setLoading(false);
		}
	}, []);

	return (
		<ToolShell icon={Coffee} title="毒鸡汤" desc="温馨提示：本汤有毒，喝前请笑">
			<div className="flex flex-col items-center justify-center gap-5 py-6">
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
					<Coffee className="h-8 w-8 text-amber-500" />
				</div>

				<div className="flex min-h-[84px] w-full items-center justify-center px-2">
					{loading ? (
						<div className="flex items-center gap-1.5">
							{[0, 150, 300].map((delay) => (
								<span
									key={delay}
									className="h-2 w-2 animate-bounce rounded-full bg-amber-400"
									style={{ animationDelay: `${delay}ms` }}
								/>
							))}
						</div>
					) : error ? (
						<span className="text-sm text-rose-400">{error}</span>
					) : quote ? (
						<p className="text-center text-base font-medium leading-relaxed">
							&ldquo;{quote}&rdquo;
						</p>
					) : (
						<p className="text-center text-sm text-slate-400">
							点击下方按钮
							<br />
							来一碗毒鸡汤
						</p>
					)}
				</div>

				<button
					type="button"
					onClick={fetchQuote}
					disabled={loading}
					className="rounded-2xl bg-amber-500 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-50"
				>
					{loading ? "熬制中..." : count > 0 ? "再来一碗" : "来一碗毒鸡汤"}
				</button>

				{count > 0 && (
					<span className="text-[11px] text-slate-400">已干 {count} 碗</span>
				)}
			</div>
		</ToolShell>
	);
}
