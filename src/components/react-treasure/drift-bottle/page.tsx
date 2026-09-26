'use client'

import type { ReactElement } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Fish, Lock, RotateCcw, Sailboat, Send, Trash2, Undo2 } from 'lucide-react'

interface Bottle {
	id: string
	content: string
	date: string // YYYY-MM-DD
	mood: string // emoji
}

interface BottleStats {
	thrown: number
	fished: number
}

type Caught =
	| { key: string; kind: 'reply'; text: string }
	| { key: string; kind: 'bottle'; bottle: Bottle }

const BOTTLES_KEY = 'treasure-bottles'
const STATS_KEY = 'treasure-bottle-stats'

const MOODS = [
	{ emoji: '🙂', label: '平静' },
	{ emoji: '😢', label: '难过' },
	{ emoji: '😤', label: '烦躁' },
	{ emoji: '🌙', label: '深夜emo' }
]

/** 预置的温柔治愈语，捞瓶子时会以「来自陌生人的回信」出现 */
const PRESET_REPLIES = [
	'谢谢你愿意说出来，能讲出口的心事，已经轻了一半。',
	'没关系，允许自己偶尔掉线，情绪没有对错。',
	'你比自己想象中勇敢，也比你想象中被爱着。',
	'今晚早点睡吧，海风会替你把烦恼吹散的。',
	'慢慢来，你有自己的节奏，不必和别人一样。',
	'把难过交给大海，把晚安留给自己。'
]

/** 扔出瓶子后的治愈回执 */
const RECEIPTS = [
	'你的心事已经漂向大海了，会有人接住的。',
	'瓶子已经出发啦，剩下的交给海流和时间。',
	'说出来的这一刻，就已经在慢慢放下了。'
]

function toDateStr(d: Date): string {
	const y = d.getFullYear()
	const m = (d.getMonth() + 1).toString().padStart(2, '0')
	const day = d.getDate().toString().padStart(2, '0')
	return `${y}-${m}-${day}`
}

function moodLabel(emoji: string): string {
	return MOODS.find(m => m.emoji === emoji)?.label ?? ''
}

function pickRandom<T>(list: T[]): T {
	return list[Math.floor(Math.random() * list.length)]
}

export default function DriftBottlePage(): ReactElement {
	const [tab, setTab] = useState<'throw' | 'catch'>('throw')
	const [bottles, setBottles] = useState<Bottle[] | null>(null) // null = 未从 localStorage 读取
	const [stats, setStats] = useState<BottleStats | null>(null)

	// 扔瓶子
	const [content, setContent] = useState('')
	const [mood, setMood] = useState(MOODS[0].emoji)
	const [throwPhase, setThrowPhase] = useState<'idle' | 'flying' | 'done'>('idle')
	const [receipt, setReceipt] = useState('')

	// 捞瓶子
	const [catchPhase, setCatchPhase] = useState<'idle' | 'catching' | 'caught'>('idle')
	const [current, setCurrent] = useState<Caught | null>(null)
	const lastCatchRef = useRef<string | null>(null) // 上一次捞到的，避免立即重复

	useEffect(() => {
		try {
			const raw = localStorage.getItem(BOTTLES_KEY)
			setBottles(raw ? (JSON.parse(raw) as Bottle[]) : [])
		} catch {
			setBottles([])
		}
		try {
			const raw = localStorage.getItem(STATS_KEY)
			setStats(raw ? (JSON.parse(raw) as BottleStats) : { thrown: 0, fished: 0 })
		} catch {
			setStats({ thrown: 0, fished: 0 })
		}
	}, [])

	const persistBottles = useCallback((list: Bottle[]) => {
		setBottles(list)
		try {
			localStorage.setItem(BOTTLES_KEY, JSON.stringify(list))
		} catch {
			/* ignore */
		}
	}, [])

	const persistStats = useCallback((s: BottleStats) => {
		setStats(s)
		try {
			localStorage.setItem(STATS_KEY, JSON.stringify(s))
		} catch {
			/* ignore */
		}
	}, [])

	const handleTab = (next: 'throw' | 'catch') => {
		if (next === tab) return
		// 动画没播完就切走时直接落定，避免卡在中间态
		if (next !== 'throw' && throwPhase === 'flying') setThrowPhase('done')
		if (next !== 'catch' && catchPhase === 'catching') setCatchPhase(current ? 'caught' : 'idle')
		setTab(next)
	}

	// —— 扔瓶子 ——
	const handleThrow = () => {
		const text = content.trim()
		if (!text || !bottles || !stats || throwPhase !== 'idle') return
		const bottle: Bottle = {
			id: `${Date.now()}`,
			content: text,
			date: toDateStr(new Date()),
			mood
		}
		persistBottles([...bottles, bottle])
		persistStats({ ...stats, thrown: stats.thrown + 1 })
		setContent('')
		setReceipt(pickRandom(RECEIPTS))
		setThrowPhase('flying')
	}

	const handleThrowAgain = () => setThrowPhase('idle')

	// —— 捞瓶子 ——
	const handleFish = () => {
		if (!bottles || !stats || catchPhase === 'catching') return
		// 50% 捞到预置治愈语，50% 捞到自己扔过的瓶子（瓶海为空时必捞到治愈语）
		const wantOwn = bottles.length > 0 && Math.random() < 0.5
		let caught: Caught
		if (wantOwn) {
			const pool = bottles.filter(b => b.id !== lastCatchRef.current)
			const bottle = pickRandom(pool.length > 0 ? pool : bottles)
			caught = { key: bottle.id, kind: 'bottle', bottle }
		} else {
			const all = PRESET_REPLIES.map((text, i) => ({ text, id: `preset-${i}` }))
			const pool = all.filter(p => p.id !== lastCatchRef.current)
			const reply = pickRandom(pool.length > 0 ? pool : all)
			caught = { key: reply.id, kind: 'reply', text: reply.text }
		}
		lastCatchRef.current = caught.key
		persistStats({ ...stats, fished: stats.fished + 1 })
		setCurrent(caught)
		setCatchPhase('catching')
	}

	const handleRelease = () => {
		setCurrent(null)
		setCatchPhase('idle')
	}

	const handleDeleteCaught = () => {
		if (!current || current.kind !== 'bottle' || !bottles) return
		if (!window.confirm('确定删除这个瓶子吗？')) return
		persistBottles(bottles.filter(b => b.id !== current.bottle.id))
		setCurrent(null)
		setCatchPhase('idle')
	}

	const handleDeleteMine = (id: string) => {
		if (!bottles) return
		if (!window.confirm('确定删除这个瓶子吗？')) return
		persistBottles(bottles.filter(b => b.id !== id))
	}

	return (
		<div className='mx-auto w-full max-w-2xl px-6 pt-24 pb-12 max-sm:px-4'>
			<div className='mb-10 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<Sailboat className='text-brand h-7 w-7' />
					心事漂流瓶
				</h1>
				<p className='text-secondary mt-2 text-sm'>把心事装进瓶子，交给大海保管</p>
			</div>

			{/* 模式切换 */}
			<div className='bg-secondary/20 mx-auto mb-6 flex w-fit rounded-2xl p-1'>
				{(['throw', 'catch'] as const).map(t => (
					<button key={t} onClick={() => handleTab(t)} className='relative rounded-xl px-6 py-2 text-sm font-medium max-sm:px-4'>
						{tab === t && (
							<motion.span
								layoutId='drift-bottle-tab'
								className='bg-brand absolute inset-0 rounded-xl'
								transition={{ type: 'spring', stiffness: 400, damping: 32 }}
							/>
						)}
						<span className={`relative z-10 transition-colors ${tab === t ? 'text-white' : 'text-secondary'}`}>
							{t === 'throw' ? '扔瓶子' : '捞瓶子'}
						</span>
					</button>
				))}
			</div>

			{tab === 'throw' ? (
				<motion.div
					key='throw'
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					className='bg-card rounded-3xl border p-6 backdrop-blur-sm max-sm:p-5'>
					<AnimatePresence mode='wait'>
						{throwPhase === 'done' ? (
							<motion.div
								key='receipt'
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								className='py-6 text-center'>
								<div className='text-4xl'>🌊</div>
								<p className='mt-3 text-sm'>{receipt}</p>
								<button
									onClick={handleThrowAgain}
									className='bg-secondary/20 mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs transition-colors'>
									<RotateCcw className='h-3.5 w-3.5' />
									再扔一个
								</button>
							</motion.div>
						) : (
							<motion.div key='form' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}>
								<textarea
									value={content}
									onChange={e => setContent(e.target.value)}
									placeholder='今天有什么想说的？写下来，装进瓶子里…'
									rows={4}
									maxLength={300}
									disabled={throwPhase === 'flying'}
									className='bg-secondary/20 focus:border-brand w-full resize-none rounded-xl border border-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 disabled:opacity-60'
								/>
								<div className='text-secondary mt-1.5 text-right text-xs'>{content.length}/300</div>

								<div className='mt-3 flex flex-wrap gap-2'>
									{MOODS.map(m => (
										<button
											key={m.emoji}
											onClick={() => setMood(m.emoji)}
											disabled={throwPhase === 'flying'}
											className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs transition-colors disabled:opacity-60 ${
												mood === m.emoji ? 'bg-brand/10 border-brand/40' : 'border-transparent bg-secondary/20 text-secondary'
											}`}>
											<span className='text-sm'>{m.emoji}</span>
											{m.label}
										</button>
									))}
								</div>

								<div className='mt-5 flex items-center justify-between max-sm:flex-col max-sm:gap-3'>
									<span className='text-secondary text-xs'>匿名 · 没有人知道是你</span>
									<button
										onClick={handleThrow}
										disabled={!content.trim() || throwPhase !== 'idle'}
										className='bg-brand flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40'>
										<Send className='h-4 w-4' />
										扔进大海
									</button>
								</div>

								{/* 瓶子漂走动画 */}
								{throwPhase === 'flying' && (
									<div className='relative mt-3 h-14 overflow-hidden'>
										<div className='text-secondary absolute bottom-1 w-full text-center text-lg opacity-50'>〰️〰️〰️〰️</div>
										<motion.span
											className='absolute bottom-2 left-1 inline-block text-3xl'
											initial={{ x: 0, y: 8, opacity: 0, rotate: 0 }}
											animate={{ x: [0, 90, 200, 320], y: [8, -12, 6, 0], opacity: [0, 1, 1, 0], rotate: [0, -14, 12, 26] }}
											transition={{ duration: 1.8, times: [0, 0.35, 0.7, 1], ease: 'easeIn' }}
											onAnimationComplete={() => setThrowPhase('done')}>
											🍾
										</motion.span>
									</div>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			) : (
				<motion.div
					key='catch'
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					className='bg-card rounded-3xl border p-6 backdrop-blur-sm max-sm:p-5'>
					<div className='flex justify-center'>
						<button
							onClick={handleFish}
							disabled={catchPhase === 'catching' || !bottles || !stats}
							className='bg-brand flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40'>
							<Fish className='h-4 w-4' />
							{catchPhase === 'catching' ? '正在捞…' : '捞一个瓶子'}
						</button>
					</div>

					<AnimatePresence mode='wait'>
						{catchPhase === 'catching' && (
							<motion.div key='catching' exit={{ opacity: 0, scale: 0.85 }} className='flex h-36 items-end justify-center'>
								<motion.span
									initial={{ y: 96, opacity: 0, rotate: -18 }}
									animate={{ y: 0, opacity: 1, rotate: 0 }}
									transition={{ type: 'spring', stiffness: 120, damping: 12 }}
									onAnimationComplete={() => setCatchPhase('caught')}
									className='text-5xl'>
									🍾
								</motion.span>
							</motion.div>
						)}
						{catchPhase === 'caught' && current && current.kind === 'reply' && (
							<motion.div
								key={current.key}
								initial={{ opacity: 0, y: 32, scale: 0.96 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -16 }}
								transition={{ type: 'spring', stiffness: 220, damping: 20 }}
								className='mt-5'>
								<span className='bg-brand/10 text-brand inline-block rounded-full px-3 py-1 text-xs'>来自陌生人的回信</span>
								<p className='mt-3 text-sm leading-relaxed'>{current.text}</p>
								<div className='mt-4 flex justify-end'>
									<button
										onClick={handleRelease}
										className='bg-secondary/20 text-secondary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs transition-colors'>
										<Undo2 className='h-3.5 w-3.5' />
										放回大海
									</button>
								</div>
							</motion.div>
						)}
						{catchPhase === 'caught' && current && current.kind === 'bottle' && (
							<motion.div
								key={current.key}
								initial={{ opacity: 0, y: 32, scale: 0.96 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -16 }}
								transition={{ type: 'spring', stiffness: 220, damping: 20 }}
								className='mt-5'>
								<div className='flex items-center justify-between'>
									<span className='text-sm'>
										{current.bottle.mood} {moodLabel(current.bottle.mood)}
									</span>
									<span className='text-secondary text-xs'>{current.bottle.date}</span>
								</div>
								<p className='mt-3 text-sm leading-relaxed break-words whitespace-pre-wrap'>{current.bottle.content}</p>
								<div className='text-secondary mt-3 text-xs'>这是你自己扔出的瓶子，又漂回来了</div>
								<div className='mt-4 flex justify-end gap-2'>
									<button
										onClick={handleRelease}
										className='bg-secondary/20 text-secondary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs transition-colors'>
										<Undo2 className='h-3.5 w-3.5' />
										放回大海
									</button>
									<button
										onClick={handleDeleteCaught}
										className='text-secondary hover:text-red-500 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs transition-colors'>
										<Trash2 className='h-3.5 w-3.5' />
										删除
									</button>
								</div>
							</motion.div>
						)}
						{catchPhase === 'idle' && (
							<motion.p
								key='idle'
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className='text-secondary py-10 text-center text-sm'>
								海面很平静，捞一个瓶子试试吧 🌊
							</motion.p>
						)}
					</AnimatePresence>
				</motion.div>
			)}

			{/* 我的瓶子 */}
			<div className='mt-8'>
				<h2 className='mb-3 flex items-center gap-1.5 text-sm font-medium'>
					我的瓶子
					{bottles && bottles.length > 0 && <span className='text-secondary text-xs'>({bottles.length})</span>}
				</h2>
				{bottles === null ? null : bottles.length === 0 ? (
					<div className='border-dashed text-secondary rounded-3xl border-2 py-8 text-center text-sm'>
						还没有扔过瓶子，先去写一件心事吧 🍾
					</div>
				) : (
					<div className='flex flex-col gap-2.5'>
						{bottles.map(b => (
							<motion.div
								key={b.id}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								className='bg-card flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-sm'>
								<span className='shrink-0 text-lg'>{b.mood}</span>
								<div className='min-w-0 flex-1'>
									<div className='truncate text-sm'>{b.content}</div>
									<div className='text-secondary mt-0.5 text-xs'>{b.date}</div>
								</div>
								<button
									onClick={() => handleDeleteMine(b.id)}
									className='text-secondary hover:text-red-500 shrink-0 rounded-lg p-1.5 transition-colors'
									title='删除'>
									<Trash2 className='h-4 w-4' />
								</button>
							</motion.div>
						))}
					</div>
				)}
			</div>

			{/* 统计与隐私提示 */}
			<div className='text-secondary mt-10 text-center text-xs'>
				{stats && (
					<p>
						已扔 {stats.thrown} 瓶 · 已捞 {stats.fished} 次
					</p>
				)}
				<p className='mt-1.5 flex items-center justify-center gap-1'>
					<Lock className='h-3 w-3' />
					心事只存在你的浏览器里，没有人会看到
				</p>
			</div>
		</div>
	)
}
