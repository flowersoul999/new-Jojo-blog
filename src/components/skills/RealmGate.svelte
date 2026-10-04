<script lang="ts">
/**
 * 修仙结界：当前图的境界不够时，盖在技能图上方把它挡住。
 *
 * 境界够了（或访客点了放行）就什么都不渲染——组件平时是隐形的。
 * 结界不销毁底下的技能图，只是挡住交互：一旦破境，图原样就在那里。
 * 「我是路过的凡人」只对当前标签页放行（sessionStorage），刷新前有效。
 */
import {
	CULTIVATION_EVENT,
	type CultivationState,
	GRAPH_JOURNEY,
	type GraphId,
	journeyOf,
	letVisitorThrough,
	REALMS,
	snapshot,
} from "@/data/cultivation";

interface Props {
	/** 要把守的图 */
	graph: GraphId;
}

let { graph }: Props = $props();

const g = $derived(journeyOf(graph));
const needed = $derived(REALMS[g.realmIndex].name);

let st = $state<CultivationState>(snapshot());

$effect(() => {
	const refresh = () => {
		st = snapshot();
	};
	window.addEventListener(CULTIVATION_EVENT, refresh);
	window.addEventListener("storage", refresh);
	return () => {
		window.removeEventListener(CULTIVATION_EVENT, refresh);
		window.removeEventListener("storage", refresh);
	};
});

const pctText = $derived(Math.round(st.pct));
</script>

{#if !st.unlocked[graph]}
	<div class="realm-gate" role="dialog" aria-label="修仙结界">
		<div class="rg-card">
			<span class="rg-eyebrow">修仙结界</span>
			<p class="rg-title">此地灵气太盛，非「{needed}」不可妄入</p>
			<p class="rg-desc">
				「{g.name}」需修至 <b>{needed}</b> 方可修炼。你如今是
				<b>{st.realm.name}</b>，修为 {st.xp} / {st.totalXp}（{pctText}%）。
			</p>
			<p class="rg-hint">
				回 <a href={GRAPH_JOURNEY[0].href}>{GRAPH_JOURNEY[0].name}</a>
				打坐去吧——每勾一条学习清单都有修为进账，{needed}一到，此地自开。
			</p>
			<button type="button" class="rg-bypass" onclick={letVisitorThrough}>
				我是路过的凡人，只想看看图长什么样
			</button>
		</div>
	</div>
{/if}

<style>
	/* 与 CultivationPanel / SkillGraphSwitch 同一套暖纸+金配色 */
	.realm-gate {
		--rg-gold: #c9a44c;
		--rg-gold-dp: #8a6d24;
		--rg-ink: #4a4335;
		--rg-ink-2: #857d6c;
		--rg-panel: #fffdf7;
		position: fixed;
		inset: 0;
		z-index: 80;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: color-mix(in srgb, var(--rg-panel) 82%, transparent);
		backdrop-filter: blur(7px);
		-webkit-backdrop-filter: blur(7px);
		border-radius: 0;
	}

	:global(html.dark) .realm-gate {
		--rg-gold: #d9b45f;
		--rg-gold-dp: #a9862f;
		--rg-ink: #e9e1ce;
		--rg-ink-2: #a79d88;
		--rg-panel: #211b13;
	}

	.rg-card {
		max-width: 26rem;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		text-align: center;
		padding: 1.4rem 1.5rem;
		border-radius: 16px;
		border: 1px solid color-mix(in srgb, var(--rg-gold) 34%, transparent);
		background: color-mix(in srgb, var(--rg-panel) 88%, transparent);
		box-shadow: 0 12px 34px rgb(0 0 0 / 0.1);
	}

	.rg-eyebrow {
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.2em;
		color: color-mix(in srgb, var(--rg-gold-dp) 88%, transparent);
	}

	.rg-title {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--rg-ink);
	}

	.rg-desc,
	.rg-hint {
		margin: 0;
		font-size: 0.76rem;
		line-height: 1.7;
		color: var(--rg-ink-2);
		font-variant-numeric: tabular-nums;
	}

	.rg-desc b {
		color: var(--rg-ink);
		font-weight: 800;
	}

	.rg-hint a {
		color: color-mix(in srgb, var(--rg-gold-dp) 92%, transparent);
		font-weight: 700;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.rg-bypass {
		margin-top: 0.3rem;
		align-self: center;
		padding: 0.42rem 0.9rem;
		font-size: 0.68rem;
		border-radius: 99px;
		border: 1px dashed color-mix(in srgb, var(--rg-gold) 46%, transparent);
		background: transparent;
		color: var(--rg-ink-2);
		cursor: pointer;
		transition:
			color 180ms ease,
			border-color 180ms ease,
			background 180ms ease;
	}

	.rg-bypass:hover {
		color: var(--rg-ink);
		border-color: color-mix(in srgb, var(--rg-gold) 70%, transparent);
		background: color-mix(in srgb, var(--rg-gold) 10%, transparent);
	}
</style>
