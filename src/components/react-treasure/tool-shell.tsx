'use client'

// 百宝箱工具页通用骨架：统一标题区 + 毛玻璃内容卡片，各工具只管自己的内容
import type { ReactElement } from 'react'
import { motion } from 'motion/react'
import type { ComponentType, ReactNode } from 'react'

interface Props {
	// 宽松为通用组件类型，兼容 lucide 图标与本地内联 SVG 图标（如 Github）
	icon: ComponentType<{ className?: string }>
	title: string
	desc?: string
	children: ReactNode
	/** 宽版布局（热榜、票房这类长列表用） */
	wide?: boolean
}

export default function ToolShell({ icon: Icon, title, desc, children, wide }: Props): ReactElement {
	return (
		<div className={`mx-auto w-full px-4 pt-24 pb-16 sm:px-6 ${wide ? 'max-w-3xl' : 'max-w-xl'}`}>
			<div className='mb-8 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<Icon className='h-7 w-7 text-brand' />
					{title}
				</h1>
				{desc && <p className='text-secondary mt-2 text-sm'>{desc}</p>}
			</div>

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className='rounded-3xl border bg-card/80 p-5 shadow-sm backdrop-blur-md'
			>
				{children}
			</motion.div>
		</div>
	)
}
