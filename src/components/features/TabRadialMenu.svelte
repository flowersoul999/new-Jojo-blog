<script lang="ts">
import { onMount } from "svelte";

/**
 * Tab 径向轮盘菜单（搬自 Jojo-blog）
 * 按住 Tab：在鼠标位置呼出轮盘；鼠标移动吸附最近图标；
 * 松开 Tab：跳转到选中项；什么都没选/按 ESC：收起。
 */

interface NavItem {
	label: string;
	href: string;
	d: string[]; // SVG path 数据（Feather 风格描边图标）
}

// 12 个导航项 —— 顺序 = 从正上方开始、顺时针的出场顺序
const NAV_ITEMS: NavItem[] = [
	{
		label: "主页",
		href: "/",
		d: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
	},
	{
		label: "归档",
		href: "/archive/",
		d: ["M21 8v13H3V8", "M23 3H1v5h22V3z", "M10 12h4"],
	},
	{
		label: "分类",
		href: "/categories/",
		d: [
			"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
		],
	},
	{
		label: "标签",
		href: "/tags/",
		d: [
			"M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z",
			"M7 7h.01",
		],
	},
	{
		label: "友链",
		href: "/friends/",
		d: [
			"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
			"M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
			"M23 21v-2a4 4 0 0 0-3-3.87",
			"M16 3.13a4 4 0 0 1 0 7.75",
		],
	},
	{
		label: "朋友圈",
		href: "/moments/",
		d: ["M4 11a9 9 0 0 1 9 9", "M4 4a16 16 0 0 1 16 16", "M5 19h.01"],
	},
	{
		label: "留言",
		href: "/guestbook/",
		d: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
	},
	{
		label: "相册",
		href: "/gallery/",
		d: [
			"M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
			"M10 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z",
			"M21 15l-5-5L5 21",
		],
	},
	{
		label: "追番",
		href: "/anime/",
		d: [
			"M4 7h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z",
			"M17 2l-5 5-5-5",
		],
	},
	{
		label: "日记",
		href: "/diary/",
		d: [
			"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z",
			"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
		],
	},
	{
		label: "工具",
		href: "/tools/",
		d: [
			"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
		],
	},
	{
		label: "关于",
		href: "/about/",
		d: [
			"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
			"M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
		],
	},
];

const RADIUS = 140; // 菜单项中心到轮盘圆心的距离
const BTN_SIZE = 64; // 方块按钮尺寸
const CENTER_DEAD = 30; // 圆心 30px 内不选中，留给中心玻璃圆
const CLOSE_DURATION = 150; // 收起动画时长

let open = $state(false);
let closing = $state(false);
let center = $state({ x: 0, y: 0 });
let active = $state(-1);
let pathname = $state("/");

// 监听器只挂载一次，用普通变量同步最新状态，避免闭包拿到旧值
const mouse = { x: 0, y: 0 };
let closeTimer: ReturnType<typeof setTimeout> | undefined;

/** 把轮盘中心限制在视口内，避免鼠标靠近屏幕边缘时按钮被裁切；视口太小直接居中 */
function clampCenter(x: number, y: number) {
	const marginX = RADIUS + 56;
	const marginY = RADIUS + 72;
	const w = window.innerWidth;
	const h = window.innerHeight;
	if (w < marginX * 2 || h < marginY * 2) return { x: w / 2, y: h / 2 };
	return {
		x: Math.min(Math.max(x, marginX), w - marginX),
		y: Math.min(Math.max(y, marginY), h - marginY),
	};
}

/** 找离鼠标坐标最近的菜单项下标；鼠标位于中心圆区域内时返回 -1 */
function getActiveIndex(mx: number, my: number) {
	if (Math.hypot(mx - center.x, my - center.y) < CENTER_DEAD) return -1;
	let closest = -1;
	let minDist = Number.POSITIVE_INFINITY;
	NAV_ITEMS.forEach((_, i) => {
		const angle = (i / NAV_ITEMS.length) * Math.PI * 2 - Math.PI / 2;
		const ix = center.x + Math.cos(angle) * RADIUS;
		const iy = center.y + Math.sin(angle) * RADIUS;
		const d = Math.hypot(mx - ix, my - iy);
		if (d < minDist) {
			minDist = d;
			closest = i;
		}
	});
	return closest;
}

function openMenu() {
	clearTimeout(closeTimer);
	closing = false;
	// 没有鼠标记录（如刚打开页面直接按 Tab）就居中呼出
	const mx = mouse.x || window.innerWidth / 2;
	const my = mouse.y || window.innerHeight / 2;
	center = clampCenter(mx, my);
	active = -1;
	open = true;
}

/** 带淡出动画地收起 */
function beginClose() {
	if (!open || closing) return;
	closing = true;
	closeTimer = setTimeout(() => {
		open = false;
		closing = false;
		active = -1;
	}, CLOSE_DURATION);
}

/** 立即收起（跳转前用，不做淡出） */
function closeNow() {
	clearTimeout(closeTimer);
	open = false;
	closing = false;
	active = -1;
}

function goTo(i: number) {
	const item = NAV_ITEMS[i];
	if (!item) return;
	closeNow();
	// Astro 多页应用：直接整页跳转；同页则只收起轮盘
	const normalize = (p: string) => (p.endsWith("/") ? p : `${p}/`);
	if (normalize(pathname) === normalize(item.href)) return;
	window.location.href = item.href;
}

function onMouseMove(e: MouseEvent) {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
	// 轮盘打开期间：鼠标移动 → 实时吸附到最近的图标
	if (open && !closing) active = getActiveIndex(e.clientX, e.clientY);
}

function onKeyDown(e: KeyboardEvent) {
	if (e.key === "Escape" && open) {
		e.preventDefault();
		beginClose();
		return;
	}
	if (e.key !== "Tab") return;
	// 正在输入框/编辑器里打字时不劫持 Tab
	const el = document.activeElement as HTMLElement | null;
	if (
		el &&
		(el.tagName === "INPUT" ||
			el.tagName === "TEXTAREA" ||
			el.tagName === "SELECT" ||
			el.isContentEditable)
	) {
		return;
	}

	e.preventDefault(); // 一律阻止浏览器默认的焦点切换
	// 按住 Tab 不松会连续触发 keydown（e.repeat），且轮盘已开时也不重复呼出
	if (e.repeat || open) return;

	el?.blur();
	openMenu();
}

function onKeyUp(e: KeyboardEvent) {
	if (e.key !== "Tab" || !open) return;
	e.preventDefault();
	// 收起动画期间松开 Tab：直接完成收起
	if (closing) {
		closeNow();
		return;
	}
	// 松开 Tab：有选中项就跳转，什么都没选中则收起
	if (active >= 0) goTo(active);
	else beginClose();
}

onMount(() => {
	pathname = window.location.pathname;
});
</script>

<svelte:window onmousemove={onMouseMove} onkeydown={onKeyDown} onkeyup={onKeyUp} onblur={closeNow} />

{#if open}
	<div class="trm-overlay" class:trm-closing={closing}>
		<!-- 中心玻璃圆 -->
		<div class="trm-center" style="left:{center.x - 30}px; top:{center.y - 30}px"></div>

		<!-- 径向按钮：从圆心爆开，顺时针依次弹出来 -->
		{#each NAV_ITEMS as item, i (item.href)}
			{@const angle = (i / NAV_ITEMS.length) * Math.PI * 2 - Math.PI / 2}
			{@const isActive = i === active}
			{@const isCurrent =
				item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
			<button
				type="button"
				class="trm-item"
				data-ana="径向菜单导航"
				data-ana-label={item.label}
				class:trm-active={isActive}
				style="left:{center.x - BTN_SIZE / 2}px; top:{center.y - BTN_SIZE / 2}px; --tx:{Math.cos(angle) * RADIUS}px; --ty:{Math.sin(angle) * RADIUS}px; --d:{i * 20}ms"
				onclick={() => goTo(i)}
			>
				<span class="trm-btn" class:is-current={isCurrent && !isActive}>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						{#each item.d as p (p)}<path d={p} />{/each}
					</svg>
				</span>
				<span class="trm-label" class:is-current={isCurrent}>{item.label}</span>
			</button>
		{/each}

		<!-- 底部操作提示 -->
		<div class="trm-hint" style="left:{center.x}px; top:{center.y + RADIUS + 60}px">
			松开 Tab 跳转 · ESC 取消
		</div>
	</div>
{/if}

<style>
	.trm-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		pointer-events: none;
		background: rgb(0 0 0 / 0.3);
		animation: trm-fade 0.15s ease both;
	}
	.trm-overlay.trm-closing {
		opacity: 0;
		transition: opacity 0.15s ease;
	}
	@keyframes trm-fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* 中心玻璃圆 */
	.trm-center {
		position: absolute;
		width: 60px;
		height: 60px;
		border-radius: 9999px;
		border: 1px solid rgb(255 255 255 / 0.3);
		background: rgb(255 255 255 / 0.2);
		backdrop-filter: blur(4px);
	}

	/* 径向按钮：定位在圆心，弹出动画负责位移到目标位置 */
	.trm-item {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		pointer-events: auto;
		animation: trm-pop 0.4s cubic-bezier(0.34, 1.4, 0.64, 1) var(--d) both;
	}
	@keyframes trm-pop {
		from {
			transform: translate(0, 0) scale(0);
			opacity: 0;
		}
		to {
			transform: translate(var(--tx), var(--ty)) scale(1);
			opacity: 1;
		}
	}

	.trm-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		border-radius: 16px;
		border: 1px solid rgb(255 255 255 / 0.5);
		background: rgb(255 255 255 / 0.85);
		color: #475569;
		box-shadow: 0 6px 18px rgb(15 23 42 / 0.12);
		backdrop-filter: blur(8px);
		transition: all 0.1s ease;
	}
	.trm-btn svg {
		width: 24px;
		height: 24px;
	}
	.trm-item:hover .trm-btn {
		color: var(--primary);
	}
	/* 吸附选中：主题色实底 + 放大 + 光晕 */
	.trm-item.trm-active .trm-btn {
		background: var(--primary);
		border-color: transparent;
		color: #fff;
		transform: scale(1.1);
		box-shadow: 0 10px 28px color-mix(in srgb, var(--primary) 55%, transparent);
	}
	/* 当前页图标用主题色区分 */
	.trm-item:not(.trm-active) .trm-btn.is-current {
		color: var(--primary);
	}

	.trm-label {
		white-space: nowrap;
		font-size: 12px;
		font-weight: 500;
		color: rgb(255 255 255 / 0.75);
		transition: all 0.1s ease;
	}
	.trm-item:hover .trm-label {
		color: #fff;
	}
	.trm-item.trm-active .trm-label {
		color: #fff;
		transform: scale(1.1);
	}
	.trm-item .trm-label.is-current {
		color: #fff;
	}

	.trm-hint {
		position: absolute;
		transform: translateX(-50%);
		font-size: 12px;
		color: rgb(255 255 255 / 0.6);
	}
</style>
