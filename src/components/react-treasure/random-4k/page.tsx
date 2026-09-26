'use client'

// 随机 4K 壁纸：动漫 / 风景，点开就是大图
import type { ReactElement } from 'react'
import { useState } from 'react'
import { MonitorSmartphone, RefreshCw, X, Download } from 'lucide-react'
import ToolShell from '../tool-shell'

const TYPES = [
	{ id: 'acg', name: '动漫' },
	{ id: 'wallpaper', name: '风景' },
]

export default function Random4kPage(): ReactElement {
	const [type, setType] = useState('acg')
	const [url, setUrl] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [fullscreen, setFullscreen] = useState(false)
	const [count, setCount] = useState(0)

	async function refresh(nextType?: string) {
		const t = nextType ?? type
		if (nextType) setType(nextType)
		setLoading(true)
		setError('')
		try {
			const res = await fetch(`https://v2.xxapi.cn/api/random4kPic?type=${t}&return=json`)
			const json = await res.json()
			if (json.code === 200 && json.data) {
				setUrl(json.data)
				setCount(c => c + 1)
			} else {
				setError('壁纸库暂时失联')
			}
		} catch {
			setError('网络异常，壁纸加载失败')
		} finally {
			setLoading(false)
		}
	}

	return (
		<ToolShell icon={MonitorSmartphone} title='4K 壁纸' desc='超清随机壁纸，桌面焕然一新' wide>
			<div className='flex items-center justify-between'>
				<div className='flex gap-1.5'>
					{TYPES.map(t => (
						<button
							key={t.id}
							type='button'
							onClick={() => refresh(t.id)}
							className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
								type === t.id ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
							}`}
						>
							{t.name}
						</button>
					))}
				</div>
				{count > 0 && <span className='text-[10px] text-slate-400'>已浏览 {count} 张</span>}
			</div>

			<div className='relative mt-4 overflow-hidden rounded-2xl bg-slate-100'>
				<div className='flex aspect-video items-center justify-center'>
					{loading && <RefreshCw className='h-8 w-8 animate-spin text-slate-300' />}
					{!loading && error && <span className='text-sm text-rose-400'>{error}</span>}
					{!loading && !error && !url && <span className='text-xs text-slate-400'>点击下方按钮，开始抽壁纸</span>}
					{!loading && url && (
						<>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={url}
								alt='4K 壁纸'
								onClick={() => setFullscreen(true)}
								className='h-full w-full cursor-zoom-in object-cover'
							/>
							<a
								href={url}
								download
								target='_blank'
								title='下载原图'
								className='absolute right-2 bottom-2 rounded-lg bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70'
							>
								<Download className='h-4 w-4' />
							</a>
						</>
					)}
				</div>
			</div>

			<button
				type='button'
				onClick={() => refresh()}
				disabled={loading}
				className='mt-4 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50'
			>
				<span className='inline-flex items-center gap-2'>
					<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 换一张 4K
				</span>
			</button>

			{fullscreen && url && (
				<div
					className='fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4'
					onClick={() => setFullscreen(false)}
				>
					<button type='button' className='absolute top-5 right-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20'>
						<X className='h-5 w-5' />
					</button>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={url} alt='4K 壁纸大图' className='max-h-full max-w-full rounded-xl object-contain' />
				</div>
			)}
		</ToolShell>
	)
}
