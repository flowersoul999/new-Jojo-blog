'use client'

import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Telescope } from 'lucide-react'

interface BlogItem {
	slug: string
	title: string
	date: string
	summary?: string
	hidden?: boolean
}

interface Star {
	slug: string
	title: string
	date: string
	x: number // 0~100 百分比
	y: number
	size: number
	bright: boolean
}

function hash(str: string): number {
	let h = 0
	for (let i = 0; i < str.length; i++) {
		h = (h << 5) - h + str.charCodeAt(i)
		h |= 0
	}
	return Math.abs(h)
}

export default function StarMapPage(): ReactElement {
	const [blogs, setBlogs] = useState<BlogItem[] | null>(null)

	useEffect(() => {
		fetch('/blogs/index.json')
			.then(res => (res.ok ? res.json() : []))
			.then((list: BlogItem[]) => setBlogs((list || []).filter(b => !b.hidden)))
			.catch(() => setBlogs([]))
	}, [])

	// 星星布局：x 按发布时间均匀铺开，y 由 slug hash 固定（刷新不抖动）
	const stars: Star[] = useMemo(() => {
		if (!blogs || blogs.length === 0) return []
		const sorted = [...blogs].sort((a, b) => a.date.localeCompare(b.date))
		return sorted.map((b, i) => {
			const h = hash(b.slug)
			return {
				slug: b.slug,
				title: b.title,
				date: b.date,
				x: sorted.length === 1 ? 50 : 6 + (i / (sorted.length - 1)) * 88,
				y: 12 + (h % 70),
				size: 6 + ((h >> 3) % 4) * 2,
				bright: h % 3 === 0
			}
		})
	}, [blogs])

	// 背景装饰小星星
	const bgStars = useMemo(
		() =>
			Array.from({ length: 60 }, (_, i) => ({
				x: (hash(`bg-${i}`) % 100),
				y: (hash(`bg-${i}-y`) % 100),
				o: 0.15 + (hash(`bg-${i}-o`) % 30) / 100
			})),
		[]
	)

	return (
		<div className='mx-auto w-full max-w-2xl px-6 pt-24 pb-12 max-sm:px-4'>
			<div className='mb-10 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<Telescope className='text-brand h-7 w-7' />
					文章星图
				</h1>
				<p className='text-secondary mt-2 text-sm'>每一篇文章，都是一颗被写下的星星</p>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className='overflow-hidden rounded-3xl border shadow-lg'>
				<div className='relative h-[420px] w-full bg-gradient-to-b from-[#0b1026] via-[#131a3d] to-[#1d2547] max-sm:h-[340px]'>
					{/* 背景装饰星 */}
					{bgStars.map((s, i) => (
						<div
							key={i}
							className='absolute rounded-full bg-white'
							style={{ left: `${s.x}%`, top: `${s.y}%`, width: 2, height: 2, opacity: s.o }}
						/>
					))}

					{/* 月亮装饰 */}
					<div className='absolute top-6 right-8 h-10 w-10 rounded-full bg-[#f5f0dc] opacity-90 shadow-[0_0_30px_rgba(245,240,220,0.4)]' />

					{/* 文章星星 */}
					{!blogs && <div className='absolute inset-0 flex items-center justify-center text-sm text-white/60'>星图绘制中...</div>}
					{blogs && stars.length === 0 && (
						<div className='absolute inset-0 flex items-center justify-center text-sm text-white/60'>夜空还很空，写下第一篇文章吧 ✨</div>
					)}
					{stars.map((s, i) => (
						<motion.a
							key={s.slug}
							href={`/blog/${s.slug}`}
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: Math.min(i * 0.05, 1.2), type: 'spring', stiffness: 200, damping: 15 }}
							whileHover={{ scale: 1.6 }}
							className='group absolute -translate-x-1/2 -translate-y-1/2'
							style={{ left: `${s.x}%`, top: `${s.y}%` }}>
							<span
								className={`block rounded-full ${s.bright ? 'bg-[#ffe9a8]' : 'bg-white'}`}
								style={{
									width: s.size,
									height: s.size,
									boxShadow: s.bright ? '0 0 12px 2px rgba(255,233,168,0.7)' : '0 0 8px 1px rgba(255,255,255,0.4)'
								}}
							/>
							{/* 悬停标题 */}
							<span className='pointer-events-none absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 rounded-lg bg-black/80 px-2.5 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100'>
								{s.title}
								<span className='block text-[10px] text-white/60'>{s.date.slice(0, 10)}</span>
							</span>
						</motion.a>
					))}

					{/* 底部统计 */}
					{blogs && stars.length > 0 && (
						<div className='absolute bottom-4 left-0 w-full text-center text-xs text-white/60'>
							{stars.length} 颗星星 · 悬停看标题 · 点击穿越到文章
						</div>
					)}
				</div>
			</motion.div>

			<p className='text-secondary mt-6 text-center text-xs'>星星位置按发布时间排布，左侧是早期的文字</p>
		</div>
	)
}
