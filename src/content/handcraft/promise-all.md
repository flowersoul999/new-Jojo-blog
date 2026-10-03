---
title: "手写 Promise.all"
kind: "手写代码"
difficulty: "中等"
scenario: "并发发多个请求，全部成功后再统一渲染；只要有一个失败就立刻失败。"
tags: ["Promise", "异步", "并发", "手写题"]
summary: "三个关键点：用计数器判断而不是数组长度、按 index 写回保证顺序、非 Promise 值要包一层。"
---

## 场景

页面初始化要并发拉 4 个接口，全部回来之后一起渲染。用 `Promise.all` 一行就行，但面试官要你自己实现。

## 代码

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let settled = 0;

    if (items.length === 0) {
      resolve([]);
      return;
    }

    items.forEach((item, index) => {
      Promise.resolve(item).then(
        (value) => {
          results[index] = value;
          settled += 1;
          if (settled === items.length) resolve(results);
        },
        (reason) => reject(reason),
      );
    });
  });
}
```

## 三个关键点

1. **用计数器而不是 `results.length` 判断完成**。`results` 是稀疏数组，`new Array(4)` 一开始 `length` 就是 4，拿长度判断会直接 resolve 空数组。
2. **按 `index` 写回结果**，不能用 `push`。否则返回顺序取决于谁先完成，而不是传入顺序。
3. **`Promise.resolve(item)` 包一层**，这样数组里混着普通值也能工作。

## 常见追问

### 有一个失败会怎样？

立刻 `reject`，但其他请求**不会取消**——`Promise.all` 没有取消能力。真要取消得上 `AbortController`。

### 不想因为一个失败就全废怎么办？

用 `Promise.allSettled` 拿到每个的 `{ status, value | reason }`：

```js
const results = await Promise.allSettled(tasks);
const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
```

### 那 Promise.race 呢？

谁先 settle（不管成功失败）就采用谁。常用来给请求加超时：

```js
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("请求超时")), ms),
  );
  return Promise.race([promise, timeout]);
}
```

## 面试延伸

- `Promise.all` 的入参是 `iterable` 不是 `array`，所以要用 `Array.from` 转一下。
- 自己实现时要注意：`resolve` 之后再调 `reject` 是无效的，Promise 状态不可逆，所以不用额外加标记。
