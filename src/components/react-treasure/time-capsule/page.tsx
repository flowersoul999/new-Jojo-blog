'use client'

import type { ReactElement } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Hourglass, Mail, MailOpen, Lock, Trash2, Send } from 'lucide-react'

interface TimeCapsule {
	id: string
	to: string
	content: string
	openDate: string // YYYY-MM-DD
	createdAt: string // YYYY-MM-DD
}

const STORAGE_KEY = 'treasure-time-capsules'
const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_TO = '未来的我'

function toDateStr(d: Date): string {
	const y = d.getFullYear()
	const m = (d.getMonth() + 1).toString().padStart(2, '0')
	const day = d.getDate().toString().padStart(2, '0')
	return `${y}-${m}-${day}`
}

function formatDateCN(dateStr: string): string {
	const [y, m, d] = dateStr.split('-')
	return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`
}

/** 距开启日还剩的天数（开启日当天为 0，即可拆开） */
function getDaysLeft(openDate: string, today: Date): number {
	const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
	const [y, m, d] = openDate.split('-').map(Number)
	const target = new Date(y, m - 1, d).getTime()
	return Math.round((target - todayStart) / DAY_MS)
}

export default function TimeCapsulePage(): ReactElement {
	const [today, setToday] = useState<Date | null>(null)
	const [capsules, setCapsules] = useState<TimeCapsule[] | null>(null) // null = 未从 localStorage 读取
	const [openedIds, setOpenedIds] = useState<Set<string>>(new Set())
	const [to, setTo] = useState('')
	const [content, setContent] = useState('')
	const [date, setDate] = useState('')

	useEffect(() => {
		setToday(new Date())
		try {
			const raw = localStorage.getItem(STORAGE_KEY)
			setCapsules(raw ? (JSON.parse(raw) as TimeCapsule[]) : [])
		} catch {
			setCapsules([])
		}
	}, [])

	const todayStr = today ? toDateStr(today) : ''

	const persist = useCallback((list: TimeCapsule[]) => {
		setCapsules(list)
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
		} catch {
			/* ignore */
		}
	}, [])

	const handleAdd = () => {
		if (!content.trim() || !date || !todayStr || date <= todayStr || !capsules) return
		const capsule: TimeCapsule = {
			id: `${Date.now()}`,
			to: to.trim() || DEFAULT_TO,
			content: content.trim(),
			openDate: date,
			createdAt: todayStr
		}
		persist([capsule, ...capsules])
		setTo('')
		setContent('')
		setDate('')
	}

	const handleDelete = (id: string) => {
		if (!capsules) return
		if (!window.confirm('确定删除这封时间胶囊吗？')) return
		persist(capsules.filter(c => c.id !== id))
	}

	const toggleOpen = (id: string) => {
		setOpenedIds(prev => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	const list = capsules && todayStr ? capsules : []
	// 未到期按开启日期升序（最近到期在前），可拆开按开启日期降序（最近拆开在前）
	const locked = list.filter(c => c.openDate > todayStr).sort((a, b) => a.openDate.localeCompare(b.openDate))
	const unlocked = list.filter(c => c.openDate <= todayStr).sort((a, b) => b.openDate.localeCompare(a.openDate))

	return (
		<div className='mx-auto w-full max-w-2xl px-6 pt-8 pb-12 max-sm:px-4'>
			{/* 标题区 */}
			<div className='mb-10 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<Hourglass className='text-brand h-7 w-7' />
					时间胶囊
				</h1>
				<p className='text-secondary mt-2 text-sm'>写给未来的信，到期才能拆开</p>
			</div>

			{/* 写信表单 */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className='bg-card mb-8 rounded-3xl border p-6 backdrop-blur-sm max-sm:p-5'>
				<div className='flex flex-col gap-3 sm:flex-row'>
					<input
						value={to}
						onChange={e => setTo(e.target.value)}
						placeholder={`收信人称呼，默认「${DEFAULT_TO}」`}
						maxLength={20}
						className='bg-secondary/20 focus:border-brand min-w-0 flex-1 rounded-xl border border-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400'
					/>
					<input
						type='date'
						value={date}
						min={todayStr || undefined}
						onChange={e => setDate(e.target.value)}
						className='bg-secondary/20 text-secondary rounded-xl px-4 py-2.5 text-sm outline-none'
					/>
				</div>
				<textarea
					value={content}
					onChange={e => setContent(e.target.value)}
					placeholder='写点想对未来说的话...'
					rows={4}
					maxLength={500}
					className='bg-secondary/20 focus:border-brand mt-3 w-full resize-none rounded-xl border border-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400'
				/>
				<div className='mt-3 flex items-center justify-between gap-3 max-sm:flex-col-reverse max-sm:items-stretch'>
					<p className='text-secondary text-xs max-sm:text-center'>信件内容将保密到开启日期</p>
					<button
						onClick={handleAdd}
						disabled={!content.trim() || !date || !todayStr || date <= todayStr}
						className='bg-brand flex shrink-0 items-center justify-center gap-1 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40'>
						<Send className='h-4 w-4' />
						封存信件
					</button>
				</div>
			</motion.div>

			{/* 列表 */}
			{capsules === null || !today ? (
				<div className='text-secondary py-6 text-center text-sm'>加载中...</div>
			) : list.length === 0 ? (
				<div className='border-dashed text-secondary rounded-3xl border-2 py-10 text-center text-sm'>
					还没有时间胶囊，写一封给未来的信吧 🌱
				</div>
			) : (
				<>
					{/* 未到期区 */}
					<section>
						<div className='text-secondary mb-3 flex items-center gap-1.5 text-xs font-medium'>
							<Lock className='h-3.5 w-3.5' />
							未到期 · {locked.length} 封
						</div>
						<div className='flex flex-col gap-3'>
							{locked.length === 0 && (
								<div className='text-secondary py-3 text-center text-xs'>信件都已到期，快去下面拆开看看吧 ✨</div>
							)}
							{locked.map((capsule, index) => {
								const days = getDaysLeft(capsule.openDate, today)
								return (
									<motion.div
										key={capsule.id}
										initial={{ opacity: 0, y: 12 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.04 }}
										className='bg-card flex items-center gap-3 rounded-3xl border p-6 backdrop-blur-sm max-sm:p-5'>
										<div className='min-w-0 flex-1'>
											<div className='flex items-center justify-between gap-2'>
												<div className='flex min-w-0 items-center gap-2'>
													<Mail className='text-secondary h-4 w-4 shrink-0' />
													<span className='truncate text-sm font-medium'>To: {capsule.to}</span>
												</div>
												<button
													onClick={() => handleDelete(capsule.id)}
													className='text-secondary hover:text-red-500 shrink-0 rounded-lg p-1.5 transition-colors'
													title='删除'>
													<Trash2 className='h-4 w-4' />
												</button>
											</div>
											<div className='text-secondary mt-0.5 text-xs'>开启日期 {formatDateCN(capsule.openDate)}</div>
											{/* 内容保密：模糊虚化 + 锁定图标 */}
											<div className='bg-secondary/20 mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5'>
												<p className='text-secondary line-clamp-1 flex-1 text-xs blur-sm select-none'>{capsule.content}</p>
												<Lock className='text-secondary h-3.5 w-3.5 shrink-0' />
											</div>
										</div>
										<div className='shrink-0 text-right'>
											<div className='font-averia text-brand text-3xl font-medium'>{days}</div>
											<div className='text-secondary text-xs'>天后可拆</div>
										</div>
									</motion.div>
								)
							})}
						</div>
					</section>

					{/* 可拆开区 */}
					<section className='mt-8'>
						<div className='text-secondary mb-3 flex items-center gap-1.5 text-xs font-medium'>
							<MailOpen className='h-3.5 w-3.5' />
							可拆开 · {unlocked.length} 封
						</div>
						<div className='flex flex-col gap-3'>
							{unlocked.length === 0 && (
								<div className='text-secondary py-3 text-center text-xs'>还没有到期的信，再等等吧 ⏳</div>
							)}
							{unlocked.map((capsule, index) => {
								const isOpen = openedIds.has(capsule.id)
								return (
									<motion.div
										key={capsule.id}
										initial={{ opacity: 0, y: 12 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.04 }}
										className='bg-card rounded-3xl border p-6 backdrop-blur-sm max-sm:p-5'>
										<div className='flex items-center justify-between gap-2'>
											<div className='flex min-w-0 items-center gap-2'>
												<MailOpen className='text-brand h-4 w-4 shrink-0' />
												<span className='truncate text-sm font-medium'>To: {capsule.to}</span>
											</div>
											<button
												onClick={() => handleDelete(capsule.id)}
												className='text-secondary hover:text-red-500 shrink-0 rounded-lg p-1.5 transition-colors'
												title='删除'>
												<Trash2 className='h-4 w-4' />
											</button>
										</div>
										<div className='text-secondary mt-0.5 text-xs'>
											开启日期 {formatDateCN(capsule.openDate)}
											{capsule.openDate === todayStr && ' · 今天可拆'}
										</div>
										<AnimatePresence initial={false}>
											{isOpen ? (
												<motion.div
													key='opened'
													initial={{ height: 0, opacity: 0 }}
													animate={{ height: 'auto', opacity: 1 }}
													exit={{ height: 0, opacity: 0 }}
													transition={{ duration: 0.3, ease: 'easeOut' }}
													className='overflow-hidden'>
													<div className='border-brand/40 bg-brand/10 mt-4 rounded-2xl border border-dashed p-4'>
														<p className='text-sm leading-relaxed whitespace-pre-wrap'>{capsule.content}</p>
														<p className='text-secondary mt-3 text-right text-xs'>—— 写于 {formatDateCN(capsule.createdAt)}</p>
													</div>
													<button
														onClick={() => toggleOpen(capsule.id)}
														className='text-secondary mt-3 flex items-center gap-1 text-xs transition-opacity hover:opacity-70'>
														<Lock className='h-3 w-3' />
														重新封上
													</button>
												</motion.div>
											) : (
												<motion.div
													key='sealed'
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													className='mt-4'>
													<div className='bg-secondary/20 flex items-center gap-2 rounded-xl px-3 py-2.5'>
														<p className='text-secondary line-clamp-1 flex-1 text-xs blur-sm select-none'>{capsule.content}</p>
														<Lock className='text-secondary h-3.5 w-3.5 shrink-0' />
													</div>
													<button
														onClick={() => toggleOpen(capsule.id)}
														className='bg-brand mt-3 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90'>
														<MailOpen className='h-4 w-4' />
														拆开信件
													</button>
												</motion.div>
											)}
										</AnimatePresence>
									</motion.div>
								)
							})}
						</div>
					</section>
				</>
			)}

			<p className='text-secondary mt-6 text-center text-xs'>数据仅保存在你的浏览器本地</p>
		</div>
	)
}
