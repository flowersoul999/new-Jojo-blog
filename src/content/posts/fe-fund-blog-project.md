---
title: "前端综合实战：从0到1上线一个博客系统"
published: 2026-09-10
description: ""
tags: ["前端基础"]
category: "技术总结"
draft: false
lang: "zh-CN"
---

> 💡 **写在前面**：恭喜你坚持到了最后一篇！前面学了那么多技术——Vue3、Router、Pinia、Element Plus、Tailwind、Axios……是骡子是马拉出来溜溜。这篇咱们从零到一做一个完整的博客系统，把所有技术串起来，做完这个项目，你就可以 confidently 去找前端工作了。全文约12000字，建议跟着敲一遍，收获最大！

---

## 📑 目录导航

- [一、项目介绍：我们要做什么？](#一项目介绍我们要做什么)
  - [1.1 项目概览](#11-项目概览)
  - [1.2 技术栈](#12-技术栈)
  - [1.3 功能清单](#13-功能清单)
- [二、项目初始化：搭建脚手架](#二项目初始化搭建脚手架)
  - [2.1 创建Vite + Vue3项目](#21-创建vite--vue3项目)
  - [2.2 安装依赖](#22-安装依赖)
  - [2.3 项目结构规划](#23-项目结构规划)
  - [2.4 配置路径别名](#24-配置路径别名)
- [三、基础配置：环境变量与Axios封装](#三基础配置环境变量与axios封装)
  - [3.1 环境变量配置](#31-环境变量配置)
  - [3.2 Axios封装](#32-axios封装)
  - [3.3 Mock数据方案](#33-mock数据方案)
- [四、状态管理：Pinia Store](#四状态管理pinia-store)
  - [4.1 用户Store](#41-用户store)
  - [4.2 全局Store](#42-全局store)
- [五、路由设计：Vue Router](#五路由设计vue-router)
  - [5.1 路由表设计](#51-路由表设计)
  - [5.2 路由守卫](#52-路由守卫)
- [六、布局组件：搭好骨架](#六布局组件搭好骨架)
  - [6.1 整体布局Layout](#61-整体布局layout)
  - [6.2 导航栏Navbar](#62-导航栏navbar)
  - [6.3 侧边栏Sidebar](#63-侧边栏sidebar)
- [七、页面开发：前台展示](#七页面开发前台展示)
  - [7.1 首页：文章列表](#71-首页文章列表)
  - [7.2 文章详情页](#72-文章详情页)
  - [7.3 登录/注册页](#73-登录注册页)
- [八、页面开发：后台管理](#八页面开发后台管理)
  - [8.1 管理后台布局](#81-管理后台布局)
  - [8.2 文章管理CRUD](#82-文章管理crud)
  - [8.3 分类管理](#83-分类管理)
- [九、功能优化：让项目更完善](#九功能优化让项目更完善)
  - [9.1 权限控制](#91-权限控制)
  - [9.2 404页面](#92-404页面)
  - [9.3 加载状态与空状态](#93-加载状态与空状态)
- [十、项目优化：性能与体验](#十项目优化性能与体验)
  - [10.1 路由懒加载](#101-路由懒加载)
  - [10.2 图片懒加载](#102-图片懒加载)
  - [10.3 打包体积优化](#103-打包体积优化)
- [十一、部署上线：让全世界都能看到](#十一部署上线让全世界都能看到)
  - [11.1 打包构建](#111-打包构建)
  - [11.2 静态托管](#112-静态托管)
  - [11.3 绑定域名](#113-绑定域名)
- [十二、总结与后续学习建议](#十二总结与后续学习建议)

---

## 一、项目介绍：我们要做什么？

### 1.1 项目概览

我们要做一个**博客系统**，包含前台展示和后台管理两大部分。

**前台展示**：游客可以看文章列表、看文章详情、搜索文章、看分类；注册用户可以评论、点赞。

**后台管理**：管理员可以登录、写文章、编辑文章、管理分类、管理评论。

为什么选博客系统？因为博客系统功能全——列表、详情、搜索、登录、注册、CRUD、权限……该有的都有了，做完这个项目，大部分前端场景你都接触过了。

### 1.2 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Vue 3** | 3.4+ | 前端框架，Composition API + script setup |
| **Vite** | 5.x | 构建工具 |
| **Vue Router** | 4.x | 路由 |
| **Pinia** | 2.x | 状态管理 |
| **Element Plus** | 2.x | UI组件库 |
| **Tailwind CSS** | 3.x | 原子化CSS |
| **Axios** | 1.x | HTTP请求 |
| **TypeScript** | 5.x | 类型安全（可选，本项目用JS也能跑） |
| **Mock.js** | 1.x | 模拟接口数据 |

这套技术栈就是目前国内最主流的Vue3技术栈——找工作的话，这个组合出现频率最高。

### 1.3 功能清单

#### 前台功能
- ✅ 首页：文章列表（分页）、轮播图、热门文章
- ✅ 文章详情：Markdown渲染、点赞、评论
- ✅ 分类筛选：按分类查看文章
- ✅ 搜索：关键词搜索文章
- ✅ 用户注册/登录
- ✅ 个人中心：修改信息、修改密码

#### 后台功能
- ✅ 管理员登录
- ✅ 仪表盘：数据统计
- ✅ 文章管理：新增/编辑/删除/上架下架
- ✅ 分类管理：新增/编辑/删除
- ✅ 评论管理：查看/删除
- ✅ 用户管理：查看/禁用

先把核心功能做出来，后面可以自己扩展更多功能。

---

## 二、项目初始化：搭建脚手架

### 2.1 创建Vite + Vue3项目

```bash
# 创建项目
npm create vite@latest my-blog -- --template vue

# 进入项目
cd my-blog

# 安装依赖
npm install

# 运行
npm run dev
```

### 2.2 安装依赖

一次性把所有依赖都装上：

```bash
# 核心依赖
npm i vue-router@4 pinia axios element-plus

# 工具类
npm i -D tailwindcss postcss autoprefixer unplugin-vue-components unplugin-auto-import mockjs vite-plugin-mock

# 其他
npm i marked highlight.js  # Markdown渲染和代码高亮
npm i nprogress  # 顶部进度条
```

### 2.3 项目结构规划

一个好的项目结构很重要，这是我推荐的结构：

```
my-blog/
├── public/                 # 静态资源
├── src/
│   ├── api/                # API接口
│   │   ├── user.js
│   │   ├── article.js
│   │   ├── category.js
│   │   ├── comment.js
│   │   └── index.js
│   ├── assets/             # 资源文件（图片、样式）
│   │   ├── images/
│   │   └── styles/
│   ├── components/         # 公共组件
│   │   ├── ArticleCard.vue
│   │   ├── Pagination.vue
│   │   └── ...
│   ├── composables/        # 组合式函数（hooks）
│   │   ├── useAuth.js
│   │   └── usePagination.js
│   ├── layouts/            # 布局组件
│   │   ├── DefaultLayout.vue   # 前台布局
│   │   └── AdminLayout.vue     # 后台布局
│   ├── mock/               # Mock数据
│   │   ├── user.js
│   │   ├── article.js
│   │   └── index.js
│   ├── router/             # 路由
│   │   ├── modules/        # 路由模块
│   │   └── index.js
│   ├── store/              # Pinia状态
│   │   ├── user.js
│   │   ├── app.js
│   │   └── index.js
│   ├── utils/              # 工具函数
│   │   ├── request.js      # Axios封装
│   │   ├── auth.js         # 认证相关
│   │   └── index.js
│   ├── views/              # 页面
│   │   ├── home/           # 前台页面
│   │   │   ├── Home.vue
│   │   │   ├── ArticleDetail.vue
│   │   │   ├── Category.vue
│   │   │   ├── Login.vue
│   │   │   └── Register.vue
│   │   └── admin/          # 后台页面
│   │       ├── Dashboard.vue
│   │       ├── ArticleList.vue
│   │       ├── ArticleEdit.vue
│   │       └── Category.vue
│   ├── App.vue
│   └── main.js
├── .env.development        # 开发环境变量
├── .env.production         # 生产环境变量
├── vite.config.js          # Vite配置
├── tailwind.config.js      # Tailwind配置
└── package.json
```

看起来文件很多，但其实都是按功能分的，很清晰。一个模块一个文件夹，找东西方便。

### 2.4 配置路径别名

开发中用 `@/` 代替 `src/`，写路径更方便：

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig({
  plugins: [
    vue(),
    // 自动导入Vue/Router/Pinia等API
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
    }),
    // 自动导入组件
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    // Mock数据
    viteMockServe({
      mockPath: 'src/mock',
      enable: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    open: true,
  }
})
```

---

## 三、基础配置：环境变量与Axios封装

### 3.1 环境变量配置

```
# .env.development
VITE_APP_TITLE = '我的博客'
VITE_API_BASE_URL = '/api'
VITE_MOCK = true
```

```
# .env.production
VITE_APP_TITLE = '我的博客'
VITE_API_BASE_URL = 'https://api.example.com'
VITE_MOCK = false
```

### 3.2 Axios封装

把上一篇讲的Axios封装放进来，路径是 `src/utils/request.js`。（完整代码参考第15篇，这里就不重复贴了。）

### 3.3 Mock数据方案

用 `vite-plugin-mock` 模拟接口，这样前端开发不用等后端。

```javascript
// src/mock/user.js
import Mock from 'mockjs'

const users = [
  { id: 1, username: 'admin', password: '123456', role: 'admin', nickname: '管理员', avatar: 'https://picsum.photos/100/100?random=1' },
  { id: 2, username: 'user', password: '123456', role: 'user', nickname: '普通用户', avatar: 'https://picsum.photos/100/100?random=2' },
]

export default [
  // 登录
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }) => {
      const { username, password } = JSON.parse(body)
      const user = users.find(u => u.username === username && u.password === password)
      
      if (!user) {
        return {
          code: 400,
          message: '用户名或密码错误',
          data: null
        }
      }
      
      return {
        code: 0,
        message: '登录成功',
        data: {
          token: Mock.Random.string('lower', 32),
          userInfo: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            role: user.role
          }
        }
      }
    }
  },
  // 获取用户信息
  {
    url: '/api/user/me',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: {
          id: 1,
          username: 'admin',
          nickname: '管理员',
          avatar: 'https://picsum.photos/100/100?random=1',
          role: 'admin',
          email: 'admin@example.com',
          createdAt: '2024-01-01'
        }
      }
    }
  }
]
```

文章、分类的Mock也是类似的写法，用Mock.js生成随机数据。

---

## 四、状态管理：Pinia Store

### 4.1 用户Store

```javascript
// src/store/user.js
import { defineStore } from 'pinia'
import { login, logout, getUserInfo } from '@/api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.userInfo?.role === 'admin',
  },
  
  actions: {
    // 登录
    async login(loginForm) {
      const data = await login(loginForm)
      this.token = data.token
      this.userInfo = data.userInfo
      localStorage.setItem('token', data.token)
      return data
    },
    
    // 获取用户信息
    async fetchUserInfo() {
      const data = await getUserInfo()
      this.userInfo = data
      return data
    },
    
    // 退出登录
    async logout() {
      try {
        await logout()
      } finally {
        this.token = ''
        this.userInfo = null
        localStorage.removeItem('token')
      }
    }
  }
})
```

### 4.2 全局Store

```javascript
// src/store/app.js
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,  // 侧边栏折叠状态
    theme: 'light',            // 主题
  }),
  
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    setTheme(theme) {
      this.theme = theme
    }
  },
  
  persist: true  // 持久化（需要pinia-plugin-persistedstate插件）
})
```

---

## 五、路由设计：Vue Router

### 5.1 路由表设计

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore } from '@/store/user'

const routes = [
  // 前台页面
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/home/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'article/:id',
        name: 'ArticleDetail',
        component: () => import('@/views/home/ArticleDetail.vue'),
        meta: { title: '文章详情' }
      },
      {
        path: 'category/:id',
        name: 'Category',
        component: () => import('@/views/home/Category.vue'),
        meta: { title: '分类' }
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/home/Search.vue'),
        meta: { title: '搜索' }
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/home/Login.vue'),
        meta: { title: '登录' }
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/home/Register.vue'),
        meta: { title: '注册' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/home/Profile.vue'),
        meta: { title: '个人中心', requiresAuth: true }
      }
    ]
  },
  
  // 后台管理
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'articles',
        name: 'AdminArticles',
        component: () => import('@/views/admin/ArticleList.vue'),
        meta: { title: '文章管理' }
      },
      {
        path: 'articles/new',
        name: 'AdminArticleNew',
        component: () => import('@/views/admin/ArticleEdit.vue'),
        meta: { title: '新建文章' }
      },
      {
        path: 'articles/:id/edit',
        name: 'AdminArticleEdit',
        component: () => import('@/views/admin/ArticleEdit.vue'),
        meta: { title: '编辑文章' }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('@/views/admin/Category.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'comments',
        name: 'AdminComments',
        component: () => import('@/views/admin/Comment.vue'),
        meta: { title: '评论管理' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/User.vue'),
        meta: { title: '用户管理' }
      }
    ]
  },
  
  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }  // 路由切换滚到顶部
  }
})
```

### 5.2 路由守卫

```javascript
// 接上面的router/index.js

// 进度条配置
NProgress.configure({ showSpinner: false })

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  NProgress.start()
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 我的博客` : '我的博客'
  
  const userStore = useUserStore()
  
  // 需要登录的路由
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  // 需要管理员权限的路由
  if (to.meta.requiresAdmin) {
    // 如果还没拉取用户信息，先拉取
    if (!userStore.userInfo) {
      try {
        await userStore.fetchUserInfo()
      } catch (err) {
        ElMessage.error('获取用户信息失败')
        next({ name: 'Login' })
        return
      }
    }
    
    if (!userStore.isAdmin) {
      ElMessage.error('没有管理员权限')
      next({ name: 'Home' })
      return
    }
  }
  
  next()
})

// 全局后置守卫
router.afterEach(() => {
  NProgress.done()
})

export default router
```

---

## 六、布局组件：搭好骨架

### 6.1 整体布局Layout

```vue
<!-- src/layouts/DefaultLayout.vue -->
<template>
  <div class="default-layout min-h-screen flex flex-col bg-gray-50">
    <!-- 顶部导航 -->
    <Navbar />
    
    <!-- 主体内容 -->
    <main class="flex-1 container mx-auto px-4 py-6 max-w-6xl">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <!-- 底部 -->
    <footer class="bg-white border-t py-6 text-center text-gray-500 text-sm">
      <p>© 2024 我的博客 · Powered by Vue3</p>
    </footer>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

### 6.2 导航栏Navbar

```vue
<!-- src/layouts/components/Navbar.vue -->
<template>
  <header class="bg-white shadow-sm sticky top-0 z-50">
    <div class="container mx-auto px-4 max-w-6xl">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2">
          <span class="text-2xl">📝</span>
          <span class="text-xl font-bold text-gray-800">我的博客</span>
        </router-link>
        
        <!-- 搜索框 -->
        <div class="flex-1 max-w-md mx-8 hidden md:block">
          <el-input
            v-model="keyword"
            placeholder="搜索文章..."
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
        </div>
        
        <!-- 右侧菜单 -->
        <div class="flex items-center gap-4">
          <template v-if="userStore.isLoggedIn">
            <!-- 登录后 -->
            <router-link to="/admin" v-if="userStore.isAdmin" class="text-gray-600 hover:text-blue-500">
              管理后台
            </router-link>
            
            <el-dropdown @command="handleCommand">
              <div class="flex items-center gap-2 cursor-pointer">
                <el-avatar :src="userStore.userInfo?.avatar" size="small" />
                <span class="text-gray-700">{{ userStore.userInfo?.nickname }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          
          <template v-else>
            <!-- 未登录 -->
            <router-link to="/login" class="text-gray-600 hover:text-blue-500">
              登录
            </router-link>
            <router-link to="/register">
              <el-button type="primary" size="small">注册</el-button>
            </router-link>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { Search } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const keyword = ref('')

const handleSearch = () => {
  if (keyword.value.trim()) {
    router.push({ name: 'Search', query: { q: keyword.value } })
  }
}

const handleCommand = async (command) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        type: 'warning'
      })
      await userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/')
    } catch (err) {
      // 取消不处理
    }
  }
}
</script>
```

### 6.3 侧边栏Sidebar

后台布局的侧边栏：

```vue
<!-- src/layouts/components/Sidebar.vue -->
<template>
  <aside class="w-60 bg-white border-r h-screen fixed left-0 top-0 pt-16">
    <el-menu
      :default-active="route.path"
      router
      class="border-r-0 h-full"
    >
      <el-menu-item index="/admin">
        <el-icon><DataAnalysis /></el-icon>
        <span>仪表盘</span>
      </el-menu-item>
      
      <el-sub-menu index="article">
        <template #title>
          <el-icon><Document /></el-icon>
          <span>文章管理</span>
        </template>
        <el-menu-item index="/admin/articles">文章列表</el-menu-item>
        <el-menu-item index="/admin/articles/new">新建文章</el-menu-item>
      </el-sub-menu>
      
      <el-menu-item index="/admin/categories">
        <el-icon><Folder /></el-icon>
        <span>分类管理</span>
      </el-menu-item>
      
      <el-menu-item index="/admin/comments">
        <el-icon><ChatDotRound /></el-icon>
        <span>评论管理</span>
      </el-menu-item>
      
      <el-menu-item index="/admin/users">
        <el-icon><User /></el-icon>
        <span>用户管理</span>
      </el-menu-item>
    </el-menu>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { DataAnalysis, Document, Folder, ChatDotRound, User } from '@element-plus/icons-vue'

const route = useRoute()
</script>
```

---

## 七、页面开发：前台展示

### 7.1 首页：文章列表

```vue
<!-- src/views/home/Home.vue -->
<template>
  <div class="home-page">
    <div class="flex gap-6">
      <!-- 左侧主内容 -->
      <div class="flex-1">
        <!-- 轮播图 -->
        <el-carousel height="280px" class="rounded-lg overflow-hidden mb-6">
          <el-carousel-item v-for="item in banners" :key="item.id">
            <img :src="item.image" class="w-full h-full object-cover" alt="">
          </el-carousel-item>
        </el-carousel>
        
        <!-- 文章列表 -->
        <div class="space-y-4">
          <ArticleCard 
            v-for="article in articleList" 
            :key="article.id" 
            :article="article"
          />
        </div>
        
        <!-- 空状态 -->
        <div v-if="!loading && articleList.length === 0" class="text-center py-20 text-gray-400">
          <p class="text-4xl mb-2">📭</p>
          <p>暂无文章</p>
        </div>
        
        <!-- 分页 -->
        <div class="mt-8 flex justify-center">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            layout="prev, pager, next"
            @current-change="fetchArticles"
          />
        </div>
      </div>
      
      <!-- 右侧边栏 -->
      <aside class="w-72 hidden lg:block space-y-6">
        <!-- 热门文章 -->
        <div class="bg-white rounded-lg p-5 shadow-sm">
          <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
            🔥 热门文章
          </h3>
          <div class="space-y-3">
            <div 
              v-for="(item, index) in hotArticles" 
              :key="item.id"
              class="flex items-start gap-3 cursor-pointer hover:text-blue-500"
              @click="goDetail(item.id)"
            >
              <span 
                class="w-5 h-5 rounded flex items-center justify-center text-xs text-white flex-shrink-0"
                :class="index < 3 ? 'bg-red-500' : 'bg-gray-400'"
              >
                {{ index + 1 }}
              </span>
              <span class="text-sm text-gray-700 line-clamp-2">{{ item.title }}</span>
            </div>
          </div>
        </div>
        
        <!-- 分类 -->
        <div class="bg-white rounded-lg p-5 shadow-sm">
          <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
            📁 文章分类
          </h3>
          <div class="flex flex-wrap gap-2">
            <el-tag 
              v-for="cat in categories" 
              :key="cat.id"
              class="cursor-pointer"
              @click="goCategory(cat.id)"
            >
              {{ cat.name }}
            </el-tag>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getArticleList, getCategoryList } from '@/api/article'
import ArticleCard from '@/components/ArticleCard.vue'

const router = useRouter()

const articleList = ref([])
const hotArticles = ref([])
const categories = ref([])
const banners = ref([
  { id: 1, image: 'https://picsum.photos/800/280?random=1' },
  { id: 2, image: 'https://picsum.photos/800/280?random=2' },
  { id: 3, image: 'https://picsum.photos/800/280?random=3' },
])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const loading = ref(false)

const fetchArticles = async () => {
  loading.value = true
  try {
    const data = await getArticleList({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    articleList.value = data.list
    pagination.total = data.total
  } finally {
    loading.value = false
  }
}

const fetchHotArticles = async () => {
  const data = await getArticleList({ page: 1, pageSize: 5, sort: 'views' })
  hotArticles.value = data.list
}

const fetchCategories = async () => {
  const data = await getCategoryList()
  categories.value = data
}

const goDetail = (id) => {
  router.push(`/article/${id}`)
}

const goCategory = (id) => {
  router.push(`/category/${id}`)
}

onMounted(() => {
  fetchArticles()
  fetchHotArticles()
  fetchCategories()
})
</script>
```

### 7.2 文章详情页

```vue
<!-- src/views/home/ArticleDetail.vue -->
<template>
  <div class="article-detail bg-white rounded-lg shadow-sm p-8">
    <!-- 加载中 -->
    <div v-if="loading" class="text-center py-20">
      <el-icon class="animate-spin text-4xl text-blue-500"><Loading /></el-icon>
    </div>
    
    <template v-else>
      <!-- 标题区 -->
      <h1 class="text-3xl font-bold text-gray-800 mb-4">{{ article.title }}</h1>
      
      <div class="flex items-center gap-4 text-gray-500 text-sm mb-6 pb-6 border-b">
        <span>👤 {{ article.author }}</span>
        <span>📅 {{ article.createdAt }}</span>
        <span>👁 {{ article.views }} 阅读</span>
        <span>❤️ {{ article.likes }} 点赞</span>
        <el-tag size="small">{{ article.categoryName }}</el-tag>
      </div>
      
      <!-- 文章正文（Markdown渲染） -->
      <div 
        class="markdown-body prose max-w-none" 
        v-html="renderedContent"
      ></div>
      
      <!-- 点赞分享 -->
      <div class="flex justify-center gap-4 mt-10 pt-6 border-t">
        <el-button 
          :type="isLiked ? 'danger' : 'default'" 
          size="large" 
          round
          @click="handleLike"
        >
          <el-icon><Star /></el-icon>
          点赞 {{ article.likes }}
        </el-button>
      </div>
      
      <!-- 评论区 -->
      <div class="mt-10">
        <h3 class="text-xl font-bold mb-4">💬 评论 ({{ commentList.length }})</h3>
        
        <!-- 发表评论 -->
        <div v-if="userStore.isLoggedIn" class="mb-6">
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="3"
            placeholder="发表你的评论..."
          />
          <div class="flex justify-end mt-2">
            <el-button type="primary" @click="submitComment">发表评论</el-button>
          </div>
        </div>
        <div v-else class="mb-6 p-4 bg-gray-50 rounded text-center text-gray-500">
          请先<router-link to="/login" class="text-blue-500">登录</router-link>后发表评论
        </div>
        
        <!-- 评论列表 -->
        <div class="space-y-4">
          <div v-for="comment in commentList" :key="comment.id" class="flex gap-3">
            <el-avatar :src="comment.avatar" />
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium">{{ comment.nickname }}</span>
                <span class="text-xs text-gray-400">{{ comment.createdAt }}</span>
              </div>
              <p class="text-gray-700">{{ comment.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import { Star, Loading } from '@element-plus/icons-vue'
import { getArticleDetail, likeArticle, getCommentList, addComment } from '@/api/article'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const userStore = useUserStore()

const article = ref({})
const commentList = ref([])
const commentContent = ref('')
const loading = ref(false)
const isLiked = ref(false)

// Markdown渲染
const renderedContent = computed(() => {
  if (!article.value.content) return ''
  marked.setOptions({
    highlight: (code) => hljs.highlightAuto(code).value
  })
  return marked(article.value.content)
})

const fetchArticle = async () => {
  loading.value = true
  try {
    const data = await getArticleDetail(route.params.id)
    article.value = data
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  const data = await getCommentList(route.params.id)
  commentList.value = data
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  if (isLiked.value) {
    await unlikeArticle(article.value.id)
    article.value.likes--
  } else {
    await likeArticle(article.value.id)
    article.value.likes++
  }
  isLiked.value = !isLiked.value
}

const submitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  await addComment(article.value.id, { content: commentContent.value })
  ElMessage.success('评论成功')
  commentContent.value = ''
  fetchComments()
}

onMounted(() => {
  fetchArticle()
  fetchComments()
})

// 路由参数变化时重新加载
watch(() => route.params.id, () => {
  fetchArticle()
  fetchComments()
})
</script>
```

### 7.3 登录/注册页

登录和注册页面用Element Plus的Form组件做，表单校验、loading状态这些都加上。代码模式跟之前TodoList里的登录类似，这里就不完整贴了。

核心逻辑：
1. 表单校验（用户名/密码不能为空、密码长度等）
2. 提交时按钮loading，防止重复点击
3. 登录成功后存token，跳转到之前的页面或首页
4. 注册成功后跳登录页

---

## 八、页面开发：后台管理

### 8.1 管理后台布局

```vue
<!-- src/layouts/AdminLayout.vue -->
<template>
  <div class="admin-layout">
    <AdminHeader />
    <Sidebar />
    
    <main class="ml-60 pt-14 min-h-screen bg-gray-50 p-6">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import AdminHeader from './components/AdminHeader.vue'
import Sidebar from './components/Sidebar.vue'
</script>
```

### 8.2 文章管理CRUD

文章列表是后台最核心的页面——搜索、筛选、列表、分页、新增、编辑、删除。

```vue
<!-- src/views/admin/ArticleList.vue -->
<template>
  <div class="article-list-page">
    <div class="bg-white rounded-lg p-6">
      <!-- 搜索栏 -->
      <div class="flex flex-wrap gap-4 mb-6">
        <el-input 
          v-model="searchForm.keyword" 
          placeholder="搜索标题" 
          style="width: 200px"
          clearable
          @clear="fetchList"
        />
        <el-select 
          v-model="searchForm.categoryId" 
          placeholder="分类" 
          style="width: 150px"
          clearable
        >
          <el-option 
            v-for="cat in categories" 
            :key="cat.id" 
            :label="cat.name" 
            :value="cat.id" 
          />
        </el-select>
        <el-select 
          v-model="searchForm.status" 
          placeholder="状态" 
          style="width: 120px"
          clearable
        >
          <el-option label="已发布" :value="1" />
          <el-option label="草稿" :value="0" />
        </el-select>
        <el-button type="primary" @click="fetchList" :icon="Search">搜索</el-button>
        <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
        <el-button type="success" @click="goCreate" :icon="Plus">新建文章</el-button>
      </div>
      
      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column prop="author" label="作者" width="100" />
        <el-table-column prop="views" label="阅读量" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="goEdit(row.id)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="mt-6 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetchList"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { getArticleList, deleteArticle } from '@/api/article'
import { getCategoryList } from '@/api/category'

const router = useRouter()

const searchForm = reactive({
  keyword: '',
  categoryId: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])
const categories = ref([])
const loading = ref(false)

const fetchList = async () => {
  loading.value = true
  try {
    const data = await getArticleList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    })
    tableData.value = data.list
    pagination.total = data.total
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  const data = await getCategoryList()
  categories.value = data
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.categoryId = ''
  searchForm.status = ''
  pagination.page = 1
  fetchList()
}

const handleSizeChange = () => {
  pagination.page = 1
  fetchList()
}

const goCreate = () => {
  router.push('/admin/articles/new')
}

const goEdit = (id) => {
  router.push(`/admin/articles/${id}/edit`)
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    
    await deleteArticle(id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (err) {
    // 取消不处理
  }
}

onMounted(() => {
  fetchList()
  fetchCategories()
})
</script>
```

这就是一个标准的后台列表页模板——搜索 + 表格 + 分页 + CRUD。基本上后台所有列表页都是这个套路，换个API换几个字段就行。

### 8.3 分类管理

分类管理更简单，就是一个简单的CRUD，用Dialog弹窗做新增和编辑。套路跟文章管理类似，就不展开了。

---

## 九、功能优化：让项目更完善

### 9.1 权限控制

除了路由守卫，还要做按钮级别的权限控制：

```javascript
// src/utils/permission.js
import { useUserStore } from '@/store/user'

export const hasPermission = (permission) => {
  const userStore = useUserStore()
  // 管理员有所有权限
  if (userStore.isAdmin) return true
  // 普通用户检查权限列表
  return userStore.userInfo?.permissions?.includes(permission)
}

// 自定义指令
export const permissionDirective = {
  mounted(el, binding) {
    if (!hasPermission(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  }
}
```

```vue
<!-- 使用 -->
<el-button v-permission="'article:delete'" type="danger">删除</el-button>
```

### 9.2 404页面

```vue
<!-- src/views/NotFound.vue -->
<template>
  <div class="not-found min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div class="text-9xl font-bold text-gray-200 mb-4">404</div>
    <h2 class="text-2xl font-bold text-gray-700 mb-2">页面不存在</h2>
    <p class="text-gray-500 mb-8">抱歉，您访问的页面走丢了...</p>
    <el-button type="primary" @click="goHome">返回首页</el-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const goHome = () => router.push('/')
</script>
```

### 9.3 加载状态与空状态

好的用户体验，loading和空状态都不能少：
- 列表加载中显示骨架屏或loading动画
- 没有数据显示空状态插画 + 引导文案
- 加载失败显示错误 + 重试按钮

Element Plus提供了 `v-loading` 指令和 `el-empty` 组件，直接用就行。

---

## 十、项目优化：性能与体验

### 10.1 路由懒加载

上面的路由已经用 `() => import()` 写了，就是懒加载——访问到哪个页面才加载哪个页面的JS，首屏更快。

### 10.2 图片懒加载

图片很多的页面，用懒加载——滚动到可视区域才加载图片：

```vue
<el-image v-for="item in list" :key="item.id" :src="item.image" lazy />
```

Element Plus的Image组件加个 `lazy` 属性就行。

### 10.3 打包体积优化

1. **组件按需引入**：已经用unplugin-vue-components做了
2. **路由懒加载**：上面做了
3. **大图片压缩**：图片转webp格式，或者用CDN
4. **Gzip压缩**：Nginx开gzip，或者vite-plugin-compression打包生成.gz文件
5. **CDN加速**：静态资源放CDN
6. **Tree Shaking**：Vite默认开启，确保你的代码是ES Module

---

## 十一、部署上线：让全世界都能看到

### 11.1 打包构建

```bash
npm run build
```

打包完会生成 `dist` 目录，里面就是静态文件。

### 11.2 静态托管

有很多免费的静态托管服务：
- **Vercel**：最推荐，GitHub一键部署，自动HTTPS
- **Netlify**：跟Vercel类似，也很好用
- **GitHub Pages**：GitHub自带的，免费
- **阿里云/腾讯云COS**：国内访问快，但要花钱

以Vercel为例：
1. 把代码推到GitHub
2. Vercel官网点New Project，选你的仓库
3. 配置Build Command（npm run build）和Output Directory（dist）
4. 点Deploy，等一分钟就好了

部署完会给你一个 `xxx.vercel.app` 的域名，直接就能访问。

### 11.3 绑定域名

如果你有自己的域名：
1. 在Vercel项目设置里加你的域名
2. 去你的域名服务商那里，配置CNAME解析到Vercel给你的地址
3. 等解析生效，Vercel会自动给你配HTTPS证书

搞定！你的博客就正式上线了，全世界都能访问。

---

## 十二、总结与后续学习建议

### 12.1 整个系列回顾

恭喜你！从第一篇HTML到现在，你已经看完了整个前端速成系列。我们一路走来：

| 序号 | 文章 | 内容 |
|------|------|------|
| 01 | HTML速成教程 | 网页骨架 |
| 02 | CSS速成教程 | 网页美化 |
| 03 | JavaScript速成教程 | 网页逻辑 |
| 04 | ES6语法糖一把梭 | 现代JS语法 |
| 05 | npm包管理 | 包管理和工程化 |
| 06 | Vite神速构建 | 构建工具 |
| 07 | Vue3入门 | Vue3基础 + Composition API |
| 08 | Vue Router | 路由管理 |
| 09 | Pinia状态管理 | 状态管理 |
| 10 | Vue组件通信 | 组件间传值 |
| 11 | Element Plus | PC端组件库 |
| 12 | Tailwind CSS | 原子化CSS |
| 13 | Vant移动端 | 移动端组件库 |
| 14 | HTTP协议解密 | 网络基础 |
| 15 | Axios封装 | 请求封装 |
| 16 | 综合实战 | 完整项目 |

整整16篇，从零基础到完整项目，前端的核心知识体系就都覆盖了。

### 12.2 学习心得

作为一个过来人的几点建议：

1. **一定要动手敲**：看十遍不如敲一遍。跟着教程敲代码，遇到bug自己调试，这样进步最快
2. **做一个完整的项目**：零散的知识点没用，一定要串起来做项目。做完一个完整项目，你的水平会有质的飞跃
3. **不要追求完美**：第一版先做出来，再慢慢优化。很多人一开始就想写完美的代码，结果迟迟动不了手
4. **学会查文档**：官方文档是最好的教程，遇到问题先查文档
5. **保持好奇心**：前端技术更新很快，要保持学习的热情。但也不用焦虑，核心的东西万变不离其宗

### 12.3 接下来可以学什么？

这个系列是前端基础，学完之后你可以根据兴趣往不同方向深入：

- **深入Vue生态**：VueUse、Nuxt.js、TypeScript
- **工程化方向**：Webpack原理、Vite插件、CI/CD、Monorepo
- **性能优化方向**：渲染性能、打包优化、性能监控
- **全栈方向**：Node.js、Express/Nest.js、数据库
- **移动端方向**：uni-app、React Native、Flutter
- **可视化方向**：ECharts、D3.js、Three.js
- **低代码方向**：拖拽式页面搭建、表单引擎

前端的世界很大，选一个你感兴趣的方向深入进去就好。

🤖 **AI时代的前端工程师**：
- 这个系列教你的是"基础"——这些是你必须掌握的
- AI能帮你写代码、改bug、做封装，但它不能代替你思考
- 架构设计、业务理解、代码质量、性能优化——这些才是你的核心竞争力
- 把AI当作你的"超级助手"，让它帮你干重复的活，你专注在更有价值的事情上
- 永远保持学习，技术在变，AI在进化，但学习能力是不会过时的

### 12.4 最后想说的话

如果你从第一篇一直看到这里，那真的很了不起——能坚持看完16篇技术文章的人不多。

我刚开始学前端的时候，也很迷茫。看了很多视频、很多教程，但总觉得好像什么都会了一点，又好像什么都不会。直到我跟着做了第一个完整的项目，才突然有一种"开窍"的感觉——原来这些技术是这样组合在一起的。

所以，我希望你也能动手把这个博客项目做出来。不用追求完美，先做出来再说。做完之后，你可以在这个基础上不断加功能、优化代码——这就是成长的过程。

前端的路很长，但只要你一直在走，就一定能到达你想去的地方。

**加油，未来的前端工程师！我们山顶见！** 🏔️

---

> 💬 **写在最后**：
> 
> 16篇文章，十几万字，写到这里终于告一段落了。
> 
> 说实话，写这个系列比我想象的要累——要兼顾通俗和准确，要有趣还要有干货，要适合新手还要有深度。但一想到可能会帮到一些人，就觉得值了。
> 
> 如果你真的跟着这个系列学到了东西，那就是我最大的快乐。也欢迎你把这个系列分享给更多正在学前端的朋友。
> 
> 前端路漫漫，愿你我都能保持热爱，奔赴山海。
> 
> **点赞 + 收藏 + 关注，前端学习不迷路！** 咱们下期再见~ 👋

---

*系列文章回顾：*
- *第01篇：《HTML速成教程：3小时做出你的第一个网页》*
- *第02篇：《CSS速成教程：给你的网页化个妆》*
- *第03篇：《JavaScript速成教程：让网页动起来》*
- *第04篇：《ES6语法糖一把梭：写JS像写诗一样》*
- *第05篇：《npm包管理：前端的外卖平台》*
- *第06篇：《Vite神速构建：前端工程化加速器》*
- *第07篇：《Vue3入门：Composition API写起来到底有多爽》*
- *第08篇：《Vue Router完全指南：前端路由就这点事》*
- *第09篇：《Pinia状态管理：Vuex的青春版》*
- *第10篇：《Vue组件通信8件套：一家人怎么传话》*
- *第11篇：《Element Plus开箱即用：CV工程师的快乐》*
- *第12篇：《Tailwind CSS：不用写CSS的快乐》*
- *第13篇：《Vant移动端：小程序H5一把梭》*
- *第14篇：《HTTP协议解密：浏览器和服务器到底在聊什么》*
- *第15篇：《Axios封装指南：前后端对接的正确姿势》*
- *第16篇：《前端综合实战：从0到1上线一个博客系统》（本文）*
