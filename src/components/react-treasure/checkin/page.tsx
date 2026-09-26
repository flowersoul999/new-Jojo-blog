'use client'

import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { CalendarCheck, Flame, Trophy } from 'lucide-react'

const STORAGE_KEY = 'treasure-checkin-dates'

const MILESTONES = [
	{ emoji: '🎯', days: 3, label: '3 天' },
	{ emoji: '🌟', days: 7, label: '7 天' },
	{ emoji: '💎', days: 21, label: '21 天' },
	{ emoji: '🏆', days: 60, label: '60 天' },
	{ emoji: '👑', days: 100, label: '100 天' }
]

function getTodayKey(d = new Date()): string {
	return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

function shiftDateKey(key: string, deltaDays: number): string {
	const [y, m, d] = key.split('-').map(Number)
	const date = new Date(y, m - 1, d)
	date.setDate(date.getDate() + deltaDays)
	return getTodayKey(date)
}

function loadDates(): string[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) {
			const arr = JSON.parse(raw) as string[]
			if (Array.isArray(arr)) return arr
		}
	} catch {
		/* ignore */
	}
	return []
}

/** 从 todayKey 往前数连续打卡天数（今天未打卡则从昨天起算，保留已有连击） */
function computeStreak(dates: Set<string>, todayKey: string): number {
	let start = todayKey
	if (!dates.has(start)) start = shiftDateKey(start, -1)
	let streak = 0
	while (dates.has(start)) {
		streak++
		start = shiftDateKey(start, -1)
	}
	return streak
}

export default function CheckinPage(): ReactElement {
	const [dates, setDates] = useState<string[]>([])
	const [justChecked, setJustChecked] = useState(false)

	useEffect(() => {
		setDates(loadDates())
	}, [])

	const dateSet = useMemo(() => new Set(dates), [dates])
	const todayKey = getTodayKey()
	const checkedToday = dateSet.has(todayKey)

	const streak = useMemo(() => computeStreak(dateSet, todayKey), [dateSet, todayKey])
	const total = dates.length

	const handleCheckin = () => {
		if (checkedToday) return
		const next = [...dates, todayKey]
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
		} catch {
			/* ignore */
		}
		setDates(next)
		setJustChecked(true)
		setTimeout(() => setJustChecked(false), 1000)
	}

	// 本月日历数据
	const now = new Date()
	const year = now.getFullYear()
	const month = now.getMonth()
	const daysInMonth = new Date(year, month + 1, 0).getDate()
	// 周一开头
	const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7
	const weekdays = ['一', '二', '三', '四', '五', '六', '日']

	return (
		<div className='mx-auto w-full max-w-2xl px-6 pt-24 pb-12 max-sm:px-4'>
			<div className='mb-10 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<CalendarCheck className='text-brand h-7 w-7' />
					每日打卡
				</h1>
				<p className='text-secondary mt-2 text-sm'>每一天的坚持，都值得被看见</p>
			</div>

			{/* 打卡主卡片 */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className='bg-card rounded-3xl border p-6 backdrop-blur-sm'>
				<div className='relative flex flex-col items-center'>
					{/* 打卡成功的小星星 */}
					{justChecked &&
						[...Array(6)].map((_, i) => {
							const angle = (i / 6) * Math.PI * 2
							return (
								<motion.span
									key={i}
									className='text-brand pointer-events-none absolute top-1/2 left-1/2 text-lg'
									initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
									animate={{
										opacity: 0,
										x: Math.cos(angle) * 90,
										y: Math.sin(angle) * 90,
										scale: 1.2
									}}
									transition={{ duration: 0.9, ease: 'easeOut' }}>
									✦
								</motion.span>
							)
						})}

					<motion.button
						onClick={handleCheckin}
						disabled={checkedToday}
						animate={justChecked ? { scale: [1, 0.85, 1.12, 1] } : { scale: 1 }}
						whileTap={checkedToday ? undefined : { scale: 0.92 }}
						transition={{ type: 'spring', stiffness: 300, damping: 15 }}
						className={`flex h-32 w-32 items-center justify-center rounded-full text-lg font-medium shadow-lg max-sm:h-28 max-sm:w-28 ${
							checkedToday
								? 'bg-brand/10 text-brand cursor-default border border-brand/40'
								: 'bg-brand text-white transition-shadow hover:shadow-xl'
						}`}>
						{checkedToday ? (
							<span className='flex flex-col items-center gap-1'>
								<span className='text-2xl'>✓</span>
								<span className='text-xs'>今日已打卡</span>
							</span>
						) : (
							<span className='flex flex-col items-center gap-1'>
								打卡
								<span className='text-xl'>✦</span>
							</span>
						)}
					</motion.button>

					<div className='text-secondary mt-4 text-xs'>
						{checkedToday ? '今天也有好好生活呀，明天见 👋' : '点击按钮，为今天盖个章'}
					</div>
				</div>

				{/* 统计 */}
				<div className='mt-6 grid grid-cols-2 gap-4'>
					<div className='bg-secondary/20 flex flex-col items-center rounded-2xl p-4'>
						<Flame className='text-brand h-5 w-5' />
						<div className='font-averia mt-1 text-2xl font-medium'>{streak}</div>
						<div className='text-secondary text-xs'>连续打卡（天）</div>
					</div>
					<div className='bg-secondary/20 flex flex-col items-center rounded-2xl p-4'>
						<Trophy className='text-brand h-5 w-5' />
						<div className='font-averia mt-1 text-2xl font-medium'>{total}</div>
						<div className='text-secondary text-xs'>累计打卡（天）</div>
					</div>
				</div>
			</motion.div>

			{/* 月历卡片 */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className='bg-card mt-6 rounded-3xl border p-6 backdrop-blur-sm max-sm:p-5'>
				<div className='mb-4 flex items-center justify-between'>
					<div className='text-sm font-medium'>
						{year} 年 {month + 1} 月
					</div>
					<div className='text-secondary text-xs'>
						本月已打卡 {dates.filter(d => d.startsWith(`${year}-${(month + 1).toString().padStart(2, '0')}`)).length} 天
					</div>
				</div>

				<div className='grid grid-cols-7 gap-1 text-center'>
					{weekdays.map(w => (
						<div key={w} className='text-secondary pb-1 text-xs'>
							{w}
						</div>
					))}
					{[...Array(firstOffset)].map((_, i) => (
						<div key={`empty-${i}`} />
					))}
					{[...Array(daysInMonth)].map((_, i) => {
						const day = i + 1
						const key = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
						const checked = dateSet.has(key)
						const isToday = key === todayKey
						return (
							<div key={key} className='flex justify-center py-0.5'>
								<div
									className={`flex h-9 w-9 items-center justify-center rounded-full text-sm max-sm:h-8 max-sm:w-8 ${
										checked
											? 'bg-brand text-white'
											: isToday
												? 'border-brand/40 text-brand border'
												: 'text-secondary'
									}`}>
									{day}
								</div>
							</div>
						)
					})}
				</div>
			</motion.div>

			{/* 里程碑 */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className='bg-card mt-6 rounded-3xl border p-6 backdrop-blur-sm max-sm:p-5'>
				<div className='mb-4 text-sm font-medium'>里程碑</div>
				<div className='flex flex-wrap justify-between gap-3'>
					{MILESTONES.map(m => {
						const reached = streak >= m.days
						return (
							<div
								key={m.days}
								className={`flex min-w-14 flex-col items-center gap-1 rounded-2xl border px-3 py-3 transition-all max-sm:px-2 ${
									reached ? 'border-brand/40 bg-brand/10' : 'border-transparent opacity-40'
								}`}>
								<span className='text-2xl'>{m.emoji}</span>
								<span className={`text-xs font-medium ${reached ? 'text-brand' : 'text-secondary'}`}>{m.label}</span>
							</div>
						)
					})}
				</div>
			</motion.div>

			<p className='text-secondary mt-6 text-center text-xs'>数据仅保存在你的浏览器本地</p>
		</div>
	)
}
