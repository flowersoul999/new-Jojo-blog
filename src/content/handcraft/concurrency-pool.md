---
title: "实现一个带并发限制的请求池"
kind: "场景设计"
difficulty: "中等"
scenario: "有 20 个接口要请求，但浏览器连接数和服务端都扛不住同时打满，要求任意时刻进行中的请求不超过 5 个。"
tags: ["并发控制", "异步", "场景题"]
summary: "本质是「固定大小的执行槽位 + 一个等待队列」，每空出一个槽位就从队列里取下一个任务。"
---

## 场景

首屏要拉 20 个后端接口。直接 `Promise.all` 会把 20 个请求一次性打出去，浏览器同域名的连接数限制会让后面的请求排队，反而更慢，还可能被服务端限流。

需求：**最多同时 5 个在飞，剩下的排队，且任务要按提交顺序执行。**

## 思路

把它想成**停车场**：

- 车位只有 5 个；
- 来了车先看有没有空位，有就直接进；
- 没有就排在队尾，等有车开走时立刻补上。

落到代码里就是两个状态：`running`（当前执行中的数量）和 `queue`（等待队列）。

## 代码

```js
function createPool(limit = 5) {
  const queue = [];
  let running = 0;

  function pull() {
    if (running >= limit || queue.length === 0) return;

    running += 1;
    const { task, resolve, reject } = queue.shift();

    // 包一层 Promise.resolve()，保证 task 是异步启动，
    // 避免同步任务把递归栈拉爆
    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        running -= 1;
        pull(); // 空出一个车位，立刻补下一个
      });
  }

  return function schedule(task) {
    return new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      pull();
    });
  };
}
```

## 用法

```js
const request = createPool(5);

const urls = Array.from({ length: 20 }, (_, i) => `/api/item/${i}`);

const results = await Promise.all(
  urls.map((url) => request(() => fetch(url).then((res) => res.json()))),
);
```

这样 20 个任务会被 5 个 5 个地推出去，而且 `Promise.all` 拿到的**顺序仍然和 `urls` 一致**——因为顺序由 `urls.map` 决定，和实际完成顺序无关。

## 面试会追问什么

### 怎么统计「峰值并发数」？

加一个 `maxRunning` 变量，每次自增后记录最大值。面试官问这个是想确认你真的理解「并发」而不只是把代码抄出来了。

### 任务顺序能不能改成「快的优先」？

可以，把队列换成优先级队列。但一般没必要——顺序执行反而让请求分布更均匀。

### 一个任务失败了，队列会卡住吗？

不会。`finally` 保证无论成功失败都会释放槽位。但如果你用 `.then(resolve).catch(reject)` 而忘了 `finally`，失败路径就会泄漏槽位，池子越来越小直到彻底卡死——**这是这道题最容易翻车的地方**。

### 能不能中途取消？

需要额外维护 `aborted` 标记，在 `pull` 取任务前检查。更工程化的做法是配合 `AbortController`。

## 我的理解

这道题表面考异步，实际考的是**「资源受限时的调度」**。想通「槽位 + 队列」这个模型之后，批量上传分片、图片懒加载预取、爬虫限速都是同一套骨架。
