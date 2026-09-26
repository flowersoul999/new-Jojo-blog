---
title: "CSS零基础速成：3小时让你的网页颜值翻倍（保姆级教程）"
published: 2026-08-27
description: ""
tags: ["前端基础"]
category: "技术总结"
draft: false
lang: "zh-CN"
---

> 💡 **写在前面**：上一篇咱们学了HTML，做出了一个"毛坯房"一样的网页。今天咱们来学CSS，给你的网页"装修"一下，让它从土土的变成美美的。看完这篇，你就能写出好看的页面了。全文约9000字，建议收藏+动手敲代码！

---

## 📑 目录导航

- [一、CSS是什么？为什么要学？](#一css是什么为什么要学)
  - [1.1 一句话理解CSS](#11-一句话理解css)
  - [2.2 CSS能做什么？](#12-css能做什么)
  - [1.3 学习路线一览](#13-学习路线一览)
- [二、CSS怎么写？三种引入方式](#二css怎么写三种引入方式)
  - [2.1 行内样式](#21-行内样式)
  - [2.2 内部样式表](#22-内部样式表)
  - [2.3 外部样式表（推荐）](#23-外部样式表推荐)
  - [2.4 三种方式优先级对比](#24-三种方式优先级对比)
- [三、选择器：CSS的灵魂](#三选择器css的灵魂)
  - [3.1 基本选择器](#31-基本选择器)
  - [3.2 复合选择器](#32-复合选择器)
  - [3.3 伪类选择器](#33-伪类选择器)
  - [3.4 选择器优先级](#34-选择器优先级)
- [四、常用样式属性大全](#四常用样式属性大全)
  - [4.1 文字样式](#41-文字样式)
  - [4.2 背景样式](#42-背景样式)
  - [4.3 边框和圆角](#43-边框和圆角)
  - [4.4 盒子模型（重点！）](#44-盒子模型重点)
  - [4.5 布局相关](#45-布局相关)
- [五、Flex弹性布局（现代布局神器）](#五flex弹性布局现代布局神器)
  - [5.1 为什么用Flex？](#51-为什么用flex)
  - [5.2  Flex基本概念](#52--flex基本概念)
  - [5.3 容器属性](#53-容器属性)
  - [5.4 项目属性](#54-项目属性)
  - [5.5 Flex常用布局速查](#55-flex常用布局速查)
- [六、实战项目：写一个好看的个人主页](#六实战项目写一个好看的个人主页)
  - [6.1 设计思路](#61-设计思路)
  - [6.2 分步实现](#62-分步实现)
  - [6.3 完整代码](#63-完整代码)
- [七、新手必避的10个坑 ⚠️](#七新手必避的10个坑-️)
- [八、总结与后续学习建议](#八总结与后续学习建议)

---

## 一、CSS是什么？为什么要学？

### 1.1 一句话理解CSS

**CSS就是网页的化妆师。**

还记得上一篇的类比吗？
- HTML = 骨架（毛坯房）
- CSS = 妆容/装修（精装修）
- JavaScript = 灵魂（智能家居）

CSS的全称是 **Cascading Style Sheets**（层叠样式表），翻译成人话就是：**一种用来给HTML"化妆"的语言**。你告诉浏览器"这个字是红色的"、"那个盒子有圆角"、"这一栏在左边"，浏览器就按你说的来显示。

说直白点：**没有CSS的网页，就像没有化妆的素颜——能看，但不好看。**

### 1.2 CSS能做什么？

CSS的本事可大了，简单列几个：

| 功能 | 栗子 |
|------|------|
| 🎨 改颜色 | 文字颜色、背景颜色、边框颜色 |
| 📐 改大小 | 字体大小、元素宽高、间距 |
| 🔲 改形状 | 圆角、阴影、变形、旋转 |
| 📱 排版布局 | 左右分栏、居中对齐、响应式 |
| ✨ 动画效果 | 淡入淡出、滑动、旋转动画 |
| 🖼️ 背景图片 | 背景图、渐变、背景定位 |

你在网上看到的所有好看的网页，背后全是CSS在撑场子。

### 1.3 学习路线一览

给你画个CSS学习路径：

```
第一阶段：基础（本篇覆盖）
  ├─ 选择器
  ├─ 常用样式属性
  ├─ 盒子模型
  └─ Flex布局

第二阶段：进阶
  ├─ 定位（position）
  ├─ Grid网格布局
  ├─ 响应式布局
  ├─ CSS动画
  └─ CSS预处理（Sass/Less）

第三阶段：实战
  ├─ 仿写网站首页
  ├─ 做一个个人博客
  └─ 移动端适配
```

---

## 二、CSS怎么写？三种引入方式

CSS代码写在哪？一共有三种方式，各有各的用途。

### 2.1 行内样式

直接写在HTML标签的 `style` 属性里：

```html
<p style="color: red; font-size: 20px;">这段文字是红色的，字号20像素</p>
```

**优点**：写起来方便，优先级最高
**缺点**：只能管一个标签，代码复用性差，结构和样式混在一起

👉 **什么时候用**：临时改个样式，或者JavaScript动态修改样式的时候用。平时写项目不推荐。

### 2.2 内部样式表

写在HTML的 `<style>` 标签里，一般放在 `<head>` 中：

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    p {
      color: red;
      font-size: 20px;
    }
  </style>
</head>
<body>
  <p>这段文字是红色的</p>
  <p>这段也是红色的</p>
</body>
</html>
```

**优点**：一个页面内可以复用，结构和样式初步分离
**缺点**：只能管当前页面，多个页面没法共用

👉 **什么时候用**：单页面小项目，或者demo演示的时候用。

### 2.3 外部样式表（推荐）

把CSS写在单独的 `.css` 文件里，然后在HTML中引入：

第一步：新建一个 `style.css` 文件

```css
/* style.css */
p {
  color: red;
  font-size: 20px;
}
```

第二步：在HTML中用 `<link>` 标签引入

```html
<head>
  <link rel="stylesheet" href="./style.css">
</head>
```

**优点**：
- 结构和样式完全分离
- 多个页面可以共用同一个CSS文件
- 方便维护和修改

**缺点**：需要额外请求一个CSS文件（这点影响可以忽略）

👉 **强烈推荐**：做项目一定用外部样式表！这是行业标准做法。

### 2.4 三种方式优先级对比

如果三种方式同时设置了同一个样式，听谁的？

答案是：**谁离得近听谁的**（就近原则）

优先级从高到低：
```
行内样式 > 内部样式表 > 外部样式表
```

💡 **补充**：后面还会讲到 `!important`，那玩意儿优先级最高，但不推荐乱用。

---

## 三、选择器：CSS的灵魂

选择器就是**你要选谁来化妆**。

CSS的基本语法是这样的：

```css
选择器 {
  属性名: 属性值;
  属性名: 属性值;
}
```

比如：
```css
p {
  color: red;
  font-size: 16px;
}
```

意思就是：**选中所有的 `<p>` 标签，把文字颜色设为红色，字号设为16像素**。

选择器的种类很多，咱们一个个来说。

### 3.1 基本选择器

#### （1）标签选择器

直接写标签名，选中页面上所有这种标签：

```css
p { color: red; }      /* 所有p标签 */
h1 { font-size: 32px; } /* 所有h1标签 */
```

**特点**：选中所有的，不能只选一个。适合统一设置基础样式。

#### （2）类选择器（最常用！）

给标签加个 `class` 属性，然后用 `.类名` 来选：

HTML：
```html
<p class="red-text">我是红色的</p>
<p class="red-text">我也是红色的</p>
<p>我是黑色的（默认）</p>
```

CSS：
```css
.red-text {
  color: red;
}
```

**特点**：
- 最最最常用的选择器，没有之一
- 一个类可以被多个标签使用（一对多）
- 一个标签也可以用多个类，用空格隔开：`<p class="red-text big-size">`

👉 **命名建议**：类名用小写字母加中划线，比如 `header-title`、`btn-primary`，见名知意。

#### （3）id选择器

给标签加个 `id` 属性，然后用 `#id名` 来选：

HTML：
```html
<p id="unique">我是独一无二的</p>
```

CSS：
```css
#unique {
  color: blue;
  font-weight: bold;
}
```

**特点**：
- id在一个页面里是唯一的，不能重复
- 一般配合JavaScript用，CSS里用得不多

#### （4）通配符选择器

用 `*` 表示，选中页面上所有元素：

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

**特点**：选中所有东西，一般用来做"样式重置"，清除浏览器默认样式。

### 3.2 复合选择器

基本选择器可以组合起来用，实现更精确的选择。

#### （1）后代选择器

用空格隔开，选中某个元素内部的后代：

```css
/* 选中ul里面的所有li */
ul li {
  list-style: none;
}

/* 选中.box里面的所有p（包括孙子辈） */
.box p {
  color: red;
}
```

#### （2）子选择器

用 `>` 隔开，只选亲儿子，不选孙子：

```css
/* 只选中.box的直接子元素p，不选嵌套在里面的 */
.box > p {
  color: red;
}
```

#### （3）并集选择器

用逗号隔开，同时选中多个：

```css
/* 选中h1、h2、h3，都设置成蓝色 */
h1, h2, h3 {
  color: blue;
}
```

#### （4）交集选择器

两个选择器紧挨着写，同时满足两个条件才选中：

```css
/* 选中同时有box和red两个类的元素 */
.box.red {
  border: 1px solid red;
}
```

### 3.3 伪类选择器

伪类就是元素的某种"状态"，比如鼠标悬停、点击等。最常用的是链接的四个状态：

```css
/* 未访问过的链接 */
a:link {
  color: blue;
}

/* 已访问过的链接 */
a:visited {
  color: purple;
}

/* 鼠标悬停时 */
a:hover {
  color: red;
}

/* 鼠标按下时 */
a:active {
  color: orange;
}
```

⚠️ **注意**：这四个的顺序不能乱！要按 `link → visited → hover → active` 的顺序写，不然可能不生效。口诀：**LV 包包 hao（好）**。

除了链接，其他元素也能用 `hover`：

```css
/* 鼠标悬停在按钮上时变色 */
button:hover {
  background-color: #409eff;
  color: white;
}
```

还有一些常用的伪类：

| 伪类 | 作用 |
|------|------|
| `:first-child` | 选中第一个子元素 |
| `:last-child` | 选中最后一个子元素 |
| `:nth-child(n)` | 选中第n个子元素 |
| `:focus` | 获得焦点时（比如输入框被点击） |
| `:checked` | 被选中时（单选框/复选框） |

举个栗子：

```css
/* 列表的第一项去掉左边框 */
li:first-child {
  border-left: none;
}

/* 偶数行变色（斑马纹效果） */
tr:nth-child(even) {
  background-color: #f5f5f5;
}

/* 输入框获得焦点时的样式 */
input:focus {
  outline: none;
  border-color: #409eff;
}
```

### 3.4 选择器优先级

如果多个选择器同时选中了同一个元素，样式冲突了听谁的？

这就涉及到优先级了。优先级可以用一个"权重"来衡量：

| 选择器 | 权重 |
|--------|------|
| 通配符 `*` | 0,0,0,0 |
| 标签选择器 | 0,0,0,1 |
| 类选择器 / 伪类 | 0,0,1,0 |
| id选择器 | 0,1,0,0 |
| 行内样式 | 1,0,0,0 |
| `!important` | 最高（无敌） |

比较规则：**从左往右比，谁大谁牛，一样大就往后比**。

比如：
- `.box p`（0,0,1,1） > `p`（0,0,0,1）
- `#nav .item`（0,1,1,0） > `.nav .item`（0,0,2,0）

💡 **经验之谈**：
- 尽量用类选择器，少用id选择器
- 不要乱用 `!important`，那是最后的手段
- 选择器写得越简洁越好，不要嵌套太深

---

## 四、常用样式属性大全

CSS属性有上百个，但常用的也就那么二三十个。咱们挑最重要的说。

### 4.1 文字样式

| 属性 | 作用 | 常用值 |
|------|------|--------|
| `color` | 文字颜色 | `red`、`#ff0000`、`rgb(255,0,0)` |
| `font-size` | 字号 | `16px`、`14px`、`1.2em` |
| `font-family` | 字体 | `"微软雅黑"`、`Arial`、`sans-serif` |
| `font-weight` | 字重（粗细） | `normal`（正常）、`bold`（粗体）、`100~900` |
| `font-style` | 字体样式 | `normal`（正常）、`italic`（斜体） |
| `line-height` | 行高 | `24px`、`1.5`（倍数） |
| `text-align` | 水平对齐 | `left`、`center`、`right` |
| `text-decoration` | 文字装饰 | `none`（无）、`underline`（下划线）、`line-through`（删除线） |
| `text-indent` | 首行缩进 | `2em`（缩进两个字） |
| `letter-spacing` | 字间距 | `2px` |

来个综合示例：

```css
.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-align: center;
  line-height: 2;
}

.content {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  text-indent: 2em;
}
```

💡 **小技巧**：
- 颜色可以用十六进制（`#fff`）、rgb（`rgb(255,255,255)`）、rgba（带透明度）
- `line-height: 2` 表示行高是字号的2倍
- 文字垂直居中可以用 `line-height` 等于盒子高度的方法

### 4.2 背景样式

| 属性 | 作用 | 常用值 |
|------|------|--------|
| `background-color` | 背景颜色 | `#f5f5f5`、`red` |
| `background-image` | 背景图片 | `url(图片地址)` |
| `background-repeat` | 背景平铺 | `repeat`（默认平铺）、`no-repeat`（不平铺）、`repeat-x`、`repeat-y` |
| `background-position` | 背景位置 | `center center`、`left top`、`50% 50%` |
| `background-size` | 背景大小 | `cover`（覆盖）、`contain`（包含）、`100px 200px` |

这些属性可以合并成一个 `background`：

```css
/* 分开写 */
.box {
  background-color: #f5f5f5;
  background-image: url(./bg.jpg);
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

/* 合并写（推荐） */
.box {
  background: #f5f5f5 url(./bg.jpg) no-repeat center / cover;
}
```

渐变色背景也很常用：

```css
/* 线性渐变 */
.box {
  background: linear-gradient(to right, #ff9966, #ff5e62);
}

/* 径向渐变 */
.box {
  background: radial-gradient(circle, #ff9966, #ff5e62);
}
```

### 4.3 边框和圆角

| 属性 | 作用 | 常用值 |
|------|------|--------|
| `border` | 边框（简写） | `1px solid #000` |
| `border-width` | 边框宽度 | `1px` |
| `border-style` | 边框样式 | `solid`（实线）、`dashed`（虚线）、`dotted`（点线） |
| `border-color` | 边框颜色 | `#333` |
| `border-radius` | 圆角 | `10px`、`50%`（圆形） |
| `box-shadow` | 盒子阴影 | `5px 5px 10px rgba(0,0,0,0.3)` |

示例：

```css
/* 普通边框 */
.box {
  border: 1px solid #ddd;
  border-radius: 8px;
}

/* 圆形头像 */
.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
}

/* 卡片阴影效果 */
.card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}
```

`box-shadow` 的四个值分别是：水平偏移、垂直偏移、模糊半径、颜色。

### 4.4 盒子模型（重点！）

盒子模型是CSS的核心概念，搞不懂这个，布局你永远学不明白。

**什么是盒子模型？**

你可以把每个HTML元素都想象成一个"盒子"，这个盒子从里到外有四层：

```
┌─────────────────────────────┐
│          margin（外边距）    │
│  ┌───────────────────────┐  │
│  │    border（边框）      │  │
│  │  ┌─────────────────┐  │  │
│  │  │  padding（内边距）│  │  │
│  │  │  ┌───────────┐  │  │  │
│  │  │  │  content  │  │  │  │
│  │  │  │ （内容区） │  │  │  │
│  │  │  └───────────┘  │  │  │
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

| 层 | 作用 | 属性 |
|----|------|------|
| content | 内容区，放文字图片的 | `width`、`height` |
| padding | 内边距，内容和边框之间的距离 | `padding` |
| border | 边框 | `border` |
| margin | 外边距，盒子和其他盒子之间的距离 | `margin` |

#### （1）padding 内边距

```css
/* 四个方向一起设 */
.box { padding: 20px; }

/* 上下20px，左右10px */
.box { padding: 20px 10px; }

/* 上 右 下 左（顺时针） */
.box { padding: 10px 20px 30px 40px; }

/* 单独设置某个方向 */
.box {
  padding-top: 10px;
  padding-right: 20px;
  padding-bottom: 30px;
  padding-left: 40px;
}
```

#### （2）margin 外边距

用法和padding一模一样：

```css
.box { margin: 20px; }
.box { margin: 10px 20px 30px 40px; }
.box { margin-top: 10px; }
```

**margin的特殊用法：水平居中**

```css
/* 块级元素水平居中 */
.box {
  width: 300px;
  margin: 0 auto; /* 上下0，左右自动 */
}
```

⚠️ **经典坑点：margin塌陷**

两个垂直方向的margin碰到一起，会合并成一个，取较大的值。比如上面的盒子 `margin-bottom: 20px`，下面的盒子 `margin-top: 30px`，它们之间的距离不是50px，而是30px。这个后面避坑指南详细说。

#### （3）box-sizing 盒子模型类型

默认情况下，你设置的 `width` 和 `height` 只是 content 的大小，padding和border会把盒子撑大。

但有时候我们希望 `width` 就是整个盒子的宽度（包括padding和border），这时候就用 `box-sizing: border-box`：

```css
/* 标准盒子模型（默认） */
.box {
  box-sizing: content-box;
  width: 100px;
  padding: 20px;
  border: 5px solid red;
  /* 实际宽度 = 100 + 20*2 + 5*2 = 150px */
}

/* 怪异盒子模型（推荐） */
.box {
  box-sizing: border-box;
  width: 100px;
  padding: 20px;
  border: 5px solid red;
  /* 实际宽度 = 100px（content被压缩了） */
}
```

👉 **强烈建议**：在CSS最开头加上：

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

这样所有元素都用 `border-box`，计算尺寸就方便多了，不用担心加了padding盒子会变大。

### 4.5 布局相关

#### （1）display 显示模式

元素有不同的"显示模式"，决定了它怎么排列：

| 值 | 特点 | 代表元素 |
|----|------|---------|
| `block` | 块级元素：独占一行，可设宽高 | div、p、h1~h6、ul、li |
| `inline` | 行内元素：不独占一行，不可设宽高 | span、a、strong、em |
| `inline-block` | 行内块：不独占一行，可设宽高 | img、input、button |
| `none` | 隐藏元素，不占位置 | - |

可以通过 `display` 属性互相转换：

```css
/* 把a标签变成块级元素 */
a {
  display: block;
  width: 100px;
  height: 40px;
}

/* 把li变成行内块，实现横向排列 */
li {
  display: inline-block;
  margin: 0 10px;
}

/* 隐藏元素 */
.hidden {
  display: none;
}
```

#### （2）visibility 可见性

```css
/* 隐藏，但占位置 */
.hidden {
  visibility: hidden;
}

/* 显示（默认） */
.visible {
  visibility: visible;
}
```

和 `display: none` 的区别：
- `display: none`：完全消失，不占位置
- `visibility: hidden`：看不见，但位置还在

#### （3）overflow 溢出处理

内容太多，盒子装不下了怎么办？

```css
/* 溢出部分隐藏（常用） */
.box {
  width: 200px;
  height: 100px;
  overflow: hidden;
}

/* 显示滚动条 */
.box {
  overflow: auto; /* 内容多了才出现滚动条 */
  /* overflow: scroll; 永远显示滚动条 */
}
```

---

## 五、Flex弹性布局（现代布局神器）

### 5.1 为什么用Flex？

以前做布局，什么浮动啊、定位啊、margin负值啊，各种奇技淫巧，写得人头都大了。

Flex布局出来之后，一切都变得简单了。**水平居中？一行代码搞定。垂直居中？一行代码搞定。左右分栏？还是一行代码。**

现在做前端，Flex布局是基本功，不会Flex都不好意思说自己会CSS。

### 5.2 Flex基本概念

Flex布局有两个核心角色：
- **容器（flex container）**：父元素，加了 `display: flex` 的那个
- **项目（flex item）**：子元素，容器里面的直接子元素

```html
<div class="container">  <!-- 容器 -->
  <div class="item">1</div>  <!-- 项目 -->
  <div class="item">2</div>  <!-- 项目 -->
  <div class="item">3</div>  <!-- 项目 -->
</div>
```

```css
.container {
  display: flex;
}
```

加了 `display: flex` 之后，子元素（项目）就会自动横着排了，是不是很神奇？

### 5.3 容器属性

这些属性加在**父元素（容器）**上。

#### （1）flex-direction：主轴方向

决定项目是横着排还是竖着排：

```css
.container {
  flex-direction: row;          /* 从左到右（默认） */
  /* flex-direction: row-reverse; 从右到左 */
  /* flex-direction: column; 从上到下 */
  /* flex-direction: column-reverse; 从下到上 */
}
```

#### （2）justify-content：主轴对齐方式

决定项目在主轴方向上怎么排列：

```css
.container {
  justify-content: flex-start;    /* 左对齐（默认） */
  /* justify-content: flex-end; 右对齐 */
  /* justify-content: center; 居中 */
  /* justify-content: space-between; 两端对齐，中间平分 */
  /* justify-content: space-around; 每个项目两边间距相等 */
  /* justify-content: space-evenly; 所有间距都相等 */
}
```

#### （3）align-items：交叉轴对齐方式

决定项目在交叉轴（和主轴垂直的方向）上怎么排列：

```css
.container {
  align-items: stretch;     /* 拉伸，占满整个容器高度（默认） */
  /* align-items: flex-start; 顶部对齐 */
  /* align-items: flex-end; 底部对齐 */
  /* align-items: center; 居中对齐（垂直居中！） */
  /* align-items: baseline; 基线对齐 */
}
```

💡 **经典面试题：如何实现一个元素水平垂直居中？**

用Flex，两行代码搞定：

```css
.parent {
  display: flex;
  justify-content: center;  /* 水平居中 */
  align-items: center;      /* 垂直居中 */
}
```

就这么简单，以前要写一堆代码才能实现的效果，现在两行搞定。

#### （4）flex-wrap：是否换行

项目太多，一行装不下了，换不换？

```css
.container {
  flex-wrap: nowrap;      /* 不换行，挤一挤（默认） */
  /* flex-wrap: wrap; 换行 */
  /* flex-wrap: wrap-reverse; 反向换行 */
}
```

#### （5）align-content：多行对齐

如果换行了，有多行项目，行与行之间怎么对齐：

```css
.container {
  align-content: flex-start;   /* 顶部对齐 */
  /* align-content: center; 居中 */
  /* align-content: space-between; 两端对齐 */
  /* align-content: space-around; 每行间距相等 */
  /* align-content: stretch; 拉伸（默认） */
}
```

⚠️ 注意：只有一行的时候这个属性不生效。

### 5.4 项目属性

这些属性加在**子元素（项目）**上。

#### （1）flex-grow：放大比例

有剩余空间的时候，项目怎么放大：

```css
.item {
  flex-grow: 0;  /* 默认0，不放大 */
}

/* 第二个项目放大比例是2，其他是1，它会占更多空间 */
.item:nth-child(2) {
  flex-grow: 2;
}
```

#### （2）flex-shrink：缩小比例

空间不够的时候，项目怎么缩小：

```css
.item {
  flex-shrink: 1;  /* 默认1，等比例缩小 */
}

/* 第三个项目不缩小 */
.item:nth-child(3) {
  flex-shrink: 0;
}
```

#### （3）flex-basis：项目初始大小

项目在主轴上的初始大小，默认 `auto`（就是项目本身的大小）。

#### （4）flex：简写（推荐）

上面三个可以合并成一个 `flex` 属性：

```css
.item {
  flex: 1;  /* 等价于 flex-grow:1; flex-shrink:1; flex-basis:0%; */
}
```

最常用的就是 `flex: 1`，表示"占满剩余空间"。比如左边固定宽度，右边自适应：

```css
.container {
  display: flex;
}
.left {
  width: 200px;  /* 左边固定200px */
}
.right {
  flex: 1;       /* 右边占满剩下的 */
}
```

#### （5）align-self：单独对齐

某个项目想跟别人不一样，单独设置交叉轴对齐：

```css
/* 第二个项目单独底部对齐 */
.item:nth-child(2) {
  align-self: flex-end;
}
```

#### （6）order：排列顺序

数值越小越靠前，默认是0。可以用来改变项目的排列顺序，而不用改HTML结构：

```css
.item:nth-child(1) { order: 3; }
.item:nth-child(2) { order: 1; }  /* 这个会排到最前面 */
.item:nth-child(3) { order: 2; }
```

### 5.5 Flex常用布局速查

给你整理了几个最常用的布局，直接抄就行：

#### （1）水平垂直居中

```css
.parent {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

#### （2）左右布局（左固定右自适应）

```css
.parent {
  display: flex;
}
.left { width: 200px; }
.right { flex: 1; }
```

#### （3）圣杯布局（头、左右栏、脚）

```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
header, footer { height: 60px; }
main {
  flex: 1;
  display: flex;
}
.left, .right { width: 200px; }
.center { flex: 1; }
```

#### （4）导航栏（两端对齐）

```css
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

#### （5）卡片列表（自动换行）

```css
.card-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;  /* 卡片之间的间距 */
}
.card {
  width: calc((100% - 40px) / 3);  /* 一行3个，减去两个间距 */
}
```

---

## 六、实战项目：写一个好看的个人主页

学了这么多，咱们来动手做一个好看的个人主页，把上一篇的HTML页面"装修"一下。

### 6.1 设计思路

- 整体风格：简约、清爽、现代感
- 主色调：蓝色系（#409eff），干净专业
- 布局：顶部导航 + 主内容区 + 底部版权
- 卡片式设计，圆角+阴影，有层次感

### 6.2 分步实现

#### 第一步：样式重置和全局样式

```css
/* 样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 全局样式 */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #333;
  background-color: #f5f7fa;
  line-height: 1.6;
}

a {
  text-decoration: none;
  color: inherit;
}

ul {
  list-style: none;
}
```

#### 第二步：头部导航

```css
header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 20px;
  text-align: center;
}

header h1 {
  font-size: 32px;
  margin-bottom: 16px;
}

nav {
  margin-top: 20px;
}

nav a {
  margin: 0 15px;
  padding: 8px 16px;
  border-radius: 20px;
  transition: background-color 0.3s;
}

nav a:hover {
  background-color: rgba(255, 255, 255, 0.2);
}
```

#### 第三步：主内容区和卡片样式

```css
main {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
}

section {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

section h2 {
  font-size: 22px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #667eea;
  display: inline-block;
}
```

#### 第四步：关于我区域

```css
.about-content {
  display: flex;
  align-items: center;
  gap: 30px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.info p {
  margin: 8px 0;
}

.info strong {
  color: #667eea;
  margin-right: 8px;
}

.intro {
  margin-top: 20px;
  color: #666;
  line-height: 1.8;
}
```

#### 第五步：兴趣爱好列表

```css
.hobby-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hobby-list li {
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.hobby-list li:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
```

#### 第六步：技能表格

```css
.skill-table {
  width: 100%;
  border-collapse: collapse;
}

.skill-table th,
.skill-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.skill-table th {
  background-color: #f8f9fc;
  font-weight: 600;
  color: #667eea;
}

.skill-table tr:hover {
  background-color: #f8f9fc;
}

.stars {
  color: #ffc107;
}
```

#### 第七步：表单样式

```css
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-group {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-reset {
  background-color: #f5f7fa;
  color: #666;
}

.btn-reset:hover {
  background-color: #e4e7ed;
}
```

#### 第八步：页脚

```css
footer {
  text-align: center;
  padding: 30px 20px;
  color: #999;
  font-size: 14px;
}

footer a {
  color: #667eea;
  margin: 0 10px;
}

footer a:hover {
  text-decoration: underline;
}
```

### 6.3 完整代码

HTML部分在上一篇已经写过了，你只需要把上面的CSS保存为 `style.css`，然后在HTML里引入：

```html
<link rel="stylesheet" href="./style.css">
```

👉 **动手试试**：把HTML和CSS拼在一起，用浏览器打开看看效果。是不是比纯HTML好看多了？再试着改改颜色、字号、间距，调出你自己喜欢的风格。

---

## 七、新手必避的10个坑 ⚠️

CSS看起来简单，但坑真的不少。我把新手最容易踩的坑列出来，你们注意点：

### 坑1：样式写了不生效
**现象**：CSS写了，但是页面没变化
**原因**：可能是选择器写错了，或者类名拼错了，或者路径错了
**排查方法**：按F12打开开发者工具，看元素有没有应用上你的样式，有没有被划掉（被覆盖了）

### 坑2：margin塌陷（合并）
**现象**：两个垂直方向的margin碰在一起，只显示较大的那个
**原因**：CSS的规范，垂直方向相邻的块级元素margin会合并
**解决**：
- 给父元素加 `overflow: hidden`
- 用padding代替margin
- 只给一个元素加margin

### 坑3：margin-top传递
**现象**：子元素的margin-top跑到父元素外面去了
**原因**：父元素没有border或padding，子元素的margin就"透"出去了
**解决**：
- 给父元素加 `overflow: hidden`
- 给父元素加 `border-top: 1px solid transparent`
- 给父元素加 `padding-top` 代替子元素的margin-top

### 坑4：图片底部有空白缝隙
**现象**：img标签底部有一条莫名其妙的空隙
**原因**：图片是行内块元素，默认和文字基线对齐
**解决**：
- `img { display: block; }`
- `img { vertical-align: middle; }`

### 坑5：浮动导致父元素高度塌陷
**现象**：子元素浮动了，父元素高度变成0了
**原因**：浮动元素脱离了标准流，父元素撑不起来
**解决**：给父元素加 `overflow: hidden`，或者用伪元素清除浮动（ clearfix ）

### 坑6：inline-block元素之间有间隙
**现象**：两个行内块元素之间有一条小缝隙
**原因**：HTML代码里的换行和空格被解析成了一个空格
**解决**：
- 把HTML代码写在一行（不推荐，不好看）
- 给父元素加 `font-size: 0`，子元素再把字号设回来
- 用Flex布局（推荐）

### 坑7：z-index不生效
**现象**：设置了z-index，但是层级没变化
**原因**：z-index只在定位元素（position不是static）上生效
**解决**：给元素加 `position: relative`

### 坑8：文字超出不换行
**现象**：文字太长，超出盒子了
**原因**：英文长单词或数字默认不换行
**解决**：
```css
.box {
  word-break: break-all;  /* 允许单词内换行 */
  /* 或者 */
  white-space: nowrap;    /* 不换行 */
  overflow: hidden;
  text-overflow: ellipsis; /* 超出显示省略号 */
}
```

### 坑9：优先级搞不清
**现象**：样式被覆盖了，不知道为什么
**原因**：选择器优先级不够
**解决**：
- 按权重计算优先级
- 实在搞不定，加 `!important`（不推荐，少用）
- 用更具体的选择器

### 坑10：浏览器兼容性问题
**现象**：Chrome好好的，IE就乱了
**原因**：不同浏览器对CSS的支持不一样
**解决**：
- 现在基本不用管IE了，放心用新特性
- 不确定的属性去 caniuse.com 查一下
- 用Autoprefixer自动加前缀

---

## 八、总结与后续学习建议

### 8.1 本篇要点回顾

回顾一下这篇文章的核心内容：

1. **CSS是什么**：网页的化妆师，用来设置样式和布局
2. **三种引入方式**：行内、内部、外部（推荐外部样式表）
3. **选择器**：标签、类、id、后代、子、伪类等，优先级要搞清楚
4. **常用样式**：文字、背景、边框、圆角、阴影
5. **盒子模型**：content + padding + border + margin，推荐用 `box-sizing: border-box`
6. **Flex布局**：现代布局神器，justify-content（主轴）+ align-items（交叉轴）
7. **核心思想**：结构和样式分离，CSS只管长什么样

### 8.2 学习CSS的心得

CSS这东西，说难也难，说简单也简单。

**简单的地方**：语法简单，属性就那么多，记住就能用
**难的地方**：布局千变万化，各种坑防不胜防

我的建议是：
- **多动手**：光看不练假把式，每个属性都自己敲一遍
- **多仿写**：看到好看的网页，就试着自己写出来
- **多调试**：F12开发者工具是你最好的朋友，多看看元素的样式
- **多积累**：把常用的布局和效果整理成自己的代码库

CSS这门技术，经验很重要。踩的坑多了，自然就厉害了。

### 8.3 接下来学什么？

学完CSS，你的网页已经很好看了，但它还是"死"的，不能交互。接下来该学 **JavaScript** 了，给你的网页加上灵魂，让它动起来。

学习路径：
```
HTML → CSS → JavaScript → Vue/React → 全栈
```

### 8.4 学习资源推荐

- **MDN CSS文档**：最权威的CSS参考手册
- **CSS-Tricks**：各种CSS技巧和教程
- **Codepen**：看别人的酷炫效果，学习灵感来源
- **caniuse.com**：查浏览器兼容性

---

> 💬 **最后说两句**：
> 
> 恭喜你又看完了一篇9000字的长文！能坚持看到这里，说明你是真的想学好前端。
> 
> 我刚开始学CSS的时候，也觉得这玩意儿怎么这么多属性，记都记不住。但后来写得多了，慢慢就熟练了。真的，无他，唯手熟尔。
> 
> 现在就打开你的编辑器，给你上一篇写的个人介绍页加上CSS，看看它变漂亮的样子。有什么问题欢迎在评论区交流~
> 
> **万水千山总是情，点个👍行不行？** 你的点赞收藏是我更新的最大动力！

---

*相关推荐：《HTML零基础速成：3小时搞定网页骨架》《JavaScript零基础速成：从入门到写项目》*
