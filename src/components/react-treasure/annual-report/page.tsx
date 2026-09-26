'use client'

import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
	BarChart3,
	ArrowRight,
	RefreshCw,
	FileText,
	NotebookPen,
	Camera,
	Sparkles,
	CalendarDays,
	BookOpenText,
	Loader2
} from 'lucide-react'
import picturesList from '@/components/react-treasure/pictures-list.json'

interface BlogMeta {
	slug: string
	title: string
	date: string
	hidden: boolean
}

interface DiaryMeta {
	title: string
	content: string
	date: string
	isPrivate: boolean
}

interface PictureMeta {
	uploadedAt: string
	images: string[]
}

interface YearStats {
	year: number
	blogCount: number
	blogWords: number
	diaryCount: number
	diaryWords: number
	photoCount: number
	totalCount: number
	totalWords: number
	busiest: { month: number; count: number } | null
}

const STEP_COUNT = 4

const GRADIENT_NUM = 'font-averia bg-gradient-to-r from-brand to-pink-500 bg-clip-text text-transparent'

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

/** 字数 → 「X 万字」 */
function formatWan(words: number): string {
	const wan = words / 10000
	if (wan >= 10) return Math.round(wan).toString()
	return wan.toFixed(1).replace(/\.0$/, '')
}

/** 总字数的趣味类比 */
function bookAnalogy(words: number): string {
	if (words >= 1040000) return '《平凡的世界》'
	if (words >= 730000) return '《红楼梦》'
	if (words >= 420000) return '《百年孤独》'
	if (words >= 260000) return '《解忧杂货店》'
	if (words >= 130000) return '《活着》'
	if (words >= 50000) return '《小王子》'
	if (words >= 20000) return '一篇硕士毕业论文'
	if (words >= 10000) return '一本薄薄的散文集'
	return '一篇走心的长文'
}

export default function AnnualReportPage(): ReactElement {
	const [stats, setStats] = useState<YearStats | null>(null)
	const [step, setStep] = useState(0)

	useEffect(() => {
		let cancelled = false

		async function load() {
			try {
				const now = new Date()
				const year = now.getFullYear()

				const [blogRes, diaryRes] = await Promise.all([fetch('/blogs/index.json'), fetch('/diary/index.json')])
				const blogs: BlogMeta[] = blogRes.ok ? await blogRes.json() : []
				const diaries: DiaryMeta[] = diaryRes.ok ? await diaryRes.json() : []
				const pictures: PictureMeta[] = Array.isArray(picturesList) ? picturesList : []

				// 只统计今年（1 月 1 日至今）
				const yearBlogs = blogs.filter(b => b.date && !b.hidden && new Date(b.date).getFullYear() === year)
				const yearDiaries = diaries.filter(d => d.date && !d.isPrivate && new Date(d.date).getFullYear() === year)
				const yearPictures = pictures.filter(p => p.uploadedAt && new Date(p.uploadedAt).getFullYear() === year)

				// 并行读取今年文章正文，统计字数
				const blogWordCounts = await Promise.all(
					yearBlogs.map(async b => {
						try {
							const res = await fetch(`/blogs/${encodeURIComponent(b.slug)}/index.md`)
							if (!res.ok) return 0
							return countMarkdownWords(await res.text())
						} catch {
							return 0
						}
					})
				)

				const blogWords = blogWordCounts.reduce((a, b) => a + b, 0)
				const diaryWords = yearDiaries.reduce((a, d) => a + countPlainText(d.content || '') + (d.title?.length || 0), 0)
				// 照片按「张」计（一次上传可含多张）
				const photoCount = yearPictures.reduce((a, p) => a + (p.images?.length || 1), 0)

				// 最勤的月份：按发布量（文章 + 日记 + 照片张数）
				const monthCount = new Array<number>(12).fill(0)
				yearBlogs.forEach(b => monthCount[new Date(b.date).getMonth()]++)
				yearDiaries.forEach(d => monthCount[new Date(d.date).getMonth()]++)
				yearPictures.forEach(p => {
					monthCount[new Date(p.uploadedAt).getMonth()] += p.images?.length || 1
				})
				let busiest: YearStats['busiest'] = null
				monthCount.forEach((count, i) => {
					if (count > 0 && (!busiest || count > busiest.count)) {
						busiest = { month: i + 1, count }
					}
				})

				if (cancelled) return
				setStats({
					year,
					blogCount: yearBlogs.length,
					blogWords,
					diaryCount: yearDiaries.length,
					diaryWords,
					photoCount,
					totalCount: yearBlogs.length + yearDiaries.length + photoCount,
					totalWords: blogWords + diaryWords,
					busiest
				})
			} catch {
				if (!cancelled)
					setStats({
						year: new Date().getFullYear(),
						blogCount: 0,
						blogWords: 0,
						diaryCount: 0,
						diaryWords: 0,
						photoCount: 0,
						totalCount: 0,
						totalWords: 0,
						busiest: null
					})
			}
		}

		load()
		return () => {
			cancelled = true
		}
	}, [])

	const isEmpty = stats !== null && stats.totalCount === 0

	const renderStep = () => {
		if (!stats) return null
		switch (step) {
			case 0:
				return (
					<div className='text-center'>
						<Sparkles className='text-brand mx-auto h-6 w-6' />
						<p className='text-secondary mt-3 text-sm'>{stats.year} 年度报告已生成</p>
						<div className={`${GRADIENT_NUM} mt-6 text-6xl font-medium max-sm:text-5xl`}>{stats.totalCount}</div>
						<p className='text-secondary mt-2 text-sm'>条足迹 · 文章 / 日记 / 照片</p>
						<p className='text-secondary mt-6 text-xs'>接下来的几页，是属于你的小站回忆</p>
					</div>
				)
			case 1:
				return (
					<div className='text-center'>
						<FileText className='text-brand mx-auto h-6 w-6' />
						<h2 className='mt-3 text-lg font-medium'>这一年，你写下了</h2>
						<div className='mt-6 grid grid-cols-2 gap-4 max-sm:gap-3'>
							<div className='bg-secondary/20 rounded-2xl p-5 max-sm:p-4'>
								<FileText className='text-brand mx-auto h-5 w-5' />
								<div className={`${GRADIENT_NUM} mt-2 text-4xl font-medium max-sm:text-3xl`}>{stats.blogCount}</div>
								<div className='text-secondary mt-1 text-xs'>篇文章</div>
								<div className='text-secondary mt-0.5 text-xs'>约 {formatWan(stats.blogWords)} 万字</div>
							</div>
							<div className='bg-secondary/20 rounded-2xl p-5 max-sm:p-4'>
								<NotebookPen className='text-brand mx-auto h-5 w-5' />
								<div className={`${GRADIENT_NUM} mt-2 text-4xl font-medium max-sm:text-3xl`}>{stats.diaryCount}</div>
								<div className='text-secondary mt-1 text-xs'>篇日记</div>
								<div className='text-secondary mt-0.5 text-xs'>约 {formatWan(stats.diaryWords)} 万字</div>
							</div>
						</div>
					</div>
				)
			case 2:
				return (
					<div className='text-center'>
						<Camera className='text-brand mx-auto h-6 w-6' />
						<h2 className='mt-3 text-lg font-medium'>镜头里的这一年</h2>
						<div className={`${GRADIENT_NUM} mt-5 text-5xl font-medium max-sm:text-4xl`}>{stats.photoCount}</div>
						<p className='text-secondary mt-2 text-sm'>张照片被定格</p>
						{stats.busiest && (
							<div className='bg-secondary/20 mt-6 rounded-2xl p-4 text-sm leading-relaxed'>
								<CalendarDays className='text-brand mr-1 inline h-4 w-4' />
								最勤快的是 <span className='text-brand font-medium'>{stats.busiest.month} 月</span>
								，一共留下 <span className='text-brand font-medium'>{stats.busiest.count}</span> 条记录
							</div>
						)}
					</div>
				)
			default:
				return (
					<div className='text-center'>
						<BookOpenText className='text-brand mx-auto h-6 w-6' />
						<h2 className='mt-3 text-lg font-medium'>全年共写下</h2>
						<div className={`${GRADIENT_NUM} mt-4 text-5xl font-medium max-sm:text-4xl`}>
							约 {formatWan(stats.totalWords)} 万字
						</div>
						<p className='text-secondary mt-4 text-sm'>相当于一本{bookAnalogy(stats.totalWords)}</p>
						<div className='text-secondary bg-secondary/20 mt-6 rounded-2xl p-4 text-xs leading-relaxed'>
							{stats.blogCount} 篇文章 · {stats.diaryCount} 篇日记 · {stats.photoCount} 张照片
							<br />
							感谢你记录生活的每一天，{stats.year + 1} 继续加油 🎉
						</div>
					</div>
				)
		}
	}

	return (
		<div className='mx-auto w-full max-w-2xl px-6 pt-24 pb-12 max-sm:px-4'>
			<div className='mb-8 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<BarChart3 className='text-brand h-7 w-7' />
					年度报告
				</h1>
				<p className='text-secondary mt-2 text-sm'>每一笔记录，都值得被记住</p>
			</div>

			{/* 加载中 */}
			{stats === null ? (
				<div className='bg-card mx-auto flex max-w-lg flex-col items-center rounded-3xl border px-6 py-16 backdrop-blur-sm'>
					<Loader2 className='text-brand h-6 w-6 animate-spin' />
					<p className='text-secondary mt-4 text-sm'>正在打包你的年度记忆...</p>
				</div>
			) : isEmpty ? (
				/* 今年还没开始记录的空状态 */
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className='bg-card mx-auto max-w-lg rounded-3xl border p-10 text-center backdrop-blur-sm max-sm:p-8'>
					<div className='text-5xl'>🌱</div>
					<p className='mt-4 text-sm font-medium'>{stats.year} 年还没开始记录</p>
					<p className='text-secondary mt-1 text-sm'>从现在开始吧，明年见 ✨</p>
				</motion.div>
			) : (
				<>
					{/* 步进卡片 */}
					<div className='mx-auto w-full max-w-lg'>
						<AnimatePresence mode='wait'>
							<motion.div
								key={step}
								initial={{ opacity: 0, scale: 0.86 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.92 }}
								transition={{ duration: 0.35, ease: 'easeOut' }}
								className='bg-card flex min-h-[320px] flex-col items-center justify-center rounded-3xl border p-8 backdrop-blur-sm max-sm:p-6'>
								{renderStep()}
							</motion.div>
						</AnimatePresence>

						{/* 进度点 + 底部按钮 */}
						<div className='mt-8 flex flex-col items-center gap-4'>
							<div className='flex items-center gap-2'>
								{Array.from({ length: STEP_COUNT }).map((_, i) => (
									<button
										key={i}
										onClick={() => setStep(i)}
										aria-label={`第 ${i + 1} 屏`}
										className={`h-1.5 rounded-full transition-all ${i === step ? 'bg-brand w-5' : 'bg-secondary/20 w-1.5'}`}
									/>
								))}
							</div>

							{step < STEP_COUNT - 1 ? (
								<button
									onClick={() => setStep(s => Math.min(s + 1, STEP_COUNT - 1))}
									className='bg-brand flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 max-sm:w-full max-sm:justify-center'>
									下一页
									<ArrowRight className='h-4 w-4' />
								</button>
							) : (
								<button
									onClick={() => setStep(0)}
									className='border-brand/40 text-brand flex items-center gap-1.5 rounded-full border px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 max-sm:w-full max-sm:justify-center'>
									<RefreshCw className='h-4 w-4' />
									重新查看
								</button>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	)
}
