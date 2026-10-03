---
category: "CSS"
question: "什么是 BFC？它能解决哪些实际问题？"
level: "进阶"
frequency: 4
tags: ["BFC", "布局", "外边距塌陷"]
source: "2026-08-startup-tech-round"
---

## 一句话答案

BFC（块级格式化上下文）是一块**独立的渲染区域**，区域内部的布局怎么折腾都不会影响到外面。它的价值不在于定义，而在于那三种真实场景。

## 怎么触发

以下任意一条即可：

- 根元素 `<html>`
- `float` 不为 `none`
- `position` 为 `absolute` 或 `fixed`
- `display` 为 `inline-block`、`flex`、`grid`、`table-cell`
- `overflow` 不为 `visible`（最常用，且副作用最小）

## 三种真实场景

### 1. 清除浮动

父元素里全是浮动子元素时，父元素高度会塌成 0。

```css
.parent {
  overflow: hidden; /* 触发 BFC，重新包住浮动子元素 */
}
```

### 2. 解决外边距塌陷

两个相邻的块级元素，上下 `margin` 会合并取较大值——**这是塌陷，不是 bug**。如果不想合并，给其中一个套一层 BFC 容器即可隔断。

### 3. 阻止元素被浮动元素覆盖

左边浮动、右边普通流文字会绕排。给右边加 `overflow: hidden`，它就变成独立的 BFC，不再绕着浮动走，而是自己占一列。

```css
.left { float: left; width: 200px; }
.right { overflow: hidden; } /* 不做左侧浮动的内容区域 */
```

## 追问会问什么

- **BFC 和层叠上下文是一回事吗？** 不是。BFC 管的是布局，层叠上下文（`z-index`）管的是绘制顺序，两者触发条件有重叠但概念完全不同。
- **`overflow: hidden` 有什么副作用？** 会裁掉溢出内容，也可能意外创建滚动容器。

## 我的理解

我最初只把 BFC 记成「清除浮动用的」，被追问就哑了。后来意识到它是一个**隔离边界**的概念，三种场景其实都是「把影响关在盒子里」这一件事的不同表现。
