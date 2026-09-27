"use client";

import { Check, Copy, Wrench } from "lucide-react";
import { motion } from "motion/react";
import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type ToolTab = "color" | "regex" | "timestamp" | "json";

const TABS: { key: ToolTab; label: string; emoji: string }[] = [
	{ key: "color", label: "颜色", emoji: "🎨" },
	{ key: "regex", label: "正则", emoji: "🔍" },
	{ key: "timestamp", label: "时间戳", emoji: "⏱️" },
	{ key: "json", label: "JSON", emoji: "🧾" },
];

const INPUT_CLS =
	"bg-secondary/20 w-full rounded-xl border border-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand";
const COPY_BTN_CLS =
	"bg-secondary/30 text-secondary hover:text-brand inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-colors";
const PRIMARY_BTN_CLS =
	"bg-brand rounded-full px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90";
const GHOST_BTN_CLS =
	"bg-secondary/30 text-secondary hover:text-brand rounded-full px-4 py-1.5 text-xs transition-colors";
const ERROR_CLS = "text-red-500 text-xs";

/* 通用复制按钮（navigator.clipboard + 已复制提示） */
function CopyButton({
	text,
	label = "复制",
}: {
	text: string;
	label?: string;
}) {
	const [copied, setCopied] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	const handleCopy = async () => {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(() => setCopied(false), 1500);
		} catch {
			/* 剪贴板不可用时静默失败 */
		}
	};

	return (
		<button type="button" onClick={handleCopy} className={COPY_BTN_CLS}>
			{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
			{copied ? "已复制" : label}
		</button>
	);
}

/* ------------------------------ 颜色转换 ------------------------------ */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const raw = hex.trim().replace(/^#/, "");
	if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw)) return null;
	const full =
		raw.length === 3
			? raw
					.split("")
					.map((c) => c + c)
					.join("")
			: raw;
	const num = Number.parseInt(full, 16);
	return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHsl(
	r: number,
	g: number,
	b: number,
): { h: number; s: number; l: number } {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;
	let h = 0;
	let s = 0;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
		else if (max === gn) h = (bn - rn) / d + 2;
		else h = (rn - gn) / d + 4;
		h /= 6;
	}
	return {
		h: Math.round(h * 360) % 360,
		s: Math.round(s * 100),
		l: Math.round(l * 100),
	};
}

const toHexPair = (n: number) => n.toString(16).padStart(2, "0");

function ColorRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-secondary/20 flex items-center gap-3 rounded-xl px-4 py-2.5">
			<span className="text-secondary w-9 shrink-0 text-xs">{label}</span>
			<span className="min-w-0 flex-1 break-all text-sm">{value}</span>
			<CopyButton text={value} />
		</div>
	);
}

function ColorTool() {
	const [hex, setHex] = useState("#35bfab");
	const rgb = hexToRgb(hex);
	const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
	const normalized = rgb
		? `#${toHexPair(rgb.r)}${toHexPair(rgb.g)}${toHexPair(rgb.b)}`
		: "";
	const invalid = hex.trim() !== "" && !rgb;

	return (
		<div className="flex flex-col gap-4">
			<div>
				<div className="text-secondary mb-1.5 text-xs">HEX 颜色值</div>
				<input
					value={hex}
					onChange={(e) => setHex(e.target.value)}
					placeholder="#35bfab"
					spellCheck={false}
					className={INPUT_CLS}
				/>
				{invalid && (
					<div className={`mt-1.5 ${ERROR_CLS}`}>
						HEX 格式不正确，试试 #35bfab 或 #abc
					</div>
				)}
			</div>

			{rgb && hsl ? (
				<>
					<div
						className="h-24 w-full rounded-2xl border"
						style={{ backgroundColor: normalized }}
					/>
					<ColorRow label="HEX" value={normalized} />
					<ColorRow label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} />
					<ColorRow label="HSL" value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} />
				</>
			) : (
				<div className="text-secondary bg-secondary/20 rounded-2xl px-4 py-8 text-center text-xs">
					输入合法 HEX 后这里会显示色块和转换结果
				</div>
			)}
		</div>
	);
}

/* ------------------------------ 正则测试 ------------------------------ */

interface RegexMatch {
	text: string;
	index: number;
}

function RegexTool() {
	const [pattern, setPattern] = useState("");
	const [flags, setFlags] = useState("g");
	const [text, setText] = useState("");

	const { re, error } = useMemo<{ re: RegExp | null; error: string }>(() => {
		if (!pattern.trim()) return { re: null, error: "" };
		try {
			return { re: new RegExp(pattern, flags), error: "" };
		} catch (err) {
			return {
				re: null,
				error: err instanceof Error ? err.message : "正则表达式不合法",
			};
		}
	}, [pattern, flags]);

	const matches = useMemo<RegexMatch[]>(() => {
		if (!re || !text) return [];
		const tester = new RegExp(re.source, re.flags);
		const result: RegexMatch[] = [];
		let m = tester.exec(text);
		while (m !== null) {
			result.push({ text: m[0], index: m.index });
			if (!tester.global) break;
			if (m[0] === "") tester.lastIndex++;
			if (result.length >= 999) break;
			m = tester.exec(text);
		}
		return result;
	}, [re, text]);

	// 按匹配位置切段渲染，匹配段用高亮包裹
	const segments = useMemo(() => {
		if (!re) return null;
		const parts: { text: string; hit: boolean }[] = [];
		let last = 0;
		for (const m of matches) {
			if (m.index > last)
				parts.push({ text: text.slice(last, m.index), hit: false });
			if (m.text) parts.push({ text: m.text, hit: true });
			last = m.index + m.text.length;
		}
		if (last < text.length) parts.push({ text: text.slice(last), hit: false });
		return parts;
	}, [re, matches, text]);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2 max-sm:flex-col">
				<div className="flex-1">
					<div className="text-secondary mb-1.5 text-xs">正则表达式</div>
					<input
						value={pattern}
						onChange={(e) => setPattern(e.target.value)}
						placeholder="\d+"
						spellCheck={false}
						className={INPUT_CLS}
					/>
				</div>
				<div className="w-24 max-sm:w-full">
					<div className="text-secondary mb-1.5 text-xs">flags</div>
					<input
						value={flags}
						onChange={(e) => setFlags(e.target.value)}
						placeholder="g"
						spellCheck={false}
						className={INPUT_CLS}
					/>
				</div>
			</div>

			<div>
				<div className="text-secondary mb-1.5 text-xs">测试文本</div>
				<textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="粘贴一段文本，匹配结果会实时高亮"
					className={`${INPUT_CLS} h-28 resize-none`}
				/>
			</div>

			{pattern.trim() === "" ? (
				<div className="text-secondary bg-secondary/20 rounded-2xl px-4 py-6 text-center text-xs">
					输入正则表达式开始测试
				</div>
			) : error ? (
				<div className={ERROR_CLS}>正则表达式不合法：{error}</div>
			) : (
				<>
					<div className="text-secondary text-xs">
						共{" "}
						<span className="font-averia text-brand text-sm font-medium">
							{matches.length}
						</span>{" "}
						处匹配
					</div>

					{segments && (
						<div className="bg-secondary/20 max-h-44 overflow-auto rounded-xl px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap">
							{segments.map((p, i) =>
								p.hit ? (
									<mark
										key={i}
										className="bg-brand/30 text-inherit rounded px-0.5"
									>
										{p.text}
									</mark>
								) : (
									<span key={i}>{p.text}</span>
								),
							)}
						</div>
					)}

					{matches.length > 0 && (
						<div className="max-h-40 overflow-auto">
							{matches.map((m, i) => (
								<div
									key={i}
									className="flex items-center gap-2 border-b border-dashed py-1.5 text-xs last:border-b-0"
								>
									<span className="text-secondary w-7 shrink-0">#{i + 1}</span>
									<code className="bg-brand/10 text-brand min-w-0 flex-1 truncate rounded px-1.5 py-0.5">
										{m.text || "(空匹配)"}
									</code>
									<span className="text-secondary shrink-0">
										index {m.index}
									</span>
								</div>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}

/* ------------------------------ 时间戳转换 ------------------------------ */

const pad2 = (n: number) => String(n).padStart(2, "0");

function formatDateTime(d: Date): string {
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

type ConvertResult = { state: "empty" | "ok" | "error"; value: string };

function TimestampTool() {
	const [now, setNow] = useState<number | null>(null);
	const [tsInput, setTsInput] = useState("");
	const [dateInput, setDateInput] = useState("");

	// 当前时间戳只在客户端 useEffect 后渲染，避免水合错位
	useEffect(() => {
		const tick = () => setNow(Math.floor(Date.now() / 1000));
		tick();
		const timer = setInterval(tick, 1000);
		return () => clearInterval(timer);
	}, []);

	const tsResult = useMemo<ConvertResult>(() => {
		const raw = tsInput.trim();
		if (raw === "") return { state: "empty", value: "" };
		const n = Number(raw);
		if (!Number.isFinite(n))
			return { state: "error", value: "请输入有效的数字时间戳" };
		const d = new Date(n * 1000);
		if (Number.isNaN(d.getTime()))
			return { state: "error", value: "时间戳超出有效范围" };
		return { state: "ok", value: formatDateTime(d) };
	}, [tsInput]);

	const dateResult = useMemo<ConvertResult>(() => {
		if (dateInput === "") return { state: "empty", value: "" };
		const t = new Date(dateInput).getTime();
		if (Number.isNaN(t)) return { state: "error", value: "日期时间无效" };
		return { state: "ok", value: String(Math.floor(t / 1000)) };
	}, [dateInput]);

	return (
		<div className="flex flex-col gap-4">
			<div className="bg-secondary/20 flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
				<div className="min-w-0">
					<div className="text-secondary text-xs">当前时间戳（秒）</div>
					<div className="font-averia text-brand mt-0.5 truncate text-xl font-medium">
						{now === null ? "——" : now}
					</div>
				</div>
				<CopyButton text={now === null ? "" : String(now)} />
			</div>

			<div>
				<div className="text-secondary mb-1.5 text-xs">时间戳 → 日期时间</div>
				<input
					value={tsInput}
					onChange={(e) => setTsInput(e.target.value)}
					placeholder="例如 1756512000"
					inputMode="numeric"
					className={INPUT_CLS}
				/>
				{tsResult.state === "ok" && (
					<div className="mt-2 flex items-center gap-2">
						<span className="text-brand min-w-0 flex-1 break-all text-sm">
							{tsResult.value}
						</span>
						<CopyButton text={tsResult.value} />
					</div>
				)}
				{tsResult.state === "error" && (
					<div className={`mt-1.5 ${ERROR_CLS}`}>{tsResult.value}</div>
				)}
			</div>

			<div>
				<div className="text-secondary mb-1.5 text-xs">日期时间 → 时间戳</div>
				<input
					type="datetime-local"
					value={dateInput}
					onChange={(e) => setDateInput(e.target.value)}
					className={INPUT_CLS}
				/>
				{dateResult.state === "ok" && (
					<div className="mt-2 flex items-center gap-2">
						<span className="font-averia text-brand min-w-0 flex-1 break-all text-sm font-medium">
							{dateResult.value}
						</span>
						<CopyButton text={dateResult.value} />
					</div>
				)}
				{dateResult.state === "error" && (
					<div className={`mt-1.5 ${ERROR_CLS}`}>{dateResult.value}</div>
				)}
			</div>
		</div>
	);
}

/* ------------------------------ JSON 格式化 ------------------------------ */

function JsonTool() {
	const [input, setInput] = useState("");
	const [output, setOutput] = useState("");
	const [error, setError] = useState("");

	const run = (minify: boolean) => {
		if (input.trim() === "") {
			setError("请先输入 JSON 内容");
			setOutput("");
			return;
		}
		try {
			const obj = JSON.parse(input);
			setOutput(minify ? JSON.stringify(obj) : JSON.stringify(obj, null, 2));
			setError("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "JSON 解析失败");
			setOutput("");
		}
	};

	const clear = () => {
		setInput("");
		setOutput("");
		setError("");
	};

	return (
		<div className="flex flex-col gap-4">
			<div>
				<div className="text-secondary mb-1.5 text-xs">JSON 输入</div>
				<textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder='{"name": "Jojo", "skills": ["react", "next"]}'
					spellCheck={false}
					className={`${INPUT_CLS} h-32 resize-none font-mono`}
				/>
			</div>

			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => run(false)}
					className={PRIMARY_BTN_CLS}
				>
					格式化
				</button>
				<button
					type="button"
					onClick={() => run(true)}
					className={PRIMARY_BTN_CLS}
				>
					压缩
				</button>
				{(input || output || error) !== "" && (
					<button
						type="button"
						onClick={clear}
						className={`${GHOST_BTN_CLS} ml-auto`}
					>
						清空
					</button>
				)}
			</div>

			{error && <div className={ERROR_CLS}>解析失败：{error}</div>}

			{output && (
				<div>
					<div className="mb-1.5 flex items-center justify-between">
						<div className="text-secondary text-xs">结果</div>
						<CopyButton text={output} />
					</div>
					<pre className="bg-secondary/20 max-h-72 overflow-auto rounded-xl p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
						{output}
					</pre>
				</div>
			)}
		</div>
	);
}

/* ------------------------------ 主页 ------------------------------ */

export default function DevToolsPage(): ReactElement {
	const [tab, setTab] = useState<ToolTab>("color");

	return (
		<div className="mx-auto w-full max-w-2xl px-6 pt-8 pb-12 max-sm:px-4">
			<div className="mb-10 text-center">
				<h1 className="font-averia flex items-center justify-center gap-2 text-3xl font-medium">
					<Wrench className="text-brand h-7 w-7" />
					前端小工具箱
				</h1>
				<p className="text-secondary mt-2 text-sm">
					颜色 · 正则 · 时间戳 · JSON，开发摸鱼两相宜
				</p>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-card rounded-3xl border p-6 backdrop-blur-sm max-sm:p-4"
			>
				{/* 工具切换 */}
				<div className="bg-secondary/20 mx-auto mb-6 flex w-fit rounded-full p-1">
					{TABS.map((t) => (
						<button
							type="button"
							key={t.key}
							onClick={() => setTab(t.key)}
							className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-medium transition-colors max-sm:px-3 ${
								tab === t.key
									? "bg-brand text-white shadow-sm"
									: "text-secondary"
							}`}
						>
							<span>{t.emoji}</span>
							{t.label}
						</button>
					))}
				</div>

				{tab === "color" && <ColorTool />}
				{tab === "regex" && <RegexTool />}
				{tab === "timestamp" && <TimestampTool />}
				{tab === "json" && <JsonTool />}
			</motion.div>

			<p className="text-secondary mt-6 text-center text-xs">
				所有转换都在你的浏览器本地完成
			</p>
		</div>
	);
}
