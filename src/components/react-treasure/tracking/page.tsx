"use client";

import { Truck } from "lucide-react";
// 快递查询：主流快递物流轨迹时间线
import type { ReactElement } from "react";
import { useState } from "react";
import ToolShell from "../tool-shell";

interface Track {
	time: string;
	context: string;
}
interface TrackingResult {
	tracking_number: string;
	carrier_name: string;
	status: string;
	status_code: string;
	completed_at: string;
	tracks: Track[];
}

const statusColors: Record<string, string> = {
	pending: "bg-slate-400",
	picked_up: "bg-blue-500",
	in_transit: "bg-amber-500",
	out_for_delivery: "bg-orange-500",
	delivered: "bg-green-500",
	exception: "bg-rose-500",
	unknown: "bg-slate-400",
};

export default function TrackingPage(): ReactElement {
	const [trackingNumber, setTrackingNumber] = useState("");
	const [phoneTail, setPhoneTail] = useState("");
	const [result, setResult] = useState<TrackingResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleQuery() {
		if (!trackingNumber.trim()) return;
		setLoading(true);
		setError("");
		setResult(null);
		try {
			const params = new URLSearchParams({
				path: "misc/tracking/query",
				tracking_number: trackingNumber.trim(),
			});
			if (phoneTail.trim()) params.set("phone", phoneTail.trim());
			const res = await fetch(`/api/uapis?${params.toString()}`);
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
		<ToolShell icon={Truck} title="快递查询" desc="一个单号，追踪全网快递">
			<div className="space-y-2">
				<input
					type="text"
					value={trackingNumber}
					onChange={(e) => setTrackingNumber(e.target.value.trim())}
					onKeyDown={(e) => e.key === "Enter" && handleQuery()}
					placeholder="输入快递单号"
					className="w-full rounded-xl border border-transparent bg-slate-100 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
				/>
				<div className="flex gap-2">
					<input
						type="text"
						value={phoneTail}
						onChange={(e) =>
							setPhoneTail(e.target.value.replace(/\D/g, "").slice(0, 4))
						}
						onKeyDown={(e) => e.key === "Enter" && handleQuery()}
						placeholder="手机尾号（顺丰等需要，可选）"
						className="flex-1 rounded-xl border border-transparent bg-slate-100 px-3 py-2.5 text-sm tabular-nums outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
					/>
					<button
						type="button"
						onClick={handleQuery}
						disabled={loading || !trackingNumber.trim()}
						className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
					>
						{loading ? "..." : "查询"}
					</button>
				</div>
			</div>

			{error && (
				<div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-500">
					{error}
				</div>
			)}

			{result && !loading && (
				<div className="mt-4 space-y-3">
					<div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 p-3">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-sm font-bold">{result.carrier_name}</span>
							<span
								className={`rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${
									statusColors[result.status_code] || "bg-slate-400"
								}`}
							>
								{result.status}
							</span>
						</div>
						<p className="text-[10px] tabular-nums text-slate-400">
							{result.tracking_number}
						</p>
						{result.completed_at && (
							<p className="mt-1 text-[10px] text-green-600">
								签收时间：{result.completed_at}
							</p>
						)}
					</div>

					<div>
						{result.tracks.map((track, i) => (
							<div key={i} className="flex gap-3">
								<div className="flex w-5 shrink-0 flex-col items-center">
									<div
										className={`h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? "bg-brand" : "bg-slate-300"}`}
									/>
									{i < result.tracks.length - 1 && (
										<div className="min-h-[20px] w-px flex-1 bg-slate-200" />
									)}
								</div>
								<div className="min-w-0 pb-3">
									<p
										className={`text-xs leading-relaxed ${i === 0 ? "font-medium" : "text-slate-500"}`}
									>
										{track.context}
									</p>
									<p className="mt-0.5 text-[10px] tabular-nums text-slate-400">
										{track.time}
									</p>
								</div>
							</div>
						))}
						{result.tracks.length === 0 && (
							<p className="py-4 text-center text-xs text-slate-400">
								暂无物流轨迹
							</p>
						)}
					</div>
				</div>
			)}

			{!result && !loading && !error && (
				<p className="py-10 text-center text-[11px] leading-relaxed text-slate-400">
					支持中通、圆通、韵达、申通、极兔、顺丰、京东、EMS、德邦等
				</p>
			)}
		</ToolShell>
	);
}
