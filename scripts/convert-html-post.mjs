/**
 * 将「前端实习必备知识总结.html」转换为博客 .mdx 文件
 *
 * 关键设计：先提取所有 <pre><code> 代码块为占位符，再做其余 HTML → Markdown 转换，
 * 最后还原代码块。这样代码块内部的 <template>/<script>/<h3>/<p> 等标签不会被误转换。
 */
import fs from "node:fs";

const SRC = "D:/夸克下载/总结文章/前端实习必备知识总结.html";
const OUT =
	"D:/前端资源/超好看的博客/Aemeath/src/content/posts/frontend-intern.mdx";

let raw = fs.readFileSync(SRC, "utf8");

// 只取 body 内 container 部分
const bodyMatch = raw.match(
	/<div class="container">([\s\S]*?)\n<\/div>\n<\/body>/,
);
if (bodyMatch) raw = bodyMatch[1];
else throw new Error("container 未找到");

// 移除 hero 横幅、目录、底部 footer（用 frontmatter 里的自定义简介/目录替代）
raw = raw.replace(/<div class="hero">[\s\S]*?<\/div>/, "");
raw = raw.replace(/<div class="toc">[\s\S]*?<\/div>/, "");
raw = raw.replace(/<div class="footer">[\s\S]*?<\/div>/, "");

// 全局还原 HTML 实体（代码块内 &lt;div&gt; 也会还原成 <div>，但已被后续占位符保护）
const entities = {
	"&lt;": "<",
	"&gt;": ">",
	"&amp;": "&",
	"&quot;": '"',
	"&#39;": "'",
	"&nbsp;": " ",
};
raw = raw.replace(/&(lt|gt|amp|quot|#39|nbsp);/g, (m, k) => {
	return entities["&" + k + ";"] ?? m;
});

// ========== 第一步：提取代码块为占位符 ==========
const codeBlocks = [];
raw = raw.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (m, code) => {
	// 去掉代码内的高亮 span（仅保留文本），并去掉首尾空白
	code = code
		.replace(/<span class="(?:comment|cmd|num|label)">/g, "")
		.replace(/<\/span>/g, "")
		.trim();
	codeBlocks.push(code);
	return `\n__CODEBLOCK_${codeBlocks.length - 1}__\n`;
});
console.log("代码块数量: " + codeBlocks.length);

// ========== 第二步：处理其余 HTML ==========
// 行内高亮 span
raw = raw.replace(/<span class="comment">([\s\S]*?)<\/span>/g, "$1");
raw = raw.replace(/<span class="cmd">([\s\S]*?)<\/span>/g, "$1");
raw = raw.replace(/<span class="num">([\s\S]*?)<\/span>/g, "$1");
raw = raw.replace(/<span class="label">([\s\S]*?)<\/span>/g, "**场景**：");

// 标题 / 段落 / 分隔线
raw = raw.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, "\n## $2\n");
raw = raw.replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/g, "\n### $2\n");
raw = raw.replace(/<hr\s*\/?>/g, "\n---\n");
raw = raw.replace(/<p>([\s\S]*?)<\/p>/g, "\n$1\n");

// 表格 → Markdown 表格
raw = raw.replace(/<table>([\s\S]*?)<\/table>/g, (m, tbody) => {
	const rows = [...tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) =>
		[...r[1].matchAll(/<(th|td)>([\s\S]*?)<\/(th|td)>/g)].map((c) =>
			c[2].trim(),
		),
	);
	if (rows.length === 0) return "";
	const md = rows.map((row, i) => {
		const line = "| " + row.join(" | ") + " |";
		const sep = i === 0 ? "|" + row.map(() => "---").join("|") + "|" : null;
		return sep ? line + "\n" + sep : line;
	});
	return "\n" + md.join("\n") + "\n";
});

// 提示框 / 警告框 / 案例框
raw = raw.replace(/<div class="tip">([\s\S]*?)<\/div>/g, "\n> **提示**：$1\n");
raw = raw.replace(/<div class="warn">([\s\S]*?)<\/div>/g, "\n> **警告**：$1\n");
raw = raw.replace(/<div class="case">([\s\S]*?)<\/div>/g, "\n---\n\n$1\n");

// 剩余内联 HTML 标签 → 保留文本
raw = raw.replace(/<!--[\s\S]*?-->/g, "");
raw = raw.replace(/<code>([\s\S]*?)<\/code>/g, "`$1`");
raw = raw.replace(/<strong>([\s\S]*?)<\/strong>/g, "**$1**");
raw = raw.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/g, "$1");
raw = raw.replace(/<ul>/g, "\n");
raw = raw.replace(/<\/ul>/g, "\n");
raw = raw.replace(/<li>[ \t]*([\s\S]*?)<\/li>/g, "- $1\n");
raw = raw.replace(/<\/?(?:div|section|span|blockquote|br|p)[^>]*>/gim, "");

// 清理非代码行行首缩进（Markdown 4 空格会误判为代码块）
raw = raw.replace(/(^|\n)[ \t]{2,}(?=\S)/g, "$1");

// ========== 第三步：还原代码块 ==========
codeBlocks.forEach((code, i) => {
	raw = raw.replace(`__CODEBLOCK_${i}__`, "\n```\n" + code + "\n```\n");
});

// ========== 第四步：收尾清理 ==========
// 场景标签合并成一行：**场景**：\n我接手... → **场景**：我接手...
raw = raw.replace(/\*\*场景\*\*：\s*\n\s*/g, "**场景**：");
// 提示语内冒号强调样式统一：**血泪教训：** → **血泪教训**：
raw = raw.replace(/\*\*血泪教训：\*\*/g, "**血泪教训**：");
raw = raw.replace(/\*\*记忆技巧：\*\*/g, "**记忆技巧**：");
raw = raw.replace(/\*\*简单记：\*\*/g, "**简单记**：");
raw = raw.replace(/\*\*面试怎么说：\*\*/g, "**面试怎么说**：");
// 合并多余空行、去首尾空白
raw = raw.replace(/\n{3,}/g, "\n\n").trim();

const frontmatter = `---
title: "前端实习必备知识总结"
published: 2026-09-15
description: "围绕一个电商项目，梳理前端实习面试常考板块：Git 命令、前后端分离与 RESTful API、Axios 封装、Vue 核心、Vue CLI/Vite、Element-UI 组件库。"
tags: ["Git", "Vue", "Axios", "接口", "前端"]
category: "前端"
image: "/blogs/前端/frontend-intern-cover.jpg"
author: "jojo"
draft: false
comment: true
lang: "zh-CN"
aiPolished: false
---

本文整理了前端实习面试最常考的几大板块：**Git 常用命令**、**前后端分离 API 交互**、**Vue 实战核心**、**Vue CLI / Vite** 与 **Element-UI 组件库**，并穿插一个电商项目贯穿讲解。

## 目录

- [Git 版本控制常用命令](#一git-版本控制常用命令)
- [前后端分离与 API 交互模式](#二前后端分离与-api-交互模式)
- [Vue 核心知识](#三vue-核心知识)
- [Vue CLI 与项目创建](#四vue-cli-与项目创建)
- [Element-UI 组件库](#五element-ui-组件库)

`;

fs.writeFileSync(OUT, frontmatter + raw + "\n");
console.log("输出文件: " + OUT);
console.log("长度: " + (frontmatter + raw).length);
