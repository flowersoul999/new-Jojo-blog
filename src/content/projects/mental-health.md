---
title: AI 心理健康助手
summary: Vue 3 + ECharts 的心理健康咨询平台，前台有AI 流式咨询、情绪日记、情绪花园和风险评估，后台有数据分析、富文本知识库和咨询记录管理。
role: 独立开发
start: 2026-04-05
end: 2026-04-20
status: 已完成
category: 课程
languages:
  - Vue
  - JavaScript
stack:
  - Vue 3
  - Vite
  - Element Plus
  - Pinia
  - ECharts
  - Tailwind CSS
  - SSE
metrics:
  - label: 前台模块
    value: 5 个
  - label: 后台模块
    value: 5 个
  - label: 语言构成
    value: Vue + JS
links:
  - label: 源码
    href: https://github.com/flowersoul999/mental-health-main
    icon: material-symbols:developer-mode
repo: https://github.com/flowersoul999/mental-health-main
license: ""
featured: false
order: 5
icon: M
---

## 背景

这是我的第一个完整的前后端分离项目，也是我第一次认真想「产品」而不只是「功能」。

选题方向是心理健康，因为这个领域天然需要多模态的交互设计——用户在难受的时候，不应该面对一堆表单。而我当时正在摸Vue 3，正好拿来做。

## 方案

架构上前台用户端和后台管理端分离，两个独立布局：

- **前台**：首页、AI 咨询、情绪日记、知识库
- **后台**：数据分析、知识文章管理、咨询记录管理、情绪日志管理
- **认证**：注册登录 + Token 认证 + 路由守卫，前台用户和后台管理员分权

AI 对话用 `fetch-event-source` 做 SSE 流式响应。没用WebSocket，因为这里的服务端是单向推文本，HTTP流就够。

## 实现

**情绪花园。** 这是我比较满意的一个设计。每条情绪记录不是干巴巴的数据点，而是一朵会随情绪状态变化的视觉元素。技术上不难，难的是意识到「记录情绪」这件事本身不该长得像填表格。

**风险等级评估 + 治愈建议。** 情绪分析之后不只是给个分数，还要给建议。风险等级高的会话在后台会被标记出来，供人工关注。

**ECharts 数据分析。** 后台看用户数据、会话分析、情绪趋势。用 `BaseChart.vue` 抽了一层基础组件，把 ECharts 的初始化、resize、主题响应统一封装在里面——后来我在别的项目里也沿用了这个做法。

**状态持久化。** 用了 `pinia-plugin-persistedstate`，用户登录状态、聊天记录、简历数据都存本地，刷新不丢。

## 踩坑

**ECharts 在响应式容器里宽度不对。** 容器用 flex 布局，ECharts 初始化时读到的宽度是 0，因为那时候布局还没稳定。解决方式是 `nextTick` 之后再 init，并且监听容器 `resize`。后来干脆抽成 `BaseChart` 统一处理。

**SSE 断线没重连。** 长对话中途网络抖动，连接断了界面就一直转圈。要处理 `readyState`，断开时明确提示用户，而不是假装还在等。

**富文本编辑器的 XSS。** 用 wangEditor 直接渲染用户输入的内容，存在风险。展示前必须做净化。

## 复盘

这是我从「跟着教程做」转向「自己设计」的起点。Vue 3 的响应式、SSE流式、Pinia 持久化这些技术点，做完这个项目才算真的用熟了。

最大的收获是意识到**交互设计会反过来约束技术选型**。「情绪花园」这个设计逼着我去理解 CSS 动画和 Vue 过渡；而 SSE 选型是因为我意识到用户等AI 回复的那几秒是产品体验的关键。
