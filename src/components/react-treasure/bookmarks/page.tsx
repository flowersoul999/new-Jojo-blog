'use client'

import type { ReactElement } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Bookmark, Plus, Trash2 } from 'lucide-react'

interface BookmarkItem {
	id: string
	name: string
	url: string
	category: string
	emoji: string
	createdAt: number
}

const STORAGE_KEY = 'treasure-bookmarks'
const INIT_KEY = 'treasure-bookmarks-init'
const DEFAULT_CATEGORY = '常用'
const DEFAULT_EMOJI = '🌐'
const NEW_CATEGORY = '__new__'

const DEFAULT_BOOKMARKS: BookmarkItem[] = [
	{ id: 'mdn', name: 'MDN', url: 'https://developer.mozilla.org/', category: '文档', emoji: '📖', createdAt: 1 },
	{ id: 'caniuse', name: 'Can I Use', url: 'https://caniuse.com/', category: '文档', emoji: '✅', createdAt: 2 },
	{ id: 'github', name: 'GitHub', url: 'https://github.com/', category: '常用', emoji: '🐙', createdAt: 3 },
	{ id: 'so', name: 'Stack Overflow', url: 'https://stackoverflow.com/', category: '常用', emoji: '💬', createdAt: 4 },
	{ id: 'v2ex', name: 'V2EX', url: 'https://v2ex.com/', category: '社区', emoji: '🚀', createdAt: 5 },
	{ id: 'juejin', name: '掘金', url: 'https://juejin.cn/', category: '社区', emoji: '⛏️', createdAt: 6 }
]

/** 补全 https:// 前缀并校验，非法返回 null */
function normalizeUrl(raw: string): string | null {
	const value = raw.trim()
	if (!value) return null
	const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
	try {
		const parsed = new URL(withProtocol)
		if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || !parsed.hostname.includes('.')) {
			return null
		}
		return parsed.href
	} catch {
		return null
	}
}

function getHostname(url: string): string {
	try {
		return new URL(url).hostname
	} catch {
		return url
	}
}

export default function BookmarksPage(): ReactElement {
	const [items, setItems] = useState<BookmarkItem[] | null>(null) // null = 未从 localStorage 读取
	const [name, setName] = useState('')
	const [url, setUrl] = useState('')
	const [category, setCategory] = useState(DEFAULT_CATEGORY)
	const [newCategory, setNewCategory] = useState('')
	const [emoji, setEmoji] = useState('')
	const [urlError, setUrlError] = useState('')

	useEffect(() => {
		try {
			// 只在书签 key 从未存在过时初始化一次默认数据，用户删光后不恢复
			if (!localStorage.getItem(INIT_KEY)) {
				if (!localStorage.getItem(STORAGE_KEY)) {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BOOKMARKS))
				}
				localStorage.setItem(INIT_KEY, '1')
			}
			const raw = localStorage.getItem(STORAGE_KEY)
			const parsed: unknown = raw ? JSON.parse(raw) : []
			setItems(Array.isArray(parsed) ? (parsed as BookmarkItem[]) : [])
		} catch {
			setItems([])
		}
	}, [])

	const persist = useCallback((list: BookmarkItem[]) => {
		setItems(list)
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
		} catch {
			/* ignore */
		}
	}, [])

	// 分类按创建时间排序（Map 保持首次出现的插入顺序）；组内按创建时间倒序
	const groups = useMemo(() => {
		if (!items) return []
		const map = new Map<string, BookmarkItem[]>()
		for (const it of items) {
			const list = map.get(it.category)
			if (list) list.push(it)
			else map.set(it.category, [it])
		}
		return Array.from(map, ([category, list]) => ({
			category,
			list: [...list].sort((a, b) => b.createdAt - a.createdAt)
		}))
	}, [items])

	const categoryOptions = useMemo(
		() => groups.map(g => g.category).filter(c => c !== DEFAULT_CATEGORY),
		[groups]
	)

	const handleAdd = () => {
		if (!items || !name.trim()) return
		const normalized = normalizeUrl(url)
		if (!normalized) {
			setUrlError('URL 格式不正确，试试 example.com')
			return
		}
		setUrlError('')
		const finalCategory = (category === NEW_CATEGORY ? newCategory.trim() : category) || DEFAULT_CATEGORY
		const item: BookmarkItem = {
			id: `${Date.now()}`,
			name: name.trim(),
			url: normalized,
			category: finalCategory,
			emoji: emoji.trim() || DEFAULT_EMOJI,
			createdAt: Date.now()
		}
		persist([...items, item])
		setName('')
		setUrl('')
		setEmoji('')
		setNewCategory('')
		setCategory(finalCategory)
	}

	const handleDelete = (id: string) => {
		if (!items) return
		if (!window.confirm('确定删除这个书签吗？')) return
		persist(items.filter(i => i.id !== id))
	}

	return (
		<div className='mx-auto w-full max-w-2xl px-6 pt-24 pb-12 max-sm:px-4'>
			<div className='mb-10 text-center'>
				<h1 className='font-averia flex items-center justify-center gap-2 text-3xl font-medium'>
					<Bookmark className='text-brand h-7 w-7' />
					书签工具箱
				</h1>
				<p className='text-secondary mt-2 text-sm'>收藏的好站与小工具，一触即达</p>
			</div>

			{/* 添加表单 */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className='bg-card mb-4 rounded-3xl border p-6 backdrop-blur-sm max-sm:p-4'>
				<div className='flex flex-col gap-3'>
					<div className='flex flex-col gap-3 sm:flex-row'>
						<input
							value={name}
							onChange={e => setName(e.target.value)}
							placeholder='名称，如：前端导航'
							maxLength={20}
							className='bg-secondary/20 focus:border-brand min-w-0 flex-1 rounded-xl border border-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400'
						/>
						<input
							value={url}
							onChange={e => {
								setUrl(e.target.value)
								if (urlError) setUrlError('')
							}}
							placeholder='网址，如 example.com'
							className='bg-secondary/20 focus:border-brand min-w-0 flex-1 rounded-xl border border-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400'
						/>
					</div>
					<div className='flex flex-col gap-3 sm:flex-row'>
						<select
							value={category}
							onChange={e => setCategory(e.target.value)}
							className='bg-secondary/20 focus:border-brand min-w-0 flex-1 rounded-xl border border-transparent px-4 py-2.5 text-sm outline-none transition-colors'>
							<option value={DEFAULT_CATEGORY}>{DEFAULT_CATEGORY}</option>
							{categoryOptions.map(c => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
							<option value={NEW_CATEGORY}>＋ 新建分类</option>
						</select>
						{category === NEW_CATEGORY && (
							<input
								value={newCategory}
								onChange={e => setNewCategory(e.target.value)}
								placeholder='新分类名称'
								maxLength={12}
								className='bg-secondary/20 focus:border-brand min-w-0 flex-1 rounded-xl border border-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400'
							/>
						)}
						<input
							value={emoji}
							onChange={e => setEmoji(e.target.value)}
							placeholder={DEFAULT_EMOJI}
							maxLength={4}
							className='bg-secondary/20 focus:border-brand w-full rounded-xl border border-transparent px-4 py-2.5 text-center text-sm outline-none transition-colors placeholder:text-gray-400 sm:w-20'
						/>
						<button
							onClick={handleAdd}
							disabled={!name.trim()}
							className='bg-brand flex shrink-0 items-center justify-center gap-1 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40'>
							<Plus className='h-4 w-4' />
							添加
						</button>
					</div>
					{urlError && <p className='text-red-500 text-xs'>{urlError}</p>}
				</div>
			</motion.div>

			{/* 统计行 */}
			{items !== null && (
				<p className='text-secondary mb-4 text-center text-xs'>
					共 {items.length} 个书签 · {groups.length} 个分类
				</p>
			)}

			{/* 分类分组列表 */}
			{items === null ? (
				<div className='text-secondary py-6 text-center text-sm'>加载中...</div>
			) : items.length === 0 ? (
				<div className='border-dashed text-secondary rounded-3xl border-2 py-10 text-center text-sm'>
					还没有书签，添加第一个书签吧 🌱
				</div>
			) : (
				<div className='flex flex-col gap-8'>
					{groups.map(group => (
						<div key={group.category}>
							<div className='mb-3 flex items-center gap-2'>
								<span className='text-base'>{group.list[0].emoji}</span>
								<span className='text-sm font-medium'>{group.category}</span>
								<span className='text-secondary text-xs'>{group.list.length} 个</span>
							</div>
							<div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
								{group.list.map((item, index) => (
									<motion.div
										key={item.id}
										initial={{ opacity: 0, y: 12 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.04 }}
										className='bg-card group relative rounded-2xl border p-4 backdrop-blur-sm transition-shadow hover:shadow-lg max-sm:p-3'>
										<a
											href={item.url}
											target='_blank'
											rel='noopener noreferrer'
											className='flex flex-col items-center gap-2 text-center'>
											<span className='bg-secondary/20 flex h-10 w-10 items-center justify-center rounded-xl text-xl'>
												{item.emoji}
											</span>
											<span className='w-full truncate text-sm font-medium'>{item.name}</span>
											<span className='text-secondary w-full truncate text-xs'>
												{getHostname(item.url)}
											</span>
										</a>
										<button
											onClick={() => handleDelete(item.id)}
											title='删除'
											className='text-secondary hover:text-red-500 absolute top-2 right-2 rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100'>
											<Trash2 className='h-3.5 w-3.5' />
										</button>
									</motion.div>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
