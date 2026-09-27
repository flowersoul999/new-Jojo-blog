"use client";

import { Gamepad2, Pause, Play, RotateCcw, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type GameTab = "snake" | "2048" | "memory";

const TABS: { key: GameTab; label: string; emoji: string }[] = [
	{ key: "snake", label: "贪吃蛇", emoji: "🐍" },
	{ key: "2048", label: "2048", emoji: "🔢" },
	{ key: "memory", label: "记忆翻牌", emoji: "🃏" },
];

/** 读取最高分 */
function loadBest(key: string): number {
	try {
		return Number(localStorage.getItem(key)) || 0;
	} catch {
		return 0;
	}
}

function saveBest(key: string, value: number) {
	try {
		localStorage.setItem(key, String(value));
	} catch {
		/* ignore */
	}
}

/** 通用最高分徽标 */
function BestBadge({ value, hint }: { value: number; hint: string }) {
	return (
		<div className="text-secondary flex items-center gap-1 text-xs">
			<Trophy className="text-brand h-3.5 w-3.5" />
			{hint}
			<span className="font-averia text-brand ml-0.5 text-sm font-medium">
				{value}
			</span>
		</div>
	);
}

/** 触摸滑动方向检测 hook（贪吃蛇/2048 共用） */
function useSwipe(onDir: (dir: "up" | "down" | "left" | "right") => void) {
	const startRef = useRef<{ x: number; y: number } | null>(null);

	const onTouchStart = useCallback((e: React.TouchEvent) => {
		startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	}, []);

	const onTouchEnd = useCallback(
		(e: React.TouchEvent) => {
			if (!startRef.current) return;
			const dx = e.changedTouches[0].clientX - startRef.current.x;
			const dy = e.changedTouches[0].clientY - startRef.current.y;
			startRef.current = null;
			if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
			if (Math.abs(dx) > Math.abs(dy)) onDir(dx > 0 ? "right" : "left");
			else onDir(dy > 0 ? "down" : "up");
		},
		[onDir],
	);

	return { onTouchStart, onTouchEnd };
}

/* ------------------------------ 贪吃蛇 ------------------------------ */

const SNAKE_GRID = 15;
const SNAKE_CELL = 20;

function SnakeGame() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [score, setScore] = useState(0);
	const [best, setBest] = useState(0);
	const [status, setStatus] = useState<"idle" | "running" | "paused" | "over">(
		"idle",
	);
	// 游戏可变状态放 ref，避免 interval/effect 重建
	const gameRef = useRef({
		snake: [{ x: 7, y: 7 }],
		dir: { x: 1, y: 0 },
		nextDirs: [] as { x: number; y: number }[],
		food: { x: 11, y: 7 },
	});
	const statusRef = useRef(status);
	statusRef.current = status;

	useEffect(() => {
		setBest(loadBest("treasure-snake-best"));
	}, []);

	const spawnFood = useCallback(() => {
		const g = gameRef.current;
		let p = { x: 0, y: 0 };
		do {
			p = {
				x: Math.floor(Math.random() * SNAKE_GRID),
				y: Math.floor(Math.random() * SNAKE_GRID),
			};
		} while (g.snake.some((s) => s.x === p.x && s.y === p.y));
		g.food = p;
	}, []);

	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d")!;
		const g = gameRef.current;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, 300, 300);
		// 食物
		ctx.fillStyle = "#ef4444";
		ctx.beginPath();
		ctx.arc(
			g.food.x * SNAKE_CELL + SNAKE_CELL / 2,
			g.food.y * SNAKE_CELL + SNAKE_CELL / 2,
			7,
			0,
			Math.PI * 2,
		);
		ctx.fill();
		// 蛇
		g.snake.forEach((s, i) => {
			ctx.fillStyle = i === 0 ? "#0ea5a4" : "#0ea5a499";
			ctx.beginPath();
			ctx.roundRect(
				s.x * SNAKE_CELL + 1.5,
				s.y * SNAKE_CELL + 1.5,
				SNAKE_CELL - 3,
				SNAKE_CELL - 3,
				5,
			);
			ctx.fill();
		});
	}, []);

	const step = useCallback(() => {
		const g = gameRef.current;
		// 从队列取方向（防一帧内连按导致反向自杀）
		while (g.nextDirs.length > 0) {
			const d = g.nextDirs.shift()!;
			if (d.x !== -g.dir.x || d.y !== -g.dir.y) {
				g.dir = d;
				break;
			}
		}
		const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };
		const hitWall =
			head.x < 0 || head.y < 0 || head.x >= SNAKE_GRID || head.y >= SNAKE_GRID;
		const hitSelf = g.snake.some((s) => s.x === head.x && s.y === head.y);
		if (hitWall || hitSelf) {
			setStatus("over");
			setScore((sc) => {
				setBest((b) => {
					if (sc > b) {
						saveBest("treasure-snake-best", sc);
						return sc;
					}
					return b;
				});
				return sc;
			});
			return;
		}
		g.snake.unshift(head);
		if (head.x === g.food.x && head.y === g.food.y) {
			setScore((sc) => sc + 10);
			spawnFood();
		} else {
			g.snake.pop();
		}
		draw();
	}, [draw, spawnFood]);

	// 游戏循环
	useEffect(() => {
		if (status !== "running") return;
		const timer = setInterval(step, 160);
		return () => clearInterval(timer);
	}, [status, step]);

	// 初始绘制
	useEffect(() => {
		draw();
	}, [draw]);

	const startGame = () => {
		gameRef.current = {
			snake: [{ x: 7, y: 7 }],
			dir: { x: 1, y: 0 },
			nextDirs: [],
			food: { x: 11, y: 7 },
		};
		setScore(0);
		setStatus("running");
	};

	const changeDir = useCallback((dir: "up" | "down" | "left" | "right") => {
		const map = {
			up: { x: 0, y: -1 },
			down: { x: 0, y: 1 },
			left: { x: -1, y: 0 },
			right: { x: 1, y: 0 },
		};
		if (statusRef.current === "running")
			gameRef.current.nextDirs.push(map[dir]);
	}, []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const keyMap: Record<string, "up" | "down" | "left" | "right"> = {
				ArrowUp: "up",
				ArrowDown: "down",
				ArrowLeft: "left",
				ArrowRight: "right",
				w: "up",
				s: "down",
				a: "left",
				d: "right",
			};
			const dir = keyMap[e.key];
			if (dir) {
				e.preventDefault();
				changeDir(dir);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [changeDir]);

	const swipe = useSwipe(changeDir);

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="flex w-full items-center justify-between">
				<div className="text-sm">
					得分{" "}
					<span className="font-averia text-brand text-lg font-medium">
						{score}
					</span>
				</div>
				<BestBadge value={best} hint="最高" />
			</div>

			<div
				className="relative touch-none rounded-2xl border shadow-inner"
				{...swipe}
				onTouchStart={(e) => {
					e.preventDefault();
					swipe.onTouchStart(e);
				}}
				onTouchEnd={(e) => {
					e.preventDefault();
					swipe.onTouchEnd(e);
				}}
			>
				<canvas
					ref={canvasRef}
					width={300}
					height={300}
					className="block max-sm:h-[270px] max-sm:w-[270px]"
					style={{ imageRendering: "auto" }}
				/>
				<AnimatePresence>
					{status !== "running" && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/80 backdrop-blur-sm"
						>
							{status === "over" ? (
								<>
									<div className="text-2xl">💥</div>
									<div className="text-secondary text-sm">
										游戏结束，得分 {score}
									</div>
									{score > 0 && score >= best && (
										<div className="brand-text text-xs font-medium">
											🏆 新纪录！
										</div>
									)}
								</>
							) : status === "paused" ? (
								<div className="text-secondary text-sm">已暂停</div>
							) : (
								<>
									<div className="text-3xl">🐍</div>
									<div className="text-secondary text-sm">
										方向键 / WASD / 滑动屏幕控制
									</div>
								</>
							)}
							{(status === "idle" || status === "over") && (
								<button
									type="button"
									onClick={startGame}
									className="bg-brand flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
								>
									<Play className="h-4 w-4" />
									{status === "over" ? "再来一局" : "开始游戏"}
								</button>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className="flex gap-3">
				<button
					type="button"
					onClick={() =>
						setStatus((s) =>
							s === "running" ? "paused" : s === "paused" ? "running" : s,
						)
					}
					disabled={status === "idle" || status === "over"}
					className="text-secondary hover:text-brand flex items-center gap-1.5 rounded-xl bg-secondary/30 px-4 py-2 text-xs transition-colors disabled:opacity-40"
				>
					{status === "paused" ? (
						<Play className="h-3.5 w-3.5" />
					) : (
						<Pause className="h-3.5 w-3.5" />
					)}
					{status === "paused" ? "继续" : "暂停"}
				</button>
				<button
					type="button"
					onClick={startGame}
					className="text-secondary hover:text-brand flex items-center gap-1.5 rounded-xl bg-secondary/30 px-4 py-2 text-xs transition-colors"
				>
					<RotateCcw className="h-3.5 w-3.5" />
					重开
				</button>
			</div>
		</div>
	);
}

/* ------------------------------ 2048 ------------------------------ */

type Board = number[][];

function emptyBoard(): Board {
	return Array.from({ length: 4 }, () => Array(4).fill(0));
}

function addRandomTile(board: Board): Board {
	const empties: { r: number; c: number }[] = [];
	board.forEach((row, r) => {
		row.forEach((v, c) => {
			if (v === 0) empties.push({ r, c });
		});
	});
	if (empties.length === 0) return board;
	const { r, c } = empties[Math.floor(Math.random() * empties.length)];
	const next = board.map((row) => [...row]);
	next[r][c] = Math.random() < 0.9 ? 2 : 4;
	return next;
}

function slideRowLeft(row: number[]): { row: number[]; gained: number } {
	const nums = row.filter((v) => v !== 0);
	const out: number[] = [];
	let gained = 0;
	for (let i = 0; i < nums.length; i++) {
		if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
			out.push(nums[i] * 2);
			gained += nums[i] * 2;
			i++;
		} else {
			out.push(nums[i]);
		}
	}
	while (out.length < 4) out.push(0);
	return { row: out, gained };
}

const transpose = (b: Board): Board =>
	b[0].map((_, c) => b.map((row) => row[c]));
const reverseRows = (b: Board): Board => b.map((row) => [...row].reverse());

function canMove(board: Board): boolean {
	if (board.some((row) => row.some((v) => v === 0))) return true;
	for (const row of board) {
		for (let c = 0; c < 3; c++) if (row[c] === row[c + 1]) return true;
	}
	for (let r = 0; r < 3; r++) {
		for (let c = 0; c < 4; c++)
			if (board[r][c] === board[r + 1][c]) return true;
	}
	return false;
}

const TILE_STYLES: Record<number, string> = {
	2: "bg-[#efe6db] text-[#776e65]",
	4: "bg-[#ece0c8] text-[#776e65]",
	8: "bg-[#f2b179] text-white",
	16: "bg-[#f59563] text-white",
	32: "bg-[#f67c5f] text-white",
	64: "bg-[#f65e3b] text-white",
	128: "bg-[#edcf72] text-white",
	256: "bg-[#edcc61] text-white",
	512: "bg-[#edc850] text-white",
	1024: "bg-[#edc53f] text-white",
	2048: "bg-brand text-white",
};

function Game2048() {
	const [board, setBoard] = useState<Board>(emptyBoard);
	const [score, setScore] = useState(0);
	const [best, setBest] = useState(0);
	const [over, setOver] = useState(false);

	useEffect(() => {
		setBest(loadBest("treasure-2048-best"));
	}, []);

	const move = useCallback(
		(dir: "up" | "down" | "left" | "right") => {
			setBoard((prevBoard) => {
				if (over) return prevBoard;
				let work = prevBoard.map((row) => [...row]);
				if (dir === "up" || dir === "down") work = transpose(work);
				if (dir === "right" || dir === "down") work = reverseRows(work);

				let gained = 0;
				work = work.map((row) => {
					const { row: next, gained: g } = slideRowLeft(row);
					gained += g;
					return next;
				});

				if (dir === "right" || dir === "down") work = reverseRows(work);
				if (dir === "up" || dir === "down") work = transpose(work);

				// 没有变化则不生成新块
				if (JSON.stringify(work) === JSON.stringify(prevBoard))
					return prevBoard;

				const withNew = addRandomTile(work);
				if (gained > 0) {
					setScore((sc) => {
						const ns = sc + gained;
						setBest((b) => {
							if (ns > b) {
								saveBest("treasure-2048-best", ns);
								return ns;
							}
							return b;
						});
						return ns;
					});
				}
				if (!canMove(withNew)) setOver(true);
				return withNew;
			});
		},
		[over],
	);

	const startGame = () => {
		const b = addRandomTile(addRandomTile(emptyBoard()));
		setBoard(b);
		setScore(0);
		setOver(false);
	};

	// 初始化随机块
	useEffect(() => {
		setBoard(addRandomTile(addRandomTile(emptyBoard())));
	}, []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const dirMap: Record<string, "up" | "down" | "left" | "right"> = {
				ArrowUp: "up",
				ArrowDown: "down",
				ArrowLeft: "left",
				ArrowRight: "right",
				w: "up",
				s: "down",
				a: "left",
				d: "right",
			};
			const dir = dirMap[e.key];
			if (dir) {
				e.preventDefault();
				move(dir);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [move]);

	const swipe = useSwipe(move);

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="flex w-full items-center justify-between">
				<div className="text-sm">
					得分{" "}
					<span className="font-averia text-brand text-lg font-medium">
						{score}
					</span>
				</div>
				<BestBadge value={best} hint="最高" />
			</div>

			<div className="relative touch-none" {...swipe}>
				<div className="bg-secondary/30 grid grid-cols-4 gap-2 rounded-2xl p-2">
					{board.flat().map((v, i) => (
						<div
							key={i}
							className={`flex h-[68px] w-[68px] items-center justify-center rounded-xl text-xl font-bold transition-all max-sm:h-[62px] max-sm:w-[62px] ${
								v === 0
									? "bg-secondary/40"
									: TILE_STYLES[v] || "bg-brand text-white"
							}`}
						>
							{v !== 0 &&
								(v >= 1024 ? <span className="text-base">{v}</span> : v)}
						</div>
					))}
				</div>

				<AnimatePresence>
					{over && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/85 backdrop-blur-sm"
						>
							<div className="text-2xl">🧩</div>
							<div className="text-secondary text-sm">
								没有可移动的方块了，得分 {score}
							</div>
							{score >= best && score > 0 && (
								<div className="brand-text text-xs font-medium">
									🏆 新纪录！
								</div>
							)}
							<button
								type="button"
								onClick={startGame}
								className="bg-brand flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
							>
								<RotateCcw className="h-4 w-4" />
								再来一局
							</button>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className="text-secondary text-center text-xs">
				方向键 / WASD / 滑动屏幕移动，相同数字合并
			</div>

			<button
				type="button"
				onClick={startGame}
				className="text-secondary hover:text-brand flex items-center gap-1.5 rounded-xl bg-secondary/30 px-4 py-2 text-xs transition-colors"
			>
				<RotateCcw className="h-3.5 w-3.5" />
				重新开始
			</button>
		</div>
	);
}

/* ------------------------------ 记忆翻牌 ------------------------------ */

const MEMORY_EMOJIS = ["🌸", "⭐", "🍀", "🌈", "🌙", "🐟", "🎀", "☕"];

interface MemoryCard {
	id: number;
	emoji: string;
	flipped: boolean;
	matched: boolean;
}

function shuffleCards(): MemoryCard[] {
	const pairs = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS];
	// 洗牌
	for (let i = pairs.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[pairs[i], pairs[j]] = [pairs[j], pairs[i]];
	}
	return pairs.map((emoji, id) => ({
		id,
		emoji,
		flipped: false,
		matched: false,
	}));
}

function MemoryGame() {
	const [cards, setCards] = useState<MemoryCard[]>(shuffleCards);
	const [flippedIds, setFlippedIds] = useState<number[]>([]);
	const [moves, setMoves] = useState(0);
	const [best, setBest] = useState(0);
	const [won, setWon] = useState(false);
	const lockRef = useRef(false);

	const matchedCount = cards.filter((c) => c.matched).length;

	useEffect(() => {
		setBest(loadBest("treasure-memory-best"));
	}, []);

	// 翻开两张判定
	useEffect(() => {
		if (flippedIds.length !== 2) return;
		lockRef.current = true;
		const [a, b] = flippedIds;
		setMoves((m) => m + 1);
		const isMatch =
			cards.find((c) => c.id === a)?.emoji ===
			cards.find((c) => c.id === b)?.emoji;

		const timer = setTimeout(
			() => {
				setCards((prev) =>
					prev.map((c) =>
						c.id === a || c.id === b
							? { ...c, flipped: isMatch, matched: isMatch ? true : c.matched }
							: c,
					),
				);
				setFlippedIds([]);
				lockRef.current = false;
				if (isMatch) {
					// 检查是否全部配对（用更新后的数量判断）
					const totalMatched = cards.filter((c) => c.matched).length + 2;
					if (totalMatched >= cards.length) {
						setWon(true);
						setMoves((mv) => {
							setBest((b) => {
								if (b === 0 || mv < b) {
									saveBest("treasure-memory-best", mv);
									return mv;
								}
								return b;
							});
							return mv;
						});
					}
				}
			},
			isMatch ? 350 : 800,
		);

		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [flippedIds, cards.length, cards.find, cards.filter]);

	const handleClick = (card: MemoryCard) => {
		if (lockRef.current || won) return;
		if (card.flipped || card.matched) return;
		if (flippedIds.length >= 2) return;
		setCards((prev) =>
			prev.map((c) => (c.id === card.id ? { ...c, flipped: true } : c)),
		);
		setFlippedIds((prev) => [...prev, card.id]);
	};

	const startGame = () => {
		setCards(shuffleCards());
		setFlippedIds([]);
		setMoves(0);
		setWon(false);
		lockRef.current = false;
	};

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="flex w-full items-center justify-between">
				<div className="text-sm">
					步数{" "}
					<span className="font-averia text-brand text-lg font-medium">
						{moves}
					</span>
				</div>
				<BestBadge value={best} hint="最少步数" />
			</div>

			<div className="relative">
				<div className="grid grid-cols-4 gap-2.5">
					{cards.map((card) => (
						<button
							type="button"
							key={card.id}
							onClick={() => handleClick(card)}
							className={`flex h-[68px] w-[68px] items-center justify-center rounded-xl text-2xl transition-all duration-300 max-sm:h-[62px] max-sm:w-[62px] ${
								card.flipped || card.matched
									? card.matched
										? "bg-brand/10 text-brand border border-brand/30 scale-95"
										: "bg-white border shadow-sm"
									: "bg-secondary/40 hover:bg-secondary/60"
							}`}
							style={{
								transform: card.flipped || card.matched ? undefined : undefined,
							}}
						>
							{card.flipped || card.matched ? (
								card.emoji
							) : (
								<span className="text-secondary/50 text-lg">?</span>
							)}
						</button>
					))}
				</div>

				<AnimatePresence>
					{won && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 backdrop-blur-sm"
						>
							<div className="text-2xl">🎉</div>
							<div className="text-secondary text-sm">
								全部配对成功！用了 {moves} 步
							</div>
							{moves <= best && (
								<div className="brand-text text-xs font-medium">
									🏆 新纪录！
								</div>
							)}
							<button
								type="button"
								onClick={startGame}
								className="bg-brand flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
							>
								<RotateCcw className="h-4 w-4" />
								再来一局
							</button>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className="text-secondary text-center text-xs">
				配对进度 {matchedCount / 2} / {MEMORY_EMOJIS.length}
			</div>

			<button
				type="button"
				onClick={startGame}
				className="text-secondary hover:text-brand flex items-center gap-1.5 rounded-xl bg-secondary/30 px-4 py-2 text-xs transition-colors"
			>
				<RotateCcw className="h-3.5 w-3.5" />
				重新开始
			</button>
		</div>
	);
}

/* ------------------------------ 主页 ------------------------------ */

export default function GamesPage(): ReactElement {
	const [tab, setTab] = useState<GameTab>("snake");

	return (
		<div className="mx-auto w-full max-w-2xl px-6 pt-8 pb-12 max-sm:px-4">
			<div className="mb-10 text-center">
				<h1 className="font-averia flex items-center justify-center gap-2 text-3xl font-medium">
					<Gamepad2 className="text-brand h-7 w-7" />
					小游戏合集
				</h1>
				<p className="text-secondary mt-2 text-sm">摸鱼间隙，玩两把放松一下</p>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-card rounded-3xl border p-6 backdrop-blur-sm max-sm:p-4"
			>
				{/* 游戏切换 */}
				<div className="bg-secondary/20 mx-auto mb-6 flex w-fit rounded-full p-1">
					{TABS.map((t) => (
						<button
							type="button"
							key={t.key}
							onClick={() => setTab(t.key)}
							className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
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

				{tab === "snake" && <SnakeGame />}
				{tab === "2048" && <Game2048 />}
				{tab === "memory" && <MemoryGame />}
			</motion.div>

			<p className="text-secondary mt-6 text-center text-xs">
				最高分记录保存在你的浏览器本地
			</p>
		</div>
	);
}
