'use client'

import type { ReactElement } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { MessagesSquare, Send } from 'lucide-react'

const DANMAKU_KEY = 'treasure-danmaku'
const MAX_SAVED = 30
const TEXT_MAX = 30
const LOOP_COUNT = 40
const FLY_DURATION = 8

/** 预置治愈系祝福语 */
const PRESET_BLESSINGS = [
	'今天也要元气满满哦',
	'愿你的代码没有 bug',
	'日拱一卒，功不唐捐',
	'摸鱼愉快',
	'心想事成',
	'愿你被这个世界温柔以待',
	'万事胜意，平安喜乐',
	'生活明朗，万物可爱',
	'愿所有的好运都在路上',
	'明天会更好哒',
	'好好吃饭，好好睡觉',
	'愿你眼里有光，心中有海',
	'一步一步，慢慢来',
	'你已经很棒啦',
	'愿所有的努力都不被辜负',
	'保持热爱，奔赴山海',
	'愿你三冬暖，愿你春不寒',
	'星光不问赶路人',
	'事事顺心，笑口常开',
	'慢慢来，比较快',
	'今天的风也很温柔',
	'愿你的等待都不落空',
	'记得给自己一个拥抱',
	'你值得所有的美好'
]

/** 字符串哈希 → 稳定种子（同一文本参数固定，重渲染不跳变） */
function hashCode(str: string): number {
	let h = 0
	for (let i = 0; i < str.length; i++) {
		h = (h * 31 + str.charCodeAt(i)) | 0
	}
	return h >>> 0
}

function seededRand(seed: number, salt: number): number {
	const x = Math.sin(seed * 991 + salt * 73) * 10000
	return x - Math.floor(x)
}

interface DanmakuItem {
	id: string
	text: string
	isUser: boolean
	duration: number
	delay: number
	top: number
	opacity: number
	fontSize: number
}

interface FlyingItem {
	id: number
	text: string
	top: number
	distance: number
}

function loadUserDanmaku(): string[] {
	try {
		const raw = localStorage.getItem(DANMAKU_KEY)
		if (raw) {
			const arr = JSON.parse(raw)
			if (Array.isArray(arr)) return arr.filter((s): s is string => typeof s === 'string')
		}
	} catch {
		/* ignore */
	}
	return []
}

function saveUserDanmaku(list: string[]) {
	try {
		localStorage.setItem(DANMAKU_KEY, JSON.stringify(list))
	} catch {
		/* ignore */
	}
}

export default function DanmakuPage(): ReactElement {
	const [userTexts, setUserTexts] = useState<string[]>([])
	const [input, setInput] = useState('')
	const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([])
	const skyRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		setUserTexts(loadUserDanmaku())
	}, [])

	// 40 条循环弹幕：参数由「文本 + 出现序号」哈希固定，重渲染时既有弹幕不跳变
	const danmakuList = useMemo<DanmakuItem[]>(() => {
		const texts: { text: string; isUser: boolean }[] = [
			...userTexts.map(t => ({ text: t, isUser: true })),
			...PRESET_BLESSINGS.map(t => ({ text: t, isUser: false }))
		]
		if (texts.length === 0) return []
		return Array.from({ length: LOOP_COUNT }, (_, i) => {
			const src = texts[i % texts.length]
			const occ = Math.floor(i / texts.length)
			const seed = hashCode(`${src.text}#${occ}`)
			const r = (salt: number) => seededRand(seed, salt)
			return {
				id: String(seed),
				text: src.text,
				isUser: src.isUser,
				duration: 8 + r(1) * 8,
				delay: r(2) * 12,
				top: r(3) * 85,
				opacity: 0.55 + r(4) * 0.4,
				fontSize: 12 + r(5) * 3
			}
		})
	}, [userTexts])

	const handleSend = () => {
		const text = input.trim().slice(0, TEXT_MAX)
		if (!text) return
		const next = [text, ...userTexts].slice(0, MAX_SAVED)
		setUserTexts(next)
		saveUserDanmaku(next)
		const id = Date.now()
		const width = skyRef.current?.offsetWidth ?? 600
		setFlyingItems(prev => [...prev, { id, text, top: 4 + Math.random() * 16, distance: width + 600 }])
		setInput('')
		window.setTimeout(() => {
			setFlyingItems(prev => prev.filter(item => item.id !== id))
		}, (FLY_DURATION + 0.5) * 1000)
	}

	const total = PRESET_BLESSINGS.length + userTexts.length

	return (
		<div className='mx-auto w-full max-w-2xl px-6 pt-24 pb-12 max-sm:px-4'>
			<style>{`@keyframes danmaku-move { from { transform: translateX(0); } to { transform: translateX(calc(-100% - 100vw)); } }`}</style>

			<div className='mb-10 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<MessagesSquare className='text-brand h-7 w-7' />
					弹幕祝福墙
				</h1>
				<p className='text-secondary mt-2 text-sm'>把祝福发射到夜空里</p>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className='bg-card overflow-hidden rounded-3xl border backdrop-blur-sm'>
				{/* 夜空弹幕剧场 */}
				<div
					ref={skyRef}
					className='relative h-[420px] max-sm:h-[320px] overflow-hidden bg-gradient-to-b from-[#0b1026] to-[#1d2547]'>
					{danmakuList.map(item => (
						<div
							key={item.id}
							className={`absolute left-full whitespace-nowrap ${item.isUser ? 'text-brand font-medium' : 'text-white'}`}
							style={{
								top: `${item.top}%`,
								fontSize: item.fontSize,
								opacity: item.opacity,
								animation: `danmaku-move ${item.duration.toFixed(2)}s linear ${item.delay.toFixed(2)}s infinite`,
								textShadow: '0 1px 4px rgb(0 0 0 / 0.45)'
							}}>
							{item.isUser && <span>✦ </span>}
							{item.text}
						</div>
					))}

					{/* 发送后的一次性飞行动画 */}
					{flyingItems.map(item => (
						<motion.div
							key={item.id}
							initial={{ x: 0 }}
							animate={{ x: -item.distance }}
							transition={{ duration: FLY_DURATION, ease: 'linear' }}
							className='text-brand absolute left-full text-sm font-medium whitespace-nowrap'
							style={{ top: `${item.top}%`, textShadow: '0 1px 4px rgb(0 0 0 / 0.45)' }}>
							✦ {item.text}
						</motion.div>
					))}
				</div>

				{/* 发送栏 */}
				<div className='bg-secondary/20 flex items-center gap-3 p-4 max-sm:gap-2 max-sm:p-3'>
					<input
						value={input}
						onChange={e => setInput(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && handleSend()}
						maxLength={TEXT_MAX}
						placeholder='写一句祝福，发射到夜空…'
						className='border-brand/40 focus:border-brand text-secondary placeholder:text-secondary/60 min-w-0 flex-1 rounded-full border bg-transparent px-4 py-2 text-sm outline-none transition-colors'
					/>
					<button
						onClick={handleSend}
						disabled={!input.trim()}
						className='bg-brand flex shrink-0 items-center gap-1 rounded-full px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40'>
						<Send className='h-4 w-4' />
						发送
					</button>
				</div>
			</motion.div>

			<div className='text-secondary mt-4 text-center text-xs'>
				已飘过 <span className='text-brand font-medium'>{total}</span> 条祝福
			</div>
			<p className='text-secondary mt-6 text-center text-xs'>你发出的祝福仅保存在浏览器本地</p>
		</div>
	)
}
