'use client'

// 观音灵签：签图 + 签文 + 解曰，心诚则灵
import type { ReactElement } from 'react'
import { useCallback, useState } from 'react'
import { ScrollText } from 'lucide-react'
import ToolShell from '../tool-shell'

interface GuanyinData {
	explanation: string
	fortune: string
	image: string
	meaning: string
	name: string
	palace: string
	poem_version_1: string
	poem_version_2: string
}

const FORTUNE_STYLES: Record<string, string> = {
	上上签: 'border-rose-200 bg-rose-50 text-rose-600',
	上签: 'border-orange-200 bg-orange-50 text-orange-600',
	中签: 'border-amber-200 bg-amber-50 text-amber-600',
	下签: 'border-slate-200 bg-slate-50 text-slate-500',
	下下签: 'border-slate-300 bg-slate-100 text-slate-500',
}

export default function LotteryPage(): ReactElement {
	const [data, setData] = useState<GuanyinData | null>(null)
	const [loading, setLoading] = useState(false)

	const draw = useCallback(async () => {
		setLoading(true)
		try {
			const res = await fetch('https://v2.xxapi.cn/api/guanyinrandom')
			const json = await res.json()
			if (json.code === 200 && json.data) setData(json.data)
		} catch {
			/* 签筒晃掉了，静默 */
		} finally {
			setLoading(false)
		}
	}, [])

	const fortuneStyle = data?.fortune ? (FORTUNE_STYLES[data.fortune] || FORTUNE_STYLES['中签']) : ''

	return (
		<ToolShell icon={ScrollText} title='观音灵签' desc='心诚则灵，求一支今日指引'>
			<button
				type='button'
				onClick={draw}
				disabled={loading}
				className='w-full rounded-xl bg-brand py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50'
			>
				{loading ? '求签中...' : data ? '再求一支' : '求一支签'}
			</button>

			{data && (
				<div className='mt-4 space-y-3 rounded-2xl border p-4' style={{ borderColor: undefined }}>
					<div className={`rounded-2xl border p-4 space-y-3 ${fortuneStyle}`}>
						{data.image && (
							<div className='flex justify-center'>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={data.image} alt={data.name} className='h-28 object-contain' loading='lazy' />
							</div>
						)}
						<div className='space-y-1 text-center'>
							<div className='text-lg font-black'>{data.name}</div>
							<div className='flex items-center justify-center gap-2'>
								<span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${fortuneStyle}`}>{data.fortune}</span>
								<span className='text-[10px] opacity-70'>{data.palace}</span>
							</div>
						</div>
					</div>

					{data.poem_version_1 && (
						<section>
							<h3 className='mb-1 text-[10px] font-bold text-slate-400'>签诗</h3>
							<p className='whitespace-pre-line text-center text-sm leading-loose'>{data.poem_version_1}</p>
						</section>
					)}
					{data.meaning && (
						<section>
							<h3 className='mb-1 text-[10px] font-bold text-slate-400'>卦象</h3>
							<p className='text-xs leading-relaxed text-slate-600'>{data.meaning}</p>
						</section>
					)}
					{data.explanation && (
						<section>
							<h3 className='mb-1 text-[10px] font-bold text-slate-400'>解曰</h3>
							<p className='text-xs leading-relaxed text-slate-600'>{data.explanation}</p>
						</section>
					)}
					{data.poem_version_2 && (
						<section>
							<h3 className='mb-1 text-[10px] font-bold text-slate-400'>仙机</h3>
							<p className='whitespace-pre-line text-xs leading-loose text-slate-600'>{data.poem_version_2}</p>
						</section>
					)}
				</div>
			)}

			{!data && !loading && (
				<div className='flex flex-col items-center justify-center gap-2 py-12 text-slate-400'>
					<ScrollText className='h-12 w-12 opacity-30' />
					<span className='text-xs'>点击按钮，求一支观音灵签</span>
				</div>
			)}
		</ToolShell>
	)
}
