<script lang="ts">
/**
 * 修仙境界面板：四张技能图页面顶部各放一块。
 *
 * 显示当前境界（凡人修仙传九境）、修为进度条、距下一境界还差多少，
 * 以及「修行路引」——四张图按解锁顺序排开，没到境界的图是暗的。
 *
 * 数据来源见 src/data/cultivation.ts：和技能图共用同一批 localStorage 键，
 * SkillTree 勾选时会广播 aemeath-cultivation-changed 事件，这里监听它实时刷新；
 * SSR / 无存档时按各图出厂预设算（与技能图首屏一致，不会闪一个错的状态）。
 */
import {
	CULTIVATION_EVENT,
	type CultivationState,
	GRAPH_JOURNEY,
	type GraphId,
	snapshot,
} from "@/data/cultivation";

interface Props {
	/** 当前所在的图，用来在路引里点亮「此地」 */
	here: GraphId;
}

let { here }: Props = $props();

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

const barPct = $derived(
	Math.min(100, Math.max(0, Math.round(st.pct * 10) / 10)),
);
</script>

<section class="xp-panel" aria-label="修仙境界">
	<div class="xp-head">
		<span class="xp-eyebrow">修仙境界</span>
		<span class="xp-realm">{st.realm.name}</span>
		<p class="xp-note">{st.realm.note}</p>
	</div>

	<div class="xp-meter">
		<div
			class="xp-bar"
			role="progressbar"
			aria-label="修为进度"
			aria-valuemin={0}
			aria-valuemax={st.totalXp}
			aria-valuenow={st.xp}
		>
			<i style={`width:${barPct}%`}></i>
		</div>
		<p class="xp-nums">
			修为 <b>{st.xp}</b><span class="xp-dim"> / {st.totalXp}</span>
			{#if st.next}
				<span class="xp-dim">· 距</span>「{st.next.name}」<span class="xp-dim"
					>还差</span
				> <b>{st.toNextXp}</b>
			{:else}
				<span class="xp-dim">· 渡劫功成，修行圆满</span>
			{/if}
		</p>
		<p class="xp-rule">
			每勾一条学习清单，按方向重要度得 1~5 点修为——技能越难、方向越核心，涨得越快。
		</p>
	</div>

	<ul class="xp-journey" aria-label="修行路引">
		{#each GRAPH_JOURNEY as g (g.id)}
			<li>
				<a
					class={"xp-stop" + (g.id === here ? " is-here" : "") + (!st.unlocked[g.id] ? " is-locked" : "")}
					href={g.href}
					aria-current={g.id === here ? "page" : undefined}
				>
					<span class="xp-stop-name">{g.name}</span>
					<span class="xp-stop-gate">{g.gateLabel}</span>
				</a>
			</li>
		{/each}
	</ul>
</section>

<style>
	/* 配色与 SkillGraphSwitch / SkillTree 同源（暖纸 + 金）。改色时几处一起改。 */
	.xp-panel {
		--xp-gold: #c9a44c;
		--xp-gold-dp: #8a6d24;
		--xp-ink: #4a4335;
		--xp-ink-2: #857d6c;
		--xp-panel: #fffdf7;
		--xp-line: rgba(150, 128, 76, 0.22);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem 1.4rem;
		margin-bottom: 1rem;
		padding: 0.85rem 1rem;
		border-radius: 16px;
		border: 1px solid var(--xp-line);
		background: var(--xp-panel);
	}

	:global(html.dark) .xp-panel {
		--xp-gold: #d9b45f;
		--xp-gold-dp: #a9862f;
		--xp-ink: #e9e1ce;
		--xp-ink-2: #a79d88;
		--xp-panel: #211b13;
		--xp-line: rgba(214, 178, 96, 0.16);
	}

	.xp-head {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 11rem;
	}

	.xp-eyebrow {
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		color: color-mix(in srgb, var(--xp-gold-dp) 88%, transparent);
	}

	.xp-realm {
		font-size: 1.25rem;
		font-weight: 800;
		line-height: 1.2;
		color: var(--xp-ink);
	}

	.xp-note {
		margin: 0;
		font-size: 0.68rem;
		line-height: 1.5;
		color: var(--xp-ink-2);
		max-width: 22rem;
	}

	.xp-meter {
		flex: 1 1 16rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.xp-bar {
		height: 8px;
		border-radius: 99px;
		background: color-mix(in srgb, var(--xp-gold) 14%, transparent);
		overflow: hidden;
	}

	.xp-bar i {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, color-mix(in srgb, var(--xp-gold) 65%, transparent), var(--xp-gold));
		transition: width 400ms ease;
	}

	.xp-nums {
		margin: 0;
		font-size: 0.72rem;
		color: var(--xp-ink);
		font-variant-numeric: tabular-nums;
	}

	.xp-nums b {
		font-weight: 800;
	}

	.xp-dim {
		color: var(--xp-ink-2);
	}

	.xp-rule {
		margin: 0;
		font-size: 0.62rem;
		line-height: 1.5;
		color: var(--xp-ink-2);
	}

	.xp-journey {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.xp-stop {
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
		padding: 0.4rem 0.7rem;
		border-radius: 11px;
		border: 1px solid color-mix(in srgb, var(--xp-gold) 26%, transparent);
		color: var(--xp-ink-2);
		text-decoration: none;
		line-height: 1.3;
		transition:
			background 180ms ease,
			border-color 180ms ease,
			color 180ms ease,
			opacity 180ms ease;
	}

	.xp-stop:hover {
		background: color-mix(in srgb, var(--xp-gold) 10%, transparent);
		border-color: color-mix(in srgb, var(--xp-gold) 46%, transparent);
		color: var(--xp-ink);
	}

	.xp-stop.is-here {
		background: color-mix(in srgb, var(--xp-gold) 16%, transparent);
		border-color: color-mix(in srgb, var(--xp-gold) 58%, transparent);
		color: var(--xp-ink);
	}

	.xp-stop.is-locked {
		opacity: 0.45;
		border-style: dashed;
	}

	.xp-stop-name {
		font-size: 0.74rem;
		font-weight: 700;
	}

	.xp-stop-gate {
		font-size: 0.6rem;
		font-variant-numeric: tabular-nums;
	}
</style>
