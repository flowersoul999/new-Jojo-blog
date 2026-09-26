'use client'

import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from '../lib/link'
import { motion } from 'motion/react'
import { History, FileText, NotebookPen, Camera, ChevronDown } from 'lucide-react'
import picturesList from '@/components/react-treasure/pictures-list.json'

type ItemType = 'blog' | 'diary' | 'picture'
type Filter = 'all' | ItemType

interface BlogMeta {
	slug: string
	title: string
	date: string
	summary: string
	hidden: boolean
}

interface DiaryMeta {
	slug: string
	title: string
	content: string
	date: string
	isPrivate: boolean
}

interface PictureMeta {
	id: string
	uploadedAt: string
	images: string[]
	description: string
}

interface TimelineItem {
	type: ItemType
	date: string
	title: string
	href: string
	summary?: string
	meta?: string
}

const PAGE_SIZE = 30

const TYPE_META: Record<ItemType, { label: string; icon: typeof FileText }> = {
	blog: { label: '文章', icon: FileText },
	diary: { label: '日记', icon: NotebookPen },
	picture: { label: '照片', icon: Camera }
}

const EMPTY_TEXT: Record<Filter, string> = {
	all: '还没有任何内容记录 🌱',
	blog: '还没有公开的文章 ✍️',
	diary: '还没有公开的日记 📔',
	picture: '还没有上传照片 📷'
}

/** 统计 markdown 文本的纯文本字数（与 use-blog-stats 一致） */
function countMarkdownWords(md: string): number {
	let text = md.replace(/```[\s\S]*?```/g, '')
	text = text.replace(/`[^`]+`/g, '')
	text = text.replace(/!\[.*?\]\(.*?\)/g, '')
	text = text.replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
	text = text.replace(/[#*_>~\-|]/g, '')
	text = text.replace(/<[^>]+>/g, '')
	return text.replace(/\s+/g, '').length
}

function countPlainText(text: string): number {
	return text.replace(/\s+/g, '').length
}

function formatDate(iso: string): string {
	const d = new Date(iso)
	if (isNaN(d.getTime())) return iso
	return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function getYear(iso: string): number {
	const d = new Date(iso)
	return isNaN(d.getTime()) ? 0 : d.getFullYear()
}

export default function TimelinePage(): ReactElement {
	const [items, setItems] = useState<TimelineItem[] | null>(null)
	const [filter, setFilter] = useState<Filter>('all')
	const [visible, setVisible] = useState(PAGE_SIZE)

	useEffect(() => {
		let cancelled = false

		async function load() {
			try {
				const [blogRes, diaryRes] = await Promise.all([fetch('/blogs/index.json'), fetch('/diary/index.json')])
				const blogs: BlogMeta[] = blogRes.ok ? await blogRes.json() : []
				const diaries: DiaryMeta[] = diaryRes.ok ? await diaryRes.json() : []
				const pictures: PictureMeta[] = Array.isArray(picturesList) ? picturesList : []

				// 文章条目（并行读取正文统计字数）
				const publicBlogs = blogs.filter(b => b.date && !b.hidden)
				const blogWordCounts = await Promise.all(
					publicBlogs.map(async b => {
						try {
							const res = await fetch(`/blogs/${encodeURIComponent(b.slug)}/index.md`)
							if (!res.ok) return 0
							return countMarkdownWords(await res.text())
						} catch {
							return 0
						}
					})
				)
				const blogItems: TimelineItem[] = publicBlogs.map((b, i) => ({
					type: 'blog',
					date: b.date,
					title: b.title || '未命名文章',
					href: `/blog/${b.slug}`,
					summary: b.summary || undefined,
					meta: blogWordCounts[i] > 0 ? `${blogWordCounts[i]} 字` : undefined
				}))

				// 日记条目（过滤私密日记）
				const diaryItems: TimelineItem[] = diaries
					.filter(d => d.date && !d.isPrivate)
					.map(d => ({
						type: 'diary',
						date: d.date,
						title: d.title || d.content?.slice(0, 20) || '未命名日记',
						href: `/about/${d.slug}`,
						summary: d.content ? d.content.replace(/\s+/g, ' ').slice(0, 60) : undefined,
						meta: d.content ? `${countPlainText(d.content)} 字` : undefined
					}))

				// 照片条目（每次上传为一条记录）
				const pictureItems: TimelineItem[] = pictures
					.filter(p => p.uploadedAt)
					.map(p => ({
						type: 'picture',
						date: p.uploadedAt,
						title: p.description || '一张照片',
						href: '/pictures',
						meta: `${p.images?.length || 1} 张`
					}))

				if (cancelled) return
				const merged = [...blogItems, ...diaryItems, ...pictureItems].sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
				)
				setItems(merged)
			} catch {
				if (!cancelled) setItems([])
			}
		}

		load()
		return () => {
			cancelled = true
		}
	}, [])

	const filtered = useMemo(() => {
		if (!items) return []
		return filter === 'all' ? items : items.filter(it => it.type === filter)
	}, [items, filter])

	const shown = useMemo(() => filtered.slice(0, visible), [filtered, visible])

	// 按年份分组（年份倒序）
	const groups = useMemo(() => {
		const map = new Map<number, TimelineItem[]>()
		for (const it of shown) {
			const y = getYear(it.date)
			if (!map.has(y)) map.set(y, [])
			map.get(y)!.push(it)
		}
		return [...map.entries()].sort((a, b) => b[0] - a[0]).map(([year, list]) => ({ year, list }))
	}, [shown])

	const handleFilter = (f: Filter) => {
		setFilter(f)
		setVisible(PAGE_SIZE)
	}

	return (
		<div className='mx-auto w-full max-w-2xl px-6 pt-24 pb-12 max-sm:px-4'>
			<div className='mb-8 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<History className='text-brand h-7 w-7' />
					时光机
				</h1>
				<p className='text-secondary mt-2 text-sm'>文章、日记与照片，串成一条时间线</p>
			</div>

			{/* 筛选 tabs */}
			<div className='bg-secondary/20 mx-auto mb-8 flex w-fit gap-1 rounded-full p-1 max-sm:w-full max-sm:justify-center'>
				{(['all', 'blog', 'diary', 'picture'] as Filter[]).map(f => (
					<button
						key={f}
						onClick={() => handleFilter(f)}
						className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors max-sm:px-3 ${
							filter === f ? 'bg-brand text-white' : 'text-secondary hover:text-brand'
						}`}>
						{f === 'all' ? '全部' : TYPE_META[f].label}
					</button>
				))}
			</div>

			{items === null ? (
				/* 加载骨架 */
				<div className='flex flex-col gap-4'>
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className='bg-card ml-8 animate-pulse rounded-2xl border p-4'>
							<div className='bg-secondary/20 h-4 w-1/2 rounded-full' />
							<div className='bg-secondary/20 mt-3 h-3 w-1/3 rounded-full' />
						</div>
					))}
				</div>
			) : filtered.length === 0 ? (
				/* 空状态 */
				<div className='border-dashed text-secondary rounded-3xl border-2 py-12 text-center text-sm'>
					{EMPTY_TEXT[filter]}
				</div>
			) : (
				<>
					<div className='relative'>
						{/* 垂直时间线 */}
						<div className='bg-secondary/20 absolute top-1 bottom-1 left-[7px] w-px' />

						{groups.map(group => (
							<section key={group.year} className='relative'>
								{/* 年份分组标题 */}
								<div className='relative z-10 mb-4 flex items-center gap-3'>
									<span className='bg-brand h-4 w-4 shrink-0 rounded-full' />
									<h2 className='font-averia text-brand text-2xl font-medium'>{group.year}</h2>
									<span className='text-secondary text-xs'>{group.list.length} 条</span>
								</div>

								<div className='mb-6 flex flex-col gap-3'>
									{group.list.map((it, idx) => {
										const meta = TYPE_META[it.type]
										const Icon = meta.icon
										return (
											<motion.div
												key={`${it.type}-${it.href}-${it.date}-${idx}`}
												initial={{ opacity: 0, y: 12 }}
												whileInView={{ opacity: 1, y: 0 }}
												viewport={{ once: true, margin: '-40px' }}
												transition={{ delay: Math.min(idx * 0.04, 0.24) }}
												className='relative pl-8'>
												{/* 节点圆点 */}
												<span className='bg-brand absolute top-5 left-[2px] h-3 w-3 shrink-0 rounded-full' />

												<Link
													href={it.href}
													className='bg-card block rounded-2xl border p-4 transition-shadow hover:shadow-md max-sm:p-3.5'>
													<div className='flex items-center gap-2'>
														<Icon className='text-brand h-4 w-4 shrink-0' />
														<span className='truncate text-sm font-medium'>{it.title}</span>
													</div>
													<div className='text-secondary mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs'>
														<span>{formatDate(it.date)}</span>
														{it.meta && <span>· {it.meta}</span>}
														<span>· {meta.label}</span>
													</div>
													{it.summary && (
														<p className='text-secondary mt-2 line-clamp-2 text-xs leading-relaxed'>{it.summary}</p>
													)}
												</Link>
											</motion.div>
										)
									})}
								</div>
							</section>
						))}
					</div>

					{/* 加载更多 */}
					{visible < filtered.length && (
						<div className='mt-2 text-center'>
							<button
								onClick={() => setVisible(v => v + PAGE_SIZE)}
								className='border-brand/40 text-secondary hover:text-brand inline-flex items-center gap-1 rounded-full border px-5 py-2 text-xs transition-colors'>
								<ChevronDown className='h-3.5 w-3.5' />
								加载更多（还有 {filtered.length - visible} 条）
							</button>
						</div>
					)}
				</>
			)}
		</div>
	)
}
