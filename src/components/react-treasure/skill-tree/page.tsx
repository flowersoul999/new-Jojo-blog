"use client";

import { GitBranch, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "treasure-skill-tree";

interface Skill {
	id: string;
	label: string;
	emoji: string;
}

interface SkillTier {
	tier: number;
	title: string;
	skills: Skill[];
}

const SKILL_TIERS: SkillTier[] = [
	{
		tier: 0,
		title: "Web 入门",
		skills: [{ id: "web-intro", label: "Web 入门", emoji: "🌱" }],
	},
	{
		tier: 1,
		title: "三大基石",
		skills: [
			{ id: "html", label: "HTML", emoji: "🧱" },
			{ id: "css", label: "CSS", emoji: "🎨" },
			{ id: "javascript", label: "JavaScript", emoji: "⚡" },
		],
	},
	{
		tier: 2,
		title: "进阶核心",
		skills: [
			{ id: "typescript", label: "TypeScript", emoji: "📘" },
			{ id: "react", label: "React", emoji: "⚛️" },
			{ id: "vue", label: "Vue", emoji: "💚" },
			{ id: "build-tools", label: "构建工具", emoji: "📦" },
		],
	},
	{
		tier: 3,
		title: "生态拓展",
		skills: [
			{ id: "nextjs", label: "Next.js", emoji: "▲" },
			{ id: "nodejs", label: "Node.js", emoji: "🟢" },
			{ id: "responsive", label: "移动端适配", emoji: "📱" },
			{ id: "tailwind", label: "Tailwind", emoji: "💨" },
		],
	},
	{
		tier: 4,
		title: "高阶修炼",
		skills: [
			{ id: "docker", label: "Docker", emoji: "🐳" },
			{ id: "performance", label: "性能优化", emoji: "🚀" },
			{ id: "testing", label: "单元测试", emoji: "🧪" },
			{ id: "ai-coding", label: "AI 辅助编程", emoji: "🤖" },
		],
	},
];

const TOTAL_SKILLS = SKILL_TIERS.reduce(
	(sum, tier) => sum + tier.skills.length,
	0,
);
const ALL_SKILL_IDS = new Set(
	SKILL_TIERS.flatMap((tier) => tier.skills.map((skill) => skill.id)),
);

function loadLitIds(): string[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				return parsed.filter(
					(id): id is string => typeof id === "string" && ALL_SKILL_IDS.has(id),
				);
			}
		}
	} catch {
		/* ignore */
	}
	return [];
}

function saveLitIds(ids: string[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
	} catch {
		/* ignore */
	}
}

function SkillNode({
	skill,
	lit,
	onToggle,
}: {
	skill: Skill;
	lit: boolean;
	onToggle: () => void;
}) {
	return (
		<motion.button
			type="button"
			aria-pressed={lit}
			onClick={onToggle}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.9 }}
			transition={{ type: "spring", stiffness: 300, damping: 15 }}
			className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors max-sm:px-3 max-sm:py-1.5 max-sm:text-xs ${
				lit ? "bg-brand text-white shadow" : "bg-secondary/20 text-secondary"
			}`}
		>
			{lit && (
				<span
					className="bg-brand/10 absolute -inset-0.5 animate-pulse rounded-full blur"
					aria-hidden
				/>
			)}
			<span className="relative text-base max-sm:text-sm">{skill.emoji}</span>
			<span className="relative">{skill.label}</span>
		</motion.button>
	);
}

export default function SkillTreePage(): ReactElement {
	const [loaded, setLoaded] = useState(false);
	const [litIds, setLitIds] = useState<string[]>([]);

	useEffect(() => {
		setLitIds(loadLitIds());
		setLoaded(true);
	}, []);

	const toggle = (id: string) => {
		setLitIds((prev) => {
			const next = prev.includes(id)
				? prev.filter((x) => x !== id)
				: [...prev, id];
			saveLitIds(next);
			return next;
		});
	};

	const handleReset = () => {
		if (!window.confirm("确定要重置技能树吗？所有点亮进度将被清空。")) return;
		setLitIds([]);
		saveLitIds([]);
	};

	const litCount = litIds.length;
	const ratio = TOTAL_SKILLS === 0 ? 0 : litCount / TOTAL_SKILLS;
	const percent = Math.round(ratio * 100);
	const allLit = litCount === TOTAL_SKILLS;

	return (
		<div className="mx-auto w-full max-w-2xl px-6 pt-8 pb-12 max-sm:px-4">
			<div className="mb-10 text-center">
				<h1 className="font-averia flex items-center justify-center gap-2 text-3xl font-medium">
					<GitBranch className="text-brand h-7 w-7" />
					技能树
				</h1>
				<p className="text-secondary mt-2 text-sm">
					一步步点亮你的前端学习路线图
				</p>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-card rounded-3xl border p-6 backdrop-blur-sm max-sm:p-5"
			>
				{!loaded ? (
					/* 加载骨架 */
					<div className="space-y-10 py-2">
						{[3, 2, 4, 3, 4].map((count, ti) => (
							<div key={ti} className="flex flex-col items-center">
								<div className="bg-secondary/20 h-3.5 w-28 animate-pulse rounded-full" />
								<div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:gap-3">
									{Array.from({ length: count }).map((_, i) => (
										<div
											key={i}
											className="bg-secondary/20 h-9 animate-pulse rounded-full"
											style={{ width: 64 + (i % 3) * 16 }}
										/>
									))}
								</div>
							</div>
						))}
					</div>
				) : (
					<>
						{/* 顶部统计 */}
						<div className="flex items-center justify-between">
							<div className="text-sm font-medium">
								已点亮{" "}
								<span className="brand-text font-averia text-lg font-medium">
									{litCount}
								</span>
								<span className="text-secondary"> / {TOTAL_SKILLS}</span>
							</div>
							<button
								type="button"
								onClick={handleReset}
								className="text-secondary hover:text-brand bg-secondary/20 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
							>
								<RotateCcw className="h-3.5 w-3.5" />
								重置
							</button>
						</div>

						{/* 进度条 */}
						<div className="bg-secondary/20 mt-4 h-2.5 overflow-hidden rounded-full">
							<div
								className="bg-brand h-full rounded-full transition-all duration-500"
								style={{ width: `${percent}%` }}
							/>
						</div>

						{/* 分层技能树 */}
						<div className="mt-8">
							{SKILL_TIERS.map((tier, ti) => (
								<div key={tier.tier}>
									{ti > 0 && (
										<div
											className="bg-secondary/40 mx-auto h-6 w-px"
											aria-hidden
										/>
									)}
									<section className="py-3">
										<h2 className="text-secondary text-center text-xs font-medium tracking-widest">
											第 {tier.tier} 层 · {tier.title}
										</h2>
										<div className="mt-4 flex flex-wrap justify-center gap-2.5 sm:gap-3">
											{tier.skills.map((skill) => (
												<SkillNode
													key={skill.id}
													skill={skill}
													lit={litIds.includes(skill.id)}
													onToggle={() => toggle(skill.id)}
												/>
											))}
										</div>
									</section>
								</div>
							))}
						</div>

						{/* 里程碑 */}
						{allLit ? (
							<div className="bg-brand/10 border-brand/40 mt-6 rounded-2xl border px-4 py-3 text-center">
								<div className="text-sm font-medium">🏆 技能树全部点亮！</div>
								<div className="text-secondary mt-0.5 text-xs">
									继续学习新技能时可以添加新节点
								</div>
							</div>
						) : (
							<div className="text-secondary mt-6 text-center text-sm">
								{ratio > 2 / 3
									? "🌳 枝繁叶茂"
									: ratio > 1 / 3
										? "🌱 稳步成长"
										: "🌱 刚刚开始"}
							</div>
						)}
					</>
				)}
			</motion.div>

			<p className="text-secondary mt-6 text-center text-xs">
				点击节点点亮 / 熄灭 · 进度仅保存在你的浏览器本地
			</p>
		</div>
	);
}
