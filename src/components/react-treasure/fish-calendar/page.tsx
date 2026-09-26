'use client'

import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CalendarDays, Quote, History, Rocket, Fish } from 'lucide-react'
import {
	getOngoingHoliday,
	getNextHoliday,
	getDaysUntilWeekend,
	fetchHitokoto,
	type Hitokoto
} from '@/components/react-treasure/lib/daily-info'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function FishCalendarPage(): ReactElement {
	// 首帧不渲染日期内容，避免 SSR/客户端时区不一致导致水合错位
	const [today, setToday] = useState<Date | null>(null)
	const [quote, setQuote] = useState<Hitokoto | null>(null)
	const [history, setHistory] = useState<string[]>([])

	useEffect(() => {
		const now = new Date()
		setToday(now)

		fetchHitokoto(now).then(setQuote)

		// 历史上的今天（静态数据）
		const mmdd = `${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`
		fetch('/history-today.json')
			.then(r => r.json())
			.then((data: Record<string, string[]>) => setHistory(data[mmdd] || []))
			.catch(() => setHistory([]))
	}, [])

	const ongoing = today ? getOngoingHoliday(today) : null
	const next = today ? getNextHoliday(today) : null
	const daysToWeekend = today ? getDaysUntilWeekend(today) : 0

	const yearEndDays = today
		? Math.round((new Date(today.getFullYear(), 11, 31).getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / (24 * 60 * 60 * 1000))
		: 0

	return (
		<div className='mx-auto w-full max-w-2xl px-6 pt-24 pb-12 max-sm:px-4'>
			<div className='mb-10 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<Fish className='text-brand h-7 w-7' />
					摸鱼日历
				</h1>
				<p className='text-secondary mt-2 text-sm'>上班是别人的，摸鱼是自己的</p>
			</div>

			{/* 今日卡片 */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className='bg-card mb-4 rounded-3xl border p-6 backdrop-blur-sm'>
				{!today ? (
					<div className='text-secondary py-6 text-center text-sm'>日历加载中...</div>
				) : (
					<>
						<div className='flex items-end justify-between max-sm:flex-col max-sm:gap-3'>
							<div>
								<div className='text-secondary text-xs'>{today.getFullYear()} 年</div>
								<div className='font-averia mt-1 text-4xl font-medium'>
									{today.getMonth() + 1} 月 {today.getDate()} 日
								</div>
								<div className='text-secondary mt-1 text-sm'>星期{WEEKDAYS[today.getDay()]}</div>
							</div>
							<div
								className={`rounded-full px-4 py-1.5 text-xs font-medium ${
									ongoing ? 'bg-brand/15 text-brand' : 'bg-secondary/30 text-secondary'
								}`}>
								{ongoing ? `🎉 ${ongoing.name}假期中` : '💼 工作日'}
							</div>
						</div>

						{/* 倒计时区 */}
						<div className='mt-5 grid grid-cols-3 gap-3'>
							<div className='bg-secondary/20 rounded-2xl p-3 text-center'>
								<div className='text-secondary text-xs'>距周末</div>
								<div className='font-averia mt-1 text-xl font-medium'>
									{daysToWeekend === 0 ? '中!' : `${daysToWeekend} 天`}
								</div>
							</div>
							<div className='bg-secondary/20 rounded-2xl p-3 text-center'>
								<div className='text-secondary truncate text-xs'>{next ? `距${next.name}` : '假期'}</div>
								<div className='font-averia mt-1 text-xl font-medium'>
									{next ? (next.daysLeft === 0 ? '明天!' : `${next.daysLeft} 天`) : '--'}
								</div>
							</div>
							<div className='bg-secondary/20 rounded-2xl p-3 text-center'>
								<div className='text-secondary text-xs'>距年末</div>
								<div className='font-averia mt-1 text-xl font-medium'>{yearEndDays} 天</div>
							</div>
						</div>

						{next && (
							<div className='text-secondary mt-3 flex items-center gap-1.5 text-xs'>
								<Rocket className='h-3.5 w-3.5' />
								{next.daysLeft === 0
									? `${next.name}明天开始，共 ${next.days} 天！`
									: `${next.name}（${next.start} 起，放假 ${next.days} 天）`}
							</div>
						)}
					</>
				)}
			</motion.div>

			{/* 每日一言 */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.08 }}
				className='bg-card mb-4 rounded-3xl border p-6 backdrop-blur-sm'>
				<div className='text-secondary mb-2 flex items-center gap-1.5 text-xs'>
					<Quote className='h-3.5 w-3.5' />
					每日一言
				</div>
				{quote ? (
					<>
						<p className='text-sm leading-relaxed'>{quote.text}</p>
						<p className='text-secondary mt-2 text-right text-xs'>—— {quote.from}</p>
					</>
				) : (
					<div className='text-secondary text-sm'>正在摘录一句话...</div>
				)}
			</motion.div>

			{/* 历史上的今天 */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.16 }}
				className='bg-card rounded-3xl border p-6 backdrop-blur-sm'>
				<div className='text-secondary mb-3 flex items-center gap-1.5 text-xs'>
					<History className='h-3.5 w-3.5' />
					历史上的今天
				</div>
				{history.length > 0 ? (
					<ul className='space-y-2'>
						{history.map((event, i) => (
							<li key={i} className='flex gap-2 text-sm'>
								<span className='text-brand shrink-0'>·</span>
								{event}
							</li>
						))}
					</ul>
				) : (
					<div className='text-secondary text-sm'>{today ? '今天平静如水，没有大事件发生～' : '加载中...'}</div>
				)}
			</motion.div>

			<div className='text-secondary mt-8 flex items-center justify-center gap-1.5 text-xs'>
				<CalendarDays className='h-3.5 w-3.5' />
				节假日数据基于国务院年度放假安排，供摸鱼参考
			</div>
		</div>
	)
}
