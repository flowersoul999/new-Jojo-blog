<script lang="ts">
/**
 * 技能树主组件 —— 圣诞树形态
 *
 * 形态：顶部一颗星（起点），向下 9 层枝条，每层的圆球就是一个技能挂件。
 * 层越深、枝条越长、球越多，整棵树呈上窄下宽的三角形轮廓。
 *
 * 亮度：圆球亮度 = 掌握度。Lv0 暗球 → Lv5 实心主题色 + 呼吸光晕。
 * 所有颜色都由 --primary 与 --card-bg 混出，自动跟随站点主题色与明暗模式。
 *
 * 点亮：进入视口后从顶层开始逐层亮起，层延迟 --ti * 150ms，层内再按 --i 依次亮。
 *
 * 数据与层级见 src/data/skills.ts
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
let stageEl = $state<HTMLElement | undefined>(undefined);
let dirty = $state(false);

onMount(() => {
	const overrides = loadOverrides();
	if (Object.keys(overrides).length > 0) {
		levels = { ...DEFAULT_LEVELS, ...overrides };
		dirty = true;
	}
	// 窄屏默认用清单视图，树形留给宽屏
	if (
		typeof window !== "undefined" &&
		window.matchMedia("(max-width: 760px)").matches
	) {
		view = "compact";
	}
});

/** 进入视口后从顶层开始逐层点亮 */
$effect(() => {
	const el = stageEl;
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

function matched(id: string): boolean {
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
		pct: nodes.length
			? Math.round((sum / (nodes.length * MAX_LEVEL)) * 100)
			: 0,
		lit,
		total: nodes.length,
	};
}

/** 树形视图下过滤是「变暗」而不是「移除」，避免破坏树的轮廓 */
const visibleTiers = $derived.by(() =>
	TIERS.map((t) => ({
		tier: t,
		list: view === "tree" ? t.nodes : t.nodes.filter((n) => matched(n.id)),
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

function pad(n: number): string {
	return String(n).padStart(2, "0");
}
</script>

<div class="sk-hero">
	<div class="sk-hero-main">
		<p class="sk-eyebrow">我的技能树</p>
		<h2 class="sk-title">从前端小白，到能定方案的人</h2>
		<p class="sk-sub">
			{TIERS.length} 层技术，像圣诞树一样从上往下长。同一层的技术难度与占比相同，圆球越亮表示掌握得越扎实。
		</p>
	</div>

	<div class="sk-ring-wrap">
		<svg class="sk-ring" viewBox="0 0 120 120" role="img" aria-label="总掌握度 {stats.pct}%">
			<circle class="sk-ring-bg" cx="60" cy="60" r="52"></circle>
			<circle
				class="sk-ring-fg"
				cx="60"
				cy="60"
				r="52"
				stroke-dasharray="{RING}"
				stroke-dashoffset="{RING * (1 - stats.pct / 100)}"
			></circle>
		</svg>
		<div class="sk-ring-text">
			<strong>{stats.pct}%</strong>
			<span>总掌握度</span>
		</div>
	</div>
</div>

<div class="sk-metrics">
	<div class="sk-metric">
		<span class="sk-metric-num">{stats.lit}<em>/{TOTAL_NODES}</em></span>
		<span class="sk-metric-label">已点亮</span>
	</div>
	<div class="sk-metric">
		<span class="sk-metric-num">{stats.solid}<em>/{TOTAL_NODES}</em></span>
		<span class="sk-metric-label">熟练以上</span>
	</div>
	<div class="sk-metric">
		<span class="sk-metric-num">{TIERS.length}<em> 层</em></span>
		<span class="sk-metric-label">技术梯度</span>
	</div>
	<div class="sk-legend" aria-label="亮度图例">
		{#each LEVELS as def (def.level)}
			<span class="sk-legend-item">
				<i class="sk-legend-ball" data-lv="{def.level}"></i>
				<span>Lv{def.level} {def.name}</span>
			</span>
		{/each}
	</div>
</div>

<div class="sk-toolbar">
	<div class="sk-seg" role="group" aria-label="筛选">
		<button type="button" class:on={filter === "all"} onclick={() => (filter = "all")}>
			全部
		</button>
		<button type="button" class:on={filter === "done"} onclick={() => (filter = "done")}>
			已熟练
		</button>
		<button type="button" class:on={filter === "todo"} onclick={() => (filter = "todo")}>
			待攻克
		</button>
	</div>

	<div class="sk-toolbar-right">
		<div class="sk-seg" role="group" aria-label="视图">
			<button type="button" class:on={view === "tree"} onclick={() => (view = "tree")}>
				树形
			</button>
			<button type="button" class:on={view === "compact"} onclick={() => (view = "compact")}>
				清单
			</button>
		</div>
		<button type="button" class="sk-act" onclick={resetToPreset} disabled={!dirty}>
			恢复预设
		</button>
		<button type="button" class="sk-act" onclick={clearAll}>全部清零</button>
	</div>
</div>

{#if view === "tree"}
	<div class="sk-stage" bind:this={stageEl}>
		<div class="sk-tree" class:revealed>
			<div class="sk-apex">
				<svg class="sk-star" viewBox="0 0 24 24" aria-hidden="true">
					<path
						d="M12 1.6l3.1 6.6 7 .9-5.1 4.9 1.3 7L12 17.7 5.7 21l1.3-7L1.9 9.1l7-.9z"
					></path>
				</svg>
				<div class="sk-apex-text">
					<strong>{ROOT.name}</strong>
					<span>{ROOT.note}</span>
				</div>
			</div>

			<div class="sk-rows">
				<span class="sk-spine" aria-hidden="true"></span>

				{#each visibleTiers as row, ti (row.tier.tier)}
					{@const st = tierStat(row.tier.nodes)}
					<div class="sk-tier" style="--ti:{ti}">
						<div class="sk-tag">
							<span class="sk-tag-idx">{pad(row.tier.tier + 1)}</span>
							<span class="sk-tag-name">{row.tier.stage}</span>
							<span class="sk-tag-pct">{st.pct}%</span>
						</div>

						<div class="sk-branch">
							<div class="sk-row">
								{#each row.list as node, ni (node.id)}
									{@const lv = lvOf(node.id)}
									<button
										type="button"
										class="sk-orn"
										class:is-dim={filter !== "all" && !matched(node.id)}
										style="--i:{ni}"
										data-lv="{lv}"
										title="{node.name} · Lv{lv} {LEVELS[lv].name}"
										aria-label="{node.name}，Lv{lv} {LEVELS[lv].name}，点击查看详情"
										onclick={() => (activeId = node.id)}
									>
										<span class="sk-ball" data-lv="{lv}"><span class="sk-core"></span></span>
										<span class="sk-cap">{node.short}</span>
									</button>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<span class="sk-ground" aria-hidden="true"></span>
		</div>

		<p class="sk-hint">点亮一颗球只需点开它——掌握度越高，球越亮。</p>
	</div>
{:else}
	<div class="sk-list">
		{#each visibleTiers as row (row.tier.tier)}
			{@const st = tierStat(row.tier.nodes)}
			<section class="sk-card">
				<header class="sk-card-head">
					<span class="sk-card-idx">{pad(row.tier.tier + 1)}</span>
					<div class="sk-card-title">
						<strong>{row.tier.stage}</strong>
						<span>{row.tier.purpose}</span>
					</div>
					<div class="sk-card-stat">
						<b>{st.pct}%</b>
						<span>{st.lit}/{st.total}</span>
					</div>
				</header>
				<div class="sk-bar"><i style="width:{st.pct}%"></i></div>
				<div class="sk-chips">
					{#each row.list as node (node.id)}
						{@const lv = lvOf(node.id)}
						<button
							type="button"
							class="sk-chip"
							onclick={() => (activeId = node.id)}
						>
							<span class="sk-ball" data-lv="{lv}"><span class="sk-core"></span></span>
							<span class="sk-chip-name">{node.name}</span>
							<span class="sk-chip-lv">Lv{lv}</span>
						</button>
					{/each}
				</div>
			</section>
		{/each}
	</div>
{/if}

{#if activeNode && activeTier}
	<button
		type="button"
		class="sk-scrim"
		aria-label="关闭详情"
		onclick={() => (activeId = null)}
	></button>
	<aside class="sk-drawer" aria-label="{activeNode.name} 详情">
		<header class="sk-drawer-head">
			<div>
				<span class="sk-drawer-track">{activeNode.track}</span>
				<h3 class="sk-drawer-title">{activeNode.name}</h3>
			</div>
			<button type="button" class="sk-close" aria-label="关闭" onclick={() => (activeId = null)}>
				✕
			</button>
		</header>

		<div class="sk-drawer-meta">
			<span>第 {pad(activeTier.tier + 1)} 层 · {activeTier.stage}</span>
			<span class="sk-dot">·</span>
			<span>本层占比 {activeWeight}%</span>
		</div>

		<p class="sk-drawer-note">{activeNode.note}</p>

		<div class="sk-drawer-level">
			<div class="sk-drawer-level-top">
				<span class="sk-drawer-badge">Lv{activeLv} {activeLevelDef.name}</span>
				<span class="sk-drawer-level-pct">{Math.round((activeLv / MAX_LEVEL) * 100)}%</span>
			</div>
			<p class="sk-drawer-level-desc">{activeLevelDef.desc}</p>
			<p class="sk-drawer-level-judge">判定：{activeLevelDef.judge}</p>
			<div class="sk-steps" role="group" aria-label="设置掌握度">
				{#each LEVELS as def (def.level)}
					<button
						type="button"
						class:on={activeLv === def.level}
						title="Lv{def.level} {def.name}"
						onclick={() => activeNode && setLevel(activeNode.id, def.level)}
					>
						{def.level}
					</button>
				{/each}
			</div>
		</div>

		{#if activeNode.tips?.length}
			<div class="sk-drawer-tips">
				<h4>学习要点</h4>
				<ul>
					{#each activeNode.tips as tip (tip)}
						<li>{tip}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</aside>
{/if}

<style>
	/* ===================== 概览区 ===================== */
	.sk-hero {
		display: flex;
		gap: 1.4rem;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
	}
	.sk-hero-main {
		min-width: 0;
		flex: 1 1 16rem;
	}
	.sk-eyebrow {
		margin: 0 0 0.25rem;
		font-size: 0.74rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--primary) 80%, transparent);
	}
	.sk-title {
		margin: 0;
		font-size: 1.5rem;
		line-height: 1.35;
		font-weight: 700;
		color: var(--text-color);
	}
	.sk-sub {
		margin: 0.5rem 0 0;
		font-size: 0.83rem;
		line-height: 1.75;
		color: color-mix(in srgb, var(--deep-text) 62%, transparent);
	}

	.sk-ring-wrap {
		position: relative;
		width: 7.4rem;
		height: 7.4rem;
		flex: none;
	}
	.sk-ring {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}
	.sk-ring-bg {
		fill: none;
		stroke: color-mix(in srgb, var(--deep-text) 10%, transparent);
		stroke-width: 8;
	}
	.sk-ring-fg {
		fill: none;
		stroke: var(--primary);
		stroke-width: 8;
		stroke-linecap: round;
		transition: stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1);
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
		font-size: 1.28rem;
		font-weight: 800;
		color: var(--primary);
		line-height: 1;
	}
	.sk-ring-text span {
		font-size: 0.62rem;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}

	.sk-metrics {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 1.6rem;
		margin-top: 1.15rem;
		padding: 0.85rem 0.95rem;
		border-radius: 0.85rem;
		background: color-mix(in srgb, var(--deep-text) 4%, transparent);
	}
	.sk-metric {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.sk-metric-num {
		font-size: 1rem;
		font-weight: 800;
		color: var(--text-color);
		line-height: 1.2;
	}
	.sk-metric-num em {
		font-style: normal;
		font-size: 0.7rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--deep-text) 50%, transparent);
	}
	.sk-metric-label {
		font-size: 0.66rem;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}
	.sk-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 0.75rem;
		margin-left: auto;
	}
	.sk-legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.64rem;
		color: color-mix(in srgb, var(--deep-text) 60%, transparent);
	}
	.sk-legend-ball {
		width: 0.72rem;
		height: 0.72rem;
		border-radius: 50%;
		display: inline-block;
	}

	/* ===================== 工具条 ===================== */
	.sk-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		align-items: center;
		justify-content: space-between;
		margin: 1.15rem 0 1.5rem;
	}
	.sk-toolbar-right {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		align-items: center;
	}
	.sk-seg {
		display: inline-flex;
		padding: 0.16rem;
		border-radius: 0.65rem;
		background: color-mix(in srgb, var(--deep-text) 6%, transparent);
		gap: 0.16rem;
	}
	.sk-seg button {
		border: 0;
		background: transparent;
		border-radius: 0.5rem;
		padding: 0.3rem 0.7rem;
		font-size: 0.75rem;
		color: color-mix(in srgb, var(--deep-text) 62%, transparent);
		cursor: pointer;
		transition: all 180ms ease;
	}
	.sk-seg button:hover {
		color: var(--text-color);
	}
	.sk-seg button.on {
		background: var(--card-bg);
		color: var(--primary);
		font-weight: 700;
		box-shadow: 0 1px 6px color-mix(in srgb, var(--primary) 22%, transparent);
	}
	.sk-act {
		border: 1px solid color-mix(in srgb, var(--deep-text) 14%, transparent);
		background: transparent;
		border-radius: 0.6rem;
		padding: 0.34rem 0.8rem;
		font-size: 0.74rem;
		color: color-mix(in srgb, var(--deep-text) 68%, transparent);
		cursor: pointer;
		transition: all 180ms ease;
	}
	.sk-act:hover:not(:disabled) {
		border-color: var(--primary);
		color: var(--primary);
	}
	.sk-act:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* ===================== 树形视图 ===================== */
	.sk-stage {
		position: relative;
		container-type: inline-size;
	}
	/* 适当吃掉卡片内边距，让最宽的枝条舒展一点 */
	@media (min-width: 768px) {
		.sk-stage {
			margin-inline: -1.5rem;
		}
	}

	.sk-tree {
		--col: clamp(30px, 4.3vw, 56px);
		--d: max(16px, calc(var(--col) - 7px));
		position: relative;
		width: 100%;
	}
	/* 容器查询可用时，列宽按实际可用宽度均分给最宽的 14 个节点
	   （层标签已挪到每行上方，不再占用横向空间，所以只留 16px 余量） */
	@supports (width: 1cqw) {
		.sk-tree {
			--col: clamp(20px, calc((100cqw - 16px) / 14), 56px);
		}
	}

	/* 树尖的星 */
	.sk-apex {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 1.1rem;
	}
	.sk-star {
		width: 2.1rem;
		height: 2.1rem;
		fill: var(--primary);
		filter: drop-shadow(0 0 10px color-mix(in srgb, var(--primary) 60%, transparent));
		opacity: 0;
		transform: scale(0.5) rotate(-40deg);
	}
	.sk-tree.revealed .sk-star {
		opacity: 1;
		transform: none;
		transition:
			opacity 520ms ease,
			transform 720ms cubic-bezier(0.22, 1, 0.36, 1);
		animation: sk-twinkle 3.6s ease-in-out 900ms infinite;
	}
	.sk-apex-text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		text-align: center;
	}
	.sk-apex-text strong {
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--primary);
		letter-spacing: 0.02em;
	}
	.sk-apex-text span {
		font-size: 0.68rem;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}

	/* 各层所在的区域：中央主干就撑在这个容器里 */
	.sk-rows {
		position: relative;
	}
	.sk-spine {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 2px;
		transform: translateX(-50%) scaleY(0);
		transform-origin: top;
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--primary) 55%, transparent),
			color-mix(in srgb, var(--primary) 22%, transparent)
		);
	}
	.sk-tree.revealed .sk-spine {
		transform: translateX(-50%) scaleY(1);
		transition: transform 1400ms cubic-bezier(0.3, 0.9, 0.3, 1) 120ms;
	}

	/* 一层 = 一条横枝 */
	.sk-tier {
		position: relative;
		padding-bottom: 0.6rem;
	}

	/* 层标签：居中压在主干上，用卡片底色遮住背后的线，像串在枝上的标签 */
	.sk-tag {
		position: relative;
		z-index: 2;
		display: flex;
		width: fit-content;
		margin: 0 auto 0.4rem;
		align-items: center;
		gap: 0.34rem;
		padding: 0.14rem 0.6rem 0.14rem 0.18rem;
		border-radius: 99px;
		background: var(--card-bg);
		border: 1px solid color-mix(in srgb, var(--deep-text) 11%, transparent);
		opacity: 0;
		transform: translateY(-6px);
	}
	.sk-tag-idx {
		display: grid;
		place-items: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: color-mix(in srgb, var(--primary) 16%, transparent);
		color: var(--primary);
		font-size: 0.6rem;
		font-weight: 800;
	}
	.sk-tag-name {
		font-size: 0.72rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--deep-text) 78%, transparent);
	}
	.sk-tag-pct {
		font-size: 0.64rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--primary) 75%, transparent);
	}

	/* 枝条与圆球排布 */
	.sk-branch {
		display: flex;
		justify-content: center;
	}
	.sk-row {
		position: relative;
		display: flex;
		flex: none;
		justify-content: center;
		align-items: flex-start;
	}
	/* 横枝：穿过球心的一条线，末端渐隐 */
	.sk-row::before {
		content: "";
		position: absolute;
		left: -2%;
		right: -2%;
		top: calc(var(--d) / 2);
		height: 2px;
		border-radius: 2px;
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in srgb, var(--primary) 48%, transparent) 11%,
			color-mix(in srgb, var(--primary) 48%, transparent) 89%,
			transparent
		);
		opacity: 0;
		transform: scaleX(0.15);
	}

	/* 圆球挂件 */
	.sk-orn {
		position: relative;
		z-index: 1;
		flex: none;
		width: var(--col);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		padding: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
		opacity: 0;
		transform: translateY(-7px) scale(0.6);
		transition:
			opacity 380ms ease,
			transform 460ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.sk-orn:hover .sk-ball {
		transform: scale(1.14);
	}
	.sk-orn:focus-visible .sk-ball {
		outline: 2px solid var(--primary);
		outline-offset: 3px;
	}
	.sk-orn.is-dim {
		filter: grayscale(0.85) opacity(0.28);
	}

	.sk-ball {
		position: relative;
		display: grid;
		place-items: center;
		width: var(--d);
		height: var(--d);
		border-radius: 50%;
		background-color: var(--sk-bg);
		border: 1.5px solid var(--sk-border);
		box-shadow: var(--sk-glow, none);
		transition:
			transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 240ms ease,
			background-color 240ms ease,
			border-color 240ms ease;
	}
	/* 玻璃球高光 */
	.sk-ball .sk-core {
		position: absolute;
		left: 22%;
		top: 17%;
		width: 27%;
		height: 27%;
		border-radius: 50%;
		background: color-mix(in srgb, #fff 82%, transparent);
		opacity: var(--sk-core, 0);
	}

	/* 树里只显示短名：列宽只有 40 多像素，全名会断得很难看 */
	.sk-cap {
		max-width: calc(var(--col) + 9px);
		font-size: 0.58rem;
		line-height: 1.25;
		text-align: center;
		color: color-mix(in srgb, var(--deep-text) 66%, transparent);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		overflow-wrap: break-word;
	}

	.sk-ground {
		display: block;
		height: 2px;
		margin: 0.35rem 12% 0;
		border-radius: 2px;
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in srgb, var(--primary) 26%, transparent) 50%,
			transparent
		);
	}

	.sk-hint {
		margin: 0.9rem 0 0;
		text-align: center;
		font-size: 0.72rem;
		color: color-mix(in srgb, var(--deep-text) 48%, transparent);
	}

	/* ===================== 六档亮度 ===================== */
	.sk-ball,
	.sk-legend-ball {
		--sk-bg: color-mix(in oklab, var(--deep-text) 8%, var(--card-bg));
		--sk-border: color-mix(in srgb, var(--deep-text) 24%, transparent);
		--sk-core: 0;
		--sk-glow: none;
	}
	[data-lv="0"] {
		--sk-bg: color-mix(in oklab, var(--deep-text) 8%, var(--card-bg));
		--sk-border: color-mix(in srgb, var(--deep-text) 30%, transparent);
		--sk-core: 0;
	}
	[data-lv="1"] {
		--sk-bg: color-mix(in oklab, var(--primary) 20%, var(--card-bg));
		--sk-border: color-mix(in srgb, var(--primary) 38%, transparent);
		--sk-core: 0.16;
	}
	[data-lv="2"] {
		--sk-bg: color-mix(in oklab, var(--primary) 38%, var(--card-bg));
		--sk-border: color-mix(in srgb, var(--primary) 56%, transparent);
		--sk-core: 0.3;
	}
	[data-lv="3"] {
		--sk-bg: color-mix(in oklab, var(--primary) 58%, var(--card-bg));
		--sk-border: color-mix(in srgb, var(--primary) 76%, transparent);
		--sk-core: 0.46;
		--sk-glow: 0 2px 10px color-mix(in srgb, var(--primary) 18%, transparent);
	}
	[data-lv="4"] {
		--sk-bg: color-mix(in oklab, var(--primary) 82%, var(--card-bg));
		--sk-border: var(--primary);
		--sk-core: 0.66;
		--sk-glow: 0 4px 16px color-mix(in srgb, var(--primary) 36%, transparent);
	}
	[data-lv="5"] {
		--sk-bg: var(--primary);
		--sk-border: oklch(0.45 0.13 var(--hue));
		--sk-core: 0.88;
		--sk-glow:
			0 0 0 3px color-mix(in srgb, var(--primary) 22%, transparent),
			0 6px 22px color-mix(in srgb, var(--primary) 50%, transparent);
	}
	.sk-orn[data-lv="5"] .sk-ball {
		animation: sk-breathe 2.8s ease-in-out infinite;
	}

	@keyframes sk-breathe {
		0%,
		100% {
			box-shadow:
				0 0 0 3px color-mix(in srgb, var(--primary) 22%, transparent),
				0 6px 22px color-mix(in srgb, var(--primary) 46%, transparent);
		}
		50% {
			box-shadow:
				0 0 0 6px color-mix(in srgb, var(--primary) 12%, transparent),
				0 6px 30px color-mix(in srgb, var(--primary) 62%, transparent);
		}
	}
	@keyframes sk-twinkle {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.82;
			transform: scale(1.07);
		}
	}

	/* ===================== 从高到低逐层点亮 ===================== */
	.sk-tree.revealed .sk-tag {
		opacity: 1;
		transform: none;
		transition:
			opacity 360ms ease,
			transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
		transition-delay: calc(var(--ti) * 150ms);
	}
	.sk-tree.revealed .sk-row::before {
		opacity: 1;
		transform: scaleX(1);
		transition:
			opacity 420ms ease,
			transform 560ms cubic-bezier(0.22, 1, 0.36, 1);
		transition-delay: calc(var(--ti) * 150ms + 40ms);
	}
	.sk-tree.revealed .sk-orn {
		opacity: 1;
		transform: none;
		transition-delay: calc(var(--ti) * 150ms + var(--i) * 46ms + 90ms);
	}

	@media (prefers-reduced-motion: reduce) {
		.sk-orn,
		.sk-star,
		.sk-tag,
		.sk-row::before,
		.sk-spine {
			opacity: 1 !important;
			animation: none !important;
			transition: none !important;
		}
		.sk-orn,
		.sk-star,
		.sk-tag {
			transform: none !important;
		}
		.sk-row::before {
			transform: scaleX(1) !important;
		}
		.sk-spine {
			transform: translateX(-50%) !important;
		}
	}

	/* ===================== 清单视图 ===================== */
	.sk-list {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.sk-card {
		border: 1px solid color-mix(in srgb, var(--deep-text) 10%, transparent);
		border-radius: 0.9rem;
		padding: 0.85rem 0.95rem 1rem;
		background: color-mix(in srgb, var(--deep-text) 3%, transparent);
	}
	.sk-card-head {
		display: flex;
		align-items: center;
		gap: 0.7rem;
	}
	.sk-card-idx {
		display: grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 50%;
		background: color-mix(in srgb, var(--primary) 16%, transparent);
		color: var(--primary);
		font-size: 0.68rem;
		font-weight: 800;
		flex: none;
	}
	.sk-card-title {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.sk-card-title strong {
		font-size: 0.9rem;
		color: var(--text-color);
	}
	.sk-card-title span {
		font-size: 0.72rem;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}
	.sk-card-stat {
		margin-left: auto;
		text-align: right;
		flex: none;
	}
	.sk-card-stat b {
		display: block;
		font-size: 0.95rem;
		color: var(--primary);
	}
	.sk-card-stat span {
		font-size: 0.68rem;
		color: color-mix(in srgb, var(--deep-text) 52%, transparent);
	}
	.sk-bar {
		height: 4px;
		margin: 0.6rem 0 0.8rem;
		border-radius: 4px;
		background: color-mix(in srgb, var(--deep-text) 9%, transparent);
		overflow: hidden;
	}
	.sk-bar i {
		display: block;
		height: 100%;
		border-radius: 4px;
		background: var(--primary);
		transition: width 420ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.sk-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.sk-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.26rem 0.6rem 0.26rem 0.3rem;
		border-radius: 99px;
		border: 1px solid color-mix(in srgb, var(--deep-text) 12%, transparent);
		background: var(--card-bg);
		cursor: pointer;
		transition: all 180ms ease;
	}
	.sk-chip:hover {
		border-color: var(--primary);
		transform: translateY(-1px);
	}
	.sk-chip .sk-ball {
		width: 1rem;
		height: 1rem;
		flex: none;
	}
	.sk-chip-name {
		font-size: 0.76rem;
		color: var(--text-color);
	}
	.sk-chip-lv {
		font-size: 0.62rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--primary) 78%, transparent);
	}

	/* ===================== 详情抽屉 ===================== */
	.sk-scrim {
		position: fixed;
		inset: 0;
		z-index: 60;
		border: 0;
		padding: 0;
		background: color-mix(in srgb, #000 32%, transparent);
		cursor: pointer;
		animation: sk-fade 220ms ease;
	}
	.sk-drawer {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 61;
		width: min(23rem, 92vw);
		height: 100%;
		overflow-y: auto;
		padding: 1.25rem 1.35rem 2rem;
		background: var(--card-bg);
		border-left: 1px solid color-mix(in srgb, var(--deep-text) 12%, transparent);
		box-shadow: -12px 0 40px color-mix(in srgb, #000 18%, transparent);
		animation: sk-slide 280ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	@keyframes sk-fade {
		from {
			opacity: 0;
		}
	}
	@keyframes sk-slide {
		from {
			transform: translateX(24px);
			opacity: 0;
		}
	}
	.sk-drawer-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.8rem;
	}
	.sk-drawer-track {
		display: inline-block;
		font-size: 0.64rem;
		font-weight: 700;
		padding: 0.1rem 0.42rem;
		border-radius: 0.4rem;
		background: color-mix(in srgb, var(--primary) 14%, transparent);
		color: var(--primary);
	}
	.sk-drawer-title {
		margin: 0.45rem 0 0;
		font-size: 1.15rem;
		color: var(--text-color);
	}
	.sk-close {
		border: 1px solid color-mix(in srgb, var(--deep-text) 14%, transparent);
		background: transparent;
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 50%;
		color: color-mix(in srgb, var(--deep-text) 60%, transparent);
		cursor: pointer;
		flex: none;
	}
	.sk-close:hover {
		border-color: var(--primary);
		color: var(--primary);
	}
	.sk-drawer-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.6rem;
		font-size: 0.7rem;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}
	.sk-dot {
		opacity: 0.6;
	}
	.sk-drawer-note {
		margin: 0.85rem 0 0;
		padding: 0.7rem 0.8rem;
		border-radius: 0.7rem;
		background: color-mix(in srgb, var(--primary) 7%, transparent);
		font-size: 0.8rem;
		line-height: 1.75;
		color: color-mix(in srgb, var(--deep-text) 78%, transparent);
	}
	.sk-drawer-level {
		margin-top: 1.1rem;
	}
	.sk-drawer-level-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.sk-drawer-badge {
		font-size: 0.74rem;
		font-weight: 800;
		padding: 0.18rem 0.5rem;
		border-radius: 0.5rem;
		background: color-mix(in srgb, var(--primary) 14%, transparent);
		color: var(--primary);
	}
	.sk-drawer-level-pct {
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--primary);
	}
	.sk-drawer-level-desc {
		margin: 0.6rem 0 0.25rem;
		font-size: 0.8rem;
		line-height: 1.7;
		color: var(--text-color);
	}
	.sk-drawer-level-judge {
		margin: 0;
		font-size: 0.72rem;
		line-height: 1.65;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}
	.sk-steps {
		display: flex;
		gap: 0.3rem;
		margin-top: 0.85rem;
	}
	.sk-steps button {
		flex: 1;
		height: 2rem;
		border-radius: 0.55rem;
		border: 1px solid color-mix(in srgb, var(--deep-text) 14%, transparent);
		background: transparent;
		font-size: 0.78rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--deep-text) 62%, transparent);
		cursor: pointer;
		transition: all 180ms ease;
	}
	.sk-steps button:hover {
		border-color: var(--primary);
		color: var(--primary);
	}
	.sk-steps button.on {
		background: var(--primary);
		border-color: var(--primary);
		color: var(--card-bg);
	}
	.sk-drawer-tips {
		margin-top: 1.3rem;
	}
	.sk-drawer-tips h4 {
		margin: 0 0 0.5rem;
		font-size: 0.78rem;
		color: color-mix(in srgb, var(--deep-text) 70%, transparent);
	}
	.sk-drawer-tips ul {
		margin: 0;
		padding-left: 1.05rem;
		display: flex;
		flex-direction: column;
		gap: 0.32rem;
	}
	.sk-drawer-tips li {
		font-size: 0.78rem;
		line-height: 1.7;
		color: color-mix(in srgb, var(--deep-text) 72%, transparent);
	}

	/* ===================== 响应式 ===================== */
	@media (max-width: 760px) {
		.sk-title {
			font-size: 1.24rem;
		}
		.sk-ring-wrap {
			width: 6rem;
			height: 6rem;
		}
		.sk-legend {
			margin-left: 0;
			width: 100%;
		}
		.sk-tag {
			gap: 0.25rem;
			padding: 0.1rem 0.45rem 0.1rem 0.14rem;
			margin-bottom: 0.3rem;
		}
		.sk-tier {
			padding-bottom: 0.7rem;
		}
		.sk-tree {
			--col: clamp(20px, 5.4vw, 40px);
		}
		@supports (width: 1cqw) {
			.sk-tree {
				--col: clamp(17px, calc((100cqw - 10px) / 14), 40px);
			}
		}
		/* 窄屏列太窄，名称放不下，靠点开详情看 */
		.sk-cap {
			display: none;
		}
	}
</style>
