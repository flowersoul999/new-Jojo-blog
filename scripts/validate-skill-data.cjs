/**
 * 技能图数据自检：解析各图的 TS 数据，校验 id 唯一 / requires 指向存在 / 无环 /
 * 每个技能都有清单 / 清单不指向不存在的技能 / 方向分布与最深层数。
 *
 * 起因：加英语图时手写了 `en-subjunctive → en-nonfinite`，但技能定义里 id 写成了
 * `en-phrase`，结果 3 处 requires 指向不存在的 id、另有技能没有清单。
 * **astro-check 不会发现这类问题**（它只看 TS 类型，字符串 id 写错它不管），
 * 所以任何新增/修改技能图数据后都要跑这个。
 *
 * 用法：node scripts/validate-skill-data.cjs
 * 退出码非 0 表示有错，CI 可直接用。
 */
const fs = require("node:fs");

/** 从 "<n>Skills.ts" 里抠出 SKILLS 数组（按 Skill 接口的字段顺序做正则） */
function loadSkills(file) {
	const src = fs.readFileSync(file, "utf8");
	const start = src.indexOf(": Skill[] = [");
	if (start < 0) throw new Error("找不到 SKILLS 数组");
	const re =
		/\{\s*\n\s*id: "([a-z0-9-]+)",\s*\n\s*name: "([^"]+)",\s*\n\s*short: "([^"]+)",\s*\n\s*level: (\d+),\s*\n\s*group: "([a-z-]+)",\s*\n\s*note: "([^"]*)",[\s\S]*?requires: \[([^\]]*)\],\s*\n\s*\},/g;
	const skills = [];
	let m;
	while ((m = re.exec(src.slice(start)))) {
		skills.push({
			id: m[1],
			name: m[2],
			short: m[3],
			level: Number(m[4]),
			group: m[5],
			note: m[6],
			requires: (m[7].match(/"([a-z0-9-]+)"/g) || []).map((x) =>
				x.slice(1, -1),
			),
		});
	}
	return skills;
}

/**
 * 从 "<n>Checks.ts" 里抠出每个技能的清单条数。
 *
 * ⚠️ key 有两种写法，必须都认：
 *   前四张技术图用**裸标识符**（`html: [`），修行录两张用**带引号**（`"mu-listen": [`）。
 *   只认带引号的话会把前四张图全部误报成「没有清单」。
 */
function loadChecks(file) {
	const src = fs.readFileSync(file, "utf8");
	const checks = {};
	// 只认出现在**行首 + 一级缩进**位置的 key，避免把字符串里的 Promise / ACID 误当 key。
	const re =
		/^\t(?:"([a-zA-Z0-9_$-]+)"|([a-zA-Z_$][a-zA-Z0-9_$-]*)):\s*\[([\s\S]*?)^\t\],/gm;
	let m;
	while ((m = re.exec(src))) {
		const key = m[1] || m[2];
		checks[key] = (m[3].match(/\["[^"]+"/g) || []).length;
	}
	return checks;
}

const GRAPHS = [
	["前端", "src/data/skills.ts", "src/data/skillChecks.ts"],
	["计算机基础", "src/data/csSkills.ts", "src/data/csChecks.ts"],
	["后端", "src/data/backendSkills.ts", "src/data/backendChecks.ts"],
	["Agent", "src/data/agentSkills.ts", "src/data/agentChecks.ts"],
	["音乐", "src/data/musicSkills.ts", "src/data/musicChecks.ts"],
	["英语", "src/data/englishSkills.ts", "src/data/englishChecks.ts"],
	["理财", "src/data/financeSkills.ts", "src/data/financeChecks.ts"],
];

let fail = 0;
for (const [name, sfile, cfile] of GRAPHS) {
	const problems = [];
	let skills, checks;
	try {
		skills = loadSkills(sfile);
		checks = loadChecks(cfile);
	} catch (e) {
		console.log(`✗ ${name}: ${e.message}`);
		fail++;
		continue;
	}

	const ids = skills.map((s) => s.id);
	const dup = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
	if (dup.length) problems.push(`id 重复: ${dup.join(", ")}`);

	const idSet = new Set(ids);
	for (const s of skills)
		for (const r of s.requires)
			if (!idSet.has(r)) problems.push(`${s.id} 的 requires 指向不存在的 ${r}`);

	// 无环
	const adj = new Map(skills.map((s) => [s.id, s.requires]));
	const state = new Map();
	let cycle = null;
	const dfs = (n, path) => {
		if (state.get(n) === 1) {
			cycle = [...path, n].join(" → ");
			return;
		}
		if (state.get(n) === 2) return;
		state.set(n, 1);
		for (const m2 of adj.get(n) || []) dfs(m2, [...path, n]);
		state.set(n, 2);
	};
	for (const s of skills) dfs(s.id, []);
	if (cycle) problems.push(`依赖成环: ${cycle}`);

	const noChecks = skills.filter((s) => !checks[s.id]).map((s) => s.id);
	if (noChecks.length) problems.push(`没有清单: ${noChecks.join(", ")}`);
	const orphan = Object.keys(checks).filter((k) => !idSet.has(k));
	if (orphan.length)
		problems.push(`清单指向不存在的技能: ${orphan.join(", ")}`);

	// PRESET 是否与技能集合一致（预设写错会让 SSR 首屏和「恢复预设」结果不一致）
	// PRESET 的 key 也有两种写法：带引号（修行录）与裸标识符（技术图）。
	const pfile = sfile;
	if (fs.existsSync(pfile)) {
		const psrc = fs.readFileSync(pfile, "utf8");
		const pk = psrc.lastIndexOf("PRESET");
		if (pk > 0) {
			const re2 =
				/^\t(?:"([a-zA-Z0-9_$-]+)"|([a-zA-Z_$][a-zA-Z0-9_$-]*)):\s*\d+,?/gm;
			const pids = new Set();
			let m2;
			while ((m2 = re2.exec(psrc.slice(pk)))) pids.add(m2[1] || m2[2]);
			const missing = ids.filter((i) => !pids.has(i));
			const extra = [...pids].filter((i) => !idSet.has(i));
			if (missing.length) problems.push(`PRESET 缺: ${missing.join(", ")}`);
			if (extra.length) problems.push(`PRESET 多: ${extra.join(", ")}`);
		}
	}

	const byGroup = {};
	for (const s of skills) byGroup[s.group] = (byGroup[s.group] || 0) + 1;

	const memo = new Map();
	const depth = (n) => {
		if (memo.has(n)) return memo.get(n);
		const reqs = adj.get(n) || [];
		const d =
			reqs.length === 0 ? 0 : Math.max(...reqs.map((r) => depth(r))) + 1;
		memo.set(n, d);
		return d;
	};
	let maxD = 0;
	for (const s of skills) maxD = Math.max(maxD, depth(s.id));

	if (problems.length) {
		fail++;
		console.log(`✗ ${name}（${skills.length} 方块）`);
		for (const p of problems) console.log(`    - ${p}`);
	} else {
		console.log(
			`✓ ${name}  ${skills.length} 方块 · ${maxD + 1} 层 · ${Object.keys(byGroup).length} 方向`,
		);
	}
}

console.log(
	fail ? `\nDATA_FAIL（${fail} 张图有问题）` : "\nDATA_OK（全部通过）",
);
process.exit(fail ? 1 : 0);
