'use client'

// GitHub 查询：用户信息（统计 / 组织 / Pinned）与仓库信息（统计 / 语言占比 / Release）二合一
import type { ReactElement } from 'react'
import { useState } from 'react'
import {
	Search,
	Star,
	GitFork,
	Users,
	FileCode,
	Eye,
	AlertCircle,
	Scale,
	Tag,
	Building2,
	Link2,
	MapPin,
} from 'lucide-react'
// lucide-react 新版移除了品牌图标，GitHub 图标来自本地内联组件
import { Github } from '../lib/github-icon'
import ToolShell from '../tool-shell'

type Tab = 'user' | 'repo'

// ---------- 通用小组件 ----------
function StatPill({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string | number }) {
	return (
		<div className='flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2'>
			<Icon className='h-3.5 w-3.5 shrink-0 text-slate-400' />
			<span className='text-[10px] text-slate-400'>{label}</span>
			<span className='ml-auto text-xs font-bold tabular-nums'>{value}</span>
		</div>
	)
}

function Loading() {
	return (
		<div className='flex h-52 items-center justify-center'>
			<Github className='h-8 w-8 animate-pulse text-slate-300' />
		</div>
	)
}

// ---------- 用户查询 ----------
interface GitHubUser {
	login: string
	name: string
	avatar_url: string
	html_url: string
	company?: string
	blog?: string
	location?: string
	bio?: string
	followers: number
	following: number
	public_repos: number
	organizations?: Array<{ login: string; avatar_url: string }>
	pinned?: Array<{
		repo_name: string
		owner: string
		description: string
		stargazers_count: number
		forks_count: number
		language: string
	}>
	activity?: { total: number }
}

function UserPanel({ user }: { user: GitHubUser }) {
	return (
		<div className='space-y-4'>
			{/* 头部 */}
			<div className='flex items-start gap-3'>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={user.avatar_url} alt={user.login} className='h-16 w-16 rounded-2xl border' />
				<div className='min-w-0 flex-1'>
					<a
						href={user.html_url}
						target='_blank'
						rel='noopener noreferrer'
						className='flex items-center gap-1.5 font-black hover:text-brand'
					>
						{user.name || user.login}
						<Github className='h-3.5 w-3.5 shrink-0 text-slate-400' />
					</a>
					<p className='text-[11px] text-slate-400'>@{user.login}</p>
					{user.bio && <p className='mt-1 line-clamp-2 text-xs text-slate-500'>{user.bio}</p>}
				</div>
			</div>

			{/* 附加信息 */}
			<div className='flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400'>
				{user.company && (
					<span className='inline-flex items-center gap-1'>
						<Building2 className='h-3 w-3' /> {user.company}
					</span>
				)}
				{user.location && (
					<span className='inline-flex items-center gap-1'>
						<MapPin className='h-3 w-3' /> {user.location}
					</span>
				)}
				{user.blog && (
					<a
						href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
						target='_blank'
						rel='noopener noreferrer'
						className='inline-flex min-w-0 items-center gap-1 truncate hover:text-brand'
					>
						<Link2 className='h-3 w-3 shrink-0' /> {user.blog}
					</a>
				)}
			</div>

			{/* 数据统计 */}
			<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
				<StatPill icon={Users} label='粉丝' value={user.followers} />
				<StatPill icon={Users} label='关注' value={user.following} />
				<StatPill icon={FileCode} label='仓库' value={user.public_repos} />
				<StatPill icon={Star} label='贡献' value={user.activity?.total ?? '-'} />
			</div>

			{/* 组织 */}
			{user.organizations && user.organizations.length > 0 && (
				<div>
					<h3 className='mb-1.5 text-[10px] font-bold text-slate-400'>所在组织</h3>
					<div className='flex flex-wrap gap-2'>
						{user.organizations.map(org => (
							<a
								key={org.login}
								href={`https://github.com/${org.login}`}
								target='_blank'
								rel='noopener noreferrer'
								title={org.login}
								className='transition-transform hover:scale-110'
							>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={org.avatar_url} alt={org.login} className='h-8 w-8 rounded-lg border' />
							</a>
						))}
					</div>
				</div>
			)}

			{/* Pinned 仓库 */}
			{user.pinned && user.pinned.length > 0 && (
				<div>
					<h3 className='mb-1.5 text-[10px] font-bold text-slate-400'>置顶仓库</h3>
					<div className='grid gap-2 sm:grid-cols-2'>
						{user.pinned.map(repo => (
							<a
								key={repo.repo_name}
								href={`https://github.com/${repo.owner}/${repo.repo_name}`}
								target='_blank'
								rel='noopener noreferrer'
								className='block rounded-xl border p-2.5 transition-colors hover:bg-slate-50'
							>
								<p className='truncate text-xs font-bold'>{repo.repo_name}</p>
								{repo.description && <p className='mt-0.5 line-clamp-2 text-[10px] text-slate-400'>{repo.description}</p>}
								<div className='mt-1.5 flex items-center gap-3 text-[10px] text-slate-400'>
									{repo.language && (
										<span className='inline-flex items-center gap-1'>
											<span className='h-2 w-2 rounded-full bg-brand' />
											{repo.language}
										</span>
									)}
									<span className='inline-flex items-center gap-0.5'>
										<Star className='h-2.5 w-2.5' /> {repo.stargazers_count}
									</span>
									<span className='inline-flex items-center gap-0.5'>
										<GitFork className='h-2.5 w-2.5' /> {repo.forks_count}
									</span>
								</div>
							</a>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

// ---------- 仓库查询 ----------
interface GitHubRepo {
	full_name: string
	description: string
	html_url: string
	homepage?: string
	language: string
	stargazers_count: number
	forks_count: number
	subscribers_count: number
	open_issues_count: number
	license?: { name: string }
	created_at: string
	pushed_at: string
	languages?: Record<string, number>
	latest_release?: {
		tag_name: string
		name: string
		published_at: string
		body: string
	}
}

const LANG_COLORS = ['bg-brand', 'bg-amber-400', 'bg-emerald-400', 'bg-rose-400', 'bg-violet-400', 'bg-cyan-400']

function RepoPanel({ repo }: { repo: GitHubRepo }) {
	const langEntries = repo.languages ? Object.entries(repo.languages) : []
	const langTotal = langEntries.reduce((sum, [, v]) => sum + v, 0)

	return (
		<div className='space-y-4'>
			<div>
				<a
					href={repo.html_url}
					target='_blank'
					rel='noopener noreferrer'
					className='text-base font-black hover:text-brand'
				>
					{repo.full_name}
				</a>
				{repo.description && <p className='mt-1 text-xs leading-relaxed text-slate-500'>{repo.description}</p>}
				{repo.homepage && (
					<a
						href={repo.homepage.startsWith('http') ? repo.homepage : `https://${repo.homepage}`}
						target='_blank'
						rel='noopener noreferrer'
						className='mt-1 inline-flex items-center gap-1 truncate text-[10px] text-slate-400 hover:text-brand'
					>
						<Link2 className='h-3 w-3' /> {repo.homepage}
					</a>
				)}
			</div>

			<div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
				<StatPill icon={Star} label='Stars' value={repo.stargazers_count} />
				<StatPill icon={GitFork} label='Forks' value={repo.forks_count} />
				<StatPill icon={Eye} label='Watch' value={repo.subscribers_count} />
				<StatPill icon={AlertCircle} label='Issues' value={repo.open_issues_count} />
				<StatPill icon={FileCode} label='语言' value={repo.language || '-'} />
				<StatPill icon={Scale} label='协议' value={repo.license?.name?.replace('License', '').trim() || '-'} />
			</div>

			{/* 语言占比条 */}
			{langTotal > 0 && (
				<div>
					<div className='flex h-2.5 overflow-hidden rounded-full'>
						{langEntries.map(([lang, val], i) => (
							<div
								key={lang}
								className={LANG_COLORS[i % LANG_COLORS.length]}
								style={{ width: `${(val / langTotal) * 100}%` }}
								title={`${lang} ${((val / langTotal) * 100).toFixed(1)}%`}
							/>
						))}
					</div>
					<div className='mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5'>
						{langEntries.map(([lang, val], i) => (
							<span key={lang} className='inline-flex items-center gap-1 text-[10px] text-slate-400'>
								<span className={`h-2 w-2 rounded-full ${LANG_COLORS[i % LANG_COLORS.length]}`} />
								{lang} {((val / langTotal) * 100).toFixed(1)}%
							</span>
						))}
					</div>
				</div>
			)}

			{/* 最新 Release */}
			{repo.latest_release && (
				<div className='rounded-xl border p-3'>
					<div className='mb-1 flex items-center gap-2'>
						<span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600'>
							<Tag className='h-2.5 w-2.5' />
							{repo.latest_release.tag_name}
						</span>
						<span className='text-[10px] text-slate-400'>
							{new Date(repo.latest_release.published_at).toLocaleDateString('zh-CN')}
						</span>
					</div>
					{repo.latest_release.body && (
						<p className='line-clamp-4 whitespace-pre-line text-[10px] leading-relaxed text-slate-500'>
							{repo.latest_release.body}
						</p>
					)}
				</div>
			)}
		</div>
	)
}

// ---------- 主页面 ----------
export default function GitHubPage(): ReactElement {
	const [tab, setTab] = useState<Tab>('user')
	const [username, setUsername] = useState('')
	const [repo, setRepo] = useState('')
	const [userResult, setUserResult] = useState<GitHubUser | null>(null)
	const [repoResult, setRepoResult] = useState<GitHubRepo | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	async function queryUser() {
		const name = username.trim()
		if (!name) return
		setLoading(true)
		setError('')
		setUserResult(null)
		try {
			const res = await fetch(
				`/api/uapis?path=github/user&user=${encodeURIComponent(name)}&activity=true&pinned=true&repos=false&repos_limit=6`,
			)
			const data = await res.json()
			if (!res.ok || data.message) setError(data.message || '用户不存在或查询失败')
			else setUserResult(data)
		} catch (e) {
			setError(e instanceof Error ? e.message : '网络错误')
		} finally {
			setLoading(false)
		}
	}

	async function queryRepo() {
		const r = repo.trim().replace(/^https?:\/\/github\.com\//, '')
		if (!r || !r.includes('/')) {
			setError('请输入 owner/repo 形式的仓库名，如 vercel/next.js')
			return
		}
		setLoading(true)
		setError('')
		setRepoResult(null)
		try {
			const res = await fetch(`/api/uapis?path=github/repo&repo=${encodeURIComponent(r)}`)
			const data = await res.json()
			if (!res.ok || data.message) setError(data.message || '仓库不存在或查询失败')
			else setRepoResult(data)
		} catch (e) {
			setError(e instanceof Error ? e.message : '网络错误')
		} finally {
			setLoading(false)
		}
	}

	return (
		<ToolShell icon={Github} title='GitHub 查询' desc='查开发者，也查好项目' wide>
			{/* Tab 切换 */}
			<div className='flex rounded-xl bg-slate-100 p-1'>
				{([
					{ id: 'user', name: '用户查询' },
					{ id: 'repo', name: '仓库查询' },
				] as const).map(t => (
					<button
						key={t.id}
						type='button'
						onClick={() => {
							setTab(t.id)
							setError('')
						}}
						className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
							tab === t.id ? 'bg-white text-brand shadow-sm' : 'text-slate-500'
						}`}
					>
						{t.name}
					</button>
				))}
			</div>

			{/* 搜索行 */}
			{tab === 'user' ? (
				<div className='mt-3 flex gap-2'>
					<input
						value={username}
						onChange={e => setUsername(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && queryUser()}
						placeholder='GitHub 用户名，如 torvalds'
						className='flex-1 rounded-xl border border-transparent bg-slate-100 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand'
					/>
					<button
						type='button'
						onClick={queryUser}
						disabled={loading}
						className='shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50'
					>
						<Search className='h-4 w-4' />
					</button>
				</div>
			) : (
				<div className='mt-3 flex gap-2'>
					<input
						value={repo}
						onChange={e => setRepo(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && queryRepo()}
						placeholder='仓库名，如 vercel/next.js（也支持粘贴链接）'
						className='flex-1 rounded-xl border border-transparent bg-slate-100 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand'
					/>
					<button
						type='button'
						onClick={queryRepo}
						disabled={loading}
						className='shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50'
					>
						<Search className='h-4 w-4' />
					</button>
				</div>
			)}

			{error && <div className='mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-500'>{error}</div>}

			<div className='mt-4'>
				{loading ? (
					<Loading />
				) : (
					<>
						{tab === 'user' && userResult && <UserPanel user={userResult} />}
						{tab === 'repo' && repoResult && <RepoPanel repo={repoResult} />}
						{!userResult && !repoResult && !error && (
							<div className='flex h-52 flex-col items-center justify-center gap-2 text-slate-300'>
								<Github className='h-12 w-12' />
								<span className='text-[11px]'>输入用户名或仓库名开始查询</span>
							</div>
						)}
					</>
				)}
			</div>
		</ToolShell>
	)
}
