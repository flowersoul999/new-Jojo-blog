'use client'

// 抛硬币：交给命运之前，你心里其实已有答案
import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { CircleDollarSign, RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'
import ToolShell from '../tool-shell'

type Face = '正面' | '反面'

const HISTORY_KEY = 'coin-flip-history-v1'

export default function CoinFlipPage(): ReactElement {
	const [flipping, setFlipping] = useState(false)
	const [face, setFace] = useState<Face | null>(null)
	const [total, setTotal] = useState(0)
	const [heads, setHeads] = useState(0)
	const [history, setHistory] = useState<Face[]>([])

	// 读取历史统计
	useEffect(() => {
		try {
			const raw = localStorage.getItem(HISTORY_KEY)
			if (raw) {
				const list = JSON.parse(raw) as Face[]
				setHistory(list)
				setTotal(list.length)
				setHeads(list.filter(f => f === '正面').length)
			}
		} catch {
			/* 忽略 */
		}
	}, [])

	function flip() {
		if (flipping) return
		setFlipping(true)
		const result: Face = Math.random() < 0.5 ? '正面' : '反面'
		// 动画播完再揭晓，制造悬念
		setTimeout(() => {
			setFace(result)
			setFlipping(false)
			setTotal(t => t + 1)
			setHeads(h => h + (result === '正面' ? 1 : 0))
			setHistory(prev => {
				const next = [result, ...prev].slice(0, 50)
				try {
					localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
				} catch {
					/* 忽略 */
				}
				return next
			})
		}, 1100)
	}

	function reset() {
		setHistory([])
		setTotal(0)
		setHeads(0)
		localStorage.removeItem(HISTORY_KEY)
	}

	const tails = total - heads
	const headsRate = total ? Math.round((heads / total) * 100) : 0

	return (
		<ToolShell icon={CircleDollarSign} title='抛硬币' desc='硬币腾空的瞬间，答案就在你心里'>
			<div className='flex flex-col items-center py-6'>
				{/* 硬币本体：翻转 + 正反两面 */}
				<div className='flex h-40 w-40 items-center justify-center' style={{ perspective: '800px' }}>
					<motion.div
						className='relative h-36 w-36'
						animate={flipping ? { rotateY: [0, 1440], y: [0, -36, 0] } : { rotateY: 0 }}
						transition={flipping ? { duration: 1.1, ease: 'easeOut' } : { duration: 0.2 }}
						style={{ transformStyle: 'preserve-3d' }}
					>
						{(['正面', '反面'] as const).map((f, i) => (
							<div
								key={f}
								className='absolute inset-0 flex items-center justify-center rounded-full border-4 text-2xl font-black shadow-xl'
								style={{
									backfaceVisibility: 'hidden',
									transform: i === 0 ? 'rotateY(0deg)' : 'rotateY(180deg)',
									background: i === 0 ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'linear-gradient(135deg,#cbd5e1,#94a3b8)',
									borderColor: i === 0 ? '#d97706' : '#64748b',
									color: '#fff',
								}}
							>
								{f}
							</div>
						))}
					</motion.div>
				</div>

				{face && !flipping && (
					<motion.p
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						className='mt-4 text-lg font-black text-brand'
					>
						是 {face}！
					</motion.p>
				)}

				<button
					type='button'
					onClick={flip}
					disabled={flipping}
					className='mt-6 rounded-2xl bg-brand px-10 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50'
				>
					{flipping ? '命运旋转中...' : '抛一次'}
				</button>

				{/* 统计 */}
				{total > 0 && (
					<div className='mt-6 w-full rounded-2xl bg-slate-50 p-4'>
						<div className='mb-2 flex items-center justify-between'>
							<span className='text-[10px] font-bold text-slate-400'>本局统计（共 {total} 次）</span>
							<button type='button' onClick={reset} title='清空统计' className='text-slate-400 transition-colors hover:text-rose-500'>
								<RotateCcw className='h-3 w-3' />
							</button>
						</div>
						<div className='mb-2.5 flex h-2 overflow-hidden rounded-full bg-slate-200'>
							<div className='bg-amber-400 transition-all' style={{ width: `${headsRate}%` }} />
							<div className='bg-slate-400 transition-all' style={{ width: `${100 - headsRate}%` }} />
						</div>
						<div className='flex justify-between text-[10px] text-slate-500'>
							<span>正面 {heads} 次 · {headsRate}%</span>
							<span>反面 {tails} 次 · {100 - headsRate}%</span>
						</div>
						{/* 最近结果 */}
						<div className='mt-3 flex flex-wrap gap-1'>
							{history.slice(0, 20).map((f, i) => (
								<span
									key={i}
									className={`h-2 w-2 rounded-full ${f === '正面' ? 'bg-amber-400' : 'bg-slate-300'}`}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</ToolShell>
	)
}
