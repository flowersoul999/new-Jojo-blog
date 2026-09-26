---
title: "Vue3入门：Composition API写起来到底有多爽"
published: 2026-09-01
description: ""
tags: ["前端基础"]
category: "技术总结"
draft: false
lang: "zh-CN"
---

> 💡 **写在前面**：学完了HTML、CSS、JavaScript，又搞定了npm和Vite，是时候上框架了！Vue3是现在国内前端最主流的框架，简单、好上手、生态好，新手友好度拉满。这篇带你从零开始，从Options API到Composition API，从基础语法到实战项目，一篇搞定。全文约13000字，建议收藏后边敲边学！

---

## 📑 目录导航

- [一、Vue是什么？为什么前端都在用？](#一vue是什么为什么前端都在用)
  - [1.1 一句话理解Vue](#11-一句话理解vue)
  - [1.2 为什么要学Vue？](#12-为什么要学vue)
  - [1.3 Vue2 vs Vue3 选哪个？](#13-vue2-vs-vue3-选哪个)
  - [1.4 学习路线一览](#14-学习路线一览)
- [二、Vue核心概念：声明式编程和响应式](#二vue核心概念声明式编程和响应式)
  - [2.1 命令式 vs 声明式](#21-命令式-vs-声明式)
  - [2.2 什么是响应式？](#22-什么是响应式)
  - [2.3 MVVM模型](#23-mvvm模型)
- [三、模板语法：Vue的HTML怎么写](#三模板语法vue的html怎么写)
  - [3.1 插值表达式 {{ }}](#31-插值表达式-)
  - [3.2 v-bind：绑定属性](#32-v-bind绑定属性)
  - [3.3 v-on：绑定事件](#33-v-on绑定事件)
  - [3.4 v-model：双向绑定](#34-v-model双向绑定)
- [四、指令大全：Vue的特殊属性](#四指令大全vue的特殊属性)
  - [4.1 条件渲染：v-if / v-show](#41-条件渲染v-if--v-show)
  - [4.2 列表渲染：v-for](#42-列表渲染v-for)
  - [4.3 其他常用指令](#43-其他常用指令)
- [五、计算属性和侦听器](#五计算属性和侦听器)
  - [5.1 computed计算属性](#51-computed计算属性)
  - [5.2 watch侦听器](#52-watch侦听器)
  - [5.3 computed vs watch怎么选？](#53-computed-vs-watch怎么选)
- [六、组件化：Vue的灵魂](#六组件化vue的灵魂)
  - [6.1 什么是组件化？](#61-什么是组件化)
  - [6.2 单文件组件SFC](#62-单文件组件sfc)
  - [6.3 父传子：props](#63-父传子props)
  - [6.4 子传父：$emit](#64-子传父emit)
- [七、Composition API：Vue3的大招](#七composition-apivue3的大招)
  - [7.1 Options API的问题](#71-options-api的问题)
  - [7.2 setup函数](#72-setup函数)
  - [7.3 ref和reactive：响应式数据](#73-ref和reactive响应式数据)
  - [7.4 computed和watch](#74-computed和watch)
  - [7.5 生命周期钩子](#75-生命周期钩子)
  - [7.6 script setup：语法糖的终极形态](#76-script-setup语法糖的终极形态)
- [八、生命周期：Vue的"人生节点"](#八生命周期vue的人生节点)
  - [8.1 生命周期四个阶段](#81-生命周期四个阶段)
  - [8.2 常用钩子函数](#82-常用钩子函数)
- [九、实战项目：计数器 + TodoList升级版](#九实战项目计数器--todolist升级版)
  - [9.1 练习1：计数器](#91-练习1计数器)
  - [9.2 练习2：TodoList升级版](#92-练习2todolist升级版)
- [十、新手必避的10个坑 ⚠️](#十新手必避的10个坑-️)
- [十一、面试八股精选](#十一面试八股精选)
- [十二、总结与后续学习建议](#十二总结与后续学习建议)

---

## 一、Vue是什么？为什么前端都在用？

### 1.1 一句话理解Vue

**Vue就是一个用来快速搭建用户界面的JS框架，核心特点是"响应式"和"组件化"，写起来又简单又爽。**

Vue的全称是 **Vue.js**（读音类似"view"），是咱们中国人尤雨溪（Evan You）开发的。因为上手简单、文档友好，在国内特别火，现在已经是国内前端的"标配"技能了。

打个比方：
- 原生JS写页面 = 自己一块砖一块砖盖房子（累但自由）
- Vue写页面 = 用乐高积木拼房子（快、标准、好看）

Vue帮你把繁琐的DOM操作都封装好了，你只需要关心数据和逻辑，不用手动去getElementById、appendChild这些了。

### 1.2 为什么要学Vue？

学Vue的理由太多了，随便列几个：

| 理由 | 说明 |
|------|------|
| 🚀 **上手快** | 中文文档友好，API简单，一周就能上手写项目 |
| 📈 **需求量大** | 国内前端岗位80%以上要求会Vue |
| 🌱 **生态好** | 组件库、路由、状态管理，啥都有现成的 |
| 💼 **好就业** | 初中高级岗位都有，找工作容易 |
| 🔄 **渐进式** | 可以只用来做一个页面，也可以做完整的大项目 |

一句话：**想找前端工作，Vue是必须会的。**

### 1.3 Vue2 vs Vue3 选哪个？

现在是2024年了，直接学 **Vue3**，别纠结！

| 对比项 | Vue2 | Vue3 |
|--------|------|------|
| 发布时间 | 2016年 | 2020年 |
| 现状 | 停止维护了 | 主流版本，持续更新 |
| API风格 | Options API（选项式） | Composition API（组合式）+ Options API |
| 响应式原理 | Object.defineProperty | Proxy（性能更好） |
| TypeScript | 支持不好 | 原生支持，TS友好 |
| 体积 | 大一些 | Tree Shaking更好，更小 |
| 新特性 | - | Composition API、Teleport、Suspense、Fragments |

**结论**：直接学Vue3，而且重点学Composition API（组合式API），这是Vue3的核心，也是未来的方向。

💡 当然，有些老项目还在用Vue2，面试也可能问到。但你先把Vue3学透了，Vue2看一眼就会，原理都是通的。

### 1.4 学习路线一览

Vue内容不少，给你排个学习顺序：

```
基础篇（本篇）：
  ├─ 模板语法（插值、指令）
  ├─ 响应式原理
  ├─ 计算属性和侦听器
  ├─ 组件化基础
  ├─ Composition API
  └─ 生命周期

进阶篇（后面讲）：
  ├─ Vue Router（路由）
  ├─ Pinia（状态管理）
  ├─ 组件通信8种方式
  └─ 组合式函数hooks

实战篇：
  ├─ 后台管理系统
  ├─ 移动端H5
  └─ 全栈项目
```

---

## 二、Vue核心概念：声明式编程和响应式

### 2.1 命令式 vs 声明式

学Vue之前，先搞懂一个核心概念：**声明式编程**。

以前用原生JS写页面，是**命令式**的——你得告诉浏览器每一步该做什么：

```javascript
// 命令式：一步步命令浏览器做
const btn = document.getElementById('btn')
const countEl = document.getElementById('count')

let count = 0

btn.addEventListener('click', () => {
  count++
  countEl.textContent = count
})
```

而Vue是**声明式**的——你只需要告诉Vue"我想要什么效果"，它帮你搞定中间的步骤：

```vue
<template>
  <button @click="count++">
    点击了 {{ count }} 次
  </button>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>
```

看出区别了吗？
- **命令式**：关注过程，你得写清楚怎么操作DOM
- **声明式**：关注结果，你只需要描述"数据是什么"、"界面长什么样"，Vue帮你把数据和界面关联起来

这就是Vue的核心思想之一：**数据驱动视图**。数据变了，页面自动更新，不用你手动操作DOM。

### 2.2 什么是响应式？

Vue最厉害的地方就是**响应式**。

什么是响应式？**数据变了，页面自动跟着变**，就这么简单。

```
数据（data） → Vue自动监听 → 视图（DOM）自动更新
```

你只需要修改数据，剩下的事情Vue帮你做了。再也不用 `getElementById`、`textContent = xxx` 了。

打个比方：
- 原生JS = 你手动拉窗帘，拉一下动一下
- Vue响应式 = 智能窗帘，你说"打开"，它自己就打开了

Vue3的响应式是用 **Proxy** 实现的（Vue2用的是Object.defineProperty），性能更好，功能也更强。

🤖 **AI小助手**：响应式原理刚开始不好理解？可以这么问AI："用大白话解释一下Vue的响应式原理，最好打个比方"——AI能给你讲得明明白白，还能配个示意图。

### 2.3 MVVM模型

经常听到有人说MVVM，这是啥？

MVVM是一种架构模式，三个字母分别代表：
- **M** = Model（模型）：数据层，就是你的数据
- **V** = View（视图）：页面DOM
- **VM** = ViewModel（视图模型）：Vue的核心，连接Model和View

```
  Model（数据）
     ↑
     │ 双向绑定
     ↓
ViewModel（Vue实例）
     ↑
     │
     ↓
  View（DOM）
```

ViewModel就是Vue帮你做的事情——它监听数据变化，自动更新视图；它监听视图变化，自动更新数据（比如表单输入）。

你只需要关心Model（数据）和View（模板长啥样），中间的ViewModel（Vue）帮你搞定。这就是为什么Vue写起来这么爽——脏活累活它都干了。

---

## 三、模板语法：Vue的HTML怎么写

Vue的模板就是在HTML的基础上，加了一些特殊的语法（指令、插值等）。HTML你已经会了，Vue的模板学起来很快。

### 3.1 插值表达式 {{ }}

最基本的语法：用双大括号 `{{ }}` 把数据插到页面上。

```vue
<template>
  <h1>{{ message }}</h1>
  <p>数量：{{ count }}</p>
  <p>总价：{{ price * count }}</p>
  <p>{{ message.toUpperCase() }}</p>
</template>

<script setup>
import { ref } from 'vue'
const message = ref('Hello Vue!')
const count = ref(3)
const price = ref(10)
</script>
```

`{{ }}` 里面可以放任何JS表达式：变量、运算、函数调用、三元运算符都可以。

⚠️ 注意：只能放**表达式**，不能放语句（比如if、for这些）。

```vue
<!-- ✅ 可以：表达式 -->
{{ a + b }}
{{ ok ? 'YES' : 'NO' }}
{{ message.split('').reverse().join('') }}

<!-- ❌ 不行：语句 -->
{{ if (ok) { return message } }}
```

### 3.2 v-bind：绑定属性

`{{ }}` 是用在标签内容里的，那标签的属性（比如src、href、class）怎么绑定数据？用 `v-bind:`。

```vue
<template>
  <!-- 绑定src属性 -->
  <img v-bind:src="imgUrl" alt="图片">
  
  <!-- 绑定href属性 -->
  <a v-bind:href="linkUrl">跳转到百度</a>
  
  <!-- 绑定class -->
  <div v-bind:class="boxClass">我是一个div</div>
</template>

<script setup>
import { ref } from 'vue'
const imgUrl = ref('https://example.com/logo.png')
const linkUrl = ref('https://www.baidu.com')
const boxClass = ref('box active')
</script>
```

**简写方式**：`v-bind:` 可以简写成 `:`（一个冒号）

```vue
<!-- 完整写法 -->
<img v-bind:src="imgUrl">

<!-- 简写（推荐） -->
<img :src="imgUrl">
```

#### 动态绑定class

class的绑定有好几种玩法：

```vue
<template>
  <!-- 字符串方式 -->
  <div :class="classStr"></div>
  
  <!-- 对象方式：键是类名，值是布尔值，为true就加上这个类 -->
  <div :class="{ active: isActive, 'text-red': isRed }"></div>
  
  <!-- 数组方式：多个类名 -->
  <div :class="[classA, classB]"></div>
  
  <!-- 数组+对象混合 -->
  <div :class="[classA, { active: isActive }]"></div>
</template>
```

对象方式最常用：

```vue
<button :class="{ 'btn-primary': isPrimary }">按钮</button>
```

`isPrimary` 为true的时候，按钮就有 `btn-primary` 这个类。

#### 动态绑定style

style也能动态绑定，用对象方式：

```vue
<template>
  <div :style="{ color: textColor, fontSize: fontSize + 'px' }">
    我是动态样式的文字
  </div>
</template>

<script setup>
import { ref } from 'vue'
const textColor = ref('red')
const fontSize = ref(20)
</script>
```

⚠️ 注意：style里的属性名用小驼峰，比如 `fontSize`，不是 `font-size`。

### 3.3 v-on：绑定事件

给元素绑定事件用 `v-on:`。

```vue
<template>
  <button v-on:click="handleClick">点我</button>
</template>

<script setup>
const handleClick = () => {
  alert('被点了！')
}
</script>
```

**简写方式**：`v-on:` 可以简写成 `@`（艾特符号）

```vue
<!-- 完整写法 -->
<button v-on:click="handleClick">点我</button>

<!-- 简写（推荐） -->
<button @click="handleClick">点我</button>
```

#### 传参

事件处理函数可以传参数：

```vue
<template>
  <button @click="sayHi('小明')">跟小明打招呼</button>
  <button @click="sayHi('小红')">跟小红打招呼</button>
</template>

<script setup>
const sayHi = (name) => {
  alert(`你好，${name}！`)
}
</script>
```

#### 事件对象 $event

如果既要传参数，又要拿到事件对象，用 `$event`：

```vue
<template>
  <button @click="handleClick('小明', $event)">点我</button>
</template>

<script setup>
const handleClick = (name, e) => {
  console.log(name, e)
}
</script>
```

#### 事件修饰符

Vue给事件加了一些"修饰符"，让常用操作更简单：

| 修饰符 | 作用 |
|--------|------|
| `.prevent` | 阻止默认行为（比如表单提交、链接跳转） |
| `.stop` | 阻止事件冒泡 |
| `.once` | 只触发一次 |
| `.self` | 只有点自己才触发（子元素冒泡不触发） |
| `.capture` | 捕获阶段触发 |

```vue
<!-- 阻止表单默认提交行为 -->
<form @submit.prevent="handleSubmit"></form>

<!-- 阻止冒泡 -->
<div @click.stop="handleClick"></div>

<!-- 只触发一次 -->
<button @click.once="handleClick">只能点一次</button>
```

还有按键修饰符：

```vue
<!-- 按回车键触发 -->
<input @keyup.enter="handleSubmit">

<!-- 按ESC触发 -->
<input @keyup.esc="handleClose">
```

是不是很方便？不用自己写 `e.preventDefault()` 或者判断 `e.keyCode` 了。

### 3.4 v-model：双向绑定

这是Vue的"招牌菜"——**双向绑定**。

什么是双向？就是：
- 数据变了 → 视图自动更新（这个前面已经有了）
- 视图变了 → 数据自动更新（比如用户在输入框里打字，数据也跟着变）

表单元素用 `v-model` 最方便：

```vue
<template>
  <input v-model="message" type="text">
  <p>你输入的是：{{ message }}</p>
</template>

<script setup>
import { ref } from 'vue'
const message = ref('')
</script>
```

你在输入框里打字，下面的文字会实时更新——因为数据实时更新了。

💡 **原理**：v-model其实是个语法糖，相当于 `:value` + `@input` 的组合：

```vue
<!-- 这两行是等价的 -->
<input v-model="message">
<input :value="message" @input="message = $event.target.value">
```

v-model可以用在各种表单元素上：

```vue
<!-- 文本输入框 -->
<input v-model="text">

<!-- 多行文本 -->
<textarea v-model="text"></textarea>

<!-- 复选框（单个用布尔值，多个用数组） -->
<input type="checkbox" v-model="checked">
<input type="checkbox" v-model="hobbies" value="篮球">

<!-- 单选框 -->
<input type="radio" v-model="gender" value="男">男
<input type="radio" v-model="gender" value="女">女

<!-- 下拉选择 -->
<select v-model="city">
  <option value="beijing">北京</option>
  <option value="shanghai">上海</option>
</select>
```

---

## 四、指令大全：Vue的特殊属性

Vue里以 `v-` 开头的特殊属性叫**指令**，它们会给DOM元素添加特殊的行为。前面已经学了 `v-bind`、`v-on`、`v-model`，再来看几个常用的。

### 4.1 条件渲染：v-if / v-show

有时候需要根据条件决定显示不显示某个元素。

#### v-if

```vue
<template>
  <p v-if="isShow">我显示出来了</p>
  <p v-else>我显示出来了</p>
  
  <div v-if="score >= 90">优秀</div>
  <div v-else-if="score >= 60">及格</div>
  <div v-else>不及格</div>
</template>

<script setup>
import { ref } from 'vue'
const isShow = ref(true)
const score = ref(85)
</script>
```

`v-if` 是"真正"的条件渲染——条件为false的时候，DOM元素直接被删掉了，不存在了。

#### v-show

```vue
<template>
  <p v-show="isShow">我显示出来了</p>
</template>
```

`v-show` 就简单多了——条件为false的时候，只是加了个 `display: none` 隐藏了，DOM元素还在。

#### v-if vs v-show 怎么选？

| 对比项 | v-if | v-show |
|--------|------|--------|
| 渲染方式 | 真正的增删DOM | 只是切换display:none |
| 切换开销 | 高（每次切换都要增删DOM） | 低（只是改样式） |
| 初始开销 | 低（条件为假就不渲染） | 高（不管真假都渲染） |
| 适用场景 | 切换不频繁的 | 切换频繁的 |

👉 **经验之谈**：
- 切换频繁的用 `v-show`（比如弹窗、Tab切换）
- 切换不频繁、条件复杂的用 `v-if`
- 拿不准的先用 `v-if`

### 4.2 列表渲染：v-for

把数组渲染成列表，用 `v-for`。

```vue
<template>
  <ul>
    <li v-for="item in list" :key="item.id">
      {{ item.name }} - {{ item.age }}
    </li>
  </ul>
</template>

<script setup>
import { ref } from 'vue'
const list = ref([
  { id: 1, name: '小明', age: 18 },
  { id: 2, name: '小红', age: 20 },
  { id: 3, name: '小刚', age: 22 }
])
</script>
```

#### key属性很重要！

注意上面的 `:key="item.id"`——这个key是必须的，Vue需要用它来跟踪每个节点的身份。

key的要求：
- ✅ 唯一的（同列表中不能重复）
- ✅ 稳定的（不会变的）
- ✅ 最好是数字或字符串
- ❌ 不要用index（数组索引）当key（除非列表不会增删排序）

为什么不能用index当key？因为如果列表中间插入或删除一项，后面所有项的index都会变，key就失效了，会导致一些奇怪的bug。

👉 **最佳实践**：用数据的id当key，比如 `item.id`。

#### v-for的几种写法

```vue
<!-- 1. 遍历数组（最常用） -->
<li v-for="item in arr" :key="item.id">{{ item }}</li>

<!-- 2. 遍历数组，带索引 -->
<li v-for="(item, index) in arr" :key="index">{{ index }} - {{ item }}</li>

<!-- 3. 遍历对象 -->
<li v-for="(value, key) in obj" :key="key">{{ key }}: {{ value }}</li>

<!-- 4. 遍历数字 -->
<li v-for="n in 10" :key="n">第{{ n }}个</li>
```

#### v-for和v-if不要一起用

⚠️ **重要提醒**：不要在同一个元素上同时用 `v-for` 和 `v-if`！

为什么？因为 `v-for` 的优先级比 `v-if` 高，所以会先循环所有项，再逐个判断条件——哪怕大部分都被过滤掉了，也会先全部循环一遍，浪费性能。

正确的做法是用计算属性先过滤好，再循环：

```vue
<!-- ❌ 不推荐：v-for和v-if写在一起 -->
<li v-for="item in list" v-if="item.age > 18" :key="item.id">
  {{ item.name }}
</li>

<!-- ✅ 推荐：用计算属性先过滤 -->
<li v-for="item in adultList" :key="item.id">
  {{ item.name }}
</li>
```

### 4.3 其他常用指令

| 指令 | 作用 | 用法 |
|------|------|------|
| `v-text` | 设置文本内容 | `<p v-text="msg"></p>` 等价于 `<p>{{ msg }}</p>` |
| `v-html` | 设置HTML内容（会解析标签） | `<div v-html="htmlStr"></div>` |
| `v-pre` | 跳过编译，原样显示 | `<span v-pre>{{ 这不会被编译 }}</span>` |
| `v-once` | 只渲染一次，之后不再更新 | `<span v-once>{{ msg }}</span>` |
| `v-cloak` | 解决闪烁问题 | 配合CSS用，防止页面显示{{ }} |

⚠️ **注意**：`v-html` 要小心用，可能会有XSS安全风险，不要渲染用户输入的内容。

---

## 五、计算属性和侦听器

### 5.1 computed计算属性

有些数据是从其他数据"算"出来的，这时候用**计算属性**。

举个栗子：姓和名合起来显示全名

```vue
<template>
  <p>全名：{{ fullName }}</p>
</template>

<script setup>
import { ref, computed } from 'vue'

const firstName = ref('张')
const lastName = ref('三')

// 计算属性
const fullName = computed(() => {
  return firstName.value + lastName.value
})
</script>
```

为什么不直接在模板里写 `firstName + lastName`？
- 简单的还行，复杂的表达式写在模板里很乱
- 计算属性有**缓存**——依赖的数据不变，就不会重新计算

#### 计算属性的缓存特性

计算属性是**基于它的依赖缓存**的。只要依赖的数据没变，多次访问计算属性，它只会计算一次，直接返回缓存的结果。

而如果写在方法里，每次调用都会重新执行：

```javascript
// 计算属性：有缓存，依赖不变就不重新算
const fullName = computed(() => {
  console.log('计算了一次')
  return firstName.value + lastName.value
})

// 方法：每次调用都重新算
const getFullName = () => {
  console.log('执行了一次')
  return firstName.value + lastName.value
}
```

所以**计算属性适合做比较耗时的计算**，能省性能。

#### 可写的计算属性

计算属性默认是只读的。如果想写，可以提供getter和setter：

```javascript
const fullName = computed({
  get() {
    return firstName.value + lastName.value
  },
  set(newValue) {
    const names = newValue.split('')
    firstName.value = names[0]
    lastName.value = names[1]
  }
})
```

不过用得不多，了解一下就行。

### 5.2 watch侦听器

**侦听器**用来监听数据的变化，数据变了就执行一些操作。

```vue
<script setup>
import { ref, watch } from 'vue'

const count = ref(0)

// 监听count的变化
watch(count, (newVal, oldVal) => {
  console.log(`count从${oldVal}变成了${newVal}`)
})
</script>
```

什么时候用watch？
- 数据变化时要做异步操作（比如发请求）
- 数据变化时要做比较复杂的逻辑
- 需要知道变化前后的值

#### 监听对象

监听对象的话，默认是"浅监听"——对象的属性变了不会触发，要加 `deep: true`：

```javascript
const user = ref({ name: '小明', age: 18 })

// 深度监听
watch(user, (newVal) => {
  console.log('user变了', newVal)
}, { deep: true })
```

#### 监听对象的某个属性

也可以只监听对象的某个属性：

```javascript
// 监听user.name
watch(() => user.value.name, (newVal) => {
  console.log('name变了', newVal)
})
```

#### 立即执行

默认watch是数据变化了才执行，第一次不会执行。如果想一开始就执行一次，加 `immediate: true`：

```javascript
watch(count, (newVal) => {
  console.log('count是', newVal)
}, { immediate: true })
```

### 5.3 computed vs watch怎么选？

很多新手搞不清什么时候用computed，什么时候用watch。给你一个判断标准：

| 场景 | 用哪个 |
|------|--------|
| 一个数据由其他数据计算而来，模板里要用 | computed |
| 数据变了要做一些操作（发请求、操作DOM等） | watch |

**简单说：能算出来的就用computed，要"做事"的就用watch。**

90%的场景用computed就够了。watch不要滥用，很多时候用computed更优雅。

---

## 六、组件化：Vue的灵魂

### 6.1 什么是组件化？

**组件化就是把页面拆成一个个独立的、可复用的"零件"，需要的时候拼起来就行。**

比如一个页面，可以拆成：

```
        ┌──────────────┐
        │   Header     │ 头部组件
        ├──────┬───────┤
        │ Side │ Main  │ 侧边栏 + 主内容
        │      │       │
        ├──────┴───────┤
        │   Footer     │ 底部组件
        └──────────────┘
```

每个组件都是独立的，有自己的模板、样式、逻辑。

组件化的好处：
- ✅ **复用性**：写一次，到处用
- ✅ **可维护**：改一个组件，不影响其他的
- ✅ **好协作**：不同的人开发不同的组件
- ✅ **易理解**：每个组件功能单一，代码好读

### 6.2 单文件组件SFC

Vue的组件是 `.vue` 结尾的文件，叫**单文件组件**（Single File Component，简称SFC）。

一个Vue文件有三部分：

```vue
<template>
  <!-- 模板：HTML结构 -->
</template>

<script setup>
  // 逻辑：JS代码
</script>

<style scoped>
  /* 样式：CSS */
</style>
```

| 部分 | 作用 |
|------|------|
| `<template>` | 组件的HTML结构，跟普通HTML差不多，加了Vue的指令 |
| `<script>` | 组件的JS逻辑，数据、方法、生命周期都写在这里 |
| `<style>` | 组件的样式，加了 `scoped` 就是组件内生效，不会污染全局 |

💡 **scoped是个好东西**：加了scoped之后，这个组件里的样式只在这个组件里生效，不会跟其他组件的样式冲突。原理是给每个元素加了个唯一的data属性，CSS属性选择器匹配。

### 6.3 父传子：props

组件之间要通信。最常见的就是**父组件给子组件传数据**，用 `props`。

打个比方：爸爸给儿子零花钱，儿子只能花，不能改（单向数据流）。

#### 子组件：声明props

```vue
<!-- Child.vue 子组件 -->
<template>
  <div>
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
  </div>
</template>

<script setup>
// 声明props：我要接收什么数据
defineProps({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: '默认消息'
  },
  count: {
    type: Number,
    default: 0
  }
})
</script>
```

用 `defineProps` 来声明props，可以指定类型、是否必填、默认值等。

#### 父组件：传数据

```vue
<!-- Parent.vue 父组件 -->
<template>
  <Child title="我是标题" message="你好呀" :count="10" />
</template>

<script setup>
import Child from './Child.vue'
</script>
```

注意：
- 静态的字符串可以直接写：`title="我是标题"`
- 动态的（变量、数字、布尔值等）要用 `:` 绑定：`:count="10"`

#### 单向数据流

props是**单向数据流**——父组件的数据变了，子组件会自动更新，但子组件不能直接修改props。

为什么？因为如果子组件都能改父组件的数据，数据流就乱了，出了问题不知道是谁改的。

⚠️ **不要在子组件里直接修改props**，会报错的。

如果子组件想修改怎么办？两种方式：
1. 把props赋值给本地的ref，然后改这个ref
2. 触发事件告诉父组件，让父组件自己改（下一节讲）

### 6.4 子传父：$emit

子组件想给父组件发消息（或者让父组件改数据），用 **自定义事件**（`$emit`）。

打个比方：儿子想要买玩具，不能直接拿爸爸的钱，得跟爸爸说一声，爸爸同意了才能买。

#### 子组件：触发事件

```vue
<!-- Child.vue 子组件 -->
<template>
  <button @click="handleClick">点我告诉爸爸</button>
</template>

<script setup>
const emit = defineEmits(['sayHi', 'updateCount'])

const handleClick = () => {
  // 触发sayHi事件，传参'你好爸爸'
  emit('sayHi', '你好爸爸')
  
  // 也可以传多个参数
  emit('updateCount', 1, 2)
}
</script>
```

用 `defineEmits` 声明要触发哪些事件，然后调用 `emit('事件名', 参数...)` 触发。

#### 父组件：监听事件

```vue
<!-- Parent.vue 父组件 -->
<template>
  <Child @sayHi="handleSayHi" @updateCount="handleUpdate" />
</template>

<script setup>
import Child from './Child.vue'

const handleSayHi = (msg) => {
  console.log('收到子组件的消息：', msg)
}

const handleUpdate = (a, b) => {
  console.log(a, b)
}
</script>
```

就跟监听点击事件一样，用 `@事件名="处理函数"` 来监听。

💡 **经典模式**：父传子用props，子传父用emit。这是Vue组件通信最基本、最常用的方式，一定要掌握。

---

## 七、Composition API：Vue3的大招

### 7.1 Options API的问题

Vue2用的是 **Options API（选项式API）**，长这样：

```vue
<script>
export default {
  data() {
    return { count: 0, name: '小明' }
  },
  computed: {
    doubleCount() { return this.count * 2 }
  },
  methods: {
    increment() { this.count++ }
  },
  watch: {
    count() { /* ... */ }
  },
  mounted() { /* ... */ }
}
</script>
```

小项目还好，代码不多。但如果组件大了，一个功能的代码会散落在各个选项里——data里有、methods里有、watch里有、生命周期里也有。要改一个功能，得上下翻飞，找代码找得头大。

这就是Options API的问题：**同一个功能的代码被拆散了**。

### 7.2 setup函数

Vue3出了 **Composition API（组合式API）**，就是为了解决这个问题的——**让相关的代码待在一起**。

Composition API的入口就是 `setup` 函数：

```vue
<script>
import { ref } from 'vue'

export default {
  setup() {
    // 数据
    const count = ref(0)
    
    // 方法
    const increment = () => {
      count.value++
    }
    
    // 要暴露给模板用的，都得return出去
    return { count, increment }
  }
}
</script>
```

setup函数在组件创建之前执行，里面没有this。所有的数据、方法都定义在setup里，要在模板里用的就得return出去。

### 7.3 ref和reactive：响应式数据

在setup里定义响应式数据，得用 `ref` 或 `reactive`。

#### ref：基本类型用ref

```javascript
import { ref } from 'vue'

const count = ref(0)        // 数字
const message = ref('hello') // 字符串
const isShow = ref(true)    // 布尔值
```

ref创建的是一个**响应式的引用对象**（所以叫ref），要通过 `.value` 来访问值：

```javascript
console.log(count.value)  // 0
count.value++             // 修改
console.log(count.value)  // 1
```

⚠️ **注意**：
- 在JS里访问要加 `.value`
- 在模板里不用加，Vue自动帮你解包了：`{{ count }}` 直接写就行

#### reactive：对象类型用reactive

```javascript
import { reactive } from 'vue'

const user = reactive({
  name: '小明',
  age: 18
})
```

reactive用来定义对象类型的响应式数据。访问的时候不用 `.value`，直接访问属性就行：

```javascript
console.log(user.name)  // '小明'
user.name = '小红'      // 修改
```

#### ref vs reactive 怎么选？

| 对比项 | ref | reactive |
|--------|-----|----------|
| 适用类型 | 基本类型、对象都能⽤ | 只能用于对象/数组 |
| 访问方式 | JS里要.value | 直接访问属性 |
| 解构后 | 会失去响应式 | 会失去响应式 |
| 重新赋值 | 可以直接替换整个值 | 不能直接替换整个对象 |

👉 **个人习惯**：
- 简单值用 `ref`
- 复杂对象用 `reactive`
- 拿不准就用 `ref`，反正就是多写个 `.value` 而已

#### toRefs：解构reactive不丢失响应式

reactive的对象解构之后会失去响应式，用 `toRefs` 可以解决：

```javascript
import { reactive, toRefs } from 'vue'

const user = reactive({ name: '小明', age: 18 })

// 直接解构：name和age不是响应式的
// const { name, age } = user

// 用toRefs：解构出来的也是ref，响应式的
const { name, age } = toRefs(user)
```

### 7.4 computed和watch

Composition API里，computed和watch都是函数形式的：

#### computed

```javascript
import { ref, computed } from 'vue'

const firstName = ref('张')
const lastName = ref('三')

const fullName = computed(() => {
  return firstName.value + lastName.value
})
```

#### watch

```javascript
import { ref, watch } from 'vue'

const count = ref(0)

watch(count, (newVal, oldVal) => {
  console.log(`count从${oldVal}变成了${newVal}`)
})
```

跟Options API里的用法差不多，就是从选项变成了函数调用。

### 7.5 生命周期钩子

Composition API里，生命周期钩子前面加个 `on`：

```javascript
import { onMounted, onUpdated, onUnmounted } from 'vue'

onMounted(() => {
  console.log('组件挂载了')
})

onUpdated(() => {
  console.log('组件更新了')
})

onUnmounted(() => {
  console.log('组件卸载了')
})
```

对应关系：

| Options API | Composition API |
|-------------|-----------------|
| beforeCreate | -（setup本身就是） |
| created | -（setup本身就是） |
| beforeMount | onBeforeMount |
| mounted | onMounted |
| beforeUpdate | onBeforeUpdate |
| updated | onUpdated |
| beforeUnmount | onBeforeUnmount |
| unmounted | onUnmounted |

### 7.6 script setup：语法糖的终极形态

写setup函数还要return，有点麻烦。Vue3提供了一个更爽的语法糖——**`<script setup>`**。

在script标签上加个 `setup` 属性，里面的代码就直接在setup作用域里执行了，不用写setup函数，也不用return：

```vue
<script setup>
import { ref, computed } from 'vue'

// 直接定义，不用return，模板里就能用
const count = ref(0)
const doubleCount = computed(() => count.value * 2)

const increment = () => {
  count.value++
}
</script>

<template>
  <button @click="increment">
    {{ count }} x 2 = {{ doubleCount }}
  </button>
</template>
```

是不是清爽多了？
- 不用写 `export default { setup() { ... } }` 那一堆
- 不用手动return，定义了就能在模板里用
- 导入的组件也能直接用，不用注册

这是现在Vue3的**官方推荐写法**，也是最主流的写法。以后写Vue就用 `<script setup>`，写起来又快又爽。

💡 **defineProps和defineEmits**：在script setup里，props和emit用 `defineProps()` 和 `defineEmits()` 来声明，前面讲组件通信的时候已经见过了。它们是编译器宏，不用import，直接用就行。

---

## 八、生命周期：Vue的"人生节点"

### 8.1 生命周期四个阶段

每个Vue组件从创建到销毁，都会经历一系列过程，就像人的一生：出生 → 成长 → 死亡。

Vue把这些过程分成了四个大阶段：

| 阶段 | 说明 |
|------|------|
| **创建** | 组件实例被创建出来 |
| **挂载** | 组件渲染到页面上 |
| **更新** | 数据变化，页面重新渲染 |
| **卸载** | 组件被销毁，从页面移除 |

每个阶段前后都有对应的"钩子函数"——你可以在这些时机执行自己的代码。

### 8.2 常用钩子函数

挑几个最常用的说：

#### （1）onMounted：挂载完成

组件已经渲染到页面上了，DOM元素可以访问了。**最常用的钩子之一**。

```javascript
import { ref, onMounted } from 'vue'

const list = ref([])

onMounted(() => {
  // 组件挂载后，请求数据
  fetchList()
})

const fetchList = async () => {
  // 发请求获取数据...
}
```

什么时候用？
- 发送ajax请求数据
- 操作DOM
- 初始化第三方库（比如地图、图表）

#### （2）onUnmounted：卸载完成

组件要被销毁了，做一些清理工作。

```javascript
import { onUnmounted } from 'vue'

let timer = null

onMounted(() => {
  timer = setInterval(() => {
    console.log('定时器执行')
  }, 1000)
})

onUnmounted(() => {
  // 组件卸载时，清除定时器
  clearInterval(timer)
})
```

什么时候用？
- 清除定时器
- 取消事件监听
- 取消未完成的请求

#### （3）onUpdated：更新完成

数据变了，DOM更新完了触发。用得不多，因为大部分时候用计算属性和侦听器就能解决。

#### 生命周期流程图

给你画个简化版的流程：

```
    创建阶段
       ↓
  beforeCreate
       ↓
    created
       ↓
    挂载阶段
       ↓
  beforeMount
       ↓
    mounted  ←──────┐
       ↓            │
    更新阶段        │ 数据变化
       ↓            │
 beforeUpdate       │
       ↓            │
    updated  ───────┘
       ↓
    卸载阶段
       ↓
 beforeUnmount
       ↓
   unmounted
```

不用全背，记住 `onMounted` 和 `onUnmounted` 这两个最常用的就行，其他的需要的时候再查。

---

## 九、实战项目：计数器 + TodoList升级版

说了这么多，咱们来动手写两个小项目，练练手。

### 9.1 练习1：计数器

先整个简单的——计数器，巩固一下基础语法。

需求：
- 显示当前数字
- 点击+1按钮，数字加1
- 点击-1按钮，数字减1
- 显示数字的两倍（用computed）
- 重置按钮，归零

```vue
<!-- Counter.vue -->
<template>
  <div class="counter">
    <h2>计数器</h2>
    <div class="count">{{ count }}</div>
    <p>两倍：{{ doubleCount }}</p>
    <div class="btns">
      <button @click="decrement">- 1</button>
      <button @click="reset">重置</button>
      <button @click="increment">+ 1</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const count = ref(0)

const doubleCount = computed(() => count.value * 2)

const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}

const reset = () => {
  count.value = 0
}
</script>

<style scoped>
.counter {
  text-align: center;
  padding: 30px;
}
.count {
  font-size: 48px;
  font-weight: bold;
  color: #409eff;
  margin: 20px 0;
}
.btns {
  display: flex;
  justify-content: center;
  gap: 10px;
}
button {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  background: #409eff;
  color: white;
  cursor: pointer;
}
button:hover {
  background: #66b1ff;
}
</style>
```

👉 **动手试试**：把这个组件放到你的Vue项目里，跑起来看看效果。再加点功能，比如"加10"按钮、"乘2"按钮。

### 9.2 练习2：TodoList升级版

用Vue重写一下之前的TodoList，感受一下Vue比原生JS香多少。

```vue
<!-- TodoList.vue -->
<template>
  <div class="todo-container">
    <h1>📝 Vue版 Todo List</h1>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <input 
        v-model="inputValue" 
        @keyup.enter="addTodo"
        type="text" 
        placeholder="输入待办，按回车添加"
      >
      <button @click="addTodo">添加</button>
    </div>
    
    <!-- 列表 -->
    <ul class="todo-list" v-if="todos.length">
      <li 
        v-for="todo in todos" 
        :key="todo.id"
        :class="{ done: todo.done }"
      >
        <input type="checkbox" v-model="todo.done">
        <span class="todo-text">{{ todo.text }}</span>
        <button class="delete-btn" @click="deleteTodo(todo.id)">删除</button>
      </li>
    </ul>
    
    <p class="empty-tip" v-else>暂无待办，添加一个吧~</p>
    
    <!-- 底部统计 -->
    <div class="todo-footer">
      <span>共 {{ todos.length }} 条，已完成 {{ doneCount }} 条</span>
      <button class="clear-btn" @click="clearDone">清除已完成</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 待办列表
const todos = ref([
  { id: 1, text: '学习Vue3', done: true },
  { id: 2, text: '学习Composition API', done: false },
  { id: 3, text: '写个TodoList项目', done: false }
])

// 输入框的值
const inputValue = ref('')

// 已完成数量（计算属性）
const doneCount = computed(() => {
  return todos.value.filter(t => t.done).length
})

// 添加待办
const addTodo = () => {
  const text = inputValue.value.trim()
  if (!text) {
    alert('请输入内容！')
    return
  }
  
  todos.value.push({
    id: Date.now(),
    text,
    done: false
  })
  
  inputValue.value = ''
}

// 删除待办
const deleteTodo = (id) => {
  todos.value = todos.value.filter(t => t.id !== id)
}

// 清除已完成
const clearDone = () => {
  todos.value = todos.value.filter(t => !t.done)
}
</script>

<style scoped>
.todo-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 30px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 24px;
}

.input-area {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

input[type="text"] {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

input[type="text"]:focus {
  outline: none;
  border-color: #409eff;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #409eff;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #66b1ff;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin-bottom: 20px;
}

.todo-list li {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.todo-list li:hover {
  background-color: #f9f9f9;
}

.todo-list li.done .todo-text {
  text-decoration: line-through;
  color: #999;
}

.todo-text {
  flex: 1;
  margin: 0 12px;
  font-size: 14px;
}

.delete-btn {
  padding: 4px 12px;
  background: #f56c6c;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.todo-list li:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #f78989;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 14px;
}

.todo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  font-size: 13px;
  color: #999;
}

.clear-btn {
  padding: 6px 12px;
  background: #f5f5f5;
  color: #666;
  font-size: 12px;
}

.clear-btn:hover {
  background: #e8e8e8;
}
</style>
```

对比一下原生JS版本的TodoList，你会发现Vue版本的代码：
- 更少（不用手动操作DOM）
- 更清晰（数据和视图的关系一目了然）
- 更好维护（改数据就行，不用管DOM怎么更）

这就是框架的价值——把你从繁琐的DOM操作中解放出来，专注于业务逻辑。

🤖 **AI小助手**：学Vue的时候，遇到不知道怎么实现的功能，直接跟AI说："用Vue3 Composition API实现一个xxx功能，要求xxx"——AI会给你生成完整的代码，你再研究学习。但是！一定要自己理解，不能光复制粘贴。

---

## 十、新手必避的10个坑 ⚠️

### 坑1：v-for和v-if写在一起
**现象**：列表渲染有问题，或者性能差
**原因**：v-for优先级比v-if高，会先循环再判断，浪费性能
**解决**：用计算属性先过滤好数据，再循环

### 坑2：v-for没写key或者key用index
**现象**：列表增删排序的时候出bug，或者表单内容错位
**原因**：key是Vue跟踪元素身份的标识，用index的话元素变了key没变
**解决**：用唯一且稳定的id当key，比如item.id

### 坑3：直接修改props
**现象**：控制台警告，或者父组件数据被意外修改
**原因**：Vue是单向数据流，子组件不能直接修改props
**解决**：需要修改的话，emit事件告诉父组件，让父组件改

### 坑4：ref忘记加.value
**现象**：数据改了页面不更新，或者报错
**原因**：ref创建的是引用对象，JS里访问值要加.value
**解决**：在script里用 `.value`，模板里不用加（自动解包）

### 坑5：v-model不生效
**现象**：输入框的值和数据不同步
**原因**：很多种可能，比如绑错了变量、变量不是响应式的
**解决**：检查v-model绑定的是不是ref/reactive的数据，变量名有没有拼错

### 坑6：样式不生效（scoped坑）
**现象**：写了样式，但页面没效果
**原因**：加了scoped，样式只作用于当前组件，但你想改子组件的深层样式
**解决**：用 `:deep(.类名)` 来穿透scoped，或者写全局样式

### 坑7：直接替换reactive对象
**现象**：数据改了，页面不更新
**原因**：reactive对象不能直接整个替换，替换了就不是响应式的了
**解决**：用ref定义对象（可以整个替换），或者用Object.assign修改属性

### 坑8：组件名大小写问题
**现象**：组件引入了但不生效，或者报错找不到
**原因**：文件名大小写和引入的不一致（Windows不区分，Linux区分，部署后可能出问题）
**解决**：组件名用大驼峰（PascalCase），引入和使用保持一致

### 坑9：生命周期里拿不到DOM
**现象**：在created/onMounted里获取DOM元素，拿到的是null
**原因**：created的时候DOM还没渲染；或者元素被v-if隐藏了
**解决**：DOM操作放在onMounted里，并且确保元素已经渲染出来了

### 坑10：watch监听对象不触发
**现象**：修改了对象的属性，watch没反应
**原因**：默认是浅监听，对象内部属性变化不会触发
**解决**：加 `deep: true` 开启深度监听，或者直接监听对象的某个属性

---

## 十一、面试八股精选

Vue相关的面试题特别多，挑几个基础高频的：

### 1. Vue2和Vue3的区别？
**参考答案**：
- 响应式原理：Vue2用Object.defineProperty，Vue3用Proxy（性能更好，支持数组和对象新增属性）
- API风格：Vue2是Options API，Vue3支持Composition API（更好的逻辑复用和组织）
- 生命周期：Vue3的钩子前面加on，比如onMounted
- 组件：Vue3支持Fragments（多根节点）、Teleport、Suspense
- TypeScript：Vue3对TS支持更好
- 性能：Vue3体积更小、速度更快、内存占用更少

### 2. 响应式原理（Vue3）？
**参考答案**：
- Vue3使用Proxy代理对象来实现响应式
- 当读取属性时，通过getter收集依赖（track）
- 当修改属性时，通过setter触发更新（trigger）
- 相比Vue2的Object.defineProperty，Proxy可以监听对象新增/删除属性、数组下标变化、length变化等
- ref是用class实现的，通过getter/setter拦截value的访问

### 3. computed和watch的区别？
**参考答案**：
- computed是计算属性，watch是侦听器
- computed有缓存，依赖不变不会重新计算；watch没有缓存，数据变了就执行
- computed主要用来派生数据，模板里要用；watch主要用来监听数据变化执行副作用（发请求、操作DOM等）
- computed默认是只读的，也可以设置setter；watch可以获取新旧值

### 4. v-if和v-show的区别？
**参考答案**：
- v-if是真正的条件渲染，条件为假时DOM元素不存在
- v-show只是切换display:none，DOM元素始终存在
- v-if切换开销大，初始渲染开销小；v-show相反
- 切换频繁用v-show，切换不频繁用v-if

### 5. 为什么v-for要加key？
**参考答案**：
- key是Vue的虚拟DOM算法中用来识别节点身份的标识
- 有了key，Vue在更新列表时能更准确地找到哪些节点变了，减少DOM操作，提升性能
- 不用key或者用index当key，在列表增删排序时可能会出现bug（比如表单内容错位、状态错乱）
- key应该是唯一且稳定的，最好用数据的id

### 6. 组件通信的方式有哪些？
**参考答案**：
- 父传子：props
- 子传父：$emit / defineEmits
- 兄弟组件：通过父组件中转，或者事件总线/Pinia
- 祖孙组件：provide/inject
- 全局状态：Pinia / Vuex
- 父调子方法：ref + defineExpose
- 透传：attrs / $attrs

---

## 十二、总结与后续学习建议

### 12.1 本篇要点回顾

回顾一下这篇的核心内容：

**基础概念：**
1. **声明式编程**：只描述结果，不关心过程
2. **响应式**：数据变了，视图自动更新
3. **组件化**：把页面拆成一个个可复用的组件

**模板语法：**
4. **插值 {{ }}**：把数据插到页面上
5. **v-bind（:）**：绑定属性
6. **v-on（@）**：绑定事件
7. **v-model**：双向绑定（表单用）
8. **v-if / v-show**：条件渲染
9. **v-for**：列表渲染（记得加key！）

**核心API：**
10. **computed**：计算属性，有缓存
11. **watch**：侦听器，数据变了做事
12. **ref / reactive**：响应式数据
13. **生命周期**：onMounted、onUnmounted等

**组件化：**
14. **单文件组件SFC**：template + script + style
15. **父传子**：props（单向数据流）
16. **子传父**：emit事件
17. **Composition API**：setup + script setup，Vue3的核心

### 12.2 学习心得

Vue是一个对新手非常友好的框架——API设计得很直观，文档也写得特别好。

给新手的建议：
1. **多动手**：别光看，跟着敲，写着写着就懂了
2. **从小项目开始**：先写计数器、TodoList，再写复杂的
3. **官方文档是最好的教程**：遇到问题先查文档
4. **理解原理但不要死钻牛角尖**：先用起来，原理慢慢理解

学完这一篇，你已经可以写一些简单的Vue项目了。但这只是Vue的冰山一角，还有很多东西要学。

🤖 **AI时代怎么学Vue**：
- 不用死记硬背所有API，忘了就查，或者问AI
- 写不出来的时候，让AI先给你一版，你再改，边改边学
- 但是！基础概念一定要理解，不然AI写的代码你都看不懂
- 可以让AI给你出练习题，然后帮你review代码

### 12.3 接下来学什么？

Vue3入门之后，接下来的学习路径：

```
Vue3基础 → Vue Router路由 → Pinia状态管理 → 组件库（Element Plus）→ 组件通信 → 实战项目
```

后面还有几篇等着呢：
- Vue Router：前端路由，多页面应用
- Pinia：状态管理，全局数据共享
- Element Plus：组件库，CV工程师的快乐
- 组件通信：8种方式全家桶

一篇一篇来，别急。

### 12.4 学习资源推荐

- **Vue3官方文档**：最好的Vue教程，没有之一，中文翻译也很棒
- **Vue Router文档**：路由官方文档
- **Pinia文档**：状态管理官方文档
- **VueUse**：非常好用的组合式函数库，强烈推荐
- **GitHub Awesome Vue**：Vue资源大全

---

> 💬 **最后说两句**：
> 
> 恭喜你看完了这篇13000字的Vue3入门教程！坚持看到这里的你，已经超过了很多人。
> 
> 我第一次接触Vue的时候，最大的感受就是"原来写前端可以这么爽"——不用再写一堆getElementById、不用手动操作DOM、数据改了页面自动更。那种感觉，就像从自行车换上了汽车。
> 
> 当然，Vue的东西远不止这些。这篇只是带你入门，让你知道Vue大概是怎么回事。真正要熟练，还得多写项目，在实战中成长。
> 
> 现在就去动手写一个Vue版的TodoList吧！写完你就会明白——框架，真的能让人幸福。
> 
> **万水千山总是情，点个👍行不行？** 你的点赞收藏是我更新的最大动力！

---

*相关推荐：《Vite神速构建：5分钟搭出企业级前端项目》《npm包管理：前端的"外卖平台"》《JS进化史：ES6+语法糖一把梭》*
