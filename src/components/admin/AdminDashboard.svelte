<script lang="ts">
/**
 * 后台管理仪表盘
 * - 访问统计：今日/昨日/累计 KPI + 近 30 天趋势折线图 + 设备/浏览器环形图 + 地域分布条形图
 * - 用户行为：热门内容排行 + 浏览路径列表
 * - 访客明细：IP 分页表格
 * - 系统设置：埋点开关 / IP 隐私 / 保留天数 / 白名单 / 数据导出 / 立即清理
 * 数据来源：/api/admin/stats、/api/admin/settings、/api/admin/export
 */
import { onMount } from "svelte";
import ClientPagination from "../common/ClientPagination.svelte";

// ============================================================================
// 类型
// ============================================================================

interface DayPoint {
	date: string;
	pv: number;
	uv: number;
}
interface LabelValue {
	label: string;
	value: number;
}
interface TopPath {
	path: string;
	pv: number;
	uv: number;
	avgDwell: number;
}
interface IpRow {
	ip: string;
	pv: number;
	uv: number;
	lastSeen: number;
	country: string;
}
interface BehaviorRow {
	ts: number;
	path: string;
	dwell: number;
	ip: string;
	country: string;
}
interface Settings {
	enabled: boolean;
	recordIp: boolean;
	maskIp: boolean;
	adminLogins: string[];
	retentionDays: number;
}

interface StatsData {
	today: { pv: number; uv: number };
	yesterday: { pv: number; uv: number };
	cumulative: { pv: number; uv: number };
	trend: DayPoint[];
	devices: LabelValue[];
	browsers: LabelValue[];
	countries: LabelValue[];
	topPaths: TopPath[];
	behaviors: BehaviorRow[];
	ipList: IpRow[];
	totalIpCount: number;
	rangeDays: number;
}

// ============================================================================
// 状态
// ============================================================================

type View = "overview" | "behavior" | "visitors" | "settings";

let view = $state<View>("overview");
let authState = $state<"loading" | "denied" | "ok">("loading");
let stats = $state<StatsData | null>(null);
let settings = $state<Settings | null>(null);
let error = $state("");
let loading = $state(false);
let lastUpdated = $state(0);

// IP 分页
let ipPage = $state(1);
const IP_PAGE_SIZE = 10;

// 设置表单
let sEnabled = $state(true);
let sRecordIp = $state(true);
let sMaskIp = $state(true);
let sRetention = $state(90);
let sAdmins = $state("");
let saving = $state(false);
let saveMsg = $state("");
let cleaning = $state(false);

// 导出
let exportFrom = $state("");
let exportTo = $state("");
let exporting = $state("");

// ============================================================================
// 工具
// ============================================================================

const fmt = (n: number) =>
	new Intl.NumberFormat("zh-CN").format(Math.max(0, Math.round(n)));

const TABS: Array<{ key: View; label: string }> = [
	{ key: "overview", label: "访问统计" },
	{ key: "behavior", label: "用户行为" },
	{ key: "visitors", label: "访客明细" },
	{ key: "settings", label: "系统设置" },
];

function switchView(key: string) {
	if (
		key === "overview" ||
		key === "behavior" ||
		key === "visitors" ||
		key === "settings"
	) {
		view = key;
	}
}

function fmtDur(ms: number): string {
	if (!ms || ms < 1000) return "<1秒";
	const s = Math.round(ms / 1000);
	if (s < 60) return `${s}秒`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}分${s % 60}秒`;
	const h = Math.floor(m / 60);
	return `${h}小时${m % 60}分`;
}

function fmtDate(d: string): string {
	const parts = d.split("-");
	return parts.length === 3 ? `${parts[1]}-${parts[2]}` : d;
}

function fmtDateTime(ts: number): string {
	return new Intl.DateTimeFormat("zh-CN", {
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(ts);
}

// ============================================================================
// 数据加载
// ============================================================================

async function loadStats() {
	loading = true;
	error = "";
	try {
		const res = await fetch("/api/admin/stats/?days=30", {
			credentials: "same-origin",
		});
		const data = await res.json();
		if (!res.ok || data.ok !== true)
			throw new Error(data.error || "统计加载失败");
		stats = data.data as StatsData;
		lastUpdated = Date.now();
	} catch (e) {
		error = e instanceof Error ? e.message : "统计加载失败";
	} finally {
		loading = false;
	}
}

async function loadSettings() {
	try {
		const res = await fetch("/api/admin/settings/", {
			credentials: "same-origin",
		});
		const data = await res.json();
		if (!res.ok || data.ok !== true)
			throw new Error(data.error || "设置读取失败");
		settings = data.data as Settings;
		sEnabled = settings.enabled;
		sRecordIp = settings.recordIp;
		sMaskIp = settings.maskIp;
		sRetention = settings.retentionDays;
		sAdmins = (settings.adminLogins || []).join("\n");
	} catch (e) {
		error = e instanceof Error ? e.message : "设置读取失败";
	}
}

onMount(async () => {
	try {
		const res = await fetch("/api/auth/status/", {
			credentials: "same-origin",
		});
		const data = await res.json();
		if (data.authenticated === true && data.isAdmin === true) {
			authState = "ok";
			await Promise.all([loadStats(), loadSettings()]);
		} else {
			authState = "denied";
		}
	} catch {
		authState = "denied";
	}
});

// ============================================================================
// 设置保存 / 清理 / 导出
// ============================================================================

async function saveSettings() {
	saving = true;
	saveMsg = "";
	try {
		const res = await fetch("/api/admin/settings/", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			credentials: "same-origin",
			body: JSON.stringify({
				enabled: sEnabled,
				recordIp: sRecordIp,
				maskIp: sMaskIp,
				retentionDays: sRetention,
				adminLogins: sAdmins
					.split(/[\n,，]/)
					.map((x) => x.trim())
					.filter(Boolean),
			}),
		});
		const data = await res.json();
		if (!res.ok || data.ok !== true) throw new Error(data.error || "保存失败");
		settings = data.data;
		saveMsg = "设置已保存";
		setTimeout(() => (saveMsg = ""), 3000);
	} catch (e) {
		saveMsg = e instanceof Error ? e.message : "保存失败";
	} finally {
		saving = false;
	}
}

async function cleanNow() {
	cleaning = true;
	try {
		const res = await fetch("/api/admin/settings/", {
			method: "POST",
			credentials: "same-origin",
		});
		const data = await res.json();
		saveMsg = data.ok
			? `已清理 ${data.removed} 个过期文件`
			: data.error || "清理失败";
		setTimeout(() => (saveMsg = ""), 4000);
	} finally {
		cleaning = false;
	}
}

async function doExport(format: "csv" | "json") {
	exporting = format;
	try {
		const params = new URLSearchParams({ format });
		if (exportFrom) params.set("from", exportFrom);
		if (exportTo) params.set("to", exportTo);
		const res = await fetch(`/api/admin/export/?${params}`, {
			credentials: "same-origin",
		});
		if (!res.ok) {
			const data = await res.json().catch(() => null);
			throw new Error(data?.error || "导出失败");
		}
		const blob = await res.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `analytics-events.${format}`;
		a.click();
		URL.revokeObjectURL(url);
	} catch (e) {
		saveMsg = e instanceof Error ? e.message : "导出失败";
		setTimeout(() => (saveMsg = ""), 4000);
	} finally {
		exporting = "";
	}
}

// ============================================================================
// 图表（自定义 SVG，无第三方依赖）
// ============================================================================

const PALETTE_DEVICE = ["#8ec5ff", "#9fe4c6", "#ffd18a", "#c7b0ff", "#ffb2c0"];

function polarPoint(radius: number, angle: number): [number, number] {
	const radians = ((angle - 90) * Math.PI) / 180;
	return [50 + radius * Math.cos(radians), 50 + radius * Math.sin(radians)];
}

function donutSlice(startAngle: number, endAngle: number): string {
	const outerStart = polarPoint(46, startAngle);
	const outerEnd = polarPoint(46, endAngle);
	const innerStart = polarPoint(25, startAngle);
	const innerEnd = polarPoint(25, endAngle);
	const largeArc = endAngle - startAngle > 180 ? 1 : 0;
	return [
		`M ${outerStart[0].toFixed(3)} ${outerStart[1].toFixed(3)}`,
		`A 46 46 0 ${largeArc} 1 ${outerEnd[0].toFixed(3)} ${outerEnd[1].toFixed(3)}`,
		`L ${innerEnd[0].toFixed(3)} ${innerEnd[1].toFixed(3)}`,
		`A 25 25 0 ${largeArc} 0 ${innerStart[0].toFixed(3)} ${innerStart[1].toFixed(3)}`,
		"Z",
	].join(" ");
}

function donutSegments(
	values: LabelValue[],
): Array<{ d: string; color: string; ratio: number; label: string }> {
	const total = values.reduce((sum, v) => sum + v.value, 0) || 1;
	const palette = [...PALETTE_DEVICE, "#ff9d8f"];
	let angle = 0;
	return values.map((v, i) => {
		const ratio = v.value / total;
		const start = angle;
		angle += ratio * 360 || (values.length === 1 ? 359.999 : 0);
		return {
			d: donutSlice(start, angle),
			color: palette[i % palette.length],
			ratio,
			label: v.label,
		};
	});
}

// 折线图数据
const LINE_W = 760;
const LINE_H = 240;
const LINE_PAD = { l: 44, r: 14, t: 18, b: 30 };

let hoverIndex = $state(-1);

// 折线图派生数据（Svelte 模板表达式限制较多，统一在脚本区计算）
function lineChart(data: StatsData | null) {
	if (!data || data.trend.length < 2) return null;
	const n = data.trend.length;
	const maxV = Math.max(1, ...data.trend.flatMap((d) => [d.pv, d.uv]));
	const iw = LINE_W - LINE_PAD.l - LINE_PAD.r;
	const ih = LINE_H - LINE_PAD.t - LINE_PAD.b;
	const px = (i: number) => LINE_PAD.l + (i * iw) / (n - 1);
	const py = (v: number) => LINE_PAD.t + ih - (v / maxV) * ih;
	const line = (key: "pv" | "uv") =>
		data.trend
			.map(
				(d, i) =>
					`${i === 0 ? "M" : "L"} ${px(i).toFixed(1)} ${py(d[key]).toFixed(1)}`,
			)
			.join(" ");
	const bottom = (LINE_PAD.t + ih).toFixed(1);
	return {
		n,
		maxV,
		px,
		py,
		linePv: line("pv"),
		lineUv: line("uv"),
		areaPv: `${line("pv")} L ${px(n - 1).toFixed(1)} ${bottom} L ${LINE_PAD.l} ${bottom} Z`,
		areaUv: `${line("uv")} L ${px(n - 1).toFixed(1)} ${bottom} L ${LINE_PAD.l} ${bottom} Z`,
		ticks: Array.from({ length: 5 }, (_, i) => Math.round((maxV / 4) * i)),
	};
}

// 环形图分组（按标题聚合设备/浏览器两类）
function donutGroups(data: StatsData | null): Array<{
	title: string;
	segs: Array<{ d: string; color: string; ratio: number; label: string }>;
}> {
	if (!data) return [];
	const groups: Array<{ title: string; values: LabelValue[] }> = [
		{ title: "设备分布", values: data.devices },
		{ title: "浏览器偏好", values: data.browsers },
	];
	return groups.map((g) => ({ title: g.title, segs: donutSegments(g.values) }));
}

// 地域条形图最大值（Svelte 模板表达式限制较多，统一在脚本区计算）
function maxCountryOf(data: StatsData | null): number {
	if (!data || data.countries.length === 0) return 1;
	return Math.max(1, ...data.countries.map((c) => c.value));
}
</script>

{#if authState === "loading"}
	<div class="flex min-h-screen items-center justify-center">
		<div class="flex items-center gap-3 text-sm text-(--content-meta)">
			<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-(--primary) border-t-transparent"></span>
			正在验证身份…
		</div>
	</div>
{:else if authState === "denied"}
	<div class="flex min-h-screen items-center justify-center px-4">
		<div class="card-base onload-animation w-full max-w-md rounded-2xl p-8 text-center">
			<div class="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-(--primary)/10 text-(--primary)">
				<svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
				</svg>
			</div>
			<h1 class="text-lg font-bold">后台管理</h1>
			<p class="mt-2 text-sm text-(--content-meta)">此页面仅站长本人可访问，请先使用 GitHub 登录。</p>
			<div class="mt-6 flex flex-col gap-2.5">
				<a href="/api/auth/login/" class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#24292f] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
					</svg>
					GitHub 登录
				</a>
				<a href="/" class="text-sm text-(--content-meta) hover:text-(--primary)">返回主页</a>
			</div>
		</div>
	</div>
{:else}
	<main class="mx-auto w-full max-w-6xl px-4 pt-20 pb-16 sm:px-6">
		<!-- 顶栏 -->
		<header class="mb-6 flex flex-wrap items-center justify-between gap-4">
			<div>
				<h1 class="text-xl font-bold">后台管理</h1>
				<p class="mt-1 text-sm text-(--content-meta)">
					自托管访问统计 · {lastUpdated ? `更新于 ${new Date(lastUpdated).toLocaleTimeString("zh-CN")}` : "数据加载中"}
				</p>
			</div>
			<button
				type="button"
				class="inline-flex items-center gap-2 rounded-xl bg-(--primary)/10 px-4 py-2 text-sm font-semibold text-(--primary) transition hover:bg-(--primary)/20 disabled:opacity-50"
				onclick={loadStats}
				disabled={loading}
			>
				<svg class="h-4 w-4 {loading ? "animate-spin" : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" />
				</svg>
				刷新
			</button>
		</header>

		{#if error}
			<div class="card-base mb-6 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-500">
				{error}
			</div>
		{/if}

		<!-- 页签 -->
		<nav class="mb-6 flex flex-wrap gap-2" aria-label="后台管理模块">
			{#each [
				{ key: "overview", label: "访问统计" },
				{ key: "behavior", label: "用户行为" },
				{ key: "visitors", label: "访客明细" },
				{ key: "settings", label: "系统设置" },
			] as tab}
				<button
					type="button"
					onclick={() => (view = tab.key as View)}
					class="rounded-xl px-4 py-2 text-sm font-semibold transition {view === tab.key ? "bg-(--primary) text-white shadow-lg shadow-(--primary)/25" : "card-base text-(--content-meta) hover:text-(--primary)"}"
				>
					{tab.label}
				</button>
			{/each}
		</nav>

		{#if !stats && view !== "settings"}
			<div class="flex min-h-40 items-center justify-center text-sm text-(--content-meta)">
				<span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-(--primary) border-t-transparent"></span>
			</div>
		{:else if view === "overview" && stats}
			<!-- ======================== 访问统计 ======================== -->
			<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each [
					{ label: "今日访问量", pv: stats.today.pv, uv: stats.today.uv, color: "#4d86e8" },
					{ label: "昨日访问量", pv: stats.yesterday.pv, uv: stats.yesterday.uv, color: "#d777c9" },
					{ label: "累计访问量", pv: stats.cumulative.pv, uv: stats.cumulative.uv, color: "#39b99a" },
				] as kpi}
					<div class="card-base onload-animation relative overflow-hidden rounded-2xl p-5">
						<span class="absolute inset-y-0 left-0 w-1" style="background:{kpi.color}"></span>
						<p class="text-xs font-semibold tracking-wide text-(--content-meta)">{kpi.label}</p>
						<p class="mt-2 text-2xl font-bold tabular-nums" style="color:{kpi.color}">{fmt(kpi.pv)}</p>
						<p class="mt-1 text-xs text-(--content-meta)">独立访客 {fmt(kpi.uv)}</p>
					</div>
				{/each}
			</section>

			<!-- 趋势折线图 -->
			<section class="card-base onload-animation mt-4 rounded-2xl p-5">
				<header class="mb-4 flex flex-wrap items-center justify-between gap-2">
					<div>
						<h2 class="text-sm font-bold">访问趋势</h2>
						<p class="mt-0.5 text-xs text-(--content-meta)">近 {stats.rangeDays} 天浏览量 / 访客数</p>
					</div>
					<div class="flex items-center gap-4 text-xs text-(--content-meta)">
						<span class="flex items-center gap-1.5"><i class="h-2 w-2 rounded-full" style="background:#4d86e8"></i>浏览量</span>
						<span class="flex items-center gap-1.5"><i class="h-2 w-2 rounded-full" style="background:#d777c9"></i>访客数</span>
					</div>
				</header>

				{#if !lineChart(stats)}
					<p class="py-10 text-center text-sm text-(--content-meta)">暂无足够数据，等待更多访问后展示趋势</p>
				{:else}
					{@const chart = lineChart(stats)}
					<div class="relative">
						<svg
							viewBox="0 0 {LINE_W} {LINE_H}"
							class="w-full"
							role="img"
							aria-label="近 30 天访问趋势图"
							onpointermove={(e) => {
								const rect = e.currentTarget.getBoundingClientRect();
								const ratio = (e.clientX - rect.left) / rect.width;
								hoverIndex = Math.min(chart.n - 1, Math.max(0, Math.round((ratio * LINE_W - LINE_PAD.l) / ((LINE_W - LINE_PAD.l - LINE_PAD.r) / (chart.n - 1)))));
							}}
							onpointerleave={() => (hoverIndex = -1)}
						>
							<defs>
								<linearGradient id="area-pv" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color="#4d86e8" stop-opacity="0.28" />
									<stop offset="100%" stop-color="#4d86e8" stop-opacity="0" />
								</linearGradient>
								<linearGradient id="area-uv" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color="#d777c9" stop-opacity="0.22" />
									<stop offset="100%" stop-color="#d777c9" stop-opacity="0" />
								</linearGradient>
							</defs>

							<!-- 网格线 -->
							{#each chart.ticks as v}
								<g>
									<line x1={LINE_PAD.l} y1={chart.py(v)} x2={LINE_W - LINE_PAD.r} y2={chart.py(v)} stroke="currentColor" class="text-(--line-divider)" stroke-opacity="0.5" stroke-dasharray="3 4" />
									<text x={LINE_PAD.l - 8} y={chart.py(v) + 4} text-anchor="end" font-size="10" fill="currentColor" class="text-(--content-meta)">{fmt(v)}</text>
								</g>
							{/each}

							<!-- X 轴标签 -->
							{#each stats.trend as d, i}
								{#if i % Math.ceil(chart.n / 7) === 0 || i === chart.n - 1}
									<text x={chart.px(i)} y={LINE_H - 8} text-anchor="middle" font-size="10" fill="currentColor" class="text-(--content-meta)">{fmtDate(d.date)}</text>
								{/if}
							{/each}

							<!-- 面积与折线 -->
							<path d={chart.areaPv} fill="url(#area-pv)" />
							<path d={chart.areaUv} fill="url(#area-uv)" />
							<path d={chart.linePv} fill="none" stroke="#4d86e8" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
							<path d={chart.lineUv} fill="none" stroke="#d777c9" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

							<!-- 悬停指示 -->
							{#if hoverIndex >= 0}
								<line x1={chart.px(hoverIndex)} y1={LINE_PAD.t} x2={chart.px(hoverIndex)} y2={LINE_H - LINE_PAD.b} stroke="#4d86e8" stroke-opacity="0.35" />
								<circle cx={chart.px(hoverIndex)} cy={chart.py(stats.trend[hoverIndex].pv)} r="4.5" fill="#4d86e8" stroke="#fff" stroke-width="1.5" />
								<circle cx={chart.px(hoverIndex)} cy={chart.py(stats.trend[hoverIndex].uv)} r="4.5" fill="#d777c9" stroke="#fff" stroke-width="1.5" />
							{/if}
						</svg>

						{#if hoverIndex >= 0 && stats.trend[hoverIndex]}
							<div
								class="pointer-events-none absolute top-0 z-10 rounded-xl border bg-(--card-bg)/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
								style="left:{Math.min(chart.px(hoverIndex) / LINE_W * 100, 70)}%; transform:translateX(-50%)"
							>
								<p class="mb-1 font-bold">{stats.trend[hoverIndex].date}</p>
								<p class="text-(--content-meta)">浏览量 <b class="text-(--deep-text)">{fmt(stats.trend[hoverIndex].pv)}</b></p>
								<p class="text-(--content-meta)">访客数 <b class="text-(--deep-text)">{fmt(stats.trend[hoverIndex].uv)}</b></p>
							</div>
						{/if}
					</div>
				{/if}
			</section>

			<!-- 分布 -->
			<section class="mt-4 grid gap-4 lg:grid-cols-3">
				{#each donutGroups(stats) as group}
					<div class="card-base onload-animation rounded-2xl p-5">
						<h2 class="text-sm font-bold">{group.title}</h2>
						<p class="mt-0.5 text-xs text-(--content-meta)">访客从哪里来</p>
						{#if group.segs.length === 0}
							<p class="py-8 text-center text-sm text-(--content-meta)">暂无数据</p>
						{:else}
							<div class="mt-3 flex items-center gap-4">
								<svg viewBox="0 0 100 100" class="w-28 flex-none">
									<circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" class="text-(--muted)" stroke-opacity="0.3" stroke-width="2" />
									{#each group.segs as s}
										<path d={s.d} fill={s.color} stroke="var(--card-bg)" stroke-width="1.5" />
									{/each}
								</svg>
								<ul class="min-w-0 flex-1 space-y-1.5">
									{#each group.segs as s}
										<li class="flex items-center gap-2 text-xs">
											<i class="h-2 w-2 flex-none rounded-full" style="background:{s.color}"></i>
											<span class="min-w-0 flex-1 truncate text-(--content-meta)">{s.label}</span>
											<b class="tabular-nums text-(--deep-text)">{Math.round(s.ratio * 100)}%</b>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{/each}

				<!-- 地域分布 -->
				<div class="card-base onload-animation rounded-2xl p-5">
					<h2 class="text-sm font-bold">地域分布</h2>
					<p class="mt-0.5 text-xs text-(--content-meta)">按国家/地区</p>
					{#if stats.countries.length === 0}
						<p class="py-8 text-center text-sm text-(--content-meta)">暂无数据</p>
					{:else}
					<ul class="mt-3 space-y-2">
						{#each stats.countries as c}
							<li>
								<div class="flex items-center justify-between text-xs">
									<span class="truncate text-(--content-meta)">{c.label}</span>
									<b class="tabular-nums text-(--deep-text)">{fmt(c.value)}</b>
								</div>
								<div class="mt-1 h-2 overflow-hidden rounded-full bg-(--muted)/40">
									<div class="h-full rounded-full bg-(--primary)" style="width:{Math.max(3, (c.value / maxCountryOf(stats)) * 100)}%"></div>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
				</div>
			</section>
		{:else if view === "behavior" && stats}
			<!-- ======================== 用户行为 ======================== -->
			<section class="grid gap-4 lg:grid-cols-2">
				<div class="card-base onload-animation rounded-2xl p-5">
					<h2 class="text-sm font-bold">热门内容排行</h2>
					<p class="mt-0.5 mb-3 text-xs text-(--content-meta)">近 {stats.rangeDays} 天访问量最高的页面</p>
					{#if stats.topPaths.length === 0}
						<p class="py-10 text-center text-sm text-(--content-meta)">暂无数据</p>
					{:else}
						{@const maxPv = Math.max(1, ...stats.topPaths.map((t) => t.pv))}
						<ol class="space-y-2.5">
								{#each stats.topPaths as t, i}
									<li>
										<div class="flex items-center gap-2 text-sm">
											<span class="w-5 flex-none text-xs font-bold {i < 3 ? "text-(--primary)" : "text-(--content-meta)"}">{i + 1}</span>
											<a href={t.path} target="_blank" rel="noreferrer" class="min-w-0 flex-1 truncate font-medium text-(--deep-text) hover:text-(--primary)">{t.path}</a>
											<span class="flex-none text-xs text-(--content-meta)">{fmt(t.pv)} PV · {fmt(t.uv)} UV · {fmtDur(t.avgDwell)}</span>
										</div>
										<div class="ml-7 mt-1 h-1.5 overflow-hidden rounded-full bg-(--muted)/40">
											<div class="h-full rounded-full bg-gradient-to-r from-(--primary) to-[#d777c9]" style="width:{Math.max(3, (t.pv / maxPv) * 100)}%"></div>
										</div>
									</li>
								{/each}
							</ol>
					{/if}
				</div>

				<div class="card-base onload-animation rounded-2xl p-5">
					<h2 class="text-sm font-bold">最近浏览路径</h2>
					<p class="mt-0.5 mb-3 text-xs text-(--content-meta)">最近 {stats.behaviors.length} 次页面访问</p>
					{#if stats.behaviors.length === 0}
						<p class="py-10 text-center text-sm text-(--content-meta)">暂无数据</p>
					{:else}
						<ul class="space-y-2.5">
								{#each stats.behaviors as b}
									<li class="flex items-center gap-2 text-sm">
										<span class="flex-none text-xs tabular-nums text-(--content-meta)">{fmtDateTime(b.ts)}</span>
										<a href={b.path} target="_blank" rel="noreferrer" class="min-w-0 flex-1 truncate font-medium text-(--deep-text) hover:text-(--primary)">{b.path}</a>
										<span class="flex-none text-xs text-(--content-meta)">{fmtDur(b.dwell)}</span>
										<span class="hidden flex-none text-xs text-(--content-meta) sm:inline">{b.country}</span>
									</li>
								{/each}
							</ul>
					{/if}
				</div>
			</section>
		{:else if view === "visitors" && stats}
			<!-- ======================== 访客明细 ======================== -->
			{@const ipTotal = stats.totalIpCount}
			{@const ipPageCount = Math.max(1, Math.ceil(ipTotal / IP_PAGE_SIZE))}
			{@const safePage = Math.min(ipPage, ipPageCount)}
			{@const ipRows = stats.ipList.slice((safePage - 1) * IP_PAGE_SIZE, safePage * IP_PAGE_SIZE)}
			<div class="card-base onload-animation rounded-2xl p-5">
				<header class="mb-4 flex flex-wrap items-center justify-between gap-2">
					<div>
						<h2 class="text-sm font-bold">访客 IP 明细</h2>
						<p class="mt-0.5 text-xs text-(--content-meta)">
							近 {stats.rangeDays} 天共 {fmt(ipTotal)} 个 IP · {settings?.maskIp ? "已启用 IP 脱敏展示" : "显示完整 IP"}
						</p>
					</div>
				</header>
				{#if ipTotal === 0}
					<p class="py-10 text-center text-sm text-(--content-meta)">暂无数据</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-left text-sm">
							<thead>
								<tr class="border-b text-xs text-(--content-meta)">
									<th class="py-2.5 pr-4 font-semibold">IP 地址</th>
									<th class="py-2.5 pr-4 font-semibold">地域</th>
									<th class="py-2.5 pr-4 text-right font-semibold">访问次数</th>
									<th class="py-2.5 pr-4 text-right font-semibold">访客数</th>
									<th class="py-2.5 font-semibold">最后访问</th>
								</tr>
							</thead>
							<tbody>
									{#each ipRows as row}
										<tr class="border-b border-(--line-divider)/40 transition hover:bg-(--muted)/20">
											<td class="py-2.5 pr-4 font-mono text-xs text-(--deep-text)">{row.ip}</td>
											<td class="py-2.5 pr-4 text-(--content-meta)">{row.country}</td>
											<td class="py-2.5 pr-4 text-right tabular-nums">{fmt(row.pv)}</td>
											<td class="py-2.5 pr-4 text-right tabular-nums">{fmt(row.uv)}</td>
											<td class="py-2.5 text-xs tabular-nums text-(--content-meta)">{fmtDateTime(row.lastSeen)}</td>
										</tr>
									{/each}
								</tbody>
						</table>
					</div>
					<ClientPagination totalItems={ipTotal} itemsPerPage={IP_PAGE_SIZE} currentPage={safePage} onPageChange={(p) => (ipPage = p)} />
				{/if}
			</div>
		{:else if view === "settings"}
			<!-- ======================== 系统设置 ======================== -->
			<div class="grid gap-4 lg:grid-cols-2">
				<section class="card-base onload-animation rounded-2xl p-5">
					<h2 class="text-sm font-bold">统计开关</h2>
					<p class="mt-0.5 mb-4 text-xs text-(--content-meta)">修改后点击保存生效</p>

					{#each [
						{ key: "enabled", label: "统计埋点", desc: "关闭后停止接收新的访问事件（历史数据保留）", checked: sEnabled },
						{ key: "recordIp", label: "记录访客 IP", desc: "关闭后不再保存 IP 字段（已有数据不受影响）", checked: sRecordIp },
						{ key: "maskIp", label: "隐藏 IP 后段", desc: "展示时脱敏（如 192.168.1.*），IPv6 保留前三组", checked: sMaskIp },
					] as item}
						<div class="flex items-center justify-between gap-4 border-b border-(--line-divider)/40 py-3.5 last:border-0">
							<div>
								<p class="text-sm font-semibold">{item.label}</p>
								<p class="mt-0.5 text-xs text-(--content-meta)">{item.desc}</p>
							</div>
							<button
								type="button"
								role="switch"
								aria-checked={item.checked}
								onclick={() => {
									if (item.key === "enabled") sEnabled = !sEnabled;
									if (item.key === "recordIp") sRecordIp = !sRecordIp;
									if (item.key === "maskIp") sMaskIp = !sMaskIp;
								}}
								class="relative h-6 w-11 flex-none rounded-full transition {item.checked ? "bg-(--primary)" : "bg-(--muted)"}"
							>
								<span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all {item.checked ? "left-[1.375rem]" : "left-0.5"}" />
							</button>
						</div>
					{/each}

					<div class="mt-4 space-y-4">
						<label class="block">
							<span class="text-xs font-semibold text-(--content-meta)">数据保留天数</span>
							<input
								type="number"
								min="7"
								max="3650"
								bind:value={sRetention}
								class="mt-1.5 w-full rounded-xl border border-(--line-divider) bg-(--card-bg) px-3 py-2 text-sm outline-none focus:border-(--primary)"
							/>
						</label>
						<label class="block">
							<span class="text-xs font-semibold text-(--content-meta)">管理员白名单（每行一个 GitHub 登录名）</span>
							<textarea
								bind:value={sAdmins}
								rows={3}
								class="mt-1.5 w-full resize-y rounded-xl border border-(--line-divider) bg-(--card-bg) px-3 py-2 font-mono text-xs outline-none focus:border-(--primary)"
							></textarea>
						</label>
					</div>

					<div class="mt-5 flex items-center gap-3">
						<button
							type="button"
							onclick={saveSettings}
							disabled={saving}
							class="inline-flex items-center gap-2 rounded-xl bg-(--primary) px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-(--primary)/25 transition hover:opacity-90 disabled:opacity-50"
						>
							{#if saving}<span class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>{/if}
							保存设置
						</button>
						{#if saveMsg}
							<span class="text-xs text-(--content-meta)">{saveMsg}</span>
						{/if}
					</div>
				</section>

				<section class="card-base onload-animation rounded-2xl p-5">
					<h2 class="text-sm font-bold">数据导出</h2>
					<p class="mt-0.5 mb-4 text-xs text-(--content-meta)">导出事件明细（IP 按当前脱敏设置处理）</p>

					<div class="grid grid-cols-2 gap-3">
						<label class="block">
							<span class="text-xs font-semibold text-(--content-meta)">开始日期</span>
							<input type="date" bind:value={exportFrom} class="mt-1.5 w-full rounded-xl border border-(--line-divider) bg-(--card-bg) px-3 py-2 text-sm outline-none focus:border-(--primary)" />
						</label>
						<label class="block">
							<span class="text-xs font-semibold text-(--content-meta)">结束日期</span>
							<input type="date" bind:value={exportTo} class="mt-1.5 w-full rounded-xl border border-(--line-divider) bg-(--card-bg) px-3 py-2 text-sm outline-none focus:border-(--primary)" />
						</label>
					</div>
					<p class="mt-2 text-xs text-(--content-meta)">留空则默认导出最近 30 天</p>

					<div class="mt-4 flex flex-wrap gap-2.5">
						<button
							type="button"
							onclick={() => doExport("csv")}
							disabled={exporting !== ""}
							class="inline-flex items-center gap-2 rounded-xl bg-[#27ae60]/90 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
						>
							<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
							{exporting === "csv" ? "导出中…" : "导出 CSV"}
						</button>
						<button
							type="button"
							onclick={() => doExport("json")}
							disabled={exporting !== ""}
							class="inline-flex items-center gap-2 rounded-xl bg-[#4d86e8]/90 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
						>
							<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
							{exporting === "json" ? "导出中…" : "导出 JSON"}
						</button>
					</div>

					<hr class="my-5 border-(--line-divider)" />

					<h3 class="text-sm font-bold">数据维护</h3>
					<p class="mt-0.5 text-xs text-(--content-meta)">
						过期事件文件将在访问统计时自动清理（{sRetention} 天内），也可手动立即清理。
					</p>
					<button
						type="button"
						onclick={cleanNow}
						disabled={cleaning}
						class="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
					>
						{#if cleaning}<span class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></span>{/if}
						立即清理过期数据
					</button>
				</section>
			</div>
		{/if}
	</main>
{/if}
