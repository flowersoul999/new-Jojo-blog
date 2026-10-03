<script lang="ts">
/**
 * 技能树 —— 游戏天赋树形态（大类在外，小类点开）
 *
 * 为什么分两层：
 *   一层铺 78 个小类的话，屏幕上全是碎方块，看不出「我走到哪了」。
 *   所以树上只放 10 个大方向（语言 / 类型 / 浏览器 / 框架 / 工程 / 质量 / 视觉 / 服务端 / 架构 / 成长），
 *   点开某个大类，它下面的小类才展开成清单，可以逐个加点。
 *
 * 视觉语言：金属边框方块 + 金色圆角折线 + 箭头 + 右下角点数徽章 + 悬停详情 + 角色属性栏。
 * 依赖关系见 src/data/skills.ts 里各大类的 dependsOn（数组内全部点亮 1 级才解锁）。
 *
 * 交互：
 *   点大类方块   展开 / 收起小类
 *   点小类       掌握度 +1（满级后不再增加）
 *   右键小类     掌握度 -1
 *   悬停         看详情（等级判定、学习要点）
 */
import { onMount, tick } from "svelte";
import avatarUrl from "@/assets/images/jojo-avatar.webp";
import { profileConfig } from "@/config/profileConfig";
import {
	ALL_SKILLS,
	CATEGORIES,
	CATEGORY_MAP,
	LEVELS,
	MAX_LEVEL,
	type SkillCategory,
	TIERS,
	TOTAL_CATEGORIES,
	TOTAL_SKILLS,
} from "@/data/skills";

const STORAGE_KEY = "aemeath-skill-tree";

/** 预设：把 data 里的 level 摊平成 { 技能id: 等级 } */
const DEFAULT_LEVELS: Record<string, number> = Object.fromEntries(
	ALL_SKILLS.map((s) => [s.id, s.level]),
);

/** 称号：按总进度爬升 */
const TITLES: { min: number; name: string }[] = [
	{ min: 0, name: "切图仔" },
	{ min: 15, name: "页面仔" },
	{ min: 30, name: "前端萌新" },
	{ min: 45, name: "前端工程师" },
	{ min: 60, name: "前端老手" },
	{ min: 75, name: "前端专家" },
	{ min: 90, name: "技术大师" },
];

type CatState = "locked" | "ready" | "learned" | "max";
type Box = { x: number; y: number; w: number; h: number };

/* ===================== 状态 ===================== */
let levels = $state<Record<string, number>>({ ...DEFAULT_LEVELS });
let dirty = $state(false);
/** 当前展开的大类（同时只开一个，避免页面被撑得太长） */
let expandedId = $state<string | null>(null);
/** 悬停目标：大类方块 or 小类行 */
let hover = $state<{ kind: "cat" | "skill"; id: string } | null>(null);

let arena = $state<HTMLElement>();
let arenaSize = $state({ w: 0, h: 0 });
let tileBoxes = $state<Record<string, Box>>({});
let panelBox = $state<Box | null>(null);

/* ===================== 等级读写 ===================== */
function lvOf(id: string): number {
	return levels[id] ?? 0;
}

function pointsOf(cat: SkillCategory): number {
	let sum = 0;
	for (const s of cat.skills) sum += lvOf(s.id);
	return sum;
}

function maxPointsOf(cat: SkillCategory): number {
	return cat.skills.length * MAX_LEVEL;
}

function avgOf(cat: SkillCategory): number {
	return cat.skills.length === 0 ? 0 : pointsOf(cat) / cat.skills.length;
}

/** 大类的综合档位：小类平均掌握度四舍五入 */
function catLevel(cat: SkillCategory): number {
	return Math.round(avgOf(cat));
}

/** 前置大类全部至少点亮 1 点，才解锁本大类 */
function unlocked(cat: SkillCategory): boolean {
	return cat.dependsOn.every((d) => {
		const parent = CATEGORY_MAP[d];
		return parent ? pointsOf(parent) > 0 : true;
	});
}

function catState(cat: SkillCategory): CatState {
	if (!unlocked(cat)) return "locked";
	const pts = pointsOf(cat);
	if (pts <= 0) return "ready";
	return pts >= maxPointsOf(cat) ? "max" : "learned";
}

function persist() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
	} catch {
		/* 忽略：隐私模式等场景写不进去 */
	}
}

function setLevel(id: string, lv: number) {
	const next = Math.max(0, Math.min(MAX_LEVEL, lv));
	if (lvOf(id) === next) return;
	levels = { ...levels, [id]: next };
	dirty = true;
	persist();
}

function addPoint(id: string) {
	setLevel(id, lvOf(id) + 1);
}

function removePoint(id: string) {
	setLevel(id, lvOf(id) - 1);
}

function resetToPreset() {
	levels = { ...DEFAULT_LEVELS };
	dirty = false;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		/* 忽略 */
	}
}

function clearAll() {
	const zeroed: Record<string, number> = {};
	for (const s of ALL_SKILLS) zeroed[s.id] = 0;
	levels = zeroed;
	dirty = true;
	persist();
}

function toggle(cat: SkillCategory) {
	if (!unlocked(cat)) return;
	expandedId = expandedId === cat.id ? null : cat.id;
}

/* ===================== 汇总统计 ===================== */
const stats = $derived.by(() => {
	let totalPoints = 0;
	let litSkills = 0;
	let maxedSkills = 0;
	for (const s of ALL_SKILLS) {
		const lv = lvOf(s.id);
		totalPoints += lv;
		if (lv > 0) litSkills += 1;
		if (lv >= MAX_LEVEL) maxedSkills += 1;
	}
	const maxTotal = TOTAL_SKILLS * MAX_LEVEL;
	const pct = maxTotal === 0 ? 0 : Math.round((totalPoints / maxTotal) * 100);

	let litCats = 0;
	let maxedCats = 0;
	for (const c of CATEGORIES) {
		const pts = pointsOf(c);
		if (pts > 0) litCats += 1;
		if (pts >= maxPointsOf(c)) maxedCats += 1;
	}

	// 攻坚点数：服务端 / 架构 / 成长 这三个硬骨头方向的点数
	const hardTracks = new Set(["服务端", "架构", "成长"]);
	let hardPoints = 0;
	for (const c of CATEGORIES)
		if (hardTracks.has(c.short)) hardPoints += pointsOf(c);

	let title = TITLES[0].name;
	for (const t of TITLES) if (pct >= t.min) title = t.name;

	return {
		points: totalPoints,
		max: maxTotal,
		pct,
		litSkills,
		maxedSkills,
		litCats,
		maxedCats,
		level: pct,
		title,
		charm: litCats * 2,
		dex: TOTAL_SKILLS === 0 ? 0 : Math.round((totalPoints / TOTAL_SKILLS) * 6),
		bald: Math.round(hardPoints / 10),
	};
});

/* ===================== 详情数据 ===================== */
const activeCat = $derived(
	hover?.kind === "cat" ? (CATEGORY_MAP[hover.id] ?? null) : null,
);

const activeSkill = $derived.by(() => {
	if (hover?.kind !== "skill") return null;
	const id = hover.id;
	for (const c of CATEGORIES) {
		const hit = c.skills.find((s) => s.id === id);
		if (hit) return { skill: hit, cat: c };
	}
	return null;
});

const activeCatStats = $derived.by(() => {
	if (!activeCat) return null;
	return {
		points: pointsOf(activeCat),
		max: maxPointsOf(activeCat),
		level: catLevel(activeCat),
		state: catState(activeCat),
		locked: !unlocked(activeCat),
		parents: activeCat.dependsOn
			.map((d) => CATEGORY_MAP[d]?.name ?? d)
			.join("、"),
	};
});

const expandedCat = $derived(
	expandedId ? (CATEGORY_MAP[expandedId] ?? null) : null,
);

/* ===================== 悬停气泡定位 ===================== */
const tipPos = $derived.by(() => {
	const W = 300;
	const GAP = 14;
	let box: Box | undefined;
	if (hover?.kind === "cat") box = tileBoxes[hover.id];
	else if (hover?.kind === "skill" && activeSkill) {
		box = tileBoxes[activeSkill.cat.id];
	}
	if (!box) return { left: 0, top: 0, hidden: true };
	const right = box.x + box.w + GAP;
	const left =
		right + W <= arenaSize.w ? right : Math.max(8, box.x - W / 2 - GAP);
	return { left, top: Math.max(8, box.y - 10), hidden: false };
});

/* ===================== 连线（大类的 dependsOn） ===================== */
type Edge = { key: string; d: string; arrow: string; active: boolean };

function elbowPath(a: Box, b: Box): string {
	const x1 = a.x + a.w / 2;
	const y1 = a.y + a.h;
	const x2 = b.x + b.w / 2;
	const y2 = b.y;
	const dy = y2 - y1;
	const R = 12;
	if (dy <= R * 2 || Math.abs(x2 - x1) < 1.5)
		return `M ${x1} ${y1} L ${x2} ${y2}`;
	const s = x2 >= x1 ? 1 : -1;
	const my = y1 + dy / 2;
	return `M ${x1} ${y1} V ${my - R} Q ${x1} ${my} ${x1 + s * R} ${my} H ${x2 - s * R} Q ${x2} ${my} ${x2} ${my + R} V ${y2}`;
}

function arrowPath(x: number, y: number): string {
	return `M ${x} ${y + 1} L ${x - 5.2} ${y - 6.5} L ${x + 5.2} ${y - 6.5} Z`;
}

const edges = $derived.by<Edge[]>(() => {
	const out: Edge[] = [];
	for (const child of CATEGORIES) {
		const c = tileBoxes[child.id];
		if (!c) continue;
		for (const pid of child.dependsOn) {
			const parent = CATEGORY_MAP[pid];
			const p = tileBoxes[pid];
			if (!parent || !p) continue;

			// 同一行的大类：横向连，避免折线从方块里穿过去
			const sameRow = Math.abs(p.y - c.y) < 2;
			let d = "";
			let arrow = "";
			if (sameRow) {
				const y = p.y + p.h / 2;
				const ax = p.x + p.w;
				const bx = c.x;
				d = `M ${ax} ${y} L ${bx} ${y}`;
			} else {
				// 起点：大类展开了就从小类清单底部出发，否则从方块底部
				const src =
					expandedId === pid && panelBox
						? { x: p.x, y: panelBox.y, w: p.w, h: panelBox.h }
						: p;
				d = elbowPath(src, c);
				arrow = arrowPath(c.x + c.w / 2, c.y);
			}

			out.push({
				key: `${pid}->${child.id}`,
				d,
				arrow,
				active: pointsOf(parent) > 0,
			});
		}
	}
	return out;
});

/* ===================== 量尺寸（连线靠它算坐标） ===================== */
function measure() {
	if (!arena) return;
	const base = arena.getBoundingClientRect();
	const boxes: Record<string, Box> = {};
	for (const el of arena.querySelectorAll<HTMLElement>(".tt-cat[data-cid]")) {
		const r = el.getBoundingClientRect();
		boxes[el.dataset.cid ?? ""] = {
			x: r.left - base.left,
			y: r.top - base.top,
			w: r.width,
			h: r.height,
		};
	}
	tileBoxes = boxes;

	const p = arena.querySelector<HTMLElement>(".tt-panel");
	if (p) {
		const r = p.getBoundingClientRect();
		panelBox = {
			x: r.left - base.left,
			y: r.top - base.top,
			w: r.width,
			h: r.height,
		};
	} else {
		panelBox = null;
	}

	arenaSize = { w: base.width, h: base.height };
}

let resizeObserver: ResizeObserver | undefined;

onMount(() => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as Record<string, unknown>;
			const merged: Record<string, number> = { ...DEFAULT_LEVELS };
			for (const s of ALL_SKILLS) {
				const v = parsed[s.id];
				if (typeof v === "number") {
					merged[s.id] = Math.max(0, Math.min(MAX_LEVEL, Math.round(v)));
				}
			}
			levels = merged;
			dirty = JSON.stringify(merged) !== JSON.stringify(DEFAULT_LEVELS);
		}
	} catch {
		/* 存储坏了就当没存过 */
	}

	measure();
	if (arena && typeof ResizeObserver !== "undefined") {
		resizeObserver = new ResizeObserver(() => measure());
		resizeObserver.observe(arena);
	}
	return () => resizeObserver?.disconnect();
});

/** 展开 / 收起会改变盒子高度，等 DOM 更新完再重新量 */
$effect(() => {
	void expandedId;
	void levels;
	void tick().then(() => measure());
});

/** 展开的大类如果因为上游被清零而锁上，自动收起，别留着一段看不懂的清单 */
$effect(() => {
	if (!expandedId) return;
	const cat = CATEGORY_MAP[expandedId];
	if (!cat || !unlocked(cat)) expandedId = null;
});

/* ===================== 其它 ===================== */
function mdnUrl(name: string): string {
	return `https://developer.mozilla.org/zh-CN/search?q=${encodeURIComponent(name)}`;
}

function segs(n: number, total: number): number[] {
	return Array.from({ length: total }, (_, i) => (i < n ? 1 : 0));
}
</script>

<div class="tt-head">
	<div class="tt-head-main">
		<p class="tt-eyebrow">Talent Tree</p>
		<h2 class="tt-title">我的技能天赋树</h2>
		<p class="tt-sub">
			{TIERS.length} 层、{TOTAL_CATEGORIES} 个方向、{TOTAL_SKILLS} 个技能点。<strong
				>点方块展开它下面的小类</strong
			>，点小类 +1、右键 -1；前置方向至少点亮 1 点才会解锁下一格。
		</p>
	</div>
	<div class="tt-head-actions">
		<button type="button" class="tt-btn" onclick={resetToPreset} disabled={!dirty}>恢复预设</button>
		<button type="button" class="tt-btn" onclick={clearAll}>全部清零</button>
	</div>
</div>

<div class="tt-bar">
	<div class="tt-bar-stat">
		<span class="tt-bar-num">{stats.points}<em>/{stats.max}</em></span>
		<span class="tt-bar-label">已投入技能点</span>
	</div>
	<div class="tt-bar-stat">
		<span class="tt-bar-num">{stats.litCats}<em>/{TOTAL_CATEGORIES}</em></span>
		<span class="tt-bar-label">已点亮方向</span>
	</div>
	<div class="tt-bar-stat">
		<span class="tt-bar-num">{stats.maxedCats}</span>
		<span class="tt-bar-label">满级方向</span>
	</div>
	<div class="tt-progress" aria-label="总体进度 {stats.pct}%">
		<i style="width:{stats.pct}%"></i>
	</div>
	<div class="tt-legend">
		<span><i class="tt-dot is-locked"></i>未解锁</span>
		<span><i class="tt-dot is-ready"></i>未开始</span>
		<span><i class="tt-dot is-learned"></i>进行中</span>
		<span><i class="tt-dot is-max"></i>已满级</span>
	</div>
</div>

<div class="tt-arena" bind:this={arena}>
	<svg
		class="tt-links"
		width={arenaSize.w}
		height={arenaSize.h}
		viewBox="0 0 {arenaSize.w} {arenaSize.h}"
		aria-hidden="true"
	>
		{#each edges as e (e.key)}
			<g class:active={e.active}>
				<path class="tt-link-out" d={e.d}></path>
				<path class="tt-link-in" d={e.d}></path>
				{#if e.arrow}
					<path class="tt-arrow" d={e.arrow}></path>
				{/if}
			</g>
		{/each}
	</svg>

	{#each TIERS as tier, ti (tier.tier)}
		<section class="tt-band">
			<div class="tt-band-head">
				<span class="tt-band-idx">{String(ti + 1).padStart(2, "0")}</span>
				<span class="tt-band-name">{tier.stage}</span>
				<span class="tt-band-purpose">{tier.purpose}</span>
			</div>

			<div class="tt-row">
				{#each tier.categories as cat (cat.id)}
					<button
						type="button"
						class="tt-cat"
						data-cid={cat.id}
						data-state={catState(cat)}
						data-open={expandedId === cat.id ? "true" : "false"}
						aria-expanded={expandedId === cat.id}
						aria-label="{cat.name}，{catState(cat) === 'locked'
							? '未解锁'
							: `已投入 ${pointsOf(cat)} / ${maxPointsOf(cat)} 点，综合 Lv${catLevel(cat)}`}，点击{expandedId ===
						cat.id
							? '收起'
							: '展开'}小类"
						onmouseenter={() => (hover = { kind: "cat", id: cat.id })}
						onmouseleave={() => (hover = null)}
						onfocus={() => (hover = { kind: "cat", id: cat.id })}
						onblur={() => (hover = null)}
						onclick={() => toggle(cat)}
						oncontextmenu={(e) => {
							e.preventDefault();
							if (expandedId === cat.id) expandedId = null;
						}}
					>
						<span class="tt-frame">
							<span class="tt-socket">
								<span class="tt-cat-name">{cat.short}</span>
								<span class="tt-ranks" aria-hidden="true">
									{#each segs(catLevel(cat), MAX_LEVEL) as on, i (i)}
										<i class:on={on === 1}></i>
									{/each}
								</span>
							</span>
							<span class="tt-badge">{pointsOf(cat)}<em>/{maxPointsOf(cat)}</em></span>
							{#if catState(cat) === "locked"}
								<span class="tt-lock" aria-hidden="true">🔒</span>
							{/if}
						</span>
						<span class="tt-cat-label">{cat.name}</span>
					</button>
				{/each}
			</div>

			{#if expandedCat && tier.categories.some((c) => c.id === expandedCat.id)}
				{@const cat = expandedCat}
				<div class="tt-panel">
					<div class="tt-panel-head">
						<span class="tt-panel-title">
							<b>{cat.name}</b>
							<span class="tt-panel-meta">
								{cat.skills.length} 个小类 · 已投入 {pointsOf(cat)}/{maxPointsOf(cat)} 点 · 综合 Lv{catLevel(
									cat,
								)}
								{LEVELS[catLevel(cat)].name}
							</span>
						</span>
						<span class="tt-panel-hint">点小类 +1 · 右键 -1</span>
						<button
							type="button"
							class="tt-panel-close"
							aria-label="收起 {cat.name}"
							onclick={() => (expandedId = null)}>收起</button
						>
					</div>

					<p class="tt-panel-note">{cat.note}</p>

					<ul class="tt-skills">
						{#each cat.skills as skill (skill.id)}
							{@const lv = lvOf(skill.id)}
							<li>
								<button
									type="button"
									class="tt-skill-row"
									data-sid={skill.id}
									data-lv={lv}
									aria-label="{skill.name}，当前 Lv{lv} {LEVELS[lv].name}，左键加点右键退点"
									onmouseenter={() => (hover = { kind: "skill", id: skill.id })}
									onmouseleave={() => (hover = null)}
									onfocus={() => (hover = { kind: "skill", id: skill.id })}
									onblur={() => (hover = null)}
									onclick={() => addPoint(skill.id)}
									oncontextmenu={(e) => {
										e.preventDefault();
										removePoint(skill.id);
									}}
									onkeydown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											addPoint(skill.id);
										} else if (e.key === "Backspace" || e.key === "Delete") {
											e.preventDefault();
											removePoint(skill.id);
										}
									}}
								>
									<span class="tt-skill-main">
										<span class="tt-skill-name">{skill.name}</span>
										<span class="tt-skill-note">{skill.note}</span>
									</span>
									<span class="tt-skill-side">
										<span class="tt-ranks" aria-hidden="true">
											{#each segs(lv, MAX_LEVEL) as on, i (i)}
												<i class:on={on === 1}></i>
											{/each}
										</span>
										<span class="tt-skill-lv">Lv{lv}<em>{LEVELS[lv].name}</em></span>
									</span>
								</button>
							</li>
						{/each}
					</ul>

					{#if cat.tips?.length}
						<ul class="tt-panel-tips">
							{#each cat.tips as tip (tip)}
								<li>{tip}</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</section>
	{/each}

	{#if activeCat && activeCatStats}
		<div class="tt-tip" style="left:{tipPos.left}px; top:{tipPos.top}px">
			<div class="tt-tip-head">
				<h3>{activeCat.name}</h3>
				<span class="tt-tip-track">{activeCat.short}</span>
			</div>
			<p class="tt-tip-desc">{activeCat.note}</p>
			<div class="tt-tip-ranks">
				{#if activeCatStats.locked}
					<p class="tt-tip-locked">未解锁：需要先点亮 <strong>{activeCatStats.parents}</strong></p>
				{:else}
					<p>
						已投入 <b>{activeCatStats.points}/{activeCatStats.max}</b> 点 · 综合 <b
							>Lv{activeCatStats.level} {LEVELS[activeCatStats.level].name}</b
						>
					</p>
					<p class="tt-tip-next">
						{activeCat.skills.length} 个小类：{activeCat.skills
							.map((s) => s.short)
							.join("、")}
					</p>
				{/if}
				<p class="tt-tip-judge">
					{expandedId === activeCat.id ? "已经是展开状态，再点一次收起。" : "点击展开它下面的小类。"}
				</p>
			</div>
			{#if activeCat.tips?.length}
				<ul class="tt-tip-tips">
					{#each activeCat.tips as tip (tip)}
						<li>{tip}</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}

	{#if activeSkill}
		{@const s = activeSkill.skill}
		{@const lv = lvOf(s.id)}
		<div class="tt-tip" style="left:{tipPos.left}px; top:{tipPos.top}px">
			<div class="tt-tip-head">
				<h3>{s.name}</h3>
				<span class="tt-tip-track">{activeSkill.cat.short}</span>
			</div>
			<p class="tt-tip-desc">{s.note}</p>
			<div class="tt-tip-ranks">
				<p>
					现有等级：<b>Lv{lv} {LEVELS[lv].name}</b>
				</p>
				{#if lv < MAX_LEVEL}
					<p class="tt-tip-next">
						下一等级：Lv{lv + 1} {LEVELS[lv + 1].name} —— {LEVELS[lv + 1].desc}
					</p>
				{:else}
					<p class="tt-tip-next">已满级：{LEVELS[lv].desc}</p>
				{/if}
				<p class="tt-tip-judge">
					{LEVELS[lv].judge === "——" ? LEVELS[lv].desc : `判定：${LEVELS[lv].judge}`}
				</p>
			</div>
			{#if s.tips?.length}
				<ul class="tt-tip-tips">
					{#each s.tips as tip (tip)}
						<li>{tip}</li>
					{/each}
				</ul>
			{/if}
			<div class="tt-tip-foot">
				<span>所属方向 · {activeSkill.cat.name}</span>
				<a href={mdnUrl(s.name)} target="_blank" rel="noreferrer">查资料 →</a>
			</div>
		</div>
	{/if}
</div>

<div class="tt-avatar">
	<div class="tt-portrait">
		<img src={avatarUrl} alt={profileConfig.name} />
		<span class="tt-portrait-lv">{stats.level}</span>
	</div>
	<div class="tt-details">
		<div class="tt-details-title">
			等级 <b>{stats.level}</b> <span>{stats.title}</span>
		</div>
		<ul class="tt-attrs">
			<li><span>魅力值</span><b>{stats.charm}</b></li>
			<li><span>灵巧值</span><b>{stats.dex}</b></li>
			<li><span>秃头值</span><b>{stats.bald}</b></li>
		</ul>
		<p class="tt-details-note">
			学完是不可能学完的，这辈子都不可能的。既然学不完，那就好好享受学习的过程吧~
		</p>
	</div>
</div>

<style>
	/* ===================== 头部 ===================== */
	.tt-head {
		display: flex;
		gap: 1.2rem;
		align-items: flex-end;
		justify-content: space-between;
		flex-wrap: wrap;
	}
	.tt-head-main {
		min-width: 0;
		flex: 1 1 18rem;
	}
	.tt-eyebrow {
		margin: 0 0 0.2rem;
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--primary) 78%, transparent);
	}
	.tt-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.35;
		color: var(--text-color);
	}
	.tt-sub {
		margin: 0.45rem 0 0;
		font-size: 0.82rem;
		line-height: 1.75;
		color: color-mix(in srgb, var(--deep-text) 62%, transparent);
	}
	.tt-sub strong {
		color: color-mix(in srgb, var(--primary) 85%, transparent);
	}
	.tt-head-actions {
		display: flex;
		gap: 0.5rem;
		flex: none;
	}
	.tt-btn {
		border: 1px solid var(--line-divider);
		border-radius: 0.6rem;
		background: transparent;
		padding: 0.36rem 0.85rem;
		font-size: 0.8rem;
		color: color-mix(in srgb, var(--deep-text) 78%, transparent);
		cursor: pointer;
		transition: all 180ms ease;
	}
	.tt-btn:hover:not(:disabled) {
		border-color: color-mix(in srgb, var(--primary) 50%, transparent);
		color: var(--primary);
	}
	.tt-btn:disabled {
		opacity: 0.42;
		cursor: default;
	}

	/* ===================== 统计条 ===================== */
	.tt-bar {
		display: flex;
		align-items: center;
		gap: 1.3rem;
		flex-wrap: wrap;
		margin: 1.1rem 0 0.2rem;
		padding: 0.7rem 0.9rem;
		border-radius: 0.75rem;
		border: 1px solid color-mix(in srgb, var(--tt-gold, #d9a441) 22%, transparent);
		background: color-mix(in srgb, var(--deep-text) 3.5%, transparent);
	}
	.tt-bar-stat {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.tt-bar-num {
		font-size: 1.05rem;
		font-weight: 800;
		color: color-mix(in srgb, var(--deep-text) 88%, transparent);
		font-variant-numeric: tabular-nums;
	}
	.tt-bar-num em {
		font-size: 0.72rem;
		font-style: normal;
		font-weight: 600;
		color: color-mix(in srgb, var(--deep-text) 45%, transparent);
	}
	.tt-bar-label {
		font-size: 0.7rem;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}
	.tt-progress {
		flex: 1 1 10rem;
		min-width: 6rem;
		height: 7px;
		border-radius: 99px;
		background: color-mix(in srgb, var(--deep-text) 10%, transparent);
		overflow: hidden;
	}
	.tt-progress i {
		display: block;
		height: 100%;
		border-radius: 99px;
		background: linear-gradient(90deg, #8a6220, #d9a441 55%, #f4dda6);
		transition: width 420ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.tt-legend {
		display: flex;
		gap: 0.7rem;
		flex-wrap: wrap;
		margin-left: auto;
		font-size: 0.7rem;
		color: color-mix(in srgb, var(--deep-text) 58%, transparent);
	}
	.tt-legend span {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
	}
	.tt-dot {
		width: 9px;
		height: 9px;
		border-radius: 3px;
		flex: none;
	}
	.tt-dot.is-locked {
		background: color-mix(in srgb, var(--deep-text) 12%, transparent);
		border: 1px dashed color-mix(in srgb, var(--deep-text) 35%, transparent);
	}
	.tt-dot.is-ready {
		background: var(--tt-socket, #16171b);
		border: 1px solid color-mix(in srgb, #d9a441 45%, transparent);
	}
	.tt-dot.is-learned {
		background: linear-gradient(160deg, #d9a441, #8a6220);
	}
	.tt-dot.is-max {
		background: linear-gradient(160deg, #f4dda6, #d9a441);
		box-shadow: 0 0 6px color-mix(in srgb, #d9a441 70%, transparent);
	}

	/* ===================== 树 ===================== */
	.tt-arena {
		--tt-gold: #d9a441;
		--tt-gold-deep: #8a6220;
		--tt-gold-light: #f4dda6;
		--tt-socket: #16171b;
		--gap: clamp(10px, 1.7cqw, 22px);
		/* 用 100% 而不是 100cqw：变量定义在容器自身上，cqw 查不了自己，只能按祖先宽度算。
		   末尾减 1px 是留给亚像素取整的余量，否则 4 个一排会差 1px 折行。 */
		--cat-w: min(196px, calc((100% - 3 * var(--gap)) / 4 - 1px));
		position: relative;
		container-type: inline-size;
		margin-top: 0.7rem;
		padding: 0.9rem 0 0.4rem;
		background-image: radial-gradient(
			color-mix(in srgb, var(--deep-text) 9%, transparent) 1px,
			transparent 1px
		);
		background-size: 22px 22px;
		border-radius: 0.9rem;
	}
	.tt-links {
		position: absolute;
		left: 0;
		top: 0;
		z-index: 0;
		overflow: visible;
		pointer-events: none;
	}
	.tt-link-out,
	.tt-link-in {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.tt-link-out {
		stroke: color-mix(in srgb, var(--tt-gold-deep) 45%, transparent);
		stroke-width: 6;
	}
	.tt-link-in {
		stroke: color-mix(in srgb, var(--tt-gold) 32%, transparent);
		stroke-width: 3;
	}
	.tt-arrow {
		fill: color-mix(in srgb, var(--tt-gold) 32%, transparent);
	}
	.tt-links g {
		opacity: 0.4;
		transition: opacity 220ms ease;
	}
	.tt-links g.active {
		opacity: 1;
	}
	.tt-links g.active .tt-link-out {
		stroke: var(--tt-gold-deep);
	}
	.tt-links g.active .tt-link-in {
		stroke: var(--tt-gold-light);
	}
	.tt-links g.active .tt-arrow {
		fill: var(--tt-gold-light);
	}

	.tt-band {
		position: relative;
		z-index: 1;
		padding: 0 0 0.5rem;
	}
	.tt-band-head {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		width: fit-content;
		margin: 0 auto 0.85rem;
		padding: 0.16rem 0.75rem;
		border-radius: 99px;
		border: 1px solid color-mix(in srgb, var(--tt-gold) 30%, transparent);
		/* 实心底衬：挡住从字底下穿过的连线 */
		background: var(--card-bg);
		font-size: 0.74rem;
		color: color-mix(in srgb, var(--deep-text) 72%, transparent);
	}
	.tt-band-idx {
		font-weight: 800;
		color: color-mix(in srgb, var(--tt-gold-deep) 88%, transparent);
		letter-spacing: 0.06em;
	}
	.tt-band-name {
		font-weight: 800;
		color: color-mix(in srgb, var(--deep-text) 85%, transparent);
	}
	.tt-band-purpose {
		opacity: 0.7;
	}
	.tt-band-purpose::before {
		content: "·";
		margin-right: 0.35rem;
	}
	.tt-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: flex-start;
		gap: var(--gap);
	}

	/* ===================== 大类方块 ===================== */
	.tt-cat {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		width: var(--cat-w);
		flex: none;
		padding: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
		outline: none;
	}
	.tt-frame {
		position: relative;
		display: block;
		width: 100%;
		aspect-ratio: 1 / 0.92;
		padding: 5px;
		border-radius: 15px;
		background: linear-gradient(
			160deg,
			var(--tt-gold-light) 0%,
			var(--tt-gold) 38%,
			var(--tt-gold-deep) 100%
		);
		box-shadow:
			0 2px 6px color-mix(in srgb, #000 26%, transparent),
			inset 0 0 0 1px color-mix(in srgb, var(--tt-gold-light) 55%, transparent);
		transition:
			transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 200ms ease,
			filter 200ms ease;
	}
	.tt-socket {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		width: 100%;
		height: 100%;
		border-radius: 11px;
		background: radial-gradient(
			120% 100% at 50% 0%,
			color-mix(in srgb, #2a2c33 100%, transparent),
			var(--tt-socket) 70%
		);
		box-shadow:
			inset 0 3px 9px color-mix(in srgb, #000 72%, transparent),
			inset 0 -1px 0 color-mix(in srgb, #fff 6%, transparent);
		overflow: hidden;
	}
	.tt-cat-name {
		font-size: 1.34rem;
		font-weight: 800;
		letter-spacing: 0.03em;
		color: #f4dda6;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.5);
	}
	.tt-ranks {
		display: inline-flex;
		gap: 4px;
	}
	.tt-ranks i {
		display: block;
		width: 18px;
		height: 7px;
		border-radius: 3px;
		background: color-mix(in srgb, #f4dda6 16%, transparent);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, #f4dda6 14%, transparent);
		transition: all 240ms ease;
	}
	.tt-ranks i.on {
		background: linear-gradient(180deg, var(--tt-gold-light), var(--tt-gold));
		box-shadow: 0 0 6px color-mix(in srgb, var(--tt-gold) 75%, transparent);
	}
	.tt-badge {
		position: absolute;
		right: -5px;
		bottom: -5px;
		min-width: 46px;
		padding: 0.14rem 0.4rem;
		border-radius: 9px;
		border: 1px solid var(--tt-gold-deep);
		background: linear-gradient(180deg, #3a2f16, #221b0c);
		font-size: 0.74rem;
		font-weight: 800;
		color: var(--tt-gold-light);
		text-align: center;
		font-variant-numeric: tabular-nums;
		box-shadow: 0 2px 5px color-mix(in srgb, #000 45%, transparent);
	}
	.tt-badge em {
		font-style: normal;
		font-weight: 600;
		opacity: 0.62;
	}
	.tt-lock {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		font-size: 1.7rem;
		filter: grayscale(1) drop-shadow(0 2px 4px rgb(0 0 0 / 0.5));
	}
	.tt-cat-label {
		font-size: 0.74rem;
		font-weight: 600;
		color: color-mix(in srgb, var(--deep-text) 72%, transparent);
	}
	.tt-cat:hover .tt-frame,
	.tt-cat:focus-visible .tt-frame {
		transform: translateY(-3px);
		box-shadow:
			0 10px 22px color-mix(in srgb, #000 32%, transparent),
			0 0 0 1px var(--tt-gold-light) inset;
	}
	.tt-cat[data-state="locked"] .tt-frame {
		filter: grayscale(0.85) brightness(0.62);
	}
	.tt-cat[data-state="ready"] .tt-frame {
		animation: tt-ready 2.4s ease-in-out infinite;
	}
	.tt-cat[data-state="max"] .tt-frame {
		box-shadow:
			0 0 0 2px color-mix(in srgb, var(--tt-gold-light) 55%, transparent),
			0 6px 20px color-mix(in srgb, var(--tt-gold) 55%, transparent);
	}
	.tt-cat[data-open="true"] .tt-frame {
		transform: translateY(-3px);
		box-shadow:
			0 0 0 2px var(--tt-gold-light),
			0 8px 24px color-mix(in srgb, var(--tt-gold) 60%, transparent);
	}
	@keyframes tt-ready {
		50% {
			box-shadow:
				0 0 0 2px color-mix(in srgb, var(--tt-gold) 55%, transparent),
				0 4px 14px color-mix(in srgb, var(--tt-gold) 45%, transparent);
		}
	}

	/* ===================== 展开的小类清单 ===================== */
	.tt-panel {
		margin: 1.15rem auto 0.4rem;
		max-width: 62rem;
		padding: 1rem 1.15rem 1.1rem;
		border-radius: 1rem;
		border: 1px solid color-mix(in srgb, var(--tt-gold) 38%, transparent);
		background: var(--card-bg);
		box-shadow:
			0 14px 34px color-mix(in srgb, #000 14%, transparent),
			inset 0 0 0 1px color-mix(in srgb, var(--tt-gold-light) 22%, transparent);
		animation: tt-pop 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	@keyframes tt-pop {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
	}
	.tt-panel-head {
		display: flex;
		align-items: baseline;
		gap: 0.7rem;
		flex-wrap: wrap;
	}
	.tt-panel-title {
		display: flex;
		align-items: baseline;
		gap: 0.55rem;
		flex-wrap: wrap;
	}
	.tt-panel-title b {
		font-size: 1.06rem;
		font-weight: 800;
		color: color-mix(in srgb, var(--deep-text) 92%, transparent);
	}
	.tt-panel-meta {
		font-size: 0.74rem;
		color: color-mix(in srgb, var(--tt-gold-deep) 85%, transparent);
		font-weight: 700;
	}
	.tt-panel-hint {
		margin-left: auto;
		font-size: 0.72rem;
		color: color-mix(in srgb, var(--deep-text) 52%, transparent);
	}
	.tt-panel-close {
		flex: none;
		border: 1px solid var(--line-divider);
		border-radius: 0.5rem;
		background: transparent;
		padding: 0.14rem 0.6rem;
		font-size: 0.74rem;
		color: color-mix(in srgb, var(--deep-text) 68%, transparent);
		cursor: pointer;
	}
	.tt-panel-close:hover {
		border-color: color-mix(in srgb, var(--primary) 50%, transparent);
		color: var(--primary);
	}
	.tt-panel-note {
		margin: 0.5rem 0 0.85rem;
		font-size: 0.82rem;
		line-height: 1.7;
		color: color-mix(in srgb, var(--deep-text) 62%, transparent);
	}
	.tt-skills {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.tt-skill-row {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		width: 100%;
		padding: 0.5rem 0.7rem;
		border-radius: 0.7rem;
		border: 1px solid color-mix(in srgb, var(--deep-text) 10%, transparent);
		background: color-mix(in srgb, var(--deep-text) 2.5%, transparent);
		text-align: left;
		cursor: pointer;
		outline: none;
		transition: all 170ms ease;
	}
	.tt-skill-row:hover,
	.tt-skill-row:focus-visible {
		border-color: color-mix(in srgb, var(--tt-gold) 55%, transparent);
		background: color-mix(in srgb, var(--tt-gold) 8%, transparent);
		transform: translateX(2px);
	}
	.tt-skill-main {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
		flex: 1 1 auto;
	}
	.tt-skill-name {
		font-size: 0.85rem;
		font-weight: 700;
		color: color-mix(in srgb, var(--deep-text) 88%, transparent);
	}
	.tt-skill-note {
		font-size: 0.72rem;
		line-height: 1.5;
		color: color-mix(in srgb, var(--deep-text) 52%, transparent);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tt-skill-side {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: none;
	}
	.tt-skill-lv {
		min-width: 4.6rem;
		font-size: 0.72rem;
		font-weight: 800;
		color: var(--tt-gold-deep);
		font-variant-numeric: tabular-nums;
	}
	.tt-skill-lv em {
		font-style: normal;
		font-weight: 600;
		margin-left: 0.25rem;
		color: color-mix(in srgb, var(--deep-text) 55%, transparent);
	}
	.tt-panel-tips {
		margin: 0.9rem 0 0;
		padding: 0.6rem 0 0 0;
		list-style: none;
		border-top: 1px dashed color-mix(in srgb, var(--tt-gold) 30%, transparent);
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.tt-panel-tips li {
		position: relative;
		padding-left: 0.95rem;
		font-size: 0.76rem;
		line-height: 1.65;
		color: color-mix(in srgb, var(--deep-text) 58%, transparent);
	}
	.tt-panel-tips li::before {
		content: "";
		position: absolute;
		left: 0;
		top: 0.52em;
		width: 5px;
		height: 5px;
		border-radius: 2px;
		background: var(--tt-gold);
	}

	/* ===================== 悬停气泡 ===================== */
	.tt-tip {
		position: absolute;
		z-index: 6;
		width: 300px;
		padding: 0.8rem 0.9rem 0.85rem;
		border-radius: 0.85rem;
		background: color-mix(in srgb, var(--tt-socket) 96%, transparent);
		border: 1px solid color-mix(in srgb, var(--tt-gold) 48%, transparent);
		box-shadow: 0 16px 42px color-mix(in srgb, #000 46%, transparent);
		color: #f2ecdf;
		pointer-events: none;
		animation: tt-fade 180ms ease;
	}
	@keyframes tt-fade {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
	}
	.tt-tip-head {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.4rem;
	}
	.tt-tip-head h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 800;
		color: var(--tt-gold-light);
	}
	.tt-tip-track {
		font-size: 0.68rem;
		padding: 0.06rem 0.42rem;
		border-radius: 99px;
		border: 1px solid color-mix(in srgb, var(--tt-gold) 45%, transparent);
		color: color-mix(in srgb, var(--tt-gold-light) 85%, transparent);
	}
	.tt-tip-desc {
		margin: 0 0 0.6rem;
		font-size: 0.76rem;
		line-height: 1.7;
		color: color-mix(in srgb, #f2ecdf 78%, transparent);
	}
	.tt-tip-ranks {
		display: flex;
		flex-direction: column;
		gap: 0.28rem;
	}
	.tt-tip-ranks p {
		margin: 0;
		font-size: 0.73rem;
		line-height: 1.65;
		color: color-mix(in srgb, #f2ecdf 72%, transparent);
	}
	.tt-tip-ranks b {
		color: var(--tt-gold-light);
	}
	.tt-tip-next {
		color: color-mix(in srgb, #f2ecdf 62%, transparent);
	}
	.tt-tip-judge {
		margin-top: 0.15rem;
		font-size: 0.7rem;
		color: color-mix(in srgb, var(--tt-gold) 85%, transparent);
	}
	.tt-tip-locked {
		color: #f0a6a6;
	}
	.tt-tip-tips {
		margin: 0.6rem 0 0;
		padding: 0.55rem 0 0 0;
		list-style: none;
		border-top: 1px dashed color-mix(in srgb, var(--tt-gold) 32%, transparent);
		display: flex;
		flex-direction: column;
		gap: 0.24rem;
	}
	.tt-tip-tips li {
		position: relative;
		padding-left: 0.85rem;
		font-size: 0.72rem;
		line-height: 1.6;
		color: color-mix(in srgb, #f2ecdf 68%, transparent);
	}
	.tt-tip-tips li::before {
		content: "";
		position: absolute;
		left: 0;
		top: 0.55em;
		width: 4px;
		height: 4px;
		border-radius: 2px;
		background: var(--tt-gold);
	}
	.tt-tip-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.6rem;
		font-size: 0.68rem;
		color: color-mix(in srgb, #f2ecdf 55%, transparent);
	}
	.tt-tip-foot a {
		color: var(--tt-gold-light);
		text-decoration: none;
		pointer-events: auto;
	}
	.tt-tip-foot a:hover {
		text-decoration: underline;
	}

	/* ===================== 角色面板 ===================== */
	/* 这一块在 .tt-arena 外面，拿不到里面的 --tt-* 变量，所以都带兜底色 */
	.tt-avatar {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 1.1rem;
		padding-top: 1rem;
		border-top: 1px dashed
			color-mix(in srgb, var(--tt-gold, #d9a441) 30%, transparent);
	}
	.tt-portrait {
		position: relative;
		flex: none;
		width: 64px;
		height: 64px;
	}
	.tt-portrait img {
		width: 100%;
		height: 100%;
		border-radius: 14px;
		object-fit: cover;
		border: 2px solid var(--tt-gold, #d9a441);
		box-shadow: 0 4px 14px color-mix(in srgb, #000 24%, transparent);
	}
	.tt-portrait-lv {
		position: absolute;
		right: -6px;
		bottom: -6px;
		min-width: 26px;
		padding: 0.06rem 0.28rem;
		border-radius: 7px;
		border: 1px solid var(--tt-gold-deep, #8a6220);
		background: linear-gradient(180deg, #3a2f16, #221b0c);
		font-size: 0.66rem;
		font-weight: 800;
		color: var(--tt-gold-light, #f4dda6);
		text-align: center;
	}
	.tt-details {
		min-width: 0;
	}
	.tt-details-title {
		font-size: 0.9rem;
		color: color-mix(in srgb, var(--deep-text) 78%, transparent);
	}
	.tt-details-title b {
		color: var(--tt-gold-deep, #8a6220);
		font-size: 1.05rem;
	}
	.tt-details-title span {
		margin-left: 0.3rem;
		font-weight: 800;
		color: color-mix(in srgb, var(--primary) 85%, transparent);
	}
	.tt-attrs {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin: 0.4rem 0 0;
		padding: 0;
		list-style: none;
	}
	.tt-attrs li {
		display: flex;
		align-items: baseline;
		gap: 0.3rem;
		font-size: 0.74rem;
		color: color-mix(in srgb, var(--deep-text) 58%, transparent);
	}
	.tt-attrs b {
		font-size: 0.95rem;
		color: color-mix(in srgb, var(--deep-text) 88%, transparent);
		font-variant-numeric: tabular-nums;
	}
	.tt-details-note {
		margin: 0.45rem 0 0;
		font-size: 0.74rem;
		line-height: 1.65;
		color: color-mix(in srgb, var(--deep-text) 48%, transparent);
	}

	/* ===================== 响应式 ===================== */
	@media (max-width: 760px) {
		.tt-title {
			font-size: 1.26rem;
		}
		.tt-legend {
			margin-left: 0;
		}
		.tt-arena {
			--gap: 9px;
			--cat-w: calc((100% - 3 * var(--gap)) / 4 - 1px);
		}
		.tt-cat-name {
			font-size: 0.86rem;
		}
		.tt-ranks i {
			width: 9px;
			height: 4px;
		}
		.tt-panel {
			padding: 0.85rem 0.85rem 0.95rem;
		}
		.tt-skills {
			grid-template-columns: 1fr;
		}
		.tt-skill-lv {
			min-width: 3.6rem;
		}
		.tt-panel-hint {
			display: none;
		}
	}
	@media (max-width: 460px) {
		.tt-avatar {
			align-items: flex-start;
		}
		.tt-badge {
			min-width: 32px;
			font-size: 0.56rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tt-cat[data-state="ready"] .tt-frame {
			animation: none;
		}
		.tt-tip,
		.tt-panel {
			animation: none;
		}
		.tt-cat:hover .tt-frame,
		.tt-cat:focus-visible .tt-frame,
		.tt-skill-row:hover,
		.tt-skill-row:focus-visible {
			transform: none;
		}
	}
</style>
