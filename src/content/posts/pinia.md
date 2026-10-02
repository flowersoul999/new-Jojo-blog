---
title: "Pinia 快速入门 + 面试八股全总结"
published: 2026-09-08
description: "Pinia 状态管理：State/Getters/Actions、Options 与 Setup 两种写法、持久化插件，含面试八股。"
tags: ["Vue","Pinia","面试八股"]
category: "Vue"
image: "/blogs/Vue/pinia-cover.jpg"
author: "jojo"
draft: false
comment: true
lang: "zh-CN"
aiPolished: false
---
# Pinia 快速入门 + 面试八股全总结

> 目录
>
> 1. [Pinia 是什么](#一pinia-是什么)
> 2. [快速上手](#二快速上手)
> 3. [核心概念：State / Getters / Actions](#三核心概念state--getters--actions)
> 4. [两种写法：Options Store vs Setup Store](#四两种写法options-store-vs-setup-store)
> 5. [进阶用法](#五进阶用法)
> 6. [持久化插件](#六持久化插件)
> 7. [在组件外使用 Store](#七在组件外使用-store)
> 8. [面试八股](#八面试八股)
> 9. [总结](#九总结)

---

## 一、Pinia 是什么

Pinia 是 Vue 官方推荐的状态管理库，用来替代 Vuex。简单说就是：**把多个组件共用的数据抽出来，统一管理。**

比如用户信息、购物车、主题色、token 这些，好多组件都要用到，如果每个组件自己存一份，改起来要改好多地方，还容易不一致。Pinia 把这些数据集中存到 store 里，所有组件从同一个地方取，改也只改一处。

### Pinia 和 Vuex 的区别

| 对比项 | Vuex | Pinia |
|--------|------|-------|
| 官方地位 | 老一代（已停止维护） | 新一代（Vue 官方推荐） |
| Mutations | 有，修改 state 必须经过 mutations | 没有，直接在 actions 里改 |
| TypeScript | 支持一般，类型推导麻烦 | 原生支持，类型推导好 |
| 模块化 | modules 嵌套 | 直接多 store，扁平化 |
| 体积 | 大 | 小（约 1KB） |
| Setup 语法 | 不太适配 | 完美适配 Composition API |
| 热更新 | 麻烦 | 支持 HMR，改了不刷新 |

**一句话总结：Pinia 就是 Vuex 5，只是改了个名字。** Vue 3 项目直接用 Pinia 就行，不用再考虑 Vuex。

---

## 二、快速上手

### 1. 安装

```bash
npm install pinia
```

### 2. 在 main.js 里注册

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

### 3. 创建第一个 store

在 `src/stores/` 目录下建一个 `user.js`：

```js
// src/stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '张三',
    age: 20,
  }),

  getters: {
    // 计算属性，类似 computed
    doubleAge: (state) => state.age * 2,
  },

  actions: {
    // 方法，用来修改 state
    growUp() {
      this.age++
    },
    changeName(newName) {
      this.name = newName
    },
  },
})
```

### 4. 在组件里用

```vue
<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 直接用 state
console.log(userStore.name)   // 张三
console.log(userStore.age)    // 20

// 用 getter
console.log(userStore.doubleAge)  // 40

// 调用 action
userStore.growUp()
console.log(userStore.age)    // 21
</script>

<template>
  <p>{{ userStore.name }} - {{ userStore.age }}岁</p>
  <button @click="userStore.growUp">长大</button>
</template>
```

就这么简单。定义 store → 组件里调用 `useXxxStore()` → 直接用。

---

## 三、核心概念：State / Getters / Actions

Pinia 的 store 由三部分组成，正好对应 Vue 组件里的 data / computed / methods。

| Pinia | Vue 组件 | 作用 |
|-------|---------|------|
| state | data | 存数据 |
| getters | computed | 计算属性，缓存结果 |
| actions | methods | 方法，改数据、发请求、写逻辑 |

### State：存数据

```js
state: () => ({
  name: '张三',
  age: 20,
  token: '',
})
```

**为什么 state 是函数？** 因为 store 可能被多个组件实例使用，函数返回一个新对象，避免不同实例之间互相污染。和 Vue 组件的 data 必须是函数是一个道理。

#### 读取 state

```js
const userStore = useUserStore()
console.log(userStore.name)
```

#### 直接修改 state

```js
userStore.name = '李四'
```

Pinia 里可以直接改 state，不像 Vuex 必须走 mutation。方便是方便，但复杂逻辑建议还是写到 action 里，方便统一维护。

#### 解构会失去响应式

```js
// ❌ 错的：解构出来的变量不是响应式的
const { name, age } = useUserStore()

// ✅ 对的：用 storeToRefs
import { storeToRefs } from 'pinia'
const { name, age } = storeToRefs(useUserStore())
```

`storeToRefs` 会把每个 state 和 getter 都转成 ref，解构出来仍然保持响应式。和 Vue 的 `toRefs` 是一个意思。

### Getters：计算属性

```js
getters: {
  // 方式一：箭头函数，参数是 state
  doubleAge: (state) => state.age * 2,

  // 方式二：普通函数，用 this（注意不能用箭头函数）
  tripleAge() {
    return this.age * 3
  },

  // 接收参数的 getter（返回一个函数）
  getAgePlus: (state) => (n) => state.age + n,
}
```

```js
// 使用
userStore.doubleAge      // 40
userStore.tripleAge      // 60
userStore.getAgePlus(5)  // 25
```

**getter 有缓存**，和 computed 一样，依赖不变就不会重新计算。

### Actions：方法

```js
actions: {
  // 同步方法
  growUp() {
    this.age++
  },

  // 异步方法（Pinia 的 action 支持异步，Vuex 的 mutation 不行）
  async fetchUserInfo() {
    const res = await api.getUserInfo()
    this.name = res.name
    this.age = res.age
  },
}
```

**Pinia 的 action 可以是 async 的**，这也是为什么不需要 mutations 了——Vuex 里 mutations 只能同步、actions 可以异步，分得很细。Pinia 把 mutations 去掉了，直接在 actions 里改 state，简单粗暴，反而更好用。

---

## 四、两种写法：Options Store vs Setup Store

Pinia 有两种写法，选一种你喜欢的就行。

### Options Store（选项式）

像 Vue 的 Options API 一样，把 state、getters、actions 分开写：

```js
export const useUserStore = defineStore('user', {
  state: () => ({ name: '', age: 0 }),
  getters: {
    doubleAge: (state) => state.age * 2,
  },
  actions: {
    growUp() { this.age++ },
  },
})
```

**适合**：习惯了 Vuex 写法、项目用 Options API、或者 store 结构比较清晰简单。

### Setup Store（组合式）

像 Vue 的 Composition API 一样，用 `ref`/`reactive` 定义 state，用 `computed` 定义 getter，用普通函数定义 action：

```js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  // state → ref / reactive
  const name = ref('张三')
  const age = ref(20)

  // getters → computed
  const doubleAge = computed(() => age.value * 2)

  // actions → 普通函数
  function growUp() {
    age.value++
  }

  function changeName(newName) {
    name.value = newName
  }

  // 必须 return 出去，组件才能用
  return { name, age, doubleAge, growUp, changeName }
})
```

**适合**：Vue 3 + Composition API 项目，和组件写法一致，更灵活。

### 怎么选？

- Vue 3 项目 → 推荐 Setup Store，和组件写法统一
- Vue 2 项目 / 习惯 Vuex → 用 Options Store
- 两种写法功能一样，只是风格不同

---

## 五、进阶用法

### $patch：批量修改 state

改多个 state 的时候，不用一句一句写，用 `$patch` 批量改：

```js
// 方式一：传对象
userStore.$patch({
  name: '李四',
  age: 25,
})

// 方式二：传函数（适合修改数组、复杂逻辑）
userStore.$patch((state) => {
  state.name = '李四'
  state.age = 25
  state.hobbies.push('打球')
})
```

**$patch 的好处**：
1. 多个修改合并成一次更新，只触发一次订阅（性能更好）
2. 代码更简洁
3. DevTools 里只记录一条变更记录

### $reset：重置 state

把 store 的 state 重置回初始值：

```js
userStore.$reset()
```

> 注意：Setup Store 写法下 `$reset` 不生效（Pinia 官方说的），得自己写一个 reset action。

### $subscribe：监听 state 变化

类似 watch，state 变了就触发：

```js
userStore.$subscribe((mutation, state) => {
  // mutation 里有 type、storeId、payload 等信息
  console.log('state 变了', state)

  // 比如持久化：state 一变就存到 localStorage
  localStorage.setItem('user', JSON.stringify(state))
})
```

组件卸载后订阅会自动取消，不用手动清理。

### $onAction：监听 action 调用

```js
userStore.$onAction(({ name, args, after, onError }) => {
  // action 调用前
  console.log(`调用了 ${name}，参数是`, args)

  // action 调用后
  after((result) => {
    console.log(`${name} 执行完了，结果是`, result)
  })

  // action 报错时
  onError((error) => {
    console.error(`${name} 出错了`, error)
  })
})
```

这个适合做日志、埋点、错误监控。

---

## 六、持久化插件

刷新页面后 store 的数据会丢，这是正常的——store 存在内存里。如果需要刷新后还在，就得存到 localStorage 里。

手动写 `$subscribe` 也行，但更方便的是用现成的插件：`pinia-plugin-persistedstate`。

### 安装

```bash
npm install pinia-plugin-persistedstate
```

### 注册

```js
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
```

### 使用

```js
export const useUserStore = defineStore('user', {
  state: () => ({
    name: '张三',
    age: 20,
    token: '',
  }),
  // 开启持久化
  persist: true,
})
```

就一行 `persist: true`，自动帮你存到 localStorage，刷新自动读回来。

### 配置项

```js
persist: {
  key: 'my-user',           // 存在 localStorage 里的 key，默认是 store 的 id
  storage: localStorage,    // 用什么存，默认 localStorage，可以改成 sessionStorage
  paths: ['name', 'token'], // 只持久化指定字段，默认全部持久化
}
```

**`paths` 很实用**——比如用户信息里 age 不用持久化，但 token 必须持久化，就指定 `paths: ['token']`，只存需要的字段。

---

## 七、在组件外使用 Store

有时候需要在路由守卫、axios 拦截器里用 store，这些地方不在组件里，不能直接调 `useUserStore()`。

### 错误用法

```js
// src/utils/request.js
import { useUserStore } from '@/stores/user'

const userStore = useUserStore() // ❌ 报错：pinia 还没安装
```

### 正确用法

```js
// src/utils/request.js
import axios from 'axios'
import router from '@/router'
import { useUserStore } from '@/stores/user'

const service = axios.create({ baseURL: '/api' })

service.interceptors.request.use((config) => {
  // ✅ 在函数内部调用，这时候 pinia 已经安装好了
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

service.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response.status === 401) {
      const userStore = useUserStore()
      userStore.clearToken()
      router.push('/login')
    }
    return Promise.reject(err)
  }
)
```

**核心原则**：`useXxxStore()` 必须在 `app.use(pinia)` 之后调用。组件里肯定满足，因为组件是 app 挂载之后才创建的。但在模块顶层调用就不行，因为模块导入时 pinia 还没装。

解决办法很简单：**在函数内部调用 `useXxxStore()`**，函数执行的时候 pinia 已经安装好了。

---

## 八、面试八股

下面是面试中关于 Pinia 的高频问题和标准答案。

### 1. Pinia 和 Vuex 有什么区别？

**参考答案：**

Pinia 是 Vue 官方新一代的状态管理库，用来替代 Vuex。主要区别有：

1. **去掉了 mutations** —— Vuex 里修改 state 必须走 mutation，Pinia 直接在 action 里改，更简单
2. **原生支持 TypeScript** —— Vuex 的 TS 支持很弱，类型推导麻烦；Pinia 天生支持，类型提示很丝滑
3. **没有 modules 嵌套** —— Vuex 用 modules 做模块化，层级深了很绕；Pinia 直接定义多个 store，扁平化管理，互相独立
4. **体积更小** —— Pinia 只有 1KB 左右
5. **完美适配 Composition API** —— 支持 Setup Store 写法，和 Vue 3 的组件风格统一
6. **支持 HMR** —— 修改 store 代码热更新，不用刷新页面

简单说，Pinia 就是更简单、更好用、更轻量的 Vuex。

---

### 2. Pinia 为什么去掉了 mutations？

**参考答案：**

Vuex 设计 mutations 的初衷是为了追踪状态变更、让 DevTools 能记录每一次修改。但实际开发中 mutations 写起来很繁琐，每次改数据都要定义一个 mutation、再在 action 里 commit，多了一层样板代码。

Pinia 用 `$patch` 和 DevTools 集成，同样能追踪状态变更，但去掉了 mutations 这一层，直接在 action 里改 state，开发体验更好。

另外，Vuex 中 mutations 只能同步、actions 才能异步的区分，在实际项目中意义不大，反而增加了学习成本。Pinia 简化了这个设计，actions 既可以同步也可以异步。

---

### 3. Pinia 的核心属性有哪些？

**参考答案：**

三个核心概念：

- **state** —— 数据源，对应组件的 data，存储状态
- **getters** —— 计算属性，对应组件的 computed，有缓存，依赖不变不会重新计算
- **actions** —— 方法，对应组件的 methods，用来修改 state、处理业务逻辑、发请求等，支持同步和异步

---

### 4. Setup Store 和 Options Store 有什么区别？怎么选？

**参考答案：**

这是 Pinia 定义 store 的两种写法，功能上完全一样，只是风格不同：

**Options Store** 是选项式写法，和 Vuex 类似，把 state、getters、actions 分开写在一个对象里。

**Setup Store** 是组合式写法，用 `ref`/`reactive` 定义 state、`computed` 定义 getter、普通函数定义 action，最后 return 出去。和 Vue 3 Composition API 的组件写法一致。

**怎么选**：
- Vue 3 + Composition API 项目，推荐 Setup Store，和组件风格统一，更灵活
- Vue 2 项目或者习惯 Vuex 写法的，用 Options Store
- 团队里统一就行，两种可以混用但不推荐

---

### 5. 直接解构 store 为什么会失去响应式？怎么解决？

**参考答案：**

因为 store 是一个 reactive 对象，直接解构的话，基本类型的值会被拷贝出来，失去响应式连接。

```js
const { name, age } = useUserStore() // ❌ 解构出来的不是响应式的
```

**解决办法**：用 Pinia 提供的 `storeToRefs`，它会把每个 state 和 getter 都转成 ref：

```js
import { storeToRefs } from 'pinia'
const { name, age } = storeToRefs(useUserStore()) // ✅
```

原理和 Vue 的 `toRefs` 是一样的。

---

### 6. \$patch 的作用是什么？有几种用法？

**参考答案：**

`$patch` 用来批量修改 state，有两种用法：

1. **传对象** —— 简单的修改，直接传一个新的对象合并进去
   ```js
   store.$patch({ name: '李四', age: 25 })
   ```

2. **传函数** —— 适合修改数组、复杂逻辑，函数参数是 state
   ```js
   store.$patch(state => {
     state.list.push(item)
     state.name = '李四'
   })
   ```

**为什么用 $patch 而不是一句句改**：
- 多次修改合并为一次，只触发一次更新，性能更好
- DevTools 只记录一条变更记录，调试更清晰
- 代码更简洁

---

### 7. 怎么重置 store 到初始状态？

**参考答案：**

Options Store 直接调用 `$reset()`：

```js
userStore.$reset()
```

Setup Store 不支持 `$reset()`（官方设计如此），需要自己写一个 reset 方法：

```js
export const useUserStore = defineStore('user', () => {
  const initialState = { name: '张三', age: 20 }
  const name = ref(initialState.name)
  const age = ref(initialState.age)

  function $reset() {
    name.value = initialState.name
    age.value = initialState.age
  }

  return { name, age, $reset }
})
```

---

### 8. Pinia 怎么持久化？原理是什么？

**参考答案：**

常用的方式是用 `pinia-plugin-persistedstate` 插件。

**使用**：在 store 配置里加 `persist: true` 就行。

**原理**：插件通过 `$subscribe` 订阅 state 的变化，每次 state 变化就把数据序列化（JSON.stringify）后存到 localStorage 里。store 初始化的时候，再从 localStorage 读取数据（JSON.parse）恢复到 state 中。

**可以配置**：
- `key` —— 存储的 key 名
- `storage` —— 存储介质，默认 localStorage，可改 sessionStorage
- `paths` —— 指定持久化哪些字段，默认全部

---

### 9. Pinia 怎么实现跨 store 调用？

**参考答案：**

直接在一个 store 的 action 里 import 另一个 store 来用就行：

```js
import { defineStore } from 'pinia'
import { useCartStore } from './cart'

export const useUserStore = defineStore('user', {
  actions: {
    logout() {
      // 调用 cart store 的方法
      const cartStore = useCartStore()
      cartStore.clearCart()

      // 清空自己的数据
      this.token = ''
    },
  },
})
```

注意要在 action 函数内部调用 `useXxxStore()`，不要在模块顶层调用。

---

### 10. 怎么监听 Pinia 的 state 变化？

**参考答案：**

几种方式：

1. **\$subscribe** —— Pinia 提供的方法，监听整个 store 的 state 变化
   ```js
   store.$subscribe((mutation, state) => {
     console.log('state 变了', state)
   })
   ```

2. **watch** —— Vue 原生的 watch，监听具体某个字段
   ```js
   watch(() => store.name, (newVal) => {
     console.log('name 变了', newVal)
   })
   ```

3. **computed** —— 如果只是想基于 state 计算新值，用 computed 就够了

**\$subscribe 和 watch 的区别**：
- `$subscribe` 监听整个 store 的变化，mutation 对象里包含了变更的类型和 payload
- `watch` 更灵活，可以精确监听某个字段，支持 deep、immediate 等配置

---

### 11. Pinia 是响应式的吗？原理是什么？

**参考答案：**

是响应式的。Pinia 的 state 在 Vue 2 中用 `Vue.observable`（类似 reactive）包裹，在 Vue 3 中用 `reactive` 包裹，所以天然就是响应式的。

在组件中读取 store 的 state，其实就是读一个 reactive 对象的属性，和组件自己的 data 一样，会被 Vue 的响应式系统追踪，数据变了视图自动更新。

---

### 12. Pinia 和 localStorage 的区别？什么时候用 Pinia？

**参考答案：**

| 对比项 | Pinia | localStorage |
|--------|-------|-------------|
| 存储位置 | 内存 | 硬盘 |
| 响应式 | 是，数据变了视图自动更新 | 否，手动读手动写 |
| 数据类型 | 支持对象、数组、函数等 | 只能存字符串 |
| 生命周期 | 页面刷新就没了 | 永久保存，除非手动删 |
| 大小限制 | 没限制（内存有多大就多大） | 约 5MB |

**什么时候用 Pinia**：
- 多个组件共享的数据（用户信息、购物车、主题）
- 需要响应式更新的数据
- 页面内临时状态（搜索条件、分页信息）

**什么时候用 localStorage**：
- 需要持久化保存的数据（token、用户偏好）
- 刷新页面后还要保留的数据

**实际项目中两者配合用**：比如 token 存在 Pinia 里方便用，同时持久化到 localStorage 里防止刷新丢失。

---

### 13. 为什么用 Pinia 而不是直接用 reactive 全局对象？

**参考答案：**

确实可以自己建一个 reactive 对象当全局状态用，但 Pinia 提供了更多能力：

1. **DevTools 支持** —— 能看到 state 的变化历史、时间旅行调试，自己写的 reactive 对象没有
2. **插件生态** —— 持久化、路由同步等插件，开箱即用
3. **SSR 支持** —— 服务端渲染时的隔离问题，Pinia 已经处理好了
4. **类型推导** —— TypeScript 类型支持好，IDE 提示准
5. **\$patch / \$reset / \$subscribe** —— 这些便捷 API 自己实现要写不少代码
6. **模块化** —— 按功能拆分成多个 store，结构清晰

小项目自己用 reactive 凑合也行，稍微大点的项目还是用 Pinia 更省心。

---

### 14. Pinia 有哪些缺点？

**参考答案：**

1. **生态不如 Vuex 成熟** —— 毕竟出来的晚，一些第三方插件可能没那么丰富，但核心插件都有
2. **Setup Store 的 \$reset 不支持** —— 要自己实现
3. **没有命名空间的概念** —— 所有 store 都是平级的，store 名冲突了会出问题（但一般也不会冲突）
4. **大型项目的状态划分需要自己规划** —— Vuex 有 modules 强制分层，Pinia 全靠自己约定

总的来说缺点不多，都是小问题，不影响使用。

---

## 九、总结

Pinia 是 Vue 3 项目的状态管理首选，核心就三件事：state 存数据、getters 做计算、actions 写逻辑。

**快速回忆一下：**

- **创建 store**：`defineStore('id', { state, getters, actions })`
- **使用 store**：`const store = useXxxStore()`
- **改数据**：直接改 `store.xxx = yyy`，或者 `store.$patch({...})` 批量改
- **解构保持响应式**：`storeToRefs(store)`
- **重置**：`store.$reset()`
- **持久化**：`pinia-plugin-persistedstate` + `persist: true`
- **组件外用**：在函数内部调用 `useXxxStore()`

**面试常考**：和 Vuex 的区别、为什么去掉 mutations、$patch 的用法、持久化原理、storeToRefs 的作用、Setup Store 和 Options Store 的区别。

掌握这些，日常开发和面试都够用了。
