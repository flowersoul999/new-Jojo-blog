"use client";

import {
	Download,
	Link as LinkIcon,
	QrCode,
	Type as TypeIcon,
	Wifi,
} from "lucide-react";
// 二维码生成：文本 / 网址 / WiFi，实时预览，可下载
import type { ReactElement } from "react";
import { useState } from "react";
import ToolShell from "../tool-shell";

type Mode = "text" | "url" | "wifi";

const MODES: Array<{ id: Mode; name: string; icon: typeof TypeIcon }> = [
	{ id: "text", name: "文本", icon: TypeIcon },
	{ id: "url", name: "网址", icon: LinkIcon },
	{ id: "wifi", name: "WiFi", icon: Wifi },
];

export default function QrcodePage(): ReactElement {
	const [mode, setMode] = useState<Mode>("text");
	const [text, setText] = useState("");
	const [url, setUrl] = useState("");
	const [wifiName, setWifiName] = useState("");
	const [wifiPwd, setWifiPwd] = useState("");
	const [wifiEncrypt, setWifiEncrypt] = useState("WPA");

	// 二维码内容：WiFi 用标准 WIFI: 协议，相机扫码可直接连网
	const content =
		mode === "wifi" && wifiName
			? `WIFI:T:${wifiEncrypt};S:${wifiName};P:${wifiPwd};;`
			: mode === "url"
				? url
				: text;
	const qrSrc = content
		? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(content)}`
		: "";

	return (
		<ToolShell icon={QrCode} title="二维码" desc="文本、网址、WiFi，扫一扫就行">
			<div className="flex gap-1.5">
				{MODES.map((m) => {
					const Icon = m.icon;
					return (
						<button
							key={m.id}
							type="button"
							onClick={() => setMode(m.id)}
							className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium transition-all ${
								mode === m.id
									? "bg-brand text-white"
									: "bg-slate-100 text-slate-600 hover:bg-slate-200"
							}`}
						>
							<Icon className="h-3.5 w-3.5" />
							{m.name}
						</button>
					);
				})}
			</div>

			<div className="mt-4">
				{mode === "text" && (
					<textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="输入想编码的文字..."
						rows={4}
						className="w-full resize-none rounded-xl border border-transparent bg-slate-100 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
					/>
				)}
				{mode === "url" && (
					<input
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="https://example.com"
						className="w-full rounded-xl border border-transparent bg-slate-100 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
					/>
				)}
				{mode === "wifi" && (
					<div className="space-y-2">
						<input
							value={wifiName}
							onChange={(e) => setWifiName(e.target.value)}
							placeholder="WiFi 名称（SSID）"
							className="w-full rounded-xl border border-transparent bg-slate-100 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
						/>
						<div className="flex gap-2">
							<input
								value={wifiPwd}
								onChange={(e) => setWifiPwd(e.target.value)}
								placeholder="WiFi 密码"
								className="flex-1 rounded-xl border border-transparent bg-slate-100 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
							/>
							<select
								value={wifiEncrypt}
								onChange={(e) => setWifiEncrypt(e.target.value)}
								className="shrink-0 rounded-xl border border-transparent bg-slate-100 px-2 text-sm outline-none"
							>
								<option value="WPA">WPA/WPA2</option>
								<option value="WEP">WEP</option>
								<option value="nopass">无密码</option>
							</select>
						</div>
					</div>
				)}
			</div>

			{/* 预览 */}
			<div className="mt-4 flex flex-col items-center gap-3">
				<div className="flex h-56 w-56 items-center justify-center rounded-2xl border-2 border-dashed bg-white">
					{qrSrc ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={qrSrc} alt="二维码" className="h-full w-full p-2" />
					) : (
						<div className="flex flex-col items-center gap-2 text-slate-300">
							<QrCode className="h-14 w-14" />
							<span className="text-[10px]">输入内容后自动生成</span>
						</div>
					)}
				</div>

				{qrSrc && (
					<a
						href={qrSrc}
						download="qrcode.png"
						target="_blank"
						className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
						rel="noopener"
					>
						<Download className="h-3.5 w-3.5" /> 下载二维码
					</a>
				)}
			</div>
		</ToolShell>
	);
}
