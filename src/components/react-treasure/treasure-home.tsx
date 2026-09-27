'use client'

// 百宝箱首页：全部小工具的分组网格 + 站内搜索
// 迁移自 Jojo-blog /treasure 首页，去掉旧博客专属的配置中心/鉴权依赖
import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { ExternalLink, Heart, Package, Search, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { ITEMS, type TreasureItem } from './items'

const GROUPS: Array<TreasureItem['group']> = ['资讯查询', '图片壁纸', '休闲玩法', '生活实用', '我的花园']

function ToolCard({ item, index }: { item: TreasureItem; index: number }) {
	const Icon = item.icon as LucideIcon
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.3) }}
		>
			<a
				href={item.href}
				className='group flex h-full items-start gap-3 rounded-2xl border bg-card/70 p-4 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5'
			>
				<span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white'>
					<Icon className='h-5 w-5' />
				</span>
				<span className='min-w-0'>
					<span className='flex items-center gap-1.5 text-sm font-semibold'>
						{item.title}
						{item.external && <ExternalLink className='h-3 w-3 text-secondary/50' />}
					</span>
					<span className='mt-0.5 block truncate text-xs text-secondary'>{item.description}</span>
				</span>
			</a>
		</motion.div>
	)
}

export default function TreasureHome(): ReactElement {
	const [keyword, setKeyword] = useState('')

	// 搜索时平铺，否则按分组展示
	const filtered = useMemo(() => {
		const kw = keyword.trim().toLowerCase()
		if (!kw) return ITEMS
		return ITEMS.filter(
			i => i.title.toLowerCase().includes(kw) || i.description.toLowerCase().includes(kw),
		)
	}, [keyword])

	return (
		<div className='mx-auto w-full max-w-5xl px-4 pt-8 pb-16 sm:px-6'>
			{/* Hero */}
			<div className='mb-8 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-4xl font-medium'>
					<Package className='h-8 w-8 text-brand' />
					百宝箱
				</h1>
				<p className='mt-2 text-sm text-secondary'>
					{ITEMS.length} 个小工具，摸鱼与实用兼得，持续上新中
				</p>

				{/* 搜索框 */}
				<div className='relative mx-auto mt-5 max-w-sm'>
					<Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-secondary/50' />
					<input
						value={keyword}
						onChange={e => setKeyword(e.target.value)}
						placeholder='搜索小工具...'
						className='w-full rounded-full border bg-card/70 py-2.5 pr-4 pl-9 text-sm outline-none backdrop-blur-md transition-colors placeholder:text-secondary/50 focus:border-brand'
					/>
				</div>
			</div>

			{/* 工具网格：搜索时平铺 */}
			{keyword.trim() ? (
				filtered.length > 0 ? (
					<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
						{filtered.map((item, i) => (
							<ToolCard key={item.href} item={item} index={i} />
						))}
					</div>
				) : (
					<p className='py-16 text-center text-sm text-secondary'>没有找到「{keyword}」相关的工具</p>
				)
			) : (
				GROUPS.map(group => {
					const items = filtered.filter(i => i.group === group)
					if (items.length === 0) return null
					return (
						<section key={group} className='mb-8'>
							<h2 className='mb-3 flex items-center gap-2 text-sm font-bold'>
								<span className='h-4 w-1 rounded-full bg-brand' />
								{group}
								<span className='text-[10px] font-normal text-secondary'>{items.length}</span>
							</h2>
							<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
								{items.map((item, i) => (
									<ToolCard key={item.href} item={item} index={i} />
								))}
							</div>
						</section>
					)
				})
			)}

			<div className='mt-12 text-center text-xs text-secondary/60'>
				Made with <Heart className='inline h-3 w-3 text-red-500' /> by jojo
				<span className='mx-2'>·</span>
				Powered by Astro &amp; Cloudflare
			</div>
		</div>
	)
}
