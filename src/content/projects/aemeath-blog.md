---
title: Aemeath 个人博客
summary: 基于 Astro 7 + Svelte 5 + TypeScript 的二次元风格个人站，部署在 Vercel + Cloudflare，自己写了音乐播放器、自建访问分析、修仙境界系统和四张技能图。
role: 独立开发
start: 2026-09-27
status: 在研
category: 个人
languages:
  - TypeScript
  - Astro
  - Svelte
stack:
  - Astro
  - Svelte 5
  - TypeScript
  - Vercel
  - Cloudflare
  - Tailwind CSS
metrics:
  - label: 页面
    value: 40+
  - label: 组件
    value: 177 个 astro
  - label: 部署
    value: Vercel + Cloudflare
links:
  - label: 在线访问
    href: https://jojo-blog-tau.vercel.app
    icon: material-symbols:language
  - label: 源码
    href: https://github.com/flowersoul999/new-Jojo-blog
    icon: material-symbols:developer-mode
repo: https://github.com/flowersoul999/new-Jojo-blog
license: MIT
featured: true
order: 2
icon: A
---

## 背景

我一直在找能把「技术笔记」和「个人表达」放在一起的地方。市面上的技术博客主题大多太素，不是我想要的风格；纯个人主页又放不下我写的技术文章。这个站的目标是：技术内容能沉淀，同时视觉上是我自己会喜欢的二次元 + 中文诗意调性。

现在的架构是 Astro 7 + Svelte 5 + TypeScript，部署在 Vercel，域名走 Cloudflare。

## 方案

选 Astro 而不是纯 SPA，是因为博客这个场景**内容多、交互少**。文章、技能图、项目页这些主体是静态内容，只有音乐播放器、编辑器、后台仪表盘需要客户端交互。Astro 的岛屿架构正好匹配：默认静态渲染，交互部分按需 hydration，构建出来的 HTML 又快又干净。

Svelte 5 的响应式语法（`$state` / `$derived`）比 Svelte 4 简洁太多，写复杂交互时不用再操心什么时候更新。

**全站trailingSlash: "always"。** 这个配置有一个隐藏坑：所有同源接口调用必须带尾斜杠，否则 404。我写 `/api/geo` 直接 404，改成 `/api/geo/` 才通。这种问题类型检查发现不了，只有真机请求才能暴露。

## 实现

几个我觉得值得记下来的部分。

**音乐播放器 + 逐字歌词。** 用 LRC 格式的歌词做逐字染色，滚动进度条有波浪流动效果，播放器有波浪（主界面）、底部居中浮动歌词卡、悬浮迷你播放器三种形态。不过逐字染色这块一度是坏的：主面板的绘制函数引用了一个没声明的偏移量变量（`LRC_OFFSET`），每帧抛 `ReferenceError`，染色全程失效；后来改成从 Manager 的 `state.config.lyricsOffset` 读（配置默认 1 秒，用来抵消蓝牙音箱之类的音频输出延迟），才和浮动歌词、行级高亮对齐。

**自建访问分析。** 每次访问通过 GitHub API 提交一个事件到仓库 `analytics/events/*.json`，后台仪表盘读回来。归属地到区县级：腾讯地图 key 走区县，兜底太平洋库到市。前台只展示到「省+市」，区县只在后台——第三方 IP 库对部分 IP 只到省级，前台会出现「中国广东省」这种没意义的显示。

**修仙境界系统。** 这是我用一个「修行」隐喻串起来的上层系统：九境界按总修为百分比划界，修为由四张技能图的清单项加权算出来，解锁链是「入道 → 筑基 → 结丹 → 元婴」。技能图本身锁着，前端要 50% 修为才能开，后端 75%，Agent 100%。这个设计让「学技能」变成了有反馈的过程。

**四张技能图。** 计算机基础、前端、后端、Agent 开发。加技能的边际成本被压到最低：改权重表就行，修为总量是从四图数据自动推导出来的，不用手动改。

## 踩坑

**Astro 没有 `class:xxx={cond}`。** 写 `class:active={isActive}` 会被原样输出成一个属性，页面上看不到效果。正确写法是 `class:list={["a", cond && "is-active"]}`。这个坑很隐蔽，因为构建不报错，只是样式不生效。

**岛屿里 import 图片拿到的是对象。** 在 Svelte 组件里 import 图片，拿到的是 `ImageMetadata` 对象，直接用会渲染成 `[object Object]`。必须写 `.src`。

**主题安全文字色只能用 `var(--text-color)`。** 我一开始用了 `var(--deep-text)`，深色模式下不会变浅，文字直接和背景糊在一起。现在的约定是安全文字一律 `--text-color`，需要降透明用 `color-mix()`。

**最外层卡片别加 `overflow-hidden`。** 会把内部 `position: sticky` 的粘性定位一起干掉，表现是某些吸顶元素突然不粘了。

## 复盘

这个项目让我第一次完整走过「从零到一个长期在维护的站点」的流程。技术上最大的收获是搞清了静态生成和客户端交互的边界该怎么划——什么时候该用岛屿、什么时候纯静态就够。

下一阶段想把「项目页」「技术栈统计」这类结构化数据做得更扎实，以及把学习进度（技能图）和产出（项目、文章）真正关联起来，让「我学了什么」和「我做出了什么」互相可查。
