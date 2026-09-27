"use client";

import {
	Brain,
	Coffee,
	Pause,
	Play,
	RotateCcw,
	SkipForward,
	Timer,
} from "lucide-react";
import { motion } from "motion/react";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

const FOCUS_MIN = 25;
const BREAK_MIN = 5;
const FOCUS_MS = FOCUS_MIN * 60 * 1000;
const BREAK_MS = BREAK_MIN * 60 * 1000;
const STATS_KEY = "treasure-pomodoro-stats";

type Mode = "focus" | "break";

function getTodayKey(d = new Date()): string {
	return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

interface Stats {
	date: string;
	count: number;
}

function loadTodayCount(): number {
	try {
		const raw = localStorage.getItem(STATS_KEY);
		if (raw) {
			const s = JSON.parse(raw) as Stats;
			if (s.date === getTodayKey()) return s.count;
		}
	} catch {
		/* ignore */
	}
	return 0;
}

function saveTodayCount(count: number) {
	try {
		localStorage.setItem(
			STATS_KEY,
			JSON.stringify({ date: getTodayKey(), count } satisfies Stats),
		);
	} catch {
		/* ignore */
	}
}

/** 完成提示音（Web Audio 三连响，无外部资源） */
function playBell() {
	try {
		const ctx = new AudioContext();
		for (let i = 0; i < 3; i++) {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.type = "sine";
			osc.frequency.value = 880;
			const t = ctx.currentTime + i * 0.35;
			gain.gain.setValueAtTime(0.0001, t);
			gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
			osc.start(t);
			osc.stop(t + 0.3);
		}
	} catch {
		/* ignore */
	}
}

export default function PomodoroPage(): ReactElement {
	const [mode, setMode] = useState<Mode>("focus");
	const [running, setRunning] = useState(false);
	// 用结束时间戳倒计时（而非递减），切换标签页后时间依然准确
	const [deadline, setDeadline] = useState<number | null>(null);
	const [remaining, setRemaining] = useState(FOCUS_MS);
	const [todayCount, setTodayCount] = useState(0);
	// 防止完成瞬间重复触发
	const finishedRef = useRef(false);

	const totalMs = mode === "focus" ? FOCUS_MS : BREAK_MS;

	useEffect(() => {
		setTodayCount(loadTodayCount());
	}, []);

	useEffect(() => {
		if (!running || deadline === null) return;
		const timer = setInterval(() => {
			const left = deadline - Date.now();
			if (left <= 0) {
				if (finishedRef.current) return;
				finishedRef.current = true;
				playBell();
				// 专注完成 → 计数 + 自动进入休息；休息完成 → 自动进入专注
				if (mode === "focus") {
					const next = loadTodayCount() + 1;
					saveTodayCount(next);
					setTodayCount(next);
				}
				const nextMode: Mode = mode === "focus" ? "break" : "focus";
				setMode(nextMode);
				setRemaining(nextMode === "focus" ? FOCUS_MS : BREAK_MS);
				setDeadline(Date.now() + (nextMode === "focus" ? FOCUS_MS : BREAK_MS));
				finishedRef.current = false;
			} else {
				setRemaining(left);
			}
		}, 250);

		return () => clearInterval(timer);
	}, [running, deadline, mode]);

	const handleToggle = () => {
		if (running) {
			// 暂停：记录剩余时间
			setRunning(false);
			setDeadline(null);
		} else {
			setDeadline(Date.now() + remaining);
			setRunning(true);
		}
	};

	const handleReset = () => {
		setRunning(false);
		setDeadline(null);
		setRemaining(totalMs);
		finishedRef.current = false;
	};

	const handleSkip = () => {
		const nextMode: Mode = mode === "focus" ? "break" : "focus";
		setRunning(false);
		setMode(nextMode);
		setRemaining(nextMode === "focus" ? FOCUS_MS : BREAK_MS);
		setDeadline(null);
		finishedRef.current = false;
	};

	const minutes = Math.floor(remaining / 60000);
	const seconds = Math.floor((remaining % 60000) / 1000);
	const progress = 1 - remaining / totalMs;

	// 圆环参数
	const RADIUS = 96;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

	return (
		<div className="mx-auto w-full max-w-2xl px-6 pt-8 pb-12 max-sm:px-4">
			<div className="mb-10 text-center">
				<h1 className="font-averia flex items-center justify-center gap-2 text-3xl font-medium">
					<Timer className="text-brand h-7 w-7" />
					番茄钟
				</h1>
				<p className="text-secondary mt-2 text-sm">
					专注 {FOCUS_MIN} 分钟 · 休息 {BREAK_MIN} 分钟
				</p>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-card rounded-3xl border p-8 backdrop-blur-sm max-sm:p-6"
			>
				{/* 模式切换 */}
				<div className="bg-secondary/20 mx-auto flex w-fit rounded-full p-1">
					<button
						type="button"
						onClick={() => mode !== "focus" && handleSkip()}
						className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
							mode === "focus"
								? "bg-brand text-white shadow-sm"
								: "text-secondary"
						}`}
					>
						<Brain className="h-3.5 w-3.5" />
						专注
					</button>
					<button
						type="button"
						onClick={() => mode !== "break" && handleSkip()}
						className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
							mode === "break"
								? "bg-brand text-white shadow-sm"
								: "text-secondary"
						}`}
					>
						<Coffee className="h-3.5 w-3.5" />
						休息
					</button>
				</div>

				{/* 圆环计时器 */}
				<div className="relative mx-auto mt-8 h-56 w-56 max-sm:h-48 max-sm:w-48">
					<svg
						viewBox="0 0 224 224"
						aria-hidden="true"
						className="h-full w-full -rotate-90"
					>
						<circle
							cx="112"
							cy="112"
							r={RADIUS}
							fill="none"
							strokeWidth="10"
							className="stroke-secondary/30"
						/>
						<circle
							cx="112"
							cy="112"
							r={RADIUS}
							fill="none"
							strokeWidth="10"
							strokeLinecap="round"
							className="text-brand stroke-current transition-[stroke-dashoffset] duration-300"
							strokeDasharray={CIRCUMFERENCE}
							strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
						/>
					</svg>
					<div className="absolute inset-0 flex flex-col items-center justify-center">
						<div className="font-averia text-5xl font-medium tabular-nums max-sm:text-4xl">
							{minutes.toString().padStart(2, "0")}:
							{seconds.toString().padStart(2, "0")}
						</div>
						<div className="text-secondary mt-2 text-xs">
							{running
								? mode === "focus"
									? "专注中..."
									: "休息一下~"
								: "准备好了吗"}
						</div>
					</div>
				</div>

				{/* 控制按钮 */}
				<div className="mt-8 flex items-center justify-center gap-4">
					<button
						type="button"
						onClick={handleReset}
						className="text-secondary hover:text-brand bg-secondary/30 rounded-full p-3 transition-colors"
						title="重置"
					>
						<RotateCcw className="h-5 w-5" />
					</button>
					<button
						type="button"
						onClick={handleToggle}
						className="bg-brand flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
						title={running ? "暂停" : "开始"}
					>
						{running ? (
							<Pause className="h-7 w-7" />
						) : (
							<Play className="ml-1 h-7 w-7" />
						)}
					</button>
					<button
						type="button"
						onClick={handleSkip}
						className="text-secondary hover:text-brand bg-secondary/30 rounded-full p-3 transition-colors"
						title="跳过当前阶段"
					>
						<SkipForward className="h-5 w-5" />
					</button>
				</div>

				{/* 今日统计 */}
				<div className="text-secondary mt-8 text-center text-sm">
					今日已专注{" "}
					<span className="brand-text font-averia text-lg font-medium">
						{todayCount}
					</span>{" "}
					次
					{todayCount > 0 && (
						<span className="ml-1 text-xs">
							（约 {todayCount * FOCUS_MIN} 分钟）
						</span>
					)}
				</div>
			</motion.div>

			<p className="text-secondary mt-6 text-center text-xs">
				数据仅保存在你的浏览器本地
			</p>
		</div>
	);
}
