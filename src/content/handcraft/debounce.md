---
title: "手写防抖 debounce"
kind: "手写代码"
difficulty: "简单"
scenario: "搜索框里每敲一个字都会发一次请求，希望等用户停下来之后再发。"
tags: ["防抖", "闭包", "this"]
summary: "闭包保存定时器 id，每次触发先清掉上一次。两个边界必须主动说：立即执行、cancel 取消。"
---

## 场景

输入框 `input` 事件里直接发请求，用户输入「前端」两个字的拼音会触发十几次请求。需求是**停下来 300ms 之后再发一次**。

## 代码

```js
function debounce(fn, delay = 300, immediate = false) {
  let timer = null;

  function debounced(...args) {
    const callNow = immediate && timer === null;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!immediate) fn.apply(this, args);
    }, delay);

    if (callNow) fn.apply(this, args);
  }

  debounced.cancel = function cancel() {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  return debounced;
}
```

## 三个必须主动说出来的点

1. **`this` 和参数要透传**。用 `fn.apply(this, args)` 而不是 `fn()`，否则挂在对象上调用时会丢 `this`。
2. **`immediate` 的判定条件是 `immediate && timer === null`**。我第一次写的时候只写了 `immediate`，导致连续触发时每次都立即执行，防抖失效。
3. **提供 `cancel`**。组件卸载或用户提交表单时，需要把挂着的定时器清掉。

## 和节流的区别

| | 防抖 | 节流 |
|---|---|---|
| 触发时机 | 停顿之后执行一次 | 固定间隔执行一次 |
| 典型场景 | 搜索建议、窗口 resize 后重排 | 滚动加载、拖拽 |

一句话记：**防抖看「停没停」，节流看「到点没到点」**。

## 面试延伸

- 如果要求「最后一次必须执行」怎么办？再加一个 `maxWait` 兜底。
- `debounce` 返回的函数上挂 `cancel` 算不算破坏封装？不算，这正是 lodash 的做法。
