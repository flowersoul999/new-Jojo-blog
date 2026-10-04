---
title: AI Travel 智能旅行规划
summary: Vue 3 移动端 H5 搭配 Express + LangChain 后端，输入城市预算天数自动生成每日行程和预算明细，对话走 SSE 流式，支持多家大模型提供商。
role: 独立开发
start: 2026-06-15
end: 2026-06-16
status: 已完成
category: 实验
languages:
  - Vue
  - JavaScript
stack:
  - Vue 3
  - Vite
  - Vant
  - Express
  - LangChain
  - SSE
metrics:
  - label: 形态
    value: 移动端 H5
  - label: 大模型
    value: 多家可切换
  - label: 传输
    value: SSE 流式
links:
  - label: 源码
    href: https://github.com/flowersoul999/AI-travel
    icon: material-symbols:code-braces
repo: https://github.com/flowersoul999/AI-travel
license: ISC
featured: false
order: 6
icon: A
---

## 背景

这个项目是我正式接触 LangChain 的起点。选题旅行规划是因为它天然适合结构化输出：城市、预算、天数进去，每天上午下午晚上的行程出来，预算还能自动拆成住宿餐饮交通门票。

目标是摸清两件事：大模型能不能稳定输出结构化数据，以及流式响应在移动端体验如何。

## 方案

前后端完全分离：

- **前端** `travel-h5/`：Vue 3 + Vite + Vant 4的移动端 H5，Composition API
- **后端** `travel-server/`：Express + LangChain.js，OpenAI / SiliconFlow / DeepSeek 多提供商

`MODEL_PROVIDER` 环境变量切模型，不同厂商只改配置不改代码。

API只有三个：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/travel/recommend` | 获取旅行推荐行程 |
| POST | `/travel/chat` | AI 对话（SSE 流式） |
| POST | `/heartbeat` | 健康检查 |

前端 dev server 配了代理把 `/travel` 转发到 `localhost:3300`，本地开发不需要处理跨域。

## 实现

**行程生成的结构化输出。** 关键不是「让模型输出 JSON」，而是**先定义好结构再让模型填**。我先把每天的行程定义为 `{ morning, afternoon, evening }` 的固定 schema，再让模型按这个结构生成。约束给得越死，输出越可靠。

**预算自动拆分。** 住宿、餐饮、交通、门票四项，按总预算比例分配。这里有个坑：直接让模型算会出现总额对不上的情况，得在提示里明确要求各项之和等于总预算，并且服务端再校验一次。

**SSE 流式对话。** 用了 LangChain 的流式输出，内容一块块推给前端。用户看到的是逐字出现的回复，而不是等几秒然后整段蹦出来——这个体验差别比想象的大。

**降级兜底。** LLM 未配置时自动降级为模拟数据，保证接口不挂。演示和调试时这点很重要。

## 踩坑

**模型输出的 JSON 带 markdown 代码块。** 第一次跑直接解析失败。要么在提示里禁止输出代码块，要么在前端做清洗。我两边都做了——提示约束 + 解析兜底。

**流式响应没做错误处理。** 大模型服务超时或者返回中断，前端会一直转圈。需要监听流的 `error` 事件，给用户明确提示。

**SSE 在移动端 Safari 上有连接数限制。** HTTP/1.1 下同域名 SSE 连接数有限制，长时间对话可能连不上。测试的时候发现的，生产环境可以考虑 WebSocket。

## 复盘

这是我第一次把 LangChain 用起来，也是第一次意识到「结构化输出」是 LLM 应用最实用的能力。后面做DevFlow AI 的时候，我用的还是这套思路：先定义清楚结构，再让模型填。

项目本身很小，只花了两天，但收获不小。后面如果要继续做，我会先补上：
- 对话历史持久化（现在刷新就没了）
- 行程结果的可分享链接
- 更细的错误分类和重试策略
