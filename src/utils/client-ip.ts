/**
 * 访客真实 IP 提取（服务端）
 *
 * 本站是 Cloudflare 代理 + Vercel 部署，取到的 HTTP 头优先级：
 * 1. cf-connecting-ip —— Cloudflare 写入的访客真实 IP，最可信
 * 2. x-forwarded-for 首段 —— 无 Cloudflare 时（如本地 dev / 直连）的兜底
 * 3. x-real-ip
 *
 * 注意：不能用 x-vercel-ip-*（那反映的是 Cloudflare 出口 IP，不是访客），
 * 见 utils/geoip.ts 里 geoFromHeaders 的说明。
 */

export function getClientIp(request: Request): string {
	const cf = request.headers.get("cf-connecting-ip");
	if (cf) return cf;
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0].trim() || "unknown";
	return request.headers.get("x-real-ip") || "unknown";
}
