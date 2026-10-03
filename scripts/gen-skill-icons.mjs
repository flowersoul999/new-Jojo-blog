/**
 * 技能图图标表生成脚本（技能图专用，和 scripts/generate-icons.js 不是一回事）
 *
 * 用法：node scripts/gen-skill-icons.mjs <配置.json>
 *
 * 配置形如：
 * {
 *   "out": "src/data/backendIcons.ts",
 *   "constName": "BE_ICONS",
 *   "groupColorsName": "BE_GROUP_COLORS",
 *   "doc": ["第一行说明", "..."],
 *   "groupColors": { "be-lang": "7C3AED" },
 *   "icons": {
 *     "fe-base": { "icon": "simple-icons:html5", "group": "be-start" },
 *     "node-runtime": { "icon": "material-symbols:cycle", "group": "be-lang" }
 *   }
 * }
 *
 * 输出 { d, brand } 形状（TechIcon）：d 来自图标集的 body（只支持单 path 图标），
 * brand 优先用图标自带的 hex，没有就用所属方向的兜底色。
 * 任何图标找不到、或多 path 拼不成一个 d，都会直接报错退出，不静默降级。
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PNPM = join(ROOT, "node_modules", ".pnpm");

const cfgPath = process.argv[2];
if (!cfgPath) {
	console.error("用法：node scripts/gen-skill-icons.mjs <配置.json>");
	process.exit(1);
}
const cfg = JSON.parse(readFileSync(cfgPath, "utf-8"));

/** 从 .pnpm 里找到某个图标集的 icons.json */
const setCache = new Map();
function loadSet(set) {
	if (setCache.has(set)) return setCache.get(set);
	const prefix = `@iconify-json+${set}@`;
	const dir = readdirSync(PNPM).find((d) => d.startsWith(prefix));
	if (!dir)
		throw new Error(
			`找不到图标集 @iconify-json/${set}（看下 node_modules/.pnpm）`,
		);
	const file = join(
		PNPM,
		dir,
		"node_modules",
		"@iconify-json",
		set,
		"icons.json",
	);
	if (!existsSync(file)) throw new Error(`图标集文件不存在：${file}`);
	const data = JSON.parse(readFileSync(file, "utf-8"));
	setCache.set(set, data);
	return data;
}

/** 取出唯一的一条 path 的 d 值 */
function extractD(iconName, icon) {
	const body = icon.body ?? "";
	const matches = [...body.matchAll(/<path[^>]*?\sd="([^"]+)"/g)].map(
		(m) => m[1],
	);
	if (matches.length === 1) return matches[0];
	// 有些图标用 <g> 包一层但仍是单 path
	const anyPath = [...body.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
	if (matches.length === 0 && anyPath.length === 1) return anyPath[0];
	throw new Error(
		`${iconName} 不是单 path 图标（找到 ${matches.length} 条），换一个图标名：${body.slice(0, 120)}…`,
	);
}

const errors = [];
const entries = [];

for (const [id, spec] of Object.entries(cfg.icons)) {
	const [set, name] = (spec.icon ?? "").split(":");
	if (!set || !name) {
		errors.push(`${id}: 图标名不合法（${spec.icon}）`);
		continue;
	}
	try {
		const data = loadSet(set);
		const icon = data.icons?.[name] ?? data.aliases?.[name];
		if (!icon) {
			errors.push(`${id}: 图标集 ${set} 里没有 ${name}`);
			continue;
		}
		const d = extractD(spec.icon, data.icons?.[name] ?? icon);
		const brand =
			(spec.color ?? icon.hex ?? cfg.groupColors?.[spec.group] ?? null)
				?.replace(/^#/, "")
				.toUpperCase() ?? null;
		entries.push([id, d, brand ?? null]);
	} catch (e) {
		errors.push(`${id}: ${e.message}`);
	}
}

// 反向检查：方向兜底色要覆盖所有出现过的方向
const usedGroups = new Set(Object.values(cfg.icons).map((s) => s.group));
for (const g of usedGroups) {
	if (!cfg.groupColors?.[g]) errors.push(`方向 ${g} 没有兜底色`);
}

if (errors.length) {
	console.error(`✗ ${errors.length} 个问题：`);
	for (const e of errors) console.error(`  - ${e}`);
	process.exit(1);
}

/** 合法的裸标识符就不用加引号——biome 会把它拆掉，索性直接写裸的 */
const keyOf = (id) =>
	/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(id) ? id : JSON.stringify(id);

const body = entries
	.map(
		([id, d, brand]) =>
			`\t${keyOf(id)}: {\n\t\td: "${d.replace(/"/g, '\\"')}",\n\t\tbrand: ${brand ? `"${brand}"` : "null"},\n\t},`,
	)
	.join("\n");

const colors = Object.entries(cfg.groupColors)
	.map(([g, c]) => `\t"${g}": "${String(c).replace(/^#/, "").toUpperCase()}",`)
	.join("\n");

const out = `/**
${(cfg.doc ?? []).map((l) => (l ? ` * ${l}` : " *")).join("\n")}
 *
 * 自动生成，勿手改；重跑：node scripts/gen-skill-icons.mjs <配置.json>
 */
import type { TechIcon } from "@/data/techIcons";

export const ${cfg.constName}: Record<string, TechIcon> = {
${body}
};

/** 方向兜底色：技能没有品牌色时按方向取色 */
export const ${cfg.groupColorsName}: Record<string, string> = {
${colors}
};
`;

writeFileSync(join(ROOT, cfg.out), out, "utf-8");
console.log(
	`✓ ${cfg.out} 生成成功：${entries.length} 个图标，${usedGroups.size} 个方向`,
);
