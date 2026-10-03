<script lang="ts">
/**
 * 技能树主组件
 *
 * 结构：纵向树。顶部是起点，向下逐层深入，L0 最浅、L8 最深。
 * 同一层里的技术难度与占比相同，每层自带一条横枝，节点挂在枝上。
 * 点亮动画从高到低逐层推进：每层延迟 --ti * 170ms，层内节点再按 --i 依次亮起。
 *
 * 视觉规则：节点亮度 = 掌握度。Lv0 虚线圈 → Lv5 实心主题色 + 呼吸光晕。
 * 所有颜色都由 --primary 与 --card-bg 混出，因此会自动跟随站点主题色和明暗模式。
 */
import { onMount } from "svelte";
import {
	ALL_NODES,
	LEVELS,
	MAX_LEVEL,
	NODE_MAP,
	ROOT,
	TIER_OF_NODE,
	TIERS,
	TOTAL_NODES,
	tierRatio,
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
});

/** 进入视口后从顶层开始逐层点亮 */
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
		{ threshold: 0.02 },
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
	if (lv < 0 || lv > MAX_LEVEL) return;
	levels = { ...levels, [id]: lv };
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

function visible(id: string): boolean {
	if (filter === "todo") return lvOf(id) <= 1;
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
	return {
		sum,
		lit,
		solid,
		pct: Math.round((sum / (TOTAL_NODES * MAX_LEVEL)) * 100),
	};
});

const RING = 2 * Math.PI * 52;

function tierStat(nodes: { id: string }[]) {
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

/** 筛选后仍要显示的层 */
const visibleTiers = $derived.by(() =>
	TIERS.map((t) => ({
		tier: t,
		list: t.nodes.filter((n) => visible(n.id)),
	})).filter((v) => v.list.length > 0),
);

const activeNode = $derived(activeId ? NODE_MAP[activeId] : null);
const activeLv = $derived(activeNode ? lvOf(activeNode.id) : 0);
const activeTier = $derived(activeId ? TIERS[TIER_OF_NODE[activeId]] : null);
const activeLevelDef = $derived(LEVELS[activeLv] ?? LEVELS[0]);
/** 同层技术等权重：本层占比 ÷ 本层技能数 */
const activeWeight = $derived(
	activeTier
		? ((tierRatio(activeTier) * 100) / activeTier.nodes.length).toFixed(2)
		: "0",
);
</script>

<div class="sk-hero">
	<div class="sk-hero-main">
		<p class="sk-eyebrow">我的技能树</p>
		<h2 class="sk-title">从前端小白，到能定方案的人</h2>
		<p class="sk-sub">
			{TIERS.length} 层技术，从上到下逐层深入。同一层里的技术难度与占比相同，节点越亮表示掌握得越扎实。
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
		<button type="button" class:on={view === "tree"} onclick={() => (view = "tree")}>树状</button>
		<button type="button" class:on={view === "compact"} onclick={() => (view = "compact")}
			>紧凑</button
		>
	</div>

	<div class="sk-seg" role="group" aria-label="筛选">
		<button type="button" class:on={filter === "all"} onclick={() => (filter = "all")}>全部</button>
		<button type="button" class:on={filter === "done"} onclick={() => (filter = "done")}
			>已熟练</button
		>
		<button type="button" class:on={filter === "todo"} onclick={() => (filter = "todo")}
			>待攻克</button
		>
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

	{#each visibleTiers as row (row.tier.tier)}
		{@const st = tierStat(row.list)}
		<section class="sk-tier" style={`--ti:${row.tier.tier}`}>
			<span class="sk-tier-drop" aria-hidden="true"></span>

			<header class="sk-tier-head">
				<div class="sk-tier-line1">
					<span class="sk-tier-no">L{row.tier.tier}</span>
					<span class="sk-tier-stage">{row.tier.stage}</span>
					<span class="sk-tier-ratio">占 {(tierRatio(row.tier) * 100).toFixed(1)}%</span>
				</div>
				<p class="sk-tier-purpose">{row.tier.purpose}</p>
				<div class="sk-tier-meta">
					<div class="sk-tier-bar"><span style={`width:${st.pct}%`}></span></div>
					<span class="sk-tier-count">{st.lit}/{st.total} · {st.pct}%</span>
				</div>
			</header>

			<div class="sk-rail">
				{#each row.list as node, ni (node.id)}
					{@const lv = lvOf(node.id)}
					<div class="sk-slot" style={`--i:${ni}`}>
						<button
							type="button"
							class="sk-node"
							data-lv={lv}
							aria-label={`${node.name}，${row.tier.stage}层，当前 ${lv} 级 ${LEVELS[lv].name}`}
							onclick={() => (activeId = node.id)}
						>
							<span class="sk-node-name">{node.name}</span>
							<span class="sk-node-lv">L{lv}</span>
						</button>
					</div>
				{/each}
			</div>
		</section>
	{/each}
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
	每层占比 = 该层技能数 ÷ 总技能数，同层技术等权重。点节点可以看学习要点并调整自己的等级，改动存在浏览器本地；默认值改
	<code>src/data/skills.ts</code> 里的 <code>level</code> 字段。
</p>

{#if activeNode && activeTier}
	<div class="sk-drawer-mask" role="presentation" onclick={() => (activeId = null)}></div>
	<aside class="sk-drawer" role="dialog" aria-modal="true" aria-label={activeNode.name}>
		<header class="sk-drawer-head">
			<div>
				<p class="sk-drawer-branch">L{activeTier.tier} · {activeTier.stage} · {activeNode.track}</p>
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

		<p class="sk-drawer-weight">
			本层占比 {(tierRatio(activeTier) * 100).toFixed(1)}%，层内 {activeTier.nodes.length}
			个技术等权重，单个约 {activeWeight}%。
		</p>

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
		--step: 170ms;
		position: relative;
		margin-top: 1.75rem;
	}
	.sk-root {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.55rem;
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
	/* 树根下方的第一段主干 */
	.sk-root::after {
		content: "";
		width: 2px;
		height: 1.9rem;
		transform: scaleY(0);
		transform-origin: top;
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--primary) 55%, transparent),
			color-mix(in srgb, var(--primary) 10%, transparent)
		);
	}

	/* ===================== 层级 ===================== */
	.sk-tier {
		position: relative;
		padding-top: 1.9rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	/* 层头上方的树干 */
	.sk-tier-drop {
		position: absolute;
		top: 0;
		left: 50%;
		width: 2px;
		height: 1.9rem;
		transform: translateX(-50%) scaleY(0);
		transform-origin: top;
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--primary) 8%, transparent),
			color-mix(in srgb, var(--primary) 45%, transparent)
		);
	}

	.sk-tier-head {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		width: min(100%, 26rem);
		padding: 0.7rem 1rem 0.75rem;
		border-radius: 16px;
		border: 1px solid color-mix(in srgb, var(--primary) 26%, transparent);
		background: var(--card-bg);
		box-shadow: 0 4px 18px rgb(0 0 0 / 6%);
	}
	.sk-tier-line1 {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		flex-wrap: wrap;
	}
	.sk-tier-no {
		flex: none;
		padding: 0.06rem 0.42rem;
		border-radius: 6px;
		background: var(--primary);
		color: #fff;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.04em;
	}
	.sk-tier-stage {
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--deep-text);
	}
	.sk-tier-ratio {
		margin-left: auto;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--primary);
	}
	.sk-tier-purpose {
		margin: 0;
		font-size: 0.76rem;
		line-height: 1.6;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}
	.sk-tier-meta {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.sk-tier-bar {
		flex: 1 1 auto;
		height: 0.3rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--deep-text) 8%, transparent);
		overflow: hidden;
	}
	.sk-tier-bar span {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: var(--primary);
		transition: width 700ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.sk-tier-count {
		flex: none;
		font-size: 0.7rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--deep-text) 52%, transparent);
	}
	/* 层头下方的短干，连到本层横枝 */
	.sk-tier-head::after {
		content: "";
		position: absolute;
		left: 50%;
		bottom: -0.9rem;
		width: 2px;
		height: 0.9rem;
		transform: translateX(-50%) scaleY(0);
		transform-origin: top;
		background: color-mix(in srgb, var(--primary) 45%, transparent);
	}

	/* ===================== 横枝与节点 ===================== */
	.sk-rail {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
		gap: 0.85rem 0;
		width: 100%;
		padding-top: 0.9rem;
	}
	.sk-slot {
		position: relative;
		display: flex;
		justify-content: center;
		padding: 1.15rem 0.3rem 0;
	}
	/* 每行连续的横枝 */
	.sk-slot::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		transform: scaleX(0);
		transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
		background: linear-gradient(
			to right,
			color-mix(in srgb, var(--primary) 16%, transparent),
			color-mix(in srgb, var(--primary) 40%, transparent),
			color-mix(in srgb, var(--primary) 16%, transparent)
		);
	}
	/* 横枝垂到节点的短枝 */
	.sk-slot::after {
		content: "";
		position: absolute;
		top: 0;
		left: 50%;
		width: 2px;
		height: 1.15rem;
		transform: translateX(-50%) scaleY(0);
		transform-origin: top;
		transition: transform 300ms ease;
		background: color-mix(in srgb, var(--primary) 34%, transparent);
	}

	.sk-node {
		position: relative;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.44rem 0.6rem;
		border-radius: 12px;
		border: 1px solid var(--sk-border);
		background: var(--sk-bg);
		color: var(--sk-fg);
		font-size: 0.79rem;
		font-weight: 600;
		text-align: center;
		cursor: pointer;
		box-shadow: var(--sk-glow, none);
		transition:
			transform 180ms ease,
			box-shadow 220ms ease,
			border-color 220ms ease,
			background 220ms ease;
	}
	/* 节点与短枝的衔接点 */
	.sk-node::before {
		content: "";
		position: absolute;
		top: -0.27rem;
		left: 50%;
		width: 0.44rem;
		height: 0.44rem;
		border-radius: 999px;
		transform: translateX(-50%);
		background: var(--primary);
		box-shadow: 0 0 0 3px var(--card-bg);
		opacity: 0.5;
		transition: opacity 220ms ease;
	}
	.sk-node[data-lv="0"]::before {
		opacity: 0.22;
	}
	.sk-node:hover {
		transform: translateY(-2px);
		border-color: var(--primary);
	}
	.sk-node:hover::before {
		opacity: 1;
	}
	.sk-node-name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sk-node-lv {
		flex: none;
		font-size: 0.64rem;
		font-weight: 700;
		padding: 0.08rem 0.3rem;
		border-radius: 6px;
		background: color-mix(in srgb, var(--sk-fg) 14%, transparent);
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
	}

	@keyframes sk-breathe {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.78;
		}
	}

	/* ===================== 从高到低逐层点亮 ===================== */
	.sk-tier-head,
	.sk-node {
		opacity: 0;
	}
	.sk-tier-head {
		transform: translateY(-10px);
	}
	.sk-node {
		transform: translateY(-8px) scale(0.94);
	}

	.sk-tree.revealed .sk-root::after {
		transform: scaleY(1);
		transition: transform 320ms ease;
	}
	.sk-tree.revealed .sk-tier-drop {
		transform: translateX(-50%) scaleY(1);
		transition: transform 320ms ease;
		transition-delay: calc(var(--ti) * var(--step) - 90ms);
	}
	.sk-tree.revealed .sk-tier-head {
		opacity: 1;
		transform: none;
		transition:
			opacity 420ms ease,
			transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
		transition-delay: calc(var(--ti) * var(--step));
	}
	.sk-tree.revealed .sk-tier-head::after {
		transform: translateX(-50%) scaleY(1);
		transition: transform 260ms ease;
		transition-delay: calc(var(--ti) * var(--step) + 180ms);
	}
	.sk-tree.revealed .sk-slot::before {
		transform: scaleX(1);
		transition-delay: calc(var(--ti) * var(--step) + 200ms);
	}
	.sk-tree.revealed .sk-slot::after {
		transform: translateX(-50%) scaleY(1);
		transition-delay: calc(var(--ti) * var(--step) + 280ms + var(--i) * 45ms);
	}
	.sk-tree.revealed .sk-node {
		opacity: 1;
		transform: none;
		transition-delay: calc(var(--ti) * var(--step) + 320ms + var(--i) * 45ms);
	}

	@media (prefers-reduced-motion: reduce) {
		.sk-tier-head,
		.sk-node {
			opacity: 1;
			transform: none;
		}
		.sk-root::after,
		.sk-tier-drop,
		.sk-tier-head::after,
		.sk-slot::before,
		.sk-slot::after {
			transform: none;
		}
		.sk-tier-head,
		.sk-node,
		.sk-root::after,
		.sk-tier-drop,
		.sk-tier-head::after,
		.sk-slot::before,
		.sk-slot::after {
			transition: none;
			animation: none;
		}
		.sk-root-pulse {
			animation: none;
		}
	}

	/* ===================== 紧凑视图 ===================== */
	.sk-tree.is-compact .sk-rail {
		grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
		gap: 0.3rem;
		padding-top: 0;
	}
	.sk-tree.is-compact .sk-slot {
		padding: 0;
	}
	.sk-tree.is-compact .sk-slot::before,
	.sk-tree.is-compact .sk-slot::after,
	.sk-tree.is-compact .sk-node::before,
	.sk-tree.is-compact .sk-tier-head::after {
		display: none;
	}
	.sk-tree.is-compact .sk-node {
		padding: 0.26rem 0.5rem;
		font-size: 0.72rem;
		border-radius: 999px;
	}
	.sk-tree.is-compact .sk-tier {
		padding-top: 1rem;
	}
	.sk-tree.is-compact .sk-tier-drop {
		height: 1rem;
	}

	/* ===================== 图例 ===================== */
	.sk-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1rem;
		align-items: center;
		margin-top: 1.75rem;
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
		letter-spacing: 0.1em;
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

	.sk-drawer-weight {
		margin: 0.9rem 0 0;
		font-size: 0.74rem;
		line-height: 1.6;
		color: color-mix(in srgb, var(--deep-text) 50%, transparent);
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
			gap: 0.5rem;
		}
		.sk-metric {
			padding: 0.6rem 0.7rem;
		}
		.sk-metric strong {
			font-size: 1.05rem;
		}
		.sk-rail {
			grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
		}
		.sk-node {
			padding: 0.4rem 0.45rem;
			font-size: 0.74rem;
		}
		.sk-node-name {
			white-space: normal;
		}
		.sk-tier-head {
			width: 100%;
		}
		.sk-toolbar-right {
			margin-left: 0;
			width: 100%;
		}
	}
</style>
