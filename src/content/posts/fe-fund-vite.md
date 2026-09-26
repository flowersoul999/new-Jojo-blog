---
title: "Vite神速构建：5分钟搭出企业级前端项目"
published: 2026-08-31
description: ""
tags: ["前端基础"]
category: "技术总结"
draft: false
lang: "zh-CN"
---

> 💡 **写在前面**：以前搭个前端项目，光配置Webpack就得半天——loader、plugin、devServer……配置文件写了几百行，项目还没开始写，人先累了。现在有了Vite，一切都不一样了——一行命令创建项目，秒级启动开发服务器，构建速度飞起。这篇带你从零开始，5分钟搭出一个Vue3+Vite的企业级脚手架。全文约8000字，建议边操作边看！

---

## 📑 目录导航

- [一、Vite是什么？为什么它这么快？](#一vite是什么为什么它这么快)
  - [1.1 一句话理解Vite](#11-一句话理解vite)
  - [1.2 为什么需要构建工具？](#12-为什么需要构建工具)
  - [1.3 Vite vs Webpack：快在哪里？](#13-vite-vs-webpack快在哪里)
- [二、快速上手：创建第一个Vite项目](#二快速上手创建第一个vite项目)
  - [2.1 用create-vite创建项目](#21-用create-vite创建项目)
  - [2.2 项目结构一览](#22-项目结构一览)
  - [2.3 三个核心命令](#23-三个核心命令)
- [三、Vite配置文件详解](#三vite配置文件详解)
  - [3.1 vite.config.js基础结构](#31-viteconfigjs基础结构)
  - [3.2 常用配置项一览](#32-常用配置项一览)
  - [3.3 配置别名和代理](#33-配置别名和代理)
- [四、CSS处理：Sass、CSS Modules、全局样式](#四css处理sasscss-modules全局样式)
  - [4.1 使用Sass/Less](#41-使用sassless)
  - [4.2 CSS Modules](#42-css-modules)
  - [4.3 全局样式与变量](#43-全局样式与变量)
- [五、静态资源与环境变量](#五静态资源与环境变量)
  - [5.1 图片、字体等静态资源](#51-图片字体等静态资源)
  - [5.2 环境变量.env](#52-环境变量env)
  - [5.3 多环境配置](#53-多环境配置)
- [六、插件生态：Vite的"超能力"](#六插件生态vite的超能力)
  - [6.1 常用插件推荐](#61-常用插件推荐)
  - [6.2 插件怎么用？](#62-插件怎么用)
- [七、实战项目：从0搭建Vue3企业级脚手架](#七实战项目从0搭建vue3企业级脚手架)
  - [7.1 需求分析](#71-需求分析)
  - [7.2 分步搭建](#72-分步搭建)
  - [7.3 目录结构设计](#73-目录结构设计)
  - [7.4 完整配置文件](#74-完整配置文件)
- [八、新手必避的10个坑 ⚠️](#八新手必避的10个坑-️)
- [九、面试八股精选](#九面试八股精选)
- [十、总结与后续学习建议](#十总结与后续学习建议)

---

## 一、Vite是什么？为什么它这么快？

### 1.1 一句话理解Vite

**Vite就是一个"又快又爽"的前端构建工具，帮你把代码从开发到打包一条龙搞定。**

Vite（法语意思是"快"，发音类似"vit"）是Vue作者尤雨溪搞出来的新一代构建工具，主打一个"快"——开发服务器秒启动、热更新秒响应，用过的人都说回不去了。

打个比方：
- Webpack = 老式火车，启动慢，装得多，稳但是慢
- Vite = 高铁，启动快，速度快，体验好

现在Vite已经是前端构建工具的主流选择了，Vue和React的官方脚手架都默认用Vite。早学早享受。

### 1.2 为什么需要构建工具？

有人可能会问：我直接写HTML/CSS/JS，双击打开不就能运行吗？为啥还要构建工具？

好问题！在"上古时代"确实是这样的，但现在前端工程化了，构建工具要做的事情可多了：

| 功能 | 说明 |
|------|------|
| 🔥 **开发服务器** | 本地起个服务，改完代码自动刷新，不用手动F5 |
| 📦 **模块化** | 支持import/export，把代码拆成一个个模块 |
| 🎨 **预处理器** | Sass/Less/TypeScript编译成浏览器认识的CSS/JS |
| 🧹 **代码压缩** | 去掉空格、注释，缩短变量名，减小体积 |
| 🖼️ **资源处理** | 图片压缩、base64内联、雪碧图 |
| 🌳 **Tree Shaking** | 摇掉没用的代码，减小包体积 |
| 🚀 **热更新HMR** | 改了代码不用刷新整个页面，只更新变化的部分 |

简单说就是：**构建工具让你能用最爽的方式写代码，然后输出浏览器能识别的、性能最优的代码。**

### 1.3 Vite vs Webpack：快在哪里？

以前Webpack是老大，但它有个痛点——**慢**。项目大了之后，启动开发服务器要等好几分钟，热更新也要等好几秒，开发体验很差。

Vite为什么快？核心原因是**开发模式的思路不一样**：

| 对比项 | Webpack | Vite |
|--------|---------|------|
| **启动方式** | 先打包所有模块，再启动服务器 | 直接启动服务器，按需编译 |
| **启动速度** | 慢（几分钟都有可能） | 快（毫秒级） |
| **热更新速度** | 随项目变大而变慢 | 始终很快 |
| **构建原理** | 打包所有文件 → 生成bundle → 服务器返回bundle | 利用浏览器原生ES Module，按需请求编译 |
| **生产构建** | Webpack自己打包 | 用Rollup打包 |

一句话总结：**Webpack是"先打包再服务"，Vite是"先服务再按需打包"。**

Vite在开发模式下利用了浏览器原生支持的ES Module（ESM），你import什么，浏览器就请求什么，Vite在服务器端实时编译返回。不用把所有东西都打包在一起，自然就快了。

生产环境下，Vite用Rollup来打包，因为Rollup对ES Module的支持更好，打包出来的体积也更小。

🤖 **AI小助手**：刚接触构建工具，很多概念听不懂？可以这么问AI："用大白话解释一下Vite和Webpack的区别，为什么Vite更快？最好打个比方"——AI能给你讲得明明白白。

---

## 二、快速上手：创建第一个Vite项目

### 2.1 用create-vite创建项目

Vite官方提供了一个脚手架工具 `create-vite`，一行命令就能创建项目。

找个合适的文件夹，打开命令行，输入：

```bash
# npm 6.x
npm create vite@latest my-vue-app --template vue

# npm 7+（多了两个横杠）
npm create vite@latest my-vue-app -- --template vue

# 推荐写法：用交互式创建
npm create vite@latest
```

👉 **推荐用交互式方式**（就是最后那种不加参数的），它会一步步问你项目叫啥、用什么框架，不容易记错命令。

来，跟着走一遍：

```bash
npm create vite@latest
```

然后按提示操作：

```
? Project name: › my-vue-app       # 输入项目名
? Select a framework: › - Use arrow-keys. Return to submit.
    Vanilla                        # 原生JS
❯   Vue                            # Vue（选这个！）
    React
    Preact
    Lit
    Svelte
    Solid
    Qwik
    Others
? Select a variant: › - Use arrow-keys. Return to submit.
❯   JavaScript                     # JS版本
    TypeScript                     # TS版本
    Customize with create-vue
    Nuxt.js
```

选完之后，它会自动创建项目。然后按照提示操作：

```bash
cd my-vue-app      # 进入项目文件夹
npm install        # 安装依赖
npm run dev        # 启动开发服务器
```

启动成功之后，命令行会显示一个地址，比如 `http://localhost:5173/`，浏览器打开这个地址，就能看到你的Vue项目了！

是不是很快？从创建到启动，5分钟都不到。

### 2.2 项目结构一览

创建好的项目结构是这样的：

```
my-vue-app/
  ├─ node_modules/        # 依赖包（npm install生成的）
  ├─ public/              # 静态资源（直接复制到根目录）
  │   └─ vite.svg
  ├─ src/                 # 源代码目录（重点！）
  │   ├─ assets/          # 资源文件（图片、样式等）
  │   │   └─ vue.svg
  │   ├─ components/      # 组件
  │   │   └─ HelloWorld.vue
  │   ├─ App.vue          # 根组件
  │   ├─ main.js          # 入口文件
  │   └─ style.css        # 全局样式
  ├─ .gitignore           # Git忽略文件
  ├─ index.html           # HTML入口文件
  ├─ package.json         # 项目配置
  ├─ package-lock.json    # 版本锁定
  └─ vite.config.js       # Vite配置文件
```

几个关键文件说一下：

| 文件/目录 | 作用 |
|-----------|------|
| `index.html` | HTML入口，Vite的入口就是HTML文件（跟Webpack不一样） |
| `src/main.js` | JS入口文件，Vue从这里开始 |
| `src/App.vue` | 根组件，页面的最外层 |
| `vite.config.js` | Vite的配置文件，很重要 |
| `public/` | 放静态资源，里面的文件会原封不动复制到打包后的根目录 |
| `src/assets/` | 放需要被构建处理的资源（图片、样式等） |

### 2.3 三个核心命令

Vite项目有三个最常用的命令：

| 命令 | 作用 |
|------|------|
| `npm run dev` | 启动开发服务器（写代码的时候用） |
| `npm run build` | 打包构建，生成生产环境代码（上线前用） |
| `npm run preview` | 预览打包后的结果（打包完看看效果） |

#### 开发模式

```bash
npm run dev
```

启动后终端显示：

```
  VITE v4.4.0  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

看到没？320毫秒就启动了！这就是Vite的速度。

#### 打包构建

```bash
npm run build
```

打包完之后，会生成一个 `dist` 文件夹，里面就是可以上线的静态文件。

#### 预览打包结果

```bash
npm run preview
```

打包完可以用这个命令本地预览一下，确保打包出来的东西没问题再上线。

---

## 三、Vite配置文件详解

### 3.1 vite.config.js基础结构

项目根目录下的 `vite.config.js` 就是Vite的配置文件，长这样：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
})
```

用 `defineConfig` 包裹配置，好处是有智能提示。

配置项很多，但常用的也就那几个，不用全背，需要的时候查文档就行。

### 3.2 常用配置项一览

给你整理了最常用的配置项：

| 配置项 | 作用 | 常用值 |
|--------|------|--------|
| `plugins` | 插件数组 | `[vue()]` |
| `root` | 项目根目录 | 默认是 `process.cwd()` |
| `base` | 部署的基础路径 | `'/'`、`'/sub-path/'` |
| `server.port` | 开发服务器端口 | `5173`（默认） |
| `server.open` | 启动时自动打开浏览器 | `true` / `false` |
| `server.proxy` | 代理配置（解决跨域） | 对象 |
| `resolve.alias` | 路径别名 | `{ '@': '/src' }` |
| `build.outDir` | 打包输出目录 | `dist`（默认） |
| `build.assetsDir` | 静态资源目录 | `assets`（默认） |
| `build.minify` | 压缩方式 | `'esbuild'` / `'terser'` |

### 3.3 配置别名和代理

这两个是实战中最常用的，详细说一下。

#### （1）路径别名

写代码的时候，引入文件经常要写 `../../components/xxx`，层级深了就很恶心。配置别名之后就清爽了。

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 用 @ 代表 src 目录
      '@': path.resolve(__dirname, './src'),
      // 还可以配置更多
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
    }
  }
})
```

配置完之后，引入文件就可以这么写：

```javascript
// 以前
import HelloWorld from '../../components/HelloWorld.vue'

// 现在
import HelloWorld from '@/components/HelloWorld.vue'
```

是不是清爽多了？

💡 如果用的是VS Code，记得在 `jsconfig.json` 或 `tsconfig.json` 里也配置一下，这样才有路径提示和跳转。

#### （2）代理配置（解决跨域）

开发的时候，前端跑在 `localhost:5173`，后端接口在 `localhost:3000`，直接请求会跨域。Vite的代理可以解决这个问题。

```javascript
export default defineConfig({
  server: {
    proxy: {
      // 以 /api 开头的请求，代理到后端
      '/api': {
        target: 'http://localhost:3000',  // 后端地址
        changeOrigin: true,                // 改变请求头中的origin
        rewrite: (path) => path.replace(/^\/api/, '')  // 路径重写（去掉/api前缀）
      }
    }
  }
})
```

这样配置之后，你前端请求 `/api/user`，Vite会帮你转发到 `http://localhost:3000/user`，跨域问题就解决了。

⚠️ **注意**：这个代理只在**开发环境**生效。生产环境的跨域要靠Nginx或者后端配置CORS。

---

## 四、CSS处理：Sass、CSS Modules、全局样式

### 4.1 使用Sass/Less

Vite内置了对CSS预处理器的支持，不用装额外的loader，只要装对应的预处理器就行：

```bash
# 使用Sass
npm i sass -D

# 使用Less
npm i less -D
```

然后在文件里直接用就行：

```vue
<style lang="scss">
$primary-color: #409eff;

.button {
  background-color: $primary-color;
  
  &:hover {
    background-color: darken($primary-color, 10%);
  }
}
</style>
```

就是这么简单，Vite会自动编译。

### 4.2 CSS Modules

CSS有个老大难问题——**全局污染**。A组件写了个 `.button` 样式，B组件也写了个 `.button`，两个就互相覆盖了。

CSS Modules就是来解决这个问题的。它的原理是：**给类名自动加个哈希值，保证每个类名都是唯一的**。

在Vite里用CSS Modules超简单，只要文件名是 `.module.css` / `.module.scss` 就行。

**文件命名：** `Button.module.scss`

```scss
// Button.module.scss
.button {
  background: blue;
  color: white;
  
  &:hover {
    background: darkblue;
  }
}
```

**在组件中使用：**

```vue
<script setup>
import styles from './Button.module.scss'
</script>

<template>
  <button :class="styles.button">
    点我
  </button>
</template>
```

渲染出来的HTML大概是这样的：

```html
<button class="Button_button__XyZ123">点我</button>
```

类名后面自动加了哈希，不会跟其他组件重名，完美解决全局污染问题。

💡 **在Vue单文件组件里**，其实更常用的是 `<style scoped>`，它也能实现样式隔离，原理跟CSS Modules类似，但写法更简单。CSS Modules在React项目里用得更多。

### 4.3 全局样式与变量

#### （1）全局样式

有些样式是全站通用的，比如重置样式、全局字体、公共类名等。一般的做法是：

1. 在 `src/styles/` 文件夹下放全局样式文件
2. 在 `main.js` 中引入

```javascript
// main.js
import '@/styles/reset.css'   // 重置样式
import '@/styles/global.css'  // 全局样式
```

#### （2）SCSS全局变量

如果Sass变量要在每个组件里都能用，不用每个组件都import，可以配置自动导入：

```javascript
// vite.config.js
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        // 自动导入变量文件
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  }
})
```

这样每个组件的style里都能直接用变量了，不用手动import。

---

## 五、静态资源与环境变量

### 5.1 图片、字体等静态资源

Vite处理静态资源超简单，直接import就行：

```vue
<script setup>
import logo from '@/assets/logo.png'
</script>

<template>
  <img :src="logo" alt="logo">
</template>
```

#### public目录 vs assets目录

很多新手搞不清这俩有啥区别：

| 对比项 | public/ | src/assets/ |
|--------|---------|-------------|
| **处理方式** | 原封不动复制，不参与构建 | 会被Vite处理（压缩、hash命名等） |
| **引用方式** | 直接用根路径，如 `/favicon.ico` | 用import引入或相对路径 |
| **适用场景** | 不会变的静态文件、favicon、robots.txt | 项目中用到的图片、字体等 |
| **文件名hash** | 没有 | 有（防止缓存） |

简单说：**项目里用的图片样式放assets，公共的静态文件放public。**

### 5.2 环境变量.env

项目一般有好几个环境：开发环境、测试环境、生产环境。不同环境的配置不一样（比如接口地址不一样）。

环境变量就是用来解决这个问题的——不同环境用不同的配置。

#### （1）创建.env文件

在项目根目录下创建 `.env` 文件：

```env
# .env
VITE_APP_TITLE = 我的项目
VITE_API_BASE_URL = /api
```

⚠️ **注意**：Vite规定，暴露给客户端的变量必须以 `VITE_` 开头，不然不会暴露（防止敏感变量泄漏）。

#### （2）在代码中使用

```javascript
console.log(import.meta.env.VITE_APP_TITLE)
console.log(import.meta.env.VITE_API_BASE_URL)
```

就是通过 `import.meta.env` 来访问。

#### （3）Vite内置的环境变量

Vite还内置了几个有用的：

| 变量 | 作用 |
|------|------|
| `import.meta.env.MODE` | 当前模式（development / production） |
| `import.meta.env.DEV` | 是不是开发环境（布尔值） |
| `import.meta.env.PROD` | 是不是生产环境（布尔值） |
| `import.meta.env.BASE_URL` | 配置的base路径 |

### 5.3 多环境配置

一般至少有三个环境：开发、测试、生产。可以创建多个env文件：

| 文件名 | 什么时候生效 |
|--------|-------------|
| `.env` | 所有环境都生效（基础配置） |
| `.env.development` | 开发环境（npm run dev） |
| `.env.production` | 生产环境（npm run build） |
| `.env.test` | 测试环境（需要指定mode） |

举个栗子：

**.env.development**（开发环境）
```env
VITE_API_BASE_URL = http://localhost:3000
VITE_APP_ENV = 开发环境
```

**.env.production**（生产环境）
```env
VITE_API_BASE_URL = https://api.example.com
VITE_APP_ENV = 生产环境
```

Vite会自动根据命令加载对应的文件：
- `npm run dev` → 加载 `.env` + `.env.development`
- `npm run build` → 加载 `.env` + `.env.production`

如果有自定义环境（比如test），在package.json里加个脚本：

```json
{
  "scripts": {
    "build:test": "vite build --mode test"
  }
}
```

然后 `npm run build:test` 就会加载 `.env.test`。

---

## 六、插件生态：Vite的"超能力"

Vite本身只提供基础能力，更多功能要靠插件。Vite的插件生态非常丰富，基本上你想要的功能都有对应的插件。

### 6.1 常用插件推荐

| 插件名 | 作用 | 推荐指数 |
|--------|------|---------|
| `@vitejs/plugin-vue` | Vue3支持（Vue项目必装） | ⭐⭐⭐⭐⭐ |
| `@vitejs/plugin-vue-jsx` | Vue的JSX支持 | ⭐⭐⭐ |
| `unplugin-auto-import` | 自动导入API（不用import ref、reactive这些了） | ⭐⭐⭐⭐⭐ |
| `unplugin-vue-components` | 自动导入组件（不用import组件了） | ⭐⭐⭐⭐⭐ |
| `vite-plugin-pages` | 基于文件系统的路由（类似Nuxt） | ⭐⭐⭐⭐ |
| `vite-plugin-vue-setup-extend` | setup语法糖支持name属性 | ⭐⭐⭐ |
| `vite-plugin-compression` | gzip/br压缩 | ⭐⭐⭐⭐ |
| `vite-plugin-imagemin` | 图片压缩 | ⭐⭐⭐⭐ |
| `vite-plugin-pwa` | PWA支持 | ⭐⭐⭐ |

### 6.2 插件怎么用？

三步搞定：

1. **安装插件**
```bash
npm i 插件名 -D
```

2. **在vite.config.js中引入**
```javascript
import 插件名 from '插件名'
```

3. **加到plugins数组里**
```javascript
export default defineConfig({
  plugins: [
    vue(),
    插件名({ /* 配置项 */ })
  ]
})
```

就这么简单。

---

## 七、实战项目：从0搭建Vue3企业级脚手架

说了这么多，咱们来真刀真枪干一把——从零搭建一个企业级的Vue3+Vite脚手架，把常用的配置都整上。

### 7.1 需求分析

我们要搭的脚手架包含这些功能：
- ✅ Vue3 + Vite 基础
- ✅ 路径别名 @
- ✅ Sass + 全局变量自动导入
- ✅ 环境变量（开发/测试/生产）
- ✅ 路由（Vue Router）
- ✅ 状态管理（Pinia）
- ✅ HTTP请求库（Axios封装）
- ✅ 自动导入API和组件
- ✅ ESLint + Prettier 代码规范
- ✅ 代理配置
- ✅ 打包压缩

### 7.2 分步搭建

#### 第一步：创建基础项目

```bash
npm create vite@latest vue-admin-template
# 选择 Vue + JavaScript
cd vue-admin-template
npm install
```

#### 第二步：安装依赖

```bash
# 核心依赖
npm i vue-router@4 pinia axios

# 开发依赖
npm i sass unplugin-auto-import unplugin-vue-components -D
```

#### 第三步：配置vite.config.js

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    // 自动导入API（ref、reactive、useRouter等不用手动import了）
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.js'
    }),
    // 自动导入组件（components里的组件不用手动import了）
    Components({
      dirs: ['src/components'],
      dts: 'src/components.d.js'
    })
  ],
  resolve: {
    // 路径别名
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 全局变量自动导入
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    // 代理配置
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    // 打包时删除console和debugger
    esbuild: {
      drop: ['console', 'debugger']
    }
  }
})
```

#### 第四步：目录结构设计

```
src/
  ├─ api/              # 接口请求
  │   └─ user.js
  ├─ assets/           # 静态资源
  │   └─ images/
  ├─ components/       # 公共组件
  │   └─ HelloWorld.vue
  ├─ layouts/          # 布局组件
  │   └─ DefaultLayout.vue
  ├─ router/           # 路由
  │   └─ index.js
  ├─ stores/           # Pinia状态
  │   └─ user.js
  ├─ styles/           # 样式
  │   ├─ variables.scss
  │   ├─ reset.scss
  │   └─ global.scss
  ├─ utils/            # 工具函数
  │   ├─ request.js    # axios封装
  │   └─ index.js
  ├─ views/            # 页面组件
  │   ├─ Home.vue
  │   └─ About.vue
  ├─ App.vue
  └─ main.js
```

#### 第五步：配置路由

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue')
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/About.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

#### 第六步：配置Pinia

```javascript
// src/stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: localStorage.getItem('token') || ''
  }),
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
    }
  }
})
```

#### 第七步：封装Axios

```javascript
// src/utils/request.js
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default request
```

#### 第八步：main.js入口

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import '@/styles/reset.scss'
import '@/styles/global.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
```

### 7.3 完整配置文件

上面只列了关键部分，完整的脚手架代码量有点大。你可以按照这个思路一步步搭，遇到问题查Vite官方文档就行。

👉 **动手试试**：按照上面的步骤，自己搭一个完整的脚手架。搭完之后，你对Vite和Vue工程化的理解会上一个大台阶。

🤖 **AI小助手**：搭建脚手架的时候，配置项太多记不住？没关系，直接跟AI说："帮我搭一个Vue3+Vite的企业级脚手架，要求：路径别名、Sass全局变量、路由、Pinia、Axios封装、自动导入、ESLint"——AI会给你生成完整的配置和代码，你再根据需要调整就行。AI时代，不用死记硬背配置。

---

## 八、新手必避的10个坑 ⚠️

### 坑1：路径别名不生效
**现象**：配置了@别名，但还是报错找不到模块
**原因**：只在vite.config.js里配了，jsconfig.json/tsconfig.json里没配
**解决**：两个地方都要配。vite.config.js管打包，jsconfig.json管编辑器提示

### 坑2：开发环境代理不生效
**现象**：配了proxy，但请求还是跨域
**原因**：请求地址写了完整的URL（比如 `http://localhost:3000/api/xxx`），不走代理
**解决**：请求路径要写相对路径，比如 `/api/xxx`，这样才会被代理拦截

### 坑3：环境变量取不到
**现象**：`import.meta.env.XXX` 是undefined
**原因**：变量名没有以 `VITE_` 开头
**解决**：Vite规定暴露给客户端的变量必须以 `VITE_` 开头，不然不会注入

### 坑4：生产环境路径不对
**现象**：打包后部署到服务器，页面白屏，资源404
**原因**：部署的路径不是根路径，但base配置没改
**解决**：vite.config.js里配置 `base: '/子路径/'`，跟你部署的路径一致

### 坑5：静态资源引用不对
**现象**：图片显示不出来
**原因**：public和assets搞混了，或者路径写错了
**解决**：
- public里的文件用根路径引用：`/logo.png`
- assets里的文件用import引入或相对路径
- 动态拼接的路径要用 `new URL()` 处理

### 坑6：热更新不生效
**现象**：改了代码页面不更新
**原因**：很多种可能，比如组件名不对、文件命名大小写问题
**解决**：
- 检查组件是否正确引入
- 确保文件名和引用的一致（注意大小写）
- 重启一下开发服务器试试

### 坑7：CSS Modules类名不对
**现象**：样式不生效，类名对不上
**原因**：文件名不是 `.module.css` 结尾，或者类名引用方式不对
**解决**：文件名必须是 `.module.xxx`，用 `import styles from './xxx.module.scss'` 引入

### 坑8：Sass全局变量不生效
**现象**：配置了additionalData，但组件里用变量报错
**原因**：路径不对，或者分号没写对
**解决**：检查路径是否正确，additionalData的末尾要加分号：`@import "...";`

### 坑9：打包后体积太大
**现象**：打包出来的js文件好几MB
**原因**：没做代码分割，第三方库都打包到一起了
**解决**：
- 配置build.rollupOptions手动分包
- 路由懒加载
- 大的第三方库用CDN引入
- 开启gzip压缩

### 坑10：ESLint和Vite冲突
**现象**：ESLint报错但Vite不提示，或者两者规则不一致
**原因**：Vite默认不集成ESLint，需要单独装插件
**解决**：装 `vite-plugin-eslint` 插件，开发时实时检查

---

## 九、面试八股精选

### 1. Vite和Webpack的区别？
**参考答案**：
- 开发模式：Webpack先打包所有模块再启动服务，Vite利用浏览器原生ESM直接启动，按需编译
- 启动速度：Vite更快，毫秒级启动，不受项目大小影响
- 热更新：Vite只需要让浏览器重新请求变化的模块，更快更精准
- 生产构建：Vite用Rollup打包，Webpack用自己的打包器
- 插件生态：Webpack更成熟，Vite发展很快，生态已经很完善了

### 2. Vite为什么这么快？
**参考答案**：
1. 开发模式利用浏览器原生ES Module，不用打包，直接启动服务器
2. 按需编译：浏览器请求哪个模块就编译哪个，不用全部打包
3. 利用esbuild预构建依赖，esbuild是Go写的，比JS写的打包器快10-100倍
4. 热更新基于ESM，只需要让浏览器重新请求变化的模块，不用重新打包整个bundle
5. 利用HTTP缓存，依赖模块强缓存，源码模块协商缓存

### 3. Vite的热更新原理是什么？
**参考答案**：
- Vite通过WebSocket建立浏览器和服务器的连接
- 文件变化时，服务器推送更新消息给浏览器
- 浏览器根据消息知道哪个模块变了，只重新请求变化的模块
- 利用HMR API精确更新模块，不需要刷新整个页面
- 比Webpack的热更新更快，因为不需要重新打包

### 4. import.meta.env是什么？
**参考答案**：
- import.meta是ES Module的一个内置对象，包含模块的元信息
- Vite在import.meta.env上暴露环境变量
- 只有以VITE_开头的变量才会暴露到客户端，防止敏感信息泄漏
- 常用的有MODE（模式）、DEV（是否开发）、PROD（是否生产）、BASE_URL（基础路径）

### 5. 配置代理后，生产环境怎么办？
**参考答案**：
- Vite的proxy只在开发环境生效，生产环境不生效
- 生产环境解决跨域的方案：
  1. 后端配置CORS（最推荐）
  2. Nginx反向代理（部署时配置）
  3. 前后端同域部署（前端和后端在同一个域名下）

---

## 十、总结与后续学习建议

### 10.1 本篇要点回顾

回顾一下这篇的核心内容：

1. **Vite是什么**：新一代前端构建工具，主打一个"快"
2. **为什么快**：开发模式利用原生ESM，按需编译，不用打包
3. **三个命令**：dev（开发）、build（打包）、preview（预览）
4. **配置文件**：vite.config.js，常用配置（别名、代理、端口等）
5. **CSS处理**：Sass/Less、CSS Modules、全局变量
6. **静态资源**：public和assets的区别
7. **环境变量**：.env文件，VITE_开头，多环境配置
8. **插件生态**：丰富的插件，按需使用

### 10.2 学习心得

Vite这东西，入门很简单，几行配置就能跑起来。但要深入的话，也有不少东西。

给新手的建议：
- **先会用**：创建项目、改配置、打包部署，先把基本流程走通
- **再理解**：慢慢理解它的原理，为什么这么快，HMR是怎么回事
- **按需学插件**：需要什么功能就找什么插件，不用全学
- **多看官方文档**：Vite的文档写得很好，遇到问题先查文档

Vite是现在前端的标配了，不管你用Vue还是React，都得会用。

🤖 **AI时代怎么学Vite**：
- 不用死记硬背配置项，需要的时候查文档或者问AI
- 项目搭建可以让AI帮你生成初始配置，你再调整
- 遇到报错把信息扔给AI，大部分问题都能解决
- 但是原理要理解，不然配置出了问题你都不知道从哪下手

### 10.3 接下来学什么？

工程化工具搞定了，接下来就是重头戏——**Vue3**！这是现在前端最主流的框架，也是找工作的必备技能。

```
ES6+ → npm → Vite → Git → Vue3 → 组件库 → 全栈项目
```

下一篇咱们讲 **Vue3入门**，Composition API写起来到底有多爽，学完你就能写Vue项目了。

### 10.4 学习资源推荐

- **Vite官方文档**：最权威的Vite教程，写得非常好
- **Vite中文文档**：中文翻译版，英语不好的看这个
- **GitHub**：各种Vite插件和模板，找灵感
- **awesome-vite**：Vite资源大全，插件、模板、教程都有

---

> 💬 **最后说两句**：
> 
> 恭喜你看完了这篇Vite速成教程！又解锁了一个前端必备技能。
> 
> 我从Webpack转到Vite的时候，第一感受就是——"哇，原来开发可以这么爽"。秒启动、秒热更新，以前喝杯咖啡等启动的日子一去不复返了。
> 
> 技术的进步就是这样，一代更比一代强。Vite虽然出来没几年，但已经成了事实标准。早学早享受，真的。
> 
> 现在就去按照实战项目的步骤，自己搭一个完整的Vue3脚手架吧。搭完之后，你就有了一个属于自己的"项目模板"，以后做新项目直接用，效率翻倍。
> 
> **万水千山总是情，点个👍行不行？** 你的点赞收藏是我更新的最大动力！

---

*相关推荐：《npm包管理：前端的"外卖平台"》《JS进化史：ES6+语法糖一把梭》《给网页注入灵魂：JavaScript零基础快速上手》*
