import type { APIRoute } from "astro";
import { getClientIp } from "@/utils/client-ip";
import { resolveGeo } from "@/utils/geoip";

export const prerender = false;

/**
 * 访客归属地（只读、同域，给前台欢迎卡片用）
 *
 * - 数据源与后台分析完全一致（utils/geoip.ts：腾讯地图 → 太平洋库 → 请求头兜底），
 *   因此后台能看到区县、前台也能拿到同样的精度（前台再由展示层裁到「市」，见 WelcomeToast）
 * - 只返回「本次请求自身 IP」的归属地，不接受任何 IP 参数 → 无法被用来查别人的位置
 * - 必须 no-store：一旦被 CDN 缓存，A 访客的归属地就会被发给 B
 */
export const GET: APIRoute = async ({ request }) => {
	const ip = getClientIp(request);
	const { cc, rg, level, source } = await resolveGeo(ip, request);

	return new Response(JSON.stringify({ ok: true, cc, rg, level, source }), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-store, no-cache, must-revalidate",
		},
	});
};
