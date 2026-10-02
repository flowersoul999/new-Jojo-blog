---
title: "Vue Router 快速入门 + 面试八股全总结"
published: 2026-09-08
description: "Vue Router 从路由模式、动态路由、嵌套路由、导航守卫到鉴权实战，含高频面试八股题。"
tags: ["Vue","Vue Router","面试八股"]
category: "Vue"
image: "/blogs/前端/vue-router-cover.jpg"
author: "jojo"
draft: false
comment: true
lang: "zh-CN"
aiPolished: false
---
# Vue Router 快速入门 + 面试八股全总结

> 目录
>
> 1. [Vue Router 是什么](#一vue-router-是什么)
> 2. [快速上手：5 步搞定路由](#二快速上手5-步搞定路由)
> 3. [路由的两种模式：hash vs history](#三路由的两种模式hash-vs-history)
> 4. [路由传参的几种方式](#四路由传参的几种方式)
> 5. [嵌套路由](#五嵌套路由)
> 6. [导航守卫](#六导航守卫)
> 7. [路由懒加载](#七路由懒加载)
> 8. [命名路由和命名视图](#八命名路由和命名视图)
> 9. [项目中的完整结构](#九项目中的完整结构)
> 10. [面试八股](#十面试八股)
> 11. [总结](#十一总结)

---

## 一、Vue Router 是什么

Vue Router 是 Vue 官方的路由管理器。简单说就是：**根据 URL 的不同，在页面上显示不同的组件。**

比如你访问 `/home` 显示首页，访问 `/user` 显示用户页，访问 `/login` 显示登录页——这些都是路由在管。

### 为什么需要路由？

没有路由的话，你得写一堆 `v-if` 来控制显示哪个页面：

```vue
<div v-if="page === 'home'"><Home /></div>
<div v-else-if="page === 'user'"><User /></div>
<div v-else-if="page === 'login'"><Login /></div>
```

页面少了还行，页面多了就乱了，而且：

- **URL 不能直接访问** —— 你没法把用户页发给朋友，他打开得自己点进去
- **浏览器前进后退用不了** —— 点返回键直接退出网站了
- **SEO 不友好** —— 搜索引擎抓不到各个页面

Vue Router 就是专门解决这些问题的，让单页应用（SPA）也能像多页网站一样，有清晰的 URL、前进后退、页面刷新不丢失。

### Vue Router 3 vs 4

| 版本 | 对应 Vue 版本 | 主要 API |
|------|------------|---------|
| Vue Router 3 | Vue 2 | `new VueRouter({...})` |
| Vue Router 4 | Vue 3 | `createRouter({...})` |

用法差不多，只是创建方式和部分 API 名字变了。下面都用 Vue Router 4 + Vue 3 的写法。

---

## 二、快速上手：5 步搞定路由

### 第 1 步：安装

```bash
npm install vue-router@4
```

### 第 2 步：创建路由配置文件

建一个 `src/router/index.js`：

```js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import User from '@/views/User.vue'
import Login from '@/views/Login.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/user', component: User },
  { path: '/login', component: Login },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
```

`routes` 就是路由表，一个路径对应一个组件。

### 第 3 步：在 main.js 里注册

```js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

### 第 4 步：放路由出口

在 `App.vue` 里加一个 `<router-view>`：

```vue
<template>
  <!-- 路由匹配到的组件会渲染在这里 -->
  <router-view />
</template>
```

### 第 5 步：页面之间跳转

用 `<router-link>` 组件，相当于一个超链接：

```vue
<template>
  <nav>
    <router-link to="/">首页</router-link>
    <router-link to="/user">用户</router-link>
    <router-link to="/login">登录</router-link>
  </nav>
  <router-view />
</template>
```

点哪个链接，`<router-view>` 里就显示对应的组件。

完成。就这么 5 步，路由就跑起来了。

---

## 三、路由的两种模式：hash vs history

创建路由时要选一种模式，这是面试必问的。

### hash 模式

```js
import { createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
```

URL 长这样：`http://localhost:5173/#/user`

**特点**：
- URL 里有个 `#` 号
- `#` 后面的内容不会发给服务器
- 不需要后端配合，前端自己就能搞定
- 打包后直接打开 `index.html` 就能用

**原理**：监听 `hashchange` 事件，`#` 后面的路径变了，前端自己切换组件。

### history 模式

```js
import { createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes,
})
```

URL 长这样：`http://localhost:5173/user`

**特点**：
- URL 更干净，没有 `#` 号
- 需要后端配合（刷新页面会 404）
- 开发环境 Vite 已经帮你处理好了
- 生产环境需要后端配置重定向

**原理**：用 HTML5 的 `history.pushState` API 改变 URL，不刷新页面。但刷新的时候浏览器会真的去服务器请求这个路径，服务器上没有对应文件就会 404。

### 为什么 history 模式刷新会 404？

举个例子：你访问 `http://example.com/user`

- **hash 模式**：实际请求的是 `http://example.com/`（`#` 后面的不发），服务器返回 `index.html`，前端 JS 拿到 `#/user`，自己渲染用户页。没问题。

- **history 模式**：浏览器真的去服务器请求 `/user` 这个路径。但服务器上只有一个 `index.html`，没有 `/user` 这个文件/目录，所以返回 404。

**解决办法**：后端配置一下，所有路径都返回 `index.html`，让前端自己处理路由。

Nginx 配置：
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Apache 配置（.htaccess）：
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### 怎么选？

| 对比项 | hash 模式 | history 模式 |
|--------|----------|-------------|
| URL 样子 | 有 `#`，不太好看 | 干净好看 |
| 后端配合 | 不需要 | 需要 |
| 兼容性 | 好（IE 都支持） | 稍差（需要 HTML5 API） |
| 适用场景 | 简单项目、内部系统、懒得配后端 | 正式项目、对外的网站 |

实际开发中 **大部分项目用 history 模式**，URL 好看，而且后端配置一下也不麻烦。

---

## 四、路由传参的几种方式

从 A 页面跳到 B 页面，经常要带点数据过去（比如用户 ID、商品 ID）。有几种方式：

### 方式一：动态路由（params）

URL 里带参数，比如 `/user/123`：

```js
// 路由配置
const routes = [
  { path: '/user/:id', component: User },
]
```

```vue
<!-- 跳转 -->
<router-link to="/user/123">用户详情</router-link>
```

```js
// 组件里获取参数
import { useRoute } from 'vue-router'

const route = useRoute()
console.log(route.params.id)  // "123"
```

**注意**：`params` 里的值都是字符串，因为是从 URL 里解析出来的。需要数字的话自己 `parseInt`。

### 方式二：query 参数

URL 的 `?` 后面带参数，比如 `/user?id=123`：

```vue
<!-- 跳转 -->
<router-link to="/user?id=123">用户详情</router-link>
```

```js
// 组件里获取
import { useRoute } from 'vue-router'

const route = useRoute()
console.log(route.query.id)  // "123"
```

### 方式三：编程式导航传参

```js
import { useRouter } from 'vue-router'

const router = useRouter()

// 方式 1：字符串路径 + query
router.push('/user?id=123')

// 方式 2：对象形式 + path + query
router.push({ path: '/user', query: { id: 123 } })

// 方式 3：对象形式 + name + params
router.push({ name: 'User', params: { id: 123 } })
```

**注意**：`params` 只能配合 `name` 使用，配合 `path` 会被忽略。这是个常见坑。

```js
// ❌ 错的：path + params 不生效
router.push({ path: '/user', params: { id: 123 } })

// ✅ 对的：name + params
router.push({ name: 'User', params: { id: 123 } })
```

### 对比总结

| 传参方式 | URL 样子 | 刷新后还在吗 | 适用场景 |
|---------|---------|------------|---------|
| params（动态路由） | `/user/123` | 在 | 详情页 ID，RESTful 风格 |
| query | `/user?id=123` | 在 | 搜索条件、筛选参数 |

一般来说：
- **ID 类的参数** → 用动态路由 params（`/product/123`）
- **筛选/搜索参数** → 用 query（`/list?keyword=xxx&page=1`）

---

## 五、嵌套路由

实际项目中，页面常常有「外层布局 + 内层内容」的结构。比如后台管理系统，左边是菜单栏，右边是内容区，菜单切换时只有右边内容变。

这就需要嵌套路由：

```js
const routes = [
  {
    path: '/',
    component: Layout,          // 外层布局（侧边栏 + 顶部导航）
    children: [
      { path: '', component: Home },    // /  → 首页
      { path: 'user', component: User }, // /user → 用户管理
      { path: 'product', component: Product }, // /product → 商品管理
    ],
  },
  { path: '/login', component: Login },  // 登录页（没有布局）
]
```

`Layout.vue` 长这样：

```vue
<template>
  <div class="layout">
    <aside>
      <!-- 侧边栏菜单 -->
      <router-link to="/">首页</router-link>
      <router-link to="/user">用户管理</router-link>
      <router-link to="/product">商品管理</router-link>
    </aside>
    <main>
      <!-- 子路由的组件渲染在这里 -->
      <router-view />
    </main>
  </div>
</template>
```

要点：
1. 父路由配置 `children` 数组
2. 父组件里要有 `<router-view>` 来放子组件
3. 子路由的 `path` 前面不加 `/`，会自动拼接父路径
4. 加了 `/` 就是绝对路径，不拼接

嵌套路由可以多层嵌套，但一般 2~3 层就够了，太深了反而不好维护。

---

## 六、导航守卫

导航守卫就是「路由跳转前/后做的拦截」，最常用的场景是**登录权限判断**——没登录的用户访问需要登录的页面，直接跳转到登录页。

### 全局前置守卫 beforeEach

所有路由跳转前都会经过这里：

```js
// router/index.js
const whiteList = ['/login', '/register']  // 白名单：不需要登录的页面

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (token) {
    // 已登录
    if (to.path === '/login') {
      // 已登录还去登录页？直接跳首页
      next('/')
    } else {
      next()  // 放行
    }
  } else {
    // 未登录
    if (whiteList.includes(to.path)) {
      next()  // 在白名单里，放行
    } else {
      next('/login')  // 不在白名单，跳登录页
    }
  }
})
```

**三个参数：**

| 参数 | 含义 |
|------|------|
| `to` | 要跳转到的路由对象（目标） |
| `from` | 从哪个路由来的（来源） |
| `next` | 回调函数，控制是否放行 |

**`next()` 的几种用法：**

```js
next()              // 放行，正常跳转
next(false)         // 取消跳转
next('/login')      // 跳转到其他路径
next({ path: '/login' })  // 对象形式，可带 query/params
```

> Vue Router 4 里也可以不用 next，直接 `return` 路径或者 `return false`，但 next 依然支持，老项目里很常见。

### 全局后置钩子 afterEach

跳转完成后执行，一般用来改页面标题、埋点：

```js
router.afterEach((to, from) => {
  // 改页面标题
  document.title = to.meta.title || '我的网站'

  // 页面访问埋点
  // analytics.trackPageView(to.path)
})
```

### 路由独享守卫 beforeEnter

只对某个路由生效：

```js
const routes = [
  {
    path: '/admin',
    component: Admin,
    beforeEnter: (to, from, next) => {
      // 只有管理员能进
      const role = localStorage.getItem('role')
      if (role === 'admin') {
        next()
      } else {
        next('/403')
      }
    },
  },
]
```

### 组件内守卫

在组件内部写，用得不多，知道有这东西就行：

```js
// 组合式 API 写法
import { onBeforeRouteEnter, onBeforeRouteUpdate, onBeforeRouteLeave } from 'vue-router'

onBeforeRouteEnter((to, from, next) => {
  // 进入组件前
  next()
})

onBeforeRouteUpdate((to, from, next) => {
  // 路由更新但组件复用时（比如 /user/1 → /user/2）
  next()
})

onBeforeRouteLeave((to, from, next) => {
  // 离开组件前，比如「你确定要离开吗？你编辑的内容还没保存」
  if (confirm('确定离开吗？')) {
    next()
  } else {
    next(false)
  }
})
```

`onBeforeRouteLeave` 比较常用——用户编辑了一半想离开，弹个确认框。

### 完整的导航解析流程

一次路由跳转，守卫执行顺序：

```
1. 导航被触发
2. 失活的组件：beforeRouteLeave
3. 全局：beforeEach
4. 重用组件：beforeRouteUpdate
5. 路由配置：beforeEnter
6. 解析异步路由组件
7. 激活的组件：beforeRouteEnter
8. 全局：beforeResolve
9. 导航确认
10. 全局：afterEach
11. DOM 更新
```

一般项目里用得最多的就是 `beforeEach`（全局前置守卫，做登录判断），其他的遇到了再查。

---

## 七、路由懒加载

如果不做懒加载，所有页面的代码都会打包到一个 JS 文件里，首屏加载很慢。懒加载就是**访问到哪个页面，才加载哪个页面的代码**。

### 写法

```js
// ❌ 不懒加载：直接 import
import Home from '@/views/Home.vue'
import User from '@/views/User.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/user', component: User },
]
```

```js
// ✅ 懒加载：() => import()
const routes = [
  { path: '/', component: () => import('@/views/Home.vue') },
  { path: '/user', component: () => import('@/views/User.vue') },
]
```

就改了个写法，把 `import Home from '...'` 换成 `() => import('...')`。

### 原理

`() => import('./xxx.vue')` 是一个函数，只有路由匹配到的时候才会执行这个函数，触发动态 import。Vite / Webpack 会把每个懒加载的组件打包成单独的 JS 文件（chunk），按需加载。

### 什么时候用？

**除了首页，其他页面都建议懒加载。** 首页如果也懒加载，用户打开网站还得等一下，体验不好。其他用户可能不点的页面，懒加载能省流量、加快首屏速度。

### 魔法注释（webpackChunkName）

可以给 chunk 命名，方便调试时看哪个文件是哪个页面：

```js
const routes = [
  {
    path: '/user',
    component: () => import(/* webpackChunkName: "user" */ '@/views/User.vue'),
  },
  {
    path: '/product',
    component: () => import(/* webpackChunkName: "product" */ '@/views/Product.vue'),
  },
]
```

打包后会生成 `user.xxx.js`、`product.xxx.js` 这样的文件。Vite 也支持这个注释。

---

## 八、命名路由和命名视图

### 命名路由

给路由起个名字，跳转的时候用名字不用写路径：

```js
const routes = [
  {
    path: '/user/:id',
    name: 'UserDetail',   // 起个名字
    component: UserDetail,
  },
]
```

```js
// 跳转时用 name
router.push({ name: 'UserDetail', params: { id: 123 } })
```

**好处**：路径改了不用改所有跳转的地方，只要名字不变就行。尤其是带 params 的动态路由，必须用 name 才能传 params。

### 命名视图

一个页面里有多个 `<router-view>`，分别显示不同的组件。比如左右分栏布局：

```js
const routes = [
  {
    path: '/',
    components: {
      default: Home,     // 默认的 router-view
      sidebar: Sidebar,  // name="sidebar" 的 router-view
      header: Header,    // name="header" 的 router-view
    },
  },
]
```

```vue
<template>
  <router-view name="header" />
  <div class="main">
    <router-view name="sidebar" />
    <router-view />
  </div>
</template>
```

这个用得不多，知道有这东西就行。一般嵌套路由就能搞定布局问题。

---

## 九、项目中的完整结构

实际项目里，路由文件不会只有一个，会按模块拆分。下面是一个中后台项目的典型结构：

```
src/
├── router/
│   ├── index.js              ← 入口：创建实例、守卫、挂载路由
│   └── modules/
│       ├── home.js           ← 首页模块
│       ├── user.js           ← 用户管理模块
│       ├── product.js        ← 商品管理模块
│       └── order.js          ← 订单管理模块
└── views/
    ├── Layout.vue            ← 布局组件
    ├── Login.vue
    ├── 404.vue
    ├── home/
    ├── user/
    ├── product/
    └── order/
```

### 代码示例

**`router/modules/user.js`**

```js
const routes = [
  {
    path: '/user',
    component: () => import('@/views/Layout.vue'),
    meta: { title: '用户管理', requireAuth: true },
    children: [
      {
        path: '',
        name: 'UserList',
        component: () => import('@/views/user/list.vue'),
        meta: { title: '用户列表' },
      },
      {
        path: ':id',
        name: 'UserDetail',
        component: () => import('@/views/user/detail.vue'),
        meta: { title: '用户详情' },
      },
      {
        path: 'create',
        name: 'UserCreate',
        component: () => import('@/views/user/create.vue'),
        meta: { title: '创建用户' },
      },
    ],
  },
]

export default routes
```

**`router/index.js`**

```js
import { createRouter, createWebHistory } from 'vue-router'

// 导入各个模块
import homeRoutes from './modules/home'
import userRoutes from './modules/user'
import productRoutes from './modules/product'
import orderRoutes from './modules/order'

// 公共路由（不需要登录的）
const publicRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
    meta: { title: '页面不存在' },
  },
  // 所有没匹配到的都跳 404
  { path: '/:pathMatch(.*)*', redirect: '/404' },
]

// 业务路由（需要登录的）
const asyncRoutes = [
  ...homeRoutes,
  ...userRoutes,
  ...productRoutes,
  ...orderRoutes,
]

const router = createRouter({
  history: createWebHistory(),
  routes: [...publicRoutes, ...asyncRoutes],
  scrollBehavior() {
    // 跳转到新页面时滚动到顶部
    return { top: 0 }
  },
})

// 全局前置守卫：登录判断
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  // 改标题
  if (to.meta.title) {
    document.title = to.meta.title
  }

  if (token) {
    if (to.path === '/login') {
      next('/')
    } else {
      next()
    }
  } else {
    if (to.meta.requireAuth === false || to.path === '/login') {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

export default router
```

**几个细节：**

1. **`meta` 字段** —— 自定义信息，比如页面标题、是否需要登录、权限标识等。守卫里可以通过 `to.meta.xxx` 读取。
2. **404 路由** —— 放在最后面，所有没匹配到的路径都跳到 404 页。
3. **`scrollBehavior`** —— 路由切换时控制滚动条位置，比如每次都回到顶部。
4. **`redirect` 参数** —— 跳登录页时带上原路径，登录成功后可以跳回原来想去的页面，体验更好。

---

## 十、面试八股

下面是 Vue Router 的高频面试题和参考答案。

### 1. Vue Router 的 hash 模式和 history 模式有什么区别？

**参考答案：**

| 对比项 | hash 模式 | history 模式 |
|--------|----------|-------------|
| URL 外观 | 带 `#` 号，如 `#/home` | 干净的正常路径 |
| 原理 | 监听 `hashchange` 事件 | HTML5 History API（pushState、replaceState） |
| 后端配合 | 不需要，`#` 后面的内容不会发给服务器 | 需要，刷新页面会请求服务器，后端要配置重定向到 index.html |
| 兼容性 | 好（兼容 IE） | 稍差（IE9 及以下不支持） |
| 适用场景 | 简单项目、内部工具 | 正式项目、对外产品 |

**history 模式刷新 404 的解决办法**：后端配置所有路径都返回 `index.html`，让前端自己处理路由。Nginx 用 `try_files $uri $uri/ /index.html`。

---

### 2. 路由传参有几种方式？区别是什么？

**参考答案：**

主要有两种方式：

1. **params 传参（动态路由）**
   - URL 形式：`/user/123`
   - 配置：`path: '/user/:id'`
   - 获取：`route.params.id`
   - 特点：参数在路径里，RESTful 风格，刷新后参数还在
   - 注意：用 `router.push` 时 params 只能配合 `name`，不能配合 `path`

2. **query 传参**
   - URL 形式：`/user?id=123`
   - 获取：`route.query.id`
   - 特点：参数在 URL 的 `?` 后面，可以分享链接，刷新后参数还在
   - 适合：搜索条件、筛选、分页等

**还有一种不用的方式**：`state` 传参（不推荐，刷新就没了）。

**一般选型**：ID 类用 params（动态路由），筛选条件用 query。

---

### 3. \$route 和 \$router 的区别？

**参考答案：**

| 对比项 | $route | $router |
|--------|--------|---------|
| 是什么 | 当前路由信息对象 | 路由实例对象 |
| 作用 | 读取当前路由的信息 | 控制路由跳转 |
| 常用属性 | path、params、query、meta、name | push、replace、go、back、forward |
| 数量 | 每次路由都不一样，只读的 | 全局只有一个 |

简单说：**想读信息用 route，想跳转用 router。**

Vue 3 里：
- `useRoute()` → 相当于 `this.$route`
- `useRouter()` → 相当于 `this.$router`

---

### 4. 导航守卫有哪些？执行顺序是什么？

**参考答案：**

三类导航守卫：

1. **全局守卫** —— `beforeEach`、`beforeResolve`、`afterEach`
2. **路由独享守卫** —— `beforeEnter`
3. **组件内守卫** —— `beforeRouteEnter`、`beforeRouteUpdate`、`beforeRouteLeave`

**完整的执行顺序：**

1. `beforeRouteLeave` —— 离开的组件
2. `beforeEach` —— 全局前置
3. `beforeRouteUpdate` —— 重用的组件
4. `beforeEnter` —— 路由独享
5. 解析异步路由组件
6. `beforeRouteEnter` —— 进入的组件（**拿不到 this**，因为组件还没创建）
7. `beforeResolve` —— 全局解析守卫
8. 导航确认
9. `afterEach` —— 全局后置钩子
10. DOM 更新

---

### 5. beforeRouteEnter 为什么不能访问 this？

**参考答案：**

因为 `beforeRouteEnter` 执行的时候，组件实例还没创建，所以 `this` 不存在。

**怎么拿到组件实例？** 可以用 `next` 的回调：

```js
beforeRouteEnter(to, from, next) {
  next(vm => {
    // vm 就是组件实例
    console.log(vm.someData)
  })
}
```

这是唯一一个支持 next 回调的守卫。其他守卫都能访问 this。

---

### 6. 路由懒加载怎么实现？原理是什么？

**参考答案：**

**实现方式**：把组件写成动态 import 的函数形式：

```js
const routes = [
  { path: '/user', component: () => import('@/views/User.vue') },
]
```

**原理**：
- `import()` 是 ES6 的动态导入语法，返回 Promise
- 只有当路由被访问时，才会执行这个函数，触发模块加载
- 打包工具（Vite / Webpack）会把动态 import 的模块单独打包成一个 chunk
- 路由跳转时按需加载对应的 chunk 文件

**好处**：
- 首屏加载更快（首屏只加载首页代码）
- 减少首屏 JS 体积
- 用户只加载访问过的页面的代码

**什么时候用**：除了首页等核心页面，其他页面一般都做懒加载。

---

### 7. 怎么实现路由权限控制？

**参考答案：**

常见的方案是**全局前置守卫 + 路由元信息（meta）**：

1. 在路由配置的 `meta` 里标记哪些路由需要登录、需要什么权限
2. 在 `beforeEach` 全局守卫里：
   - 检查有没有 token
   - 没有 token 且需要登录 → 跳登录页
   - 有 token 但权限不够 → 跳 403 页
   - 正常 → 放行

```js
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requireAuth && !token) {
    next('/login')
  } else {
    next()
  }
})
```

**更复杂的动态路由方案**（后台管理系统常用）：
- 登录后获取用户的菜单/权限数据
- 用 `router.addRoute()` 动态添加用户有权限的路由
- 没有权限的路由根本不挂载，更安全

---

### 8. 嵌套路由怎么用？应用场景？

**参考答案：**

在父路由配置 `children` 数组，子路由的组件渲染在父组件的 `<router-view>` 里。

**应用场景**：
- 后台管理系统的布局（左侧菜单 + 右侧内容）
- 有公共头部/底部的页面布局
- 详情页下的 tab 切换（基本信息、订单记录、收货地址）

注意事项：
- 子路由的 path 不加 `/` 就是相对路径，会拼接父路径
- 父组件里必须有 `<router-view>` 来承载子组件
- 可以多层嵌套，但一般 2~3 层就够了

---

### 9. router.push 和 router.replace 的区别？

**参考答案：**

| 方法 | 作用 | 浏览器历史记录 |
|------|------|--------------|
| `router.push()` | 跳转到新页面 | 新增一条记录（点返回能回去） |
| `router.replace()` | 替换当前页面 | 替换当前记录（点返回回不去） |

**使用场景：**
- 正常跳转 → push
- 登录成功后跳转首页 → replace（避免登录页还在历史里，点返回又回到登录页）
- 从列表页跳到详情页 → push
- 支付成功跳结果页 → replace

---

### 10. 什么是命名视图？用在什么场景？

**参考答案：**

一个路由可以对应多个组件，每个组件渲染到对应名字的 `<router-view>` 里。

```js
{
  path: '/',
  components: {
    default: Main,
    header: Header,
    sidebar: Sidebar,
  }
}
```

```vue
<router-view name="header" />
<router-view name="sidebar" />
<router-view /> <!-- default -->
```

**场景**：页面有多个独立的视图区域，需要根据路由切换多个组件。实际项目用得不多，大部分情况用嵌套路由就能解决。

---

### 11. 怎么实现路由切换时的过渡动画？

**参考答案：**

用 Vue 的 `<transition>` 包裹 `<router-view>`：

```vue
<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

**注意**：Vue Router 4 中要用 `v-slot` 的方式，不能直接把 `<transition>` 套在 `<router-view>` 外面。

`mode="out-in"` 表示先让旧组件淡出，再让新组件淡入，避免两个组件同时存在导致布局错乱。

---

### 12. scrollBehavior 是干什么的？

**参考答案：**

控制路由切换时页面的滚动位置。

常见用法：

```js
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 1. 每次都回到顶部
    return { top: 0 }

    // 2. 有缓存位置（前进后退）就用缓存的，否则回到顶部
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }

    // 3. 有锚点的话滚动到锚点
    if (to.hash) {
      return { el: to.hash }
    }
  },
})
```

**为什么需要？** 单页应用切换路由时，浏览器默认不会自动滚动到顶部。用户在 A 页面滚动到中间，跳到 B 页面，滚动条还在中间，体验不好。用 scrollBehavior 可以统一控制。

---

### 13. 动态添加路由 addRoute 怎么用？应用场景？

**参考答案：**

`addRoute` 可以在运行时动态添加路由，而不是一开始就全定义好。

```js
// 动态添加一条路由
router.addRoute({
  path: '/new-page',
  name: 'NewPage',
  component: () => import('@/views/NewPage.vue'),
})

// 添加子路由（第一个参数是父路由的 name）
router.addRoute('ParentName', {
  path: 'child',
  component: Child,
})
```

**应用场景**：
- **权限控制** —— 登录后根据用户角色动态添加有权限的路由，没权限的路由根本不存在
- **菜单动态生成** —— 从后端获取菜单数据，前端动态生成路由表
- **插件/扩展** —— 第三方模块自己注册路由

**常见问题**：刷新页面后动态路由会丢失，所以要在 `beforeEach` 里判断一下，如果还没加过就重新加（一般存在 pinia 或 vuex 里）。

---

### 14. 路由元信息 meta 有什么用？

**参考答案：**

`meta` 是给路由配置附加的自定义信息，可以在守卫里、组件里读取。

常见用途：

1. **页面标题** —— `meta.title`，`afterEach` 里设置 `document.title`
2. **权限控制** —— `meta.requireAuth`、`meta.roles`，守卫里判断权限
3. **缓存控制** —— `meta.keepAlive`，决定是否用 keep-alive 缓存组件
4. **面包屑** —— `meta.breadcrumb`，生成面包屑导航
5. **菜单图标** —— `meta.icon`，侧边栏菜单用

```js
{
  path: '/user',
  component: User,
  meta: {
    title: '用户管理',
    requireAuth: true,
    roles: ['admin'],
    icon: 'user',
    keepAlive: true,
  }
}
```

读取方式：`route.meta.title`

---

## 十一、总结

Vue Router 的核心就是「根据 URL 切换组件」，实际项目中常用的也就那几个东西：

**快速回忆：**

- **创建**：`createRouter` + `createWebHistory()` + routes 配置 + `app.use(router)`
- **两种模式**：hash（带 #，不用后端配合）vs history（干净，需要后端配重定向）
- **传参**：动态路由 params（`/user/:id`）+ query（`?id=123`）
- **嵌套路由**：`children` 配置 + 父组件 `<router-view>`
- **导航守卫**：`beforeEach` 做登录判断、`afterEach` 改标题
- **懒加载**：`() => import(...)`，首屏更快
- **meta**：挂自定义信息（标题、权限、缓存）
- **项目结构**：按模块拆分路由文件 + 公共路由 + 业务路由

**面试必考点**：hash vs history 区别、路由传参方式、导航守卫执行顺序、懒加载原理、权限控制实现、\$route vs \$router、scrollBehavior、addRoute。

掌握这些，日常开发和面试都够用了。
