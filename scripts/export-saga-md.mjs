/**
 * 把话本正文从 src/data/saga/vol*.ts 导出成一份 Markdown：docs/小说-穷巷有龙.md
 *
 * 为什么要脚本而不是手抄：站内正文（读者看到的）和仓库里的 md（能被检索、能被 diff）
 * 必须是同一份东西。自动导出保证它们永远同步。
 *
 * 用法：node scripts/export-saga-md.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SAGA_DIR = "src/data/saga";
const OUT = "docs/小说-穷巷有龙.md";
const RE = /\{\s*title: "([^"]*)",\s*paragraphs: \[([\s\S]*?)\n\t{3}\],/g;

const files = readdirSync(SAGA_DIR)
	.filter((f) => /^vol\d+\.ts$/.test(f))
	.sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

if (files.length === 0) {
	console.error(`${SAGA_DIR} 下没有 vol*.ts，先写正文再来导出。`);
	process.exit(1);
}

const body = [];
let no = 0; // 回目序号，0 = 序章
let count = 0;
let totalChars = 0;

for (const f of files) {
	const src = readFileSync(join(SAGA_DIR, f), "utf8");
	const volName =
		(src.match(/name: "([^"]+)",\s*\n\s*chapters:/) || [])[1] || f;
	const chapters = [];

	body.push(`## ${volName}`, "");
	let m = RE.exec(src);
	while (m) {
		const text = [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)]
			.map((x) => x[1])
			.join("\n\n");
		const chars = text.replace(/\s/g, "").length;
		chapters.push(chars);
		totalChars += chars;
		no += 1;
		count += 1;
		body.push(
			`### ${no === 1 ? `序章 · ${m[1]}` : `第 ${no - 1} 回 · ${m[1]}`}`,
			"",
			text,
			"",
		);
		m = RE.exec(src);
	}
	console.log(`${volName}：${chapters.length} 篇`);
}

writeFileSync(
	OUT,
	[
		"# 穷巷有龙",
		"",
		`> 连载中 · 已更 ${count} 回 · 约 ${totalChars} 字`,
		"",
		"---",
		"",
		...body,
		"---",
		"",
		"*本文随站内「彻底点亮一个技能」逐回解锁。书架（左下角书本图标）里能看到已启封的回目。*",
		"",
	].join("\n"),
	"utf8",
);

console.log(`\n合计 ${count} 篇 / ${totalChars} 字 → ${OUT}`);
