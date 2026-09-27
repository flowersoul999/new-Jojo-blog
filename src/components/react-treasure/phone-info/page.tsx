"use client";

import { Smartphone } from "lucide-react";
// 手机归属地查询：省份 / 城市 / 运营商
import type { ReactElement } from "react";
import { useState } from "react";
import ToolShell from "../tool-shell";

interface PhoneResult {
	city: string;
	province: string;
	sp: string;
}

const spColors: Record<string, string> = {
	移动: "bg-green-500",
	联通: "bg-red-500",
	电信: "bg-sky-500",
};

export default function PhoneInfoPage(): ReactElement {
	const [phone, setPhone] = useState("");
	const [result, setResult] = useState<PhoneResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleQuery() {
		if (!/^1\d{10}$/.test(phone.trim())) {
			setError("请输入有效的 11 位手机号码");
			return;
		}
		setLoading(true);
		setError("");
		setResult(null);
		try {
			const res = await fetch(
				`/api/uapis?path=misc/phoneinfo&phone=${phone.trim()}`,
			);
			const data = await res.json();
			if (!res.ok) setError(data.message || "查询失败");
			else setResult(data);
		} catch (e) {
			setError(e instanceof Error ? e.message : "网络错误");
		} finally {
			setLoading(false);
		}
	}

	return (
		<ToolShell icon={Smartphone} title="手机归属" desc="查归属地，也查运营商">
			<div className="flex gap-2">
				<input
					type="tel"
					value={phone}
					onChange={(e) =>
						setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
					}
					onKeyDown={(e) => e.key === "Enter" && handleQuery()}
					placeholder="输入 11 位手机号码"
					className="flex-1 rounded-xl border border-transparent bg-slate-100 px-3 py-2.5 text-sm tabular-nums outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
				/>
				<button
					type="button"
					onClick={handleQuery}
					disabled={loading || phone.length !== 11}
					className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
				>
					{loading ? "..." : "查询"}
				</button>
			</div>

			{error && (
				<div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-500">
					{error}
				</div>
			)}

			{result && (
				<div className="mt-4 rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 p-5">
					<div className="mb-4 text-center text-2xl font-black tracking-wider tabular-nums">
						{phone}
					</div>
					<div className="grid grid-cols-3 gap-2">
						<div className="rounded-xl bg-white/60 px-3 py-2.5 text-center">
							<span className="mb-0.5 block text-[10px] text-slate-400">
								省份
							</span>
							<span className="text-sm font-bold">{result.province}</span>
						</div>
						<div className="rounded-xl bg-white/60 px-3 py-2.5 text-center">
							<span className="mb-0.5 block text-[10px] text-slate-400">
								城市
							</span>
							<span className="text-sm font-bold">{result.city}</span>
						</div>
						<div className="rounded-xl bg-white/60 px-3 py-2.5 text-center">
							<span className="mb-0.5 block text-[10px] text-slate-400">
								运营商
							</span>
							<span className="inline-flex items-center gap-1 text-sm font-bold">
								<span
									className={`h-2 w-2 rounded-full ${spColors[result.sp] || "bg-slate-400"}`}
								/>
								{result.sp}
							</span>
						</div>
					</div>
				</div>
			)}

			{!result && !error && !loading && (
				<p className="py-10 text-center text-xs text-slate-400">
					输入中国大陆手机号码，查询归属地和运营商
				</p>
			)}
		</ToolShell>
	);
}
