<script lang="ts">
	import { onMount } from "svelte";
	import MemoriesVinyl from "./MemoriesVinyl.svelte";

	type MemoryCard = {
		/** 形如 #memory-01，同时用于匹配隐藏的详情模板 */
		url: string;
		title: string;
		image: string;
	};

	interface Props {
		/** 胶片墙数据（顺次按 01、02… 编号） */
		items: MemoryCard[];
		/** 无歌曲时展示的标题 */
		metaTitle: string;
		/** 无歌曲时展示的副标题 */
		metaSubtitle: string;
	}

	let { items, metaTitle, metaSubtitle }: Props = $props();

	const numbered = $derived(
		items.map((item, i) => ({ ...item, number: String(i + 1).padStart(2, "0") }))
	);
	// 移动端三行：按 0/1/2 轮流分发（与桌面端竖向胶片墙同一批内容）
	const rows = $derived([0, 1, 2].map((r) => numbered.filter((_, i) => i % 3 === r)));

	let modalEl = $state<HTMLElement | null>(null);
	let modalContentEl = $state<HTMLElement | null>(null);
	let lyricsListEl = $state<HTMLElement | null>(null);

	// ── 音乐状态（全部来自站点全局播放器）─────────────────
	let playing = $state(false);
	let audioReady = $state(false);
	let analyser = $state(false);
	let trackName = $state("");
	let trackArtist = $state("");
	let trackCover = $state("");
	// 曲目封面来自外链，可能失效；失败时退回本地封面，避免出现破图
	let coverFailed = $state(false);
	let lyrics = $state<Array<{ time: number; text: string }>>([]);
	let lyricsStatus = $state<"idle" | "loading" | "loaded" | "none" | "failed">("idle");
	let lrcIndex = $state(-1);

	const cover = $derived((!coverFailed && trackCover) || items[0]?.image || "");
	const displayTitle = $derived(trackName || metaTitle);
	const displaySubtitle = $derived(trackArtist || metaSubtitle);

	// 换歌时给新封面一次重新加载的机会
	$effect(() => {
		void trackCover;
		coverFailed = false;
	});

	let lastActiveLine: HTMLElement | null = null;

	function syncMusic() {
		const api = window.__fireflyMusic;
		if (!api) return;
		const s = api.getState();
		playing = s.isPlaying;
		audioReady = !!s.track;
		if (s.track) {
			trackName = s.track.name || "";
			trackArtist = s.track.artist || "";
			trackCover = s.track.pic || "";
		}
		lyrics = s.lyrics || [];
		lrcIndex = s.currentLrcIndex;
		if (lyrics.length > 0) lyricsStatus = "loaded";
	}

	function handleToggle() {
		const api = window.__fireflyMusic;
		if (!api) return;
		enableAnalyser();
		api.init().then(() => api.togglePlay());
	}

	function enableAnalyser() {
		const api = window.__fireflyMusic;
		if (!api?.enableAnalyser) return;
		try {
			if (api.enableAnalyser()) analyser = true;
		} catch {
			analyser = false;
		}
	}

	// ── 弹窗 ────────────────────────────────────────────────
	let openUrl = $state<string | null>(null);

	function openMemory(url: string) {
		if (!modalContentEl) return;
		const source = document.querySelector(
			`#memories-entry-store [data-url="${url}"] .memories-detail`
		);
		modalContentEl.innerHTML = "";
		if (source) modalContentEl.appendChild(source.cloneNode(true));
		openUrl = url;
		document.documentElement.classList.add("memories-modal-open");
		modalEl?.querySelector<HTMLElement>(".memories-modal__backdrop")?.focus();
	}

	function closeMemory() {
		openUrl = null;
		document.documentElement.classList.remove("memories-modal-open");
	}

	// ── 移动端横向胶片跑马灯（桌面竖排交给 CSS keyframes）──
	const ROW_SPEED = 18; // px/s，保证每行观感一致

	function attachRowMarquee(viewport: HTMLElement, track: HTMLElement, dir: number) {
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let half = track.scrollWidth / 2;
		if (half <= 0) return () => {};

		let x = dir > 0 ? 0 : -half;
		let dragging = false;
		let lastX = 0;
		let raf = 0;
		let last = performance.now();
		let paused = false;

		const apply = () => {
			track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
		};

		const frame = (now: number) => {
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			if (!dragging && !paused) {
				x += (dir > 0 ? -1 : 1) * ROW_SPEED * dt;
				if (x <= -half) x += half;
				if (x > 0) x -= half;
				apply();
			}
			raf = requestAnimationFrame(frame);
		};

		viewport.addEventListener("pointerdown", (e) => {
			dragging = true;
			lastX = e.clientX;
			viewport.setPointerCapture(e.pointerId);
		});
		viewport.addEventListener("pointermove", (e) => {
			if (!dragging) return;
			x += e.clientX - lastX;
			lastX = e.clientX;
			if (x <= -half) x += half;
			if (x > 0) x -= half;
			apply();
		});
		const endDrag = (e: PointerEvent) => {
			if (!dragging) return;
			dragging = false;
			try {
				viewport.releasePointerCapture(e.pointerId);
			} catch {
				/* 指针已释放 */
			}
		};
		viewport.addEventListener("pointerup", endDrag);
		viewport.addEventListener("pointercancel", endDrag);
		viewport.addEventListener("pointerenter", (e) => {
			if (e.pointerType === "mouse") paused = true;
		});
		viewport.addEventListener("pointerleave", (e) => {
			if (e.pointerType === "mouse") paused = false;
		});

		half = track.scrollWidth / 2;
		apply();
		if (!reduce) raf = requestAnimationFrame(frame);

		return () => cancelAnimationFrame(raf);
	}

	onMount(() => {
		syncMusic();

		const onTrack = () => syncMusic();
		const onPlayState = () => syncMusic();
		const onLyrics = (e: Event) => {
			const detail = (e as CustomEvent).detail || {};
			lyrics = Array.isArray(detail.lyrics) ? detail.lyrics : [];
			lyricsStatus = detail.status || (lyrics.length ? "loaded" : "none");
			lrcIndex = -1;
		};
		const onLrcIndex = (e: Event) => {
			lrcIndex = (e as CustomEvent).detail?.index ?? -1;
		};
		// 开屏被点击 = 用户手势，可以安全地拉起音频上下文并开始播放
		const onGesture = () => {
			enableAnalyser();
			const api = window.__fireflyMusic;
			if (!api) return;
			api.init().then(() => {
				syncMusic();
				const s = api.getState();
				if (!s.isPlaying) api.togglePlay();
			});
		};
		// 未点击时只预加载曲目信息与歌词，不强行播放
		const onSplashDone = () => {
			const api = window.__fireflyMusic;
			if (!api) return;
			api.init().then(syncMusic);
		};
		const onKeydown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && openUrl) closeMemory();
		};

		window.addEventListener("fm:track", onTrack);
		window.addEventListener("fm:play-state", onPlayState);
		window.addEventListener("fm:lyrics", onLyrics);
		window.addEventListener("fm:lrc-index", onLrcIndex);
		window.addEventListener("memories:user-gesture", onGesture);
		window.addEventListener("memories:splash-done", onSplashDone);
		window.addEventListener("keydown", onKeydown);

		// 移动端三行跑马灯
		const cleanups: Array<() => void> = [];
		for (const section of document.querySelectorAll<HTMLElement>(".memories-films--row")) {
			const viewport = section.querySelector<HTMLElement>(".memories-films__viewport");
			const track = section.querySelector<HTMLElement>(".memories-films__track");
			if (!viewport || !track) continue;
			const dir = Number.parseInt(track.dataset.dir || "1", 10);
			track.classList.add("is-js-marquee");
			cleanups.push(attachRowMarquee(viewport, track, dir));
		}

		// 哈希直达：/memories/#memory-03 直接打开对应弹窗
		if (window.location.hash.startsWith("#memory-")) {
			openMemory(window.location.hash);
		}

		return () => {
			window.removeEventListener("fm:track", onTrack);
			window.removeEventListener("fm:play-state", onPlayState);
			window.removeEventListener("fm:lyrics", onLyrics);
			window.removeEventListener("fm:lrc-index", onLrcIndex);
			window.removeEventListener("memories:user-gesture", onGesture);
			window.removeEventListener("memories:splash-done", onSplashDone);
			window.removeEventListener("keydown", onKeydown);
			for (const fn of cleanups) fn();
		};
	});

	// 歌词自动滚到当前行
	$effect(() => {
		void lrcIndex;
		void lyrics;
		if (!lyricsListEl) return;
		const active = lyricsListEl.querySelector<HTMLElement>(".memories-music__lyric-line.is-active");
		if (!active || active === lastActiveLine) return;
		lastActiveLine = active;
		lyricsListEl.scrollTo({
			top: active.offsetTop - lyricsListEl.clientHeight / 2 + active.offsetHeight / 2,
			behavior: "smooth"
		});
	});
</script>

<div class="memories-page__body memories-stage" id="memories-stage">
	<section class="memories-music" class:is-playing={playing} class:is-analyser={analyser} class:is-audio-ready={audioReady}>
		<div class="memories-music__meta">
			{#if cover}
				<img
					class="memories-music__cover"
					src={cover}
					alt=""
					width="72"
					height="72"
					decoding="async"
					onerror={() => {
						coverFailed = true;
					}}
				/>
			{/if}
			<div class="memories-music__meta-text">
				<h2 class="memories-music__title">{displayTitle}</h2>
				<p class="memories-music__subtitle">{displaySubtitle}</p>
			</div>
		</div>

		<div class="memories-music__main">
			<div class="memories-music__lyrics">
				<div class="memories-music__lyrics-list" bind:this={lyricsListEl}>
					{#if lyrics.length === 0}
						<p class="memories-music__lyric-line memories-music__lyric-line--muted">
							{lyricsStatus === "loading" ? "歌词加载中…" : lyricsStatus === "failed" ? "歌词加载失败" : "暂无歌词"}
						</p>
					{:else}
						{#each lyrics as line, i (i)}
							<p class="memories-music__lyric-line" class:is-active={i === lrcIndex}>{line.text}</p>
						{/each}
					{/if}
				</div>
			</div>

			<MemoriesVinyl {cover} {playing} {analyser} onToggle={handleToggle} />
		</div>

		<p class="memories-music__hint">点击唱片开始播放</p>
	</section>

	{#each rows as row, r (r)}
		<section
			class={`memories-films memories-films--row memories-films--row-${["top", "mid", "bottom"][r]}`}
			aria-label={`回忆胶片（${r + 1}）`}
		>
			<div class="memories-films__viewport">
				<div class="memories-films__track" data-axis="x" data-dir={r === 1 ? 1 : -1}>
					{#each [...row, ...row] as item, i (i)}
						<article class="memories-film-card">
							<a
								class="memories-film-card__link"
								href={item.url}
								role="button"
								aria-label={`查看回忆：${item.title}`}
								onclick={(e) => {
									e.preventDefault();
									openMemory(item.url);
								}}
							>
								<div class="memories-film-card__frame">
									<div class="memories-film-card__edge memories-film-card__edge--top">
										<span>MEMORY</span><span>{item.number}</span>
									</div>
									<div class="memories-film-card__photo-wrap">
										<img
											class="memories-film-card__photo"
											src={item.image}
											alt=""
											loading="eager"
											decoding="async"
											draggable="false"
										/>
									</div>
									<div class="memories-film-card__edge memories-film-card__edge--bottom">
										<span>{item.number}</span><span>MEMORY</span>
									</div>
								</div>
							</a>
						</article>
					{/each}
				</div>
			</div>
		</section>
	{/each}

	<section class="memories-films memories-films--col" aria-label="回忆胶片">
		<div class="memories-films__viewport">
			<div class="memories-films__track" data-axis="y" data-dir="1">
				{#each [...numbered, ...numbered] as item, i (i)}
					<article class="memories-film-card">
						<a
							class="memories-film-card__link"
							href={item.url}
							role="button"
							aria-label={`查看回忆：${item.title}`}
							onclick={(e) => {
								e.preventDefault();
								openMemory(item.url);
							}}
						>
							<div class="memories-film-card__frame">
								<div class="memories-film-card__edge memories-film-card__edge--top">
									<span>MEMORY</span><span>{item.number}</span>
								</div>
								<div class="memories-film-card__photo-wrap">
									<img
										class="memories-film-card__photo"
										src={item.image}
										alt=""
										loading="eager"
										decoding="async"
										draggable="false"
									/>
								</div>
								<div class="memories-film-card__edge memories-film-card__edge--bottom">
									<span>{item.number}</span><span>MEMORY</span>
								</div>
							</div>
						</a>
					</article>
				{/each}
			</div>
		</div>
	</section>
</div>

<div
	class="memories-modal"
	class:is-open={openUrl !== null}
	id="memories-modal"
	bind:this={modalEl}
	role="dialog"
	aria-modal="true"
	aria-label="回忆详情"
>
	<button
		type="button"
		class="memories-modal__backdrop"
		aria-label="关闭弹窗"
		onclick={closeMemory}
	></button>
	<div class="memories-modal__panel">
		<div class="memories-modal__content" bind:this={modalContentEl}></div>
	</div>
</div>