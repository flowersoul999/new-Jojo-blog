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
import { onMount, tick } from "svelte";
import avatarUrl from "@/assets/images/jojo-avatar.webp";
import { profileConfig } from "@/config/profileConfig";
import {
	ATTR_MAP,
	ATTRS,
	GROUP_ATTR,
	GROUPS,
	LEVELS,
	MAX_LEVEL,
	PRESET,
	SKILL_MAP,
	SKILLS,
	type Skill,
	TOTAL_SKILLS,
} from "@/data/skills";
import {
	GROUP_COLORS,
	type IconState,
	iconColor,
	TECH_ICONS,
} from "@/data/techIcons";

const STORAGE_KEY = "aemeath-skill-tree";
const MAX_POINTS = TOTAL_SKILLS * MAX_LEVEL;
const GROUP_MAP: Record<string, (typeof GROUPS)[number]> = Object.fromEntries(
	GROUPS.map((g) => [g.id, g]),
);

/** 每个方向有多少个技能 —— 用来算方向的满点上限与平均值 */
const GROUP_SIZE: Record<string, number> = (() => {
	const m: Record<string, number> = {};
	for (const s of SKILLS) m[s.group] = (m[s.group] ?? 0) + 1;
	return m;
})();

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

/* ---------- 悬停浮层：跟着方块走，永远不出屏 ---------- */
let tipEl = $state<HTMLDivElement | null>(null);
let tipPos = $state({ x: 0, y: 0, above: false, ready: false });

/**
 * 找 position:fixed 的「包含块」。
 * 主题的 #content-wrapper 上有 transform: translateZ(0)（GPU 合成用），
 * 只要祖先里有一个 transform / filter / will-change，fixed 就不再相对视口定位，
 * 而是相对那个祖先。这里把祖先的矩形算出来，后面统一换算，位置才不会偏。
 */
function fixedContainingBlock(el: HTMLElement | null) {
	let p = el?.parentElement ?? null;
	while (p && p !== document.body && p !== document.documentElement) {
		const cs = getComputedStyle(p);
		if (
			cs.transform !== "none" ||
			cs.filter !== "none" ||
			cs.perspective !== "none" ||
			cs.willChange === "transform" ||
			cs.contain.includes("paint") ||
			cs.contain.includes("layout")
		) {
			const r = p.getBoundingClientRect();
			return { x: r.left, y: r.top, w: r.width, h: r.height };
		}
		p = p.parentElement;
	}
	return { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
}

function placeTip() {
	const el = canvasEl;
	const id = hoverId;
	if (!el || !id) {
		tipPos = { ...tipPos, ready: false };
		return;
	}
	const tile = el.querySelector<HTMLElement>(`.sk-tile[data-id="${id}"]`);
	if (!tile) {
		tipPos = { ...tipPos, ready: false };
		return;
	}
	const r = tile.getBoundingClientRect();
	const w = tipEl?.offsetWidth || 276;
	const h = tipEl?.offsetHeight || 250;

	// 坐标统一换算到「包含块坐标系」里。
	// 注意要从浮层自身往上找，不能从方块往上找 —— 方块所在的 .sk-cell 悬停时
	// 有 translateY(-3px)，那是方块的包含块，跟浮层完全无关。
	const cb = fixedContainingBlock(tipEl ?? el);
	const left = r.left - cb.x;
	const top = r.top - cb.y;
	const bottom = r.bottom - cb.y;
	// 包含块可能比视口大，可视区间取两者交集
	const visTop = Math.max(0, cb.y) - cb.y;
	const visBottom = Math.min(window.innerHeight, cb.y + cb.h) - cb.y;
	const visLeft = Math.max(0, cb.x) - cb.x;
	const visRight = Math.min(window.innerWidth, cb.x + cb.w) - cb.x;
	const gap = 12;
	const pad = 10;

	// 默认挂下方；下方放不下就翻到上方；上下都放不下就夹在可视区里
	let above = false;
	let y = bottom + gap;
	if (y + h > visBottom - pad) {
		above = true;
		y = top - gap - h;
	}
	if (y < visTop + pad) {
		above = false;
		y = Math.max(visTop + pad, Math.min(visBottom - h - pad, bottom + gap));
	}

	const minX = visLeft + pad;
	const maxX = visRight - w - pad;
	const x = Math.max(
		minX,
		Math.min(left + r.width / 2 - w / 2, Math.max(minX, maxX)),
	);

	tipPos = { x, y, above, ready: true };
}

/** 悬停目标、等级、滚动、缩放任何一种变化，浮层都要重新贴位 */
$effect(() => {
	void hoverId;
	void levels;
	void tipEl;
	if (!hoverId) return;
	tick().then(() => placeTip());
});

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

/**
 * 图标配色只分三态：有点数 → 鲜艳品牌色；没点数 → 灰（锁定态更淡）。
 * 灰是刻意的：一眼就能看出哪些学了、哪些没学。
 */
function iconState(s: Skill): IconState {
	if ((levels[s.id] ?? 0) > 0) return "lit";
	return stateOf(s) === "locked" ? "locked" : "unlit";
}

const stats = $derived.by(() => {
	const groupPoints: Record<string, number> = {};
	const groupMaxed: Record<string, number> = {};
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
		if (lv >= MAX_LEVEL) groupMaxed[s.group] = (groupMaxed[s.group] ?? 0) + 1;
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
		groupPoints,
		groupMaxed,
		litGroups: GROUPS.filter((g) => (groupPoints[g.id] ?? 0) > 0).length,
		maxedGroups: GROUPS.filter((g) => (groupMaxed[g.id] ?? 0) > 0).length,
	};
});

/* ===================== 角色属性 ===================== */

/**
 * 属性点规则（只在这里定义）：
 *   每升 1 级 → 所属方向的属性 +1；满级（Lv5）再额外 +2。
 */
function attrIdOf(s: Skill): string {
	return GROUP_ATTR[s.group] ?? "dex";
}

/** 这个技能当前贡献了多少属性点 */
function attrGain(s: Skill): number {
	const lv = levels[s.id] ?? 0;
	return lv + (lv >= MAX_LEVEL ? 2 : 0);
}

/** 满级后再多给多少 —— 提示浮层里要显示 */
const ATTR_MAX_BONUS = 2;

const attrStats = $derived.by(() => {
	const value: Record<string, number> = {};
	const max: Record<string, number> = {};
	const count: Record<string, number> = {};
	const maxed: Record<string, number> = {};
	for (const a of ATTRS) {
		value[a.id] = 0;
		max[a.id] = 0;
		count[a.id] = 0;
		maxed[a.id] = 0;
	}
	for (const s of SKILLS) {
		const id = attrIdOf(s);
		const lv = levels[s.id] ?? 0;
		count[id] = (count[id] ?? 0) + 1;
		max[id] = (max[id] ?? 0) + MAX_LEVEL + ATTR_MAX_BONUS;
		value[id] = (value[id] ?? 0) + attrGain(s);
		if (lv >= MAX_LEVEL) maxed[id] = (maxed[id] ?? 0) + 1;
	}
	return { value, max, count, maxed };
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
	// 浮层用的是包含块坐标，页面或技能图一滚就得重新贴位；用 rAF 节流，别每个事件都算
	let tipRaf = 0;
	const onScroll = () => {
		if (!hoverId || tipRaf) return;
		tipRaf = requestAnimationFrame(() => {
			tipRaf = 0;
			placeTip();
		});
	};
	window.addEventListener("scroll", onScroll, true);
	window.addEventListener("resize", onScroll);
	document.fonts?.ready.then(() => measure()).catch(() => {});

	return () => {
		mo.disconnect();
		ro.disconnect();
		window.removeEventListener("resize", scheduleMeasure);
		window.removeEventListener("scroll", onScroll, true);
		window.removeEventListener("resize", onScroll);
		if (tipRaf) cancelAnimationFrame(tipRaf);
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
												fill={iconColor(s.id, s.group, iconState(s), dark)}
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
					{#each ATTRS as a (a.id)}
						{@const v = attrStats.value[a.id] ?? 0}
						{@const m = attrStats.max[a.id] ?? 1}
						<li style={`--ac:#${a.color}`}>
							<span class="sk-attr-cap">{a.short}</span>
							<b>{v}<em>/{m}</em></b>
							<span class="sk-attr-bar">
								<span style={`width:${m ? Math.round((v / m) * 100) : 0}%`}></span>
							</span>
						</li>
					{/each}
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
							fill={iconColor(active.id, active.group, iconState(active), dark)}
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

		<!-- ===================== 总统计 ===================== -->
		<section class="sk-summary">
			<div class="sk-summary-head">
				<h3>总统计</h3>
				<p>按方向看进度：条越满，这块越扎实；最右边是它喂养的属性。</p>
			</div>

			<ul class="sk-summary-list">
				{#each GROUPS as g (g.id)}
					{@const gp = stats.groupPoints[g.id] ?? 0}
					{@const gsize = GROUP_SIZE[g.id] ?? 1}
					{@const gmax = gsize * MAX_LEVEL}
					{@const gpct = gmax ? Math.round((gp / gmax) * 100) : 0}
					{@const gattr = ATTR_MAP[GROUP_ATTR[g.id] ?? "dex"]}
					<li
						class="sk-sum-row"
						style={`--gc:${GROUP_COLORS[g.id] ?? "#9a8f78"};--ac:#${gattr?.color ?? "7a6a4a"}`}
					>
						<span class="sk-sum-name">{g.name}</span>
						<span class="sk-sum-bar"><span style={`width:${gpct}%`}></span></span>
						<span class="sk-sum-val">{gp}<em>/{gmax}</em></span>
						<span class="sk-sum-pct">{gpct}%</span>
						<span class="sk-sum-maxed">满级 {stats.groupMaxed[g.id] ?? 0}/{gsize}</span>
						<span class="sk-sum-attr">{gattr?.short}</span>
					</li>
				{/each}
			</ul>

			<div class="sk-summary-foot">
				<ul class="sk-summary-nums">
					<li><b>{stats.points}</b><span>技能点<em>满 {MAX_POINTS}</em></span></li>
					<li><b>{stats.pct}%</b><span>总掌握度<em>{stats.title.name}</em></span></li>
					<li><b>{stats.lit}<em>/{TOTAL_SKILLS}</em></b><span>已点亮<em>还有 {TOTAL_SKILLS - stats.lit} 个没碰</em></span></li>
					<li><b>{stats.maxed}</b><span>已精通<em>Lv{MAX_LEVEL} 技能数</em></span></li>
					<li><b>{stats.litGroups}<em>/{GROUPS.length}</em></b><span>已开启方向<em>至少点亮 1 个</em></span></li>
					<li><b>{stats.maxedGroups}</b><span>满级方向<em>整块都到 Lv{MAX_LEVEL}</em></span></li>
				</ul>
				<p class="sk-summary-note">
					技术是学不完的，能学完的只有「今天这一块」。把上面的条一条条填满，比收藏一百篇文章都管用。
				</p>
			</div>
		</section>
	</footer>

	<!-- ===================== 悬停浮层 ===================== -->
	{#if active}
		{@const alv = levels[active.id] ?? 0}
		{@const aattr = ATTR_MAP[attrIdOf(active)]}
		{@const missing = active.requires.filter((r) => (levels[r] ?? 0) <= 0)}
		<div
			class="sk-tip"
			class:above={tipPos.above}
			class:ready={tipPos.ready}
			bind:this={tipEl}
			style={`left:${tipPos.x}px;top:${tipPos.y}px`}
			role="tooltip"
		>
			<div class="sk-tip-head">
				<svg class="sk-tip-logo" viewBox="0 0 24 24" aria-hidden="true">
					<path
						d={TECH_ICONS[active.id]?.d ?? ""}
						fill={iconColor(active.id, active.group, iconState(active), dark)}
					></path>
				</svg>
				<div class="sk-tip-title">
					<p class="sk-tip-name">
						{active.name}
						<span
							class="sk-tip-group"
							style={`--gc:${GROUP_COLORS[active.group] ?? "#9a8f78"}`}
						>
							{GROUP_MAP[active.group]?.short ?? ""}
						</span>
					</p>
					<p class="sk-tip-lv">
						等级 <b>{alv}</b> / {MAX_LEVEL} · {LEVELS[alv]?.name}
					</p>
				</div>
				<span class="sk-tip-pct">{Math.round((alv / MAX_LEVEL) * 100)}%</span>
			</div>

			<p class="sk-tip-note">{active.note}</p>

			{#if active.tips.length}
				<ul class="sk-tip-tips">
					{#each active.tips.slice(0, 3) as t (t)}
						<li>{t}</li>
					{/each}
				</ul>
			{/if}

			<div class="sk-tip-rewards">
				<span class="sk-tip-cap">属性</span>
				<span class="sk-tip-gain" style={`--ac:#${aattr?.color ?? "7a6a4a"}`}>
					+1 {aattr?.name ?? ""}<em>/级</em>
				</span>
				{#if alv >= MAX_LEVEL}
					<span class="sk-tip-gain is-bonus" style={`--ac:#${aattr?.color ?? "7a6a4a"}`}>
						精通再 +{ATTR_MAX_BONUS}
					</span>
				{/if}
			</div>

			<p class="sk-tip-rel">
				<span class="sk-tip-cap">前置</span>
				{#if active.requires.length}
					{#each active.requires as r, i (r)}
						{#if i > 0}<i class="sk-tip-sep">·</i>{/if}
						<span class:ok={(levels[r] ?? 0) > 0} class:need={(levels[r] ?? 0) <= 0}>
							{SKILL_MAP[r]?.short ?? r}<em>({levels[r] ?? 0})</em>
						</span>
					{/each}
				{:else}
					<span class="ok">无，这是起点</span>
				{/if}
			</p>

			{#if CHILDREN[active.id]?.length}
				<p class="sk-tip-rel">
					<span class="sk-tip-cap">解锁</span>
					<span class="sk-tip-kids">
						{CHILDREN[active.id].map((c) => SKILL_MAP[c]?.short ?? c).join(" · ")}
					</span>
				</p>
			{/if}

			{#if missing.length}
				<p class="sk-tip-locked">
					先点亮 {missing.map((r) => SKILL_MAP[r]?.short ?? r).join(" · ")}，才能学它
				</p>
			{:else}
				<p class="sk-tip-open">
					{active.requires.length ? "前置已打通" : "起点技能"} · 左键升级 / 右键降级
				</p>
			{/if}
		</div>
	{/if}

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
		/* 亮色 logo（JS 黄这类）在浅色面板上容易糊，给一层极淡的投影提形状 */
		--logo-shadow: drop-shadow(0 0.5px 1px rgba(74, 67, 53, 0.32));
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
		--logo-shadow: none;
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
		width: 64%;
		height: 64%;
		filter: var(--logo-shadow);
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
	/* ===================== 角色属性（魅力 / 灵巧 / 硬核） ===================== */
	.sk-attrs {
		display: grid;
		gap: 0.36rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.sk-attrs li {
		display: grid;
		grid-template-columns: 2rem 3rem minmax(0, 1fr);
		align-items: center;
		gap: 0.4rem;
	}
	.sk-attr-cap {
		font-size: 0.62rem;
		color: var(--ink-2);
		white-space: nowrap;
	}
	.sk-attrs b {
		font-size: 0.8rem;
		color: color-mix(in srgb, var(--ac) 76%, var(--ink));
		font-variant-numeric: tabular-nums;
	}
	.sk-attrs b em {
		font-style: normal;
		font-size: 0.6rem;
		font-weight: 500;
		opacity: 0.55;
	}
	.sk-attr-bar {
		display: block;
		height: 5px;
		border-radius: 99px;
		background: color-mix(in srgb, var(--ink) 11%, transparent);
		overflow: hidden;
	}
	.sk-attr-bar > span {
		display: block;
		height: 100%;
		border-radius: 99px;
		background: linear-gradient(
			90deg,
			color-mix(in srgb, var(--ac) 55%, transparent),
			var(--ac)
		);
		transition: width 420ms cubic-bezier(0.4, 0, 0.2, 1);
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

	/* ===================== 悬停浮层 ===================== */
	/* 始终用深色卡片：像游戏里的物品说明，浅色底和深色底都只有它一个反色块，最醒目 */
	.sk-tip {
		position: fixed;
		z-index: 80;
		width: 276px;
		max-width: calc(100vw - 20px);
		padding: 0.74rem 0.82rem 0.7rem;
		border: 1px solid color-mix(in srgb, var(--gold) 58%, transparent);
		border-radius: 0.72rem;
		background:
			linear-gradient(165deg, #2e2618, #191510);
		box-shadow:
			0 14px 34px rgb(0 0 0 / 0.42),
			inset 0 1px 0 rgb(255 255 255 / 0.06);
		font-size: 0.72rem;
		line-height: 1.55;
		color: #e9e2d3;
		opacity: 0;
		transform: translateY(-5px);
		transition:
			opacity 140ms ease,
			transform 140ms ease;
		pointer-events: none;
	}
	.sk-tip.above {
		transform: translateY(5px);
	}
	.sk-tip.ready {
		opacity: 1;
		transform: translateY(0);
	}
	.sk-tip-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.sk-tip-logo {
		flex: none;
		width: 26px;
		height: 26px;
	}
	.sk-tip-title {
		flex: 1;
		min-width: 0;
	}
	.sk-tip-name {
		display: flex;
		align-items: center;
		gap: 0.34rem;
		margin: 0;
		font-size: 0.84rem;
		font-weight: 800;
		color: #f6dfa8;
	}
	.sk-tip-group {
		padding: 0.02rem 0.32rem;
		border-radius: 99px;
		background: color-mix(in srgb, var(--gc) 30%, transparent);
		font-size: 0.56rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--gc) 48%, #fff);
	}
	.sk-tip-lv {
		margin: 0.12rem 0 0;
		font-size: 0.64rem;
		color: rgb(233 226 211 / 0.64);
	}
	.sk-tip-lv b {
		color: #f6dfa8;
	}
	.sk-tip-pct {
		flex: none;
		font-size: 0.74rem;
		font-weight: 800;
		color: #f6dfa8;
		font-variant-numeric: tabular-nums;
	}
	.sk-tip-note {
		margin: 0.5rem 0 0;
		color: rgb(233 226 211 / 0.84);
	}
	.sk-tip-tips {
		display: grid;
		gap: 0.2rem;
		margin: 0.44rem 0 0;
		padding: 0;
		list-style: none;
	}
	.sk-tip-tips li {
		position: relative;
		padding-left: 0.74rem;
		font-size: 0.68rem;
		color: rgb(233 226 211 / 0.7);
	}
	.sk-tip-tips li::before {
		content: "";
		position: absolute;
		left: 0.18rem;
		top: 0.5em;
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--gold) 85%, transparent);
	}
	.sk-tip-rewards {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3rem;
		margin-top: 0.54rem;
		padding-top: 0.48rem;
		border-top: 1px dashed rgb(246 223 168 / 0.22);
	}
	.sk-tip-cap {
		font-size: 0.6rem;
		color: rgb(233 226 211 / 0.48);
	}
	.sk-tip-gain {
		padding: 0.06rem 0.36rem;
		border: 1px solid color-mix(in srgb, var(--ac) 62%, transparent);
		border-radius: 99px;
		background: color-mix(in srgb, var(--ac) 24%, transparent);
		font-size: 0.64rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--ac) 30%, #fff);
	}
	.sk-tip-gain em {
		font-style: normal;
		font-weight: 500;
		opacity: 0.66;
	}
	.sk-tip-gain.is-bonus {
		background: color-mix(in srgb, var(--ac) 40%, transparent);
	}
	.sk-tip-rel {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.26rem;
		margin: 0.4rem 0 0;
		font-size: 0.68rem;
	}
	.sk-tip-rel .ok {
		color: #93d6a4;
	}
	.sk-tip-rel .need {
		color: #ff9280;
		font-weight: 700;
	}
	.sk-tip-rel em {
		font-style: normal;
		opacity: 0.6;
	}
	.sk-tip-sep {
		font-style: normal;
		color: rgb(233 226 211 / 0.3);
	}
	.sk-tip-kids {
		color: rgb(233 226 211 / 0.6);
	}
	.sk-tip-locked {
		margin: 0.46rem 0 0;
		padding: 0.3rem 0.46rem;
		border-radius: 0.36rem;
		background: color-mix(in srgb, #ff5a3c 20%, transparent);
		font-size: 0.66rem;
		font-weight: 600;
		color: #ffb6a6;
	}
	.sk-tip-open {
		margin: 0.46rem 0 0;
		font-size: 0.62rem;
		color: rgb(233 226 211 / 0.44);
	}

	/* ===================== 总统计 ===================== */
	.sk-summary {
		grid-column: 1 / -1;
		padding: 0.95rem 1.05rem;
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: linear-gradient(160deg, var(--panel-1), var(--panel-2));
	}
	.sk-summary-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.6rem;
	}
	.sk-summary-head h3 {
		margin: 0;
		font-size: 0.94rem;
		color: var(--gold-dp);
	}
	.sk-summary-head p {
		margin: 0;
		font-size: 0.7rem;
		color: var(--ink-2);
	}
	.sk-summary-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr));
		gap: 0.34rem 1.4rem;
		margin: 0.75rem 0 0;
		padding: 0;
		list-style: none;
	}
	.sk-sum-row {
		display: grid;
		grid-template-columns: 6.6rem minmax(2.6rem, 1fr) 3.1rem 2.4rem 4.2rem 2rem;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.68rem;
	}
	.sk-sum-name {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		color: var(--ink);
	}
	.sk-sum-bar {
		display: block;
		height: 6px;
		border-radius: 99px;
		background: color-mix(in srgb, var(--ink) 11%, transparent);
		overflow: hidden;
	}
	.sk-sum-bar > span {
		display: block;
		height: 100%;
		border-radius: 99px;
		background: linear-gradient(
			90deg,
			color-mix(in srgb, var(--gc) 62%, transparent),
			var(--gc)
		);
		transition: width 420ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.sk-sum-val {
		font-weight: 700;
		color: var(--gold-dp);
		font-variant-numeric: tabular-nums;
	}
	.sk-sum-val em {
		font-style: normal;
		font-weight: 500;
		opacity: 0.55;
	}
	.sk-sum-pct {
		text-align: right;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.sk-sum-maxed {
		white-space: nowrap;
		color: var(--ink-2);
		opacity: 0.82;
	}
	.sk-sum-attr {
		justify-self: end;
		padding: 0.02rem 0.34rem;
		border-radius: 99px;
		background: color-mix(in srgb, var(--ac) 20%, transparent);
		font-size: 0.6rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--ac) 74%, var(--ink));
	}
	.sk-summary-foot {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 19rem);
		gap: 1rem;
		margin-top: 0.9rem;
		padding-top: 0.8rem;
		border-top: 1px dashed var(--line);
	}
	.sk-summary-nums {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.sk-summary-nums li {
		display: flex;
		flex-direction: column;
		gap: 0.06rem;
	}
	.sk-summary-nums b {
		font-size: 1rem;
		color: var(--gold-dp);
		font-variant-numeric: tabular-nums;
	}
	.sk-summary-nums b em {
		font-style: normal;
		font-size: 0.7rem;
		opacity: 0.6;
	}
	.sk-summary-nums span {
		font-size: 0.62rem;
		color: var(--ink-2);
	}
	.sk-summary-nums span em {
		display: block;
		font-style: normal;
		font-size: 0.58rem;
		opacity: 0.72;
	}
	.sk-summary-note {
		margin: 0;
		font-size: 0.7rem;
		line-height: 1.7;
		color: var(--ink-2);
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
		.sk-summary-foot {
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
		/* 窄屏放不下 6 列，砍掉「满级 / 属性」两列，保留名字、进度、数值 */
		.sk-sum-row {
			grid-template-columns: 5.6rem minmax(2.2rem, 1fr) 3rem 2.2rem;
		}
		.sk-sum-maxed,
		.sk-sum-attr {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sk-tile,
		.sk-cell,
		.sk-water,
		.sk-logo,
		.sk-wire,
		.sk-tip {
			transition: none !important;
			animation: none !important;
		}
	}
</style>
