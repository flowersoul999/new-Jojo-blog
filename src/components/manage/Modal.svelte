<script lang="ts">
/**
 * 管理台通用弹窗：遮罩 + 居中卡片，ESC / 点遮罩关闭
 * 用法：<Modal title="上传图片" onClose={...}>...</Modal>
 */
import type { Snippet } from "svelte";

let {
	title,
	onClose,
	children,
	wide = false,
}: {
	title: string;
	onClose: () => void;
	children: Snippet;
	wide?: boolean;
} = $props();

function handleKey(e: KeyboardEvent) {
	if (e.key === "Escape") onClose();
}
</script>

<svelte:window onkeydown={handleKey} />

<div
	class="fixed inset-0 z-[900] flex items-center justify-center p-4"
	role="dialog"
	aria-modal="true"
>
	<button
		type="button"
		class="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm"
		aria-label="关闭弹窗"
		onclick={onClose}
	></button>
	<div
		class="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl"
		class:max-w-2xl={wide}
	>
		<div class="mb-4 flex items-center justify-between gap-3">
			<h3 class="text-base font-bold">{title}</h3>
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-black/5 dark:hover:bg-white/10"
				aria-label="关闭"
				onclick={onClose}
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M18 6 6 18M6 6l12 12" />
				</svg>
			</button>
		</div>
		{@render children()}
	</div>
</div>
