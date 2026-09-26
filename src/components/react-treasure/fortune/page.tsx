'use client'

import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, RotateCcw } from 'lucide-react'
import { simpleHash, getTodayKey } from '@/components/react-treasure/lib/daily-info'

/* ------------------------------- 签文数据 ------------------------------- */

const LEVELS = [
	{ name: '大吉', weight: 12, note: '鸿运当头，今天做什么都顺，冲就完事了！' },
	{ name: '中吉', weight: 20, note: '稳步向好运，机会在悄悄靠近，留点心。' },
	{ name: '小吉', weight: 22, note: '小确幸的一天，遇到的小好事都值得记下来。' },
	{ name: '吉', weight: 20, note: '平平淡淡才是真，稳住我们能赢。' },
	{ name: '末吉', weight: 14, note: '运势先抑后扬，扛过下午就好起来了。' },
	{ name: '凶', weight: 6, note: '别慌！小小的不顺是好运来临前的深呼吸。' }
]

const GOOD_THINGS = [
	'摸鱼', '喝茶', '写代码', '重构', '发呆', '划水', '补觉', '喝奶茶',
	'撸猫', '看番', '散步', '记账', '早起', '读书', '写日记', '整理桌面',
	'提交代码', '写测试', '删掉无用代码', '水群', '提前规划', '赞美同事', '准点下班', '给自己充电'
]

const BAD_THINGS = [
	'开会', '加班', '合并主干', '改需求', '熬夜', '调试祖传代码', '直接上线', '冲动消费',
	'赖床', '暴饮暴食', '乱动生产环境', '忘记备份', '立 flag', '假装努力', '空口承诺', '深夜做决定',
	'打开购物软件', '跟人抬杠', '点开短视频就停不下来', '许诺做不到的事'
]

/* ------------------------------- 伪随机（同一天同一支签） ------------------------------- */

function mulberry32(seed: number) {
	return () => {
		seed |= 0
		seed = (seed + 0x6d2b79f5) | 0
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

interface Fortune {
	level: string
	note: string
	luckNumber: number
	good: string[]
	bad: string[]
}

function getTodayFortune(dateKey: string): Fortune {
	const rand = mulberry32(simpleHash(`jojo-fortune-${dateKey}`))

	// 按权重选等级
	const totalWeight = LEVELS.reduce((sum, l) => sum + l.weight, 0)
	let roll = rand() * totalWeight
	const level = LEVELS.find(l => (roll -= l.weight) <= 0) || LEVELS[3]

	// 不放回抽 3 宜 2 忌
	const pick = (pool: string[], n: number) => {
		const copy = [...pool]
		const picked: string[] = []
		for (let i = 0; i < n; i++) {
			picked.push(copy.splice(Math.floor(rand() * copy.length), 1)[0])
		}
		return picked
	}

	return {
		level: level.name,
		note: level.note,
		luckNumber: (simpleHash(dateKey) % 100) + 1,
		good: pick(GOOD_THINGS, 3),
		bad: pick(BAD_THINGS, 2)
	}
}

/* ------------------------------- 页面 ------------------------------- */

export default function FortunePage(): ReactElement {
	const [mounted, setMounted] = useState(false)
	const [drawing, setDrawing] = useState(false)
	const [fortune, setFortune] = useState<Fortune | null>(null)
	const [alreadyDrawn, setAlreadyDrawn] = useState(false)

	useEffect(() => {
		const key = getTodayKey()
		setMounted(true)
		if (localStorage.getItem(`fortune-drawn-${key}`)) {
			setAlreadyDrawn(true)
			setFortune(getTodayFortune(key))
		}
	}, [])

	const draw = () => {
		if (drawing) return
		const key = getTodayKey()
		if (alreadyDrawn) {
			setFortune(getTodayFortune(key))
			return
		}
		setDrawing(true)
		// 摇签动画结束后出签
		setTimeout(() => {
			setFortune(getTodayFortune(key))
			localStorage.setItem(`fortune-drawn-${key}`, '1')
			setAlreadyDrawn(true)
			setDrawing(false)
		}, 900)
	}

	return (
		<div className='mx-auto flex w-full max-w-md flex-col items-center px-6 pt-24 pb-12 max-sm:px-4'>
			<div className='mb-10 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<Sparkles className='text-brand h-6 w-6' />
					今日运势
				</h1>
				<p className='text-secondary mt-2 text-sm'>每天一支专属签 · 同一天结果相同</p>
			</div>

			<AnimatePresence mode='wait'>
				{!mounted ? null : !fortune ? (
					// 签筒状态
					<motion.div
						key='box'
						exit={{ opacity: 0, scale: 0.9 }}
						className='flex flex-col items-center'>
						<motion.div
							animate={drawing ? { rotate: [0, -10, 10, -8, 8, -5, 5, 0], y: [0, -4, 0, -2, 0] } : { rotate: 0, y: 0 }}
							transition={{ duration: 0.9 }}
							className='bg-secondary/20 flex h-40 w-32 items-end justify-center rounded-t-[60px] rounded-b-3xl border-2 border-dashed'>
							{/* 签杆群 */}
							<div className='mb-3 flex items-end gap-1.5'>
								{[16, 28, 22, 32, 24, 30, 18].map((h, i) => (
									<div
										key={i}
										className={`w-1.5 rounded-full ${i % 2 ? 'bg-brand/60' : 'bg-secondary'}`}
										style={{ height: h }}
									/>
								))}
							</div>
						</motion.div>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={draw}
							disabled={drawing}
							className='brand-btn mt-8 px-8 py-2.5 text-sm'>
							{drawing ? '摇签中...' : '摇一摇 · 抽今日签'}
						</motion.button>
					</motion.div>
				) : (
					// 签纸状态
					<motion.div
						key='paper'
						initial={{ opacity: 0, y: 60, rotate: -3 }}
						animate={{ opacity: 1, y: 0, rotate: 0 }}
						transition={{ type: 'spring', stiffness: 120, damping: 14 }}
						className='bg-card w-full rounded-3xl border p-8 text-center backdrop-blur-sm'>
						<div className='text-secondary text-xs'>JOJO 神社 · 第 {fortune.luckNumber} 签</div>
						<div className='brand-text font-averia mt-3 text-5xl font-medium tracking-widest'>{fortune.level}</div>
						<p className='text-secondary mt-4 text-xs leading-relaxed'>{fortune.note}</p>

						<div className='mt-6 grid grid-cols-2 gap-3 text-sm'>
							<div className='bg-secondary/20 rounded-2xl p-4'>
								<div className='text-brand mb-2 text-xs font-medium'>宜</div>
								<ul className='space-y-1.5'>
									{fortune.good.map(g => (
										<li key={g}>{g}</li>
									))}
								</ul>
							</div>
							<div className='bg-secondary/20 rounded-2xl p-4'>
								<div className='text-secondary mb-2 text-xs font-medium'>忌</div>
								<ul className='space-y-1.5'>
									{fortune.bad.map(b => (
										<li key={b}>{b}</li>
									))}
								</ul>
							</div>
						</div>

						<button
							onClick={draw}
							className='text-secondary mt-6 inline-flex items-center gap-1 text-xs transition-colors hover:opacity-70'>
							<RotateCcw className='h-3 w-3' />
							再摇一次（今天的结果不会变哦）
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			<p className='text-secondary mt-8 text-center text-xs'>运势仅供娱乐 · 好运来自好心情</p>
		</div>
	)
}
