"use client";

import type { LucideIcon } from "lucide-react";
import {
	Cloud,
	CloudDrizzle,
	CloudFog,
	CloudLightning,
	CloudMoon,
	CloudRain,
	CloudSun,
	Compass,
	Droplets,
	Gauge,
	Loader2,
	LocateFixed,
	MapPin,
	Moon,
	RotateCw,
	Search,
	Snowflake,
	Sun,
	SunMedium,
	Sunrise,
	Sunset,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
// 天气与穿衣：实时主卡（天气+昼夜渐变）/ 详情网格 / 逐小时 / 7 日区间条 / 生活指数 / 空气质量 / 城市搜索
import type { ReactElement, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type {
	AirQuality,
	City,
	WeatherData,
	WeatherKind,
} from "@/components/react-treasure/lib/weather";
import {
	aqiInfo,
	buildLifeIndices,
	CITIES,
	cardGradient,
	codeToInfo,
	detectCityByIp,
	detectPreciseCity,
	fetchAirQuality,
	fetchWeather,
	getSavedCity,
	saveCity,
	searchCities,
	uvLevel,
	windDirectionText,
} from "@/components/react-treasure/lib/weather";
import ToolShell from "../tool-shell";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/** 天气大类 → lucide 图标，夜间晴 / 多云换成月亮系 */
function WeatherGlyph({
	kind,
	isDay,
	className,
}: {
	kind: WeatherKind;
	isDay: boolean;
	className?: string;
}) {
	const icons: Record<WeatherKind, { day: LucideIcon; night: LucideIcon }> = {
		clear: { day: Sun, night: Moon },
		partly: { day: CloudSun, night: CloudMoon },
		cloudy: { day: Cloud, night: Cloud },
		fog: { day: CloudFog, night: CloudFog },
		drizzle: { day: CloudDrizzle, night: CloudDrizzle },
		rain: { day: CloudRain, night: CloudRain },
		snow: { day: Snowflake, night: Snowflake },
		thunder: { day: CloudLightning, night: CloudLightning },
	};
	const Icon = isDay ? icons[kind].day : icons[kind].night;
	return <Icon className={className} strokeWidth={1.6} />;
}

/** 区块标题 */
function SectionTitle({ children }: { children: ReactNode }) {
	return <h2 className="mb-2.5 mt-6 text-sm font-semibold">{children}</h2>;
}

/** 入场动画包裹，按顺序轻微错开 */
function Reveal({ index, children }: { index: number; children: ReactNode }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: index * 0.06 }}
		>
			{children}
		</motion.div>
	);
}

/** 详情小卡 */
function DetailTile({
	icon: Icon,
	label,
	value,
	sub,
}: {
	icon: LucideIcon;
	label: string;
	value: string;
	sub?: string;
}) {
	return (
		<div className="rounded-2xl bg-secondary/10 p-3.5">
			<div className="flex items-center gap-1.5 text-xs text-secondary">
				<Icon className="h-3.5 w-3.5" />
				{label}
			</div>
			<div className="mt-1.5 text-sm font-semibold tabular-nums">{value}</div>
			{sub && <div className="mt-0.5 text-xs text-secondary">{sub}</div>}
		</div>
	);
}

/** HH:MM */
function formatHM(ts: number): string {
	return new Date(ts).toLocaleTimeString("zh-CN", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

/** 7 日星期标签 */
function dayLabel(date: string, i: number): string {
	if (i === 0) return "今天";
	if (i === 1) return "明天";
	const [y, m, d] = date.split("-").map(Number);
	return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

export default function WeatherPage(): ReactElement {
	const [city, setCity] = useState<City | null>(null);
	const [weather, setWeather] = useState<WeatherData | null>(null);
	const [air, setAir] = useState<AirQuality | null>(null);
	const [loading, setLoading] = useState(true);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [locating, setLocating] = useState(false);

	// 城市搜索浮层状态
	const [keyword, setKeyword] = useState("");
	const [results, setResults] = useState<City[]>([]);
	const [searching, setSearching] = useState(false);

	/** 拉取天气与空气质量（空气质量失败不影响主体） */
	const load = useCallback(async (c: City) => {
		setLoading(true);
		const [w, a] = await Promise.all([fetchWeather(c), fetchAirQuality(c)]);
		setWeather(w);
		if (a) setAir(a);
		setLoading(false);
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			// 先本地城市，再 IP 兜底
			let c = getSavedCity();
			if (!c) c = await detectCityByIp();
			if (cancelled) return;
			if (c) {
				saveCity(c);
				setCity(c);
				await load(c);
			} else {
				setLoading(false);
			}
			if (cancelled) return;

			// 后台浏览器精确定位升级，成功才覆盖
			const precise = await detectPreciseCity();
			if (cancelled || !precise) return;
			saveCity(precise);
			setCity(precise);
			const [w, a] = await Promise.all([
				fetchWeather(precise),
				fetchAirQuality(precise),
			]);
			if (cancelled) return;
			if (w) setWeather(w);
			if (a) setAir(a);
		})();
		return () => {
			cancelled = true;
		};
	}, [load]);

	// 搜索框防抖 400ms
	useEffect(() => {
		const q = keyword.trim();
		if (!q) {
			setResults([]);
			setSearching(false);
			return;
		}
		setSearching(true);
		let alive = true;
		const timer = setTimeout(async () => {
			const list = await searchCities(q);
			if (alive) {
				setResults(list);
				setSearching(false);
			}
		}, 400);
		return () => {
			alive = false;
			clearTimeout(timer);
		};
	}, [keyword]);

	const applyCity = async (c: City) => {
		setPickerOpen(false);
		setKeyword("");
		setResults([]);
		saveCity(c);
		setCity(c);
		setAir(null);
		await load(c);
	};

	// 精确定位优先，失败回退 IP
	const handleLocate = async () => {
		setLocating(true);
		try {
			const c = (await detectPreciseCity()) ?? (await detectCityByIp());
			if (c) await applyCity(c);
		} finally {
			setLocating(false);
		}
	};

	const cur = weather?.current;
	const today = weather?.daily[0];
	const grad = cur ? cardGradient(cur.kind, cur.isDay) : null;
	const indices = weather ? buildLifeIndices(weather) : [];

	// 7 日温度区间跨周归一化
	const weekMin = weather ? Math.min(...weather.daily.map((d) => d.tMin)) : 0;
	const weekMax = weather ? Math.max(...weather.daily.map((d) => d.tMax)) : 1;
	const weekRange = weekMax - weekMin || 1;

	return (
		<ToolShell
			icon={CloudSun}
			title="天气与穿衣"
			desc="阴晴雨雪早知道，穿对衣服出门刚刚好"
			wide
		>
			{/* 加载骨架 */}
			{loading && !weather && (
				<div className="animate-pulse">
					<div className="h-52 rounded-3xl bg-secondary/20" />
					<div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="h-[74px] rounded-2xl bg-secondary/20" />
						))}
					</div>
					<div className="mt-6 h-24 rounded-2xl bg-secondary/20" />
					<div className="mt-4 h-40 rounded-2xl bg-secondary/20" />
				</div>
			)}

			{/* 失败重试 */}
			{!loading && !weather && (
				<div className="flex flex-col items-center py-14 text-center">
					<CloudDrizzle className="mb-3 h-10 w-10 text-secondary/50" />
					<p className="text-sm text-secondary">
						天气信息获取失败了，稍后再试一次吧
					</p>
					<div className="mt-4 flex gap-2.5">
						{city && (
							<button
								type="button"
								onClick={() => load(city)}
								className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
							>
								<RotateCw className="h-3.5 w-3.5" />
								重试
							</button>
						)}
						<button
							type="button"
							onClick={() => setPickerOpen(true)}
							className="cursor-pointer rounded-xl bg-secondary/15 px-4 py-2 text-sm font-medium transition-opacity hover:opacity-70"
						>
							手动选择城市
						</button>
					</div>
				</div>
			)}

			{weather && city && cur && grad && (
				<div>
					{/* 当前天气主卡：背景随天气 + 昼夜渐变 */}
					<Reveal index={0}>
						<div
							style={grad.style}
							className={`relative overflow-hidden rounded-3xl p-6 shadow-sm max-sm:p-5 ${
								grad.light ? "text-slate-800" : "text-white"
							}`}
						>
							<div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
							<div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

							{/* 城市与更新时间 */}
							<div className="relative flex items-start justify-between gap-3">
								<div className="min-w-0">
									<div className="flex items-center gap-1 text-sm font-semibold">
										<MapPin className="h-4 w-4 shrink-0" />
										<span className="truncate">
											{city.district
												? `${city.district} · ${city.name}`
												: city.name}
										</span>
									</div>
									<div
										className={`mt-0.5 text-[11px] ${grad.light ? "text-slate-700/70" : "text-white/70"}`}
									>
										{today?.date.slice(5).replace("-", "/")} 更新于{" "}
										{formatHM(weather.updatedAt)}
									</div>
								</div>
								<button
									type="button"
									onClick={() => setPickerOpen(true)}
									className={`shrink-0 cursor-pointer rounded-full px-3 py-1 text-xs font-medium backdrop-blur transition-opacity hover:opacity-80 ${
										grad.light ? "bg-slate-500/10" : "bg-white/20"
									}`}
								>
									切换城市
								</button>
							</div>

							{/* 大图标 + 温度 */}
							<div className="relative mt-4 flex flex-col items-center">
								<WeatherGlyph
									kind={cur.kind}
									isDay={cur.isDay}
									className="h-20 w-20"
								/>
								<div className="font-averia mt-2 text-7xl leading-none font-medium tabular-nums">
									{cur.temp}°
								</div>
								<div className="mt-2.5 text-sm font-medium">{cur.text}</div>
								<div
									className={`mt-1 text-xs ${grad.light ? "text-slate-700/75" : "text-white/75"}`}
								>
									体感 {cur.feelsLike}°
									{today && ` · 今日 ${today.tMin}° ~ ${today.tMax}°`}
									{cur.precipitation > 0 && ` · 降水 ${cur.precipitation}mm`}
								</div>
							</div>
						</div>
					</Reveal>

					{/* 详情网格 */}
					<Reveal index={1}>
						<div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
							<DetailTile
								icon={Droplets}
								label="湿度"
								value={`${cur.humidity}%`}
							/>
							<DetailTile
								icon={Compass}
								label="风速风向"
								value={`${cur.windSpeed} km/h`}
								sub={`${windDirectionText(cur.windDeg)} · ${cur.windDeg}°`}
							/>
							<DetailTile
								icon={Gauge}
								label="气压"
								value={`${cur.pressure} hPa`}
							/>
							<DetailTile
								icon={SunMedium}
								label="紫外线"
								value={today ? `${today.uvMax}` : "—"}
								sub={today ? uvLevel(today.uvMax) : undefined}
							/>
							<DetailTile
								icon={Cloud}
								label="云量"
								value={`${cur.cloudCover}%`}
							/>
							<div className="rounded-2xl bg-secondary/10 p-3.5">
								<div className="flex items-center gap-1.5 text-xs text-secondary">
									<Sunrise className="h-3.5 w-3.5" />
									日出日落
								</div>
								<div className="mt-1.5 space-y-0.5 text-xs tabular-nums">
									<div className="flex items-center gap-1 font-medium">
										<Sunrise className="h-3 w-3 text-amber-500" />
										{today?.sunrise ?? "--:--"}
									</div>
									<div className="flex items-center gap-1 font-medium">
										<Sunset className="h-3 w-3 text-orange-500" />
										{today?.sunset ?? "--:--"}
									</div>
								</div>
							</div>
						</div>
					</Reveal>

					{/* 空气质量：请求失败则不渲染 */}
					{air?.aqi != null && (
						<Reveal index={2}>
							<div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-slate-200/60 bg-white/50 p-3.5">
								<span className="text-xs font-medium">空气质量</span>
								{(() => {
									const info = aqiInfo(air.aqi as number);
									return (
										<span
											className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.badge}`}
										>
											<span
												className={`h-1.5 w-1.5 rounded-full ${info.dot}`}
											/>
											{info.label} {air.aqi}
										</span>
									);
								})()}
								<span className="text-xs text-secondary tabular-nums">
									PM2.5 {air.pm25 ?? "—"} μg/m³
								</span>
								<span className="text-xs text-secondary tabular-nums">
									PM10 {air.pm10 ?? "—"} μg/m³
								</span>
							</div>
						</Reveal>
					)}

					{/* 逐小时预报（未来 24 小时，已过整点在数据层过滤） */}
					{weather.hourly.length > 0 && (
						<Reveal index={3}>
							<SectionTitle>逐小时预报</SectionTitle>
							<div className="flex gap-2 overflow-x-auto pb-2">
								{weather.hourly.map((h, i) => (
									<div
										key={h.time}
										className="flex w-14 shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-secondary/10 py-3"
									>
										<span className="text-[11px] text-secondary">
											{i === 0 ? "现在" : `${Number(h.time.slice(11, 13))}时`}
										</span>
										<WeatherGlyph
											kind={codeToInfo(h.code).kind}
											isDay={h.isDay}
											className="h-5 w-5 text-slate-600"
										/>
										<span className="text-sm font-semibold tabular-nums">
											{h.temp}°
										</span>
										<span className="flex items-center gap-0.5 text-[10px] text-sky-500 tabular-nums">
											<Droplets className="h-2.5 w-2.5" />
											{h.pop}%
										</span>
									</div>
								))}
							</div>
						</Reveal>
					)}

					{/* 7 日预报：跨周归一化温度区间条 */}
					<Reveal index={4}>
						<SectionTitle>7 日预报</SectionTitle>
						<div className="rounded-2xl bg-secondary/10 px-4 py-1.5">
							{weather.daily.map((d, i) => {
								const left = ((d.tMin - weekMin) / weekRange) * 100;
								const width = Math.max(
									6,
									((d.tMax - d.tMin) / weekRange) * 100,
								);
								return (
									<div
										key={d.date}
										className="flex items-center gap-2.5 border-b border-slate-400/10 py-2.5 last:border-0"
									>
										<div className="w-10 shrink-0">
											<div
												className={`text-xs font-semibold ${i === 0 ? "text-brand" : ""}`}
											>
												{dayLabel(d.date, i)}
											</div>
											<div className="mt-0.5 text-[10px] text-secondary tabular-nums">
												{d.date.slice(5).replace("-", "/")}
											</div>
										</div>
										<WeatherGlyph
											kind={d.kind}
											isDay
											className="h-5 w-5 shrink-0 text-slate-600"
										/>
										<span className="w-6 shrink-0 text-right text-xs text-sky-500 tabular-nums">
											{d.tMin}°
										</span>
										<div className="relative h-1.5 flex-1 rounded-full bg-slate-400/15">
											<div
												className="absolute top-0 h-full rounded-full bg-gradient-to-r from-sky-400 to-orange-400"
												style={{ left: `${left}%`, width: `${width}%` }}
											/>
										</div>
										<span className="w-6 shrink-0 text-xs text-orange-500 tabular-nums">
											{d.tMax}°
										</span>
										<span className="w-12 shrink-0 truncate text-right text-[11px] text-secondary">
											{d.text}
										</span>
									</div>
								);
							})}
						</div>
					</Reveal>

					{/* 生活指数（本地规则） */}
					<Reveal index={5}>
						<SectionTitle>生活指数</SectionTitle>
						<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
							{indices.map((idx) => (
								<div
									key={idx.name}
									className="rounded-2xl bg-secondary/10 p-3.5"
								>
									<div className="flex items-center justify-between gap-1">
										<span className="flex items-center gap-1.5 text-xs text-secondary">
											<span className="text-base leading-none">
												{idx.emoji}
											</span>
											{idx.name}
										</span>
										<span className="shrink-0 text-xs font-semibold text-brand">
											{idx.level}
										</span>
									</div>
									<p className="mt-1.5 text-xs leading-relaxed text-secondary">
										{idx.advice}
									</p>
								</div>
							))}
						</div>
					</Reveal>

					<p className="mt-6 text-center text-[11px] text-secondary">
						数据来自 open-meteo · 浏览器本地缓存 30 分钟
					</p>
				</div>
			)}

			{/* 城市选择浮层：搜索 + 热门城市 + 定位 */}
			<AnimatePresence>
				{pickerOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={() => setPickerOpen(false)}
						className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center sm:p-6"
					>
						<motion.div
							initial={{ y: 40, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: 40, opacity: 0 }}
							transition={{ duration: 0.25 }}
							onClick={(e) => e.stopPropagation()}
							className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-white/95 p-5 shadow-xl backdrop-blur sm:rounded-3xl"
						>
							<div className="flex items-center justify-between">
								<span className="text-sm font-semibold">选择城市</span>
								<button
									type="button"
									onClick={() => setPickerOpen(false)}
									className="cursor-pointer rounded-lg p-1 text-secondary transition-opacity hover:opacity-70"
									title="关闭"
								>
									<X className="h-4 w-4" />
								</button>
							</div>

							{/* 搜索框 */}
							<div className="relative mt-3">
								<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-secondary" />
								<input
									type="text"
									value={keyword}
									onChange={(e) => setKeyword(e.target.value)}
									placeholder="搜索城市名，如 苏州 / Tokyo"
									className="w-full rounded-xl border border-transparent bg-slate-100 py-2.5 pr-9 pl-9 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
								/>
								{searching && (
									<Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-secondary" />
								)}
							</div>

							<div className="mt-3 flex-1 overflow-y-auto">
								{/* 搜索结果 */}
								{keyword.trim() ? (
									searching ? (
										<p className="py-8 text-center text-xs text-secondary">
											搜索中...
										</p>
									) : results.length > 0 ? (
										<div className="space-y-1.5">
											{results.map((r) => (
												<button
													key={`${r.name}-${r.lat}-${r.lon}`}
													type="button"
													onClick={() => applyCity(r)}
													className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl bg-slate-100 px-3 py-2.5 text-left transition-opacity hover:opacity-70"
												>
													<MapPin className="h-4 w-4 shrink-0 text-brand" />
													<span className="min-w-0 flex-1">
														<span className="block truncate text-sm font-medium">
															{r.name}
														</span>
														<span className="block truncate text-[11px] text-secondary">
															{[r.district, r.country]
																.filter(Boolean)
																.join(" · ")}
														</span>
													</span>
												</button>
											))}
										</div>
									) : (
										<p className="py-8 text-center text-xs text-secondary">
											没有找到相关城市
										</p>
									)
								) : (
									<>
										{/* 热门城市 */}
										<div className="text-xs font-medium text-secondary">
											热门城市
										</div>
										<div className="mt-2 grid grid-cols-4 gap-2">
											{CITIES.map((c) => {
												const active = city?.name === c.name;
												return (
													<button
														key={c.name}
														type="button"
														onClick={() => applyCity(c)}
														className={`cursor-pointer rounded-xl border px-2 py-2 text-sm transition-colors ${
															active
																? "border-brand/40 bg-brand/10 font-medium text-brand"
																: "border-transparent bg-slate-100 hover:opacity-70"
														}`}
													>
														{c.name}
													</button>
												);
											})}
										</div>
									</>
								)}
							</div>

							{/* 精确定位（失败走 IP 兜底） */}
							<button
								type="button"
								onClick={handleLocate}
								disabled={locating}
								className="mt-4 flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
							>
								{locating ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<LocateFixed className="h-4 w-4" />
								)}
								{locating ? "定位中..." : "使用当前位置"}
							</button>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</ToolShell>
	);
}
