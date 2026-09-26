'use client'

import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Moon, RefreshCw } from 'lucide-react'

interface TarotCard {
	name: string
	emoji: string
	keywords: string
	reading: string
}

const CARDS: TarotCard[] = [
	{ name: '愚者', emoji: '🎒', keywords: '新开始 · 自由 · 冒险', reading: '宇宙想告诉你：不用等一切都准备好再出发，此刻迈出的那一步，本身就是最好的时机。' },
	{ name: '魔术师', emoji: '🎩', keywords: '创造 · 潜能 · 行动', reading: '你心里已经藏着一束光啦，今天把它亮出来一点点，世界就会为你让出一条路。' },
	{ name: '女祭司', emoji: '🌙', keywords: '直觉 · 静心 · 内在', reading: '先别急着向外界要答案，闭上眼睛听听心里的声音，它一直都在温柔地指引你。' },
	{ name: '皇后', emoji: '👑', keywords: '丰盛 · 呵护 · 美', reading: '记得好好疼爱自己呀，吃一顿好饭、睡一个饱觉，被照顾好的你才有力气发光。' },
	{ name: '皇帝', emoji: '🏛️', keywords: '秩序 · 稳定 · 力量', reading: '给生活一点点小小的结构吧，把杂乱归位的那一刻，你会感到踏实的安全感。' },
	{ name: '恋人', emoji: '💞', keywords: '爱 · 联结 · 抉择', reading: '无论选哪条路，宇宙都会陪着你。跟随内心那个温暖的选项，爱会替你兜底。' },
	{ name: '战车', emoji: '🐎', keywords: '意志 · 前进 · 胜利', reading: '你比自己想象中更坚定，握紧缰绳往前走吧，风会顺着你努力的方向吹来。' },
	{ name: '力量', emoji: '🦁', keywords: '勇气 · 温柔 · 驯服', reading: '真正的强大不是硬碰硬，而是像水一样温柔地坚持，你已经做得很好了。' },
	{ name: '隐者', emoji: '🕯️', keywords: '独处 · 沉思 · 光', reading: '独处的时光不是孤单，而是给自己的小充电。点一盏灯，慢慢照亮想去的方向。' },
	{ name: '命运之轮', emoji: '🎡', keywords: '转机 · 流动 · 接纳', reading: '轮子转动的声音里藏着好消息，试着松开手顺流而下，变化正在悄悄善待你。' },
	{ name: '正义', emoji: '⚖️', keywords: '平衡 · 公平 · 真相', reading: '心里那杆秤今天很准，坦然面对真实的自己吧，一切都会以恰当的方式回到你身边。' },
	{ name: '倒吊人', emoji: '🙃', keywords: '换个角度 · 停顿 · 领悟', reading: '卡住的时刻，不如倒过来看看世界，说不定那扇门一直开在你没留意的地方。' },
	{ name: '死神', emoji: '🦋', keywords: '蜕变 · 结束 · 新生', reading: '有些告别是为了腾出双手迎接更好的一切，像蝴蝶一样，褪去旧壳才得以飞舞。' },
	{ name: '节制', emoji: '🫗', keywords: '调和 · 耐心 · 温和', reading: '不用急也不用满，把生活的浓度调得刚刚好，细水长流的日子最是治愈。' },
	{ name: '恶魔', emoji: '🔗', keywords: '束缚 · 觉察 · 松绑', reading: '让你停下来的不是那条链子，而是心里的念头。轻轻看它一眼，它就松开了。' },
	{ name: '高塔', emoji: '🗼', keywords: '震动 · 释放 · 真实', reading: '摇晃是为了让不适的位置松动，风暴过后你会站在更开阔、更真实的天空下。' },
	{ name: '星星', emoji: '⭐', keywords: '希望 · 治愈 · 愿景', reading: '抬头看看，夜空里有一颗星一直为你亮着。慢慢许愿，宇宙正在排单处理哦。' },
	{ name: '月亮', emoji: '🌕', keywords: '梦境 · 潜意识 · 迷雾', reading: '迷雾里的不确定感是正常的，不必急着看穿一切，月光会陪你走到天亮。' },
	{ name: '太阳', emoji: '☀️', keywords: '喜悦 · 明朗 · 成功', reading: '阳光正大方地洒在你身上，今天适合大声笑、慢慢走，把快乐攒成双倍的。' },
	{ name: '审判', emoji: '📯', keywords: '觉醒 · 复苏 · 召唤', reading: '心里那句「去做吧」不是错觉，那是你内在的号角在轻轻唤你重新出发。' },
	{ name: '世界', emoji: '🌍', keywords: '圆满 · 达成 · 旅程', reading: '你已经悄悄走完了一段很美的旅程，给自己一个大大的拥抱，然后庆祝一下吧。' },
	{ name: '星辰', emoji: '✨', keywords: '灵感 · 微光 · 信任', reading: '再微小的光也是光，相信自己此刻的每一个念头，它们都在悄悄变成星星。' }
]

function hashDate(str: string): number {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 31 + str.charCodeAt(i)) | 0
	}
	return Math.abs(hash)
}

function getTodayKey(d = new Date()): string {
	return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

export default function TarotPage(): ReactElement {
	const today = getTodayKey()
	const dailyIndex = useMemo(() => hashDate(today) % CARDS.length, [today])

	const [index, setIndex] = useState(dailyIndex)
	const [flipped, setFlipped] = useState(false)
	const [isDaily, setIsDaily] = useState(true)

	const card = CARDS[index]

	const handleDraw = () => {
		let next = index
		while (next === index) {
			next = Math.floor(Math.random() * CARDS.length)
		}
		setIndex(next)
		setIsDaily(false)
		setFlipped(false)
		// 等牌背合上再翻开新牌
		setTimeout(() => setFlipped(true), 450)
	}

	return (
		<div className='mx-auto w-full max-w-2xl px-6 pt-24 pb-12 max-sm:px-4'>
			<div className='mb-10 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<Moon className='text-brand h-7 w-7' />
					塔罗牌 · 每日一抽
				</h1>
				<p className='text-secondary mt-2 text-sm'>抽一张牌，听听宇宙的悄悄话</p>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className='bg-card rounded-3xl border p-6 backdrop-blur-sm max-sm:p-5'>
				{/* 牌面（3D 翻转） */}
				<div
					className='mx-auto h-80 w-52 cursor-pointer select-none max-sm:h-72 max-sm:w-44'
					style={{ perspective: 1000 }}
					onClick={() => setFlipped(v => !v)}>
					<motion.div
						className='relative h-full w-full'
						animate={{ rotateY: flipped ? 180 : 0 }}
						transition={{ type: 'spring', stiffness: 260, damping: 22 }}
						style={{ transformStyle: 'preserve-3d' }}>
						{/* 牌背 */}
						<div
							className='bg-brand/10 absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-brand/40'
							style={{ backfaceVisibility: 'hidden' }}>
							<div className='grid grid-cols-3 gap-2 text-2xl opacity-40'>
								<span>✦</span>
								<span>✧</span>
								<span>✦</span>
								<span>✧</span>
								<span className='text-4xl'>✦</span>
								<span>✧</span>
								<span>✦</span>
								<span>✧</span>
								<span>✦</span>
							</div>
							<div className='text-secondary mt-4 text-xs'>点击翻开牌面</div>
						</div>
						{/* 牌面 */}
						<div
							className='bg-card absolute inset-0 flex flex-col items-center justify-center rounded-2xl border'
							style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
							<div className='text-7xl max-sm:text-6xl'>{card.emoji}</div>
							<div className='mt-4 text-lg font-medium'>{card.name}</div>
							<div className='text-secondary mt-1 text-[10px] tracking-widest'>TAROT</div>
						</div>
					</motion.div>
				</div>

				{/* 翻开后的指引 */}
				{flipped ? (
					<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className='mt-8'>
						<div className='text-center'>
							<div className='font-averia text-2xl font-medium'>{card.name}</div>
							<div className='text-secondary mt-1 text-sm'>{card.keywords}</div>
						</div>
						<div className='bg-brand/10 mt-5 rounded-2xl border border-brand/40 p-5'>
							<div className='text-secondary mb-1 text-xs'>今日指引</div>
							<p className='text-sm leading-relaxed'>{card.reading}</p>
						</div>
						<div className='mt-5 flex flex-col items-center gap-3'>
							<button
								onClick={handleDraw}
								className='bg-brand flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95'>
								<RefreshCw className='h-4 w-4' />
								再抽一张
							</button>
							<div className='text-secondary text-xs'>
								{isDaily ? '这是宇宙给你的今日专属指引' : '再抽的牌 · 换个视角看看'}
							</div>
						</div>
					</motion.div>
				) : (
					<div className='text-secondary mt-8 text-center text-sm'>安静的洗牌中，带着一个问题来抽吧 🌙</div>
				)}
			</motion.div>

			<p className='text-secondary mt-6 text-center text-xs'>每天翻开都是同一张专属指引 · 再抽适合换个心情</p>
		</div>
	)
}
