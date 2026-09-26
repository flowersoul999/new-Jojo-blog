'use client'

// 随机图片：萌宠实拍 + uapis 图库池 + 随机动漫（dmoe）+ 中文表情包（ChineseBQB 开源图库经 jsDelivr 出图）
// 图源类型：direct 直返图片 / json 先取 JSON / pool 本地图片池随机；均带失败重试
import type { ReactElement } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ImageIcon, RefreshCw, X, Download, Maximize2, Cat, Dog, Laugh, Sparkles as SparklesIcon } from 'lucide-react'
import ToolShell from '../tool-shell'

type SourceKind = 'direct' | 'cat-json' | 'dog-json' | 'dmoe-json' | 'meme-pool'

interface Category {
	id: string
	name: string
	kind: SourceKind
	icon?: typeof Cat
	/** 图片在画框内的填充方式：表情包保留原比例 contain，其余 cover */
	fit?: 'cover' | 'contain'
	/** AI 生成作品池标识（仅用于角标提示） */
	isAI?: boolean
}

// 顺序：萌宠 → 动漫表情 → 其他图库
const CATEGORIES: Category[] = [
	{ id: 'cat', name: '猫猫', kind: 'cat-json', icon: Cat },
	{ id: 'dog', name: '狗狗', kind: 'dog-json', icon: Dog },
	{ id: 'anime', name: '动漫', kind: 'dmoe-json', icon: SparklesIcon },
	{ id: 'bq', name: '表情包', kind: 'meme-pool', icon: Laugh, fit: 'contain' },
	{ id: '', name: '随机', kind: 'direct' },
	{ id: 'acg', name: 'ACG', kind: 'direct' },
	{ id: 'landscape', name: '风景', kind: 'direct' },
	{ id: 'pc_wallpaper', name: '电脑壁纸', kind: 'direct' },
	{ id: 'mobile_wallpaper', name: '手机壁纸', kind: 'direct' },
	{ id: 'general_anime', name: '番剧', kind: 'direct' },
	{ id: 'ai_drawing', name: 'AI绘画', kind: 'direct', isAI: true },
]

// —— 表情包图库：zhaoolee/ChineseBQB（6000+ 张），GitHub 取文件树，jsDelivr CDN 出图，7 天本地缓存 ——
const MEME_TREE_URL = 'https://api.github.com/repos/zhaoolee/ChineseBQB/git/trees/master?recursive=1'
const MEME_CDN = 'https://cdn.jsdelivr.net/gh/zhaoolee/ChineseBQB@master/'
const MEME_CACHE_KEY = 'chinesebqb-pool-v1'
const MEME_CACHE_TTL = 7 * 24 * 60 * 60 * 1000
// 进行中的加载 promise 复用，避免连点重复请求
let memePoolPromise: Promise<string[]> | null = null

async function loadMemePool(): Promise<string[]> {
	try {
		const raw = localStorage.getItem(MEME_CACHE_KEY)
		if (raw) {
			const cached = JSON.parse(raw) as { t: number; list: string[] }
			if (Date.now() - cached.t < MEME_CACHE_TTL && cached.list?.length) return cached.list
		}
	} catch {
		/* 缓存损坏则重新拉取 */
	}
	if (!memePoolPromise) {
		memePoolPromise = (async () => {
			const res = await fetch(MEME_TREE_URL)
			if (!res.ok) throw new Error('meme tree error')
			const data = (await res.json()) as {
				tree?: Array<{ type: string; path: string }>
				truncated?: boolean
			}
			const list = (data.tree || [])
				.filter(x => x.type === 'blob' && /\.(jpg|jpeg|png|gif|webp)$/i.test(x.path))
				.map(x => MEME_CDN + encodeURIComponent(x.path))
			if (list.length === 0) throw new Error('meme pool empty')
			try {
				localStorage.setItem(MEME_CACHE_KEY, JSON.stringify({ t: Date.now(), list }))
			} catch {
				/* 存不下就只用内存 */
			}
			return list
		})()
	}
	try {
		return await memePoolPromise
	} catch (e) {
		// 失败后允许下次重新尝试
		memePoolPromise = null
		throw e
	}
}

/** 按图源类型解析出真实图片地址，失败由外层统一重试 */
async function resolveImageUrl(cat: Category): Promise<string> {
	if (cat.kind === 'cat-json') {
		const res = await fetch(`https://api.thecatapi.com/v1/images/search?limit=1&size=full&_t=${Date.now()}`)
		if (!res.ok) throw new Error('cat api error')
		const data = (await res.json()) as Array<{ url: string }>
		if (!data[0]?.url) throw new Error('cat api empty')
		return data[0].url
	}
	if (cat.kind === 'dog-json') {
		const res = await fetch(`https://dog.ceo/api/breeds/image/random?_t=${Date.now()}`)
		if (!res.ok) throw new Error('dog api error')
		const data = (await res.json()) as { status: string; message: string }
		if (data.status !== 'success' || !data.message) throw new Error('dog api empty')
		return data.message
	}
	if (cat.kind === 'dmoe-json') {
		// dmoe 随机动漫图：return=json 时返回 { code:200, imgurl }
		const res = await fetch(`https://www.dmoe.cc/random.php?return=json&_t=${Date.now()}`)
		if (!res.ok) throw new Error('dmoe api error')
		const data = (await res.json()) as { code: number; imgurl: string }
		if (data.code !== 200 || !data.imgurl) throw new Error('dmoe api empty')
		return data.imgurl
	}
	if (cat.kind === 'meme-pool') {
		const pool = await loadMemePool()
		return pool[Math.floor(Math.random() * pool.length)]
	}
	// direct：uapis 图库池直接返回图片，时间戳防缓存
	return `https://uapis.cn/api/v1/random/image?category=${cat.id}&type=pc&t=${Date.now()}`
}

const MAX_RETRY = 2

export default function RandomImagePage(): ReactElement {
	const [category, setCategory] = useState<Category>(CATEGORIES[0])
	const [url, setUrl] = useState('')
	const [loaded, setLoaded] = useState(false)
	const [error, setError] = useState('')
	const [fullscreen, setFullscreen] = useState(false)
	const [count, setCount] = useState(0)
	// 连续加载失败次数，超过阈值就停下来提示，避免死循环
	const failStreak = useRef(0)
	// 请求序号：快速切换分类时，过期的响应直接丢弃
	const reqId = useRef(0)

	const refresh = useCallback(async (cat: Category = category, resetStreak = true) => {
		const id = ++reqId.current
		// 用户主动切换/点击时归零；图片 onerror 自动重试时保留累计值，避免无限重试
		if (resetStreak) failStreak.current = 0
		setCategory(cat)
		setLoaded(false)
		setError('')

		let lastErr: unknown = null
		for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
			try {
				const next = await resolveImageUrl(cat)
				if (id !== reqId.current) return
				setUrl(next)
				return
			} catch (e) {
				lastErr = e
			}
		}
		if (id !== reqId.current) return
		setUrl('')
		setError(lastErr instanceof Error ? '图源开小差了，再试一次吧' : '加载失败')
	}, [category])

	// 首次进入自动来一张
	useEffect(() => {
		refresh(CATEGORIES[0])
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// 图片真正加载成功 / 失败（个别 CDN 链接可能失效）
	const handleImgLoaded = () => {
		failStreak.current = 0
		setLoaded(true)
		if (count === 0 && url) setCount(1)
	}
	const handleImgError = () => {
		failStreak.current += 1
		if (failStreak.current <= MAX_RETRY) {
			// 自动换下一张补救（不归零失败计数）
			refresh(category, false)
		} else {
			setLoaded(true)
			setError('图片加载失败，换个分类或再试一次')
		}
	}

	const isMeme = category.kind === 'meme-pool'
	const loadingHint =
		category.kind === 'cat-json' || category.kind === 'dog-json'
			? `召唤一只${category.name}...`
			: isMeme
				? '正在翻表情包库存（首次稍慢）...'
				: '图库里抽一张...'

	return (
		<ToolShell icon={ImageIcon} title='随机图片' desc='缘分到了，图自然就来了'>
			<div className='flex flex-wrap gap-1.5'>
				{CATEGORIES.map(c => {
					const Icon = c.icon
					const active = category.id === c.id
					return (
						<button
							key={c.id || 'random'}
							type='button'
							onClick={() => refresh(c)}
							className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
								active ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
							}`}
						>
							{Icon && <Icon className='h-3 w-3' />}
							{c.name}
							{c.isAI && active && <span className='rounded bg-white/25 px-1 text-[8px]'>AI</span>}
						</button>
					)
				})}
			</div>

			<div className='relative mt-4 overflow-hidden rounded-2xl bg-slate-100'>
				<div className={`flex ${isMeme ? 'min-h-[320px]' : 'aspect-video'} items-center justify-center`}>
					{!loaded && !error && (
						<div className='absolute inset-0 flex flex-col items-center justify-center gap-2'>
							<RefreshCw className='h-7 w-7 animate-spin text-slate-300' />
							<span className='text-[10px] text-slate-400'>{loadingHint}</span>
						</div>
					)}
					{error && (
						<div className='absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center'>
							<span className='text-xs text-rose-400'>{error}</span>
							<button
								type='button'
								onClick={() => refresh()}
								className='rounded-full bg-brand px-4 py-1.5 text-[11px] font-medium text-white'
							>
								重试
							</button>
						</div>
					)}
					{url && !error && (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							key={url}
							src={url}
							alt={`随机图片 - ${category.name}`}
							onLoad={handleImgLoaded}
							onError={handleImgError}
							onClick={() => loaded && setFullscreen(true)}
							className={`max-h-[480px] cursor-zoom-in transition-opacity duration-500 ${
								category.fit === 'contain' ? 'object-contain p-3' : 'h-full w-full object-cover'
							} ${loaded ? 'opacity-100' : 'opacity-0'}`}
						/>
					)}
				</div>

				{/* 悬浮操作条 */}
				{loaded && url && !error && (
					<div className='absolute right-2 bottom-2 flex gap-1.5'>
						<button
							type='button'
							onClick={() => setFullscreen(true)}
							title='查看大图'
							className='rounded-lg bg-black/50 p-2 text-white backdrop-blur transition-colors hover:bg-black/70'
						>
							<Maximize2 className='h-3.5 w-3.5' />
						</button>
						<a
							href={url}
							download
							target='_blank'
							title='下载'
							className='rounded-lg bg-black/50 p-2 text-white backdrop-blur transition-colors hover:bg-black/70'
						>
							<Download className='h-3.5 w-3.5' />
						</a>
					</div>
				)}

				{/* 来源角标 */}
				{loaded && !error && (
					<span className='absolute top-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] text-white backdrop-blur'>
						{isMeme ? 'ChineseBQB 图库' : category.icon ? category.name : category.isAI ? 'AI 绘画作品池' : '图库随机'}
					</span>
				)}
			</div>

			<button
				type='button'
				onClick={() => {
					setCount(c => c + 1)
					refresh()
				}}
				className='mt-4 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition-opacity hover:opacity-90'
			>
				<span className='inline-flex items-center gap-2'>
					<RefreshCw className='h-4 w-4' /> 换一张{category.name !== '随机' ? category.name : ''}
				</span>
			</button>
			{count > 1 && <p className='mt-2 text-center text-[10px] text-slate-400'>已看 {count} 张</p>}

			{/* 全屏预览 */}
			{fullscreen && url && (
				<div
					className='fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm'
					onClick={() => setFullscreen(false)}
				>
					<button
						type='button'
						className='absolute top-5 right-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20'
						aria-label='关闭预览'
					>
						<X className='h-5 w-5' />
					</button>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={url} alt='随机图片大图' className='max-h-full max-w-full rounded-xl object-contain' />
				</div>
			)}
		</ToolShell>
	)
}
