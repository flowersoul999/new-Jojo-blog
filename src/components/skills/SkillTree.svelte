<script lang="ts">
/**
 * 技能树主组件
 *
 * 视觉规则：节点亮度 = 掌握度。Lv0 未接触（虚线灰）→ Lv5 大师（实心主题色 + 呼吸光晕）。
 * 所有颜色都由 --primary 与 --card-bg 混出来，因此会自动跟随站点主题色和明暗模式。
 */
import { onMount } from "svelte";
import {
	ALL_NODES,
	BRANCHES,
	LEVELS,
	MAX_LEVEL,
	NODE_MAP,
	ROOT,
	TOTAL_NODES,
} from "@/data/skills";

const STORAGE_KEY = "aemeath-skill-tree";

/** 打包时写入的个人预设掌握度 */
const DEFAULT_LEVELS: Record<string, number> = Object.fromEntries(
	ALL_NODES.map((n) => [n.id, n.level]),
);

/** 读取本地覆盖值；兼容旧版「字符串数组」格式 */
function loadOverrides(): Record<string, number> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed: unknown = JSON.parse(raw);
		if (Array.isArray(parsed)) {
			return Object.fromEntries(
				parsed
					.filter((x): x is string => typeof x === "string")
					.map((x) => [x, 2]),
			);
		}
		if (parsed && typeof parsed === "object") {
			const out: Record<string, number> = {};
			for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
				if (typeof v === "number" && v >= 0 && v <= MAX_LEVEL) out[k] = v;
			}
			return out;
		}
	} catch {
		/* localStorage 不可用时静默降级为默认值 */
	}
	return {};
}

let levels = $state<Record<string, number>>({ ...DEFAULT_LEVELS });
let ready = $state(false);
let view = $state<"tree" | "compact">("tree");
let filter = $state<"all" | "done" | "todo">("all");
let activeId = $state<string | null>(null);
let revealed = $state(false);
let treeEl = $state<HTMLElement | undefined>(undefined);
let dirty = $state(false);

onMount(() => {
	const overrides = loadOverrides();
	if (Object.keys(overrides).length > 0) {
		levels = { ...DEFAULT_LEVELS, ...overrides };
		dirty = true;
	}
	ready = true;
});

/** 树的整体显隐：进入视口后节点按 --i 依次点亮 */
$effect(() => {
	const el = treeEl;
	if (!el || typeof IntersectionObserver === "undefined") {
		revealed = true;
		return;
	}
	const io = new IntersectionObserver(
		(entries) => {
			if (entries.some((e) => e.isIntersecting)) {
				revealed = true;
				io.disconnect();
			}
		},
		{ threshold: 0.05 },
	);
	io.observe(el);
	return () => io.disconnect();
});

function persist() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
	} catch {
		/* 忽略隐私模式等写入失败 */
	}
}

function lvOf(id: string): number {
	return levels[id] ?? 0;
}

function setLevel(id: string, lv: number) {
	const next = Math.max(0, Math.min(MAX_LEVEL, lv));
	levels = { ...levels, [id]: next };
	dirty = true;
	persist();
}

function resetToPreset() {
	levels = { ...DEFAULT_LEVELS };
	dirty = false;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		/* 忽略 */
	}
}

function clearAll() {
	const zeroed: Record<string, number> = {};
	for (const n of ALL_NODES) zeroed[n.id] = 0;
	levels = zeroed;
	dirty = true;
	persist();
}

/** 只有 Lv0/Lv1 的算「还没真正上手」 */
function needsWork(id: string): boolean {
	return lvOf(id) <= 1;
}

function visible(id: string): boolean {
	if (filter === "todo") return needsWork(id);
	if (filter === "done") return lvOf(id) >= 3;
	return true;
}

const stats = $derived.by(() => {
	let sum = 0;
	let lit = 0;
	let solid = 0;
	for (const n of ALL_NODES) {
		const lv = levels[n.id] ?? 0;
		sum += lv;
		if (lv > 0) lit += 1;
		if (lv >= 3) solid += 1;
	}
	const pct = Math.round((sum / (TOTAL_NODES * MAX_LEVEL)) * 100);
	return { sum, lit, solid, pct };
});

const RING = 2 * Math.PI * 52;

function branchStat(nodes: { id: string }[]) {
	let sum = 0;
	let lit = 0;
	for (const n of nodes) {
		const lv = levels[n.id] ?? 0;
		sum += lv;
		if (lv > 0) lit += 1;
	}
	return {
		pct: Math.round((sum / (nodes.length * MAX_LEVEL)) * 100),
		lit,
		total: nodes.length,
	};
}

const activeNode = $derived(activeId ? NODE_MAP[activeId] : null);
const activeLv = $derived(activeNode ? lvOf(activeNode.id) : 0);
const activeBranch = $derived(
	activeId
		? (BRANCHES.find((b) => b.nodes.some((n) => n.id === activeId)) ?? null)
		: null,
);
const activeLevelDef = $derived(LEVELS[activeLv] ?? LEVELS[0]);
</script>

<div class="sk-hero">
	<div class="sk-hero-main">
		<p class="sk-eyebrow">我的技能树</p>
		<h2 class="sk-title">从前端小白，到能定方案的人</h2>
		<p class="sk-sub">
			{TOTAL_NODES} 个技能节点，按学习依赖长成一棵树。亮度就是掌握度，越亮越熟。
		</p>
	</div>

	<div class="sk-ring-wrap">
		<svg class="sk-ring" viewBox="0 0 120 120" role="img" aria-label={`总掌握度 ${stats.pct}%`}>
			<title>总掌握度 {stats.pct}%</title>
			<circle class="sk-ring-track" cx="60" cy="60" r="52" />
			<circle
				class="sk-ring-fill"
				cx="60"
				cy="60"
				r="52"
				stroke-dasharray={RING}
				stroke-dashoffset={RING * (1 - stats.pct / 100)}
			/>
		</svg>
		<div class="sk-ring-text">
			<strong>{stats.pct}<i>%</i></strong>
			<span>总掌握度</span>
		</div>
	</div>
</div>

<div class="sk-metrics">
	<div class="sk-metric">
		<span>已点亮</span>
		<strong>{stats.lit}<i>/{TOTAL_NODES}</i></strong>
	</div>
	<div class="sk-metric">
		<span>熟练以上</span>
		<strong>{stats.solid}<i>/{TOTAL_NODES}</i></strong>
	</div>
	<div class="sk-metric">
		<span>待攻克</span>
		<strong>{TOTAL_NODES - stats.lit}<i> 个</i></strong>
	</div>
</div>

<div class="sk-toolbar">
	<div class="sk-seg" role="group" aria-label="视图切换">
		<button
			type="button"
			class:on={view === "tree"}
			onclick={() => (view = "tree")}
		>树状</button>
		<button
			type="button"
			class:on={view === "compact"}
			onclick={() => (view = "compact")}
		>紧凑</button>
	</div>

	<div class="sk-seg" role="group" aria-label="筛选">
		<button type="button" class:on={filter === "all"} onclick={() => (filter = "all")}>全部</button>
		<button type="button" class:on={filter === "done"} onclick={() => (filter = "done")}>已熟练</button>
		<button type="button" class:on={filter === "todo"} onclick={() => (filter = "todo")}>待攻克</button>
	</div>

	<div class="sk-toolbar-right">
		{#if dirty}
			<button type="button" class="sk-ghost" onclick={resetToPreset}>恢复预设</button>
		{/if}
		<button
			type="button"
			class="sk-ghost"
			onclick={() => {
				if (window.confirm("清空所有掌握度，全部回到 Lv0？")) clearAll();
			}}>全部清零</button
		>
	</div>
</div>

<div class="sk-tree" class:is-compact={view === "compact"} class:revealed bind:this={treeEl}>
	<div class="sk-root">
		<span class="sk-root-badge">
			<span class="sk-root-pulse"></span>
			{ROOT.name}
		</span>
		<p class="sk-root-note">{ROOT.note}</p>
	</div>

	<div class="sk-branches">
		{#each BRANCHES as branch, bi (branch.id)}
			{@const st = branchStat(branch.nodes)}
			{@const list = branch.nodes.filter((n) => visible(n.id))}
			<article class="sk-branch" style={`--bh:${bi * 33};--bd:${bi * 60}ms`}>
				<span class="sk-branch-cap" aria-hidden="true"></span>

				<header class="sk-branch-head">
					<div class="sk-branch-top">
						<h3>{branch.name}</h3>
						<span class="sk-branch-count">{st.lit}/{st.total}</span>
					</div>
					<p class="sk-branch-sub">{branch.subtitle}</p>
					<div class="sk-branch-bar">
						<span style={`width:${st.pct}%`}></span>
					</div>
				</header>

				<div class="sk-spine">
					{#if list.length === 0}
						<p class="sk-empty">这个筛选下没有节点</p>
					{/if}
					{#each list as node, ni (node.id)}
						{@const lv = lvOf(node.id)}
						<button
							type="button"
							class="sk-node"
							data-lv={lv}
							style={`--i:${ni}`}
							aria-label={`${node.name}，当前 ${lv} 级 ${LEVELS[lv].name}`}
							onclick={() => (activeId = node.id)}
						>
							<span class="sk-node-name">{node.name}</span>
							<span class="sk-node-lv">L{lv}</span>
						</button>
					{/each}
				</div>
			</article>
		{/each}
	</div>
</div>

<div class="sk-legend">
	{#each LEVELS as def (def.level)}
		<span class="sk-legend-item">
			<i data-lv={def.level}></i>
			<b>L{def.level}</b>
			{def.name}
		</span>
	{/each}
</div>

<p class="sk-foot">
	等级是你自己的主观判断，改完存在浏览器本地；想改默认值直接编辑
	<code>src/data/skills.ts</code> 里的 <code>level</code> 字段。
</p>

{#if activeNode}
	<div
		class="sk-drawer-mask"
		role="presentation"
		onclick={() => (activeId = null)}
	></div>
	<aside class="sk-drawer" role="dialog" aria-modal="true" aria-label={activeNode.name}>
		<header class="sk-drawer-head">
			<div>
				{#if activeBranch}
					<p class="sk-drawer-branch">{activeBranch.name}</p>
				{/if}
				<h3>{activeNode.name}</h3>
			</div>
			<button
				type="button"
				class="sk-drawer-close"
				aria-label="关闭"
				onclick={() => (activeId = null)}>×</button
			>
		</header>

		<p class="sk-drawer-note">{activeNode.note}</p>

		<div class="sk-drawer-level" data-lv={activeLv}>
			<div class="sk-drawer-level-top">
				<span class="sk-drawer-level-name">L{activeLv} · {activeLevelDef.name}</span>
				<span class="sk-drawer-level-pct">{Math.round((activeLv / MAX_LEVEL) * 100)}%</span>
			</div>
			<p class="sk-drawer-level-desc">{activeLevelDef.desc}</p>
			<p class="sk-drawer-level-judge">判定标准：{activeLevelDef.judge}</p>
		</div>

		<div class="sk-drawer-picker">
			{#each LEVELS as def (def.level)}
				<button
					type="button"
					class:on={def.level === activeLv}
					data-lv={def.level}
					onclick={() => setLevel(activeNode.id, def.level)}
					title={def.name}
				>L{def.level}</button>
			{/each}
		</div>

		{#if activeNode.tips && activeNode.tips.length}
			<div class="sk-drawer-tips">
				<p class="sk-drawer-tips-title">学习要点</p>
				<ul>
					{#each activeNode.tips as tip}
						<li>{tip}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</aside>
{/if}

<style>
	/* ===================== Hero ===================== */
	.sk-hero {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
	}
	.sk-hero-main {
		flex: 1 1 20rem;
		min-width: 0;
	}
	.sk-eyebrow {
		margin: 0 0 0.35rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--primary);
	}
	.sk-title {
		margin: 0 0 0.5rem;
		font-size: 1.6rem;
		font-weight: 800;
		line-height: 1.3;
		color: var(--deep-text);
	}
	.sk-sub {
		margin: 0;
		font-size: 0.86rem;
		line-height: 1.75;
		color: color-mix(in srgb, var(--deep-text) 62%, transparent);
	}

	.sk-ring-wrap {
		position: relative;
		width: 7.5rem;
		height: 7.5rem;
		flex: none;
	}
	.sk-ring {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}
	.sk-ring-track {
		fill: none;
		stroke: color-mix(in srgb, var(--deep-text) 12%, transparent);
		stroke-width: 9;
	}
	.sk-ring-fill {
		fill: none;
		stroke: var(--primary);
		stroke-width: 9;
		stroke-linecap: round;
		transition: stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.sk-ring-text {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.1rem;
	}
	.sk-ring-text strong {
		font-size: 1.5rem;
		font-weight: 800;
		line-height: 1;
		color: var(--deep-text);
	}
	.sk-ring-text strong i {
		font-size: 0.8rem;
		font-style: normal;
		opacity: 0.6;
	}
	.sk-ring-text span {
		font-size: 0.68rem;
		letter-spacing: 0.08em;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}

	/* ===================== 指标 ===================== */
	.sk-metrics {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
		margin: 1.25rem 0 0;
	}
	.sk-metric {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.7rem 0.9rem;
		border-radius: 14px;
		border: 1px solid var(--line-divider);
		background: color-mix(in srgb, var(--primary) 6%, transparent);
	}
	.sk-metric span {
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}
	.sk-metric strong {
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--primary);
		line-height: 1.1;
	}
	.sk-metric strong i {
		font-size: 0.75rem;
		font-style: normal;
		font-weight: 600;
		opacity: 0.55;
	}

	/* ===================== 工具栏 ===================== */
	.sk-toolbar {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
		margin: 1.25rem 0 0;
	}
	.sk-seg {
		display: inline-flex;
		padding: 0.18rem;
		border-radius: 999px;
		border: 1px solid var(--line-divider);
		background: color-mix(in srgb, var(--deep-text) 4%, transparent);
	}
	.sk-seg button {
		border: none;
		background: transparent;
		border-radius: 999px;
		padding: 0.3rem 0.8rem;
		font-size: 0.78rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--deep-text) 62%, transparent);
		cursor: pointer;
		transition: all 180ms ease;
	}
	.sk-seg button.on {
		background: var(--primary);
		color: #fff;
		box-shadow: 0 2px 8px color-mix(in srgb, var(--primary) 35%, transparent);
	}
	.sk-toolbar-right {
		margin-left: auto;
		display: flex;
		gap: 0.5rem;
	}
	.sk-ghost {
		border: 1px solid var(--line-divider);
		background: transparent;
		border-radius: 999px;
		padding: 0.32rem 0.85rem;
		font-size: 0.76rem;
		color: color-mix(in srgb, var(--deep-text) 65%, transparent);
		cursor: pointer;
		transition: all 180ms ease;
	}
	.sk-ghost:hover {
		border-color: color-mix(in srgb, var(--primary) 50%, transparent);
		color: var(--primary);
	}

	/* ===================== 树根 ===================== */
	.sk-tree {
		margin-top: 1.75rem;
	}
	.sk-root {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}
	.sk-root-badge {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1.4rem;
		border-radius: 999px;
		background: var(--primary);
		color: #fff;
		font-size: 0.92rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		box-shadow:
			0 0 0 6px color-mix(in srgb, var(--primary) 14%, transparent),
			0 10px 30px color-mix(in srgb, var(--primary) 32%, transparent);
	}
	.sk-root-pulse {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		background: #fff;
		animation: sk-breathe 2.6s ease-in-out infinite;
	}
	.sk-root-note {
		margin: 0;
		font-size: 0.78rem;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}

	/* ===================== 分支网格 ===================== */
	.sk-branches {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr));
		gap: 1.1rem;
		align-items: start;
	}
	.sk-branch {
		position: relative;
		padding: 1.15rem 1.1rem 1rem;
		border-radius: 20px;
		border: 1px solid var(--line-divider);
		background: var(--card-bg);
		box-shadow: var(--card-shadow, 0 2px 14px rgb(0 0 0 / 6%));
		transition: border-color 260ms ease, box-shadow 260ms ease;
	}
	.sk-branch:hover {
		border-color: color-mix(in srgb, var(--primary) 38%, transparent);
		box-shadow: 0 16px 38px rgb(0 0 0 / 10%);
	}
	/* 分支顶部的小圆点：视觉上像从树根垂下来的一根枝条 */
	.sk-branch-cap {
		position: absolute;
		top: -0.32rem;
		left: 50%;
		transform: translateX(-50%);
		width: 0.62rem;
		height: 0.62rem;
		border-radius: 999px;
		background: oklch(0.72 0.14 calc(var(--hue) + var(--bh)));
		box-shadow: 0 0 0 4px var(--card-bg);
	}

	.sk-branch-head {
		margin-bottom: 0.85rem;
	}
	.sk-branch-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.sk-branch-top h3 {
		margin: 0;
		font-size: 1.02rem;
		font-weight: 800;
		color: var(--deep-text);
	}
	.sk-branch-count {
		flex: none;
		font-size: 0.72rem;
		font-weight: 700;
		color: oklch(0.55 0.14 calc(var(--hue) + var(--bh)));
	}
	.sk-branch-sub {
		margin: 0.2rem 0 0.6rem;
		font-size: 0.75rem;
		line-height: 1.6;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}
	.sk-branch-bar {
		height: 0.32rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--deep-text) 8%, transparent);
		overflow: hidden;
	}
	.sk-branch-bar span {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: oklch(0.66 0.15 calc(var(--hue) + var(--bh)));
		transition: width 700ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	/* ===================== 枝条与节点 ===================== */
	.sk-spine {
		position: relative;
		padding-left: 1.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.sk-spine::before {
		content: "";
		position: absolute;
		left: 0.42rem;
		top: 0.55rem;
		bottom: 0.55rem;
		width: 2px;
		border-radius: 2px;
		background: linear-gradient(
			to bottom,
			oklch(0.66 0.15 calc(var(--hue) + var(--bh))),
			color-mix(in srgb, var(--primary) 8%, transparent)
		);
	}

	.sk-node {
		position: relative;
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.42rem 0.65rem;
		border-radius: 11px;
		border: 1px solid var(--sk-border);
		background: var(--sk-bg);
		color: var(--sk-fg);
		font-size: 0.8rem;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
		box-shadow: var(--sk-glow, none);
		transition: transform 180ms ease, box-shadow 220ms ease, border-color 220ms ease,
			background 220ms ease;
	}
	/* 枝条上的横向小枝 */
	.sk-node::before {
		content: "";
		position: absolute;
		left: -0.94rem;
		top: 50%;
		width: 0.62rem;
		height: 1.5px;
		background: color-mix(in srgb, var(--primary) 32%, transparent);
	}
	/* 枝条连接点 */
	.sk-node::after {
		content: "";
		position: absolute;
		left: -1.1rem;
		top: 50%;
		width: 5px;
		height: 5px;
		border-radius: 999px;
		transform: translate(-50%, -50%);
		background: color-mix(in srgb, var(--primary) 55%, transparent);
		transition: background 220ms ease, box-shadow 220ms ease;
	}
	.sk-node:hover {
		transform: translateX(3px);
		border-color: var(--primary);
	}
	.sk-node:hover::after {
		background: var(--primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 22%, transparent);
	}
	.sk-node-name {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sk-node-lv {
		flex: none;
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		padding: 0.1rem 0.35rem;
		border-radius: 6px;
		background: color-mix(in srgb, var(--sk-fg) 12%, transparent);
		opacity: 0.85;
	}

	/* ===================== 六档亮度 ===================== */
	.sk-node[data-lv="0"] {
		--sk-bg: transparent;
		--sk-border: color-mix(in srgb, var(--deep-text) 20%, transparent);
		--sk-fg: color-mix(in srgb, var(--deep-text) 46%, transparent);
		border-style: dashed;
	}
	.sk-node[data-lv="1"] {
		--sk-bg: color-mix(in oklab, var(--primary) 10%, var(--card-bg));
		--sk-border: color-mix(in srgb, var(--primary) 28%, transparent);
		--sk-fg: color-mix(in srgb, var(--text-color) 78%, transparent);
	}
	.sk-node[data-lv="2"] {
		--sk-bg: color-mix(in oklab, var(--primary) 24%, var(--card-bg));
		--sk-border: color-mix(in srgb, var(--primary) 44%, transparent);
		--sk-fg: var(--text-color);
	}
	.sk-node[data-lv="3"] {
		--sk-bg: color-mix(in oklab, var(--primary) 44%, var(--card-bg));
		--sk-border: color-mix(in srgb, var(--primary) 62%, transparent);
		--sk-fg: var(--text-color);
		--sk-glow: 0 2px 12px color-mix(in srgb, var(--primary) 14%, transparent);
	}
	.sk-node[data-lv="4"] {
		--sk-bg: color-mix(in oklab, var(--primary) 70%, var(--card-bg));
		--sk-border: var(--primary);
		--sk-fg: oklch(0.2 0.03 var(--hue));
		--sk-glow: 0 4px 18px color-mix(in srgb, var(--primary) 30%, transparent);
	}
	.sk-node[data-lv="5"] {
		--sk-bg: var(--primary);
		--sk-border: oklch(0.45 0.13 var(--hue));
		--sk-fg: oklch(0.16 0.03 var(--hue));
		--sk-glow:
			0 0 0 3px color-mix(in srgb, var(--primary) 22%, transparent),
			0 8px 26px color-mix(in srgb, var(--primary) 46%, transparent);
		animation: sk-breathe 3.4s ease-in-out infinite;
	}

	@keyframes sk-breathe {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.82;
		}
	}

	.sk-empty {
		margin: 0.2rem 0;
		font-size: 0.76rem;
		color: color-mix(in srgb, var(--deep-text) 45%, transparent);
	}

	/* ===================== 入场点亮 ===================== */
	.sk-tree .sk-node,
	.sk-tree .sk-branch {
		opacity: 0;
		transform: translateY(10px);
	}
	.sk-tree.revealed .sk-node,
	.sk-tree.revealed .sk-branch {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 460ms ease,
			transform 460ms cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 220ms ease,
			border-color 220ms ease,
			background 220ms ease;
	}
	.sk-tree.revealed .sk-branch {
		transition-delay: var(--bd);
	}
	.sk-tree.revealed .sk-node {
		transition-delay: calc(var(--bd) + var(--i) * 26ms);
	}

	@media (prefers-reduced-motion: reduce) {
		.sk-tree .sk-node,
		.sk-tree .sk-branch {
			opacity: 1;
			transform: none;
			animation: none;
		}
	}

	/* ===================== 紧凑视图 ===================== */
	.sk-tree.is-compact .sk-branches {
		grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
	}
	.sk-tree.is-compact .sk-branch {
		padding: 0.9rem 0.85rem 0.8rem;
	}
	.sk-tree.is-compact .sk-spine {
		padding-left: 0;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	.sk-tree.is-compact .sk-spine::before,
	.sk-tree.is-compact .sk-node::before,
	.sk-tree.is-compact .sk-node::after {
		display: none;
	}
	.sk-tree.is-compact .sk-node {
		width: auto;
		padding: 0.24rem 0.5rem;
		font-size: 0.72rem;
		border-radius: 999px;
	}
	.sk-tree.is-compact .sk-node:hover {
		transform: translateY(-2px);
	}

	/* ===================== 图例 ===================== */
	.sk-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1rem;
		align-items: center;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line-divider);
	}
	.sk-legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.74rem;
		color: color-mix(in srgb, var(--deep-text) 58%, transparent);
	}
	.sk-legend-item b {
		font-weight: 700;
		color: color-mix(in srgb, var(--deep-text) 75%, transparent);
	}
	.sk-legend-item i {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 4px;
		border: 1px solid var(--primary);
		background: var(--primary);
	}
	.sk-legend-item i[data-lv="0"] {
		background: transparent;
		border: 1px dashed color-mix(in srgb, var(--deep-text) 30%, transparent);
	}
	.sk-legend-item i[data-lv="1"] {
		background: color-mix(in oklab, var(--primary) 10%, var(--card-bg));
	}
	.sk-legend-item i[data-lv="2"] {
		background: color-mix(in oklab, var(--primary) 24%, var(--card-bg));
	}
	.sk-legend-item i[data-lv="3"] {
		background: color-mix(in oklab, var(--primary) 44%, var(--card-bg));
	}
	.sk-legend-item i[data-lv="4"] {
		background: color-mix(in oklab, var(--primary) 70%, var(--card-bg));
	}

	.sk-foot {
		margin: 0.9rem 0 0;
		font-size: 0.74rem;
		line-height: 1.7;
		color: color-mix(in srgb, var(--deep-text) 48%, transparent);
	}
	.sk-foot code {
		padding: 0.08rem 0.32rem;
		border-radius: 5px;
		background: color-mix(in srgb, var(--primary) 12%, transparent);
		color: var(--primary);
		font-size: 0.72rem;
	}

	/* ===================== 详情抽屉 ===================== */
	.sk-drawer-mask {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: rgb(0 0 0 / 32%);
		backdrop-filter: blur(2px);
	}
	.sk-drawer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 61;
		width: min(23rem, 92vw);
		overflow-y: auto;
		padding: 1.4rem 1.3rem 2rem;
		background: var(--card-bg);
		border-left: 1px solid var(--line-divider);
		box-shadow: -18px 0 48px rgb(0 0 0 / 18%);
		animation: sk-slide-in 300ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	@keyframes sk-slide-in {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}
	.sk-drawer-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.sk-drawer-branch {
		margin: 0 0 0.2rem;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--primary);
	}
	.sk-drawer-head h3 {
		margin: 0;
		font-size: 1.18rem;
		font-weight: 800;
		color: var(--deep-text);
	}
	.sk-drawer-close {
		flex: none;
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 999px;
		border: 1px solid var(--line-divider);
		background: transparent;
		font-size: 1.1rem;
		line-height: 1;
		color: color-mix(in srgb, var(--deep-text) 60%, transparent);
		cursor: pointer;
	}
	.sk-drawer-close:hover {
		color: var(--primary);
		border-color: var(--primary);
	}
	.sk-drawer-note {
		margin: 0.9rem 0 0;
		font-size: 0.86rem;
		line-height: 1.75;
		color: color-mix(in srgb, var(--deep-text) 72%, transparent);
	}

	.sk-drawer-level {
		margin-top: 1.1rem;
		padding: 0.85rem 0.95rem;
		border-radius: 14px;
		border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
		background: color-mix(in oklab, var(--primary) var(--dl, 10%), var(--card-bg));
	}
	.sk-drawer-level[data-lv="0"] {
		--dl: 0%;
	}
	.sk-drawer-level[data-lv="1"] {
		--dl: 10%;
	}
	.sk-drawer-level[data-lv="2"] {
		--dl: 24%;
	}
	.sk-drawer-level[data-lv="3"] {
		--dl: 44%;
	}
	.sk-drawer-level[data-lv="4"] {
		--dl: 70%;
	}
	.sk-drawer-level[data-lv="5"] {
		--dl: 100%;
	}
	.sk-drawer-level-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.sk-drawer-level-name {
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--deep-text);
	}
	.sk-drawer-level-pct {
		font-size: 0.8rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}
	.sk-drawer-level-desc {
		margin: 0.4rem 0 0;
		font-size: 0.8rem;
		line-height: 1.7;
		color: color-mix(in srgb, var(--deep-text) 70%, transparent);
	}
	.sk-drawer-level-judge {
		margin: 0.45rem 0 0;
		font-size: 0.74rem;
		line-height: 1.6;
		color: color-mix(in srgb, var(--deep-text) 52%, transparent);
	}

	.sk-drawer-picker {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 0.35rem;
		margin-top: 1rem;
	}
	.sk-drawer-picker button {
		padding: 0.45rem 0;
		border-radius: 10px;
		border: 1px solid var(--line-divider);
		background: transparent;
		font-size: 0.75rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
		cursor: pointer;
		transition: all 180ms ease;
	}
	.sk-drawer-picker button[data-lv="0"].on {
		background: color-mix(in srgb, var(--deep-text) 8%, transparent);
		border-color: color-mix(in srgb, var(--deep-text) 30%, transparent);
		color: var(--deep-text);
	}
	.sk-drawer-picker button[data-lv="1"].on {
		background: color-mix(in oklab, var(--primary) 14%, var(--card-bg));
		border-color: var(--primary);
		color: var(--deep-text);
	}
	.sk-drawer-picker button[data-lv="2"].on {
		background: color-mix(in oklab, var(--primary) 30%, var(--card-bg));
		border-color: var(--primary);
		color: var(--deep-text);
	}
	.sk-drawer-picker button[data-lv="3"].on {
		background: color-mix(in oklab, var(--primary) 50%, var(--card-bg));
		border-color: var(--primary);
		color: var(--deep-text);
	}
	.sk-drawer-picker button[data-lv="4"].on {
		background: color-mix(in oklab, var(--primary) 72%, var(--card-bg));
		border-color: var(--primary);
		color: oklch(0.2 0.03 var(--hue));
	}
	.sk-drawer-picker button[data-lv="5"].on {
		background: var(--primary);
		border-color: var(--primary);
		color: oklch(0.16 0.03 var(--hue));
	}
	.sk-drawer-picker button:hover {
		border-color: var(--primary);
	}

	.sk-drawer-tips {
		margin-top: 1.2rem;
	}
	.sk-drawer-tips-title {
		margin: 0 0 0.5rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--deep-text) 50%, transparent);
	}
	.sk-drawer-tips ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.sk-drawer-tips li {
		position: relative;
		padding-left: 0.95rem;
		font-size: 0.8rem;
		line-height: 1.65;
		color: color-mix(in srgb, var(--deep-text) 72%, transparent);
	}
	.sk-drawer-tips li::before {
		content: "";
		position: absolute;
		left: 0;
		top: 0.52rem;
		width: 0.34rem;
		height: 0.34rem;
		border-radius: 999px;
		background: var(--primary);
	}

	/* ===================== 响应式 ===================== */
	@media (max-width: 640px) {
		.sk-title {
			font-size: 1.3rem;
		}
		.sk-ring-wrap {
			width: 6rem;
			height: 6rem;
		}
		.sk-metrics {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.5rem;
		}
		.sk-metric {
			padding: 0.6rem 0.7rem;
		}
		.sk-metric strong {
			font-size: 1.05rem;
		}
		.sk-branches {
			grid-template-columns: 1fr;
		}
		.sk-branch-cap {
			display: none;
		}
		.sk-node-name {
			white-space: normal;
		}
		.sk-toolbar-right {
			margin-left: 0;
			width: 100%;
		}
	}
</style>
