"use client";

import { BookOpenText, History, Shuffle, Volume2 } from "lucide-react";
import { motion } from "motion/react";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import {
	ENGLISH_WORDS,
	getWordOfDay,
} from "@/components/react-treasure/lib/english-words";

export default function DailyEnglishPage(): ReactElement {
	// SSR 与客户端日期可能不同，挂载后再取词，避免水合错位
	const [today, setToday] = useState<Date | null>(null);
	const [randomWord, setRandomWord] = useState<
		(typeof ENGLISH_WORDS)[number] | null
	>(null);

	useEffect(() => {
		setToday(new Date());
	}, []);

	// 每日单词
	const dailyWord = useMemo(
		() => (today ? getWordOfDay(today) : null),
		[today],
	);
	// 展示的词：随机模式优先，否则每日一词
	const current = randomWord || dailyWord;

	// 最近 6 天回顾（不含今天）
	const recentWords = useMemo(() => {
		if (!today) return [];
		return [1, 2, 3, 4, 5, 6].map((offset) => getWordOfDay(today, -offset));
	}, [today]);

	const speak = () => {
		if (!current || typeof window === "undefined" || !window.speechSynthesis)
			return;
		const utterance = new SpeechSynthesisUtterance(current.word);
		utterance.lang = "en-US";
		utterance.rate = 0.9;
		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(utterance);
	};

	const handleShuffle = () => {
		const next =
			ENGLISH_WORDS[Math.floor(Math.random() * ENGLISH_WORDS.length)];
		setRandomWord(next);
	};

	const handleBackToDaily = () => {
		setRandomWord(null);
	};

	return (
		<div className="mx-auto w-full max-w-2xl px-6 pt-8 pb-12 max-sm:px-4">
			<div className="mb-10 text-center">
				<h1 className="font-averia flex items-center justify-center gap-2 text-3xl font-medium">
					<BookOpenText className="text-brand h-7 w-7" />
					每日英语
				</h1>
				<p className="text-secondary mt-2 text-sm">每天认识一个温柔的单词</p>
			</div>

			{/* 主卡片 */}
			<motion.div
				key={current?.word}
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-card mb-4 rounded-3xl border p-8 backdrop-blur-sm max-sm:p-6"
			>
				{!current ? (
					<div className="text-secondary py-6 text-center text-sm">
						加载中...
					</div>
				) : (
					<>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<div className="font-averia text-4xl font-medium break-words max-sm:text-3xl">
									{current.word}
								</div>
								<div className="text-secondary mt-2 text-sm">
									{current.phonetic}{" "}
									<span className="brand-text ml-1 font-medium">
										{current.pos}
									</span>
								</div>
							</div>
							<button
								type="button"
								onClick={speak}
								className="bg-brand/10 text-brand hover:bg-brand/20 shrink-0 rounded-full p-3 transition-colors"
								title="朗读"
							>
								<Volume2 className="h-5 w-5" />
							</button>
						</div>

						<div className="bg-secondary/20 mt-5 rounded-2xl p-4">
							<div className="text-sm font-medium">{current.meaning}</div>
						</div>

						<div className="mt-4">
							<div className="font-averia text-secondary text-sm italic">
								{current.example}
							</div>
							<div className="text-secondary mt-1 text-xs">
								{current.exampleZh}
							</div>
						</div>

						<div className="mt-6 flex items-center justify-between">
							<div className="text-secondary text-xs">
								{randomWord ? "🎲 随机一词" : "今日一词"}
							</div>
							<div className="flex gap-2">
								{randomWord && (
									<button
										type="button"
										onClick={handleBackToDaily}
										className="text-secondary hover:text-brand rounded-xl bg-secondary/30 px-4 py-2 text-xs transition-colors"
									>
										回到今日
									</button>
								)}
								<button
									type="button"
									onClick={handleShuffle}
									className="text-secondary hover:text-brand flex items-center gap-1.5 rounded-xl bg-secondary/30 px-4 py-2 text-xs transition-colors"
								>
									<Shuffle className="h-3.5 w-3.5" />
									随机一词
								</button>
							</div>
						</div>
					</>
				)}
			</motion.div>

			{/* 历史回顾 */}
			{recentWords.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.08 }}
					className="bg-card rounded-3xl border p-6 backdrop-blur-sm"
				>
					<div className="text-secondary mb-4 flex items-center gap-1.5 text-xs font-medium">
						<History className="h-3.5 w-3.5" />
						前几天学过的词
					</div>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{recentWords.map((w) => (
							<button
								type="button"
								key={w.word}
								onClick={() => setRandomWord(w)}
								className="bg-secondary/20 hover:border-brand/40 rounded-2xl p-3 text-left transition-colors hover:shadow-sm"
							>
								<div className="font-averia truncate text-sm font-medium">
									{w.word}
								</div>
								<div className="text-secondary mt-0.5 truncate text-xs">
									{w.meaning}
								</div>
							</button>
						))}
					</div>
				</motion.div>
			)}

			<p className="text-secondary mt-6 text-center text-xs">
				词库共 {ENGLISH_WORDS.length} 词，每天 0 点更新
			</p>
		</div>
	);
}
