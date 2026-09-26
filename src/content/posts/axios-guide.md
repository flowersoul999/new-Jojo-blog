---
title: "axios 前后端对接完全指南：从前端封装到后端接口的全流程"
published: 2026-09-03
description: "整理了从 HTTP 方法选择、前端 axios 封装、后端接口编写到最终联调的完整流程"
tags: []
category: "技术总结"
draft: false
lang: "zh-CN"
---
做全栈开发实习时，前后端对接是每天都要面对的事。这篇文章整理了从 HTTP 方法选择、前端 axios 封装、后端接口编写到最终联调的完整流程，每个环节不仅给代码，还讲清楚为什么要这么设计。

文章覆盖以下内容：HTTP 请求方法怎么选、URL 是怎么拼出来的、axios 为什么要封装、拦截器的作用、Token 认证的完整流程、前端怎么写、后端怎么写、两边怎么对上。

> 适合人群：刚开始做全栈、想系统了解前后端如何协作的开发者。

***

## 一、HTTP 请求方法

RESTful 风格的接口，用不同的 HTTP 方法对应不同的数据库操作，记住「增删改查」四个字就行。

| 方法     | 对应操作      | 数据放哪里    | 幂等 | 安全 |
| ------ | --------- | -------- | -- | -- |
| GET    | 查（Read）   | URL 查询参数 | 是  | 是  |
| POST   | 增（Create） | 请求体 Body | 否  | 否  |
| PUT    | 改（全量替换）   | 请求体 Body | 是  | 否  |
| PATCH  | 改（部分更新）   | 请求体 Body | 否  | 否  |
| DELETE | 删（Delete） | URL 路径参数 | 是  | 否  |

两个概念解释一下：

- **幂等**：发一次和发十次，服务器最终状态一样。比如 GET 查 10 次数据，结果不变；但 POST 发 10 次创建请求，会生成 10 条数据。

- **安全**：不会修改服务器上的数据。GET 只是读取，所以是安全的；POST/PUT/DELETE 都会写数据，所以不安全。

### 为什么要用 RESTful 风格？全用 POST 不行吗？

技术上全用 POST 也能跑，但 RESTful 有几个实实在在的好处：

1. **语义清晰** —— 光看方法和 URL 就知道这个接口是干嘛的。`GET /products` 一看就是查商品列表，`DELETE /products/123` 一看就是删商品。如果全是 POST，你得翻参数才知道是增是删。
2. **缓存友好** —— GET 请求可以被浏览器、CDN、代理服务器缓存，提升性能。POST 请求默认不缓存。
3. **利于监控和日志分析** —— 后端日志里直接按方法过滤，就能统计查询量、创建量、删除量。
4. **和数据库操作对应** —— GET=SELECT、POST=INSERT、PUT=UPDATE、DELETE=DELETE，前后端沟通时不用翻译。

实际开发中的意义：网络抖动时，重试幂等请求是安全的，但重试 POST 可能导致重复创建——所以支付、下单这类操作要加防重机制。

常见的几个坑：

- 用 GET 传密码 → 密码会出现在 URL、浏览器历史、服务器日志里，必须用 POST

- 用 POST 查列表 → 查询应该用 GET，利于缓存和语义清晰

- PUT 漏传字段 → PUT 是全量替换，漏传的字段会被覆盖为空

***

## 二、URL 的组成

前端写 `request.get('/users/123')`，实际请求的地址是怎么来的？其实是三段拼接加上开发环境的代理转换。

```
baseURL   +  path        +  query         =  浏览器发出的 URL
/api      +  /users/123  +  ?tab=posts    =  /api/users/123?tab=posts
```

### baseURL

这一段在创建 axios 实例时统一配置，所有请求自动加上这个前缀：

```ts
const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
})
```

**为什么要统一配 baseURL？**

- **改环境只改一处** —— 开发环境是 `/api`，测试环境是 `https://test-api.example.com`，生产环境是 `https://api.example.com`。如果每个接口都写完整 URL，换环境时要改 100 个文件，还容易漏。

- **配合代理** —— 开发环境所有 `/api` 开头的请求都走 Vite 代理，不用每个接口单独配。

- **路径简洁** —— 业务代码里只写相对路径，可读性更好。

### path

就是你在 api 模块里写的路径，**必须和后端路由一一对应**：

```ts
// 前端
request.get(`/users/${id}`)

// 后端对应的路由
app.get('/users/:id', (req, res) => { ... })
```

路径对不上就 404，这是对接时最常见的问题。

**为什么路径要按资源组织？**

RESTful 的核心思想是「把 URL 当作资源定位符」。`/users` 是用户资源集合，`/users/123` 是具体某个用户，`/users/123/orders` 是这个用户的订单。这样组织有层级、好理解、好扩展，比 `/getUser`、`/getUserOrderList` 这种动词式的路径更清晰。

### query params

GET 请求的参数，axios 会自动拼到 URL 上，不需要手写 `?` 和 `&`：

```ts
request.get('/users', {
  params: { page: 1, size: 10 }
})
// 实际请求：/users?page=1&size=10
```

**为什么 GET 参数放 URL 上，POST 参数放 body 里？**

这是 HTTP 协议的约定，也是实际需求决定的：

- GET 是获取资源，参数是「筛选条件」，放 URL 上可以被收藏、分享、缓存。比如你把商品列表页的链接发给朋友，他打开就能看到同样的筛选结果。

- POST 是提交数据，参数是「要创建的内容」，可能很大（比如一篇文章、一张图片），URL 有长度限制（通常 2KB\~8KB），放 body 里没有限制。而且 body 里的数据不会出现在浏览器历史、服务器日志里，更安全。

### 开发环境的代理转换

开发时前端跑在 `localhost:5173`，后端跑在 `localhost:3000`。浏览器的同源策略会阻止跨域请求，所以用 Vite 代理做一层中转：

```ts
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

转换过程：

```
浏览器发出：   GET /api/users/123?tab=posts
                   ↓ Vite 代理拦截
去掉 /api：     /users/123?tab=posts
                   ↓ 转发到后端
到达后端：     GET http://localhost:3000/users/123?tab=posts
```

**为什么不直接让后端配 CORS？**

开发环境配代理更简单：

- **后端不用改** —— 后端只需要正常提供接口，不用管跨域的事

- **模拟生产环境路径** —— 前端用 `/api` 前缀，和生产环境的路径结构一致，上线时只改 baseURL

- **避免浏览器缓存混淆** —— 同一个域名下的请求，浏览器缓存策略更一致

生产环境不用代理——`baseURL` 直接设成真实域名，后端配置 CORS 允许前端域名访问即可。

---

## 三、RESTful 风格与 URL 命名

搞清楚 URL 的组成之后，下一个问题就是：URL 到底该怎么写？能随便写吗？

### URL 是谁定的？

**后端定的。** 后端代码里写了什么路由，前端就必须用什么 URL。对不上就 404。

打个比方：后端是一栋大楼，路由就是房间号。101 是登录、102 是注册、201 是用户列表。你前端要办事，就得去对应的房间。你写的房间号和实际对不上，就找不到人，后端返回 404。

所以 URL 不是前端随便写的，是**前后端约定好的**。后端路由怎么写，前端就怎么调用。

### 什么是 RESTful

RESTful 是一种**接口设计风格**，不是硬性规定。核心就一句话：**URL 表示资源（名词），HTTP 方法表示操作（动词）。**

对比一下就懂了：

| 操作 | 动词式（不推荐） | RESTful 名词式（推荐） |
|------|----------------|---------------------|
| 获取用户列表 | `GET /getUserList` | `GET /users` |
| 获取单个用户 | `GET /getUser?id=123` | `GET /users/123` |
| 创建用户 | `POST /addUser` | `POST /users` |
| 修改用户 | `POST /updateUser` | `PUT /users/123` |
| 删除用户 | `POST /deleteUser` | `DELETE /users/123` |
| 获取用户订单 | `GET /getUserOrders` | `GET /users/123/orders` |

RESTful 的 URL 里全是名词，动作由 GET/POST/PUT/DELETE 来表达。

### 为什么要用 RESTful

- **好懂** —— 看 URL + 方法就知道这个接口是干嘛的，不用翻文档
- **好沟通** —— 前后端说「用户资源」「商品资源」，说的是同一套话
- **好扩展** —— 加新资源加新路径，加子资源加一层，结构不乱
- **好缓存** —— GET 请求天然可以被浏览器/CDN 缓存

### URL 命名的几个习惯

1. **用名词，不用动词** —— `/users` 不是 `/getUsers`
2. **用复数** —— `/users` 不是 `/user`，表示资源集合
3. **用小写 + 连字符** —— `/user-profiles` 不是 `/UserProfiles`
4. **层级用斜杠** —— `/users/123/orders` 表示从属关系
5. **查询条件放 ? 后面** —— `/users?page=1&role=admin`

### 所有接口都必须 RESTful 吗？

不是。RESTful 是习惯，不是法律。实际项目里怎么方便怎么来。

比如登录注册，你会发现按纯 RESTful 的思路，注册 = 创建用户，应该用 `POST /users`。但实际项目里注册不只是「创建用户」——它还要校验密码强度、发验证码、返回 Token 等。所以一般单独拎出来放 `/auth` 下面：

```
POST  /auth/login       登录
POST  /auth/register    注册
POST  /auth/logout      退出
POST  /auth/send-code   发验证码
```

**一个简单的判断标准：**
- 标准的增删改查 → 用 RESTful（`GET/POST/PUT/DELETE /资源名`）
- 登录注册、批量操作、上传下载 → 用动词式路径也没问题（`/auth/login`、`/batch-delete`、`/upload`）

### 注册接口到底写什么？

推荐 `POST /auth/register`。

原因：
- 注册是认证流程的一部分，和登录放一起语义清晰
- 后台管理里可能还有「管理员创建用户」的功能，那个用 `POST /users`。两个功能不一样，不要混为一个接口

```js
// 前端：用户自己注册
request.post('/auth/register', { username, password })

// 前端：管理员创建用户
request.post('/users', { username, password, role: 'admin' })
```

---

## 四、axios 封装

### 为什么要封装

不封装的话，每个页面都要手写完整 URL、手动加 Token、手动写错误提示：

```js
// 页面 A
import axios from 'axios'

axios.get('https://api.example.com/goods', {
  headers: { Authorization: 'Bearer xxx' }
}).then(res => { ... })
```

问题很明显：

- **重复代码多** —— 100 个接口就要写 100 遍 `headers.Authorization`

- **改起来麻烦** —— 后端改了域名，你要全局搜索替换，容易漏

- **容易出错** —— 某个接口忘了加 Token，线上报 401，排查半天

- **错误提示不统一** —— 每个页面各自写错误提示，有的弹 Toast、有的 `alert`、有的啥也不弹，用户体验乱

封装的思路是把重复的配置和逻辑抽到一个文件，其他地方导入使用。改一处，全项目生效。

### 封装到底解决了什么问题

| 问题      | 封装前                 | 封装后                 |
| ------- | ------------------- | ------------------- |
| URL 前缀  | 每个接口手写完整地址          | baseURL 统一配置，只写相对路径 |
| Token   | 每个接口手动加 headers     | 请求拦截器自动注入           |
| 错误提示    | 每个接口各自写             | 响应拦截器统一弹 Toast      |
| Loading | 每个接口手动控制            | 拦截器自动开关             |
| 数据解包    | `res.data.data.xxx` | 直接拿到业务数据            |
| 401 跳转  | 每个接口判断              | 响应拦截器统一处理           |

说白了，封装就是**把所有接口都要做的事，放到一个地方统一做**。业务代码里只关心「我要什么数据、拿到数据后干嘛」，不关心 Token 怎么加、Loading 怎么开、错误怎么提示。

### 封装后的使用方式

```js
// 只封装一次：src/utils/request.js
import axios from 'axios'

const instance = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
})
// 在这里统一加 Token、统一处理错误...

export default instance
```

```js
// 页面里直接用
import request from '@/utils/request'

request.get('/goods').then(...)   // URL 自动拼好，Token 自动加上
```

***

## 五、全局拦截器

拦截器是 axios 的核心价值。所有请求在发出前和响应回来后，都会各经过一道统一处理。

```
组件发起请求 → 请求拦截器 → 后端服务器 → 响应拦截器 → 组件拿到数据
                  ↑                                              ↑
            加 Token / 开 Loading                    检查状态码 / 错误提示
```

### 为什么需要拦截器？在每个请求里写不行吗？

技术上每个请求里手写也行，但拦截器有几个不可替代的好处：

1. **不会漏** —— 只要用的是同一个实例，所有请求自动经过拦截器，不用每个都记得加。新人接手项目也不用知道「原来还要加 Token」，直接调用就行。
2. **统一维护** —— 哪天要改 Token 的前缀（比如从 `Bearer` 改成 `Token`），只改拦截器一处。如果散落在 100 个文件里，你得改 100 处。
3. **顺序可控** —— 多个拦截器可以按顺序执行，比如先加 Token、再打日志、再开 Loading。如果每个请求各自写，顺序可能乱。
4. **可以取消** —— 在请求拦截器里判断条件不满足，可以直接 `return Promise.reject()` 阻止请求发出，不用等到发出去了再取消。

### 请求拦截器

所有请求发出去之前，都会先经过这里。最常用的操作是加 Token：

```js
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config   // 必须 return，不然请求发不出去
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

**`config`** **是什么？** 就是这次请求的完整配置——URL、方法、参数、请求头、超时时间……你可以在这里修改任何一项，修改后的 config 会被 axios 用来发请求。

**为什么必须 return config？** 拦截器是一个「管道」，进去是 config，出来也得是 config，不然下一个环节拿不到配置，请求就发不出去了。

### 响应拦截器

所有响应回来之后，都会先经过这里。在这里统一处理错误和数据解包：

```js
instance.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 0) {
      // 业务错误
      showToast(res.message || '请求失败')
      if (res.code === 401) {
        localStorage.removeItem('token')
        router.push('/login')
      }
      return Promise.reject(new Error(res.message))
    }
    return res.data   // 只返回业务数据
  },
  (error) => {
    // HTTP 错误
    if (error.response?.status === 401) {
      showToast('登录已过期')
    } else if (error.code === 'ECONNABORTED') {
      showToast('请求超时')
    } else {
      showToast('网络错误')
    }
    return Promise.reject(error)
  }
)
```

**为什么要做数据解包（只 return res.data）？**

axios 的原始响应结构是 `response.data`，而后端又包了一层 `{ code, message, data }`。所以不做解包的话，你在组件里得写 `res.data.data.list`，两层 `.data` 很别扭。

在拦截器里直接把最内层的 `data` 返回，组件里 `await request.get(...)` 直接拿到业务数据，代码更干净。

**为什么要分 HTTP 错误和业务错误？**

- **HTTP 错误**（走第二个函数）：请求根本没成功，比如 404 找不到、500 服务器崩了、超时、断网。这些是「路都没走通」的问题。

- **业务错误**（走第一个函数，但 code !== 0）：请求成功到达后端了，后端也返回了，但业务逻辑不满足，比如「用户名已存在」「库存不足」。这些是「路通了，但事没办成」的问题。

两种错误的处理方式不一样，所以要分开判断。

之所以叫「全局」，是因为拦截器挂在实例上，而这个实例被所有接口共用。不管在哪个页面调用，所有请求都会经过这两个拦截器。

***

## 六、Token 认证流程

请求拦截器里最核心的就是这段：

```js
const token = localStorage.getItem('token')
if (token) {
  config.headers.Authorization = `Bearer ${token}`
}
```

作用是在每个请求头上带上身份凭证，后端据此识别用户。

### 完整的流转过程

```
1. 用户提交账号密码 → POST /login
2. 后端验证通过 → 用密钥签发 JWT Token → 返回给前端
3. 前端拿到 Token → 存入 localStorage
4. 后续每次请求 → 拦截器自动把 Token 放到 Authorization 头
5. 后端中间件验证 Token → 解析出用户信息 → 执行业务逻辑
6. Token 过期 → 后端返回 401 → 前端拦截器清除 Token 并跳转登录
```

### 为什么要用 Token？用 Session 不行吗？

Token 和 Session 是两种主流的认证方式，各有适用场景：

**Session（会话）的做法：**

- 用户登录后，后端在服务器内存里存一个 session，返回一个 sessionId 存在 Cookie 里

- 后续请求浏览器自动带上 Cookie，后端查 session 认出用户

**Token 的做法：**

- 用户登录后，后端用密钥签一个 Token 字符串返回，前端存在 localStorage

- 后续请求前端手动把 Token 放到请求头，后端验证签名认出用户

**为什么现在 Token 更流行？**

1. **跨域方便** —— Cookie 有跨域限制，前后端分离项目经常不同域名。Token 放请求头里没有跨域问题。
2. **服务端无状态** —— Session 存在服务器内存里，多台服务器时需要共享 session（比如用 Redis）。Token 是无状态的，服务器只需要验证签名，不用存东西，水平扩展更容易。
3. **移动端友好** —— App 里没有浏览器的 Cookie 机制，Token 更通用。
4. **可以携带信息** —— JWT Token 里可以存用户 ID、角色等信息，后端不用每次查数据库。

### 为什么 Token 要放 Authorization 头，不放 Cookie 里？

这取决于你的项目需求：

- 放 **Authorization 头**（Bearer Token）：前端主动控制，没有跨域问题，移动端也能用。但有 XSS 攻击风险（攻击者注入脚本偷 localStorage 里的 Token）。

- 放 **HttpOnly Cookie**：前端 JS 读不到，更安全（XSS 偷不走），浏览器自动携带。但有跨域限制，需要后端配置 CORS 和 `credentials`。

对入门项目和前后端完全分离的项目来说，Authorization 头 + localStorage 是最常见也最简单的方案。对安全性要求高的项目，推荐用 HttpOnly Cookie。

### 为什么要用 JWT？自己生成一个随机字符串不行吗？

随机字符串也能用（叫「不透明 Token」），但 JWT 有它的优势：

1. **自带信息** —— JWT 里可以存用户 ID、角色、过期时间等信息，后端拿到 Token 直接解析，不用查数据库。随机字符串的 Token 后端得去 Redis/数据库查对应的用户信息。
2. **无需存储** —— 因为信息在 Token 自身里，后端不需要存 Token，省内存也方便多服务器扩展。
3. **不可篡改** —— JWT 用密钥签名，后端一验就知道有没有被改过。

代价是 JWT 一旦签发就没法主动吊销（除非加黑名单机制），所以过期时间一般设得比较短（比如 2 小时或 7 天）。

### 几个常见问题

**为什么不直接传用户名密码？**
用户名密码是长期有效的「钥匙」，不能频繁传输。Token 是有过期时间的「临时通行证」，就算泄露了损失也有限。

**Token 存在 localStorage 安全吗？**
存在 XSS 攻击窃取的风险。更安全的方式是后端设置 `HttpOnly` 的 Cookie，前端无法读取，自动随请求发送。对中小型项目来说，存 localStorage 是最常见也最简单的做法。

**`Bearer`** **是什么？**
HTTP 协议中的约定前缀，意思是「持有者」。后端看到这个前缀就知道后面跟的是一个 Token，按 Token 的方式解析。

***

## 七、前端完整封装

按实际项目结构组织了 5 个文件，可以直接用。

### 为什么要这样组织文件结构？

```
src/
├── utils/
│   └── request.ts          ← 工具层：通用能力
├── types/
│   └── api.ts              ← 类型层：通用类型定义
├── api/
│   ├── user.ts             ← 业务层：按模块拆分接口
│   └── product.ts
└── views/
    └── ProductList.vue     ← 视图层：页面组件
```

**分层的好处：**

- **职责清晰** —— 每层只做一件事。`request.ts` 只管发请求，不管业务逻辑；`api/*.ts` 只管定义接口，不管页面怎么展示；组件只管渲染和交互，不管请求怎么发。

- **便于复用** —— 同一个接口可能被多个页面调用（比如获取用户信息），抽到 `api/user.ts` 里大家都能用。

- **便于维护** —— 后端改了某个接口，你只需要去对应的 api 文件里改，不用翻遍所有页面。

- **便于测试** —— 接口定义和页面逻辑分开，可以单独测接口、单独测页面。

### 为什么要按业务模块拆分 api 文件？

如果所有接口都塞在一个 `api.ts` 文件里，项目大了之后这个文件会有几千行，找个接口要翻半天。按模块拆分（user、product、order、cart……），每个模块一个文件，找接口直接去对应的文件里找，结构清晰。

### 1. request.ts

```ts
import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { showToast, showLoadingToast, closeToast } from 'vant'
import router from '@/router'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true,
})

// Loading 计数（多个请求并发时只显示一个）
let loadingCount = 0
const showLoading = () => {
  if (loadingCount === 0) {
    showLoadingToast({ message: '加载中...', forbidClick: true, duration: 0 })
  }
  loadingCount++
}
const hideLoading = () => {
  loadingCount--
  if (loadingCount <= 0) {
    loadingCount = 0
    closeToast()
  }
}

// ---------- 请求拦截器 ----------
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.headers['no-loading'] !== true) {
      showLoading()
    }
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() }
    }
    return config
  },
  (error) => {
    hideLoading()
    return Promise.reject(error)
  }
)

// ---------- 响应拦截器 ----------
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    hideLoading()
    const res = response.data

    if (res.code !== 0) {
      showToast(res.message || '请求失败')
      if (res.code === 401) {
        localStorage.removeItem('token')
        router.push('/login')
      }
      return Promise.reject(new Error(res.message || 'Error'))
    }

    return res.data as unknown as any
  },
  (error) => {
    hideLoading()

    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 400: showToast('请求参数错误'); break
        case 401:
          showToast('登录已过期，请重新登录')
          localStorage.removeItem('token')
          router.push('/login')
          break
        case 403: showToast('没有权限访问'); break
        case 404: showToast('请求的资源不存在'); break
        case 500: showToast('服务器内部错误'); break
        default: showToast(`请求错误 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      showToast('请求超时，请稍后重试')
    } else if (error.message === 'Network Error') {
      showToast('网络异常，请检查网络连接')
    } else {
      showToast(error.message || '请求失败')
    }

    return Promise.reject(error)
  }
)

export default service
```

**Loading 为什么要用计数？**

一个页面可能同时发多个请求（比如进商品详情页，同时请求商品信息、评论列表、推荐商品）。如果每个请求都开一次 Loading、关一次 Loading，页面上的 Loading 动画就会闪三次。

用计数的方式：第一个请求开始时显示 Loading，后续请求只递增计数；每个请求结束时递减计数，计数归 0 时才关闭 Loading。这样不管并发多少个请求，用户只看到一次 Loading。

**GET 请求为什么要加时间戳？**

有些浏览器（尤其是 IE 和老版本安卓）会缓存 GET 请求的结果，同样的 URL 第二次请求时直接从缓存里拿，不发请求到服务器。加一个 `_t=时间戳` 参数，每次请求的 URL 都不一样，浏览器就不会走缓存了。

### 2. types/api.ts

```ts
export interface PageParams {
  page: number
  size: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
  pages: number
}
```

**为什么要抽通用类型？**

分页是几乎所有列表接口的标配，每个模块都要定义一遍 `page`、`size`、`list`、`total` 太重复了。抽成通用类型，所有模块直接复用，还能保证分页格式的一致性。

### 3. api/user.ts

```ts
import request from '@/utils/request'
import type { PageParams, PageResult } from '@/types/api'

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  role: 'admin' | 'user'
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  userInfo: UserInfo
}

export function login(data: LoginParams) {
  return request.post<LoginResult>('/auth/login', data)
}

export function logout() {
  return request.post('/auth/logout')
}

export function getUserInfo() {
  return request.get<UserInfo>('/user/info')
}

export function updateUserInfo(data: Partial<UserInfo>) {
  return request.put<UserInfo>('/user/info', data)
}

export function getUserList(params: PageParams & { keyword?: string; role?: string }) {
  return request.get<PageResult<UserInfo>>('/users', { params })
}

export function getUserDetail(id: number) {
  return request.get<UserInfo>(`/users/${id}`)
}

export function createUser(data: Omit<UserInfo, 'id'>) {
  return request.post<UserInfo>('/users', data)
}

export function updateUser(id: number, data: Partial<UserInfo>) {
  return request.patch<UserInfo>(`/users/${id}`, data)
}

export function deleteUser(id: number) {
  return request.delete(`/users/${id}`)
}
```

**为什么接口要写成函数，不直接在组件里调 request？**

- **可读性好** —— 组件里写 `getUserList(params)` 比 `request.get('/users', { params })` 语义更清晰，读代码的人一眼就知道这是「获取用户列表」。

- **参数有类型提示** —— 函数定义了参数类型，调用时 IDE 会提示你传什么、少传了什么。直接写 `request.get` 的话，参数写错了也没人提醒。

- **修改方便** —— 后端改了接口路径或者参数名，你只需要改这个函数，不用改所有调用的地方。

- **可以加额外逻辑** —— 比如有些接口需要特殊处理参数（格式化日期、转换字段名），可以在函数里做完再发请求。

### 4. api/product.ts

```ts
import request from '@/utils/request'
import type { PageParams, PageResult } from '@/types/api'

export interface Product {
  id: number
  name: string
  price: number
  stock: number
  cover: string
  images: string[]
  description: string
  categoryId: number
  status: 0 | 1
}

export type ProductCreateParams = Omit<Product, 'id'>
export type ProductUpdateParams = Partial<ProductCreateParams>

export function getProductList(params: PageParams & {
  keyword?: string
  categoryId?: number
  status?: 0 | 1
}) {
  return request.get<PageResult<Product>>('/products', { params })
}

export function getProductDetail(id: number) {
  return request.get<Product>(`/products/${id}`)
}

export function createProduct(data: ProductCreateParams) {
  return request.post<Product>('/products', data)
}

export function updateProduct(id: number, data: ProductUpdateParams) {
  return request.put<Product>(`/products/${id}`, data)
}

export function deleteProduct(id: number) {
  return request.delete(`/products/${id}`)
}

export function updateProductStatus(id: number, status: 0 | 1) {
  return request.patch(`/products/${id}/status`, { status })
}
```

### 5. Vue 组件使用示例

```vue
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import {
  getProductList,
  deleteProduct,
  updateProductStatus,
  type Product,
} from '@/api/product'

const loading = ref(false)
const finished = ref(false)

const query = reactive({
  page: 1,
  size: 10,
  keyword: '',
  status: undefined as 0 | 1 | undefined,
})

const productList = ref<Product[]>([])
const total = ref(0)

const fetchList = async (isRefresh = false) => {
  if (isRefresh) {
    query.page = 1
    finished.value = false
    productList.value = []
  }
  if (finished.value) return

  loading.value = true
  try {
    const res = await getProductList({
      page: query.page,
      size: query.size,
      keyword: query.keyword,
      status: query.status,
    })
    const { list, total: totalCount } = res

    productList.value = isRefresh ? list : [...productList.value, ...list]
    total.value = totalCount

    if (productList.value.length >= totalCount) {
      finished.value = true
    } else {
      query.page++
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (item: Product) => {
  try {
    await showConfirmDialog({ title: '提示', message: `确定删除「${item.name}」吗？` })
    await deleteProduct(item.id)
    showToast('删除成功')
    fetchList(true)
  } catch (error) {
    if (error === 'cancel') return
  }
}

const handleToggleStatus = async (item: Product) => {
  try {
    const newStatus = item.status === 1 ? 0 : 1
    await updateProductStatus(item.id, newStatus)
    item.status = newStatus
    showToast(newStatus === 1 ? '已上架' : '已下架')
  } catch (error) {
    console.error('状态切换失败:', error)
  }
}

const handleSearch = () => {
  fetchList(true)
}

onMounted(() => {
  fetchList(true)
})
</script>

<template>
  <div class="product-list">
    <van-search v-model="query.keyword" placeholder="搜索商品" @search="handleSearch" />

    <van-radio-group v-model="query.status" direction="horizontal" @change="handleSearch">
      <van-radio :value="undefined">全部</van-radio>
      <van-radio :value="1">上架中</van-radio>
      <van-radio :value="0">已下架</van-radio>
    </van-radio-group>

    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="fetchList(false)"
    >
      <div
        v-for="item in productList"
        :key="item.id"
        class="product-item"
      >
        <img :src="item.cover" class="product-cover" />
        <div class="product-info">
          <h3 class="product-name">{{ item.name }}</h3>
          <p class="product-price">¥{{ (item.price / 100).toFixed(2) }}</p>
          <p class="product-stock">库存：{{ item.stock }}</p>
        </div>
        <div class="product-actions">
          <van-button size="small" type="primary" @click="handleToggleStatus(item)">
            {{ item.status === 1 ? '下架' : '上架' }}
          </van-button>
          <van-button size="small" type="danger" @click="handleDelete(item)">
            删除
          </van-button>
        </div>
      </div>
    </van-list>
  </div>
</template>

<style scoped>
.product-list { padding-bottom: 20px; }
.product-item {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #eee;
  gap: 12px;
}
.product-cover {
  width: 80px; height: 80px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}
.product-info { flex: 1; min-width: 0; }
.product-name {
  font-size: 14px; font-weight: 500;
  margin: 0 0 4px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.product-price {
  font-size: 16px; color: #f56c6c; font-weight: bold;
  margin: 0 0 4px;
}
.product-stock { font-size: 12px; color: #999; margin: 0; }
.product-actions {
  display: flex; flex-direction: column;
  gap: 8px; justify-content: center;
}
</style>
```

注意组件里的代码：`await getProductList(...)` 直接拿到的就是业务数据，**不需要** `.data.data` 层层解包——拦截器已经帮你处理了。错误提示也不用写，拦截器统一弹了。

***

## 八、后端接口实现

以前端用到的商品接口为例，看看后端是怎么写的。下面用 Node.js + Express + Mongoose（MongoDB）来实现，其他后端框架（Java Spring、Python Django、Go Gin 等）思路是一样的。

### 后端项目结构

```
server/
├── app.js                ← 入口：Express 实例、中间件、路由挂载
├── models/
│   └── Product.js        ← 数据模型（Mongoose Schema）
├── routes/
│   ├── auth.js           ← 认证路由
│   └── products.js       ← 商品路由
├── middleware/
│   └── auth.js           ← Token 验证中间件
└── utils/
    └── response.js       ← 统一响应格式
```

**为什么后端也要分层？**

和前端分层的思路一样——每层只做一件事：

- **models**：管数据结构和数据库操作

- **routes**：管接口定义和参数接收

- **middleware**：管通用逻辑（认证、日志、权限校验）

- **utils**：管工具函数

分层之后，改数据库结构就去 models，改接口就去 routes，加通用逻辑就写 middleware，不会把所有代码搅在一个文件里。

### 1. 统一响应格式：utils/response.js

前后端先约定好所有接口的返回格式，前端拦截器才能统一处理：

```js
// 成功响应
exports.success = (data = null, message = 'success') => {
  return {
    code: 0,
    message,
    data,
  }
}

// 业务错误响应
exports.fail = (message = 'error', code = 1) => {
  return {
    code,
    message,
    data: null,
  }
}
```

所有接口都返回 `{ code, message, data }` 结构，前端按 `code === 0` 判断成功。

**为什么所有接口要统一响应格式？**

如果每个接口各返回各的结构：

- 登录接口返回 `{ token, user }`

- 商品列表返回 `{ list, total }`

- 错误的时候返回 `{ error: 'xxx' }`

前端根本没法统一处理——你得每个接口各自判断成功失败、各自取数据。前端的响应拦截器就废了。

统一格式之后，前端只需要判断 `code === 0` 就知道成功了，然后从 `data` 里拿业务数据。所有接口的处理逻辑都是一样的，才能写进拦截器里。

**三个字段的分工：**

| 字段        | 作用                | 示例                            |
| --------- | ----------------- | ----------------------------- |
| `code`    | 业务状态码，前端用它判断成功失败  | `0` 成功，`401` 未登录，`1001` 库存不足  |
| `message` | 人类可读的提示信息，直接弹给用户看 | "创建成功"、"用户名已存在"               |
| `data`    | 真正的业务数据，成功时才有值    | `{ list: [...], total: 100 }` |

### 2. 数据模型：models/Product.js

定义数据库表结构：

```js
const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,    // 单位：分
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    default: 0,
  },
  cover: {
    type: String,
  },
  images: {
    type: [String],
    default: [],
  },
  description: {
    type: String,
    default: '',
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  status: {
    type: Number,    // 0=下架，1=上架
    default: 1,
    enum: [0, 1],
  },
}, {
  timestamps: true,  // 自动加 createdAt 和 updatedAt
})

module.exports = mongoose.model('Product', productSchema)
```

**MongoDB 不是无模式的吗？为什么还要定义 Schema？**

MongoDB 本身确实不要求集合里的文档结构一致——你可以第一条存 5 个字段，第二条存 8 个字段。但实际项目里，你肯定希望数据结构是可控的：

1. **数据一致性** —— 所有商品文档结构一样，查询和处理时不用判断「这个字段有没有」。
2. **类型校验** —— `price` 必须是数字、`name` 必填、`status` 只能是 0 或 1。Mongoose 在写入前自动校验，脏数据进不了数据库。
3. **默认值** —— `stock` 默认 0、`status` 默认 1，不用每次创建时都传。
4. **代码提示** —— 有了 Schema，IDE 能根据字段名给你自动补全，不容易写错。

简单说：Schema 是给数据上的「护栏」，防止你把乱七八糟的数据写进数据库。

### 3. Token 验证中间件：middleware/auth.js

从请求头读取 Token，验证后把用户信息挂到 `req.user` 上，后续路由直接用：

```js
const jwt = require('jsonwebtoken')
const { fail } = require('../utils/response')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

module.exports = (req, res, next) => {
  // 1. 从请求头取出 Token
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(fail('未登录或登录已过期', 401))
  }

  const token = authHeader.slice(7)  // 去掉 "Bearer " 前缀

  try {
    // 2. 验证 Token
    const decoded = jwt.verify(token, JWT_SECRET)

    // 3. 把用户信息挂到 req 上，后面的路由可以直接用 req.user
    req.user = decoded
    next()
  } catch (err) {
    // Token 无效或过期
    return res.status(401).json(fail('登录已过期，请重新登录', 401))
  }
}
```

使用方式：在需要登录的路由上加上这个中间件即可。

**为什么要把 Token 验证抽成中间件？**

如果不抽，每个需要登录的接口都要写一遍取 Token、验 Token 的代码，10 个接口就复制 10 遍。哪天要改验证逻辑，你得改 10 处。

中间件的好处：

1. **代码复用** —— 写一次，所有需要登录的路由都能用
2. **职责分离** —— 路由只关心业务逻辑，不管认证的事
3. **灵活挂载** —— 哪些接口需要登录、哪些不需要，通过是否加中间件来控制。比如商品列表不用登录就能看，创建商品必须登录
4. **可以串联多个** —— 先过认证中间件，再过权限中间件，再过日志中间件……每个中间件只干一件事

**为什么把用户信息挂到 req.user 上？**

中间件验证完 Token 就知道用户是谁了，但路由处理函数还不知道。把用户信息挂到 `req` 上（`req.user`），后面的路由就能直接拿到当前登录用户的 ID、角色等信息，不用再解析一次 Token。

比如创建商品的接口，你可能需要记录「是谁创建的」，直接从 `req.user.userId` 取就行。

### 4. 商品路由：routes/products.js

对照前端的 6 个接口，后端一一实现：

```js
const express = require('express')
const router = express.Router()
const Product = require('../models/Product')
const { success, fail } = require('../utils/response')
const auth = require('../middleware/auth')

// ---------- 1. 获取商品列表（分页） ----------
// 对应前端：getProductList
// GET /products?page=1&size=10&keyword=xxx&status=1
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const { keyword, categoryId, status } = req.query

    // 构建查询条件
    const query = {}

    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' }  // 模糊查询，不区分大小写
    }
    if (categoryId) {
      query.categoryId = categoryId
    }
    if (status !== undefined) {
      query.status = parseInt(status)
    }

    // 查询总数
    const total = await Product.countDocuments(query)

    // 查询分页数据
    const list = await Product.find(query)
      .sort({ createdAt: -1 })          // 按创建时间倒序
      .skip((page - 1) * size)          // 跳过前面的
      .limit(size)                      // 取 size 条

    const pages = Math.ceil(total / size)

    res.json(success({ list, total, page, size, pages }))
  } catch (err) {
    console.error('获取商品列表失败:', err)
    res.status(500).json(fail('服务器内部错误'))
  }
})

// ---------- 2. 获取商品详情 ----------
// 对应前端：getProductDetail
// GET /products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json(fail('商品不存在'))
    }

    res.json(success(product))
  } catch (err) {
    console.error('获取商品详情失败:', err)
    res.status(500).json(fail('服务器内部错误'))
  }
})

// ---------- 3. 创建商品 ----------
// 对应前端：createProduct
// POST /products  （需要登录）
router.post('/', auth, async (req, res) => {
  try {
    const product = new Product(req.body)
    await product.save()
    res.json(success(product))
  } catch (err) {
    console.error('创建商品失败:', err)
    if (err.name === 'ValidationError') {
      return res.status(400).json(fail(err.message))
    }
    res.status(500).json(fail('服务器内部错误'))
  }
})

// ---------- 4. 修改商品 ----------
// 对应前端：updateProduct
// PUT /products/:id  （需要登录）
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }  // new: 返回更新后的数据
    )

    if (!product) {
      return res.status(404).json(fail('商品不存在'))
    }

    res.json(success(product))
  } catch (err) {
    console.error('修改商品失败:', err)
    res.status(500).json(fail('服务器内部错误'))
  }
})

// ---------- 5. 删除商品 ----------
// 对应前端：deleteProduct
// DELETE /products/:id  （需要登录）
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)

    if (!product) {
      return res.status(404).json(fail('商品不存在'))
    }

    res.json(success(null, '删除成功'))
  } catch (err) {
    console.error('删除商品失败:', err)
    res.status(500).json(fail('服务器内部错误'))
  }
})

// ---------- 6. 修改商品状态（上下架） ----------
// 对应前端：updateProductStatus
// PATCH /products/:id/status  （需要登录）
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body

    if (status !== 0 && status !== 1) {
      return res.status(400).json(fail('状态值不合法'))
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    if (!product) {
      return res.status(404).json(fail('商品不存在'))
    }

    res.json(success(product))
  } catch (err) {
    console.error('修改商品状态失败:', err)
    res.status(500).json(fail('服务器内部错误'))
  }
})

module.exports = router
```

**为什么列表接口要分页？**

数据量小的时候无所谓，一旦有几千几万条数据：

- **前端渲染慢** —— 一次性渲染几万条 DOM，页面会卡

- **传输慢** —— 几万条数据的 JSON 可能几 MB，加载慢还费流量

- **数据库压力大** —— 全量查询费内存、占连接

分页每次只取 10 条或 20 条，快得多，用户也不需要一次看那么多。

**为什么要用 try/catch 包起来？**

数据库操作可能出错（连接断了、字段不合法、数据不存在等），如果不 catch，异常会往上冒，最终导致 Node 进程崩溃。

用 try/catch 捕获后：

- 记录错误日志（方便排查）

- 给前端返回友好的错误信息（500 + "服务器内部错误"）

- 服务不会崩，还能继续处理其他请求

### 5. 登录接口：routes/auth.js

```js
const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { success, fail } = require('../utils/response')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '7d'  // Token 有效期 7 天

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // 1. 查找用户
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(400).json(fail('用户名或密码错误'))
    }

    // 2. 验证密码（bcrypt 哈希对比）
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(400).json(fail('用户名或密码错误'))
    }

    // 3. 生成 Token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // 4. 返回 Token + 用户信息（密码字段不要返回）
    const userInfo = {
      id: user._id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      role: user.role,
    }

    res.json(success({ token, userInfo }))
  } catch (err) {
    console.error('登录失败:', err)
    res.status(500).json(fail('服务器内部错误'))
  }
})

module.exports = router
```

**为什么密码要用 bcrypt 哈希，不能明文存？**

绝对不能明文存密码，原因很简单：

1. **数据库泄露了怎么办？** —— 如果明文存，拖库之后所有用户的密码直接暴露。很多用户在不同网站用同一个密码，一个站泄露，其他站也危险。
2. **内部人员也不能看** —— 就算是你自己开发的系统，你也不应该知道用户的密码。

bcrypt 的特点：

- **单向加密** —— 只能从密码算哈希，不能从哈希反推出密码

- **加盐** —— 相同的密码，每次哈希结果都不一样，防彩虹表攻击

- **可配置强度** —— 可以调整计算耗时，让暴力破解变得不划算

登录时用 `bcrypt.compare(用户输入的密码, 数据库存的哈希)` 来验证，正确就通过，错误就拒绝。

**为什么用户名错误和密码错误返回一样的提示？**

安全考虑。如果返回「用户名不存在」和「密码错误」两种不同的提示，攻击者可以先枚举哪些用户名存在，再专门破解这些账号的密码。统一返回「用户名或密码错误」，攻击者就不知道是用户名错了还是密码错了，增加破解难度。

**为什么不把密码字段返回给前端？**

哪怕是哈希后的密码，也不应该返回给前端。越少暴露敏感信息越好。前端只需要展示用户信息，不需要知道密码哈希是什么。

### 6. 入口文件：app.js

```js
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000

// 连接 MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shop')
  .then(() => console.log('MongoDB 连接成功'))
  .catch(err => console.error('MongoDB 连接失败:', err))

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())  // 解析 JSON 请求体

// 挂载路由
app.use('/auth', require('./routes/auth'))
app.use('/products', require('./routes/products'))
app.use('/users', require('./routes/users'))

// 启动服务
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})
```

**为什么要配 CORS？**

浏览器的同源策略规定：不同域名/端口之间，默认不能互相发请求。前端在 `localhost:5173`，后端在 `localhost:3000`，端口不一样，属于跨域，浏览器会拦住请求。

后端配置 CORS（Cross-Origin Resource Sharing），就是告诉浏览器：「我允许这个域名来访问我」。浏览器收到响应头里的 `Access-Control-Allow-Origin` 字段，发现包含前端的域名，就放行。

**为什么 origin 不能设成** **`*`？**

`*` 表示允许所有域名访问，这样最方便但不安全——任何网站都能调用你的接口。而且如果用了 `credentials: true`（携带 Cookie），浏览器规定 `origin` 不能是 `*`，必须是具体的域名。

生产环境一定要设置具体的前端域名，不要用 `*`。

**`express.json()`** **是干嘛的？**

POST/PUT 请求的 JSON 数据放在请求体（body）里，Express 默认不会解析它，你直接读 `req.body` 会是 `undefined`。

`express.json()` 是 Express 内置的中间件，它会把请求体里的 JSON 字符串解析成 JavaScript 对象，挂到 `req.body` 上，这样路由里就能直接用 `req.body` 拿到数据了。

***

## 九、前后端如何对接

前后端对接不是各自写完就完事了，有几个关键的约定和联调步骤。

### 对接前的约定

在写代码之前，先把下面几件事定好，避免后期返工：

| 约定项      | 说明            | 示例                          |
| -------- | ------------- | --------------------------- |
| 接口路径     | 每个接口的 URL 和方法 | `GET /products`             |
| 请求参数     | 参数名、类型、是否必填   | `page: number, 必填`          |
| 响应格式     | 统一的返回结构       | `{ code, message, data }`   |
| 状态码      | 业务状态码的含义      | `0=成功, 401=未登录`             |
| Token 方式 | 放哪里、前缀是什么     | `Authorization: Bearer xxx` |
| 分页格式     | 入参和返参的字段名     | `page/size`，返回 `list/total` |

这些约定可以写在接口文档里（比如用 Apifox、Swagger），前后端都照着文档来。

**为什么要先约定再开发？**

如果不约定，前后端各写各的：

- 前端觉得参数叫 `pageNum`，后端写的是 `page` → 对接不上

- 前端觉得成功是 `code: 200`，后端觉得是 `code: 0` → 所有接口都报错

- 前端觉得 Token 放 `X-Token` 头，后端觉得放 `Authorization` → 永远 401

到了联调的时候才发现这些问题，改起来费时间，还容易互相甩锅。

先约定好，两边照着同一份文档写，联调就很顺。

### 前后端职责分工

| 环节   | 前端做什么         | 后端做什么           |
| ---- | ------------- | --------------- |
| 发送请求 | 调用 axios，传参数  | 接收请求，解析参数       |
| 身份认证 | 存 Token，请求时带上 | 验证 Token，解析用户   |
| 参数校验 | 基础格式校验（非空、长度） | 完整业务校验（权限、唯一性）  |
| 错误处理 | 用户友好的提示       | 返回正确的状态码和错误信息   |
| 数据展示 | 渲染页面          | 从数据库查数据，按约定格式返回 |

简单说：**前端负责展示和交互，后端负责数据和业务逻辑。**

**为什么参数校验要做两遍？**

- **前端校验**是为了**用户体验** —— 用户填错了立刻提示，不用等请求发出去才知道错了。比如手机号少一位、密码太短，前端直接拦住，省一次网络请求。

- **后端校验**是为了**数据安全** —— 前端校验是可以绕过的（懂点技术的人用 Postman 就能直接发请求）。后端必须独立校验，确保进数据库的数据都是合法的。

前端校验是「第一道防线」，后端校验是「最后一道防线」，两道都要有。

### 联调步骤

1. **后端先起服务** —— 确保接口能正常返回（用 Postman 或 Apifox 先测通）
2. **前端配好代理** —— `vite.config.ts` 里的 proxy 指向后端地址
3. **逐个接口对接** —— 从登录接口开始，然后是列表、详情、增删改
4. **调试工具** —— 浏览器 F12 → Network 面板，看请求参数和响应数据对不对
5. **常见问题排查**：

   - 404 → 路径写错了，或者后端没起

   - 401 → Token 没传，或者过期了

   - 400 → 参数格式不对，对照文档检查

   - 500 → 后端代码报错了，看后端日志

   - CORS 错误 → 后端没配跨域，或者前端代理没配好

### 一个完整的请求链路

以「获取商品列表」为例，数据从点击到展示经历了这些步骤：

```
用户进入页面
  ↓
Vue 组件 onMounted → 调用 fetchList()
  ↓
调用 api/product.ts 里的 getProductList(params)
  ↓
request.ts 发出 GET 请求
  ↓
请求拦截器：加 Token、开 Loading
  ↓
Vite 代理：/api/products → http://localhost:3000/products
  ↓
后端路由匹配：GET /products
  ↓
后端查 MongoDB → 组装分页数据 → 返回 { code:0, data:{ list, total } }
  ↓
响应拦截器：关 Loading、检查 code、返回 data
  ↓
组件拿到 list 和 total → 渲染到页面
```

***

## 十、总结

前后端对接的核心要素：

1. **HTTP 方法** —— GET 查、POST 增、PUT/PATCH 改、DELETE 删，和数据库操作对应。
2. **RESTful 风格** —— URL 是资源（名词），方法是操作（动词），让接口好懂、好沟通、好扩展。
3. **URL 命名** —— 后端路由决定 URL，前端照着写。标准 CRUD 用 RESTful，特殊动作（登录/批量/上传）灵活处理。
4. **前端封装** —— axios 实例 + 请求拦截器（加 Token、开 Loading）+ 响应拦截器（错误处理、数据解包），把重复逻辑抽到一处。
5. **后端实现** —— 路由 + 模型 + 中间件 + 统一响应格式，分层组织，每层只做一件事。
6. **Token 认证** —— 登录签发 → 前端存储 → 请求携带 → 后端验证 → 过期重登。无状态、跨域友好。
7. **对接约定** —— 路径、参数、响应格式、状态码，先约定再开发，联调时少踩坑。

把这几件事理顺了，前后端对接就是一件很机械的事——按约定写接口，按文档联调，出问题看 Network。
