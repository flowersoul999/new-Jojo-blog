'use client'

import type { ReactElement } from 'react'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { CalendarHeart, Plus, Trash2, Repeat, Bell } from 'lucide-react'
import { toast } from 'sonner'

interface CountdownItem {
	id: string
	title: string
	date: string // YYYY-MM-DD
	repeatYear: boolean // 每年重复（生日/纪念日）
}

const STORAGE_KEY = 'treasure-countdowns'
const NOTIFY_KEY = 'treasure-notify-enabled'
const DAY_MS = 24 * 60 * 60 * 1000

function toDateStr(d: Date): string {
	const y = d.getFullYear()
	const m = (d.getMonth() + 1).toString().padStart(2, '0')
	const day = d.getDate().toString().padStart(2, '0')
	return `${y}-${m}-${day}`
}

/** 计算距目标日的天数：repeatYear 自动取今年/明年的周年日；过去固定日期显示「已过」 */
function getDaysLeft(item: CountdownItem, today: Date): number {
	const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
	const [y, m, d] = item.date.split('-').map(Number)
	let target: number
	if (item.repeatYear) {
		let targetYear = today.getFullYear()
		target = new Date(targetYear, m - 1, d).getTime()
		if (target < todayStart) {
			targetYear += 1
			target = new Date(targetYear, m - 1, d).getTime()
		}
	} else {
		target = new Date(y, m - 1, d).getTime()
	}
	return Math.round((target - todayStart) / DAY_MS)
}

export default function CountdownPage(): ReactElement {
	const [today, setToday] = useState<Date | null>(null)
	const [items, setItems] = useState<CountdownItem[] | null>(null) // null = 未从 localStorage 读取
	const [title, setTitle] = useState('')
	const [date, setDate] = useState('')
	const [repeatYear, setRepeatYear] = useState(false)
	const [notifyEnabled, setNotifyEnabled] = useState(false)

	useEffect(() => {
		setToday(new Date())
		let list: CountdownItem[] = []
		try {
			const raw = localStorage.getItem(STORAGE_KEY)
			list = raw ? (JSON.parse(raw) as CountdownItem[]) : []
		} catch {
			list = []
		}
		setItems(list)
		try {
			setNotifyEnabled(localStorage.getItem(NOTIFY_KEY) === '1')
		} catch {
			setNotifyEnabled(false)
		}

		// 到期提醒：开关开启且今天有到期（days === 0）的倒数日时，发一次系统通知（每天最多一次）
		const dateStr = toDateStr(new Date())
		try {
			if (
				sessionStorage.getItem(`treasure-notify-sent-${dateStr}`) !== '1' &&
				typeof Notification !== 'undefined' &&
				Notification.permission === 'granted'
			) {
				const due = list.find(item => getDaysLeft(item, new Date()) === 0)
				if (due) {
					new Notification('倒数日到啦', { body: `「${due.title}」就是今天！` })
					sessionStorage.setItem(`treasure-notify-sent-${dateStr}`, '1')
				}
			}
		} catch {
			/* ignore */
		}
	}, [])

	const persist = useCallback((list: CountdownItem[]) => {
		setItems(list)
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
		} catch {
			/* ignore */
		}
	}, [])

	const handleAdd = () => {
		if (!title.trim() || !date || !items) return
		const item: CountdownItem = {
			id: `${Date.now()}`,
			title: title.trim(),
			date,
			repeatYear
		}
		persist([...items, item])
		setTitle('')
		setDate('')
		setRepeatYear(false)
	}

	const handleDelete = (id: string) => {
		if (!items) return
		if (!window.confirm('确定删除这条倒数日吗？')) return
		persist(items.filter(i => i.id !== id))
	}

	const handleNotifyToggle = async () => {
		if (notifyEnabled) {
			setNotifyEnabled(false)
			try {
				localStorage.setItem(NOTIFY_KEY, '0')
			} catch {
				/* ignore */
			}
			return
		}
		if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
			try {
				const perm = await Notification.requestPermission()
				if (perm !== 'granted') {
					toast.error('浏览器拒绝了通知权限')
					return
				}
			} catch {
				toast.error('浏览器拒绝了通知权限')
				return
			}
		}
		setNotifyEnabled(true)
		try {
			localStorage.setItem(NOTIFY_KEY, '1')
		} catch {
			/* ignore */
		}
	}

	// 按剩余天数升序（最近的在前）
	const sorted = items && today ? [...items].sort((a, b) => getDaysLeft(a, today) - getDaysLeft(b, today)) : []

	return (
		<div className='mx-auto w-full max-w-2xl px-6 pt-24 pb-12 max-sm:px-4'>
			<div className='mb-10 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<CalendarHeart className='text-brand h-7 w-7' />
					倒数日
				</h1>
				<p className='text-secondary mt-2 text-sm'>记录重要的日子，慢慢期待它到来</p>
			</div>

			{/* 新增表单 */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className='bg-card mb-6 rounded-3xl border p-5 backdrop-blur-sm'>
				<div className='flex flex-col gap-3 sm:flex-row'>
					<input
						value={title}
						onChange={e => setTitle(e.target.value)}
						placeholder='名称，如：我的生日'
						maxLength={20}
						className='bg-secondary/20 focus:border-brand min-w-0 flex-1 rounded-xl border border-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400'
					/>
					<input
						type='date'
						value={date}
						onChange={e => setDate(e.target.value)}
						className='bg-secondary/20 text-secondary rounded-xl px-4 py-2.5 text-sm outline-none'
					/>
					<button
						onClick={handleAdd}
						disabled={!title.trim() || !date}
						className='bg-brand flex shrink-0 items-center justify-center gap-1 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40'>
						<Plus className='h-4 w-4' />
						添加
					</button>
				</div>
				<label className='text-secondary mt-3 flex w-fit cursor-pointer items-center gap-1.5 text-xs select-none'>
					<input
						type='checkbox'
						checked={repeatYear}
						onChange={e => setRepeatYear(e.target.checked)}
						className='accent-brand h-3.5 w-3.5'
					/>
					<Repeat className='h-3 w-3' />
					每年重复（生日 / 纪念日）
				</label>
			</motion.div>

			{/* 到期提醒开关（仅已有倒数日时显示） */}
			{items !== null && items.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					className='bg-card mb-6 flex items-center rounded-3xl border p-4 backdrop-blur-sm'>
					<Bell className='text-secondary h-4 w-4 shrink-0' />
					<span className='ml-2 text-sm'>到期提醒</span>
					<button
						onClick={handleNotifyToggle}
						aria-pressed={notifyEnabled}
						title={notifyEnabled ? '关闭到期提醒' : '开启到期提醒'}
						className={`relative ml-auto h-6 w-11 shrink-0 rounded-full transition-colors ${notifyEnabled ? 'bg-brand' : 'bg-secondary/30'}`}>
						<motion.span
							layout
							transition={{ type: 'spring', stiffness: 500, damping: 32 }}
							className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm ${notifyEnabled ? 'right-0.5' : 'left-0.5'}`}
						/>
					</button>
				</motion.div>
			)}

			{/* 倒数日列表 */}
			{items === null || !today ? (
				<div className='text-secondary py-6 text-center text-sm'>加载中...</div>
			) : sorted.length === 0 ? (
				<div className='border-dashed text-secondary rounded-3xl border-2 py-10 text-center text-sm'>
					还没有倒数日，添加一个吧 🌱
				</div>
			) : (
				<div className='flex flex-col gap-3'>
					{sorted.map((item, index) => {
						const days = getDaysLeft(item, today)
						const isPast = !item.repeatYear && days < 0
						const isToday = days === 0
						return (
							<motion.div
								key={item.id}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.04 }}
								className={`bg-card flex items-center rounded-3xl border p-5 backdrop-blur-sm ${
									isToday ? 'border-brand/40' : ''
								}`}>
								<div className='min-w-0 flex-1'>
									<div className='flex items-center gap-2'>
										<span className='truncate text-sm font-medium'>{item.title}</span>
										{item.repeatYear && <Repeat className='text-secondary h-3 w-3 shrink-0' />}
									</div>
									<div className='text-secondary mt-0.5 text-xs'>
										{item.date}
										{item.repeatYear && ` · 每年 ${Number(item.date.split('-')[1])} 月 ${Number(item.date.split('-')[2])} 日`}
									</div>
								</div>
								<div className='mr-3 shrink-0 text-right'>
									{isToday ? (
										<span className='brand-text font-averia text-2xl font-medium'>就是今天!</span>
									) : isPast ? (
										<span className='text-secondary text-sm'>已过 {Math.abs(days)} 天</span>
									) : (
										<>
											<div className='font-averia text-brand text-3xl font-medium'>{days}</div>
											<div className='text-secondary text-xs'>天后</div>
										</>
									)}
								</div>
								<button
									onClick={() => handleDelete(item.id)}
									className='text-secondary hover:text-red-500 shrink-0 rounded-lg p-1.5 transition-colors'
									title='删除'>
									<Trash2 className='h-4 w-4' />
								</button>
							</motion.div>
						)
					})}
				</div>
			)}

			<p className='text-secondary mt-6 text-center text-xs'>数据仅保存在你的浏览器本地</p>
		</div>
	)
}
