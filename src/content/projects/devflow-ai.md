---
title: DevFlow AI
summary: 面向 GitHub PR / Issue 研发协作的全栈 AI Agent，接仓库数据做Issue 分析、PR 审查、CI 排障，内置 RAG 知识库和 Planner → 专用 Agent → Observer → Synthesis 的多 Agent 工作流。
role: 独立开发
start: 2026-09-30
status: 在研
category: 个人
languages:
  - Python
  - TypeScript
stack:
  - FastAPI
  - Next.js
  - LangChain
  - PostgreSQL
  - Milvus
  - Pydantic
  - Docker
metrics:
  - label: 后端语言
    value: Python + FastAPI
  - label: 向量库
    value: Milvus
  - label: Agent 编排
    value: 多 Agent 工作流
links:
  - label: Agent 技能图
    href: /agent/
    icon: material-symbols:smart-toy
  - label: 后端技能图
    href: /backend/
    icon: material-symbols:storage
repo: https://github.com/flowersoul999/DevFlow-AI
license: ""
featured: true
order: 3
icon: D
---

## 背景

现在大模型的 Agent 演示项目很多，但大多停在「和一个PDF 聊天」。我想做一个真正嵌进研发流程的东西：连上 GitHub 仓库，读Issue、PR diff、CI 日志、项目文档，然后给出**结构化的建议和安全的操作草稿**。

这个项目是我从「用AI 写代码」往「让 AI 参与工程决策」方向的一次尝试。

## 方案

核心判断是：**不要把所有私域数据都向量化。**

这是设计里最关键的一个决定。真正需要跨来源语义召回、会反复使用的非结构化知识才进 RAG；源码和配置以当前 checkout 为准，优先走工作区/词法检索；团队信息和实时状态走结构化查询。

理由很简单：把源码塞进向量库，等于放弃了对代码的精确控制。代码的问题「这个函数在哪被调用」用词法检索一秒就查到了，用向量检索反而可能召回一堆语义相似但无关的片段。

所以检索路径是分层的：

| 数据类型 | 走哪条路 |
| --- | --- |
| Issue 描述、PR 说明、Review 评论 | RAG（向量 + 关键词混合） |
| 失败 CI 日志、项目文档、已批准记忆 | RAG |
| 当前工作区源码与配置 | 工作区工具 / 词法检索 |
| 团队、实时状态 | 结构化查询 |

## 实现

**混合 RAG 的对话链路。** `ContextAssembler` 在调用 ChatAgent 前按原始问题检索并注入证据；进入推理循环后，模型仍可以主动把 `rag.search_similar_documents` 当工具用——改写查询、连续补查不同资料，并根据多次工具结果**交叉验证**答案。

这个设计比「一次性把上下文塞满」好得多：模型自己知道还缺什么信息，能主动去补。

**多 Agent 工作流审查。** `WorkflowOrchestrator` 构建的是闭环：

```text
Planner（规划）
  → 专用 Agent（Issue / PR / CI 分别看）
  → Observer（观察汇总结果）
  → Synthesis（综合判断）
```

Observer 这一步是刻意加的。没有它，Planner 的规划直接进 Synthesis，等于让模型一次性处理所有维度的信息，容易漏。没有它，各专用 Agent 的结论直接进 Synthesis，冲突和矛盾没人调和。Observer 先做一轮观察和交叉验证，Synthesis 才拿得到干净的信息。

**Skill Runtime。** 按用户显式指定或触发条件选择 `SKILL.md`，只向当前任务加载完整指令与受限资源。显式 Skill 会校验允许的工具，多 Agent 中的专用 Agent 各自加载自己的 Skill，并把版本、激活原因、指令摘要和执行校验写进 trace。

这点很重要：Agent 的行为要**可解释**。出了问题得能回答「你为什么调了这个工具」，trace 里得有记录。

**评测覆盖。** Issue 分类准确度、PR 覆盖度、RAG 命中率、工具 schema 就绪度、结构化输出校验。没有 eval 的 Agent 项目就是玄学，改了 prompt 不知道是变好还是变坏。

## 踩坑

**上下文不是越多越好。** 一开始我尽量把仓库里能拿到的都塞进上下文，结果模型注意力被稀释，输出的针对性反而变差。改成按需检索后，答案质量明显好转。

**让模型「交叉验证」比让它「一次答对」更可靠。** 单一来源的结论容易错，给它多次工具调用的机会让它自己比对，代价是延迟变长，但对研发决策类场景这个交换是值的。

**Skill 的权限边界要在代码里校验，不能只在 prompt 里写。** prompt 里说「不要用这个工具」是没用的，工具 schema 得真的不给。

## 复盘

这个项目让我把之前零散学的 RAG、Agent 编排、工具调用串成了一条完整的线。最有价值的体会是：**Agent 系统的难点不在模型，在上下文管理。**

模型本身够强，但如果喂给它的东西是错的、冗余的、或者没分层，输出必然不行。相比之下，判断「这条信息该走哪条检索路径」才是需要我自己想清楚的部分。
