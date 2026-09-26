---
title: "AI智能旅游助手 - 全栈面试问答"
published: 2026-09-12
description: ""
tags: []
category: "面试经验"
draft: false
lang: "zh-CN"
---


> 基于 Vue 3 + Express + MongoDB 的智能旅游规划应用面试准备

---

## 一、项目架构与技术选型

### 1. 为什么选择 Vue 3 + Express + MongoDB 这个技术栈？

**回答：**

选择这个技术栈主要基于以下考虑：

**前端选择 Vue 3：**
- **Composition API**：提供更好的代码组织和复用能力，适合中等规模项目
- **响应式系统**：基于 Proxy 的响应式更高效、更灵活
- **生态成熟**：Vite 构建工具、Vue Router、Pinia 等周边库完善
- **学习曲线平缓**：语法简洁，上手快，适合快速开发

**后端选择 Express：**
- **轻量级**：无预设架构，可灵活设计
- **中间件生态丰富**：认证、日志、错误处理等中间件成熟
- **社区活跃**：文档丰富，问题容易找到解决方案
- **与 Node.js 深度集成**：异步处理能力强

**数据库选择 MongoDB：**
- **文档型数据库**：数据结构灵活，适合旅游数据的多变性
- **JSON 友好**：与 JavaScript 无缝衔接，无需 ORM 层转换
- **扩展性好**：支持分布式部署，适合未来扩展
- **AI 数据兼容**：LLM 返回的 JSON 数据可直接存储

**整体考量：**
- **技术栈统一**：前后端都使用 JavaScript/TypeScript，开发效率高
- **社区支持**：遇到问题容易找到解决方案
- **部署便捷**：Docker 化部署简单，适合快速上线

---

### 2. 项目的整体架构是怎样的？

**回答：**

项目采用**前后端分离**的架构模式：

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端层 (Vue 3)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐    │
│  │ 首页    │  │ 推荐    │  │ 日志    │  │ 个人中心        │    │
│  │ Home    │  │ Detail  │  │ Log     │  │ Profile         │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘    │
│       │            │            │                 │             │
│       └────────────┴────┬───────┴─────────────────┘             │
│                         │                                       │
│                  ┌──────┴──────┐                                │
│                  │  Vue Router │                                │
│                  └──────┬──────┘                                │
│                         │                                       │
│                  ┌──────┴──────┐                                │
│                  │  Axios      │                                │
│                  └──────┬──────┘                                │
└─────────────────────────┼───────────────────────────────────────┘
                          │ HTTP/JSON
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        后端层 (Express)                         │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                   API Gateway                         │      │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐   │      │
│  │  │ /api │ │ /auth│ │ /trip│ │ /logs│ │ /ai      │   │      │
│  │  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └────┬─────┘   │      │
│  └─────┼────────┼────────┼────────┼───────────┼─────────┘      │
│        │        │        │        │           │                │
│        ▼        ▼        ▼        ▼           ▼                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │路由层  │ │认证层  │ │业务层  │ │日志层  │ │AI服务  │        │
│  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘        │
│      │          │          │          │          │              │
│      └──────────┴──────────┴──────────┴──────────┘              │
│                          │                                     │
│                          ▼                                     │
│                 ┌────────────────┐                              │
│                 │  数据访问层    │                              │
│                 │   Mongoose    │                              │
│                 └──────┬────────┘                              │
└─────────────────────────┼───────────────────────────────────────┘
                          │ MongoDB
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      数据层 (MongoDB)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐                  │
│  │  users   │  │  trips   │  │ travel_logs  │                  │
│  └──────────┘  └──────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

**架构特点：**
- **分层清晰**：前端展示层、后端业务层、数据存储层分离
- **模块化设计**：每个模块职责单一，便于维护和扩展
- **RESTful 风格**：API 设计遵循 REST 原则，易于理解和调用

---

### 3. 前端和后端是如何协作的？数据流向是怎样的？

**回答：**

**协作流程：**

1. **前端发起请求**：用户操作触发 API 调用（如点击"获取推荐"）
2. **请求封装**：Axios 拦截器统一添加 Token、处理请求参数
3. **后端接收**：Express 路由匹配，中间件进行认证和参数校验
4. **业务处理**：Controller 调用 Service 层处理业务逻辑
5. **数据访问**：Service 通过 Mongoose 操作 MongoDB
6. **返回响应**：数据经过处理后返回给前端
7. **前端渲染**：Vue 组件更新响应式数据，页面自动刷新

**数据流向示例（以登录为例）：**

```
前端                              后端                              数据库
  │                                  │                                  │
  │  POST /api/auth/login            │                                  │
  │ ────────────────────────────────>│                                  │
  │                                  │  authController.login()          │
  │                                  │ ──────────────────────────────>  │
  │                                  │  authService.login()             │
  │                                  │  User.findOne({ email })         │
  │                                  │ <─────────────────────────────   │
  │                                  │  bcrypt.compare(password)        │
  │                                  │  jwt.sign({ id })               │
  │  { token, user }                 │                                  │
  │ <─────────────────────────────── │                                  │
  │  localStorage.setItem(token)     │                                  │
  │  更新用户状态                     │                                  │
```

**关键技术点：**
- **Token 认证**：登录成功后返回 JWT，后续请求携带 Token
- **请求拦截**：统一处理请求头、错误捕获
- **响应处理**：统一数据格式，便于前端解析

---

## 二、前端技术细节

### 4. Vue 3 的 Composition API 和 Options API 有什么区别？

**回答：**

| 对比项 | Options API | Composition API |
|--------|-------------|------------------|
| **组织方式** | 按选项（data、methods、computed）组织 | 按功能逻辑组织 |
| **代码复用** | Mixins（可能冲突） | Composables（更干净） |
| **类型推断** | 较差 | 更好（TypeScript 友好） |
| **逻辑聚合** | 分散在不同选项 | 集中在函数中 |
| **学习曲线** | 平缓 | 稍陡，但更灵活 |

**项目中的应用：**

```vue
<!-- Options API 写法 -->
<script>
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() { this.count++ }
  },
  computed: {
    doubled() { return this.count * 2 }
  }
}
</script>

<!-- Composition API 写法（项目中使用） -->
<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const increment = () => count.value++
const doubled = computed(() => count.value * 2)
</script>
```

**为什么选择 Composition API：**
- **逻辑复用**：将认证逻辑抽离为 `useAuth()` composable
- **代码组织**：相关逻辑放在一起，可读性更好
- **TypeScript 支持**：类型推断更准确

---

### 5. Vant 组件库是如何引入和使用的？

**回答：**

**引入方式：自动按需引入**

项目使用 `unplugin-vue-components` 插件实现自动按需引入：

```javascript
// vite.config.js
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'

export default {
  plugins: [
    Components({
      resolvers: [VantResolver()]
    })
  ]
}
```

**使用示例：**

```vue
<template>
  <van-button type="primary" @click="handleClick">提交</van-button>
  <van-field v-model="email" label="邮箱" placeholder="请输入邮箱" />
  <van-cell-group>
    <van-cell title="目的地" :value="city" clickable />
  </van-cell-group>
</template>

<script setup>
import { ref } from 'vue'
const email = ref('')
const city = ref('北京')
const handleClick = () => console.log('提交')
</script>
```

**为什么选择 Vant：**
- **移动端优化**：专为移动端设计，响应式适配
- **轻量高效**：按需引入，减小打包体积
- **组件丰富**：覆盖常用场景（表单、弹窗、列表等）
- **文档清晰**：中文文档，易于理解和使用

---

### 6. 路由是如何配置的？路由守卫是如何实现权限控制的？

**回答：**

**路由配置：**

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/detail', name: 'Detail', component: () => import('../views/Detail.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../views/Profile.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})
```

**路由守卫实现：**

```javascript
// 全局前置守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('token')

  // 需要登录的页面
  const requiresAuth = ['Profile', 'NewLog']

  if (requiresAuth.includes(to.name) && !isLoggedIn) {
    next({ name: 'Login' }) // 未登录重定向到登录页
  } else if (['Login', 'Register'].includes(to.name) && isLoggedIn) {
    next({ name: 'Home' }) // 已登录访问登录页重定向到首页
  } else {
    next() // 正常跳转
  }
})
```

**权限控制策略：**
- **前端守卫**：控制页面访问权限
- **后端验证**：API 接口验证 Token 有效性
- **双重保障**：前端控制展示，后端控制数据访问

---

### 7. 请求是如何封装的？拦截器有哪些应用场景？

**回答：**

**请求封装：**

```javascript
// utils/request.js
import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 添加 Token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => response.data,
  error => {
    // 统一错误处理
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default request
```

**拦截器应用场景：**

| 场景 | 请求拦截器 | 响应拦截器 |
|------|-----------|-----------|
| **Token 注入** | ✅ 添加 Authorization 头 | - |
| **请求日志** | ✅ 记录请求信息 | ✅ 记录响应信息 |
| **错误统一处理** | - | ✅ 401 跳转登录、500 提示 |
| **请求取消** | ✅ 取消重复请求 | - |
| **数据格式转换** | - | ✅ 统一返回格式 |

---

### 8. 响应式数据是如何管理的？为什么使用 `ref` 而不是 `reactive`？

**回答：**

**响应式数据管理方式：**

```vue
<script setup>
import { ref, reactive, computed } from 'vue'

// ref - 用于基本类型
const count = ref(0)
const name = ref('张三')

// reactive - 用于对象
const user = reactive({
  name: '张三',
  age: 25
})

// computed - 计算属性
const doubleCount = computed(() => count.value * 2)

// 修改 ref
count.value = 10

// 修改 reactive
user.name = '李四'
</script>
```

**ref vs reactive：**

| 对比项 | ref | reactive |
|--------|-----|----------|
| **适用类型** | 基本类型、对象 | 仅对象 |
| **访问方式** | `.value` | 直接访问 |
| **解构响应性** | 保持响应性 | 解构后失去响应性 |
| **数组操作** | 推荐使用 | 可使用但较复杂 |

**为什么项目中多用 ref：**
- **统一语法**：不管是基本类型还是对象，都可以用 `.value` 访问
- **解构安全**：解构后仍保持响应性
- **TypeScript 友好**：类型推断更准确

**实际应用示例：**

```javascript
// 表单数据 - 使用 ref
const form = ref({
  username: '',
  email: '',
  password: ''
})

// 修改表单
form.value.username = 'newuser'

// 列表数据 - 使用 ref
const plans = ref([])

// 加载数据
const loadPlans = async () => {
  plans.value = await api.getPlans()
}
```

---

## 三、后端技术细节

### 9. Express 的中间件机制是怎样的？项目中有哪些自定义中间件？

**回答：**

**中间件机制：**

Express 的中间件是一个函数，能够访问请求对象 `req`、响应对象 `res` 和下一个中间件函数 `next`：

```javascript
app.use((req, res, next) => {
  console.log('中间件执行')
  next() // 调用下一个中间件
})
```

**中间件类型：**
- **应用级中间件**：全局应用
- **路由级中间件**：特定路由
- **错误处理中间件**：处理错误
- **内置中间件**：如 `express.json()`
- **第三方中间件**：如 `cors`

**项目中的自定义中间件：**

```javascript
// middleware/auth.js - 认证中间件
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ success: false, message: '未授权' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token 无效' })
  }
}

// middleware/error.js - 错误处理中间件
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack)
  const status = err.statusCode || 500
  res.status(status).json({
    success: false,
    message: err.message || '服务器内部错误'
  })
}
```

**中间件的应用：**

```javascript
// 应用级中间件
app.use(express.json())
app.use(cors())

// 路由级中间件
app.use('/api/trips', authenticate, tripRouter)

// 错误处理中间件（必须放在最后）
app.use(errorHandler)
```

---

### 10. MongoDB 和 Mongoose 的关系是什么？Schema 和 Model 有什么区别？

**回答：**

**MongoDB vs Mongoose：**

| 对比项 | MongoDB | Mongoose |
|--------|---------|----------|
| **本质** | 数据库管理系统 | Node.js 的 ODM 库 |
| **作用** | 存储数据 | 简化 MongoDB 操作 |
| **接口** | 原生驱动 API | 更友好的 Model API |
| **数据结构** | Schema-less | 强制 Schema |
| **验证** | 基本验证 | 内置数据验证 |

**Schema vs Model：**

```javascript
// Schema - 定义数据结构
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, '无效邮箱']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
})

// Model - 创建数据模型
const User = mongoose.model('User', userSchema)

// 使用 Model 操作数据
const user = await User.create({ username: 'test', email: 'test@example.com', password: '123456' })
```

| 对比项 | Schema | Model |
|--------|--------|-------|
| **定义** | 数据结构和约束 | 数据操作的接口 |
| **作用** | 定义字段、类型、验证规则 | 执行 CRUD 操作 |
| **创建方式** | `new mongoose.Schema({...})` | `mongoose.model('Name', schema)` |
| **使用方式** | 配合 Model 使用 | 直接调用方法 |

---

### 11. JWT 的工作原理是什么？如何保证 Token 的安全性？

**回答：**

**JWT 工作原理：**

```
用户登录成功 ──> 服务器生成 Token ──> 返回给客户端 ──> 客户端存储 ──> 后续请求携带 Token ──> 服务器验证 Token
```

**JWT 结构：**

```
Header.Payload.Signature

Header: {"alg": "HS256", "typ": "JWT"}
Payload: {"id": "123", "username": "test", "exp": 1781616785}
Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
```

**保证 Token 安全的措施：**

1. **使用 HTTPS**：防止 Token 被中间人攻击窃取
2. **设置过期时间**：`expiresIn: '7d'`，降低泄露风险
3. **安全存储**：前端存储在 `localStorage` 或 `sessionStorage`
4. **HTTP-only Cookie**：对于敏感场景，可使用 HTTP-only Cookie 存储
5. **Token 刷新机制**：定期刷新 Token，避免长期有效
6. **签名密钥保护**：密钥存储在环境变量中，不硬编码

**项目中的实现：**

```javascript
// 生成 Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// 验证 Token（中间件）
const decoded = jwt.verify(token, process.env.JWT_SECRET)
```

---

### 12. 密码是如何加密存储的？为什么不能明文存储？

**回答：**

**密码加密流程：**

```javascript
import bcrypt from 'bcrypt'

// 注册时加密密码
const register = async (req, res) => {
  const { password } = req.body

  // 生成盐并加密（10 轮）
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  // 存储加密后的密码
  const user = await User.create({ ...req.body, password: hashedPassword })
}

// 登录时验证密码
const login = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email })

  // 验证密码
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return res.status(400).json({ success: false, message: '密码错误' })
  }
}
```

**为什么不能明文存储：**

| 风险 | 说明 |
|------|------|
| **数据泄露** | 数据库被攻破时，用户密码直接暴露 |
| **信任危机** | 用户担心密码被滥用 |
| **合规问题** | 不符合 GDPR、网络安全法等法规要求 |
| **批量泄露** | 一个密码泄露可能影响用户其他账户 |

**bcrypt 的优势：**
- **单向哈希**：无法逆向解密
- **加盐处理**：相同密码生成不同哈希值
- **可配置成本**：随着硬件升级可增加计算难度

---

### 13. RESTful API 的设计原则是什么？项目中是如何体现的？

**回答：**

**RESTful 设计原则：**

| 原则 | 说明 | 项目示例 |
|------|------|----------|
| **统一接口** | 使用标准 HTTP 方法 | GET/POST/PUT/DELETE |
| **无状态** | 请求之间独立，服务器不保存会话 | 使用 JWT 认证 |
| **资源标识** | URI 表示资源 | `/api/users`, `/api/trips` |
| **资源操作** | 通过 HTTP 方法操作资源 | GET 获取、POST 创建、PUT 更新、DELETE 删除 |
| **分层系统** | 前端、后端、数据库分层 | 前后端分离架构 |
| **可缓存** | 响应可被缓存 | 设置 Cache-Control |

**项目中的 API 设计：**

```javascript
// 用户认证
POST   /api/auth/register    // 注册
POST   /api/auth/login       // 登录

// 旅行推荐
GET    /api/travel/recommend // 获取推荐计划
POST   /api/travel/plans     // 创建旅行计划

// 旅行日志
GET    /api/travel-logs      // 获取日志列表
POST   /api/travel-logs      // 创建日志
PUT    /api/travel-logs/:id  // 更新日志
DELETE /api/travel-logs/:id  // 删除日志

// AI 聊天
POST   /api/ai/chat          // AI 对话
```

**RESTful 特点体现：**
- **名词而非动词**：使用 `/users` 而不是 `/getUsers`
- **使用正确的 HTTP 方法**：GET 用于查询，POST 用于创建
- **状态码语义化**：200 成功、201 创建成功、400 请求错误、401 未授权、500 服务器错误

---

## 四、AI 集成部分

### 14. 大语言模型是如何集成到项目中的？调用流程是怎样的？

**回答：**

**集成架构：**

```
前端 ──> /api/ai/chat ──> AIController ──> AIService ──> SiliconFlow API
```

**调用流程：**

```javascript
// AIService.js
class AIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.SILICONFLOW_API_KEY,
      baseURL: process.env.SILICONFLOW_BASE_URL
    })
  }

  async generateTravelPlan(city, budget, days) {
    const prompt = `
      请帮我生成一个${days}天的${city}旅行计划，预算${budget}元。
      要求：
      1. 每天分为上午、下午、晚上三个时间段
      2. 推荐著名景点和特色美食
      3. 给出交通方式和大致花费
      4. 返回 JSON 格式，包含 days 数组
    `

    const response = await this.client.chat.completions.create({
      model: process.env.SILICONFLOW_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })

    return JSON.parse(response.choices[0].message.content)
  }
}
```

**项目中的调用示例：**

```javascript
// TravelController.js
export const generatePlan = async (req, res) => {
  try {
    const { city, budget, days } = req.body
    const plan = await aiService.generateTravelPlan(city, budget, days)
    res.json({ success: true, data: plan })
  } catch (error) {
    res.status(500).json({ success: false, message: '生成失败' })
  }
}
```

**关键技术点：**
- **提示词工程**：设计结构化的提示词，确保返回格式符合预期
- **API 封装**：将 LLM 调用封装为服务，便于切换模型提供商
- **错误处理**：处理 API 调用失败、超时等异常情况

---

### 15. 提示词是如何设计的？为什么这样设计？

**回答：**

**提示词设计原则：**

1. **明确任务**：告诉模型要做什么
2. **提供上下文**：给出必要的背景信息
3. **指定格式**：要求返回特定格式（如 JSON）
4. **设置约束**：给出限制条件
5. **示例引导**：提供示例输出

**项目中的提示词设计：**

```javascript
const prompt = `
你是一个专业的旅游规划师，请根据用户的需求生成详细的旅行计划。

用户需求：
- 目的地：${city}
- 预算：${budget}元
- 天数：${days}天

输出格式要求：
{
  "city": "城市名",
  "days": [
    {
      "day": 1,
      "morning": {
        "spot": "景点名",
        "duration": "时长",
        "ticket": "票价",
        "transportation": "交通方式",
        "description": "描述"
      },
      "afternoon": {...},
      "evening": {...}
    }
  ],
  "totalBudget": "总预算",
  "tips": ["注意事项1", "注意事项2"]
}

要求：
1. 每个时间段推荐一个主要景点或活动
2. 交通方式要实际可行（地铁、公交、步行等）
3. 预算分配合理，不超过用户给定的总预算
4. 包含当地特色美食推荐
5. 语言简洁明了，避免过于文艺化的描述
`
```

**为什么这样设计：**

| 设计点 | 目的 |
|--------|------|
| **结构化输出** | 便于前端解析和展示 |
| **字段约束** | 确保返回必要的信息（时长、票价等） |
| **示例格式** | 引导模型输出正确的 JSON 结构 |
| **具体要求** | 控制输出质量，避免无关内容 |
| **预算控制** | 确保推荐符合用户预算 |

---

### 16. 如果 API 调用失败或超时，项目中有什么容错机制？

**回答：**

**容错机制设计：**

1. **超时处理**：设置合理的超时时间
2. **重试机制**：失败时自动重试
3. **降级策略**：API 不可用时返回模拟数据
4. **错误日志**：记录错误信息便于排查
5. **用户友好提示**：给用户明确的错误提示

**项目中的实现：**

```javascript
// AIService.js
class AIService {
  async generateTravelPlan(city, budget, days) {
    try {
      const response = await this.client.chat.completions.create({
        model: process.env.SILICONFLOW_MODEL,
        messages: [{ role: 'user', content: prompt }],
        timeout: 60000 // 60秒超时
      })
      return JSON.parse(response.choices[0].message.content)
    } catch (error) {
      console.error('LLM API 调用失败:', error.message)

      // 降级策略：返回模拟数据
      return this.getMockRecommendation(city, budget, days)
    }
  }

  // 模拟数据降级
  getMockRecommendation(city, budget, days) {
    return {
      city,
      days: Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        morning: { spot: `${city}著名景点A`, duration: '2小时', ticket: '免费', transportation: '地铁', description: '描述...' },
        afternoon: { spot: `${city}美食街`, duration: '3小时', ticket: '免费', transportation: '步行', description: '描述...' },
        evening: { spot: `${city}夜景`, duration: '2小时', ticket: '免费', transportation: '打车', description: '描述...' }
      })),
      totalBudget: budget,
      tips: ['建议提前预订门票', '注意天气变化']
    }
  }
}
```

**前端错误处理：**

```javascript
// Detail.vue
const generatePlan = async () => {
  try {
    loading.value = true
    const res = await request.post('/api/travel/recommend', { city, budget, days })
    plan.value = res.data
  } catch (error) {
    showToast({ title: '生成失败，请稍后重试', icon: 'error' })
  } finally {
    loading.value = false
  }
}
```

---

### 17. 为什么选择 SiliconFlow 而不是其他模型服务？

**回答：**

**选择 SiliconFlow 的原因：**

| 因素 | SiliconFlow | 其他服务（如 OpenAI） |
|------|-------------|---------------------|
| **价格** | 更便宜，适合个人项目 | 较贵，成本较高 |
| **模型选择** | 支持多种开源模型（Qwen、Llama 等） | 主要是自家模型 |
| **国内访问** | 国内服务商，访问速度快 | 需翻墙，延迟高 |
| **API 兼容性** | 兼容 OpenAI API，迁移成本低 | 标准 API |
| **部署灵活性** | 支持私有化部署 | 主要是云服务 |

**项目中的配置：**

```javascript
// .env
MODEL_PROVIDER=SILICONFLOW
SILICONFLOW_API_KEY=your-api-key
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICONFLOW_MODEL=Qwen/Qwen3.6-35B-A3B
```

**切换模型服务的灵活性：**

```javascript
// AIService.js
class AIService {
  constructor() {
    const provider = process.env.MODEL_PROVIDER

    if (provider === 'SILICONFLOW') {
      this.client = new OpenAI({
        apiKey: process.env.SILICONFLOW_API_KEY,
        baseURL: process.env.SILICONFLOW_BASE_URL
      })
    } else if (provider === 'DEEPSEEK') {
      this.client = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1'
      })
    }
  }
}
```

---

## 五、项目亮点与难点

### 18. 项目中最核心的功能是什么？实现过程中遇到了哪些难点？

**回答：**

**核心功能：智能旅游推荐**

这是项目的核心竞争力，用户输入目的地、预算、天数后，系统通过 LLM 生成个性化旅行计划。

**实现难点及解决方案：**

| 难点 | 解决方案 |
|------|----------|
| **LLM 返回格式不稳定** | 设计严格的提示词模板，要求返回 JSON 格式，并进行数据验证 |
| **API 调用超时** | 设置超时时间，实现重试机制和降级策略 |
| **数据解析错误** | 使用 try-catch 包裹解析逻辑，解析失败时返回模拟数据 |
| **用户输入验证** | 前端验证 + 后端验证双重保障，确保参数合法 |
| **响应速度慢** | 添加 loading 状态，优化用户体验 |

**具体实现示例：**

```javascript
// 数据验证
const validatePlan = (data) => {
  if (!data?.city || !data?.days) {
    throw new Error('返回格式错误')
  }

  if (!Array.isArray(data.days)) {
    throw new Error('days 必须是数组')
  }

  return data
}

// 调用流程
const generatePlan = async (city, budget, days) => {
  const result = await aiService.generateTravelPlan(city, budget, days)
  return validatePlan(result)
}
```

---

### 19. 用户认证模块是如何实现的？遇到了哪些问题？

**回答：**

**用户认证实现流程：**

```
注册：验证邮箱格式 → 检查用户名/邮箱是否已存在 → 加密密码 → 创建用户 → 返回 Token
登录：验证邮箱密码 → 生成 Token → 返回用户信息
认证：解析 Token → 验证用户存在 → 将用户信息注入 req
```

**核心代码：**

```javascript
// 注册
export const register = async (req, res) => {
  const { username, email, password } = req.body

  // 验证
  if (!email.match(/^\S+@\S+\.\S+$/)) {
    return res.status(400).json({ success: false, message: '无效邮箱' })
  }

  // 检查重复
  const existing = await User.findOne({ $or: [{ email }, { username }] })
  if (existing) {
    return res.status(400).json({ success: false, message: '邮箱或用户名已存在' })
  }

  // 创建用户
  const user = await User.create({ username, email, password })
  const token = generateToken(user._id)

  res.status(201).json({ success: true, token, user })
}

// 登录
export const login = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ success: false, message: '邮箱或密码错误' })
  }

  const token = generateToken(user._id)
  res.json({ success: true, token, user })
}
```

**遇到的问题及解决：**

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| **密码加密失败** | Mongoose pre-save hook 使用 async 函数时调用 next() | 移除 next()，async 函数自动处理 |
| **Token 验证失败** | Token 过期或密钥不匹配 | 添加过期处理，使用环境变量存储密钥 |
| **跨域问题** | 前端和后端端口不同 | 配置 CORS 中间件 |
| **密码强度不足** | 用户设置简单密码 | 添加密码强度验证规则 |

---

### 20. 如何保证数据的一致性和完整性？

**回答：**

**数据一致性保障措施：**

1. **数据库层面**：
   - 使用 Mongoose Schema 定义数据约束（required、unique、match 等）
   - 使用事务保证多文档操作的原子性
   - 建立索引提高查询效率和数据唯一性

2. **应用层面**：
   - 前端表单验证，确保数据格式正确
   - 后端参数校验，拒绝非法数据
   - 使用中间件统一处理错误

3. **API 层面**：
   - 统一响应格式，便于错误追踪
   - 使用 HTTP 状态码表示操作结果
   - 记录操作日志，便于问题排查

**项目中的实现：**

```javascript
// Schema 约束
const userSchema = new mongoose.Schema({
  username: { type: String, required: [true, '用户名必填'], unique: true },
  email: { type: String, required: [true, '邮箱必填'], match: [/^\S+@\S+\.\S+$/, '无效邮箱'], unique: true },
  password: { type: String, required: [true, '密码必填'], minlength: [6, '密码至少6位'] }
})

// 参数校验中间件
export const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: '请填写完整信息' })
  }

  next()
}

// 统一响应格式
export const ok = (res, data, message = '操作成功', status = 200) => {
  res.status(status).json({ success: true, message, data })
}

export const error = (res, message = '操作失败', status = 400) => {
  res.status(status).json({ success: false, message })
}
```

---

### 21. 项目中有哪些性能优化措施？

**回答：**

**前端优化：**

| 优化项 | 实现方式 |
|--------|----------|
| **代码分割** | 使用 Vue Router 的动态导入 `() => import('../views/Home.vue')` |
| **图片优化** | 使用 WebP 格式，懒加载图片 |
| **缓存策略** | 使用 localStorage 缓存用户信息和 Token |
| **请求优化** | 使用 axios 拦截器取消重复请求 |
| **组件懒加载** | 使用 `defineAsyncComponent` 异步加载组件 |

**后端优化：**

| 优化项 | 实现方式 |
|--------|----------|
| **数据库索引** | 为常用查询字段（如 email、userId）建立索引 |
| **连接池** | 使用 Mongoose 的连接池配置 |
| **缓存机制** | 缓存 LLM 调用结果，避免重复请求 |
| **异步处理** | 使用 async/await 优化异步流程 |
| **限流熔断** | 限制 API 调用频率，防止服务过载 |

**项目中的实现：**

```javascript
// 前端代码分割
const router = createRouter({
  routes: [
    { path: '/', component: () => import('../views/Home.vue') },
    { path: '/detail', component: () => import('../views/Detail.vue') }
  ]
})

// 后端索引
userSchema.index({ email: 1 })
userSchema.index({ username: 1 })

// Mongoose 连接池配置
mongoose.connect(uri, {
  maxPoolSize: 10,
  minPoolSize: 5
})
```

---

## 六、部署与运维

### 22. Docker Compose 的配置是怎样的？各个服务之间是如何通信的？

**回答：**

**Docker Compose 配置：**

```yaml
# docker-compose.yml
services:
  mongodb:
    image: mongo:7
    container_name: ai-travel-mongo
    ports: ['27017:27017']
    volumes: [mongo-data:/data/db]
    environment: { MONGO_INITDB_DATABASE: ai-travel }

  backend:
    build: ./travel-server
    container_name: ai-travel-backend
    ports: ['3300:3300']
    environment:
      MONGODB_URI: mongodb://mongodb:27017/ai-travel
      JWT_SECRET: ${JWT_SECRET}
      SILICONFLOW_API_KEY: ${SILICONFLOW_API_KEY}
    depends_on: [mongodb]

  frontend:
    build: ./travel-h5
    container_name: ai-travel-frontend
    ports: ['80:80']
    depends_on: [backend]

volumes:
  mongo-data:
```

**服务通信方式：**

| 服务 | 通信对象 | 方式 |
|------|----------|------|
| frontend | backend | 通过 `http://backend:3300` |
| backend | mongodb | 通过 `mongodb://mongodb:27017` |
| frontend | 外部 | 通过端口 80 暴露 |

**关键配置说明：**

1. **网络通信**：Docker Compose 自动创建虚拟网络，服务名即主机名
2. **依赖关系**：`depends_on` 确保服务启动顺序
3. **环境变量**：通过 `.env` 文件传递敏感信息
4. **数据持久化**：使用 volumes 挂载 MongoDB 数据目录

---

### 23. 环境变量是如何管理的？开发环境和生产环境有什么区别？

**回答：**

**环境变量管理：**

```javascript
// .env 文件
PORT=3300
MONGODB_URI=mongodb://localhost:27017/ai-travel
JWT_SECRET=your-secret-key
SILICONFLOW_API_KEY=your-api-key

// 后端读取
import dotenv from 'dotenv'
dotenv.config()

const config = {
  port: process.env.PORT,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET
}
```

**开发环境 vs 生产环境：**

| 对比项 | 开发环境 | 生产环境 |
|--------|----------|----------|
| **数据库** | 本地 MongoDB | 远程/云数据库 |
| **日志级别** | 详细（debug） | 精简（error/warn） |
| **热更新** | 启用 | 禁用 |
| **压缩** | 禁用 | 启用（gzip/brotli） |
| **安全** | 宽松 | 严格（HTTPS、CSP等） |
| **性能** | 调试优先 | 性能优先 |

**项目中的配置：**

```javascript
// 开发环境配置
if (process.env.NODE_ENV === 'development') {
  // 启用热更新
  app.use(webpackDevMiddleware(...))
}

// 生产环境配置
if (process.env.NODE_ENV === 'production') {
  // 启用压缩
  app.use(compression())
  // 静态资源缓存
  app.use(express.static('dist', { maxAge: '1d' }))
}
```

---

### 24. 如果项目要上线，你会做哪些准备工作？

**回答：**

**上线准备清单：**

| 阶段 | 任务 | 说明 |
|------|------|------|
| **代码检查** | 代码审查、静态分析 | 使用 ESLint、Prettier 检查 |
| **安全审计** | 检查敏感信息泄露 | 确保密钥不硬编码 |
| **性能测试** | 压力测试、性能分析 | 使用 JMeter、Lighthouse |
| **环境配置** | 配置生产环境变量 | 数据库、API 密钥等 |
| **HTTPS** | 配置 SSL 证书 | 使用 Let's Encrypt |
| **日志监控** | 配置日志系统 | 使用 ELK、Sentry |
| **备份策略** | 数据库定时备份 | 每日备份，保留7天 |
| **CI/CD** | 配置自动化部署 | 使用 GitHub Actions、Docker |

**上线步骤：**

```
1. 代码提交到 Git 仓库
2. CI 自动运行测试和构建
3. 构建 Docker 镜像
4. 推送镜像到容器仓库
5. 部署到生产服务器
6. 运行数据库迁移（如有）
7. 启动服务并监控
8. 进行健康检查
```

**监控和告警：**

```javascript
// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() })
})

// 日志记录
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})
```

---

## 七、代码审查与改进

### 25. 如果让你重构这个项目，你会从哪些方面入手？

**回答：**

**重构方向：**

| 方面 | 当前问题 | 优化方案 |
|------|----------|----------|
| **状态管理** | 使用 localStorage 管理状态 | 引入 Pinia 进行集中状态管理 |
| **类型安全** | 纯 JavaScript | 迁移到 TypeScript |
| **代码复用** | 重复代码较多 | 提取公共组件和工具函数 |
| **测试覆盖** | 缺少单元测试 | 添加 Jest 测试用例 |
| **错误处理** | 错误处理分散 | 统一错误处理中间件 |
| **配置管理** | 配置分散 | 使用配置文件统一管理 |

**具体重构计划：**

1. **引入 Pinia**：
```javascript
// stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({ token: null, user: null }),
  actions: {
    login(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
    }
  }
})
```

2. **添加测试**：
```javascript
// auth.test.js
test('should register a new user', async () => {
  const response = await request(app).post('/api/auth/register')
    .send({ username: 'test', email: 'test@example.com', password: '123456' })

  expect(response.status).toBe(201)
  expect(response.body.success).toBe(true)
})
```

---

### 26. 项目中有没有潜在的安全隐患？如何修复？

**回答：**

**潜在安全隐患及修复：**

| 隐患 | 风险等级 | 修复方案 |
|------|----------|----------|
| **SQL 注入** | 高 | 使用 Mongoose 参数化查询，避免拼接字符串 |
| **XSS 攻击** | 高 | 对用户输入进行转义，使用文本内容而非 HTML |
| **CSRF 攻击** | 中 | 使用 Token 验证，设置 CSRF 令牌 |
| **密码泄露** | 高 | 使用 bcrypt 加密，设置合理的密码策略 |
| **敏感信息暴露** | 中 | 响应中不返回密码字段，使用环境变量存储密钥 |
| **越权访问** | 中 | 验证用户权限，确保只能访问自己的数据 |
| **文件上传漏洞** | 低 | 当前项目无文件上传功能，如需添加需限制文件类型和大小 |

**具体修复示例：**

```javascript
// 防止越权访问
export const getTravelLog = async (req, res) => {
  const log = await TravelLog.findById(req.params.id)

  // 验证权限
  if (log.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: '无权访问' })
  }

  res.json({ success: true, data: log })
}

// 隐藏敏感字段
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password
    return ret
  }
})
```

---

### 27. 如果要支持多语言，你会如何设计？

**回答：**

**多语言支持方案：**

**1. 国际化方案选择**：使用 `vue-i18n` 库

**2. 语言文件结构**：
```
src/
└── locales/
    ├── zh-CN.js    # 简体中文
    ├── en-US.js    # 英语
    └── index.js    # 配置导出
```

**3. 语言文件内容**：
```javascript
// zh-CN.js
export default {
  home: {
    title: '智能旅游助手',
    subtitle: '发现你的下一次旅行'
  },
  profile: {
    name: '姓名',
    email: '邮箱',
    logout: '退出登录'
  }
}

// en-US.js
export default {
  home: {
    title: 'AI Travel Assistant',
    subtitle: 'Discover your next trip'
  },
  profile: {
    name: 'Name',
    email: 'Email',
    logout: 'Logout'
  }
}
```

**4. 配置和使用**：
```javascript
// main.js
import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

createApp(App).use(i18n).mount('#app')
```

**5. 组件中使用**：
```vue
<template>
  <van-nav-bar :title="t('home.title')" />
  <van-button>{{ t('profile.logout') }}</van-button>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
```

**6. 语言切换功能**：
```javascript
const { locale } = useI18n()

const switchLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('language', lang)
}
```

---

## 面试技巧总结

### STAR 法则

在回答面试问题时，建议遵循 STAR 法则：

- **Situation**：描述场景
- **Task**：说明任务
- **Action**：讲述你做了什么
- **Result**：说明结果

### 回答示例

**问题 18：项目中最核心的功能是什么？实现过程中遇到了哪些难点？**

> **核心功能是智能旅游推荐。**
>
> **难点**：LLM 返回结果的格式不固定，需要解析和校验。
>
> **解决方案**：设计了结构化的提示词模板，要求模型返回 JSON 格式；同时实现了数据验证和异常处理机制。
>
> **结果**：成功实现了根据用户输入生成个性化旅行计划的功能。

### 关键要点

1. **准备具体例子**：用项目中的实际代码举例
2. **讲清楚原理**：不仅说怎么做，还要说为什么这么做
3. **展示思考过程**：说明遇到问题时的解决思路
4. **突出亮点**：强调项目中的创新点和技术难点

---

> 祝你面试顺利！🚀
