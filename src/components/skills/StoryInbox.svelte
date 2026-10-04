<script lang="ts">
/**
 * 飞剑传书·收件箱：隐藏剧情到达的地方。
 *
 * 监听 aemeath-story-unlocked（cultivation.ts 在解锁新剧情时派发）：
 * 把新信收进信箱、红点亮起、自动拆开第一封；也可随时点信封回看全部信件。
 * 已读状态单独存 localStorage，不影响「已解锁」集合（解锁集合只增不减）。
 */
import { STORY_EVENT } from "@/data/cultivation";
import { getStory, STORIES } from "@/data/cultivationStories";
import { playStory } from "@/lib/sfx";

const UNLOCKED_KEY = "aemeath-stories-unlocked";
const READ_KEY = "aemeath-stories-read";

function readUnlocked(): string[] {
	try {
		const raw = localStorage.getItem(UNLOCKED_KEY);
		return raw ? (JSON.parse(raw) as string[]) : [];
	} catch {
		return [];
	}
}
function readReadSet(): Set<string> {
	try {
		const raw = localStorage.getItem(READ_KEY);
		return new Set(raw ? (JSON.parse(raw) as string[]) : []);
	} catch {
		return new Set();
	}
}
function persistRead(set: Set<string>) {
	try {
		localStorage.setItem(READ_KEY, JSON.stringify([...set]));
	} catch {
		/* 忽略 */
	}
}

let unlockedIds = $state<string[]>(readUnlocked());
let readIds = $state<Set<string>>(readReadSet());
let readerId = $state<string | null>(null);
let mailboxOpen = $state(false);

const unread = $derived(unlockedIds.filter((id) => !readIds.has(id)).length);

const readerStory = $derived(readerId ? getStory(readerId) : null);

function openReader(id: string) {
	readerId = id;
	mailboxOpen = false;
}

function markRead(id: string) {
	if (!readIds.has(id)) {
		const next = new Set(readIds);
		next.add(id);
		readIds = next;
		persistRead(next);
	}
}

function closeReader() {
	if (readerId) {
		markRead(readerId);
		readerId = null;
	}
}

function stepReader(dir: 1 | -1) {
	if (!readerId) return;
	const idx = unlockedIds.indexOf(readerId);
	const target = unlockedIds[idx + dir];
	if (target) openReader(target);
	else closeReader();
}

$effect(() => {
	const onStory = (e: Event) => {
		const ids = (e as CustomEvent<{ ids: string[] }>).detail.ids;
		const set = new Set(unlockedIds);
		let changed = false;
		for (const id of ids)
			if (STORIES[id] && !set.has(id)) {
				set.add(id);
				changed = true;
			}
		if (changed) {
			unlockedIds = [...set];
			openReader(ids[0]);
			playStory();
		}
	};
	window.addEventListener(STORY_EVENT, onStory as EventListener);
	return () =>
		window.removeEventListener(STORY_EVENT, onStory as EventListener);
});
</script>

<!-- 信封入口 -->
<button
	type="button"
	class="sib-envelope"
	aria-label="飞剑传书收件箱"
	onclick={() => (mailboxOpen = !mailboxOpen)}
>
	<svg viewBox="0 0 24 24" aria-hidden="true">
		<path
			d="M3 6.5 12 13l9-6.5M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linejoin="round"
		/>
	</svg>
	{#if unread > 0}
		<span class="sib-badge">{unread}</span>
	{/if}
</button>

<!-- 信箱列表 -->
{#if mailboxOpen}
	<div
		class="sib-backdrop"
		onclick={() => (mailboxOpen = false)}
		role="presentation"
	></div>
	<dialog class="sib-mailbox" open>
		<header class="sib-mb-head">
			<span>飞剑传书</span>
			<button type="button" class="sib-mb-close" onclick={() => (mailboxOpen = false)}
				>合上</button
			>
		</header>
		<ul class="sib-mb-list">
			{#each [...unlockedIds].reverse() as id (id)}
				{@const s = getStory(id)}
				{#if s}
					<li class:is-unread={!readIds.has(id)}>
						<button type="button" class="sib-mb-item" onclick={() => openReader(id)}>
							<span class="sib-mb-dot"></span>
							<span class="sib-mb-title">{s.title}</span>
							<span class="sib-mb-from">{s.from}</span>
						</button>
					</li>
				{/if}
			{/each}
		</ul>
	</dialog>
{/if}

<!-- 拆信阅读器 -->
{#if readerId && readerStory}
	<div
		class="sib-backdrop"
		onclick={closeReader}
		role="presentation"
	></div>
	<dialog class="sib-reader" open>
		<header class="sib-r-head">
			<span class="sib-r-from">{readerStory.from}</span>
			<button type="button" class="sib-r-close" onclick={closeReader}>封缄</button>
		</header>
		<h3 class="sib-r-title">{readerStory.title}</h3>
		<div class="sib-r-body">
			{#each readerStory.paragraphs as p, i (i)}
				<p>{p}</p>
			{/each}
		</div>
		<footer class="sib-r-foot">
			<button type="button" class="sib-r-nav" onclick={() => stepReader(-1)}>上一封</button>
			<button type="button" class="sib-r-nav" onclick={() => stepReader(1)}>下一封</button>
		</footer>
	</dialog>
{/if}

<style>
	/* 二次元暖金，与全站修仙面板同源 */
	.sib-envelope {
		position: fixed;
		left: 1.2rem;
		bottom: 1.4rem;
		z-index: 90;
		width: 46px;
		height: 46px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid color-mix(in srgb, #c9a44c 40%, transparent);
		border-radius: 14px;
		background: color-mix(in srgb, #fffdf7 92%, #c9a44c);
		color: #8a6d24;
		cursor: pointer;
		box-shadow: 0 6px 18px rgb(0 0 0 / 0.18);
		transition: transform 160ms ease, box-shadow 160ms ease;
	}
	.sib-envelope:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 24px rgb(0 0 0 / 0.22);
	}
	.sib-envelope svg {
		width: 22px;
		height: 22px;
	}
	:global(html.dark) .sib-envelope {
		background: color-mix(in srgb, #211b13 92%, #d9b45f);
		color: #e7d09a;
	}
	.sib-badge {
		position: absolute;
		top: -5px;
		right: -5px;
		min-width: 18px;
		height: 18px;
		padding: 0 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 99px;
		background: #c2557a;
		font-size: 0.62rem;
		font-weight: 800;
		color: #fff;
		box-shadow: 0 0 0 2px color-mix(in srgb, #fffdf7 80%, transparent);
	}
	:global(html.dark) .sib-badge {
		box-shadow: 0 0 0 2px color-mix(in srgb, #211b13 80%, transparent);
	}

	.sib-backdrop {
		position: fixed;
		inset: 0;
		z-index: 95;
		background: rgb(20 14 6 / 0.5);
		backdrop-filter: blur(3px);
	}
	.sib-mailbox,
	.sib-reader {
		position: fixed;
		z-index: 100;
		margin: auto;
		padding: 0;
		border: 0;
		max-width: 30rem;
		width: calc(100vw - 2rem);
	}
	.sib-mailbox {
		top: 50%;
		transform: translateY(-50%);
	}
	.sib-reader {
		bottom: 1.5rem;
	}

	.sib-mb-head,
	.sib-r-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.7rem 1rem;
		border-bottom: 1px solid color-mix(in srgb, #c9a44c 30%, transparent);
		font-size: 0.9rem;
		font-weight: 800;
		color: #4a4335;
	}
	:global(html.dark) .sib-mb-head,
	:global(html.dark) .sib-r-head {
		color: #e9e1ce;
	}
	.sib-mb-close,
	.sib-r-close {
		padding: 0.24rem 0.66rem;
		border: 1px solid color-mix(in srgb, #c9a44c 36%, transparent);
		border-radius: 99px;
		background: transparent;
		font-size: 0.66rem;
		color: inherit;
		cursor: pointer;
	}
	.sib-mailbox {
		border-radius: 16px;
		overflow: hidden;
		background: #fffdf7;
		box-shadow: 0 18px 44px rgb(0 0 0 / 0.24);
	}
	:global(html.dark) .sib-mailbox {
		background: #211b13;
	}
	.sib-mb-list {
		max-height: 56vh;
		overflow-y: auto;
		margin: 0;
		padding: 0.4rem;
		list-style: none;
		display: grid;
		gap: 0.2rem;
	}
	.sib-mb-item {
		display: grid;
		grid-template-columns: 0.7rem 1fr auto;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.6rem;
		border: 0;
		border-radius: 0.6rem;
		background: transparent;
		text-align: left;
		cursor: pointer;
		transition: background 150ms ease;
	}
	.sib-mb-item:hover {
		background: color-mix(in srgb, #c9a44c 12%, transparent);
	}
	.sib-mb-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: transparent;
		box-shadow: inset 0 0 0 1px color-mix(in srgb, #857d6c 60%, transparent);
	}
	.sib-mb-item.is-unread .sib-mb-dot {
		background: #c2557a;
		box-shadow: 0 0 0 0 transparent;
	}
	.sib-mb-title {
		font-size: 0.78rem;
		font-weight: 700;
		color: #4a4335;
	}
	:global(html.dark) .sib-mb-title {
		color: #e9e1ce;
	}
	.sib-mb-from {
		font-size: 0.64rem;
		color: #857d6c;
	}

	/* 拆信阅读器：纸卷风 */
	.sib-reader {
		border-radius: 16px;
		overflow: hidden;
		background: linear-gradient(160deg, #fbf3df, #f3e6c4);
		color: #4a4335;
		box-shadow: 0 18px 44px rgb(0 0 0 / 0.28);
	}
	:global(html.dark) .sib-reader {
		background: linear-gradient(160deg, #2a2218, #1d160e);
		color: #e9e1ce;
	}
	.sib-r-title {
		margin: 0;
		padding: 0.6rem 1rem 0.4rem;
		font-size: 1.02rem;
		font-weight: 800;
	}
	.sib-r-body {
		padding: 0 1.1rem;
		max-height: 44vh;
		overflow-y: auto;
	}
	.sib-r-body p {
		margin: 0 0 0.7rem;
		font-size: 0.82rem;
		line-height: 1.9;
		text-indent: 2em;
		color: inherit;
	}
	.sib-r-foot {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		padding: 0.6rem 1rem 0.8rem;
		border-top: 1px solid color-mix(in srgb, #c9a44c 24%, transparent);
	}
	.sib-r-nav {
		padding: 0.3rem 0.8rem;
		border: 1px solid color-mix(in srgb, #c9a44c 40%, transparent);
		border-radius: 99px;
		background: transparent;
		font-size: 0.7rem;
		color: inherit;
		cursor: pointer;
	}
	.sib-r-nav:hover {
		background: color-mix(in srgb, #c9a44c 16%, transparent);
	}
</style>
