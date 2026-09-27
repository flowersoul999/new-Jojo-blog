// 天气数据层：open-meteo 预报 / 空气质量 / 地理编码，本地缓存、定位兜底与生活指数计算
// 所有外部请求均为浏览器端直接 fetch（open-meteo 支持 CORS），失败统一返回 null 降级
import type { CSSProperties } from "react";

export interface City {
	name: string;
	/** 省/州，定位与搜索结果附带 */
	district?: string;
	country?: string;
	lat: number;
	lon: number;
}

/** 天气大类，决定图标与主卡渐变 */
export type WeatherKind =
	| "clear" // 晴
	| "partly" // 晴间多云 / 多云
	| "cloudy" // 阴
	| "fog" // 雾
	| "drizzle" // 毛毛雨 / 冻雨
	| "rain" // 雨 / 阵雨
	| "snow" // 雪
	| "thunder"; // 雷暴

export interface CurrentWeather {
	temp: number;
	feelsLike: number;
	humidity: number;
	isDay: boolean;
	precipitation: number;
	code: number;
	text: string;
	kind: WeatherKind;
	windSpeed: number;
	windDeg: number;
	pressure: number;
	cloudCover: number;
}

export interface HourWeather {
	/** 站点当地墙钟时间，格式 2026-09-13T14:00 */
	time: string;
	temp: number;
	code: number;
	pop: number;
	isDay: boolean;
}

export interface DayWeather {
	date: string;
	code: number;
	text: string;
	kind: WeatherKind;
	tMax: number;
	tMin: number;
	/** HH:MM */
	sunrise: string;
	sunset: string;
	uvMax: number;
	popMax: number;
}

export interface WeatherData {
	updatedAt: number;
	current: CurrentWeather;
	hourly: HourWeather[];
	daily: DayWeather[];
}

export interface AirQuality {
	pm25: number | null;
	pm10: number | null;
	aqi: number | null;
}

export interface LifeIndex {
	emoji: string;
	name: string;
	level: string;
	advice: string;
}

/** 热门城市：一线 + 新一线 / 省会，约 24 个 */
export const CITIES: City[] = [
	{ name: "北京", lat: 39.9042, lon: 116.4074 },
	{ name: "上海", lat: 31.2304, lon: 121.4737 },
	{ name: "广州", lat: 23.1291, lon: 113.2644 },
	{ name: "深圳", lat: 22.5431, lon: 114.0579 },
	{ name: "杭州", lat: 30.2741, lon: 120.1551 },
	{ name: "成都", lat: 30.5728, lon: 104.0668 },
	{ name: "武汉", lat: 30.5928, lon: 114.3055 },
	{ name: "西安", lat: 34.3416, lon: 108.9398 },
	{ name: "南京", lat: 32.0603, lon: 118.7969 },
	{ name: "重庆", lat: 29.563, lon: 106.5516 },
	{ name: "长沙", lat: 28.2282, lon: 112.9388 },
	{ name: "厦门", lat: 24.4798, lon: 118.0894 },
	{ name: "天津", lat: 39.0842, lon: 117.2009 },
	{ name: "苏州", lat: 31.2989, lon: 120.5853 },
	{ name: "郑州", lat: 34.7466, lon: 113.6254 },
	{ name: "青岛", lat: 36.0671, lon: 120.3826 },
	{ name: "沈阳", lat: 41.8057, lon: 123.4315 },
	{ name: "哈尔滨", lat: 45.8038, lon: 126.5349 },
	{ name: "昆明", lat: 25.0389, lon: 102.7183 },
	{ name: "大连", lat: 38.914, lon: 121.6147 },
	{ name: "宁波", lat: 29.8683, lon: 121.544 },
	{ name: "福州", lat: 26.0745, lon: 119.2965 },
	{ name: "济南", lat: 36.6512, lon: 117.1201 },
	{ name: "合肥", lat: 31.8206, lon: 117.2272 },
];

const CITY_KEY = "treasure-weather-city";
const WEATHER_TTL = 30 * 60 * 1000; // 天气缓存 30 分钟
const AIR_TTL = 30 * 60 * 1000;

/* ---------------- localStorage 城市与缓存 ---------------- */

/** 读取本地保存的城市 */
export function getSavedCity(): City | null {
	try {
		const raw = localStorage.getItem(CITY_KEY);
		if (raw) return JSON.parse(raw) as City;
	} catch {
		/* ignore */
	}
	return null;
}

/** 保存城市到本地 */
export function saveCity(c: City): void {
	try {
		localStorage.setItem(CITY_KEY, JSON.stringify(c));
	} catch {
		/* ignore */
	}
}

/** 读带过期时间的缓存，结构 { t: 写入时间戳, v: 数据 } */
function readCache<T>(key: string, ttl: number): T | null {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as { t: number; v: T };
		if (Date.now() - parsed.t > ttl) return null;
		return parsed.v;
	} catch {
		return null;
	}
}

function writeCache(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value }));
	} catch {
		/* ignore */
	}
}

/* ---------------- 定位 ---------------- */

/** IP 粗略定位（ipapi.co），失败返回 null */
export async function detectCityByIp(): Promise<City | null> {
	try {
		const res = await fetch("https://ipapi.co/json/", {
			signal: AbortSignal.timeout(8000),
		});
		if (!res.ok) return null;
		const data = (await res.json()) as {
			city?: string;
			region?: string;
			country_name?: string;
			latitude?: number;
			longitude?: number;
		};
		if (typeof data.latitude !== "number" || typeof data.longitude !== "number")
			return null;
		return {
			name: data.city || "当前位置",
			district: data.region || undefined,
			country: data.country_name || undefined,
			lat: data.latitude,
			lon: data.longitude,
		};
	} catch {
		return null;
	}
}

/** 浏览器精确定位 + bigdatacloud 中文逆地理解析，拒绝授权 / 失败返回 null */
export async function detectPreciseCity(): Promise<City | null> {
	if (typeof navigator === "undefined" || !navigator.geolocation) return null;
	return new Promise<City | null>((resolve) => {
		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				try {
					const { latitude, longitude } = pos.coords;
					const res = await fetch(
						`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`,
						{ signal: AbortSignal.timeout(8000) },
					);
					if (!res.ok) {
						resolve(null);
						return;
					}
					const data = (await res.json()) as {
						locality?: string;
						city?: string;
						principalSubdivision?: string;
						countryName?: string;
					};
					const name = data.locality || data.city;
					if (!name) {
						resolve(null);
						return;
					}
					resolve({
						name,
						district: data.principalSubdivision || undefined,
						country: data.countryName || undefined,
						lat: latitude,
						lon: longitude,
					});
				} catch {
					resolve(null);
				}
			},
			() => resolve(null),
			{ timeout: 8000 },
		);
	});
}

/* ---------------- 天气码与展示辅助 ---------------- */

/** open-meteo WMO weather_code → 中文文案 + 天气大类（昼夜由页面决定图标） */
export function codeToInfo(code: number): { text: string; kind: WeatherKind } {
	if (code === 0) return { text: "晴", kind: "clear" };
	if (code === 1) return { text: "晴间多云", kind: "partly" };
	if (code === 2) return { text: "多云", kind: "partly" };
	if (code === 3) return { text: "阴", kind: "cloudy" };
	if (code === 45) return { text: "雾", kind: "fog" };
	if (code === 48) return { text: "冻雾", kind: "fog" };
	if (code === 51) return { text: "轻毛毛雨", kind: "drizzle" };
	if (code === 53) return { text: "毛毛雨", kind: "drizzle" };
	if (code === 55) return { text: "浓毛毛雨", kind: "drizzle" };
	if (code === 56 || code === 57) return { text: "冻毛毛雨", kind: "drizzle" };
	if (code === 61) return { text: "小雨", kind: "rain" };
	if (code === 63) return { text: "中雨", kind: "rain" };
	if (code === 65) return { text: "大雨", kind: "rain" };
	if (code === 66 || code === 67) return { text: "冻雨", kind: "drizzle" };
	if (code === 71) return { text: "小雪", kind: "snow" };
	if (code === 73) return { text: "中雪", kind: "snow" };
	if (code === 75) return { text: "大雪", kind: "snow" };
	if (code === 77) return { text: "雪粒", kind: "snow" };
	if (code === 80) return { text: "小阵雨", kind: "rain" };
	if (code === 81) return { text: "阵雨", kind: "rain" };
	if (code === 82) return { text: "强阵雨", kind: "rain" };
	if (code === 85) return { text: "小阵雪", kind: "snow" };
	if (code === 86) return { text: "阵雪", kind: "snow" };
	if (code === 95) return { text: "雷暴", kind: "thunder" };
	if (code === 96 || code === 99) return { text: "雷暴冰雹", kind: "thunder" };
	return { text: "未知", kind: "cloudy" };
}

/** 风向角度 → 八方位中文（北 / 东北 / 东 ...） */
export function windDirectionText(deg: number): string {
	const dirs = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
	return `${dirs[Math.round(deg / 45) % 8]}风`;
}

/** 紫外线指数等级：0-2 弱 / 3-5 中等 / 6-7 强 / 8-10 很强 / 11+ 极强 */
export function uvLevel(uv: number): string {
	if (uv >= 11) return "极强";
	if (uv >= 8) return "很强";
	if (uv >= 6) return "强";
	if (uv >= 3) return "中等";
	return "弱";
}

/** 主卡背景：按天气大类 + 昼夜动态渐变；light=true 表示浅底需用深色字 */
export function cardGradient(
	kind: WeatherKind,
	isDay: boolean,
): { style: CSSProperties; light: boolean } {
	if (!isDay) {
		return {
			style: { background: "linear-gradient(135deg,#3730a3 0%,#1e1b4b 100%)" },
			light: false,
		};
	}
	switch (kind) {
		case "clear":
			return {
				style: {
					background: "linear-gradient(135deg,#38bdf8 0%,#0284c7 100%)",
				},
				light: false,
			};
		case "partly":
			return {
				style: {
					background: "linear-gradient(135deg,#7dd3fc 0%,#0ea5e9 100%)",
				},
				light: false,
			};
		case "cloudy":
			return {
				style: {
					background: "linear-gradient(135deg,#94a3b8 0%,#64748b 100%)",
				},
				light: false,
			};
		case "fog":
			return {
				style: {
					background: "linear-gradient(135deg,#e2e8f0 0%,#94a3b8 100%)",
				},
				light: true,
			};
		case "drizzle":
			return {
				style: {
					background: "linear-gradient(135deg,#7d93a8 0%,#475569 100%)",
				},
				light: false,
			};
		case "rain":
			return {
				style: {
					background: "linear-gradient(135deg,#64748b 0%,#3b4f63 100%)",
				},
				light: false,
			};
		case "snow":
			return {
				style: {
					background: "linear-gradient(135deg,#f0f9ff 0%,#bae6fd 100%)",
				},
				light: true,
			};
		case "thunder":
			return {
				style: {
					background: "linear-gradient(135deg,#475569 0%,#1e293b 100%)",
				},
				light: false,
			};
	}
}

/* ---------------- 时间解析 ---------------- */

/** 把站点当地墙钟 'YYYY-MM-DDTHH:MM' 解析为 Date（按浏览器本地时区构造，避免 new Date 的 UTC 歧义） */
function parseWallTime(dt: string): Date {
	const [datePart, timePart = ""] = dt.split("T");
	const [y, m, d] = datePart.split("-").map(Number);
	return new Date(
		y,
		(m || 1) - 1,
		d || 1,
		Number(timePart.slice(0, 2)) || 0,
		Number(timePart.slice(3, 5)) || 0,
	);
}

/** HH:MM 提取（open-meteo 的 sunrise/sunset 为站点当地时间） */
function hourMinute(dt: string): string {
	return dt.includes("T") ? dt.slice(11, 16) : dt;
}

/* ---------------- open-meteo 预报 ---------------- */

interface ForecastResponse {
	current?: Record<string, number | string>;
	hourly?: {
		time?: string[];
		temperature_2m?: (number | null)[];
		weather_code?: (number | null)[];
		precipitation_probability?: (number | null)[];
	};
	daily?: {
		time?: string[];
		weather_code?: (number | null)[];
		temperature_2m_max?: (number | null)[];
		temperature_2m_min?: (number | null)[];
		sunrise?: string[];
		sunset?: string[];
		uv_index_max?: (number | null)[];
		precipitation_probability_max?: (number | null)[];
	};
}

/** 查询综合天气（实时 + 未来 24 小时 + 7 日），30 分钟缓存，失败返回 null */
export async function fetchWeather(city: City): Promise<WeatherData | null> {
	const cacheKey = `treasure-weather-v2-${city.lat.toFixed(2)}-${city.lon.toFixed(2)}`;
	const cached = readCache<WeatherData>(cacheKey, WEATHER_TTL);
	if (cached) return cached;

	try {
		const params = new URLSearchParams({
			latitude: String(city.lat),
			longitude: String(city.lon),
			current:
				"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,cloud_cover",
			hourly: "temperature_2m,weather_code,precipitation_probability",
			daily:
				"weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
			timezone: "auto",
			forecast_days: "7",
		});
		const res = await fetch(
			`https://api.open-meteo.com/v1/forecast?${params.toString()}`,
			{
				signal: AbortSignal.timeout(8000),
			},
		);
		if (!res.ok) return null;
		const data = (await res.json()) as ForecastResponse;
		const cur = data.current;
		const hourly = data.hourly;
		const daily = data.daily;
		if (!cur || !hourly?.time || !daily?.time) return null;

		const code = Number(cur.weather_code ?? 0);
		const info = codeToInfo(code);
		const current: CurrentWeather = {
			temp: Math.round(Number(cur.temperature_2m)),
			feelsLike: Math.round(Number(cur.apparent_temperature)),
			humidity: Math.round(Number(cur.relative_humidity_2m)),
			isDay: Number(cur.is_day) === 1,
			precipitation: Math.round(Number(cur.precipitation) * 10) / 10,
			code,
			text: info.text,
			kind: info.kind,
			windSpeed: Math.round(Number(cur.wind_speed_10m)),
			windDeg: Math.round(Number(cur.wind_direction_10m)),
			pressure: Math.round(Number(cur.pressure_msl)),
			cloudCover: Math.round(Number(cur.cloud_cover)),
		};

		// 每日日出日落表，用于判断逐小时的昼夜
		const sunMap = new Map<string, { rise: Date; set: Date }>();
		daily.time.forEach((d, i) => {
			if (daily.sunrise?.[i] && daily.sunset?.[i]) {
				sunMap.set(d, {
					rise: parseWallTime(daily.sunrise[i]),
					set: parseWallTime(daily.sunset[i]),
				});
			}
		});

		// 过滤掉今天已过去的整点，取未来 24 小时
		const now = new Date();
		const floor = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			now.getHours(),
		).getTime();
		const hours: HourWeather[] = [];
		for (let i = 0; i < hourly.time.length && hours.length < 24; i++) {
			const t = hourly.time[i];
			const wall = parseWallTime(t);
			if (wall.getTime() < floor) continue;
			const sun = sunMap.get(t.slice(0, 10));
			const isDay = sun
				? wall.getTime() >= sun.rise.getTime() &&
					wall.getTime() < sun.set.getTime()
				: true;
			hours.push({
				time: t,
				temp: Math.round(Number(hourly.temperature_2m?.[i] ?? 0)),
				code: Number(hourly.weather_code?.[i] ?? 0),
				pop: Math.round(Number(hourly.precipitation_probability?.[i] ?? 0)),
				isDay,
			});
		}

		const days: DayWeather[] = daily.time.map((d, i) => {
			const dayCode = Number(daily.weather_code?.[i] ?? 0);
			const dayInfo = codeToInfo(dayCode);
			return {
				date: d,
				code: dayCode,
				text: dayInfo.text,
				kind: dayInfo.kind,
				tMax: Math.round(Number(daily.temperature_2m_max?.[i] ?? 0)),
				tMin: Math.round(Number(daily.temperature_2m_min?.[i] ?? 0)),
				sunrise: daily.sunrise?.[i] ? hourMinute(daily.sunrise[i]) : "--:--",
				sunset: daily.sunset?.[i] ? hourMinute(daily.sunset[i]) : "--:--",
				uvMax: Math.round(Number(daily.uv_index_max?.[i] ?? 0)),
				popMax: Math.round(
					Number(daily.precipitation_probability_max?.[i] ?? 0),
				),
			};
		});

		const result: WeatherData = {
			updatedAt: Date.now(),
			current,
			hourly: hours,
			daily: days,
		};
		writeCache(cacheKey, result);
		return result;
	} catch {
		return null;
	}
}

/* ---------------- 空气质量 ---------------- */

/** 查询空气质量（PM2.5 / PM10 / US AQI），失败返回 null 由页面隐藏卡片 */
export async function fetchAirQuality(city: City): Promise<AirQuality | null> {
	const cacheKey = `treasure-air-v2-${city.lat.toFixed(2)}-${city.lon.toFixed(2)}`;
	const cached = readCache<AirQuality>(cacheKey, AIR_TTL);
	if (cached) return cached;

	try {
		const params = new URLSearchParams({
			latitude: String(city.lat),
			longitude: String(city.lon),
			current: "pm2_5,pm10,us_aqi",
			timezone: "auto",
		});
		const res = await fetch(
			`https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`,
			{
				signal: AbortSignal.timeout(8000),
			},
		);
		if (!res.ok) return null;
		const data = (await res.json()) as {
			current?: {
				pm2_5?: number | null;
				pm10?: number | null;
				us_aqi?: number | null;
			};
		};
		if (!data.current) return null;
		const num = (v: unknown): number | null =>
			typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
		const result: AirQuality = {
			pm25: num(data.current.pm2_5),
			pm10: num(data.current.pm10),
			aqi: num(data.current.us_aqi),
		};
		writeCache(cacheKey, result);
		return result;
	} catch {
		return null;
	}
}

/** US AQI 分级与徽章配色（类名写全字面量以便 Tailwind 识别） */
export function aqiInfo(aqi: number): {
	label: string;
	badge: string;
	dot: string;
} {
	if (aqi <= 50)
		return {
			label: "优",
			badge: "bg-emerald-100 text-emerald-700",
			dot: "bg-emerald-500",
		};
	if (aqi <= 100)
		return {
			label: "良",
			badge: "bg-yellow-100 text-yellow-700",
			dot: "bg-yellow-500",
		};
	if (aqi <= 150)
		return {
			label: "轻度污染",
			badge: "bg-orange-100 text-orange-700",
			dot: "bg-orange-500",
		};
	if (aqi <= 200)
		return {
			label: "中度污染",
			badge: "bg-red-100 text-red-700",
			dot: "bg-red-500",
		};
	if (aqi <= 300)
		return {
			label: "重度污染",
			badge: "bg-purple-100 text-purple-700",
			dot: "bg-purple-500",
		};
	return {
		label: "严重污染",
		badge: "bg-rose-900 text-white",
		dot: "bg-rose-900",
	};
}

/* ---------------- 城市搜索（open-meteo geocoding） ---------------- */

interface GeocodingResult {
	name?: string;
	admin1?: string;
	country?: string;
	latitude?: number;
	longitude?: number;
}

/** 按关键词搜索城市，失败返回空数组（防抖由调用方处理） */
export async function searchCities(keyword: string): Promise<City[]> {
	const q = keyword.trim();
	if (!q) return [];
	try {
		const params = new URLSearchParams({
			name: q,
			count: "8",
			language: "zh",
			format: "json",
		});
		const res = await fetch(
			`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
			{
				signal: AbortSignal.timeout(8000),
			},
		);
		if (!res.ok) return [];
		const data = (await res.json()) as { results?: GeocodingResult[] };
		return (data.results ?? [])
			.filter(
				(r) =>
					typeof r.latitude === "number" &&
					typeof r.longitude === "number" &&
					r.name,
			)
			.map((r) => ({
				name: r.name as string,
				district: r.admin1 || undefined,
				country: r.country || undefined,
				lat: r.latitude as number,
				lon: r.longitude as number,
			}));
	} catch {
		return [];
	}
}

/* ---------------- 生活指数（本地规则） ---------------- */

/** 穿衣指数：按气温分档 */
function clothingIndex(temp: number): LifeIndex {
	if (temp >= 30)
		return {
			emoji: "🥵",
			name: "穿衣",
			level: "酷热",
			advice: "短袖短裤最清凉，谨防中暑多补水",
		};
	if (temp >= 24)
		return {
			emoji: "👕",
			name: "穿衣",
			level: "炎热",
			advice: "短袖薄衫即可，出门注意防晒",
		};
	if (temp >= 18)
		return {
			emoji: "🌤️",
			name: "穿衣",
			level: "舒适",
			advice: "薄长袖或短袖都行，早晚备件薄外套",
		};
	if (temp >= 12)
		return {
			emoji: "🧥",
			name: "穿衣",
			level: "凉爽",
			advice: "长袖加薄外套，早晚温差要留心",
		};
	if (temp >= 5)
		return {
			emoji: "🧶",
			name: "穿衣",
			level: "冷",
			advice: "毛衣夹克齐上阵，围巾更保暖",
		};
	if (temp >= 0)
		return {
			emoji: "🧣",
			name: "穿衣",
			level: "寒冷",
			advice: "厚外套裹严实，帽子手套别落下",
		};
	return {
		emoji: "❄️",
		name: "穿衣",
		level: "严寒",
		advice: "羽绒服加秋裤，能裹多厚裹多厚",
	};
}

/** 紫外线指数：取今日 uv_index_max */
function uvIndex(uv: number): LifeIndex {
	if (uv >= 11)
		return {
			emoji: "🛡️",
			name: "紫外线",
			level: "极强",
			advice: "尽量别在户外久待，全套防晒安排上",
		};
	if (uv >= 8)
		return {
			emoji: "🕶️",
			name: "紫外线",
			level: "很强",
			advice: "避开正午阳光，墨镜和高倍防晒霜必备",
		};
	if (uv >= 6)
		return {
			emoji: "☀️",
			name: "紫外线",
			level: "强",
			advice: "涂 SPF30 以上防晒霜，戴顶遮阳帽",
		};
	if (uv >= 3)
		return {
			emoji: "🌤️",
			name: "紫外线",
			level: "中等",
			advice: "阳光不弱，适当涂抹防晒霜更稳妥",
		};
	return {
		emoji: "😊",
		name: "紫外线",
		level: "弱",
		advice: "紫外线友好，可以放心出门活动",
	};
}

/** 运动指数：今日降水概率 + 风速（km/h） */
function sportIndex(pop: number, wind: number): LifeIndex {
	if (pop >= 70 || wind >= 38)
		return {
			emoji: "🏠",
			name: "运动",
			level: "不宜",
			advice: "明显降雨或大风，改在室内锻炼吧",
		};
	if (pop >= 40 || wind >= 25)
		return {
			emoji: "🌬️",
			name: "运动",
			level: "较不宜",
			advice: "风大或可能下雨，想出门记得看天带伞",
		};
	if (pop >= 20 || wind >= 15)
		return {
			emoji: "🏃",
			name: "运动",
			level: "适宜",
			advice: "天气尚可，快走慢跑都挺合适",
		};
	return {
		emoji: "💪",
		name: "运动",
		level: "很适宜",
		advice: "天公作美，尽情出门撒汗吧",
	};
}

/** 洗车指数：未来 3 天最大降水概率 */
function carWashIndex(futurePop: number): LifeIndex {
	if (futurePop >= 70)
		return {
			emoji: "🚗",
			name: "洗车",
			level: "不宜",
			advice: "未来几天有雨，洗了容易白洗",
		};
	if (futurePop >= 40)
		return {
			emoji: "☔",
			name: "洗车",
			level: "较不宜",
			advice: "降水概率较高，建议再忍忍",
		};
	if (futurePop >= 20)
		return {
			emoji: "🧽",
			name: "洗车",
			level: "较适宜",
			advice: "大体适合洗车，洗完留意天气变化",
		};
	return {
		emoji: "✨",
		name: "洗车",
		level: "适宜",
		advice: "未来少雨路净，放心洗车出门",
	};
}

/** 感冒指数：今日昼夜温差 + 相对湿度 */
function coldIndex(tMax: number, tMin: number, humidity: number): LifeIndex {
	const diff = tMax - tMin;
	if (diff >= 10 || humidity >= 85 || humidity <= 30)
		return {
			emoji: "🤧",
			name: "感冒",
			level: "易发",
			advice:
				humidity >= 85
					? "潮湿且温差大，注意增减衣物防着凉"
					: humidity <= 30
						? "空气干燥温差大，多喝热水护好嗓子"
						: "昼夜温差悬殊，出门多带一件外套",
		};
	if (diff >= 7)
		return {
			emoji: "🤒",
			name: "感冒",
			level: "较易发",
			advice: "早晚偏凉，老人小孩尤其注意保暖",
		};
	return {
		emoji: "😊",
		name: "感冒",
		level: "少发",
		advice: "天气平稳，感冒概率低，继续保持",
	};
}

/** 汇总 5 项生活指数 */
export function buildLifeIndices(data: WeatherData): LifeIndex[] {
	const today = data.daily[0];
	const futurePop = Math.max(0, ...data.daily.slice(1, 4).map((d) => d.popMax));
	return [
		clothingIndex(data.current.feelsLike),
		uvIndex(today?.uvMax ?? 0),
		sportIndex(today?.popMax ?? 0, data.current.windSpeed),
		carWashIndex(futurePop),
		coldIndex(
			today?.tMax ?? data.current.temp,
			today?.tMin ?? data.current.temp,
			data.current.humidity,
		),
	];
}
