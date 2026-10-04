---
title: 共享用工 SaaS 中控端
summary: 实习期间参与的中后台前端，39 个 workspace 的 pnpm monorepo，用 Vue + tsx + vxe-table 支撑共享用工业务的中控与超管两条线。
role: 前端实习生
start: 2026-06-01
end: 2026-10-01
status: 在研
category: 实习
languages:
  - TypeScript
  - Vue
stack:
  - Vue 3
  - Vben Admin
  - tsx
  - vxe-table
  - pnpm
  - Vite
metrics:
  - label: 参与模块
    value: 39 个 workspace
  - label: 实习时长
    value: 4 个月
  - label: 代码风格
    value: tsx 为主
links:
  - label: 技术栈
    href: /skills/
    icon: material-symbols:account-tree-rounded
  - label: 技能图
    href: /backend/
    icon: material-symbols:storage
repo: ""
license: 内部项目
featured: true
order: 1
icon: S
---

## 背景

共享用工 SaaS 的中控端是给运营和用工管理员用的后台，业务复杂度远高于普通管理台。它同时要管订单、用工结算、协议列表、考勤、财务对账，还要处理大量表格的筛选、导出、批量操作。

我进去的时候，中控端和超管端在同一个 monorepo 里，团队走的是内部 Git（`main` / `dev` / `test` / `pre-prod`对应不同环境），我个人分支是 `feature/LiuWenBo`，做完合并回`dev`。

## 方案

真正让我花心思的不是页面，而是这套monorepo 怎么用才不出问题。

**pnpm workspace + 共享工具库。** 39 个子项目，靠 `packages/utils` 抽公共能力。踩过的坑是一个改动动了公共库，本地看着没问题，预prod 别的子项目就崩了——因为别人依赖的 API 变了。后来我养成习惯：动公共库必须先把所有消费方的调用点搜一遍。

**Vben Admin 5.7.0作为底座。** 它把权限、路由、表格、Form 这些后台高频需求都封装了。我要做的业务基本是在它的约定里写东西，而不是自己造轮子。

**tsx 代替 SFC。** 项目里页面大量用 `tsx` 而不是 `.vue` 文件，写法接近 React。我一开始不习惯，`ref` 的心智负担比Vue 轻，但响应式解构要小心。

## 实现

我负责的功能里有两件让我记住的事。

**协议列表返回时自动刷新。** 问题是列表接口返回的字段会让当前页的筛选条件失效，用户点了查询看到空列表，还要手动再点一次刷新。我加了返回后自动重新拉取，但更关键的是保留了用户之前的筛选状态——不然自动刷新就变成了「每次都把用户的选择重置」。

```ts
// 列表请求完成后按原条件重查，而不是无条件重置
const reload = async () => {
  await fetchList();
  // 保留筛选：只重拉数据，不动 queryForm
};
```

**服务单金额保留两位小数。** 后端返回的浮点数直接展示会出现 `1234.5` 和 `1234.5000000001` 这种。解决方式不是简单 `toFixed`，而是在展示层统一走一个金额格式化函数，内部做四舍五入并处理 `null` / `undefined`。

## 踩坑

**vxe-table 的虚拟滚动和动态列。** 订单表格有二十多列，开了虚拟滚动之后某些列的固定列会错位。原因是动态增删列之后没让表格重新计算布局，需要在数据变化后触发一次 `recalc()`。这个坑排查花了半天，最后是靠读 vxe-table 源码里的 `doLayout` 定位的。

**团队分支策略踩坑。** 一开始我直接从 `main` 拉分支做功能，结果同事的代码和我冲突。正确流程是从`dev` 拉`feature/LiuWenBo`，做完合并 `dev`，再由团队合并到 `test` / `pre-prod`。

## 复盘

四个月下来，我最值钱的收获不是某个组件怎么写，而是**知道一个改动会影响到哪些地方**。39 个 workspace 的规模在中后台里不算大，但已经足够让我意识到：写代码前先搜「谁在调用我」，比事后 debug 省时间得多。

前端实习里最容易被忽略的一环是协作——分支怎么拉、代码进哪个环境、出问题谁负责，这些东西没人事先告诉你，得自己问、自己踩。这也是学校项目里学不到的。
