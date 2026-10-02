---
title: "Node.js 快速入门：从前端 JS 到写接口"
published: 2026-09-08
description: "从前端 JS 到写接口：Node.js 基础、模块系统、Express 框架、中间件、连接数据库全流程。"
tags: ["Node.js","Express"]
category: "后端"
image: "/blogs/后端/nodejs-cover.jpg"
author: "jojo"
draft: false
comment: true
lang: "zh-CN"
aiPolished: false
---
# Node.js 快速入门：从前端 JS 到写接口

> 目录
>
> 1. [Node.js 是什么](#一nodejs-是什么)
> 2. [快速上手：你的第一个 Node 程序](#二快速上手你的第一个-node-程序)
> 3. [模块系统：require 和 import](#三模块系统require-和-import)
> 4. [Express 框架：写接口的利器](#四express-框架写接口的利器)
> 5. [中间件：请求的流水线](#五中间件请求的流水线)
> 6. [连接数据库](#六连接数据库)
> 7. [实战：一套完整的 CRUD 接口](#七实战一套完整的-crud-接口)
> 8. [错误处理和统一响应](#八错误处理和统一响应)
> 9. [项目结构怎么组织](#九项目结构怎么组织)
> 10. [面试八股](#十面试八股)
> 11. [总结](#十一总结)

---

## 一、Node.js 是什么

一句话：**Node.js 是跑在服务器上的 JavaScript。**

你已经会写前端 JS 了，那 Node.js 对你来说就不是一门新语言——还是那个 JS，只是运行环境从浏览器搬到了服务器。

### 浏览器 JS vs Node.js

| 对比项 | 浏览器里的 JS | Node.js |
|--------|-------------|---------|
| 运行环境 | 浏览器（Chrome/Firefox） | 服务器（V8 引擎） |
| 能做什么 | 操作 DOM、发请求、画页面 | 读写文件、操作数据库、监听端口 |
| 顶层对象 | `window` | `global` / `globalThis` |
| 模块系统 | ES Module（import） | CommonJS（require）+ ES Module |
| 内置 API | DOM API、fetch、localStorage | fs、path、http、crypto |
| 运行方式 | 浏览器打开网页 | 命令行 `node xxx.js` |

**相同的地方**：语法一样、数据类型一样、数组方法一样、Promise/async-await 一样。这些你都已经会了。

**不同的地方**：Node.js 没有 DOM、没有 window，但多了很多服务器端的能力——读写文件、连接数据库、开 HTTP 服务等。

> 打个比方：JS 就像一个人，在浏览器里他是「前端工程师」，负责页面和交互；到了服务器上他变成了「后端工程师」，负责接口和数据库。还是那个人，只是工作内容不一样了。

### Node.js 能干嘛？

- **写接口** —— 给前端提供 API（最常用）
- **做工具** —— 打包工具（Vite/Webpack）、脚手架、脚本
- **做中间层** —— BFF，前端 → Node → 后端服务
- **实时应用** —— 聊天室、协同编辑（WebSocket）
- **全栈开发** —— 前后端都用 JS，一种语言走天下

---

## 二、快速上手：你的第一个 Node 程序

### 1. 安装

去 [nodejs.org](https://nodejs.org) 下载 LTS 版本（长期支持版），一路下一步安装就行。

安装完打开命令行，验证一下：

```bash
node -v    # 输出版本号，比如 v20.x.x
npm -v     # npm 是 Node 的包管理器，跟着一起装的
```

### 2. 写第一个程序

新建一个 `hello.js`：

```js
// hello.js
console.log('Hello Node.js!')

const name = '前端仔'
console.log(`你好，${name}，欢迎来到后端世界`)

// 数组方法和浏览器里一模一样
const nums = [1, 2, 3]
console.log(nums.map(n => n * 2))  // [2, 4, 6]

// Promise 也一样
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function test() {
  console.log('等 1 秒...')
  await delay(1000)
  console.log('1 秒到了！')
}
test()
```

运行：

```bash
node hello.js
```

看到输出了吗？和浏览器控制台的输出几乎一样，只是没有 DOM 相关的东西。

### 3. 前后端 JS 的核心区别

前端 JS 是**事件驱动**的——用户点按钮、滚动页面，触发事件，执行回调。

Node.js 也是**事件驱动**的——收到请求、文件读取完成、数据库返回结果，触发事件，执行回调。

两者都是**单线程 + 事件循环**。这意味着你在前端对异步编程的理解（Promise、async/await、事件循环），到 Node.js 里完全适用。

> 你已经掌握了 Node.js 70% 的知识——剩下的 30% 是 Node 的内置 API 和框架用法。

---

## 三、模块系统：require 和 import

前端你习惯了 `import xxx from 'xxx'`，Node.js 里有两种模块系统。

### CommonJS（老方式，用 require）

Node.js 默认的模块系统：

```js
// 导出：module.exports
// utils.js
function add(a, b) {
  return a + b
}

module.exports = { add }
```

```js
// 导入：require
// app.js
const { add } = require('./utils')
console.log(add(1, 2))  // 3
```

### ES Module（新方式，用 import）

和前端写法一样。要启用的话：

方式一：文件名改成 `.mjs`

方式二：`package.json` 里加 `"type": "module"`

```json
{
  "type": "module"
}
```

```js
// utils.js
export function add(a, b) {
  return a + b
}
```

```js
// app.js
import { add } from './utils.js'
console.log(add(1, 2))
```

### 怎么选？

- 老项目、Node.js 教程 → 一般是 CommonJS（require）
- 新项目、和前端统一 → 用 ES Module（import）
- 两者功能差不多，只是语法不一样

> 后面的例子都用 CommonJS（require），因为 Express 和大部分第三方包的文档都是用的 require 写法，看起来更方便。

### 内置模块

Node.js 自带很多有用的模块，不用装，直接用：

| 模块 | 作用 | 类比前端 |
|------|------|---------|
| `fs` | 读写文件 | 没有对应（浏览器不让你随便读文件） |
| `path` | 处理路径 | — |
| `http` | 创建 HTTP 服务 | — |
| `crypto` | 加密（md5、sha256） | crypto API |
| `events` | 事件触发器 | 类似 EventTarget |
| `os` | 操作系统信息 | navigator |

简单用一下 `fs`：

```js
const fs = require('fs')

// 读文件
fs.readFile('./data.txt', 'utf-8', (err, data) => {
  if (err) {
    console.error('读取出错:', err)
    return
  }
  console.log('文件内容:', data)
})

// 写文件
fs.writeFile('./output.txt', 'Hello Node.js', (err) => {
  if (err) console.error('写入失败')
  else console.log('写入成功')
})
```

### 第三方包（npm）

和前端一样，用 npm 安装第三方包：

```bash
npm init -y          # 初始化项目，生成 package.json
npm install express  # 安装 express
```

然后 `require('express')` 就能用了。和前端 `npm install` 一样一样的。

---

## 四、Express 框架：写接口的利器

原生的 Node.js 也能写 HTTP 服务，但很麻烦。Express 是最流行的 Node.js 后端框架，帮你封装了底层细节，写接口又快又爽。

> Express 之于 Node，就像 Vue 之于前端——原生也能写，但用框架效率高多了。

### 安装

```bash
npm init -y
npm install express
```

### 第一个接口

```js
// app.js
const express = require('express')
const app = express()
const port = 3000

// GET 接口：/hello
app.get('/hello', (req, res) => {
  res.send('Hello Express!')
})

// 启动服务
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`)
})
```

运行：

```bash
node app.js
```

浏览器打开 `http://localhost:3000/hello`，看到 `Hello Express!` 就成功了。

### req 和 res

每个路由处理函数都有两个参数：

| 参数 | 全称 | 作用 | 类比前端 |
|------|------|------|---------|
| `req` | request | 请求对象，包含前端传来的所有信息 | — |
| `res` | response | 响应对象，用来给前端返回数据 | — |

**req 常用属性：**

```js
app.get('/user/:id', (req, res) => {
  req.params.id        // 路径参数：/user/123 → "123"
  req.query.name       // 查询参数：/user?name=张三 → "张三"
  req.body             // 请求体（POST/PUT 的数据）
  req.headers          // 请求头
  req.method           // 请求方法：GET/POST...
  req.path             // 路径：/user/123
})
```

**res 常用方法：**

```js
res.send('字符串')      // 返回字符串
res.json({ code: 0 })  // 返回 JSON（最常用）
res.status(404).json({ message: '不存在' })  // 设置状态码 + 返回 JSON
res.redirect('/login')  // 重定向
res.sendFile('./index.html')  // 返回文件
```

### 写几个接口试试

```js
const express = require('express')
const app = express()

// 解析 JSON 请求体（必须加，不然 req.body 是 undefined）
app.use(express.json())

// GET 列表
app.get('/users', (req, res) => {
  res.json({
    code: 0,
    data: [
      { id: 1, name: '张三' },
      { id: 2, name: '李四' },
    ],
  })
})

// GET 详情
app.get('/users/:id', (req, res) => {
  const id = req.params.id
  res.json({
    code: 0,
    data: { id, name: '用户' + id },
  })
})

// POST 创建
app.post('/users', (req, res) => {
  const { name, age } = req.body
  res.json({
    code: 0,
    message: '创建成功',
    data: { id: 3, name, age },
  })
})

// PUT 修改
app.put('/users/:id', (req, res) => {
  res.json({
    code: 0,
    message: '修改成功',
    data: { id: req.params.id, ...req.body },
  })
})

// DELETE 删除
app.delete('/users/:id', (req, res) => {
  res.json({
    code: 0,
    message: '删除成功',
  })
})

app.listen(3000, () => console.log('服务启动了'))
```

用 Postman 或 Apifox 测试一下，五个接口都能正常返回。

**前端的你是不是觉得很眼熟？** 对，这些就是你天天调用的那些接口——现在你知道它们是怎么写出来的了。

---

## 五、中间件：请求的流水线

中间件是 Express 最核心的概念。理解了中间件，就理解了 Express。

### 什么是中间件

想象一个工厂的流水线：

```
请求进来 → 中间件1 → 中间件2 → 中间件3 → 路由处理 → 响应出去
              ↓          ↓          ↓
            打日志     解析JSON    验证Token
```

每个中间件都可以：
- 读取和修改 req、res
- 决定是否继续往下走（`next()`）
- 直接返回响应（不往下走了）

### 写一个最简单的中间件

```js
// 日志中间件：每个请求都打印一下时间和路径
function logger(req, res, next) {
  console.log(`${new Date().toLocaleString()} ${req.method} ${req.path}`)
  next()  // 继续下一个中间件/路由
}

app.use(logger)  // 注册中间件
```

**`next()` 是什么？** 调用 `next()` 就是「我处理完了，交给下一个」。不调用 `next()` 请求就卡在这里了，不会继续往下走。

### 常用的内置中间件

```js
// 解析 JSON 请求体（最常用）
app.use(express.json())

// 解析 URL 编码的表单数据
app.use(express.urlencoded({ extended: true }))

// 静态文件服务（把 public 目录下的文件直接当静态资源访问）
app.use(express.static('public'))
```

`express.json()` 你已经用过了——没有它，`req.body` 就是 `undefined`。它的工作就是：把请求体里的 JSON 字符串解析成 JS 对象，挂到 `req.body` 上。

### 路由级中间件

不是所有接口都需要的中间件，可以只加在某个路由上：

```js
// 登录验证中间件
function auth(req, res, next) {
  const token = req.headers.authorization
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }
  // 验证 token...
  req.user = { id: 1, name: '张三' }  // 把用户信息挂到 req 上
  next()
}

// 只有这个接口需要登录
app.get('/profile', auth, (req, res) => {
  res.json({ code: 0, data: req.user })
})

// 这个接口不需要登录
app.get('/products', (req, res) => {
  res.json({ code: 0, data: [] })
})
```

`auth` 中间件就加在 `/profile` 这一个路由上，其他路由不受影响。

### 中间件的执行顺序

**中间件是按注册顺序执行的，从上到下。**

```js
app.use(middleware1)  // 1
app.use(middleware2)  // 2
app.get('/', handler) // 3
```

请求来了，先过 1，再过 2，最后到 3。顺序很重要——比如 `express.json()` 必须写在路由前面，不然路由处理时 `req.body` 还没解析好。

> 中间件就像奶茶店的出餐流程：接单 → 做茶 → 加配料 → 打包 → 出餐。每一步只做一件事，做完传给下一个。

---

## 六、连接数据库

光有接口还不行，数据得存在数据库里。Node.js 操作数据库很简单，装个驱动包就行。

下面讲两种最常用的：MySQL 和 MongoDB。

### 方式一：MySQL（用 mysql2）

MySQL 是最流行的关系型数据库，适合结构规整的数据（用户、订单、商品）。

#### 安装

```bash
npm install mysql2
```

#### 连接数据库

```js
const mysql = require('mysql2/promise')  // promise 版本，支持 async/await

// 创建连接池（推荐用连接池，比单连接性能好）
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '你的密码',
  database: 'mydb',
  waitForConnections: true,
  connectionLimit: 10,  // 连接池里最多 10 个连接
})

// 测试连接
async function test() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result')
    console.log('数据库连接成功:', rows[0].result)
  } catch (err) {
    console.error('数据库连接失败:', err.message)
  }
}
test()
```

#### 基本操作

```js
// 查询
async function getUsers() {
  const [rows] = await pool.query('SELECT * FROM users')
  return rows
}

// 条件查询（? 是占位符，防止 SQL 注入）
async function getUserById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id])
  return rows[0]
}

// 插入
async function createUser(name, age) {
  const [result] = await pool.query(
    'INSERT INTO users (name, age) VALUES (?, ?)',
    [name, age]
  )
  return result.insertId  // 返回自增 ID
}

// 更新
async function updateUser(id, name, age) {
  const [result] = await pool.query(
    'UPDATE users SET name = ?, age = ? WHERE id = ?',
    [name, age, id]
  )
  return result.affectedRows  // 影响的行数
}

// 删除
async function deleteUser(id) {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id])
  return result.affectedRows
}
```

**注意**：永远用 `?` 占位符传参数，不要用字符串拼接，不然会有 SQL 注入风险。

### 方式二：MongoDB（用 Mongoose）

MongoDB 是文档型数据库，存的是 JSON 格式的文档，适合结构灵活的数据。

#### 安装

```bash
npm install mongoose
```

#### 连接数据库

```js
const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/mydb')
  .then(() => console.log('MongoDB 连接成功'))
  .catch(err => console.error('MongoDB 连接失败:', err.message))
```

#### 定义模型（Schema + Model）

```js
const mongoose = require('mongoose')

// Schema：定义数据结构
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, default: 18 },
  email: String,
  createAt: { type: Date, default: Date.now },
})

// Model：操作数据库的模型
const User = mongoose.model('User', userSchema)

module.exports = User
```

#### 基本操作

```js
// 查询所有
async function getUsers() {
  return await User.find()
}

// 条件查询
async function getUserById(id) {
  return await User.findById(id)
}

// 插入
async function createUser(name, age) {
  const user = new User({ name, age })
  return await user.save()
}

// 更新
async function updateUser(id, data) {
  return await User.findByIdAndUpdate(id, data, { new: true })
}

// 删除
async function deleteUser(id) {
  return await User.findByIdAndDelete(id)
}
```

### MySQL vs MongoDB 怎么选？

| 对比项 | MySQL | MongoDB |
|--------|-------|---------|
| 数据结构 | 表、行、列，结构固定 | 文档（JSON），结构灵活 |
| 查询语言 | SQL | Mongoose API / MongoDB 语法 |
| 事务支持 | 好 | 一般 |
| 适合场景 | 电商、金融、关系复杂 | 博客、社交、结构多变 |
| 上手难度 | 需要学 SQL | 直接写 JS，前端更容易上手 |

**前端转后端的话，MongoDB + Mongoose 上手更快**——都是 JSON 格式，不用额外学 SQL。但 MySQL 也是必须掌握的，工作中用得很多。

> 后面的实战用 Mongoose 来写，写起来更简洁，重点是理解思路。换成 MySQL 也是一样的流程。

---

## 七、实战：一套完整的 CRUD 接口

现在把 Express + Mongoose 组合起来，写一套完整的用户 CRUD 接口。

### 项目结构

```
my-app/
├── app.js          ← 入口文件
├── models/
│   └── User.js     ← 数据模型
├── routes/
│   └── user.js     ← 用户路由
├── middleware/
│   └── auth.js     ← 认证中间件
└── package.json
```

### 1. 模型：models/User.js

```js
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
    default: '',
  },
  email: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
}, {
  timestamps: true,  // 自动加 createdAt 和 updatedAt
})

// 返回给前端的时候，不要把密码字段返回去
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.password
    return ret
  },
})

module.exports = mongoose.model('User', userSchema)
```

### 2. 路由：routes/user.js

```js
const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { success, fail } = require('../utils/response')

// ---------- 1. 获取用户列表（分页） ----------
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const keyword = req.query.keyword

    const query = {}
    if (keyword) {
      query.username = { $regex: keyword, $options: 'i' }  // 模糊搜索
    }

    const total = await User.countDocuments(query)
    const list = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * size)
      .limit(size)

    res.json(success({ list, total, page, size }))
  } catch (err) {
    res.status(500).json(fail('服务器错误'))
  }
})

// ---------- 2. 获取用户详情 ----------
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json(fail('用户不存在'))
    }
    res.json(success(user))
  } catch (err) {
    res.status(500).json(fail('服务器错误'))
  }
})

// ---------- 3. 创建用户 ----------
router.post('/', async (req, res) => {
  try {
    const { username, password, nickname, email } = req.body

    // 校验：用户名不能重复
    const exists = await User.findOne({ username })
    if (exists) {
      return res.status(400).json(fail('用户名已存在'))
    }

    const user = new User({ username, password, nickname, email })
    await user.save()
    res.json(success(user, '创建成功'))
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json(fail(err.message))
    }
    res.status(500).json(fail('服务器错误'))
  }
})

// ---------- 4. 修改用户 ----------
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!user) {
      return res.status(404).json(fail('用户不存在'))
    }
    res.json(success(user, '修改成功'))
  } catch (err) {
    res.status(500).json(fail('服务器错误'))
  }
})

// ---------- 5. 删除用户 ----------
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
      return res.status(404).json(fail('用户不存在'))
    }
    res.json(success(null, '删除成功'))
  } catch (err) {
    res.status(500).json(fail('服务器错误'))
  }
})

module.exports = router
```

### 3. 入口：app.js

```js
const express = require('express')
const mongoose = require('mongoose')
const userRoutes = require('./routes/user')

const app = express()
const PORT = 3000

// 连接 MongoDB
mongoose.connect('mongodb://localhost:27017/myapp')
  .then(() => console.log('MongoDB 连接成功'))
  .catch(err => console.error('MongoDB 连接失败:', err))

// 中间件
app.use(express.json())  // 解析 JSON

// 挂载路由
app.use('/api/users', userRoutes)

// 启动服务
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})
```

### 4. 统一响应工具：utils/response.js

```js
exports.success = (data = null, message = 'success') => ({
  code: 0,
  message,
  data,
})

exports.fail = (message = 'error', code = 1) => ({
  code,
  message,
  data: null,
})
```

### 完成了！

现在你有了一套完整的用户管理接口：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 用户列表（分页+搜索） |
| GET | `/api/users/:id` | 用户详情 |
| POST | `/api/users` | 创建用户 |
| PUT | `/api/users/:id` | 修改用户 |
| DELETE | `/api/users/:id` | 删除用户 |

用 Postman 测试一下，全都能跑。

> 看到了吗？你前端天天调用的接口，后端就是这么写出来的。路由对应方法，方法里查数据库，返回 JSON。

---

## 八、错误处理和统一响应

### 为什么需要统一错误处理

每个路由都写 `try/catch`，每个 catch 里都写 `res.status(500).json(fail('服务器错误'))`，很重复。而且如果有漏写的，出错了就直接挂了。

可以写一个全局错误处理中间件：

```js
// 放在所有路由的后面
app.use((err, req, res, next) => {
  console.error(err.stack)  // 打日志

  if (err.name === 'ValidationError') {
    return res.status(400).json(fail(err.message))
  }
  if (err.name === 'CastError') {
    return res.status(400).json(fail('参数格式错误'))
  }

  res.status(500).json(fail('服务器内部错误'))
})
```

有了这个，路由里的错误会自动传到这里，不用每个都写 try/catch 了（但还是建议写，方便做特定的错误处理）。

### 404 处理

所有路由都匹配不上的时候，返回 404：

```js
// 放在所有路由之后，错误处理之前
app.use((req, res) => {
  res.status(404).json(fail('接口不存在', 404))
})
```

---

## 九、项目结构怎么组织

小项目怎么放都行，大一点的项目建议分层：

```
server/
├── app.js                ← 入口：创建 app、挂中间件、挂路由
├── config/               ← 配置文件
│   └── index.js
├── models/               ← 数据模型（和数据库打交道）
│   ├── User.js
│   └── Product.js
├── routes/               ← 路由（接收请求、返回响应）
│   ├── user.js
│   ├── product.js
│   └── auth.js
├── controllers/          ← 控制器（业务逻辑，路由调用控制器）
│   ├── user.js
│   └── product.js
├── middleware/           ← 中间件
│   ├── auth.js
│   └── logger.js
├── utils/                ← 工具函数
│   ├── response.js
│   └── jwt.js
└── package.json
```

**每层职责：**

| 层 | 做什么 | 不做什么 |
|----|-------|---------|
| routes | 接收参数、调用 service、返回数据 | 不写业务逻辑 |
| controllers | 处理业务逻辑、校验、调用 model | 不直接操作数据库 |
| models | 数据库操作 | 不写业务逻辑 |
| middleware | 通用逻辑（认证、日志） | — |

> 就像餐厅：服务员（routes）接单 → 厨师（controllers）做菜 → 采购员（models）拿食材。每个岗位只干自己的事。

---

## 十、面试八股

下面是 Node.js + Express 的高频面试题。

### 1. 什么是 Node.js？和浏览器 JS 有什么区别？

**参考答案：**

Node.js 是基于 Chrome V8 引擎的 JavaScript 运行时，让 JS 可以跑在服务器端。

**和浏览器 JS 的区别：**

| 对比项 | 浏览器 JS | Node.js |
|--------|----------|---------|
| 运行环境 | 浏览器 | 服务器 |
| 顶层对象 | window | global |
| 核心能力 | DOM、BOM、Ajax | 文件系统、网络、数据库、进程 |
| 模块系统 | ES Module | CommonJS + ES Module |
| 事件循环 | 宏任务微任务（浏览器版） | 宏任务微任务（Node 版，阶段更多） |
| 用途 | 页面交互 | 服务端开发、工具脚本 |

**相同点**：语法一样，都是基于 V8 引擎，都是单线程 + 事件循环 + 回调，异步编程模型一致。

---

### 2. 什么是 Express 中间件？有哪些类型？

**参考答案：**

中间件是 Express 的核心概念，就是请求到达路由处理之前（或之后）经过的一系列处理函数。每个中间件都可以访问 req 和 res，可以修改它们、决定是否继续。

**类型：**

1. **应用级中间件** —— `app.use()` 注册的，对所有请求生效
2. **路由级中间件** —— 绑在某个路由上的，只对这个路由生效
3. **错误处理中间件** —— 有 4 个参数 `(err, req, res, next)`，专门处理错误
4. **内置中间件** —— Express 自带的，如 `express.json()`、`express.static`
5. **第三方中间件** —— 别人写的，如 `cors`、`body-parser`

**执行顺序**：按注册顺序从上到下执行，调用 `next()` 才会继续往下走。

---

### 3. 什么是 RESTful API？怎么设计？

**参考答案：**

RESTful 是一种接口设计风格，核心是：URL 表示资源（名词），HTTP 方法表示操作（动词）。

**设计原则：**

- GET：查询资源 → `GET /users`、`GET /users/:id`
- POST：创建资源 → `POST /users`
- PUT：全量更新 → `PUT /users/:id`
- PATCH：部分更新 → `PATCH /users/:id/status`
- DELETE：删除资源 → `DELETE /users/:id`

**统一响应格式**：`{ code, message, data }`，code 为 0 表示成功。

**好处**：语义清晰、便于缓存、易于扩展、前后端沟通成本低。

---

### 4. 什么是 SQL 注入？怎么防止？

**参考答案：**

SQL 注入是通过在输入参数中拼接恶意 SQL 语句，来篡改数据库操作的攻击方式。

**例子**：
```js
// ❌ 字符串拼接，有注入风险
const sql = `SELECT * FROM users WHERE username = '${username}'`
// 如果 username 输入 ' OR 1=1 --，SQL 就变成了：
// SELECT * FROM users WHERE username = '' OR 1=1 --'
// 这样能查出所有用户
```

**防止方法：**
1. **使用参数化查询（占位符）** —— 用 `?` 占位，由数据库驱动处理转义
   ```js
   pool.query('SELECT * FROM users WHERE username = ?', [username])
   ```
2. **使用 ORM 框架** —— 如 Sequelize、Mongoose，底层已经做了防注入
3. **输入校验** —— 对用户输入做格式校验和长度限制
4. **最小权限原则** —— 数据库账号只给必要的权限，不给删表等危险权限

---

### 5. 常见的 HTTP 状态码有哪些？分别表示什么？

**参考答案：**

| 状态码 | 含义 | 场景 |
|--------|------|------|
| 200 OK | 成功 | GET/POST/PUT 正常返回 |
| 201 Created | 创建成功 | POST 创建资源成功 |
| 204 No Content | 成功但无返回体 | DELETE 成功 |
| 400 Bad Request | 请求参数错误 | 参数格式不对、缺少必填项 |
| 401 Unauthorized | 未登录/Token 无效 | 需要登录的接口没传 token |
| 403 Forbidden | 没有权限 | 普通用户访问管理员接口 |
| 404 Not Found | 资源不存在 | 路径写错了或数据不存在 |
| 500 Internal Server Error | 服务器内部错误 | 代码报错了、数据库挂了 |

---

### 6. GET 和 POST 的区别？

**参考答案：**

| 对比项 | GET | POST |
|--------|-----|------|
| 作用 | 获取资源 | 创建/提交资源 |
| 参数位置 | URL query | 请求体 body |
| 安全性 | 不安全（参数在 URL 里，会被记录） | 相对安全 |
| 幂等性 | 幂等 | 不幂等 |
| 缓存 | 可以被缓存 | 一般不缓存 |
| 长度限制 | 有（URL 长度限制） | 没有 |
| 书签/分享 | 可以收藏分享 | 不行 |

**本质区别**：语义不同。GET 是读操作，POST 是写操作。

---

### 7. 什么是 JWT？登录流程是怎样的？

**参考答案：**

JWT（JSON Web Token）是一种跨域认证方案，由三部分组成：header（头部）、payload（载荷）、signature（签名），用 `.` 分隔。

**登录流程：**

1. 用户提交用户名密码 → 后端验证
2. 验证通过 → 用密钥签发 JWT → 返回给前端
3. 前端存在 localStorage 或 Cookie
4. 后续请求在 `Authorization` 头里带上 Token
5. 后端中间件验证 Token 签名 → 解析出用户信息 → 执行业务逻辑
6. Token 过期 → 返回 401 → 前端跳转登录

**优点**：无状态（服务端不用存）、跨域友好、移动端适用、可携带信息
**缺点**：签发后无法主动吊销（需要加黑名单机制）、 payload 不能存敏感信息

---

### 8. 什么是事件循环？Node 和浏览器的事件循环有什么不同？

**参考答案：**

事件循环是 JS 实现异步的机制。JS 是单线程的，通过事件循环来处理异步任务，不会阻塞。

**浏览器事件循环**：
- 宏任务：setTimeout、setInterval、DOM 事件、ajax
- 微任务：Promise.then、MutationObserver
- 规则：每个宏任务执行完，清空所有微任务，再渲染，再执行下一个宏任务

**Node.js 事件循环**：
- 分 6 个阶段：timers → pending callbacks → idle/prepare → poll → check → close callbacks
- 微任务在每个阶段切换时执行
- 特有：process.nextTick（优先级比 Promise 还高）、setImmediate（check 阶段）

**前端开发者知道这些就够了**：两者都是「先执行同步代码，再处理微任务，最后处理宏任务」，大体思路是一致的。

---

### 9. 什么是回调地狱？怎么解决？

**参考答案：**

回调地狱（Callback Hell）就是异步操作嵌套太多，代码横向发展，很难看也很难维护。

```js
// 回调地狱
fs.readFile('a.txt', (err, data) => {
  fs.readFile('b.txt', (err, data2) => {
    fs.readFile('c.txt', (err, data3) => {
      // 三层嵌套，还可以继续嵌套...
    })
  })
})
```

**解决方法：**

1. **Promise** —— 用 `.then()` 链式调用，从横向变成纵向
2. **async/await** —— 最优雅，写起来像同步代码一样
   ```js
   async function readAll() {
     const a = await fs.promises.readFile('a.txt', 'utf-8')
     const b = await fs.promises.readFile('b.txt', 'utf-8')
     const c = await fs.promises.readFile('c.txt', 'utf-8')
   }
   ```

async/await 是目前最主流的异步写法，基于 Promise，语法最简洁。

---

### 10. 什么是中间件？你用过哪些中间件？

**参考答案：**

中间件是处理 HTTP 请求的函数，可以在请求到达路由前做一些预处理，也可以在响应返回前做一些处理。

**常用中间件：**

1. **express.json()** —— 解析 JSON 请求体
2. **express.urlencoded()** —— 解析表单数据
3. **express.static()** —— 静态文件服务
4. **cors** —— 跨域处理
5. **morgan** —— 访问日志
6. **helmet** —— 安全头设置
7. **express-jwt** —— JWT 认证
8. **multer** —— 文件上传

中间件让代码模块化、可复用，每个中间件只做一件事，可以自由组合。

---

### 11. 怎么实现登录认证？

**参考答案：**

基于 Token（JWT）的方案：

1. **注册接口** —— 用户名密码校验，密码用 bcrypt 哈希后存数据库
2. **登录接口** —— 查用户 → bcrypt 对比密码 → 生成 JWT → 返回
3. **认证中间件** —— 从请求头取 Token → 验证签名 → 把用户信息挂到 req.user → next()
4. **需要登录的路由** —— 加上认证中间件
5. **登出** —— 前端清除 Token 就行（后端不用管，JWT 是无状态的）

**密码安全**：
- 明文绝对不能存，用 bcrypt 哈希
- bcrypt 是单向的，只能对比不能反推
- 加盐，防彩虹表攻击

---

### 12. 怎么理解 Node.js 的单线程？高并发怎么处理？

**参考答案：**

Node.js 是单线程的——JS 代码只在一个线程里跑。但它能处理高并发，靠的是**事件循环 + 异步 I/O**。

**原理**：
- Node 遇到 I/O 操作（文件读写、网络请求、数据库查询）时，不会傻等结果，而是把操作交给底层的 libuv（线程池 + 操作系统内核）
- JS 继续往下执行别的代码
- I/O 完成后，通过事件回调通知 JS 来处理结果

**就像餐厅服务员**：
- 一个服务员（单线程）同时服务很多桌
- 点完菜就交给厨房（I/O 线程池），服务员继续服务下一桌
- 菜做好了，服务员再端过去（回调处理）

这样一个服务员（单线程）也能服务很多桌（高并发），前提是主要耗时在厨房（I/O）而不是服务员自己做菜（CPU 密集计算）。

所以 Node.js 适合 I/O 密集型的应用（接口服务、实时应用），不适合 CPU 密集型的应用（视频编码、复杂计算）。

---

## 十一、总结

从前端 JS 到 Node.js，最大的优势就是**语言不用重新学**。语法、异步编程、数组方法、Promise/async-await 都是你已经会的。

**核心学习路径：**

1. **Node 基础** —— 模块系统、内置模块、npm（你已经会 70% 了）
2. **Express 框架** —— 路由、中间件、req/res 对象（核心）
3. **数据库** —— MySQL 或 MongoDB 选一个先上手，另一个慢慢学
4. **写接口** —— 结合框架和数据库，写一套完整的 CRUD（练手项目）
5. **进阶** —— 中间件、错误处理、认证、项目结构

**前端转后端最大的思维转变：**
- 前端是「用户视角」——页面长什么样、交互怎么操作
- 后端是「数据视角」——数据怎么存、接口怎么设计、安全怎么保障

不用怕，你已经有 JS 基础了，学 Node.js 就是学一些新的 API 和框架用法。写两个小项目（比如 TodoList 后端、博客后端），很快就能上手。
