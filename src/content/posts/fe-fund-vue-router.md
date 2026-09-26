---
title: "️ Vue Router完全指南：前端路由原来是这么回事儿"
published: 2026-09-02
description: ""
tags: ["前端基础"]
category: "技术总结"
draft: false
lang: "zh-CN"
---

> 💡 **写在前面**：单页面应用（SPA）是现在前端的主流，而路由就是SPA的"导航系统"——点一下菜单，页面内容变了，但浏览器不刷新，体验丝滑得很。Vue Router就是Vue官方的路由管理器，是Vue全家桶的核心成员之一。这篇带你从零搞懂路由，从基础用法到导航守卫，一篇搞定。全文约9000字，建议收藏后边敲边学！

---

## 📑 目录导航

- [一、前端路由是什么？为什么需要它？](#一前端路由是什么为什么需要它)
  - [1.1 一句话理解路由](#11-一句话理解路由)
  - [1.2 多页面 vs 单页面](#12-多页面-vs-单页面)
  - [1.3 路由的两种模式](#13-路由的两种模式)
- [二、快速上手：5分钟搭出多页面应用](#二快速上手5分钟搭出多页面应用)
  - [2.1 安装和配置](#21-安装和配置)
  - [2.2 基本使用步骤](#22-基本使用步骤)
  - [2.3 项目结构一览](#23-项目结构一览)
- [三、路由配置详解](#三路由配置详解)
  - [3.1 动态路由](#31-动态路由)
  - [3.2 嵌套路由（子路由）](#32-嵌套路由子路由)
  - [3.3 命名路由](#33-命名路由)
  - [3.4 路由重定向和别名](#34-路由重定向和别名)
- [四、路由跳转的三种方式](#四路由跳转的三种方式)
  - [4.1 router-link声明式跳转](#41-router-link声明式跳转)
  - [4.2 编程式导航](#42-编程式导航)
  - [4.3 怎么选？](#43-怎么选)
- [五、路由传参：页面之间怎么传数据](#五路由传参页面之间怎么传数据)
  - [5.1 params传参](#51-params传参)
  - [5.2 query传参](#52-query传参)
  - [5.3 params vs query怎么选？](#53-params-vs-query怎么选)
- [六、导航守卫：路由的"安检员"](#六导航守卫路由的安检员)
  - [6.1 什么是导航守卫？](#61-什么是导航守卫)
  - [6.2 全局前置守卫](#62-全局前置守卫)
  - [6.3 全局后置钩子](#63-全局后置钩子)
  - [6.4 路由独享守卫](#64-路由独享守卫)
  - [6.5 组件内守卫](#65-组件内守卫)
  - [6.6 完整的导航解析流程](#66-完整的导航解析流程)
- [七、其他好用的功能](#七其他好用的功能)
  - [7.1 路由懒加载](#71-路由懒加载)
  - [7.2 滚动行为](#72-滚动行为)
  - [7.3 过渡动效](#73-过渡动效)
- [八、实战项目：后台管理系统路由](#八实战项目后台管理系统路由)
  - [8.1 需求分析](#81-需求分析)
  - [8.2 路由设计](#82-路由设计)
  - [8.3 导航守卫实现权限控制](#83-导航守卫实现权限控制)
  - [8.4 完整代码](#84-完整代码)
- [九、新手必避的10个坑 ⚠️](#九新手必避的10个坑-️)
- [十、面试八股精选](#十面试八股精选)
- [十一、总结与后续学习建议](#十一总结与后续学习建议)

---

## 一、前端路由是什么？为什么需要它？

### 1.1 一句话理解路由

**路由就是"URL和页面内容的映射关系"——访问不同的URL，显示不同的页面内容，但浏览器不刷新。**

打个比方：
- 路由就像**大楼里的电梯**，你按几楼，它就把你送到几楼
- URL就是你按的楼层号
- 页面内容就是那一层楼的东西
- 整个过程你不用出大楼（浏览器不刷新）

以前的网站，你点个链接，浏览器要重新加载一整个页面，白屏一下，体验不好。有了前端路由之后，页面切换是在本地完成的，不刷新浏览器，体验就像原生App一样丝滑。

### 1.2 多页面 vs 单页面

#### 传统多页面应用（MPA）

```
首页 index.html
  ↓ 点击链接，浏览器刷新
关于 about.html
  ↓ 点击链接，浏览器刷新
详情 detail.html
```

- 每个页面对应一个HTML文件
- 跳转时整页刷新，白屏一下
- 首屏快，SEO好
- 体验一般，页面之间难以共享状态

#### 单页面应用（SPA）

```
    入口 index.html（只有一个HTML）
    ┌──────────────────────┐
    │   /home  →  首页组件  │
    │   /about →  关于组件  │  路由切换，组件替换
    │   /detail → 详情组件 │  浏览器不刷新
    └──────────────────────┘
```

- 只有一个HTML文件
- 页面切换通过JS动态替换内容，不刷新
- 首屏稍慢（要加载JS），但切换体验好
- 状态可以全局共享

现在的中大型前端项目基本都是SPA，而路由就是SPA的核心基础设施。

### 1.3 路由的两种模式

Vue Router有两种模式：**hash模式**和**history模式**。

| 对比项 | hash模式 | history模式 |
|--------|----------|-------------|
| URL样子 | `http://xxx.com/#/home`（带个#号） | `http://xxx.com/home`（正常路径） |
| 原理 | 监听 `hashchange` 事件 | 利用H5的 `history.pushState` API |
| 刷新页面 | 没问题，#后面的不会发给服务器 | 会404，需要后端配合配置 |
| 颜值 | 丑（有个#号） | 好看，跟正常URL一样 |
| 兼容性 | 好（老浏览器也支持） | 稍差（IE10+） |

#### hash模式

URL里有个 `#` 号，比如 `http://example.com/#/home`。`#` 后面的内容就是hash值。

特点：
- hash值的变化**不会触发页面刷新**（服务器根本收不到hash部分）
- 浏览器有 `hashchange` 事件，可以监听hash的变化
- 兼容性好，老浏览器也能用

就是URL里多了个 `#`，不太好看。

#### history模式

URL是正常的路径，比如 `http://example.com/home`，跟多页面的URL看起来一样。

特点：
- 利用HTML5的 `history.pushState` 和 `replaceState` API
- URL好看，没有#号
- 但是刷新页面的时候，浏览器会把整个URL发给服务器，服务器如果没有配置对应的路由，就会404
- 需要后端配合（Nginx配置或者后端框架配置）

👉 **怎么选**：
- 项目简单、不想麻烦后端 → 用hash模式
- 项目正式、追求URL美观 → 用history模式（让后端配合配置）

Vue Router 4.x默认是history模式（createWebHistory）。

---

## 二、快速上手：5分钟搭出多页面应用

### 2.1 安装和配置

用Vite创建Vue项目的时候，可以直接选带Router的模板：

```bash
npm create vite@latest my-vue-router-app -- --template vue
cd my-vue-router-app
npm install vue-router@4
```

或者手动安装：

```bash
npm i vue-router@4
```

注意：Vue3对应的是Vue Router 4.x，Vue2对应的是3.x，别装错版本了。

### 2.2 基本使用步骤

总共5步，非常简单：

#### 第一步：创建页面组件

在 `src/views/` 下创建两个页面组件：

```vue
<!-- src/views/Home.vue -->
<template>
  <div>
    <h1>🏠 首页</h1>
    <p>欢迎来到首页！</p>
  </div>
</template>
```

```vue
<!-- src/views/About.vue -->
<template>
  <div>
    <h1>📖 关于我们</h1>
    <p>这是关于页面</p>
  </div>
</template>
```

#### 第二步：配置路由表

新建 `src/router/index.js`：

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'

// 路由配置：路径和组件的对应关系
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),  // history模式
  routes                        // 路由配置
})

export default router
```

#### 第三步：在main.js中挂载路由

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'  // 引入

const app = createApp(App)
app.use(router)  // 使用路由
app.mount('#app')
```

#### 第四步：路由出口（RouterView）

在 `App.vue` 里放一个 `<RouterView>`，路由匹配到的组件会渲染在这里：

```vue
<template>
  <div id="app">
    <!-- 导航栏 -->
    <nav>
      <RouterLink to="/">首页</RouterLink>
      <RouterLink to="/about">关于</RouterLink>
    </nav>
    
    <!-- 路由出口：匹配到的组件渲染在这里 -->
    <RouterView />
  </div>
</template>

<style>
nav {
  padding: 20px;
  background: #f5f5f5;
  margin-bottom: 20px;
}
nav a {
  margin-right: 20px;
  text-decoration: none;
  color: #333;
}
nav a.router-link-active {
  color: #409eff;
  font-weight: bold;
}
</style>
```

#### 第五步：启动项目

```bash
npm run dev
```

打开浏览器，点导航栏的链接，你会发现：
- URL变了
- 页面内容变了
- 但是浏览器没有刷新！

恭喜你，第一个多页面SPA应用就搞定了！

### 2.3 项目结构一览

```
src/
  ├─ views/            # 页面组件（放页面级别的组件）
  │   ├─ Home.vue
  │   └─ About.vue
  ├─ components/       # 公共组件（放可复用的小组件）
  ├─ router/
  │   └─ index.js      # 路由配置
  ├─ App.vue
  └─ main.js
```

💡 **小知识**：
- `views/`（或者叫 `pages/`）放页面级别的大组件，跟路由一一对应
- `components/` 放可复用的小组件，比如按钮、卡片、弹窗等
- 两者都是.vue文件，只是职责不同

---

## 三、路由配置详解

### 3.1 动态路由

有些页面的路径不是固定的，比如用户详情页，每个用户的id不一样——`/user/1`、`/user/2`、`/user/3`。这时候就需要**动态路由**。

#### 配置动态路由

用冒号 `:` 来定义动态参数：

```javascript
const routes = [
  {
    path: '/user/:id',  // :id 就是动态参数
    name: 'User',
    component: () => import('@/views/User.vue')
  }
]
```

这样，`/user/1`、`/user/2`、`/user/abc` 都会匹配到这个路由。

#### 在组件中获取参数

用 `useRoute` 来获取当前路由信息：

```vue
<!-- User.vue -->
<template>
  <div>
    <h1>用户详情页</h1>
    <p>用户ID：{{ route.params.id }}</p>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
// route.params.id 就是动态参数的值
</script>
```

`useRoute()` 返回当前的路由对象，里面有：
- `route.params`：动态参数（params传参）
- `route.query`：查询参数（?后面的）
- `route.path`：路径
- `route.name`：路由名
- `route.meta`：路由元信息

#### 多个动态参数

可以有多个动态参数：

```javascript
{
  path: '/user/:userId/post/:postId',
  component: PostDetail
}
```

访问 `/user/1/post/100`，则：
- `route.params.userId` = '1'
- `route.params.postId'` = '100'

#### 监听路由参数变化

同一个组件，参数变了的时候，组件会被复用（不会销毁重建），所以created/mounted不会再执行。

如果需要监听参数变化，可以用watch：

```javascript
import { useRoute } from 'vue-router'
import { watch } from 'vue'

const route = useRoute()

watch(() => route.params.id, (newId) => {
  console.log('用户ID变了：', newId)
  // 重新请求数据...
})
```

### 3.2 嵌套路由（子路由）

实际项目中，页面经常是嵌套的结构——比如有个公共的布局（头部+侧边栏+主内容区），中间的主内容区根据路由切换。

这就是**嵌套路由**（也叫子路由）。

```
┌─────────────────────────────┐
│         Header              │
├──────┬──────────────────────┤
│      │                      │
│ Side │   RouterView         │ ← 子路由渲染在这里
│  bar │                      │
│      │                      │
└──────┴──────────────────────┘
```

#### 配置嵌套路由

用 `children` 配置子路由：

```javascript
const routes = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',            // 空字符串，默认子路由
        name: 'Home',
        component: () => import('@/views/Home.vue')
      },
      {
        path: 'about',       // 注意：子路由的path前面不要加/
        name: 'About',
        component: () => import('@/views/About.vue')
      }
    ]
  }
]
```

⚠️ **注意**：
- 子路由的 `path` 前面不要加 `/`，加了就变成根路径了
- 空字符串的子路由是默认子路由，访问父路径时显示

#### 布局组件

```vue
<!-- layouts/DefaultLayout.vue -->
<template>
  <div class="layout">
    <header>Header</header>
    <div class="main">
      <aside>Sidebar</aside>
      <div class="content">
        <!-- 子路由渲染在这里 -->
        <RouterView />
      </div>
    </div>
  </div>
</template>
```

嵌套路由可以多层嵌套，只要每层都有自己的 `RouterView` 就行。

### 3.3 命名路由

每个路由可以起个名字（`name` 属性），跳转的时候用名字跳转，不用写完整的路径。

```javascript
const routes = [
  {
    path: '/user/:id',
    name: 'User',  // 路由名
    component: User
  }
]
```

跳转的时候用名字：

```vue
<!-- 声明式 -->
<RouterLink :to="{ name: 'User', params: { id: 1 } }">
  用户1
</RouterLink>
```

```javascript
// 编程式
router.push({ name: 'User', params: { id: 1 } })
```

用名字的好处：
- 不用写长长的路径
- 以后路径改了，只要名字不变，代码不用改

### 3.4 路由重定向和别名

#### 重定向 redirect

访问A路径，自动跳转到B路径。

```javascript
{
  path: '/',
  redirect: '/home'  // 访问/自动跳转到/home
}
```

也可以用命名路由：

```javascript
{
  path: '/',
  redirect: { name: 'Home' }
}
```

甚至可以是函数，动态决定重定向到哪：

```javascript
{
  path: '/',
  redirect: to => {
    // 根据逻辑返回不同的路径
    return isLogin ? '/home' : '/login'
  }
}
```

#### 别名 alias

给路由起个别名，访问别名路径也能匹配到同一个组件。

```javascript
{
  path: '/home',
  component: Home,
  alias: '/'  // 访问/也显示Home组件
}
```

和重定向的区别：
- **重定向**：URL会变（从/变成/home）
- **别名**：URL不变，还是/，但显示的是Home组件

---

## 四、路由跳转的三种方式

### 4.1 router-link声明式跳转

在模板里用 `<RouterLink>` 组件跳转，相当于 `<a>` 标签。

#### 基本用法

```vue
<!-- 字符串路径 -->
<RouterLink to="/home">首页</RouterLink>

<!-- 对象写法（命名路由） -->
<RouterLink :to="{ name: 'Home' }">首页</RouterLink>

<!-- 带参数 -->
<RouterLink :to="{ name: 'User', params: { id: 1 } }">
  用户1
</RouterLink>

<!-- 带query -->
<RouterLink :to="{ path: '/search', query: { keyword: 'vue' } }">
  搜索
</RouterLink>
```

#### 激活状态的类名

当前路由对应的RouterLink会自动加上两个class：
- `router-link-active`：模糊匹配（包含关系）
- `router-link-exact-active`：精确匹配

可以用这两个class来设置激活状态的样式：

```css
.router-link-active {
  color: #409eff;
  font-weight: bold;
}
```

#### 常用属性

| 属性 | 作用 |
|------|------|
| `to` | 跳转目标（必填） |
| `replace` | 替换当前历史记录（不能后退） |
| `active-class` | 自定义激活时的class名 |
| `exact-active-class` | 自定义精确激活的class名 |
| `tag` | 渲染成什么标签（默认a标签） |

### 4.2 编程式导航

在JS代码里跳转，用 `useRouter`：

```javascript
import { useRouter } from 'vue-router'

const router = useRouter()
```

#### 常用方法

| 方法 | 作用 | 类比 |
|------|------|------|
| `router.push()` | 跳转到新页面（新增一条历史记录） | 点击链接 |
| `router.replace()` | 替换当前页面（不新增历史记录） | 重定向 |
| `router.go(n)` | 前进/后退n步 | 浏览器的前进后退按钮 |
| `router.back()` | 后退一步 | 浏览器后退 |
| `router.forward()` | 前进一步 | 浏览器前进 |

#### push跳转

```javascript
// 字符串路径
router.push('/home')

// 对象写法
router.push({ path: '/home' })

// 命名路由 + params
router.push({ name: 'User', params: { id: 1 } })

// path + query
router.push({ path: '/search', query: { keyword: 'vue' } })
```

⚠️ **注意**：如果用了 `path`，`params` 会被忽略！要传params就用 `name`：

```javascript
// ✅ 正确：name + params
router.push({ name: 'User', params: { id: 1 } })

// ❌ 错误：path + params（params会被忽略）
router.push({ path: '/user/1', params: { id: 1 } })
```

#### replace跳转

跟push一样，区别是不会新增历史记录，而是替换当前的记录（点后退不会回到这个页面）：

```javascript
router.replace('/home')
```

#### go/back/forward

```javascript
router.go(1)    // 前进一步
router.go(-1)   // 后退一步
router.go(2)    // 前进两步

router.back()   // 后退（等价于go(-1)）
router.forward() // 前进（等价于go(1)）
```

### 4.3 怎么选？

- **模板里的跳转** → 用 `<RouterLink>`
- **JS逻辑里的跳转**（比如登录成功后跳转、提交表单后跳转）→ 用 `router.push()`

---

## 五、路由传参：页面之间怎么传数据

两个页面之间传数据，常用两种方式：`params` 和 `query`。

### 5.1 params传参

params就是路径里的动态参数，比如 `/user/1` 里的 `1`。

#### 配置

```javascript
{
  path: '/user/:id',
  name: 'User',
  component: User
}
```

#### 跳转

```javascript
// 方式1：直接写在路径里
router.push('/user/1')

// 方式2：命名路由 + params（推荐）
router.push({ name: 'User', params: { id: 1 } })
```

#### 接收

```javascript
import { useRoute } from 'vue-router'

const route = useRoute()
console.log(route.params.id)  // '1'
```

特点：
- 参数在URL路径里，刷新页面不会丢
- URL比较干净：`/user/1`
- 需要在路由配置里声明

### 5.2 query传参

query就是URL后面 `?` 后面的参数，比如 `/search?keyword=vue&page=1`。

#### 不用配置

query不用在路由里配置，直接用就行。

#### 跳转

```javascript
// 方式1：直接写路径
router.push('/search?keyword=vue&page=1')

// 方式2：对象写法 + query
router.push({ 
  path: '/search', 
  query: { keyword: 'vue', page: 1 } 
})
```

#### 接收

```javascript
import { useRoute } from 'vue-router'

const route = useRoute()
console.log(route.query.keyword)  // 'vue'
console.log(route.query.page)     // '1'
```

特点：
- 参数在URL的?后面，刷新页面不会丢
- URL长这样：`/search?keyword=vue`
- 不用在路由配置里声明，比较灵活

### 5.3 params vs query怎么选？

| 对比项 | params | query |
|--------|--------|-------|
| URL样子 | `/user/1` | `/user?id=1` |
| 是否需要配置 | 需要（在path里声明:id） | 不需要 |
| 刷新是否丢失 | 不丢 | 不丢 |
| 适用场景 | 必要的、核心的参数（如ID） | 可选的、附加的参数（如搜索关键词、分页） |

👉 **经验之谈**：
- 资源的标识（如ID）用params（比如用户ID、文章ID）
- 筛选条件、分页参数等用query（比如搜索关键词、页码、排序）

💡 **其他传参方式**：
- 简单的数据可以通过路由传
- 复杂的、大量的数据，用Pinia等状态管理
- 或者存在localStorage/sessionStorage里

---

## 六、导航守卫：路由的"安检员"

### 6.1 什么是导航守卫？

导航守卫就是**路由跳转过程中的"钩子"**——你可以在跳转前、跳转后做一些事情。

打个比方：导航守卫就像地铁的安检，你要进站（跳转路由），得过安检（守卫检查），没问题才能进去。

最常见的应用场景：**登录权限控制**——没登录的用户访问需要登录的页面，直接跳转到登录页。

Vue Router的守卫有三种级别：
1. **全局守卫**：所有路由跳转都会触发
2. **路由独享守卫**：只在特定路由上触发
3. **组件内守卫**：在组件内部触发

### 6.2 全局前置守卫

最常用的守卫，所有路由跳转前都会触发。

```javascript
// router/index.js
const router = createRouter({...})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // to：要去的路由对象
  // from：从哪来的路由对象
  // next：函数，决定要不要放行
  
  console.log('从', from.path, '到', to.path)
  
  // 必须调用next()才能继续跳转！
  next()
})
```

三个参数：
- `to`：目标路由对象（要去哪）
- `from`：当前路由对象（从哪来）
- `next`：一个函数，**必须调用**，用来控制跳转行为

#### next的几种用法

| 写法 | 作用 |
|------|------|
| `next()` | 放行，正常跳转 |
| `next(false)` | 取消跳转，停在当前页面 |
| `next('/login')` | 跳转到别的路径 |
| `next({ name: 'Login' })` | 跳转到命名路由 |

#### 经典案例：登录权限控制

```javascript
router.beforeEach((to, from, next) => {
  // 从localStorage获取token
  const token = localStorage.getItem('token')
  
  // 如果目标路由需要登录，并且没登录
  if (to.meta.requiresAuth && !token) {
    // 跳转到登录页，带上redirect参数，登录成功后可以跳回来
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()  // 放行
  }
})
```

然后在路由配置里，给需要登录的路由加个 `meta.requiresAuth`：

```javascript
{
  path: '/profile',
  component: Profile,
  meta: {
    requiresAuth: true  // 需要登录才能访问
  }
}
```

`meta` 就是**路由元信息**，可以自定义一些属性，在守卫里读取判断。

### 6.3 全局后置钩子

跳转完成之后触发，没有 `next` 参数，也不能改变跳转：

```javascript
router.afterEach((to, from) => {
  // 跳转完成后做的事情
  console.log('已经跳转到：', to.path)
  
  // 常见用法：修改页面title
  document.title = to.meta.title || '我的网站'
  
  // 页面滚动到顶部
  window.scrollTo(0, 0)
})
```

常用场景：
- 修改页面title
- 埋点统计（PV统计）
- 页面滚动到顶部
- 关闭加载动画

### 6.4 路由独享守卫

只在某个特定路由上生效，写在路由配置里：

```javascript
{
  path: '/admin',
  component: Admin,
  beforeEnter: (to, from, next) => {
    // 只有管理员才能进
    const isAdmin = localStorage.getItem('isAdmin')
    if (isAdmin) {
      next()
    } else {
      next('/403')
    }
  }
}
```

参数和用法跟全局前置守卫一样，只是只针对这个路由。

### 6.5 组件内守卫

在组件内部的守卫，有三个：

```vue
<script setup>
import { onBeforeRouteEnter, onBeforeRouteUpdate, onBeforeRouteLeave } from 'vue-router'

// 进入组件前
onBeforeRouteEnter((to, from, next) => {
  // 注意：这里组件还没创建，访问不到this
  next()
})

// 路由参数变化时（同一个组件，参数变了）
onBeforeRouteUpdate((to, from, next) => {
  // 组件已经存在了，可以访问this
  console.log('路由更新了')
  next()
})

// 离开组件前
onBeforeRouteLeave((to, from, next) => {
  // 比如：表单没保存，提示用户确认离开
  if (hasUnsavedChanges) {
    const ok = confirm('有未保存的内容，确定要离开吗？')
    next(ok)
  } else {
    next()
  }
})
</script>
```

最常用的是 `onBeforeRouteLeave`——比如用户编辑表单没保存就想走，弹个确认框。

### 6.6 完整的导航解析流程

一次完整的路由跳转，会经过这些步骤：

1. 导航被触发
2. 在失活的组件里调用离开守卫 `beforeRouteLeave`
3. 调用全局前置守卫 `beforeEach`
4. 在重用的组件里调用更新守卫 `beforeRouteUpdate`
5. 调用路由独享守卫 `beforeEnter`
6. 解析异步路由组件
7. 在被激活的组件里调用进入守卫 `beforeRouteEnter`
8. 调用全局解析守卫 `beforeResolve`
9. 导航被确认
10. 调用全局后置钩子 `afterEach`
11. 触发DOM更新
12. 调用 `beforeRouteEnter` 传给 `next` 的回调

不用全背，知道个大概顺序就行。

---

## 七、其他好用的功能

### 7.1 路由懒加载

项目大了之后，如果所有页面都打包到一个JS文件里，首屏加载会很慢。

**路由懒加载**就是：访问哪个页面，才加载哪个页面的JS文件。首屏只加载首屏需要的代码，速度快很多。

写法超简单，用动态import就行：

```javascript
// 普通写法（打包在一起）
import Home from '@/views/Home.vue'

// 懒加载写法（分开打包）
const Home = () => import('@/views/Home.vue')

const routes = [
  {
    path: '/',
    component: Home  // 直接用
  },
  {
    path: '/about',
    component: () => import('@/views/About.vue')  // 也可以直接写
  }
]
```

就这么简单，`() => import('xxx')` 就是懒加载。

💡 **原理**：利用ES Module的动态import，Vite/Webpack会自动做代码分割（code splitting），每个路由一个JS文件，按需加载。

### 7.2 滚动行为

路由切换的时候，可以控制页面滚动的位置。比如跳转到新页面后滚动到顶部，或者后退时回到之前的位置。

```javascript
const router = createRouter({
  history: createWebHistory(),
  routes,
  // 滚动行为
  scrollBehavior(to, from, savedPosition) {
    // savedPosition：浏览器后退/前进时保存的位置
    if (savedPosition) {
      return savedPosition  // 有保存的位置就回到保存的位置
    } else {
      return { top: 0 }  // 否则滚动到顶部
    }
  }
})
```

还可以滚动到锚点：

```javascript
scrollBehavior(to) {
  if (to.hash) {
    return {
      el: to.hash,
      behavior: 'smooth'  // 平滑滚动
    }
  }
  return { top: 0 }
}
```

### 7.3 过渡动效

路由切换的时候加个过渡动画，体验更好。

用Vue的 `<Transition>` 组件包裹 `<RouterView>`：

```vue
<template>
  <RouterView v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

这样路由切换的时候就有淡入淡出的效果了，体验一下就上去了。

---

## 八、实战项目：后台管理系统路由

学了这么多，咱们来做一个经典的实战——后台管理系统的路由设计。这个搞懂了，大部分项目的路由都难不住你。

### 8.1 需求分析

我们要做的后台管理系统有这些页面：

```
登录页 /login
  ↓ 登录后
首页 /dashboard
用户管理
  ├─ 用户列表 /user/list
  └─ 用户详情 /user/:id
文章管理
  ├─ 文章列表 /article/list
  └─ 文章编辑 /article/edit/:id
设置 /settings
404页面
```

还要有：
- 布局组件（左侧菜单 + 顶部 + 主内容区）
- 登录权限控制（没登录不能进后台）
- 路由懒加载
- 动态面包屑

### 8.2 路由设计

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  // 登录页
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  
  // 后台布局（嵌套路由）
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      // 首页
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页', requiresAuth: true }
      },
      // 用户管理
      {
        path: 'user',
        redirect: '/user/list',
        meta: { title: '用户管理', requiresAuth: true },
        children: [
          {
            path: 'list',
            name: 'UserList',
            component: () => import('@/views/user/UserList.vue'),
            meta: { title: '用户列表', requiresAuth: true }
          },
          {
            path: 'detail/:id',
            name: 'UserDetail',
            component: () => import('@/views/user/UserDetail.vue'),
            meta: { title: '用户详情', requiresAuth: true }
          }
        ]
      },
      // 文章管理
      {
        path: 'article',
        redirect: '/article/list',
        meta: { title: '文章管理', requiresAuth: true },
        children: [
          {
            path: 'list',
            name: 'ArticleList',
            component: () => import('@/views/article/ArticleList.vue'),
            meta: { title: '文章列表', requiresAuth: true }
          },
          {
            path: 'edit/:id?',
            name: 'ArticleEdit',
            component: () => import('@/views/article/ArticleEdit.vue'),
            meta: { title: '文章编辑', requiresAuth: true }
          }
        ]
      },
      // 设置
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '设置', requiresAuth: true }
      }
    ]
  },
  
  // 404页面（放最后！）
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
```

### 8.3 导航守卫实现权限控制

```javascript
// 全局前置守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 修改页面title
  document.title = to.meta.title ? `${to.meta.title} - 后台管理系统` : '后台管理系统'
  
  // 如果路由需要登录
  if (to.meta.requiresAuth) {
    // 检查是否登录
    if (userStore.token) {
      next()  // 已登录，放行
    } else {
      // 未登录，跳转到登录页，带上redirect参数
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    // 不需要登录的页面，直接放行
    // 但如果已经登录了还访问登录页，跳首页
    if (to.name === 'Login' && userStore.token) {
      next({ name: 'Dashboard' })
    } else {
      next()
    }
  }
})
```

### 8.4 完整代码

布局组件、菜单组件、面包屑组件这些代码量比较大，这里就不全部贴了。核心的路由配置和守卫就是上面那些。

👉 **动手试试**：
1. 创建一个Vue项目，按照上面的路由配置写一遍
2. 把每个页面组件创建出来（哪怕只有一个标题）
3. 测试登录权限控制：没登录访问后台页面试试
4. 加个左侧菜单，用RouterLink做跳转
5. 加个面包屑组件，根据路由动态显示

做完这个，Vue Router你就基本掌握了。

🤖 **AI小助手**：写路由配置和权限控制的时候，可以让AI帮你生成模板。比如："帮我写一个Vue Router 4的后台管理系统路由配置，要求：嵌套布局、登录权限控制、路由懒加载、404页面"——AI生成的代码改一改就能用，省不少时间。

---

## 九、新手必避的10个坑 ⚠️

### 坑1：路由路径写错
**现象**：页面空白，路由不匹配
**原因**：path写错了，或者嵌套路由加了多余的/
**解决**：子路由path前面不要加/，加了就变成根路径了

### 坑2：params传参刷新丢失
**现象**：用params传参，刷新页面数据没了
**原因**：用了path + params（params被忽略了），或者没在路由配置里声明动态参数
**解决**：params要在path里声明（:id），跳转用name + params

### 坑3：嵌套路由不显示
**现象**：子路由匹配到了，但页面不显示
**原因**：父组件里没有加 `<RouterView />`
**解决**：父组件（布局组件）里必须有 `<RouterView />`，子路由的组件才会渲染出来

### 坑4：路由懒加载不生效
**现象**：打包后还是一个大JS文件
**原因**：写法不对，或者全部用普通import了
**解决**：用 `() => import('xxx')` 的写法，确保路由组件都是动态导入的

### 坑5：404路由放错位置
**现象**：所有页面都跳到404了
**原因**：404路由（/:pathMatch(.*)*）放得太靠前了
**解决**：404路由一定要放在路由数组的最后面，路由匹配是按顺序的

### 坑6：next()没调用
**现象**：路由卡住了，点了没反应
**原因**：导航守卫里忘了调用next()
**解决**：每个分支都要调用next()，不然导航一直挂起

### 坑7：history模式刷新404
**现象**：history模式下，刷新页面就404
**原因**：服务器没有配置，刷新时浏览器把完整URL发给服务器，服务器找不到对应文件
**解决**：后端/Nginx配置，把所有请求都指回index.html，让前端路由接管

### 坑8：动态路由组件不更新
**现象**：同一个组件，路由参数变了，但页面内容没变
**原因**：组件被复用了，不会重新创建，生命周期钩子不执行
**解决**：用watch监听route.params变化，或者用onBeforeRouteUpdate守卫

### 坑9：RouterLink激活样式不对
**现象**：不该高亮的菜单也高亮了
**原因**：router-link-active是模糊匹配，父路由也会被匹配到
**解决**：用exact精确匹配，或者自定义判断逻辑

### 坑10：路由元信息类型不对
**现象**：meta里的属性访问不到，或者类型报错
**原因**：meta默认是空对象，自定义的属性TS不认识
**解决**：需要扩展RouteMeta的类型定义（TS项目需要）

---

## 十、面试八股精选

### 1. SPA和MPA的区别？
**参考答案**：
- SPA（单页面应用）：只有一个HTML文件，页面切换通过JS动态渲染，不刷新浏览器。体验好，首屏稍慢，SEO不好。
- MPA（多页面应用）：每个页面对应一个HTML文件，跳转时整页刷新。首屏快，SEO好，体验一般。
- 现在中大型项目基本都是SPA，用Vue/React框架开发。

### 2. hash模式和history模式的区别？
**参考答案**：
- URL样子：hash有#号，history没有
- 原理：hash监听hashchange事件，history用pushState API
- 刷新：hash不会404，history会404（需要后端配合）
- 兼容性：hash更好，history需要IE10+
- 美观度：history更美观

### 3. $route和$router的区别？
**参考答案**：
- $route：当前路由信息对象，包含path、params、query、meta等信息，只读
- $router：路由实例对象，包含push、replace、go、back等导航方法
- 简单说：$route是"当前路由的信息"，$router是"操作路由的工具"
- Composition API里用useRoute()和useRouter()

### 4. 导航守卫有哪些？执行顺序？
**参考答案**：
- 全局守卫：beforeEach、beforeResolve、afterEach
- 路由独享：beforeEnter
- 组件内：beforeRouteEnter、beforeRouteUpdate、beforeRouteLeave
- 执行顺序：离开守卫 → 全局beforeEach → 重用组件的beforeRouteUpdate → 路由beforeEnter → 组件beforeRouteEnter → 全局beforeResolve → 跳转确认 → 全局afterEach

### 5. 路由懒加载怎么实现？
**参考答案**：
- 用ES6的动态import语法：`component: () => import('@/views/xxx.vue')`
- 原理：利用webpack/vite的代码分割功能，每个路由组件打包成单独的JS文件
- 好处：减小首屏体积，加快首屏加载速度
- 配合webpackChunkName还可以自定义打包后的文件名

### 6. params和query的区别？
**参考答案**：
- 位置：params在路径里（/user/1），query在?后面（/user?id=1）
- 配置：params需要在路由path里声明，query不需要
- 刷新：都不会丢失
- 命名路由：params配合name使用，path会忽略params
- 适用场景：params用于核心标识（ID），query用于筛选条件

---

## 十一、总结与后续学习建议

### 11.1 本篇要点回顾

回顾一下这篇的核心内容：

1. **路由是什么**：URL和页面的映射关系，SPA的核心
2. **两种模式**：hash（带#号）和history（好看但需要后端配合）
3. **基本使用**：创建路由实例 → 配置routes → app.use(router) → RouterView
4. **路由配置**：动态路由、嵌套路由、命名路由、重定向、别名
5. **跳转方式**：声明式（RouterLink）和编程式（router.push/replace）
6. **路由传参**：params（路径参数）和 query（查询参数）
7. **导航守卫**：全局守卫、独享守卫、组件内守卫，登录权限控制经典案例
8. **其他功能**：路由懒加载、滚动行为、过渡动效

### 11.2 学习心得

路由是Vue全家桶里相对简单的一块，核心概念不多，但细节不少。

给新手的建议：
- **先搭起来跑通**：先写个简单的多页面，感受一下路由是怎么回事
- **再学高级功能**：嵌套路由、导航守卫这些，在项目中用到了再深入学
- **多做项目**：路由这个东西，做一个完整的后台管理系统就全会了

路由是框架的基础设施，不管Vue还是React，原理都是通的。学会了Vue Router，以后学React Router也很快。

🤖 **AI时代怎么学路由**：
- 路由配置重复性高，可以让AI生成初始版本，你再调整
- 遇到导航守卫的逻辑问题，把需求说给AI听，让它帮你写
- 但是！路由匹配规则、守卫执行顺序这些基础要理解，不然出了bug不知道从哪查

### 11.3 接下来学什么？

路由搞定了，接下来该学状态管理了——**Pinia**，Vuex的"青春版"，用过都说香。

```
Vue3基础 → Vue Router → Pinia → 组件库 → 组件通信 → 全栈项目
```

下一篇咱们讲 **Pinia状态管理**——全局数据共享的利器，比Vuex简单多了。

### 11.4 学习资源推荐

- **Vue Router官方文档**：最权威的路由教程，写得非常好
- **Vue Router GitHub**：遇到问题可以去提issue
- **VueUse Router**：好用的路由相关组合式函数
- **各种后台管理系统模板**：找个开源的看看人家的路由怎么设计的

---

> 💬 **最后说两句**：
> 
> 恭喜你又看完了一篇9000字的Vue Router教程！离Vue全栈又近了一步。
> 
> 我刚学路由的时候，觉得这玩意儿不就是个跳转吗？后来做项目才发现，路由里面的门道还挺多——权限控制、动态路由、面包屑、标签页、懒加载……每一项都有讲究。
> 
> 但也别害怕，路由这东西，多做两个项目就熟了。毕竟它只是个工具，核心就是"URL和页面的对应关系"，搞懂了这个，其他都是细节。
> 
> 现在就去用Vue Router搭一个属于你的后台管理系统路由吧。做完你就会发现——原来路由也没那么难。
> 
> **万水千山总是情，点个👍行不行？** 你的点赞收藏是我更新的最大动力！

---

*相关推荐：《Vue3入门：Composition API写起来到底有多爽》《Vite神速构建：5分钟搭出企业级前端项目》《Pinia状态管理：Vuex的"青春版"》*
