'use client'

import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Radio, Pencil, Check, X, Music } from 'lucide-react'
import { useMobileMusicStore } from '@/components/react-treasure/lib/mobile-music-store'
import type { ReactNode } from 'react'

interface NowData {
	reading: string
	readingProgress: number // 0-100
	playing: string
	watching: string
	mood: string
	updatedAt: string // ISO
}

const STORAGE_KEY = 'treasure-now'
const DAY_MS = 24 * 60 * 60 * 1000

const INPUT_CLASS =
	'bg-secondary/20 focus:border-brand w-full rounded-xl border border-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400'

const DEFAULT_DATA: NowData = {
	reading: '《小王子》',
	readingProgress: 60,
	playing: '《星露谷物语》',
	watching: '《葬送的芙莉莲》',
	mood: '想把博客做好玩',
	updatedAt: new Date().toISOString()
}

/** 「X 天前更新」格式 */
function formatUpdated(iso: string): string {
	const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS)
	if (days <= 0) return '今天更新'
	if (days === 1) return '昨天更新'
	return `${days} 天前更新`
}

/** 「刚刚 / X 分钟前 / X 小时前 / X 天前」格式 */
function formatRelative(time: number): string {
	const minutes = Math.floor((Date.now() - time) / 60000)
	if (minutes < 1) return '刚刚'
	if (minutes < 60) return `${minutes} 分钟前`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours} 小时前`
	return `${Math.floor(hours / 24)} 天前`
}

function NowRow({
	emoji,
	label,
	value,
	extra
}: {
	emoji: string
	label: string
	value: ReactNode
	extra?: ReactNode
}) {
	return (
		<div className='flex items-center gap-4 py-5 first:pt-0 last:pb-0'>
			<div className='bg-secondary/20 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl'>
				{emoji}
			</div>
			<div className='min-w-0 flex-1'>
				<div className='text-secondary text-xs'>{label}</div>
				<div className='mt-0.5 text-sm font-medium break-words'>{value}</div>
				{extra}
			</div>
		</div>
	)
}

export default function NowPage(): ReactElement {
	const [data, setData] = useState<NowData | null>(null) // null = 未从 localStorage 读取
	const [editing, setEditing] = useState(false)
	const [form, setForm] = useState<NowData | null>(null)
	const history = useMobileMusicStore(s => s.history)
	const [mounted, setMounted] = useState(false) // SSR 安全：挂载后才展示本地数据

	useEffect(() => {
		setMounted(true)
		try {
			const raw = localStorage.getItem(STORAGE_KEY)
			if (raw) {
				setData(JSON.parse(raw) as NowData)
			} else {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA))
				setData(DEFAULT_DATA)
			}
		} catch {
			setData(DEFAULT_DATA)
		}
	}, [])

	const startEdit = () => {
		if (!data) return
		setForm({ ...data })
		setEditing(true)
	}

	const handleSave = () => {
		if (!form) return
		const next: NowData = {
			reading: form.reading.trim(),
			playing: form.playing.trim(),
			watching: form.watching.trim(),
			mood: form.mood.trim(),
			readingProgress: Math.min(100, Math.max(0, Math.round(form.readingProgress || 0))),
			updatedAt: new Date().toISOString()
		}
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
		} catch {
			/* ignore */
		}
		setData(next)
		setEditing(false)
	}

	return (
		<div className='mx-auto w-full max-w-2xl px-6 pt-8 pb-12 max-sm:px-4'>
			<div className='mb-10 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<Radio className='text-brand h-7 w-7' />
					Now
				</h1>
				<p className='text-secondary mt-2 text-sm'>此刻的我在做什么</p>
			</div>

			{data === null ? (
				<div className='text-secondary py-6 text-center text-sm'>加载中...</div>
			) : editing && form ? (
				/* 编辑模式 */
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					className='bg-card rounded-3xl border p-6 backdrop-blur-sm'>
					<div className='flex flex-col gap-4'>
						<div>
							<label className='text-secondary mb-1.5 block text-xs'>📖 最近在读</label>
							<input
								value={form.reading}
								onChange={e => setForm({ ...form, reading: e.target.value })}
								placeholder='书名'
								maxLength={30}
								className={INPUT_CLASS}
							/>
						</div>
						<div>
							<label className='text-secondary mb-1.5 block text-xs'>阅读进度（0 - 100）</label>
							<input
								type='number'
								min={0}
								max={100}
								value={form.readingProgress}
								onChange={e =>
									setForm({
										...form,
										readingProgress: Math.min(100, Math.max(0, Number(e.target.value) || 0))
									})
								}
								className={INPUT_CLASS}
							/>
						</div>
						<div>
							<label className='text-secondary mb-1.5 block text-xs'>🎮 最近在玩</label>
							<input
								value={form.playing}
								onChange={e => setForm({ ...form, playing: e.target.value })}
								placeholder='游戏名'
								maxLength={30}
								className={INPUT_CLASS}
							/>
						</div>
						<div>
							<label className='text-secondary mb-1.5 block text-xs'>🎬 最近在看</label>
							<input
								value={form.watching}
								onChange={e => setForm({ ...form, watching: e.target.value })}
								placeholder='剧 / 番名'
								maxLength={30}
								className={INPUT_CLASS}
							/>
						</div>
						<div>
							<label className='text-secondary mb-1.5 block text-xs'>💭 现在的心情</label>
							<input
								value={form.mood}
								onChange={e => setForm({ ...form, mood: e.target.value })}
								placeholder='一句话心情'
								maxLength={50}
								className={INPUT_CLASS}
							/>
						</div>
						<div className='mt-2 flex gap-3'>
							<button
								onClick={handleSave}
								className='bg-brand flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-opacity'>
								<Check className='h-4 w-4' />
								保存
							</button>
							<button
								onClick={() => setEditing(false)}
								className='bg-secondary/20 text-secondary flex cursor-pointer items-center justify-center gap-1 rounded-xl px-5 py-2.5 text-sm transition-colors'>
								<X className='h-4 w-4' />
								取消
							</button>
						</div>
					</div>
				</motion.div>
			) : (
				/* 展示模式 */
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					className='bg-card relative rounded-3xl border p-6 backdrop-blur-sm'>
					<button
						onClick={startEdit}
						className='bg-secondary/20 text-secondary hover:text-brand absolute top-5 right-5 flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors'
						title='编辑'>
						<Pencil className='h-3 w-3' />
						编辑
					</button>

					<div className='divide-y divide-dashed'>
						<NowRow
							emoji='📖'
							label='最近在读'
							value={
								<>
									{data.reading}
									<span className='text-brand ml-2 text-xs'>{data.readingProgress}%</span>
								</>
							}
							extra={
								<div className='bg-secondary/20 mt-2 h-1.5 w-full overflow-hidden rounded-full'>
									<div
										className='bg-brand h-full rounded-full transition-all duration-500'
										style={{ width: `${data.readingProgress}%` }}
									/>
								</div>
							}
						/>
						<NowRow emoji='🎮' label='最近在玩' value={data.playing} />
						<NowRow emoji='🎬' label='最近在看' value={data.watching} />
						<NowRow emoji='💭' label='现在的心情' value={data.mood} />
					</div>

					<div className='text-secondary mt-5 flex items-center gap-1.5 border-t border-dashed pt-4 text-xs'>
						<span>🔄</span>
						{formatUpdated(data.updatedAt)}
					</div>
				</motion.div>
			)}

			{mounted && history.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					className='bg-card mt-6 rounded-3xl border p-6 backdrop-blur-sm'>
					<div className='mb-2 flex items-center gap-1.5 text-sm font-medium'>
						<Music className='text-brand h-4 w-4' />
						最近在听
					</div>
					<ul className='divide-y divide-dashed'>
						{history.slice(0, 5).map(item => (
							<li
								key={item.title}
								className='flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0'>
								<span className='min-w-0 truncate text-sm'>{item.title}</span>
								<span className='text-secondary shrink-0 text-xs'>{formatRelative(item.time)}</span>
							</li>
						))}
					</ul>
				</motion.div>
			)}

			<p className='text-secondary mt-6 text-center text-xs'>数据仅保存在你的浏览器本地</p>
		</div>
	)
}
