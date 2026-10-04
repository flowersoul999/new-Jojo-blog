<script lang="ts">
/**
 * 管理台通用弹窗：居中卡片 + 遮罩，ESC / 点遮罩关闭
 * 用法：<Modal title="上传图片" onClose={...}>正文</Modal>
 *      <Modal title="…">正文{#snippet footer()}底部操作条{/snippet}</Modal>
 *
 * ⚠️ 这里必须用原生 `<dialog>` + `showModal()`，不能退回 `div` + `position: fixed`：
 * 页面外层 `#content-wrapper` 带 `.onload-animation`（fade-in-up 动画 + `forwards`，
 * transform 会一直留在元素上），祖先一旦有 transform，fixed 的包含块就不再是视口，
 * 遮罩会变成「跟整页一样高」，卡片被顶到页面中段，必须往下滚很久才看得见。
 * `showModal()` 把元素送进 top layer，完全不参与祖先的包含块计算，一劳永逸。
 * 顺带白拿 ESC 关闭、焦点循环、背景不可点击。
 *
 * ⚠️ 全站 Tailwind preflight 把 `*` 的 margin / padding / border 归零，
 * 连带吃掉 dialog UA 样式的 `inset: 0` + `margin: auto`（不写就贴左上角），
 * 所以下面 position / inset / margin / max-* 都要显式写全。
 */
import type { Snippet } from "svelte";
import { onMount } from "svelte";

let {
	title,
	onClose,
	children,
	footer,
	wide = false,
}: {
	title: string;
	onClose: () => void;
	children: Snippet;
	/** 可选：钉在卡片底部、不跟着正文一起滚的操作条 */
	footer?: Snippet;
	wide?: boolean;
} = $props();

let el = $state<HTMLDialogElement | null>(null);

/**
 * 背景别跟着滚。dialog 挡住了点击，但滚轮仍可能把整页带着跑；
 * 顺带补掉滚动条消失导致的那点横向抖动。
 * 恢复动作挂两个地方：组件卸载（正常路径）+ dialog 的 close 事件（兜底，
 * 万一调用方没销毁组件，否则 overflow 会永久卡在 hidden）。
 */
function lockScroll() {
	const de = document.documentElement;
	const prevOverflow = de.style.overflow;
	const prevPad = de.style.paddingRight;
	const gap = window.innerWidth - de.clientWidth;
	de.style.overflow = "hidden";
	if (gap > 0) de.style.paddingRight = `${gap}px`;
	return () => {
		de.style.overflow = prevOverflow;
		de.style.paddingRight = prevPad;
	};
}

onMount(() => {
	el?.showModal();
	const unlock = lockScroll();
	el?.addEventListener("close", unlock);
	return () => {
		el?.removeEventListener("close", unlock);
		unlock();
	};
});

/**
 * ESC：先拦掉默认行为，交给 onClose 决定要不要真关。
 * 不能直接 close()——实习编辑器那边有「还有未保存改动」的确认框，
 * 用户点取消时弹窗必须留在原地。
 */
function handleCancel(e: Event) {
	e.preventDefault();
	onClose();
}

/** 点遮罩关闭：target 是 dialog 元素本身（= 卡片外的空白）才算 */
function handleClick(e: MouseEvent) {
	if (e.target === el) onClose();
}
</script>

<dialog
	bind:this={el}
	class="mo"
	class:mo--wide={wide}
	aria-label={title}
	oncancel={handleCancel}
	onclick={handleClick}
>
	<div class="mo-box">
		<div class="mo-head">
			<h3 class="mo-title">{title}</h3>
			<button type="button" class="mo-close" aria-label="关闭" onclick={onClose}>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M18 6 6 18M6 6l12 12" />
				</svg>
			</button>
		</div>
		<div class="mo-scroll custom-scrollbar">
			{@render children()}
		</div>
		{#if footer}
			<div class="mo-foot">{@render footer()}</div>
		{/if}
	</div>
</dialog>

<style>
	/* dialog 铺满视口当遮罩用（自身透明，dim 交给 ::backdrop），
	   真正的卡片是内层 .mo-box —— 这样「点空白关闭」只需判 target === dialog。 */
	.mo {
		display: none;
		position: fixed;
		inset: 0;
		width: 100%;
		max-width: none;
		height: 100%;
		max-height: none;
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		overflow: hidden;
	}
	.mo[open] {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem;
	}
	.mo::backdrop {
		background: rgb(0 0 0 / 0.45);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.mo-box {
		display: flex;
		flex-direction: column;
		width: min(100%, 32rem);
		max-height: 100%;
		border: 1px solid var(--line-divider);
		border-radius: 1rem;
		background: var(--card-bg);
		box-shadow: 0 24px 48px -12px rgb(0 0 0 / 0.28);
		overflow: hidden;
	}
	.mo--wide .mo-box {
		width: min(100%, 42rem);
	}
	.mo[open] .mo-box {
		animation: mo-in 180ms ease-out;
	}
	@keyframes mo-in {
		from {
			opacity: 0;
			transform: translateY(0.7rem) scale(0.985);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.mo[open] .mo-box {
			animation: none;
		}
	}

	.mo-head {
		flex: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.9rem 1.15rem 0.75rem;
		border-bottom: 1px solid var(--line-divider);
	}
	.mo-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-color);
	}
	.mo-close {
		flex: none;
		display: flex;
		width: 2rem;
		height: 2rem;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		color: color-mix(in srgb, var(--text-color) 55%, transparent);
		cursor: pointer;
		transition:
			background 160ms ease,
			color 160ms ease;
	}
	.mo-close:hover {
		background: color-mix(in srgb, var(--text-color) 8%, transparent);
		color: var(--text-color);
	}

	/* 唯一负责滚动的区域：标题栏和底部操作条都不动 */
	.mo-scroll {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 0.9rem 1.15rem 1rem;
	}

	.mo-foot {
		flex: none;
		padding: 0.7rem 1.15rem 0.85rem;
		border-top: 1px solid var(--line-divider);
	}
</style>
