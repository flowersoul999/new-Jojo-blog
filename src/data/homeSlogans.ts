// ============================================================================
// 首页标语（全屏壁纸主页、大标题下方那句话）
// ----------------------------------------------------------------------------
// 数据本体在同目录的 homeSlogans.data.json —— 因为内容管理台要能直接增删改
// 每一句、并调整轮播间隔，所以内容必须是纯 JSON（能安全序列化回去），
// 而不是写死在这个文件里的字面量。
//
// 这里只保留：类型定义 + 从 JSON 读出后清洗成组件友好的形态，
// 所以页面与组件的 import 路径和用法都不用改。
// ============================================================================
import raw from "./homeSlogans.data.json";

export interface HomeSlogansData {
	/** 是否启用（关闭则回退到 siteConfig.subtitle） */
	enabled: boolean;
	/** 多句时的切换间隔（秒），下限 3、上限 600 */
	intervalSeconds: number;
	/** 标语列表，按顺序循环轮播 */
	slogans: string[];
}

/** 内容管理台读写用的仓库相对路径 */
export const HOME_SLOGANS_PATH = "src/data/homeSlogans.data.json";

/** 默认轮播间隔（秒）：数据缺省或非法时兜底 */
export const HOME_SLOGANS_DEFAULT_INTERVAL = 20;

/** 间隔下限/上限（秒），避免出现「每秒闪一次」或「一小时不换」的离谱值 */
export const HOME_SLOGANS_MIN_INTERVAL = 3;
export const HOME_SLOGANS_MAX_INTERVAL = 600;

const data = raw as HomeSlogansData;

/** 清洗后的标语列表（去空白、去空串） */
export const homeSlogans: string[] = (
	Array.isArray(data.slogans) ? data.slogans : []
)
	.map((text) => String(text ?? "").trim())
	.filter(Boolean);

/** 清洗后的轮播间隔（秒） */
export const homeSlogansIntervalSeconds: number = (() => {
	const value = Math.floor(Number(data.intervalSeconds));
	if (!Number.isFinite(value)) return HOME_SLOGANS_DEFAULT_INTERVAL;
	return Math.min(
		HOME_SLOGANS_MAX_INTERVAL,
		Math.max(HOME_SLOGANS_MIN_INTERVAL, value),
	);
})();

/** 是否启用首页标语 */
export const homeSlogansEnabled: boolean = data.enabled !== false;
