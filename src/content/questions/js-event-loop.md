---
category: "JavaScript"
question: "说说事件循环，微任务和宏任务的执行顺序是怎样的？"
level: "高频"
frequency: 5
tags: ["事件循环", "异步", "Promise"]
source: "2026-09-ecommerce-first-round"
---

## 一句话答案

同步代码执行完后，**先把微任务队列整个清空，再取一个宏任务执行**；每执行完一个宏任务，都要再清一次微任务队列。这个循环就是事件循环。

## 详细展开

### 两类任务

| 类型 | 常见成员 |
|---|---|
| 宏任务 | `setTimeout`、`setInterval`、I/O、UI 渲染 |
| 微任务 | `Promise.then`、`queueMicrotask`、`MutationObserver` |

关键差异是**时机**：微任务在当前宏任务结束后立刻执行，不等下一轮；宏任务要排队等下一轮。

### 执行顺序

```
当前宏任务（整段同步代码）
  ↓ 执行完
清空微任务队列（全部执行完，包括执行中新增的）
  ↓
浏览器渲染（如果到了渲染时机）
  ↓
取下一个人宏任务
```

### async/await 落在哪里

`await` 之前的部分是**同步**执行的，`await` 之后的部分会被包成一个微任务。

```js
async function foo() {
  console.log("1");
  await bar();
  console.log("3"); // 这一行被包成微任务
}
function bar() {
  console.log("2");
}

console.log("0");
foo();
console.log("4");

// 输出：0 1 2 4 3
```

## 追问会问什么

- **微任务里再产生微任务怎么办？** 会继续加进当前队列，一并清空，所以可能饿死渲染。
- **`setTimeout(fn, 0)` 是立即执行吗？** 不是。要等当前同步代码和所有微任务跑完，且浏览器规定最小间隔约 4ms。
- **requestAnimationFrame 属于哪个？** 都不属于，它挂在渲染阶段，在微任务之后、下一帧绘制之前。

## 我的理解

以前我把事件循环理解成「同步 → 微任务 → 宏任务」的排队，其实更准确的说法是**微任务队列是每个宏任务结束后的强制清场**。想通这一点，去解释「为什么 Promise 比 setTimeout 快」就不再是背结论了。
