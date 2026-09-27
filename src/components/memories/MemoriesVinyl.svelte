<script lang="ts">
import { onMount } from "svelte";

interface Props {
	/** 唱片中心标签的封面图 */
	cover: string;
	/** 是否正在播放（驱动自转、唱针、按钮图标） */
	playing: boolean;
	/** 是否已接入真实频谱；false 时交给 CSS keyframes 律动 */
	analyser: boolean;
	/** 点击唱片中央按钮 */
	onToggle: () => void;
	/** 律动条数量 */
	bars?: number;
}

let { cover, playing, analyser, onToggle, bars = 96 }: Props = $props();

// 唱片盘面用渐变画出纹路，不依赖图片资源
const discTexture =
	"repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.055) 0 1px, rgba(0,0,0,0) 1px 5px), radial-gradient(circle at 50% 50%, #2b2b2b 0%, #101010 62%, #1d1d1d 100%)";

// 用 $derived 读取 prop，避免在非响应式上下文里直接引用（Svelte 5 会告警）
const barCount = $derived(bars);
const indices = $derived(Array.from({ length: barCount }, (_, i) => i));

let wrapEl = $state<HTMLElement | null>(null);
let barEls: HTMLElement[] = [];
let rafId: number | null = null;
let levels = new Float32Array(0);

function stopLoop() {
	if (rafId !== null) {
		cancelAnimationFrame(rafId);
		rafId = null;
	}
}

function startLoop() {
	if (rafId !== null) return;
	const frame = () => {
		const data = window.__fireflyMusic?.getSpectrum?.(bars) ?? null;
		if (data) {
			for (let i = 0; i < barEls.length && i < data.length; i++) {
				// 快起慢落，视觉上更像随鼓点跳动
				const target = Math.min(1, Math.max(0.06, data[i]));
				levels[i] =
					target > levels[i] ? target : levels[i] * 0.88 + target * 0.12;
				barEls[i]?.style.setProperty("--level", levels[i].toFixed(3));
			}
		}
		rafId = requestAnimationFrame(frame);
	};
	rafId = requestAnimationFrame(frame);
}

// 只有「已接入频谱 且 正在播放」时才用 rAF 直接驱动 --level
$effect(() => {
	const active = analyser && playing;
	if (active) {
		if (wrapEl) {
			barEls = Array.from(
				wrapEl.querySelectorAll<HTMLElement>(".memories-music__bar"),
			);
		}
		if (levels.length !== barCount) levels = new Float32Array(barCount);
		startLoop();
	} else {
		stopLoop();
		for (const bar of barEls) bar.style.removeProperty("--level");
		levels = new Float32Array(barCount);
	}
});

onMount(() => {
	return () => stopLoop();
});
</script>

<div
	class="memories-music__vinyl-wrap"
	bind:this={wrapEl}
>
	<div class="memories-music__vinyl" style={`--vinyl-disc:${discTexture}`}>
		<div class="memories-music__vinyl-disc">
			<div
				class="memories-music__vinyl-label"
				style={cover ? `--vinyl-cover:url('${cover}')` : undefined}
			></div>
		</div>
	</div>

	<div class="memories-music__wave" aria-hidden="true" style={`--n:${bars}`}>
		{#each indices as i (i)}
			<span
				class="memories-music__bar"
				style={`--i:${i + 1};--a:${((i * 360) / bars).toFixed(4)}deg`}
			></span>
		{/each}
	</div>

	<button
		type="button"
		class="memories-music__toggle"
		aria-label={playing ? "暂停" : "播放"}
		onclick={onToggle}
	>
		<span class="memories-music__toggle-icon memories-music__toggle-icon--play"></span>
		<span class="memories-music__toggle-icon memories-music__toggle-icon--pause"></span>
	</button>

	<div class="memories-music__tonearm" aria-hidden="true"></div>
</div>