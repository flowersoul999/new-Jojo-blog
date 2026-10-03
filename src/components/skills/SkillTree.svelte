<script lang="ts">
/**
 * 前端技能图
 *
 * 形态：按「前置依赖」自动分层的技能图，不是树也不是清单。
 *   每一层的技术份量相同；方块上是真实技术 logo；
 *   连线 = requires 里声明的真实前置关系，全部从浅层指向深层，绝不乱指。
 *
 * 亮度：level 0-5 用四重信号同时表达 —— 方块内的水位高度、logo 饱和度、
 *       描边亮度、高等级的外发光。0 级还会打斜纹并虚线描边。
 *
 * 解锁：requires 里所有技能都 ≥1 级，本技能才可点。未解锁时点击会抖动并提示。
 *
 * 排列：层由依赖深度算出，层内顺序用「父节点序号的重心」迭代排序，尽量少交叉。
 *       位置交给 CSS 弹性布局，箭头在 DOM 渲染后实测坐标再画，所以任何屏宽都不会错位。
 */
import { onMount } from "svelte";
import avatarUrl from "@/assets/images/jojo-avatar.webp";
import { profileConfig } from "@/config/profileConfig";
import {
	GROUPS,
	LEVELS,
	MAX_LEVEL,
	PRESET,
	SKILL_MAP,
	SKILLS,
	type Skill,
	TOTAL_SKILLS,
} from "@/data/skills";
import { GROUP_COLORS, iconColor, TECH_ICONS } from "@/data/techIcons";

const STORAGE_KEY = "aemeath-skill-tree";
const MAX_POINTS = TOTAL_SKILLS * MAX_LEVEL;
const GROUP_MAP: Record<string, (typeof GROUPS)[number]> = Object.fromEntries(
	GROUPS.map((g) => [g.id, g]),
);

/** 角色称号：按总掌握度百分比给 */
const TITLES = [
	{ min: 0, name: "初识前端", note: "地基还没打完，慢慢来" },
	{ min: 10, name: "略有小成", note: "能照着文档做出东西了" },
	{ min: 25, name: "独当一面", note: "能扛需求，也能自己排错" },
	{ min: 40, name: "炉火纯青", note: "知道什么场景不该用什么" },
	{ min: 58, name: "一方宗师", note: "能带人，也能定规范" },
	{ min: 75, name: "登峰造极", note: "造轮子，影响一整个生态" },
];

/* ===================== 图结构（静态，只算一次） ===================== */

/** 反向索引：谁依赖我 */
const CHILDREN: Record<string, string[]> = {};
for (const s of SKILLS) {
	for (const r of s.requires) {
		if (!CHILDREN[r]) CHILDREN[r] = [];
		CHILDREN[r].push(s.id);
	}
}

/** 依赖深度：没有前置就是第 0 层 */
const DEPTH: Record<string, number> = (() => {
	const memo: Record<string, number> = {};
	const calc = (id: string): number => {
		if (memo[id] !== undefined) return memo[id];
		memo[id] = 0;
		const req = SKILL_MAP[id]?.requires ?? [];
		memo[id] = req.length === 0 ? 0 : Math.max(...req.map(calc)) + 1;
		return memo[id];
	};
	for (const s of SKILLS) calc(s.id);
	return memo;
})();

const ROW_COUNT = Math.max(...Object.values(DEPTH)) + 1;

/**
 * 分层 + 层内排序。
 * 上下各扫一遍、用「父 / 子节点在本层的序号重心」重排，反复几轮把连线交叉压下来。
 * 版式因此完全由依赖关系决定，加一条 requires 就会自己长出新的一层。
 */
const ROWS: Skill[][] = (() => {
	const rows: Skill[][] = Array.from({ length: ROW_COUNT }, () => []);
	for (const s of SKILLS) rows[DEPTH[s.id]].push(s);
	const pos = new Map<string, number>();
	const sync = () => {
		for (const r of rows) {
			r.forEach((s, i) => {
				pos.set(s.id, i);
			});
		}
	};
	sync();
	for (let pass = 0; pass < 8; pass++) {
		const down = pass % 2 === 0;
		const seq = rows.map((_, i) => i);
		if (!down) seq.reverse();
		for (const ri of seq) {
			const row = rows[ri];
			const bary = (s: Skill) => {
				const refs = down ? s.requires : (CHILDREN[s.id] ?? []);
				if (refs.length === 0) return pos.get(s.id) ?? 0;
				let sum = 0;
				for (const id of refs) sum += pos.get(id) ?? 0;
				return sum / refs.length;
			};
			const scored = row.map((s, i) => ({ s, b: bary(s), i }));
			scored.sort((a, b) => a.b - b.b || a.i - b.i);
			rows[ri] = scored.map((x) => x.s);
			sync();
		}
	}
	return rows;
})();

/** 全部连线：from 是前置，to 是后置 */
const EDGES = SKILLS.flatMap((s) =>
	s.requires.map((r) => ({ from: r, to: s.id })),
);

/** 给每条线分配 3 条横向轨道之一，避免所有折线的横段叠在一起 */
const TRACK: Record<string, number> = Object.fromEntries(
	EDGES.map((e, i) => [`${e.from}>${e.to}`, i % 3]),
);

/**
 * 每个方块给一点纵向错位，打散「一层一条直线」的网格感。
 * 幅度控制在 ±10px，不会串层；箭头是渲染后实测坐标画的，所以错位不影响连线精度。
 */
const JITTER: Record<string, number> = Object.fromEntries(
	SKILLS.map((s) => {
		let h = 0;
		for (let i = 0; i < s.id.length; i++)
			h = (h * 31 + s.id.charCodeAt(i)) % 9973;
		return [s.id, (h % 21) - 10];
	}),
);

/* ===================== 等级状态 ===================== */
let levels = $state<Record<string, number>>({ ...PRESET });

function persist() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
	} catch {
		/* 隐私模式下写不进去也无所谓 */
	}
}

/** 读取本地进度：既认新格式 {id: level}，也认老格式 [id, ...] */
function readStored() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const parsed = JSON.parse(raw);
		const next: Record<string, number> = {};
		if (Array.isArray(parsed)) {
			const ids = new Set(SKILLS.map((s) => s.id));
			for (const id of parsed)
				if (typeof id === "string" && ids.has(id)) next[id] = 2;
		} else if (parsed && typeof parsed === "object") {
			for (const s of SKILLS) {
				const v = (parsed as Record<string, unknown>)[s.id];
				if (typeof v === "number")
					next[s.id] = Math.min(MAX_LEVEL, Math.max(0, Math.round(v)));
			}
		}
		if (Object.keys(next).length) levels = next;
	} catch {
		/* 数据坏了就用预设 */
	}
}

/* ===================== 主题 ===================== */
let dark = $state(false);

/* ===================== 布局测量 ===================== */
type Box = { x: number; y: number; w: number; h: number };
let canvasEl = $state<HTMLDivElement | null>(null);
let scrollEl = $state<HTMLDivElement | null>(null);
let overflowing = $state(false);
let boxes = $state<Record<string, Box>>({});
let canvasSize = $state({ w: 0, h: 0 });

function measure() {
	const el = canvasEl;
	if (!el) return;
	const base = el.getBoundingClientRect();
	const next: Record<string, Box> = {};
	for (const tile of el.querySelectorAll<HTMLElement>("[data-id]")) {
		const r = tile.getBoundingClientRect();
		next[tile.dataset.id as string] = {
			x: r.left - base.left,
			y: r.top - base.top,
			w: r.width,
			h: r.height,
		};
	}
	boxes = next;
	canvasSize = { w: base.width, h: base.height };
	if (scrollEl) overflowing = scrollEl.scrollWidth > scrollEl.clientWidth + 1;
}

/* ===================== 交互状态 ===================== */
let hoverId = $state<string | null>(null);
let shakeId = $state<string | null>(null);
let toast = $state("");

/** 悬浮时点亮的整条链路：自己 + 所有前置 + 所有后置 */
const focusSet = $derived.by(() => {
	const set = new Set<string>();
	if (!hoverId) return set;
	set.add(hoverId);
	const up = [...(SKILL_MAP[hoverId]?.requires ?? [])];
	while (up.length) {
		const c = up.pop() as string;
		if (set.has(c)) continue;
		set.add(c);
		up.push(...(SKILL_MAP[c]?.requires ?? []));
	}
	const down = [...(CHILDREN[hoverId] ?? [])];
	while (down.length) {
		const c = down.pop() as string;
		if (set.has(c)) continue;
		set.add(c);
		down.push(...(CHILDREN[c] ?? []));
	}
	return set;
});

/* ===================== 派生数据 ===================== */
function stateOf(s: Skill): "locked" | "ready" | "learning" | "max" {
	if (!s.requires.every((r) => (levels[r] ?? 0) > 0)) return "locked";
	const lv = levels[s.id] ?? 0;
	if (lv >= MAX_LEVEL) return "max";
	if (lv > 0) return "learning";
	return "ready";
}

const stats = $derived.by(() => {
	const groupPoints: Record<string, number> = {};
	let points = 0;
	let lit = 0;
	let maxed = 0;
	let untouched = 0;
	for (const s of SKILLS) {
		const lv = levels[s.id] ?? 0;
		points += lv;
		if (lv > 0) lit++;
		if (lv >= MAX_LEVEL) maxed++;
		if (lv < 3) untouched++;
		groupPoints[s.group] = (groupPoints[s.group] ?? 0) + lv;
	}
	const pct = Math.round((points / MAX_POINTS) * 100);
	let title = TITLES[0];
	for (const t of TITLES) if (pct >= t.min) title = t;
	return {
		points,
		lit,
		maxed,
		untouched,
		pct,
		title,
		litGroups: GROUPS.filter((g) => (groupPoints[g.id] ?? 0) > 0).length,
	};
});

/** 连线：起点是前置方块底边中心，终点是后置方块顶边中心，中间走直角折线 */
const wires = $derived.by(() => {
	const out: {
		key: string;
		d: string;
		head: string;
		state: "on" | "half" | "off";
		hot: boolean;
		dim: boolean;
	}[] = [];
	for (const e of EDGES) {
		const p = boxes[e.from];
		const c = boxes[e.to];
		if (!p || !c) continue;
		const x1 = p.x + p.w / 2;
		const y1 = p.y + p.h;
		const x2 = c.x + c.w / 2;
		const y2 = c.y;
		const dy = y2 - y1;
		if (dy <= 3) continue;
		const t = [0.36, 0.5, 0.64][TRACK[`${e.from}>${e.to}`] ?? 0];
		const ym = y1 + dy * t;
		let d: string;
		if (Math.abs(x2 - x1) < 6) {
			d = `M ${x1} ${y1} V ${y2}`;
		} else {
			const dir = Math.sign(x2 - x1);
			const r = Math.min(9, Math.abs(x2 - x1) / 2, dy / 3);
			d =
				`M ${x1} ${y1} V ${ym - r} Q ${x1} ${ym} ${x1 + dir * r} ${ym}` +
				` H ${x2 - dir * r} Q ${x2} ${ym} ${x2} ${ym + r} V ${y2}`;
		}
		const fromLv = levels[e.from] ?? 0;
		const toLv = levels[e.to] ?? 0;
		const hot = focusSet.has(e.from) && focusSet.has(e.to);
		out.push({
			key: `${e.from}>${e.to}`,
			d,
			head: `M ${x2 - 4.4} ${y2 - 6.2} L ${x2} ${y2} L ${x2 + 4.4} ${y2 - 6.2}`,
			state: fromLv > 0 && toLv > 0 ? "on" : fromLv > 0 ? "half" : "off",
			hot,
			dim: !!hoverId && !hot,
		});
	}
	return out;
});

const active = $derived(hoverId ? SKILL_MAP[hoverId] : null);
const dirty = $derived(
	SKILLS.some((s) => (levels[s.id] ?? 0) !== PRESET[s.id]),
);

/* ===================== 操作 ===================== */
function flash(msg: string) {
	toast = msg;
	setTimeout(() => {
		if (toast === msg) toast = "";
	}, 2600);
}

function bump(s: Skill, delta: number) {
	if (stateOf(s) === "locked") {
		const missing = s.requires.filter((r) => (levels[r] ?? 0) <= 0);
		shakeId = s.id;
		setTimeout(() => {
			if (shakeId === s.id) shakeId = null;
		}, 480);
		flash(
			`先点亮：${missing.map((r) => SKILL_MAP[r]?.short ?? r).join(" · ")}`,
		);
		return;
	}
	const cur = levels[s.id] ?? 0;
	const next = Math.min(MAX_LEVEL, Math.max(0, cur + delta));
	if (next === cur) return;
	levels = { ...levels, [s.id]: next };
	persist();
}

function resetToPreset() {
	levels = { ...PRESET };
	persist();
	flash("已恢复出厂预设");
}

function clearAll() {
	const next: Record<string, number> = {};
	for (const s of SKILLS) next[s.id] = 0;
	levels = next;
	persist();
	flash("已全部清零，从头再来");
}

/* ===================== 生命周期 ===================== */
function scheduleMeasure() {
	requestAnimationFrame(() => measure());
}

onMount(() => {
	dark = document.documentElement.classList.contains("dark");
	const mo = new MutationObserver(() => {
		dark = document.documentElement.classList.contains("dark");
	});
	mo.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	readStored();
	scheduleMeasure();

	const ro = new ResizeObserver(() => measure());
	const el = canvasEl;
	if (el) {
		ro.observe(el);
		for (const child of el.children) ro.observe(child);
	}
	window.addEventListener("resize", scheduleMeasure);
	document.fonts?.ready.then(() => measure()).catch(() => {});

	return () => {
		mo.disconnect();
		ro.disconnect();
		window.removeEventListener("resize", scheduleMeasure);
	};
});

/** 渲染完成后再量一次，箭头才跟得上布局 */
$effect(() => {
	void canvasEl;
	void ROWS;
	scheduleMeasure();
});
</script>

<div class="sk-root">
	<!-- ===================== 头部 ===================== -->
	<header class="sk-head">
		<div class="sk-head-l">
			<p class="sk-eyebrow">SKILL GRAPH</p>
			<h2 class="sk-title">前端技能图</h2>
			<p class="sk-desc">
				每一层的技术份量相同，方块上是真实的技术 logo。连线代表真实的前置关系——
				上面点亮了，下面才解锁。把鼠标放到方块上，会高亮它的整条学习链路。
			</p>
		</div>
		<div class="sk-stats">
			<div class="sk-stat">
				<span class="sk-stat-num">{stats.points}<em>/{MAX_POINTS}</em></span>
				<span class="sk-stat-cap">技能点</span>
			</div>
			<div class="sk-stat">
				<span class="sk-stat-num">{stats.pct}<em>%</em></span>
				<span class="sk-stat-cap">总掌握度</span>
			</div>
			<div class="sk-stat">
				<span class="sk-stat-num">{stats.lit}<em>/{TOTAL_SKILLS}</em></span>
				<span class="sk-stat-cap">已点亮</span>
			</div>
			<div class="sk-stat">
				<span class="sk-stat-num">{stats.litGroups}<em>/{GROUPS.length}</em></span>
				<span class="sk-stat-cap">已开启方向</span>
			</div>
		</div>
	</header>

	<!-- ===================== 图例 + 操作 ===================== -->
	<div class="sk-bar">
		<ul class="sk-legend">
			<li class="is-locked"><i></i>未解锁</li>
			<li class="is-ready"><i></i>可开始</li>
			<li class="is-learning"><i></i>学习中</li>
			<li class="is-max"><i></i>已精通</li>
			<li class="is-wire"><i></i>前置已打通</li>
		</ul>
		<div class="sk-acts">
			<button class="sk-act" disabled={!dirty} onclick={resetToPreset}>恢复预设</button>
			<button class="sk-act" onclick={clearAll}>全部清零</button>
		</div>
	</div>

	<!-- ===================== 技能图 ===================== -->
	<div class="sk-stage">
		<div class="sk-scroll" bind:this={scrollEl}>
			<div class="sk-canvas" bind:this={canvasEl}>
				<svg
					class="sk-wires"
					width={canvasSize.w}
					height={canvasSize.h}
					viewBox={`0 0 ${canvasSize.w} ${canvasSize.h}`}
					aria-hidden="true"
				>
					{#each wires as w (w.key)}
						<g
							class="sk-wire"
							class:on={w.state === "on"}
							class:half={w.state === "half"}
							class:hot={w.hot}
							class:dim={w.dim}
						>
							<path class="sk-wire-track" d={w.d}></path>
							<path class="sk-wire-glow" d={w.d}></path>
							<path class="sk-wire-line" d={w.d}></path>
							<path class="sk-wire-head" d={w.head}></path>
						</g>
					{/each}
				</svg>

				{#each ROWS as row, ri (ri)}
					<div class="sk-row">
						{#each row as s (s.id)}
							{@const lv = levels[s.id] ?? 0}
							{@const st = stateOf(s)}
							<div
								class="sk-cell"
								class:hot={focusSet.has(s.id)}
								class:dim={!!hoverId && !focusSet.has(s.id)}
								style={`--gc:${GROUP_COLORS[s.group] ?? "#9a8f78"};--jy:${JITTER[s.id] ?? 0}px`}
							>
								<button
									type="button"
									class="sk-tile"
									class:shake={shakeId === s.id}
									data-id={s.id}
									data-lv={lv}
									data-state={st}
									aria-label={`${s.name}，当前 ${LEVELS[lv]?.name ?? ""}`}
									onmouseenter={() => (hoverId = s.id)}
									onmouseleave={() => (hoverId = null)}
									onfocus={() => (hoverId = s.id)}
									onblur={() => (hoverId = null)}
									onclick={() => bump(s, 1)}
									oncontextmenu={(e) => {
										e.preventDefault();
										bump(s, -1);
									}}
								>
									<span class="sk-face">
										<span class="sk-water" style={`height:${(lv / MAX_LEVEL) * 100}%`}></span>
										<svg class="sk-logo" viewBox="0 0 24 24" aria-hidden="true">
											<path
												d={TECH_ICONS[s.id]?.d ?? ""}
												fill={iconColor(s.id, s.group, lv > 0 && st !== "locked", dark)}
											></path>
										</svg>
										<span class="sk-lv">{lv}</span>
										{#if st === "locked"}
											<span class="sk-lockmark">需前置</span>
										{/if}
									</span>
								</button>
								<span class="sk-name">{s.short}</span>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
		{#if overflowing}
			<p class="sk-scroll-hint">技能图比屏幕宽，左右滑动可以看完整</p>
		{/if}
	</div>

	<!-- ===================== 底部：角色面板 + 详情 ===================== -->
	<footer class="sk-foot">
		<div class="sk-hero">
			<div class="sk-portrait">
				<img src={avatarUrl} alt={profileConfig.name} />
				<span class="sk-portrait-lv">{stats.pct}%</span>
			</div>
			<div class="sk-hero-info">
				<p class="sk-hero-name">
					{profileConfig.name} <b>{stats.title.name}</b>
				</p>
				<p class="sk-hero-note">{stats.title.note}</p>
				<ul class="sk-attrs">
					<li><span>熟练度</span><b>{stats.pct}%</b></li>
					<li><span>满级技能</span><b>{stats.maxed}</b></li>
					<li><span>待攻克</span><b>{stats.untouched}</b></li>
				</ul>
			</div>
		</div>

		<div class="sk-detail">
			{#if active}
				{@const lv = levels[active.id] ?? 0}
				{@const st = stateOf(active)}
				<div class="sk-detail-head">
					<svg class="sk-detail-logo" viewBox="0 0 24 24" aria-hidden="true">
						<path
							d={TECH_ICONS[active.id]?.d ?? ""}
							fill={iconColor(active.id, active.group, lv > 0 && st !== "locked", dark)}
						></path>
					</svg>
					<div>
						<p class="sk-detail-name">
							{active.name}
							<span
								class="sk-detail-group"
								style={`--gc:${GROUP_COLORS[active.group] ?? "#9a8f78"}`}
							>
								{GROUP_MAP[active.group]?.short ?? ""}
							</span>
						</p>
						<p class="sk-detail-lv">
							等级 <b>{lv}</b> / {MAX_LEVEL} · {LEVELS[lv]?.name}
							{#if st === "locked"}<i class="sk-tag-warn">未解锁</i>{/if}
							{#if st === "max"}<i class="sk-tag-max">已精通</i>{/if}
						</p>
					</div>
				</div>
				<p class="sk-detail-note">{active.note}</p>
				{#if active.requires.length}
					<p class="sk-detail-sub">
						前置：{active.requires
							.map((r) => `${SKILL_MAP[r]?.short ?? r}(${levels[r] ?? 0})`)
							.join(" · ")}
					</p>
				{:else}
					<p class="sk-detail-sub">前置：无，这是起点</p>
				{/if}
				{#if CHILDREN[active.id]?.length}
					<p class="sk-detail-sub">
						解锁：{CHILDREN[active.id].map((c) => SKILL_MAP[c]?.short ?? c).join(" · ")}
					</p>
				{/if}
				<ul class="sk-detail-tips">
					{#each active.tips.slice(0, 3) as t (t)}
						<li>{t}</li>
					{/each}
				</ul>
				<p class="sk-detail-judge">
					<em>到 {LEVELS[Math.min(MAX_LEVEL, lv + 1)]?.name}</em>
					{LEVELS[lv]?.judge ?? ""}
				</p>
			{:else}
				<p class="sk-detail-hint">
					把鼠标移到任意方块上，这里会显示它的说明、前置与解锁项，技能图里会同步高亮整条链路。
				</p>
				<ul class="sk-detail-tips">
					<li>左键点方块升一级，右键降一级，进度自动存在浏览器里</li>
					<li>方块里的水位越高越亮，说明掌握得越扎实</li>
					<li>虚线框加斜纹的方块还没解锁，先把它的前置点亮</li>
				</ul>
			{/if}
		</div>
	</footer>

	{#if toast}
		<p class="sk-toast">{toast}</p>
	{/if}
</div>

<style>
	/* ===================== 设计令牌 ===================== */
	.sk-root {
		--gold: #c9a44c;
		--gold-lt: #e7d09a;
		--gold-dp: #8a6d24;
		--ink: #4a4335;
		--ink-2: #857d6c;
		--face-1: #fffefa;
		--face-2: #f5eedc;
		--panel-1: #fffdf7;
		--panel-2: #f8f2e5;
		--grid: rgba(150, 128, 76, 0.1);
		--wire: rgba(176, 146, 78, 0.5);
		--line: rgba(150, 128, 76, 0.22);
		color: var(--ink);
	}

	:global(html.dark) .sk-root {
		--gold: #d9b45f;
		--gold-lt: #f0dda8;
		--gold-dp: #a9862f;
		--ink: #e9e1ce;
		--ink-2: #a79d88;
		--face-1: #2c251a;
		--face-2: #1c1710;
		--panel-1: #211b13;
		--panel-2: #17130d;
		--grid: rgba(216, 186, 116, 0.07);
		--wire: rgba(214, 178, 96, 0.4);
		--line: rgba(214, 178, 96, 0.16);
	}

	/* ===================== 头部 ===================== */
	.sk-head {
		display: flex;
		flex-wrap: wrap;
		gap: 1.4rem 2rem;
		align-items: flex-end;
		justify-content: space-between;
	}
	.sk-eyebrow {
		margin: 0 0 0.2rem;
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.24em;
		color: color-mix(in srgb, var(--gold-dp) 88%, transparent);
	}
	.sk-title {
		margin: 0;
		font-size: clamp(1.4rem, 2.6vw, 1.9rem);
		font-weight: 800;
		letter-spacing: 0.01em;
	}
	.sk-desc {
		max-width: 46rem;
		margin: 0.5rem 0 0;
		font-size: 0.82rem;
		line-height: 1.72;
		color: var(--ink-2);
	}
	.sk-stats {
		display: flex;
		gap: clamp(0.9rem, 2.4vw, 2rem);
	}
	.sk-stat {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.sk-stat-num {
		font-size: clamp(1.1rem, 2vw, 1.42rem);
		font-weight: 800;
		line-height: 1.1;
		color: var(--gold-dp);
		font-variant-numeric: tabular-nums;
	}
	.sk-stat-num em {
		font-style: normal;
		font-size: 0.62em;
		font-weight: 600;
		opacity: 0.6;
	}
	.sk-stat-cap {
		font-size: 0.66rem;
		color: var(--ink-2);
	}

	/* ===================== 图例条 ===================== */
	.sk-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem 1.2rem;
		align-items: center;
		justify-content: space-between;
		margin-top: 1.1rem;
		padding: 0.6rem 0.85rem;
		border: 1px solid var(--line);
		border-radius: 0.85rem;
		background: var(--panel-2);
	}
	.sk-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.sk-legend li {
		display: inline-flex;
		align-items: center;
		gap: 0.36rem;
		font-size: 0.68rem;
		color: var(--ink-2);
	}
	.sk-legend i {
		display: block;
		width: 13px;
		height: 13px;
		border-radius: 4px;
		border: 1px solid var(--line);
		background: var(--face-1);
	}
	.sk-legend .is-locked i {
		border-style: dashed;
		background: repeating-linear-gradient(
			45deg,
			transparent 0 3px,
			color-mix(in srgb, var(--ink-2) 22%, transparent) 3px 5px
		);
	}
	.sk-legend .is-ready i {
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gold) 45%, transparent);
	}
	.sk-legend .is-learning i {
		background: linear-gradient(
			180deg,
			var(--face-1) 42%,
			color-mix(in srgb, var(--gold) 26%, var(--face-1))
		);
	}
	.sk-legend .is-max i {
		border-color: var(--gold);
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--gold) 40%, var(--face-1)),
			var(--gold)
		);
		box-shadow: 0 0 7px color-mix(in srgb, var(--gold) 55%, transparent);
	}
	.sk-legend .is-wire i {
		width: 18px;
		height: 2px;
		border: 0;
		border-radius: 2px;
		background: var(--wire);
	}
	.sk-acts {
		display: flex;
		gap: 0.5rem;
	}
	.sk-act {
		padding: 0.3rem 0.72rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: var(--face-1);
		font-size: 0.68rem;
		color: var(--ink);
		cursor: pointer;
		transition: border-color 160ms ease, color 160ms ease;
	}
	.sk-act:hover:not(:disabled) {
		border-color: var(--gold);
		color: var(--gold-dp);
	}
	.sk-act:disabled {
		opacity: 0.4;
		cursor: default;
	}

	/* ===================== 画布 ===================== */
	.sk-stage {
		position: relative;
		margin-top: 1rem;
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: linear-gradient(158deg, var(--panel-1), var(--panel-2));
		overflow: hidden;
	}
	.sk-stage::before {
		content: "";
		position: absolute;
		inset: 0;
		background-image: radial-gradient(var(--grid) 1px, transparent 1px);
		background-size: 22px 22px;
		pointer-events: none;
	}
	.sk-scroll {
		position: relative;
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: thin;
	}
	.sk-canvas {
		/* 列宽：最宽的一层有 16 个方块，按它定最小宽度 */
		--tile: 54px;
		--gx: 18px;
		--gy: 44px;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--gy);
		min-width: calc(var(--tile) * 16 + var(--gx) * 15 + 2.4rem);
		padding: 1.5rem 1.2rem 1.7rem;
	}

	/* 每层一行，居中；方块之间留出连线走线的空隙 */
	.sk-row {
		position: relative;
		z-index: 1;
		display: flex;
		flex-wrap: nowrap;
		gap: var(--gx);
		justify-content: center;
	}
	.sk-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		flex: none;
		transform: translateY(var(--jy, 0px));
		transition: opacity 220ms ease, transform 220ms ease;
	}
	.sk-cell.hot {
		transform: translateY(calc(var(--jy, 0px) - 3px));
	}
	.sk-cell.dim {
		opacity: 0.34;
	}

	/* ===================== 方块 ===================== */
	.sk-tile {
		position: relative;
		width: var(--tile);
		height: var(--tile);
		padding: 2px;
		border: 0;
		border-radius: 15px;
		background: linear-gradient(158deg, var(--gold-lt), var(--gold) 46%, var(--gold-dp));
		box-shadow:
			0 2px 5px color-mix(in srgb, var(--gold-dp) 30%, transparent),
			inset 0 1px 0 color-mix(in srgb, #fff 45%, transparent);
		cursor: pointer;
		transition: transform 180ms ease, box-shadow 220ms ease;
	}
	.sk-tile:hover {
		transform: translateY(-2px);
		box-shadow:
			0 6px 16px color-mix(in srgb, var(--gold-dp) 34%, transparent),
			inset 0 1px 0 color-mix(in srgb, #fff 55%, transparent);
	}
	.sk-tile:focus-visible {
		outline: 2px solid var(--gold-dp);
		outline-offset: 3px;
	}
	.sk-face {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		border-radius: 13px;
		background: linear-gradient(180deg, var(--face-1), var(--face-2));
		overflow: hidden;
	}
	/* 水位：level 越高填得越满，这就是「亮度」的主信号。刻意压低不透明度，别糊住 logo */
	.sk-water {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--gc) 26%, transparent),
			color-mix(in srgb, var(--gc) 58%, transparent)
		);
		opacity: 0.42;
		transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.sk-logo {
		position: relative;
		width: 58%;
		height: 58%;
		transition: transform 200ms ease;
	}
	.sk-tile:hover .sk-logo {
		transform: scale(1.08);
	}
	.sk-lv {
		position: absolute;
		right: 3px;
		bottom: 2px;
		min-width: 15px;
		padding: 0 3px;
		border-radius: 5px;
		background: color-mix(in srgb, var(--gold-dp) 82%, #000);
		font-size: 0.58rem;
		font-weight: 800;
		line-height: 1.45;
		text-align: center;
		color: #fbf3dd;
		font-variant-numeric: tabular-nums;
	}
	.sk-lockmark {
		position: absolute;
		top: 2px;
		left: 3px;
		font-size: 0.46rem;
		color: color-mix(in srgb, var(--ink-2) 92%, transparent);
	}

	/* 未解锁：虚线描边 + 斜纹遮罩 */
	.sk-tile[data-state="locked"] {
		background: none;
		border: 1px dashed color-mix(in srgb, var(--ink-2) 45%, transparent);
		box-shadow: none;
	}
	.sk-tile[data-state="locked"] .sk-face {
		background:
			repeating-linear-gradient(
				45deg,
				transparent 0 4px,
				color-mix(in srgb, var(--ink-2) 13%, transparent) 4px 7px
			),
			var(--face-2);
	}
	/* 可开始：金色描边，提示「这个现在就能点」 */
	.sk-tile[data-state="ready"] {
		box-shadow:
			0 2px 5px color-mix(in srgb, var(--gold-dp) 30%, transparent),
			0 0 0 2px color-mix(in srgb, var(--gold) 24%, transparent);
	}
	/* 精通：强光晕 */
	.sk-tile[data-state="max"] {
		box-shadow:
			0 3px 9px color-mix(in srgb, var(--gold-dp) 40%, transparent),
			0 0 16px color-mix(in srgb, var(--gold) 62%, transparent),
			inset 0 1px 0 color-mix(in srgb, #fff 60%, transparent);
	}
	.sk-tile.shake {
		animation: sk-shake 420ms ease;
	}
	@keyframes sk-shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20% {
			transform: translateX(-4px);
		}
		40% {
			transform: translateX(4px);
		}
		60% {
			transform: translateX(-3px);
		}
		80% {
			transform: translateX(2px);
		}
	}

	.sk-name {
		position: relative;
		z-index: 2;
		max-width: calc(var(--tile) + var(--gx));
		padding: 0.05rem 0.28rem;
		border-radius: 0.3rem;
		/* 实心底衬：把从方块底部垂下来的连线挡在名字后面，不然字会被金线穿过 */
		background: var(--panel-1);
		font-size: 0.62rem;
		line-height: 1.25;
		color: var(--ink-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.sk-cell.hot .sk-name {
		color: var(--gold-dp);
		font-weight: 700;
	}
	/* 焦点方块单独套一圈金环，一眼看出链路是从它出发的 */
	.sk-cell.hot .sk-tile {
		box-shadow:
			0 0 0 2px var(--gold-dp),
			0 0 18px color-mix(in srgb, var(--gold) 60%, transparent),
			inset 0 1px 0 color-mix(in srgb, #fff 55%, transparent);
	}

	/* ===================== 连线 ===================== */
	.sk-wires {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 0;
		pointer-events: none;
		overflow: visible;
	}
	.sk-wire {
		transition: opacity 200ms ease;
	}
	.sk-wire path {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	/* 离线：很淡的灰，只是告诉你「这里以后会连上」 */
	.sk-wire .sk-wire-track {
		stroke: color-mix(in srgb, var(--ink-2) 17%, transparent);
		stroke-width: 5;
	}
	.sk-wire .sk-wire-glow {
		stroke: none;
	}
	.sk-wire .sk-wire-line {
		stroke: color-mix(in srgb, var(--ink-2) 26%, transparent);
		stroke-width: 1.6;
	}
	.sk-wire .sk-wire-head {
		stroke: color-mix(in srgb, var(--ink-2) 34%, transparent);
		stroke-width: 1.7;
	}
	/* 前置点亮但后置没点：半亮 */
	.sk-wire.half .sk-wire-track {
		stroke: color-mix(in srgb, var(--gold) 20%, transparent);
	}
	.sk-wire.half .sk-wire-line {
		stroke: color-mix(in srgb, var(--gold) 58%, transparent);
	}
	.sk-wire.half .sk-wire-head {
		stroke: color-mix(in srgb, var(--gold) 72%, transparent);
	}
	/* 两头都点亮：金色实线。刻意压暗，避免 140 条线一起抢戏 */
	.sk-wire.on .sk-wire-track {
		stroke: color-mix(in srgb, var(--gold-dp) 15%, transparent);
	}
	.sk-wire.on .sk-wire-line {
		stroke: color-mix(in srgb, var(--gold) 74%, transparent);
		stroke-width: 1.5;
	}
	.sk-wire.on .sk-wire-head {
		stroke: color-mix(in srgb, var(--gold) 80%, transparent);
		stroke-width: 1.6;
	}
	/* 悬浮链路：加粗 + 发光，这时候才让它成为主角 */
	.sk-wire.hot .sk-wire-track {
		stroke: color-mix(in srgb, var(--gold) 30%, transparent);
	}
	.sk-wire.hot .sk-wire-glow {
		stroke: color-mix(in srgb, var(--gold) 32%, transparent);
		stroke-width: 7;
	}
	.sk-wire.hot .sk-wire-line,
	.sk-wire.hot .sk-wire-head {
		stroke: color-mix(in srgb, var(--gold-dp) 95%, #000 5%);
		stroke-width: 2.3;
	}
	.sk-wire.dim {
		opacity: 0.16;
	}

	.sk-scroll-hint {
		margin: 0;
		padding: 0 0 0.6rem;
		font-size: 0.66rem;
		text-align: center;
		color: var(--ink-2);
	}

	/* ===================== 底部面板 ===================== */
	.sk-foot {
		display: grid;
		grid-template-columns: minmax(0, 20rem) minmax(0, 1fr);
		gap: 1rem;
		margin-top: 1rem;
	}
	.sk-hero,
	.sk-detail {
		padding: 0.95rem 1.05rem;
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: linear-gradient(160deg, var(--panel-1), var(--panel-2));
	}
	.sk-hero {
		display: flex;
		gap: 0.95rem;
		align-items: center;
	}
	.sk-portrait {
		position: relative;
		flex: none;
		width: 66px;
		height: 66px;
	}
	.sk-portrait img {
		width: 100%;
		height: 100%;
		border: 2px solid var(--gold);
		border-radius: 14px;
		object-fit: cover;
		box-shadow: 0 4px 14px color-mix(in srgb, var(--gold-dp) 30%, transparent);
	}
	.sk-portrait-lv {
		position: absolute;
		right: -7px;
		bottom: -7px;
		min-width: 34px;
		padding: 0.06rem 0.26rem;
		border: 1px solid var(--gold-dp);
		border-radius: 7px;
		background: linear-gradient(180deg, #3a2f16, #221b0c);
		font-size: 0.6rem;
		font-weight: 800;
		text-align: center;
		color: color-mix(in srgb, var(--gold-lt) 92%, #fff);
		font-variant-numeric: tabular-nums;
	}
	.sk-hero-info {
		min-width: 0;
	}
	.sk-hero-name {
		margin: 0;
		font-size: 0.86rem;
		color: var(--ink-2);
	}
	.sk-hero-name b {
		margin-left: 0.3rem;
		font-size: 1.02rem;
		color: var(--gold-dp);
	}
	.sk-hero-note {
		margin: 0.28rem 0 0.6rem;
		font-size: 0.72rem;
		color: var(--ink-2);
	}
	.sk-attrs {
		display: flex;
		gap: 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.sk-attrs li {
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
	}
	.sk-attrs span {
		font-size: 0.62rem;
		color: var(--ink-2);
	}
	.sk-attrs b {
		font-size: 0.86rem;
		color: var(--gold-dp);
		font-variant-numeric: tabular-nums;
	}

	.sk-detail-head {
		display: flex;
		gap: 0.7rem;
		align-items: center;
	}
	.sk-detail-logo {
		flex: none;
		width: 30px;
		height: 30px;
	}
	.sk-detail-name {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0;
		font-size: 0.94rem;
		font-weight: 800;
	}
	.sk-detail-group {
		padding: 0.04rem 0.36rem;
		border-radius: 99px;
		background: color-mix(in srgb, var(--gc) 18%, transparent);
		font-size: 0.6rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--gc) 88%, var(--ink));
	}
	.sk-detail-lv {
		margin: 0.16rem 0 0;
		font-size: 0.68rem;
		color: var(--ink-2);
	}
	.sk-detail-lv b {
		color: var(--gold-dp);
	}
	.sk-tag-warn,
	.sk-tag-max {
		margin-left: 0.35rem;
		padding: 0.02rem 0.34rem;
		border-radius: 99px;
		font-size: 0.6rem;
		font-style: normal;
	}
	.sk-tag-warn {
		background: color-mix(in srgb, #c2557a 16%, transparent);
		color: #a83e60;
	}
	.sk-tag-max {
		background: color-mix(in srgb, var(--gold) 24%, transparent);
		color: var(--gold-dp);
	}
	.sk-detail-note {
		margin: 0.6rem 0 0;
		font-size: 0.78rem;
		line-height: 1.7;
	}
	.sk-detail-sub {
		margin: 0.5rem 0 0;
		font-size: 0.7rem;
		line-height: 1.6;
		color: var(--ink-2);
	}
	.sk-detail-tips {
		margin: 0.55rem 0 0;
		padding: 0;
		list-style: none;
	}
	.sk-detail-tips li {
		position: relative;
		padding-left: 0.85rem;
		font-size: 0.72rem;
		line-height: 1.68;
		color: var(--ink-2);
	}
	.sk-detail-tips li::before {
		content: "";
		position: absolute;
		left: 0.15rem;
		top: 0.62em;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--gold);
	}
	.sk-detail-judge {
		margin: 0.6rem 0 0;
		padding: 0.5rem 0.7rem;
		border-left: 2px solid var(--gold);
		border-radius: 0 0.5rem 0.5rem 0;
		background: color-mix(in srgb, var(--gold) 8%, transparent);
		font-size: 0.7rem;
		line-height: 1.6;
		color: var(--ink-2);
	}
	.sk-detail-judge em {
		display: block;
		margin-bottom: 0.1rem;
		font-style: normal;
		font-weight: 700;
		color: var(--gold-dp);
	}
	.sk-detail-hint {
		margin: 0;
		font-size: 0.76rem;
		line-height: 1.7;
		color: var(--ink-2);
	}

	/* ===================== 提示条 ===================== */
	.sk-toast {
		position: sticky;
		bottom: 0.8rem;
		z-index: 5;
		width: fit-content;
		margin: 0.8rem auto 0;
		padding: 0.44rem 0.9rem;
		border: 1px solid color-mix(in srgb, var(--gold) 45%, transparent);
		border-radius: 99px;
		background: color-mix(in srgb, var(--gold-dp) 88%, #000);
		font-size: 0.72rem;
		color: #fdf5e2;
		box-shadow: 0 6px 18px color-mix(in srgb, var(--gold-dp) 34%, transparent);
	}

	/* ===================== 响应式 ===================== */
	@media (max-width: 1240px) {
		.sk-canvas {
			--tile: 48px;
			--gx: 15px;
			--gy: 38px;
		}
	}
	@media (max-width: 1024px) {
		.sk-canvas {
			--tile: 43px;
			--gx: 13px;
			--gy: 34px;
		}
		.sk-foot {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	@media (max-width: 820px) {
		.sk-canvas {
			--tile: 40px;
			--gx: 11px;
			--gy: 30px;
			padding: 1.1rem 0.9rem 1.2rem;
		}
		.sk-name {
			display: none;
		}
		.sk-stats {
			width: 100%;
			justify-content: space-between;
		}
		.sk-lockmark {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sk-tile,
		.sk-cell,
		.sk-water,
		.sk-logo,
		.sk-wire {
			transition: none !important;
			animation: none !important;
		}
	}
</style>
