'use client'

// 星座运势：今日 / 本周 / 本月 / 今年，12 星座
import type { ReactElement } from 'react'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import ToolShell from '../tool-shell'

const CONSTELLATIONS = [
	{ id: 'aries', name: '白羊座', emoji: '♈' },
	{ id: 'taurus', name: '金牛座', emoji: '♉' },
	{ id: 'gemini', name: '双子座', emoji: '♊' },
	{ id: 'cancer', name: '巨蟹座', emoji: '♋' },
	{ id: 'leo', name: '狮子座', emoji: '♌' },
	{ id: 'virgo', name: '处女座', emoji: '♍' },
	{ id: 'libra', name: '天秤座', emoji: '♎' },
	{ id: 'scorpio', name: '天蝎座', emoji: '♏' },
	{ id: 'sagittarius', name: '射手座', emoji: '♐' },
	{ id: 'capricorn', name: '摩羯座', emoji: '♑' },
	{ id: 'aquarius', name: '水瓶座', emoji: '♒' },
	{ id: 'pisces', name: '双鱼座', emoji: '♓' },
]
const TIMES = [
	{ id: 'today', label: '今日' },
	{ id: 'week', label: '本周' },
	{ id: 'month', label: '本月' },
	{ id: 'year', label: '今年' },
]

interface Fortune { all: string; love: string; work: string; money: string; health: string }
interface HoroscopeData {
	title: string
	shortcomment: string
	fortune: Fortune
	fortunetext: string
	index: Array<[string, number]>
	luckycolor: string
	luckynumber: string
	luckyconstellation: string
	todo: { ji: string[]; yi: string[] }
}

function StarBar({ value }: { value: number }) {
	return (
		<span className='inline-flex gap-0.5'>
			{Array.from({ length: 5 }).map((_, i) => (
				<span key={i} className={`h-1.5 w-3 rounded-full ${i < value ? 'bg-amber-400' : 'bg-slate-200'}`} />
			))}
		</span>
	)
}

export default function HoroscopePage(): ReactElement {
	const [type, setType] = useState('aries')
	const [time, setTime] = useState('today')
	const [data, setData] = useState<HoroscopeData | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	async function query(nextType = type, nextTime = time) {
		setLoading(true)
		setError('')
		setData(null)
		try {
			const res = await fetch(`https://v2.xxapi.cn/api/horoscope?type=${nextType}&time=${nextTime}`)
			const json = await res.json()
			if (json.code === 200 && json.data) setData(json.data)
			else setError('星星们今天没回信')
		} catch {
			setError('网络异常，无法观测星象')
		} finally {
			setLoading(false)
		}
	}

	function selectType(id: string) {
		setType(id)
		query(id, time)
	}
	function selectTime(id: string) {
		setTime(id)
		query(type, id)
	}

	return (
		<ToolShell icon={Sparkles} title='星座运势' desc='星辰大海，请理性参考'>
			{/* 星座选择 */}
			<div className='grid grid-cols-6 gap-1.5'>
				{CONSTELLATIONS.map(c => (
					<button
						key={c.id}
						type='button'
						onClick={() => selectType(c.id)}
						className={`flex flex-col items-center rounded-xl py-2 text-[10px] transition-all ${
							type === c.id ? 'bg-brand text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
						}`}
					>
						<span className='text-base leading-none'>{c.emoji}</span>
						<span className='mt-1'>{c.name}</span>
					</button>
				))}
			</div>

			{/* 时间维度 */}
			<div className='mt-3 flex gap-1.5'>
				{TIMES.map(t => (
					<button
						key={t.id}
						type='button'
						onClick={() => selectTime(t.id)}
						className={`flex-1 rounded-full py-1.5 text-xs font-medium transition-all ${
							time === t.id ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{!data && !loading && !error && (
				<p className='py-12 text-center text-xs text-slate-400'>选一个星座，看看今天的星象怎么说</p>
			)}
			{loading && (
				<div className='flex h-52 items-center justify-center text-sm text-slate-400 animate-pulse'>星象推演中...</div>
			)}
			{error && <div className='mt-4 text-center text-sm text-rose-400'>{error}</div>}

			{data && !loading && (
				<div className='mt-4 space-y-3'>
					<div className='rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 text-center'>
						<h3 className='text-base font-black'>{data.title}</h3>
						{data.shortcomment && <p className='mt-1 text-xs text-slate-500'>{data.shortcomment}</p>}
					</div>

					{/* 分项指数 */}
					<div className='grid grid-cols-2 gap-2'>
						{(['all', 'love', 'work', 'money', 'health'] as const).map((key, i) => (
							<div key={key} className='flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2'>
								<span className='text-xs text-slate-500'>
									{['综合', '爱情', '事业', '财运', '健康'][i]}
								</span>
								<StarBar value={Number(data.fortune[key]) || 0} />
							</div>
						))}
					</div>

					{data.fortunetext && (
						<p className='rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600'>{data.fortunetext}</p>
					)}

					<div className='flex flex-wrap gap-2 text-[11px]'>
						<span className='rounded-full bg-pink-50 px-2.5 py-1 text-pink-600'>幸运色 {data.luckycolor}</span>
						<span className='rounded-full bg-sky-50 px-2.5 py-1 text-sky-600'>幸运数字 {data.luckynumber}</span>
						<span className='rounded-full bg-purple-50 px-2.5 py-1 text-purple-600'>贵人星座 {data.luckyconstellation}</span>
					</div>

					<div className='grid grid-cols-2 gap-2'>
						<div className='rounded-xl border border-green-200/60 bg-green-50/50 p-3'>
							<p className='mb-1.5 text-[10px] font-bold text-green-600'>宜</p>
							<div className='flex flex-wrap gap-1'>
								{data.todo.ji.map((t, i) => (
									<span key={i} className='rounded bg-white px-1.5 py-0.5 text-[10px] text-green-700'>{t}</span>
								))}
							</div>
						</div>
						<div className='rounded-xl border border-rose-200/60 bg-rose-50/50 p-3'>
							<p className='mb-1.5 text-[10px] font-bold text-rose-600'>忌</p>
							<div className='flex flex-wrap gap-1'>
								{data.todo.yi.map((t, i) => (
									<span key={i} className='rounded bg-white px-1.5 py-0.5 text-[10px] text-rose-700'>{t}</span>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</ToolShell>
	)
}
