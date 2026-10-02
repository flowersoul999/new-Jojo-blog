---
title: "有了 Vue 基础，快速入门 React"
published: 2026-09-08
description: "已经会 Vue 了，再学 React 其实很快——本文用 Vue 做参照，把 React 核心概念一个个对应起来，看完就能上手写 React 项目。"
tags: ["Vue","React"]
category: "前端"
image: "/blogs/前端/vue-to-react-cover.jpg"
author: "jojo"
draft: false
comment: true
lang: "zh-CN"
aiPolished: false
---
# 有了 Vue 基础，快速入门 React

已经会 Vue 了，再学 React 其实很快——核心思想是一样的，只是写法不同。这篇文章用 Vue 做参照，把 React 的核心概念一个个对应起来，看完就能上手写 React 项目。

---

## 一、先搞清楚：Vue 和 React 有什么不一样

### 本质区别

| 对比项 | Vue | React |
|--------|-----|-------|
| 模板写法 | `<template>` 模板，HTML 风格 | JSX，直接在 JS 里写 HTML 结构 |
| 响应式 | 自动代理（Proxy/Object.defineProperty），改了就更新 | 手动调用 `setState`，改了要手动通知 |
| 组件写法 | Options API / Composition API | 函数组件 + Hooks |
| 核心 API | `ref`、`reactive`、`computed`、`watch` | `useState`、`useEffect`、`useMemo`、`useCallback` |
| 风格 | 模板、逻辑、样式分离（SFC） | 逻辑和结构写在一起（JSX） |

### 最直观的感受

Vue 像在写 HTML，在模板里用 `v-if`、`v-for` 这些指令。
React 像在写 JS，用 JS 的 `if`、`map` 直接生成结构。

**一句话总结**：Vue 是「在 HTML 里掺 JS」，React 是「在 JS 里掺 HTML」。

---

## 二、创建项目

### Vue

```bash
npm create vite@latest my-vue-app -- --template vue
```

### React

```bash
npm create vite@latest my-react-app -- --template react
```

Vite 官方都有模板，创建命令几乎一样，只是 `--template` 后面从 `vue` 改成 `react`。

### 项目结构对比

| Vue | React |
|-----|-------|
| `src/main.js` 入口 | `src/main.jsx` 入口 |
| `src/App.vue` 根组件 | `src/App.jsx` 根组件 |
| `.vue` 单文件组件 | `.jsx` 或 `.tsx` 组件文件 |
| `vite.config.js` | `vite.config.js` |

> **JSX 是什么？** JSX 是 JavaScript 的扩展，允许在 JS 代码里直接写 HTML 标签。`.jsx` 文件里的 HTML 标签最终会被编译成 JS 函数调用。

---

## 三、组件的写法

这是 Vue 和 React 最直观的区别。

### Vue（Composition API）

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">点击了 {{ count }} 次</button>
</template>

<style scoped>
button { color: red; }
</style>
```

### React

```jsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  function increment() {
    setCount(count + 1)
  }

  return (
    <button onClick={increment}>
      点击了 {count} 次
    </button>
  )
}

export default Counter
```

### 对比一下

| Vue | React | 说明 |
|-----|-------|------|
| `<script setup>` | 函数体 | 逻辑都写在这里 |
| `ref(0)` | `useState(0)` | 声明响应式数据 |
| `count.value++` | `setCount(count + 1)` | 修改数据 |
| `<template>` | `return (...)` | 组件的 HTML 结构 |
| `{{ count }}` | `{ count }` | 插值，都是大括号 |
| `@click` | `onClick` | 事件绑定 |
| `<style scoped>` | CSS Modules / 内联 / 全局 | 样式处理方式更多 |

**React 组件就是一个函数**，函数返回 JSX 就是组件的模板。每次状态变化，这个函数会重新执行一遍，返回新的 JSX，React 对比差异后更新 DOM。

---

## 四、模板语法对比

### 插值

```vue
<!-- Vue -->
<p>{{ message }}</p>
```

```jsx
{/* React */}
<p>{ message }</p>
```

都是大括号，Vue 是两对 `{{ }}`，React 是一对 `{ }`。

### 条件渲染

Vue 用指令：

```vue
<div v-if="isShow">显示我</div>
<div v-else>显示他</div>
```

React 直接用 JS 的三元表达式：

```jsx
{ isShow ? <div>显示我</div> : <div>显示他</div> }
```

如果只有 `if` 没有 `else`，用 `&&`：

```jsx
{ isShow && <div>显示我</div> }
```

**为什么 React 不做 `v-if` 这样的指令？** 因为 React 的哲学是「JS 已经有 if 了，为什么还要再造一个」。直接用 JS 原生语法，不用学框架特有的指令。

### 列表渲染

Vue 用 `v-for`：

```vue
<ul>
  <li v-for="item in list" :key="item.id">{{ item.name }}</li>
</ul>
```

React 用数组的 `map` 方法：

```jsx
<ul>
  { list.map(item => <li key={item.id}>{ item.name }</li>) }
</ul>
```

`map` 是 JS 数组原生方法，遍历数组生成新数组。React 拿到一个包含 JSX 元素的数组，就会全部渲染出来。

**`key` 的作用和 Vue 里一样**——给每个列表项一个唯一标识，Diff 算法能更快找到变化。

### 属性绑定

Vue 用 `v-bind:` 或 `:`：

```vue
<img :src="imgUrl" :alt="title">
```

React 直接用大括号：

```jsx
<img src={imgUrl} alt={title} />
```

React 里属性值写大括号就是 JS 表达式，不写就是普通字符串。和 Vue 的 `:` 是一个意思。

### class 和 style

Vue：

```vue
<div :class="{ active: isActive }" :style="{ color: textColor }">
```

React：

```jsx
<div className={isActive ? 'active' : ''} style={{ color: textColor }}>
```

注意两个坑：

1. **`class` 要写成 `className`** —— 因为 `class` 是 JS 的保留字
2. **`style` 是一个对象** —— 外层大括号是 JS 表达式，内层大括号是对象字面量

---

## 五、响应式数据

这是 Vue 和 React 最大的区别，也是最需要转变思维的地方。

### Vue 的响应式

```js
const count = ref(0)

// 直接改，自动更新视图
count.value++
```

Vue 用 Proxy 把数据代理了，你改 `count.value` 的时候，Vue 自动知道「数据变了，该更新视图了」。

### React 的响应式

```js
const [count, setCount] = useState(0)

// 不能直接改，必须调用 setCount
setCount(count + 1)
```

React 没有自动代理。你必须调用 `setCount` 这个函数，React 才知道「数据变了，重新渲染组件吧」。

**直接改会怎样？**

```js
const [count, setCount] = useState(0)

// ❌ 错的！视图不会更新
count = count + 1

// ✅ 对的
setCount(count + 1)
```

改了数据但没调用 setState，React 不知道数据变了，所以不会重新渲染。这是 Vue 转 React 最容易踩的第一个坑。

### 对象和数组怎么改

Vue：

```js
const user = reactive({ name: '张三', age: 20 })

// 直接改属性就行
user.age = 21
```

React：

```js
const [user, setUser] = useState({ name: '张三', age: 20 })

// ❌ 错的
user.age = 21

// ✅ 对的：创建一个新对象传进去
setUser({ ...user, age: 21 })
```

React 的 setState 是**替换**不是**修改**。你要给它一个全新的对象/数组，它才会更新。

**数组也是一样：**

```js
const [list, setList] = useState([1, 2, 3])

// 追加
setList([...list, 4])

// 删除第 i 个
setList(list.filter((_, index) => index !== i))

// 修改第 i 个
setList(list.map((item, index) => index === i ? item + 1 : item))
```

核心原则：**永远返回一个新的数组/对象，不要直接改原数据。** 这叫「不可变数据」（Immutable），是 React 的核心理念之一。

---

## 六、生命周期 vs useEffect

### Vue 的生命周期

```vue
<script setup>
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
</script>
```

### React 的 useEffect

```jsx
import { useEffect } from 'react'

function MyComponent() {
  // 相当于 onMounted + onUpdated
  useEffect(() => {
    console.log('组件挂载或更新了')
  })

  // 相当于 onMounted（只执行一次）
  useEffect(() => {
    console.log('组件挂载了')
  }, [])

  // 相当于 onUnmounted（清理函数）
  useEffect(() => {
    return () => {
      console.log('组件卸载了')
    }
  }, [])

  // 监听某个数据变化（类似 watch）
  useEffect(() => {
    console.log('count 变了：', count)
  }, [count])

  return <div>{count}</div>
}
```

### 对应关系表

| Vue | React | 说明 |
|-----|-------|------|
| `onMounted` | `useEffect(fn, [])` | 依赖数组为空，只执行一次 |
| `onUpdated` | `useEffect(fn)` | 不传依赖数组，每次渲染都执行 |
| `onUnmounted` | `useEffect(() => { return () => {} }, [])` | return 的函数是清理函数 |
| `watch(count, fn)` | `useEffect(fn, [count])` | 监听 count 变化 |

### 依赖数组是关键

useEffect 的第二个参数叫**依赖数组**：

| 写法 | 执行时机 |
|------|---------|
| `useEffect(fn)` | 每次渲染都执行 |
| `useEffect(fn, [])` | 只在挂载时执行一次 |
| `useEffect(fn, [a, b])` | 挂载时执行 + a 或 b 变化时执行 |

**为什么需要依赖数组？** 因为 React 组件每次更新都会重新执行整个函数，useEffect 也会重新跑。如果不加控制，可能会出现死循环或者重复请求。

> **一个经验法则**：useEffect 里用到了哪些 state/props，就把哪些放进依赖数组里。ESLint 插件会提醒你。

---

## 七、计算属性 vs useMemo

### Vue 的 computed

```vue
<script setup>
import { ref, computed } from 'vue'

const firstName = ref('张')
const lastName = ref('三')

const fullName = computed(() => {
  return firstName.value + lastName.value
})
</script>
```

### React 的 useMemo

```jsx
import { useState, useMemo } from 'react'

function Name() {
  const [firstName, setFirstName] = useState('张')
  const [lastName, setLastName] = useState('三')

  const fullName = useMemo(() => {
    return firstName + lastName
  }, [firstName, lastName])

  return <div>{fullName}</div>
}
```

### 区别

| Vue computed | React useMemo |
|-------------|---------------|
| 自动追踪依赖 | 手动写依赖数组 |
| 默认就有缓存 | 只有用 useMemo 才缓存 |
| 直接写就行 | 简单计算不用 useMemo，直接写在 JSX 里也行 |

**React 里什么时候用 useMemo？** 计算量很大的时候用，比如复杂的排序、过滤、大数据量处理。简单的字符串拼接、简单运算直接写就行，不用特意包一层 useMemo。

---

## 八、侦听器 vs useEffect

### Vue 的 watch

```vue
<script setup>
import { ref, watch } from 'vue'

const count = ref(0)

watch(count, (newVal, oldVal) => {
  console.log('count 变了', oldVal, '→', newVal)
})
</script>
```

### React 里用 useEffect 代替

```jsx
import { useState, useEffect } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('count 变了', count)
    // 注意：React 的 useEffect 拿不到 oldVal
    // 如果需要旧值，要用 useRef 自己存
  }, [count])

  return <div>{count}</div>
}
```

**区别**：Vue 的 watch 能拿到新旧两个值，React 的 useEffect 只能拿到新值。需要旧值的话得自己用 useRef 存上一次的值。

---

## 九、父子组件通信

### 父传子

**Vue：**

```vue
<!-- 父组件 -->
<Child :title="title" :count="count" />

<!-- 子组件 -->
<script setup>
const props = defineProps(['title', 'count'])
</script>
```

**React：**

```jsx
// 父组件
<Child title={title} count={count} />

// 子组件
function Child(props) {
  return <div>{props.title} {props.count}</div>
}

// 或者解构
function Child({ title, count }) {
  return <div>{title} {count}</div>
}
```

React 里 props 就是函数的第一个参数，直接从参数里拿。和 Vue 的 `defineProps` 是一个意思。

### 子传父

**Vue：**

```vue
<!-- 子组件 -->
<script setup>
const emit = defineEmits(['change'])
emit('change', 100)
</script>

<!-- 父组件 -->
<Child @change="handleChange" />
```

**React：**

```jsx
// 子组件
function Child({ onChange }) {
  return <button onClick={() => onChange(100)}>点击</button>
}

// 父组件
<Child onChange={handleChange} />
```

React 没有 `emit` 这种机制。**子传父的方式是：父组件把一个函数通过 props 传给子组件，子组件调用这个函数，把数据当参数传过去。**

说白了就是：
- Vue：子组件 `emit` 一个事件 → 父组件监听事件
- React：父组件传一个函数 → 子组件调用函数

形式不同，本质一样——都是子组件通知父组件「某事发生了，这是数据」。

---

## 十、事件处理

### 绑定事件

```vue
<!-- Vue -->
<button @click="handleClick">点击</button>
```

```jsx
{/* React */}
<button onClick={handleClick}>点击</button>
```

### 传参

```vue
<!-- Vue -->
<button @click="handleClick(id)">点击</button>
```

```jsx
{/* React */}
<button onClick={() => handleClick(id)}>点击</button>
```

React 里如果直接写 `onClick={handleClick(id)}`，函数会在渲染时就执行了，这不对。要包一层箭头函数。

### 事件对象

```vue
<!-- Vue -->
<button @click="handleClick">点击</button>
<script>function handleClick(e) { console.log(e.target) }</script>
```

```jsx
{/* React */}
<button onClick={handleClick}>点击</button>
<script>function handleClick(e) { console.log(e.target) }</script>
```

看起来一样，但有个区别：Vue 的事件对象是原生事件对象，React 的是**合成事件对象**（SyntheticEvent）。不过日常使用时区别不大，`e.target`、`e.preventDefault()` 这些都能用。

---

## 十一、双向绑定

### Vue 的 v-model

```vue
<input v-model="message" />
```

Vue 的 `v-model` 是语法糖，等价于 `:value="message"` + `@input="message = $event.target.value"`。

### React 里没有 v-model

React 没有双向绑定，要手动写：

```jsx
const [message, setMessage] = useState('')

<input
  value={message}
  onChange={e => setMessage(e.target.value)}
/>
```

**为什么 React 不做 v-model？** 因为 React 推崇「单向数据流」——数据从上往下传，事件从下往上传。v-model 虽然写着方便，但也隐藏了数据流向。React 选择让你显式地写出来，数据流更清晰。

> 当然，表单多了手动写也很烦。实际项目中一般用表单库（比如 React Hook Form、Formik）来处理，就像 Vue 项目用 VeeValidate 一样。

---

## 十二、ref 的用法

### Vue 的 ref

Vue 里 `ref` 有两个作用：
1. 声明响应式数据（`const count = ref(0)`）
2. 获取 DOM 元素或子组件实例（`<div ref="box">`）

### React 的 useRef

React 里 `useRef` 也有两个作用：

1. **获取 DOM 元素**

```jsx
import { useRef, useEffect } from 'react'

function MyComponent() {
  const inputRef = useRef(null)

  useEffect(() => {
    // 挂载后自动聚焦
    inputRef.current.focus()
  }, [])

  return <input ref={inputRef} />
}
```

和 Vue 的 `ref` 几乎一样，只是访问时用 `.current`。

2. **存一个不触发渲染的值**

```jsx
const timerRef = useRef(null)

// 存定时器
timerRef.current = setInterval(...)

// 清除定时器
clearInterval(timerRef.current)
```

useRef 的值改变了**不会触发组件重新渲染**。这和 Vue 的 ref 不一样——Vue 的 ref 改了会触发更新，React 的 useRef 改了不会。

**什么时候用 useRef 存值？** 存定时器 ID、DOM 引用、上一次的值这些「不需要渲染到页面上的数据」。

---

## 十三、插槽 vs children

### Vue 的插槽

```vue
<!-- 父组件 -->
<Card>
  <template #header>
    <h3>标题</h3>
  </template>
  <p>内容内容</p>
</Card>

<!-- 子组件 Card.vue -->
<div class="card">
  <div class="header">
    <slot name="header" />
  </div>
  <div class="body">
    <slot />
  </div>
</div>
```

### React 的 children

```jsx
// 父组件
<Card header={<h3>标题</h3>}>
  <p>内容内容</p>
</Card>

// 子组件 Card.jsx
function Card({ header, children }) {
  return (
    <div className="card">
      <div className="header">{header}</div>
      <div className="body">{children}</div>
    </div>
  )
}
```

**对应关系：**
- 默认插槽 → `children`（一个特殊的 prop）
- 具名插槽 → 传普通的 prop，值是 JSX

React 没有专门的插槽语法。因为 JSX 本身就是 JS，传 JSX 元素当 props 就够了，不需要额外的插槽机制。

---

## 十四、路由

### Vue Router

```js
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/user/:id', component: User },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})
```

```vue
<!-- 模板里 -->
<router-link to="/">首页</router-link>
<router-view />

<!-- 编程式导航 -->
<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

router.push('/about')
console.log(route.params.id)
</script>
```

### React Router

```jsx
// App.jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/about">关于</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/user/:id" element={<User />} />
      </Routes>
    </BrowserRouter>
  )
}
```

```jsx
// 编程式导航 + 获取参数
import { useNavigate, useParams } from 'react-router-dom'

function User() {
  const navigate = useNavigate()
  const params = useParams()

  function goHome() {
    navigate('/')
  }

  return <div>用户 ID：{params.id}</div>
}
```

### 对应关系

| Vue Router | React Router |
|-----------|-------------|
| `<router-link>` | `<Link>` |
| `<router-view>` | `<Routes>` + `<Route>` |
| `useRouter()` | `useNavigate()` |
| `useRoute()` | `useParams()` / `useLocation()` |
| `router.push('/a')` | `navigate('/a')` |

---

## 十五、状态管理

### Vue 用 Pinia

```js
// stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '张三',
    age: 20
  }),
  actions: {
    growUp() {
      this.age++
    }
  }
})
```

```vue
<script setup>
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()

console.log(userStore.name)
userStore.growUp()
</script>
```

### React 用什么？

React 生态里状态管理库比较多：

| 库 | 特点 | 类似 Vue 的 |
|----|------|-----------|
| **Zustand** | 轻量、简单，上手最快 | Pinia 的感觉 |
| **Redux Toolkit** | 官方推荐，生态完善，略复杂 | Vuex 的感觉 |
| **Jotai** | 原子化状态管理，小巧灵活 | — |
| Context API | React 内置，不用装库，但性能一般 | provide/inject |

**新手推荐 Zustand**，写法最接近 Pinia：

```js
// stores/user.js
import { create } from 'zustand'

export const useUserStore = create((set) => ({
  name: '张三',
  age: 20,
  growUp: () => set(state => ({ age: state.age + 1 }))
}))
```

```jsx
function UserInfo() {
  const { name, age, growUp } = useUserStore()

  return (
    <div>
      <p>{name}, {age}岁</p>
      <button onClick={growUp}>长大</button>
    </div>
  )
}
```

---

## 十六、一些容易踩的坑

### 1. 改了数据视图不更新

**原因**：直接改了 state，没有调用 setState。

```jsx
// ❌ 错
user.name = '李四'

// ✅ 对
setUser({ ...user, name: '李四' })
```

### 2. useState 的初始值只生效一次

```jsx
function Child({ initialCount }) {
  // initialCount 只在第一次渲染时用，后续 props 变化不会更新 count
  const [count, setCount] = useState(initialCount)
}
```

如果需要跟随 props 变化，用 useEffect 监听。

### 3. 循环里的事件绑定要包箭头函数

```jsx
// ❌ 错：渲染时就执行了
<button onClick={handleClick(id)}>

// ✅ 对
<button onClick={() => handleClick(id)}>
```

### 4. class 要写成 className

```jsx
// ❌ 错
<div class="box">

// ✅ 对
<div className="box">
```

### 5. 组件名必须大写开头

```jsx
// ❌ 错：React 会当成 HTML 标签
function counter() { return <div /> }

// ✅ 对：大写开头才是组件
function Counter() { return <div /> }
```

### 6. JSX 只能有一个根元素

```jsx
// ❌ 错
return (
  <div>1</div>
  <div>2</div>
)

// ✅ 对：包一个 Fragment
return (
  <>
    <div>1</div>
    <div>2</div>
  </>
)
```

`<>...</>` 是 `<React.Fragment>` 的简写，和 Vue 的 `<template>` 类似，不会生成真实 DOM 节点。

---

## 十七、学习路径建议

有 Vue 基础，学 React 其实是「换语法」的过程，核心概念（组件化、响应式、生命周期、虚拟 DOM）都是一样的。

**最快上手路线：**

1. **用 Vite 建个 React 项目**，跑起来看看目录结构
2. **学 useState** —— 对应 Vue 的 ref，改数据要调用 setXxx
3. **学 JSX 写法** —— 条件渲染用三元/&&、列表用 map、绑定用大括号
4. **学 useEffect** —— 对应 Vue 的 onMounted + watch
5. **学父子通信** —— props 传下去，回调函数传上来
6. **学 React Router** —— 对应 Vue Router，API 换个名字而已
7. **选一个状态管理库** —— 推荐 Zustand，最像 Pinia
8. **写个小项目练手** —— TodoList、商品列表、登录注册都可以

**一周左右就能上手干活了。** 前三天可能会觉得「好别扭，还是 Vue 写着顺手」，写一周就习惯了。两个框架都会了之后，你会发现其实核心思想是一样的，只是表达方式不同。

---

## 总结：一张对照表速查

| 概念 | Vue | React |
|------|-----|-------|
| 响应式数据 | `ref()` / `reactive()` | `useState()` |
| 修改数据 | 直接改 `.value` | 调用 `setXxx()` |
| 计算属性 | `computed()` | `useMemo()` |
| 侦听器 | `watch()` | `useEffect(..., [x])` |
| 挂载 | `onMounted` | `useEffect(fn, [])` |
| 卸载 | `onUnmounted` | `useEffect(() => () => {}, [])` |
| 模板 | `<template>` | `return (...)` |
| 插值 | `{{ msg }}` | `{ msg }` |
| 条件渲染 | `v-if` / `v-else` | 三元表达式 / `&&` |
| 列表渲染 | `v-for` | `array.map()` |
| 事件绑定 | `@click` | `onClick` |
| 属性绑定 | `:src` | `src={...}` |
| 双向绑定 | `v-model` | `value` + `onChange` 手动写 |
| 父传子 | `defineProps` | 函数参数 `props` |
| 子传父 | `defineEmits` + `emit` | 传回调函数，子组件调用 |
| 插槽 | `<slot>` | `children` prop |
| ref 拿 DOM | `ref="xxx"` + `xxx.value` | `useRef()` + `xxx.current` |
| 路由 | vue-router | react-router-dom |
| 状态管理 | Pinia | Zustand / Redux |
| 单文件组件 | `.vue` | `.jsx` / `.tsx` |
| 样式隔离 | `<style scoped>` | CSS Modules / CSS-in-JS |

把这张表存下来，写 React 的时候对照着看，很快就能上手。
