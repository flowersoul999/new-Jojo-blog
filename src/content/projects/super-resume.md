---
title: 超级简历
summary: AI 驱动的简历助手，上传 PDF 后用豆包 API 解析成结构化数据，再做智能问答、技能雷达图、经历时间线和模拟面试评分。
role: 独立开发
start: 2026-07-25
end: 2026-07-26
status: 已完成
category: 个人
languages:
  - TypeScript
stack:
  - Next.js
  - React 19
  - Tailwind CSS
  - Framer Motion
  - pdf-parse
metrics:
  - label: 框架
    value: Next.js 16
  - label: UI
    value: React 19 + TS
  - label: AI 能力
    value: 解析 / 问答 / 面试评分
links:
  - label: 源码
    href: https://github.com/flowersoul999/super-resume
    icon: material-symbols:code-braces
repo: https://github.com/flowersoul999/super-resume
license: ""
featured: true
order: 4
icon: S
---

## 背景

简历是求职里最需要反复改的东西，但每次改都要手动调整格式。我想做一个工具：上传 PDF 简历，AI 把它解析成结构化数据，之后就能以「问答」的方式补充和修改，而不是在一堆表单里挪方块。

定位上它不是简历生成器，而是**简历助手**——帮你想清楚该写什么，格式只是副产品。

## 方案

Next.js 16 App Router + Turbopack，React 19 + TypeScript，Tailwind CSS 4，动画用 Framer Motion，图标 Lucide。

关键选择是**全部能力走 API 路由**，PDF 解析、AI 问答、AI 解析、PDF 预览各自独立：

```text
src/app/api/
├── chat/          # 聊天接口
├── parse/         # AI 解析接口
├── parse-pdf/     # AI 解析 PDF
├── preview-pdf/   # PDF 预览
├── resume/        # 简历数据接口
└── upload/        # 文件上传
```

没有走本地解析，是因为结构化提取这一步现在的模型做得比自己写正则靠谱得多。当然保留了一个传统的 `resume-parser.ts` 作为兜底。

## 实现

**PDF 解析。** 用 `pdf-parse` 拿文本，交给豆包 API （火山引擎）做结构化提取。关键设计是不用固定模板——简历格式千差万别，让模型自己识别字段，比我写一堆规则靠谱。

**技能雷达图。** 解析出来的技能按熟练度画成雷达图。这是我喜欢的一个小设计：简历上写「熟悉 Vue」是空话，画成雷达图至少形式上有了对比。

**模拟面试 + AI 评分。** 内置技术、行为、项目三类题库，回答之后由 AI 基于内容评分并给反馈建议。这个功能后来成了我最常用的部分——比干看题库有效。

**面试模拟的快捷提问和历史记录。** 预设快捷问题一键问，聊天历史自动保存。

**全屏预览。** 图片点击全屏放大，支持 ESC 退出。

## 踩坑

**Next.js 16 依赖版本变化。** 16.0.10 配套的 App Router 和 Turbopack 有些 API 和旧版不同，照着旧教程写会报错。这次踩坑让我意识到：**新框架要读 changelog，不是读几年前的博客。**

**pdf-parse 在 server 端的加载。** 这个库会在 Node 环境里尝试用 worker，在 App Router 的 route handler 里偶尔出问题，需要确保只在服务端 import。

**AI 返回的 JSON 不一定合法。** 模型可能返回带 markdown 代码块的 JSON，或者尾随逗号。必须在解析前做清洗，否则 JSON.parse 直接抛异常。

## 复盘

这个项目让我第一次用上了「LLM 做信息提取」这件事。之前的认知里 AI 是用来生成内容的，这个项目让我意识到**结构化提取才是大模型最稳的用法**——输出格式固定、有明确边界、可校验。

面试模拟那个功能是意外收获。它让我意识到「准备面试」缺的不是题库，而是**对着自己的经历被追问**。所以后来我把这个项目的思路搬到了博客的面试板块里。
