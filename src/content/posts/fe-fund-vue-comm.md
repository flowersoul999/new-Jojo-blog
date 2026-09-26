---
title: "Vue组件通信8件套：一家人怎么传话最靠谱"
published: 2026-09-04
description: ""
tags: ["前端基础"]
category: "技术总结"
draft: false
lang: "zh-CN"
---

> 💡 **写在前面**：组件化是Vue的灵魂，但组件之间不是孤立的——父子之间要传数据、兄弟之间要打招呼、隔代之间要递东西……怎么传？用什么传？什么时候用什么方式？很多新手一头雾水。这篇用"一家人过日子"的类比，把8种通信方式讲得明明白白，看完再也不会搞混了。全文约9000字，建议收藏，面试前必看！

---

## 📑 目录导航

- [一、为什么需要组件通信？](#一为什么需要组件通信)
  - [1.1 先讲个故事](#11-先讲个故事)
  - [1.2 组件树就像一棵家谱](#12-组件树就像一棵家谱)
  - [1.3 一张总表：8种方式速览](#13-一张总表8种方式速览)
- [二、父传子：props —— 爸妈给孩子零花钱](#二父传子props----爸妈给孩子零花钱)
  - [2.1 基本用法](#21-基本用法)
  - [2.2 props校验](#22-props校验)
  - [2.3 单向数据流](#23-单向数据流)
- [三、子传父：$emit —— 孩子跟爸妈要东西](#三子传父emit----孩子跟爸妈要东西)
  - [3.1 基本用法](#31-基本用法)
  - [3.2 传多个参数](#32-传多个参数)
- [四、v-model：父子双向绑定 —— 共用的存钱罐](#四v-model父子双向绑定----共用的存钱罐)
  - [4.1 基本原理](#41-基本原理)
  - [4.2 自定义组件的v-model](#42-自定义组件的v-model)
- [五、父调子方法：ref + defineExpose —— 爸妈叫孩子做事](#五父调子方法ref--defineexpose----爸妈叫孩子做事)
- [六、祖孙通信：provide / inject —— 爷爷的传家宝](#六祖孙通信provide--inject----爷爷的传家宝)
  - [6.1 基本用法](#61-基本用法)
  - [6.2 响应式的provide](#62-响应式的provide)
- [七、全局状态：Pinia —— 家族公共仓库](#七全局状态pinia----家族公共仓库)
- [八、兄弟通信：父组件当传声筒 —— 哥俩说话通过爸妈](#八兄弟通信父组件当传声筒----哥俩说话通过爸妈)
- [九、事件总线 mitt —— 家族微信群聊](#九事件总线-mitt----家族微信群聊)
- [十、attrs/$attrs —— 剩下的都给你](#十attrsattrs----剩下的都给你)
- [十一、怎么选？一张决策图](#十一怎么选一张决策图)
- [十二、实战项目：设计一个可复用的弹窗组件](#十二实战项目设计一个可复用的弹窗组件)
  - [12.1 需求分析](#121-需求分析)
  - [12.2 组件实现](#122-组件实现)
  - [12.3 使用示例](#123-使用示例)
- [十三、新手必避的10个坑 ⚠️](#十三新手必避的10个坑-️)
- [十四、面试八股精选](#十四面试八股精选)
- [十五、总结与后续学习建议](#十五总结与后续学习建议)

---

## 一、为什么需要组件通信？

### 1.1 先讲个故事

老王家有五口人：爷爷、爸爸、妈妈、哥哥、妹妹。

每天家里都有各种"传话"的场景：
- 爸爸给儿子零花钱 → 从上往下传
- 儿子想买玩具，跟爸爸要钱 → 从下往上传
- 哥哥想借妹妹的橡皮 → 平级之间传
- 爷爷要把传家宝交给孙子 → 隔代传
- 全家通知一件大事 → 广播给所有人

组件通信就是这么回事——**组件之间怎么传递数据、怎么共享状态、怎么互相调用**。

如果组件之间完全不能通信，那就像一大家子人各过各的，饭也没法一起做、钱也没法一起花——这日子没法过了。

### 1.2 组件树就像一棵家谱

Vue的组件树，跟一棵家谱一模一样：

```
        App.vue（爷爷）
       /            \
  Header.vue      Main.vue（爸爸）
                 /    |    \
          Sidebar.vue  Content.vue  Footer.vue（孩子）
                            /          \
                    ItemList.vue  Pagination.vue（孙子）
```

各种关系：
- **父子关系**：爸爸 → 孩子（最常见）
- **祖孙关系**：爷爷 → 孙子（隔了一代或几代）
- **兄弟关系**：哥哥 ↔ 妹妹（同一个爸爸）
- **远亲关系**：八竿子打不着的两个组件

不同的关系，适用的通信方式也不一样。

### 1.3 一张总表：8种方式速览

先把结论放前面，后面慢慢展开讲：

| 通信方式 | 适用场景 | 关系 | 难度 | 推荐指数 |
|---------|---------|------|------|---------|
| props | 父传子 | 父子 | ★☆☆☆☆ | ⭐⭐⭐⭐⭐ |
| $emit | 子传父 | 父子 | ★☆☆☆☆ | ⭐⭐⭐⭐⭐ |
| v-model | 双向绑定 | 父子 | ★★☆☆☆ | ⭐⭐⭐⭐ |
| ref + defineExpose | 父调子方法/属性 | 父子 | ★★☆☆☆ | ⭐⭐⭐ |
| provide / inject | 祖先传后代 | 祖孙/跨代 | ★★★☆☆ | ⭐⭐⭐ |
| Pinia | 全局状态共享 | 任意关系 | ★★★☆☆ | ⭐⭐⭐⭐⭐ |
| 事件总线 mitt | 任意组件通信 | 任意关系 | ★★★☆☆ | ⭐⭐ |
| attrs / $attrs | 属性透传 | 父子 | ★★★☆☆ | ⭐⭐⭐ |

💡 **一句话总结**：父子用props和emit，跨代用provide/inject，全局用Pinia，特殊场景用ref/v-model/attrs。

---

## 二、父传子：props —— 爸妈给孩子零花钱

**场景**：爸爸对儿子说："这是这个月的零花钱，省着点花。"

最常用、最简单的通信方式——父组件通过props把数据传给子组件。

### 2.1 基本用法

#### 子组件：声明我要什么

```vue
<!-- Child.vue 子组件 -->
<template>
  <div>
    <h3>{{ title }}</h3>
    <p>零花钱：{{ money }}元</p>
  </div>
</template>

<script setup>
// 声明props：我要接收什么数据
defineProps({
  title: String,
  money: Number
})
</script>
```

#### 父组件：给你给你都给你

```vue
<!-- Parent.vue 父组件 -->
<template>
  <Child title="儿子的房间" :money="100" />
</template>

<script setup>
import Child from './Child.vue'
</script>
```

⚠️ **注意**：
- 静态字符串可以直接写：`title="儿子的房间"`
- 数字、布尔值、变量等要用 `:` 绑定：`:money="100"`（不加冒号传的是字符串"100"）

### 2.2 props校验

props可以做类型校验、必填校验、默认值等，让代码更健壮：

```javascript
defineProps({
  // 简单类型校验
  title: String,
  
  // 多种类型
  count: [Number, String],
  
  // 必填的字符串
  name: {
    type: String,
    required: true
  },
  
  // 带默认值的数字
  money: {
    type: Number,
    default: 50
  },
  
  // 对象类型的默认值要用函数返回
  userInfo: {
    type: Object,
    default: () => ({ name: '未知', age: 0 })
  },
  
  // 自定义验证函数
  age: {
    validator(value) {
      return value >= 0 && value <= 150
    }
  }
})
```

类型可以是这些构造函数：`String`、`Number`、`Boolean`、`Array`、`Object`、`Date`、`Function`、`Symbol`。

### 2.3 单向数据流

props是**单向数据流**——只能父传子，子不能直接改。

为什么？因为如果孩子能随便改爸爸给的钱，那爸爸都不知道钱花哪了。数据流向不清晰，出了bug难找。

⚠️ **不要在子组件里直接修改props**，会警告的。

如果子组件想修改props里的值怎么办？两种方式：
1. **自己存一份**：把props的值存到本地的ref里，改自己的
2. **通知爸爸改**：emit事件，让父组件自己改（下一节讲）

---

## 三、子传父：$emit —— 孩子跟爸妈要东西

**场景**：儿子想买玩具，自己没钱，得跟爸爸说一声，爸爸同意了才能买。

子组件给父组件发消息，用 **自定义事件**（`$emit` / `defineEmits`）。

### 3.1 基本用法

#### 子组件：触发事件

```vue
<!-- Child.vue 子组件 -->
<template>
  <button @click="askForMoney">跟爸爸要钱</button>
</template>

<script setup>
// 声明我要触发哪些事件
const emit = defineEmits(['ask-money'])

const askForMoney = () => {
  // 触发事件，传参数
  emit('ask-money', 50)
}
</script>
```

#### 父组件：监听事件

```vue
<!-- Parent.vue 父组件 -->
<template>
  <Child @ask-money="handleAskMoney" />
  <p>爸爸的钱包：{{ money }}元</p>
</template>

<script setup>
import { ref } from 'vue'
import Child from './Child.vue'

const money = ref(500)

const handleAskMoney = (amount) => {
  console.log(`儿子要了${amount}元`)
  money.value -= amount
}
</script>
```

跟监听点击事件一模一样的写法，只是事件名是我们自己定义的。

### 3.2 传多个参数

emit可以传多个参数：

```javascript
// 子组件
emit('some-event', param1, param2, param3)
```

```javascript
// 父组件
const handleEvent = (p1, p2, p3) => {
  console.log(p1, p2, p3)
}
```

💡 **命名习惯**：
- 事件名用短横线命名（kebab-case）：`ask-money`
- 虽然也支持小驼峰，但HTML里不区分大小写，短横线更保险

---

## 四、v-model：父子双向绑定 —— 共用的存钱罐

**场景**：父子共用一个存钱罐，爸爸能放钱，儿子也能拿钱，两边实时同步。

有些场景需要双向同步——父改了子跟着变，子改了父也跟着变。v-model就是干这个的。

### 4.1 基本原理

v-model本质上是个语法糖，等于 `:modelValue` + `@update:modelValue`：

```vue
<!-- 这两行是等价的 -->
<Input v-model="text" />
<Input :modelValue="text" @update:modelValue="text = $event" />
```

### 4.2 自定义组件的v-model

自己写的组件怎么支持v-model？

#### 子组件

```vue
<!-- MyInput.vue -->
<template>
  <input 
    type="text" 
    :value="modelValue" 
    @input="handleInput"
  >
</template>

<script setup>
const props = defineProps({
  modelValue: String  // v-model默认传的属性叫modelValue
})

const emit = defineEmits(['update:modelValue'])  // 事件名是update:modelValue

const handleInput = (e) => {
  emit('update:modelValue', e.target.value)
}
</script>
```

#### 父组件使用

```vue
<template>
  <MyInput v-model="text" />
  <p>你输入的是：{{ text }}</p>
</template>

<script setup>
import { ref } from 'vue'
const text = ref('')
</script>
```

#### 多个v-model

Vue3支持多个v-model（Vue2只能有一个）：

```vue
<!-- 子组件支持两个v-model -->
<UserInfo 
  v-model:name="userName" 
  v-model:age="userAge" 
/>
```

子组件里对应的就是 `name` + `update:name`、`age` + `update:age`。

💡 **适用场景**：表单类组件（输入框、选择器、开关等），需要双向同步数据的时候用。

---

## 五、父调子方法：ref + defineExpose —— 爸妈叫孩子做事

**场景**：爸爸叫儿子："去把地扫一下！"（直接调用子组件的方法）

有时候父组件想直接调用子组件的方法，或者访问子组件的属性——用 `ref` + `defineExpose`。

#### 子组件：暴露方法和属性

```vue
<!-- Child.vue -->
<script setup>
import { ref } from 'vue'

const count = ref(0)

const increment = () => {
  count.value++
}

const reset = () => {
  count.value = 0
}

// 暴露给父组件的方法和属性
defineExpose({
  count,
  increment,
  reset
})
</script>
```

⚠️ **注意**：默认情况下，`<script setup>` 里的东西都是私有的，父组件访问不到。必须用 `defineExpose` 显式暴露。

#### 父组件：通过ref调用

```vue
<!-- Parent.vue -->
<template>
  <Child ref="childRef" />
  <button @click="handleIncrement">让子组件+1</button>
  <button @click="handleReset">让子组件重置</button>
</template>

<script setup>
import { ref } from 'vue'
import Child from './Child.vue'

// 给子组件打个ref标记
const childRef = ref(null)

const handleIncrement = () => {
  // 通过ref调用子组件的方法
  childRef.value?.increment()
}

const handleReset = () => {
  childRef.value?.reset()
}
</script>
```

💡 **适用场景**：
- 调用子组件的方法（比如弹窗的open/close方法）
- 获取子组件的某个属性
- 操作子组件的DOM

但是！别滥用ref。如果只是传数据，优先用props/events。ref是"直接操作组件"，比较"暴力"，用多了代码耦合度高。

---

## 六、祖孙通信：provide / inject —— 爷爷的传家宝

**场景**：爷爷有个传家宝，要传给孙子，甚至曾孙——不用经过爸爸，直接传。

如果组件层级很深，爷爷要给孙子传东西，一层一层props传下去（爷→父→子→孙），中间的组件都是"传话筒"，很烦。

`provide` / `inject` 就是解决这个问题的——祖先组件提供数据，后代组件直接注入使用，隔多少代都行。

### 6.1 基本用法

#### 祖先组件：provide提供数据

```vue
<!-- 爷爷组件 -->
<script setup>
import { provide } from 'vue'

// 提供数据
provide('familyName', '王家')
provide('familyTreasure', '传家宝')
</script>
```

#### 后代组件：inject注入数据

```vue
<!-- 孙子组件（中间隔了爸爸也没关系） -->
<template>
  <p>姓氏：{{ familyName }}</p>
  <p>传家宝：{{ familyTreasure }}</p>
</template>

<script setup>
import { inject } from 'vue'

// 注入数据
const familyName = inject('familyName')
const familyTreasure = inject('familyTreasure')

// 还可以设置默认值（找不到就用默认的）
const something = inject('something', '默认值')
</script>
```

就这么简单，中间的组件完全不用管，爷爷直接传给孙子。

### 6.2 响应式的provide

默认情况下，provide传的值不是响应式的——爷爷那边改了，孙子那边不会更新。

如果需要响应式，provide传个ref/reactive对象进去就行：

```vue
<!-- 爷爷组件 -->
<script setup>
import { ref, provide } from 'vue'

const money = ref(1000)

// 传ref对象，就是响应式的了
provide('familyMoney', money)

const addMoney = () => {
  money.value += 100
}
</script>
```

```vue
<!-- 孙子组件 -->
<script setup>
import { inject } from 'vue'

const money = inject('familyMoney')
// money.value 就是响应式的
</script>
```

💡 **适用场景**：
- 跨代传数据（层级深，props一层层传太麻烦）
- 插件/组件库的全局配置
- 主题、语言等全局设置

⚠️ **注意**：provide/inject容易造成"数据来源不清晰"——你不知道这个数据是从哪来的。所以不要滥用，大部分场景用Pinia更清晰。

---

## 七、全局状态：Pinia —— 家族公共仓库

**场景**：家族有个公共仓库，任何人都能去存东西、取东西，谁都能看见。

这个就不用多说了，上一篇刚讲完Pinia。

任何关系的组件，只要在同一个store里，就能共享数据：
- 父子可以共享
- 兄弟可以共享
- 祖孙可以共享
- 八竿子打不着的也能共享

```javascript
// A组件存
const userStore = useUserStore()
userStore.name = '小明'

// B组件取（不管B在哪）
const userStore = useUserStore()
console.log(userStore.name)  // '小明'
```

💡 **适用场景**：
- 全局共享的数据（用户信息、购物车、主题、权限等）
- 多个组件都要用的数据
- 关系很远的组件之间传数据

Pinia是最强大的通信方式，但也是最重的——简单的通信没必要把数据放全局。

---

## 八、兄弟通信：父组件当传声筒 —— 哥俩说话通过爸妈

**场景**：哥哥要跟妹妹说话，自己说不了，得通过爸妈传话。

兄弟组件（同一个父组件的子组件）之间怎么传数据？

最简单的方式：**通过父组件中转**。

```
哥哥 emit 给爸爸 → 爸爸改数据 → 爸爸 props 传给妹妹
```

#### 哥哥：告诉爸爸

```vue
<!-- Brother.vue -->
<script setup>
const emit = defineEmits(['send-msg'])

const sendToSister = () => {
  emit('send-msg', '妹妹，借我块橡皮')
}
</script>
```

#### 妹妹：接收爸爸给的

```vue
<!-- Sister.vue -->
<script setup>
const props = defineProps({
  message: String
})
</script>
```

#### 爸爸：当中转站

```vue
<!-- Father.vue -->
<template>
  <Brother @send-msg="handleSendMsg" />
  <Sister :message="messageFromBrother" />
</template>

<script setup>
import { ref } from 'vue'
import Brother from './Brother.vue'
import Sister from './Sister.vue'

const messageFromBrother = ref('')

const handleSendMsg = (msg) => {
  messageFromBrother.value = msg
}
</script>
```

逻辑很清晰：子传父 + 父传子 = 兄弟通信。

💡 **适用场景**：兄弟组件之间数据量不大、关系简单的情况。

如果兄弟之间通信很频繁、数据很复杂，建议直接上Pinia，比中转方式清爽。

---

## 九、事件总线 mitt —— 家族微信群聊

**场景**：家里建了个微信群，谁都能发消息，谁都能收消息，想发给谁就发给谁。

事件总线（Event Bus）是一种发布订阅模式——任何组件都可以发事件，任何组件都可以监听事件。

Vue3里没有内置的事件总线了，推荐用 `mitt` 这个库（很小，200字节）。

#### 安装

```bash
npm i mitt
```

#### 创建bus

```javascript
// src/utils/eventBus.js
import mitt from 'mitt'

const bus = mitt()
export default bus
```

#### A组件：发消息（emit）

```vue
<script setup>
import bus from '@/utils/eventBus'

const sendMsg = () => {
  bus.emit('some-event', { data: 'hello' })
}
</script>
```

#### B组件：收消息（on）

```vue
<script setup>
import { onUnmounted } from 'vue'
import bus from '@/utils/eventBus'

// 监听事件
const handler = (data) => {
  console.log('收到消息：', data)
}
bus.on('some-event', handler)

// 组件卸载时记得取消监听！不然会内存泄漏
onUnmounted(() => {
  bus.off('some-event', handler)
})
</script>
```

💡 **适用场景**：
- 两个完全没关系的组件之间传消息
- 跨页面、跨层级的通知
- 能用Pinia就别用事件总线，事件总线多了代码不好维护

⚠️ **重要提醒**：
- 一定要在组件卸载时取消监听（`bus.off`），不然会内存泄漏
- 事件多了之后，你不知道谁发的、谁在监听，数据流很混乱
- Vue3项目更推荐用Pinia代替事件总线

---

## 十、attrs/$attrs —— 剩下的都给你

**场景**：爸妈给了你一袋子东西，你知道一部分是什么，剩下的不知道的，直接转交给你儿子。

`$attrs` 是父组件传过来，但子组件没有声明为props的那些属性（包括class、style、事件监听器等）。

#### 子组件

```vue
<!-- MyInput.vue -->
<template>
  <label>
    {{ label }}
    <!-- 把没声明的属性透传给input -->
    <input v-bind="$attrs">
  </label>
</template>

<script setup>
defineProps({
  label: String  // 只声明了label
})
// 其他没声明的属性，都在$attrs里
</script>
```

#### 父组件

```vue
<template>
  <MyInput 
    label="用户名："
    type="text"        <!-- 没声明，进$attrs -->
    placeholder="请输入"  <!-- 没声明，进$attrs -->
    class="my-input"   <!-- 没声明，进$attrs -->
    @input="handleInput" <!-- 没声明，进$attrs -->
  />
</template>
```

`v-bind="$attrs"` 就是把所有没声明的属性都透传给内部的元素。

💡 **适用场景**：
- 封装组件时，透传原生属性（比如封装一个Input组件，原生input的属性都能支持）
- 高阶组件、包装组件

跟 `$attrs` 对应的还有 `$listeners`（Vue2里的），Vue3里 `$attrs` 已经包含了事件监听器，不用分开了。

---

## 十一、怎么选？一张决策图

这么多种方式，到底用哪个？给你一张决策流程图：

```
你要做什么？
  │
  ├─ 父子之间传数据
  │   ├─ 父传子 → props
  │   ├─ 子传父 → emit事件
  │   └─ 双向绑定 → v-model
  │
  ├─ 父组件想调用子组件的方法 → ref + defineExpose
  │
  ├─ 隔代传数据（层级深）
  │   ├─ 只是简单传下去 → provide/inject
  │   └─ 数据复杂、多处用 → Pinia
  │
  ├─ 兄弟组件之间
  │   ├─ 简单、数据少 → 父组件中转
  │   └─ 复杂、频繁 → Pinia
  │
  ├─ 完全不相关的组件
  │   ├─ 全局共享数据 → Pinia（推荐）
  │   └─ 简单事件通知 → mitt事件总线
  │
  └─ 封装组件，透传属性 → $attrs
```

**核心原则**：
1. **优先用props/emit**（最经典、最清晰）
2. **全局数据用Pinia**（不要滥用，但该用就用）
3. **隔代用provide/inject**（简单的跨代传值）
4. **特殊场景用特殊方式**（ref、v-model、attrs等）

---

## 十二、实战项目：设计一个可复用的弹窗组件

学了这么多，咱们来实战一下——封装一个可复用的弹窗组件。弹窗组件几乎用到了好几种通信方式，非常经典。

### 12.1 需求分析

我们要做的弹窗组件：
- ✅ 父组件控制显示/隐藏（v-model）
- ✅ 可以传标题和内容（props）
- ✅ 点确定/取消触发事件（emit）
- ✅ 父组件可以调用open/close方法（ref + defineExpose）
- ✅ 支持透传其他属性（$attrs）

### 12.2 组件实现

```vue
<!-- components/BaseModal.vue -->
<template>
  <!-- 遮罩层 -->
  <div v-if="visible" class="modal-mask" @click.self="handleCancel">
    <div class="modal-content" v-bind="$attrs">
      <!-- 标题 -->
      <div class="modal-header">
        <span class="modal-title">{{ title }}</span>
        <button class="close-btn" @click="handleCancel">×</button>
      </div>
      
      <!-- 内容 -->
      <div class="modal-body">
        <slot />
      </div>
      
      <!-- 底部按钮 -->
      <div class="modal-footer" v-if="showFooter">
        <button @click="handleCancel">{{ cancelText }}</button>
        <button class="primary" @click="handleConfirm">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue'

const props = defineProps({
  // 控制显示隐藏（配合v-model）
  modelValue: {
    type: Boolean,
    default: false
  },
  // 标题
  title: {
    type: String,
    default: '提示'
  },
  // 是否显示底部按钮
  showFooter: {
    type: Boolean,
    default: true
  },
  // 确定按钮文字
  confirmText: {
    type: String,
    default: '确定'
  },
  // 取消按钮文字
  cancelText: {
    type: String,
    default: '取消'
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

// 内部状态
const visible = ref(props.modelValue)

// 监听外部变化
watch(() => props.modelValue, (val) => {
  visible.value = val
})

// 打开
const open = () => {
  visible.value = true
  emit('update:modelValue', true)
}

// 关闭
const close = () => {
  visible.value = false
  emit('update:modelValue', false)
}

// 点确定
const handleConfirm = () => {
  emit('confirm')
  // 默认点确定不关闭，让父组件决定（也可以默认关闭，看需求）
}

// 点取消
const handleCancel = () => {
  emit('cancel')
  close()
}

// 暴露方法给父组件调用
defineExpose({
  open,
  close,
  visible
})
</script>

<style scoped>
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

button {
  padding: 8px 20px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

button.primary {
  background: #409eff;
  color: white;
  border-color: #409eff;
}
</style>
```

### 12.3 使用示例

#### 方式1：v-model控制

```vue
<template>
  <button @click="showModal = true">打开弹窗</button>
  
  <BaseModal 
    v-model="showModal"
    title="温馨提示"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <p>这是弹窗的内容，可以放任何东西~</p>
    <p>比如表单、图片、表格等等</p>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/BaseModal.vue'

const showModal = ref(false)

const handleConfirm = () => {
  alert('你点了确定')
  showModal.value = false
}

const handleCancel = () => {
  console.log('取消了')
}
</script>
```

#### 方式2：ref调用方法

```vue
<template>
  <button @click="openModal">打开弹窗</button>
  
  <BaseModal 
    ref="modalRef"
    title="提示"
    @confirm="handleConfirm"
  >
    内容...
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/BaseModal.vue'

const modalRef = ref(null)

const openModal = () => {
  modalRef.value?.open()
}
</script>
```

👉 **动手试试**：把这个弹窗组件写出来，在你的项目里用用看。再加点功能，比如拖拽、全屏、自定义宽度等。

一个小小的弹窗组件，用到了：
- ✅ props（父传子）
- ✅ emit（子传父）
- ✅ v-model（双向绑定）
- ✅ ref + defineExpose（父调子方法）
- ✅ $attrs（属性透传）
- ✅ slot（插槽，也算一种通信/内容分发）

是不是收获很大？

🤖 **AI小助手**：封装组件的时候，可以让AI帮你写初始版本。比如："用Vue3封装一个可复用的弹窗组件，要求v-model控制显隐、确定/取消事件、ref调用方法、支持插槽"——AI生成的代码再调一调，效率翻倍。

---

## 十三、新手必避的10个坑 ⚠️

### 坑1：props属性名大小写搞错
**现象**：传了props，子组件收不到
**原因**：HTML里不区分大小写，驼峰命名的props要用短横线传
**解决**：子组件用驼峰（`userName`），父组件传的时候用短横线（`user-name="xxx"`）

### 坑2：子组件直接修改props
**现象**：控制台警告，或者数据乱了
**原因**：Vue是单向数据流，子组件不能直接改props
**解决**：要么存到本地ref里改，要么emit事件让父组件改

### 坑3：props是对象/数组，默认值写错
**现象**：报错或者默认值不生效
**原因**：对象/数组的默认值要用函数返回，不能直接写对象
**解决**：`default: () => ({ name: '' })` 或 `default: () => []`

### 坑4：emit事件名大小写
**现象**：子组件emit了事件，父组件监听不到
**原因**：事件名大小写问题，HTML里不区分大小写
**解决**：事件名用短横线（kebab-case），比如 `update-name`，别用小驼峰

### 坑5：ref调用子组件方法报undefined
**现象**：`childRef.value.xxx is not a function`
**原因**：script setup里的东西默认是私有的，没暴露出来
**解决**：子组件里用 `defineExpose({ xxx })` 把要暴露的方法/属性显式暴露出去

### 坑6：provide/inject不响应
**现象**：祖先组件改了数据，后代组件没更新
**原因**：provide传的是普通值，不是响应式的
**解决**：provide传ref或reactive对象，后代拿到的就是响应式的了

### 坑7：事件总线不取消监听
**现象**：事件触发多次，或者内存泄漏
**原因**：组件卸载时没有取消事件监听
**解决**：在 `onUnmounted` 里调用 `bus.off('event', handler)` 取消监听

### 坑8：v-model不生效
**现象**：自定义组件的v-model不工作
**原因**：很多种可能——props名不对、事件名不对、没有emit
**解决**：检查三件套：1. props叫modelValue吗？2. 事件叫update:modelValue吗？3. 值变化时emit了吗？

### 坑9：兄弟组件之间绕晕了
**现象**：兄弟传数据，写了一堆中转代码，乱得要死
**原因**：强行用props/emit中转，越写越乱
**解决**：如果通信复杂，直接上Pinia，别硬扛。Pinia就是干这个的

### 坑10：什么都往Pinia里塞
**现象**：所有数据都放Pinia，包括只在一个组件里用的
**原因**：为了用而用，过度状态管理
**解决**：组件内部能用ref解决的就别放Pinia。Pinia是存"共享数据"的，不是所有数据的垃圾桶

---

## 十四、面试八股精选

组件通信是面试高频考点，几乎每次面试都会问。

### 1. Vue组件通信的方式有哪些？
**参考答案**：
1. props/emit：父子通信，父传子用props，子传父用emit
2. v-model：父子双向绑定，语法糖
3. ref + defineExpose：父组件调用子组件的方法/属性
4. provide/inject：跨代通信，祖先提供，后代注入
5. Pinia/Vuex：全局状态管理，任意组件通信
6. 事件总线（mitt）：发布订阅模式，任意组件通信
7. $attrs/$listeners：属性/事件透传
8. 插槽slot：内容分发（也算一种通信方式）
9. 父组件中转：兄弟组件通过父组件传

### 2. props和data的区别？
**参考答案**：
- props是父组件传过来的数据，只读，不能直接修改
- data是组件自己内部的数据，可以修改
- props是外部传入的，data是组件私有的
- 两者都是响应式的

### 3. 单向数据流是什么？为什么要单向？
**参考答案**：
- 单向数据流：数据只能从父组件流向子组件，子组件不能直接修改父组件的数据
- 为什么：保证数据流向清晰，所有状态变化都可追溯，出了问题好排查
- 子组件想修改怎么办？emit事件，让父组件自己修改

### 4. provide/inject和Pinia的区别？
**参考答案**：
- provide/inject：祖先给后代传数据，是"传递"关系，数据来源不明确，适合简单的跨代传值
- Pinia：全局状态管理，有统一的store，数据流向清晰，有devtools支持，适合复杂的全局状态
- 简单的、层级深的传值用provide/inject
- 复杂的、多处使用的全局数据用Pinia

### 5. 怎么理解v-model？Vue3和Vue2的区别？
**参考答案**：
- v-model是双向绑定的语法糖，本质是属性绑定+事件监听的组合
- Vue2：v-model对应value属性和input事件，组件只能有一个v-model
- Vue3：v-model:name对应name属性和update:name事件，支持多个v-model
- Vue3可以自定义v-model的参数名，更灵活

---

## 十五、总结与后续学习建议

### 15.1 本篇要点回顾

回顾一下这篇的8种通信方式：

| 方式 | 适用场景 | 一句话总结 |
|------|---------|-----------|
| props | 父传子 | 爸爸给儿子零花钱 |
| emit | 子传父 | 儿子跟爸爸要东西 |
| v-model | 父子双向绑定 | 共用的存钱罐 |
| ref+expose | 父调子方法 | 爸爸叫儿子做事 |
| provide/inject | 祖孙跨代 | 爷爷的传家宝 |
| Pinia | 全局共享 | 家族公共仓库 |
| 父组件中转 | 兄弟通信 | 哥俩说话通过爸妈 |
| mitt | 任意组件 | 家族微信群聊 |
| $attrs | 属性透传 | 剩下的都给你 |

### 15.2 学习心得

组件通信是Vue的重点，也是面试必考题。但其实不用死记硬背——用多了自然就会了。

给新手的建议：
1. **先掌握最常用的3个**：props、emit、Pinia——这三个搞定了90%的场景
2. **其他的了解即可**：用到的时候再查，知道有这么个东西就行
3. **在项目中学习**：封装几个组件，各种通信方式自然就会了
4. **别过度设计**：简单的通信别硬上Pinia，适合的才是最好的

组件通信这个东西，Vue和React原理都是通的，学会了Vue的，React的一看就懂。

🤖 **AI时代怎么学组件通信**：
- 不知道用什么方式合适？把场景说给AI听，让AI给你建议
- 封装组件让AI先写一版，你再优化
- 但是！各种方式的优缺点和适用场景要理解，不然选了不合适的方式，后期维护头疼

### 15.3 接下来学什么？

Vue全家桶三件套+组件通信都搞定了，接下来该学**组件库**了——Element Plus，CV工程师的快乐源泉，写后台管理系统嗖嗖快。

```
Vue3 → Vue Router → Pinia → 组件通信 → Element Plus → Tailwind → Vant → 全栈项目
```

下一篇咱们讲 **Element Plus**——开箱即用的Vue3组件库，写页面就像搭积木一样简单。

### 15.4 学习资源推荐

- **Vue3官方文档**：组件通信讲得非常清楚
- **VueUse**：组合式函数库，里面很多封装好的工具
- **Element Plus源码**：看看大厂的组件库是怎么设计通信的
- **各种开源后台模板**：找个开源项目，看看人家组件怎么设计、怎么通信

---

> 💬 **最后说两句**：
> 
> 恭喜你又看完了一篇组件通信的教程！Vue核心的东西你基本都学完了。
> 
> 我刚学Vue的时候，组件通信这块也挺懵的——这么多种方式，到底用哪个？后来做的项目多了，慢慢就有感觉了——大部分场景就是props和emit，复杂点的上Pinia，剩下的都是特殊场景按需用。
> 
> 就像一家人过日子，大部分时候就是爸妈跟孩子说话。真要有大事，全家开个会（Pinia）。平时不用搞那么复杂。
> 
> 现在就去封装一个你自己的通用组件吧，比如弹窗、输入框、表格……封装的过程中，各种通信方式你自然就吃透了。
> 
> **万水千山总是情，点个👍行不行？** 你的点赞收藏是我更新的最大动力！

---

*相关推荐：《Vue3入门：Composition API写起来到底有多爽》《Pinia状态管理：Vuex的"青春版"》《Element Plus开箱即用：CV工程师的快乐》*
