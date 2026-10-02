---
title: "Vue 组件通信完全指南：从「一家人过日子」讲起"
published: 2026-09-08
description: "用「一家人过日子」的比喻讲透 Vue 组件通信：props、emit、provide/inject、事件总线等 8 种方式一次学会。"
tags: ["Vue","组件通信"]
category: "Vue"
image: "/blogs/前端/vue-communication-cover-20261002.jpg"
author: "jojo"
draft: false
comment: true
lang: "zh-CN"
aiPolished: false
---
# Vue 组件通信完全指南：从「一家人过日子」讲起

> 目录
>
> 1. [为什么需要组件通信](#一为什么需要组件通信)
> 2. [一张总表：8 种通信方式速览](#二一张总表8-种通信方式速览)
> 3. [父传子：props —— 爸妈给孩子零花钱](#三父传子props--爸妈给孩子零花钱)
> 4. [子传父：\$emit —— 孩子跟爸妈要东西](#四子传子emit--孩子跟爸妈要东西)
> 5. [兄弟通信：父组件当传声筒](#五兄弟通信父组件当传声筒)
> 6. [祖孙通信：provide / inject —— 爷爷的传家宝](#六祖孙通信provide--inject--爷爷的传家宝)
> 7. [跨代通信：Pinia / Vuex —— 家族公共仓库](#七跨代通信pinia--vuex--家族公共仓库)
> 8. [父调子方法：ref / defineExpose —— 爸妈叫孩子做事](#八父调子方法ref--defineexpose--爸妈叫孩子做事)
> 9. [事件总线 mitt —— 群聊广播](#九事件总线-mitt--群聊广播)
> 10. [v-model 和 .sync —— 双向通信](#十v-model-和-sync--双向通信)
> 11. [attrs 和 listeners —— 剩下的都给你](#十一attrs--和--listeners--剩下的都给你)
> 12. [怎么选？一张决策图](#十二怎么选一张决策图)
> 13. [面试八股](#十三面试八股)
> 14. [总结](#十四总结)

---

## 一、为什么需要组件通信

先讲个故事。

张家有五口人：爷爷、爸爸、妈妈、哥哥、妹妹。

- 爷爷管着家里的传家宝，想传给孙子孙女
- 爸妈管着家里的钱，给孩子们发零花钱
- 哥哥想买新球鞋，得跟爸妈要钱
- 妹妹饿了，想让哥哥给她拿零食
- 一家人有什么大事，要一起商量

组件通信就是「组件之间怎么传递消息、怎么共享数据」。组件就像家里的每个人，各自独立，但又需要互相交流。

如果组件之间完全不能通信，那就像一大家人各过各的，饭也没法一起做、钱也没法一起花——这日子没法过了。

**Vue 的组件树就像一棵家谱：**

```
        App（爷爷）
       /    \
    Header  Main（爸爸）
           /   |   \
      Sidebar Content Footer（孩子）
                  /     \
            ItemList   Pagination（孙子）
```

- 有父子关系（爸爸 → 孩子）
- 有祖孙关系（爷爷 → 孙子）
- 有兄弟关系（哥哥 ↔ 妹妹）
- 有远亲关系（八竿子打不着的两个组件）

不同的关系，通信方式也不一样。下面一个个讲。

---

## 二、一张总表：8 种通信方式速览

先把结论放前面，后面慢慢展开讲。

| 通信方式 | 适用场景 | 关系 | 难度 |
|---------|---------|------|------|
| props | 父传子 | 父子 | ★☆☆☆☆ |
| $emit | 子传父 | 父子 | ★☆☆☆☆ |
| v-model | 双向绑定 | 父子 | ★★☆☆☆ |
| ref / defineExpose | 父调子方法/属性 | 父子 | ★★☆☆☆ |
| provide / inject | 祖先传后代 | 祖孙/跨代 | ★★★☆☆ |
| Pinia / Vuex | 全局状态共享 | 任意关系 | ★★★☆☆ |
| 事件总线 mitt | 任意组件通信 | 任意关系 | ★★★☆☆ |
| attrs / listeners | 透传属性/事件 | 父子 | ★★★☆☆ |

---

## 三、父传子：props —— 爸妈给孩子零花钱

**场景**：爸爸对儿子说「这是这个月的零花钱，省着点花。」

这是最常用、最简单的通信方式——父组件通过 props 把数据传给子组件。

### 基本用法

**父组件：**

```vue
<template>
  <!-- 给子组件传 money 和 name -->
  <Child :money="100" name="小明" />
</template>
```

**子组件：**

```vue
<script setup>
// 声明 props：我要接收什么
const props = defineProps({
  money: Number,
  name: String,
})

console.log(props.money)  // 100
console.log(props.name)   // 小明
</script>

<template>
  <p>我叫{{ name }}，这个月有 {{ money }} 块零花钱</p>
</template>
```

### props 的完整写法

可以加类型校验、默认值、是否必填：

```js
defineProps({
  // 简单写法：只写类型
  name: String,

  // 完整写法：对象形式
  age: {
    type: Number,
    required: true,      // 必填
    default: 18,         // 默认值
    validator: (value) => {
      // 自定义校验
      return value >= 0 && value <= 120
    },
  },

  // 数组类型的默认值要用函数返回
  hobbies: {
    type: Array,
    default: () => [],
  },
})
```

### 重要原则：单向数据流

**子组件不能直接修改 props！**

```js
// ❌ 错的！不能直接改 props
props.money = 200
```

为什么？因为 props 是爸爸给的，孩子不能自己改零花钱的金额——那不成抢了吗？要改也得跟爸爸说（发事件），爸爸同意了才能改。

这就是「单向数据流」：**数据只能从父组件流向子组件，子组件不能逆流而上改父组件的数据。**

> 就像爸妈给你钱，你只能花，不能自己往钱包里加钱——要加钱得跟爸妈要。

---

## 四、子传父：$emit —— 孩子跟爸妈要东西

**场景**：儿子对爸爸说「爸，我要买球鞋，再给我 500 块。」

子组件不能直接改 props，但可以通过 `$emit` 触发一个事件，告诉父组件「我要干嘛」，父组件收到事件后自己决定怎么办。

### 基本用法

**子组件：**

```vue
<script setup>
const emit = defineEmits(['ask-money'])

function buyShoes() {
  // 触发事件，带参数
  emit('ask-money', 500)
}
</script>

<template>
  <button @click="buyShoes">我要买球鞋</button>
</template>
```

**父组件：**

```vue
<script setup>
function giveMoney(amount) {
  console.log('孩子要了', amount, '块钱')
  // 父组件决定给不给、给多少
}
</script>

<template>
  <Child @ask-money="giveMoney" />
</template>
```

### 完整流程

```
子组件点击按钮
  ↓
emit('ask-money', 500)  →  喊一声「爸，给我 500」
  ↓
父组件监听 @ask-money   →  听到了
  ↓
执行 giveMoney(500)      →  给钱（或不给）
```

**为什么要这么绕？** 因为单向数据流——数据只能从上往下流。子组件要改数据，得通知父组件去改，改完之后通过 props 再传下来。这样数据流向始终清晰，出了问题好排查。

> 就像孩子不能直接拿爸妈钱包里的钱，得跟爸妈说一声，爸妈同意了再给你。规矩虽然麻烦，但家里的钱不会乱。

---

## 五、兄弟通信：父组件当传声筒

**场景**：哥哥想让妹妹递一下遥控器，但哥哥不能直接从妹妹手里抢——得跟爸妈说，爸妈再跟妹妹说。

两个兄弟组件（同级）之间不能直接通信，要通过共同的父组件当「中间人」。

### 流程

```
哥哥 → emit 事件 → 父组件收到 → 修改数据 → 通过 props 传给妹妹
```

### 代码示例

**哥哥组件：**

```vue
<script setup>
const emit = defineEmits(['change-channel'])

function changeChannel() {
  emit('change-channel', 5)  // 告诉爸爸：我要看 5 台
}
</script>
```

**爸爸组件（中间传声筒）：**

```vue
<script setup>
import { ref } from 'vue'
import Brother from './Brother.vue'
import Sister from './Sister.vue'

const channel = ref(1)

function handleChangeChannel(newChannel) {
  channel.value = newChannel  // 爸爸改数据
}
</script>

<template>
  <!-- 哥哥发事件上来 -->
  <Brother @change-channel="handleChangeChannel" />

  <!-- 爸爸再把数据传给妹妹 -->
  <Sister :channel="channel" />
</template>
```

**妹妹组件：**

```vue
<script setup>
const props = defineProps(['channel'])
</script>

<template>
  <p>现在在看 {{ channel }} 台</p>
</template>
```

### 为什么不直接让兄弟通信？

Vue 的设计就是单向数据流、父子通信。兄弟之间绕过父组件直接通信，会让数据流向变乱——谁改了数据、从哪改的，查起来很麻烦。

通过父组件当中转站，虽然多了一步，但数据流向清晰：**兄弟 A → 父 → 兄弟 B**，所有数据变更都发生在父组件，好追踪。

> 就像家里哥哥妹妹要东西，都通过爸妈传递。不然哥哥直接翻妹妹的抽屉、妹妹直接拿哥哥的零花钱，家里就乱套了。

---

## 六、祖孙通信：provide / inject —— 爷爷的传家宝

**场景**：爷爷有个传家宝，想直接交给孙子，不用经过爸爸转手。

如果组件层级很深，数据要从爷爷传到孙子，得经过爸爸这一层。爸爸可能根本用不上这个数据，但为了传给孙子还得接收一下再传下去——很麻烦。

`provide / inject` 就是解决这个问题的：**祖先组件提供数据，后代组件直接注入使用，中间层不用管。**

### 基本用法

**爷爷组件（提供数据）：**

```vue
<script setup>
import { provide, ref } from 'vue'

const familyTreasure = ref('传家宝玉镯')

// 提供给所有后代
provide('treasure', familyTreasure)
</script>
```

**孙子组件（注入使用）：**

```vue
<script setup>
import { inject } from 'vue'

// 直接注入，不用经过爸爸
const treasure = inject('treasure')

console.log(treasure.value)  // 传家宝玉镯
</script>
```

中间的爸爸组件什么都不用做，孙子直接拿到爷爷的数据。就像爷爷直接把传家宝塞到孙子手里，爸爸都不知道这件事。

### provide 可以传函数

不仅可以传数据，还可以传修改数据的方法：

**爷爷组件：**

```vue
<script setup>
import { provide, ref } from 'vue'

const money = ref(10000)

function addMoney(amount) {
  money.value += amount
}

provide('money', money)
provide('addMoney', addMoney)
</script>
```

**孙子组件：**

```vue
<script setup>
import { inject } from 'vue'

const money = inject('money')
const addMoney = inject('addMoney')

// 孙子也能改爷爷的数据
function earnMoney() {
  addMoney(500)
}
</script>
```

### 注意事项

1. **provide 的数据不是响应式的吗？** —— 你传个 `ref` 过去就是响应式的，传普通值就不是。
2. **会不会冲突？** —— 多个祖先 provide 同一个 key，后代拿到的是最近的那个（就近原则）。
3. **用在哪？** —— 深层组件需要共享数据、但又不想用 Pinia 的时候。比如主题色、语言、用户信息这种全局但不复杂的东西。

---

## 七、跨代通信：Pinia / Vuex —— 家族公共仓库

**场景**：家里有个公共仓库，谁需要什么就去仓库里拿，要存东西也放仓库里。不用你传给我、我传给他的。

当组件之间离得很远（比如侧边栏要改头部的用户名），用父子一层层传太麻烦了，provide/inject 也不够用。这时候就需要一个**全局状态管理**——所有组件都能访问的公共仓库。

这就是 Pinia（Vuex 是老一代的）。

### 基本思路

```
所有组件都能读仓库里的数据
所有组件都能调用仓库的方法改数据
数据一变，所有用到的组件自动更新
```

### 最简单的例子

**仓库：**

```js
// stores/family.js
import { defineStore } from 'pinia'

export const useFamilyStore = defineStore('family', {
  state: () => ({
    money: 10000,
    familyName: '张',
  }),
  actions: {
    earnMoney(amount) {
      this.money += amount
    },
    spendMoney(amount) {
      this.money -= amount
    },
  },
})
```

**任意组件里用：**

```vue
<script setup>
import { useFamilyStore } from '@/stores/family'

const familyStore = useFamilyStore()

console.log(familyStore.money)  // 10000
familyStore.earnMoney(500)      // 赚钱了
console.log(familyStore.money)  // 10500
</script>
```

不管你在哪个组件、在第几层，都能直接访问和修改。就像家里的公共钱包，谁都能看、谁都能往里存、谁都能取（当然得按规矩来）。

### 什么时候用 Pinia？

| 用 props 就行 | 必须用 Pinia |
|-------------|------------|
| 父子之间传数据 | 很多组件共享同一份数据 |
| 只传 1~2 层 | 跨很多层、很远的组件 |
| 简单的数据 | 数据有复杂的修改逻辑 |
| 数据只在一个地方改 | 很多地方都会改 |

**经验法则**：能用 props 解决的就用 props，props 解决不了的再考虑 Pinia。不要什么都往 Pinia 里塞，不然仓库会越来越乱。

---

## 八、父调子方法：ref / defineExpose —— 爸妈叫孩子做事

**场景**：爸爸叫儿子「去把垃圾倒了。」

有时候父组件需要直接调用子组件的方法，或者访问子组件的属性。这时候用 `ref` 拿到子组件的实例。

### 基本用法

**子组件：**

```vue
<script setup>
import { ref } from 'vue'

const roomClean = ref(false)

function cleanRoom() {
  roomClean.value = true
  console.log('房间打扫好了')
}

// 必须显式暴露出去，父组件才能拿到
defineExpose({
  cleanRoom,
  roomClean,
})
</script>
```

**父组件：**

```vue
<script setup>
import { ref, onMounted } from 'vue'
import Child from './Child.vue'

// 给子组件加个 ref
const childRef = ref(null)

onMounted(() => {
  // 调用子组件的方法
  childRef.value.cleanRoom()

  // 访问子组件的属性
  console.log(childRef.value.roomClean)
})
</script>

<template>
  <Child ref="childRef" />
</template>
```

### 为什么需要 defineExpose？

因为 `<script setup>` 里的变量默认是私有的，父组件拿不到。你得用 `defineExpose` 明确指定「哪些东西可以让父组件看到」。

> 就像孩子有自己的隐私，不是什么都让爸妈知道的。愿意让爸妈知道的，才主动暴露出来。

### 注意事项

1. **不要滥用 ref** —— 大部分情况用 props 和 emit 就够了。父组件直接调子组件的方法，会让两个组件耦合太深，不好维护。
2. **ref 要等组件挂载后才能用** —— `setup` 里直接访问是 `null`，要在 `onMounted` 之后或者事件回调里用。

---

## 九、事件总线 mitt —— 群聊广播

**场景**：建一个家庭群，谁有啥事在群里说一声，其他人想接就接。

有时候两个组件完全没关系（比如一个在最左边、一个在最右边），用 Pinia 又太重，就可以用事件总线——一个全局的事件收发器。

Vue 2 里有 `$bus`，Vue 3 移除了，推荐用第三方库 **mitt**。

### 使用方式

**安装：**

```bash
npm install mitt
```

**创建事件总线：**

```js
// src/utils/emitter.js
import mitt from 'mitt'

const emitter = mitt()
export default emitter
```

**组件 A 发消息：**

```js
import emitter from '@/utils/emitter'

// 发一个叫「dinner-ready」的事件，带参数
emitter.emit('dinner-ready', { food: '红烧肉', time: '18:30' })
```

**组件 B 收消息：**

```js
import { onMounted, onUnmounted } from 'vue'
import emitter from '@/utils/emitter'

onMounted(() => {
  // 监听事件
  emitter.on('dinner-ready', (data) => {
    console.log('开饭了！', data.food)
  })
})

onUnmounted(() => {
  // 组件销毁时要取消监听！不然会内存泄漏
  emitter.off('dinner-ready')
})
```

### 注意：一定要取消监听

事件总线是全局的，组件销毁了如果不取消监听，回调函数还在内存里，下次触发还会执行——可能会报错或者内存泄漏。

**一定要在 `onUnmounted` 里 `off`。**

### 什么时候用？

- 两个完全没关系的组件
- 偶尔一次的通知（「我好了」「刷新一下」）
- 用 Pinia 太重，用 props 又传不到

**不要滥用**——事件总线多了之后，你都不知道谁在哪发了事件、谁在哪监听，代码会很乱。能用 Pinia 的还是优先用 Pinia。

---

## 十、v-model 和 .sync —— 双向通信

**场景**：爸爸给孩子零花钱，孩子花了多少，爸爸那边自动知道，不用孩子每次都汇报。

props + emit 是「单向」的——父传子用 props，子传父用 emit。`v-model` 是把这两步合成一个语法糖，实现「双向绑定」。

### 基本用法

**子组件：**

```vue
<script setup>
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

function handleChange(e) {
  emit('update:modelValue', e.target.value)
}
</script>

<template>
  <input :value="modelValue" @input="handleChange" />
</template>
```

**父组件：**

```vue
<template>
  <!-- v-model 是语法糖 -->
  <Child v-model="username" />

  <!-- 等价于 -->
  <Child
    :modelValue="username"
    @update:modelValue="username = $event"
  />
</template>
```

### 自定义 v-model 的名字

可以给 v-model 起名字，这样一个组件可以有多个双向绑定：

**子组件：**

```js
const props = defineProps(['visible', 'title'])
const emit = defineEmits(['update:visible', 'update:title'])
```

**父组件：**

```vue
<Child v-model:visible="showDialog" v-model:title="dialogTitle" />
```

> Vue 2 里的 `.sync` 修饰符在 Vue 3 里被 `v-model:xxx` 替代了，功能是一样的。

### 用在哪？

表单组件最常用——输入框、单选框、复选框、开关等。用户输入的时候，值自动同步回父组件。

---

## 十一、attrs 和 listeners —— 剩下的都给你

**场景**：妈妈给孩子收拾书包，把没用上的东西一股脑塞进去，孩子自己看着办。

有时候你封装一个组件，父组件传了很多属性，但你只在 props 里声明了几个。那些没声明的属性去哪了？

它们都在 `$attrs` 里。

### $attrs 是什么

父组件传过来的、**没有在 props 里声明**的所有属性（包括 class、style、事件等）。

```vue
<!-- 父组件 -->
<MyInput
  v-model="value"
  type="text"
  placeholder="请输入"
  maxlength="20"
  class="my-input"
/>
```

```vue
<!-- 子组件 MyInput -->
<script setup>
const props = defineProps(['modelValue'])
// 只声明了 modelValue，其他的（type、placeholder、maxlength、class）都在 $attrs 里
</script>

<template>
  <!-- v-bind="$attrs" 把所有没声明的属性都透传到 input 上 -->
  <input :value="modelValue" v-bind="$attrs" />
</template>
```

`v-bind="$attrs"` 就像一个「透传管道」，把父组件传的多余属性都传给内部的原生元素。

### 封装组件时特别有用

封装一个自定义输入框组件，你不可能把 input 的所有属性（几十种）都在 props 里声明一遍。用 `$attrs` 透传，父组件传什么原生属性都能直接生效，不用你一个个接。

---

## 十二、怎么选？一张决策图

```
两个组件要通信
  │
  ├─ 是父子关系吗？
  │   ├─ 是，父传子 → props
  │   ├─ 是，子传父 → emit
  │   ├─ 是，双向绑定 → v-model
  │   └─ 是，父要调子方法 → ref + defineExpose
  │
  ├─ 是祖孙关系吗？
  │   ├─ 是，数据简单 → provide / inject
  │   └─ 是，数据复杂 → Pinia
  │
  ├─ 是兄弟关系吗？
  │   ├─ 是，数据简单 → 通过父组件中转
  │   └─ 是，数据复杂 → Pinia
  │
  └─ 完全没关系？
      ├─ 偶尔通知一下 → mitt 事件总线
      └─ 共享数据 → Pinia
```

### 一个简单的原则

**能就近解决的就就近解决，不要什么都往全局扔。**

- 父子 → props / emit
- 隔了一层 → 通过父组件中转
- 隔了好几层 → provide / inject
- 很多地方都用 → Pinia
- 偶尔通知一下 → mitt

---

## 十三、面试八股

下面是组件通信的高频面试题和参考答案。

### 1. Vue 组件通信有哪些方式？

**参考答案：**

8 种常用方式：

1. **props / emit** —— 父子通信，最常用
2. **v-model** —— 父子双向绑定，props + emit 的语法糖
3. **ref / defineExpose** —— 父组件调子组件的方法和属性
4. **provide / inject** —— 祖先后代跨层通信
5. **Pinia / Vuex** —— 全局状态管理，任意组件共享
6. **事件总线（mitt）** —— 任意组件之间通过事件通信
7. **attrs / listeners** —— 属性/事件透传，封装组件常用
8. **父组件中转** —— 兄弟组件通过共同的父组件传递

按关系分：
- 父子：props、emit、v-model、ref、attrs
- 祖孙：provide/inject
- 兄弟：父组件中转、Pinia
- 全局：Pinia、事件总线

---

### 2. 为什么 props 是单向的？子组件为什么不能直接改 props？

**参考答案：**

这是 Vue 的「单向数据流」设计原则，原因有三个：

1. **数据流向清晰** —— 数据只能从父组件流到子组件，所有数据变更都发生在父组件。出问题了好排查，知道数据是在哪改的。

2. **防止数据混乱** —— 如果多个子组件都能直接改同一个 props，你不知道是谁改的、什么时候改的。子组件多了之后，数据流就乱了。

3. **组件解耦** —— 子组件只管自己的事，不应该去修改父组件的状态。子组件只负责展示和触发事件，改数据由父组件决定。

子组件要改数据的话，应该 emit 一个事件通知父组件，由父组件来改，改完再通过 props 传下来。

> 就像公司的审批流程：下属可以提申请，但不能直接改系统数据，得领导审批通过了才能改。

---

### 3. v-model 的原理是什么？

**参考答案：**

v-model 是语法糖，本质上是 `props + emit` 的组合。

Vue 3 中：

```vue
<Child v-model="name" />
```

等价于：

```vue
<Child
  :modelValue="name"
  @update:modelValue="name = $event"
/>
```

子组件内部：
- 接收 props：`modelValue`
- 触发事件：`update:modelValue`

一个组件可以有多个 v-model，通过名字区分：

```vue
<Child v-model:visible="show" v-model:title="title" />
```

对应 props：`visible`、`title`
对应事件：`update:visible`、`update:title`

---

### 4. provide / inject 和 Pinia 有什么区别？

**参考答案：**

| 对比项 | provide / inject | Pinia |
|--------|----------------|-------|
| 定位 | 依赖注入，跨层传数据 | 状态管理，全局数据仓库 |
| 数据流向 | 祖先 → 后代，单向 | 任意组件都能读写 |
| DevTools | 不好追踪 | 有完整的时间旅行、状态记录 |
| 数据修改 | 自己约定（传个函数进去） | 统一在 actions 里改 |
| 适用场景 | 深层组件传简单数据 | 复杂的全局状态、多处读写 |
| 复杂度 | 简单，Vue 内置 | 稍重，需要安装和学习 |

**怎么选：**
- 只是传个数据下去 → provide/inject
- 数据要到处改、多处用 → Pinia

---

### 5. 为什么事件总线要在组件销毁时取消监听？

**参考答案：**

因为事件总线是全局的，绑定的回调函数存在全局对象里。组件销毁时如果不取消监听：

1. **内存泄漏** —— 回调函数和闭包里的变量没法被垃圾回收，内存越用越多
2. **重复执行** —— 组件销毁了但回调还在，事件触发时还会执行，可能报错（比如操作已经不存在的 DOM）
3. **多次绑定** —— 组件每次创建都绑定一次，同一个事件会有多个回调，触发多次

所以一定要在 `onUnmounted` 生命周期里调用 `emitter.off('eventName', handler)` 取消监听。

---

### 6. defineExpose 是干什么的？为什么需要它？

**参考答案：**

`defineExpose` 是 `<script setup>` 语法里的 API，用来显式指定子组件要暴露给父组件的属性和方法。

**为什么需要？** 因为 `<script setup>` 是默认闭包的，里面的变量和函数都是私有的，父组件通过 ref 拿不到子组件的任何东西。必须用 `defineExpose` 明确暴露出来，父组件才能访问。

这是一种封装保护——子组件内部的实现细节不对外暴露，只暴露必要的接口，避免父组件乱调子组件内部的东西导致耦合太深。

---

### 7. \$attrs 是什么？用在什么场景？

**参考答案：**

`$attrs` 是父组件传过来的、但子组件没有在 props 和 emits 中声明的所有属性和事件的集合。

包括：class、style、普通 HTML 属性、没有声明的事件等。

**常见用途**：

1. **透传属性** —— 封装组件时，把没声明的属性直接透传给内部的原生元素。比如封装一个 Input 组件，父组件传的 placeholder、maxlength、disabled 等不用一个个声明，直接 `v-bind="$attrs"` 传进去。

2. **二次封装组件** —— 对第三方组件做二次封装时，不想把所有 props 都重新声明一遍，用 $attrs 透传过去，省很多代码。

**注意**：`inheritAttrs: false` 可以阻止默认的属性透传（默认会透传到组件根元素上），配合 $attrs 使用可以手动控制属性挂到哪个元素上。

---

### 8. 兄弟组件怎么通信？

**参考答案：**

几种方案，按推荐程度排序：

1. **提升状态到父组件**（最推荐）—— 把共享数据提升到共同的父组件，父组件通过 props 分发给两个子组件，子组件通过 emit 通知父组件修改。优点是数据流清晰，缺点是层级深了比较麻烦。

2. **Pinia / Vuex** —— 把共享数据放到全局 store 里，两个兄弟组件都从 store 里读写。适合数据复杂、兄弟关系比较远的场景。

3. **事件总线 mitt** —— 一个组件发事件，另一个组件监听事件。适合简单通知类的场景，但要记得取消监听。

**怎么选：**
- 兄弟比较近（同一个父组件）→ 提升状态到父组件
- 数据比较复杂、多个地方用 → Pinia
- 只是偶尔通知一下 → mitt

---

### 9. Pinia 和 Vuex 的区别？

**参考答案：**

Pinia 是 Vue 官方新一代状态管理库，用来替代 Vuex。主要区别：

1. **去掉了 mutations** —— Vuex 必须通过 mutations 改 state，Pinia 直接在 actions 里改，更简单
2. **更好的 TypeScript 支持** —— Pinia 原生支持 TS，类型推导很丝滑
3. **没有 modules 嵌套** —— Pinia 直接定义多个 store，扁平化管理，更灵活
4. **体积更小** —— Pinia 只有 1KB 左右
5. **支持组合式写法** —— 支持 Setup Store，和 Vue 3 Composition API 风格一致
6. **支持 HMR** —— 修改 store 热更新，不用刷新页面

简单说：Pinia 就是更简单、更好用的 Vuex 5。

---

### 10. 组件通信方式那么多，实际项目怎么选？

**参考答案：**

一个核心原则：**就近原则，能简单就别复杂。**

优先级从高到低：

1. **父子通信 → props / emit / v-model** —— 最直接、最推荐
2. **跨 1~2 层 → 父组件中转** —— 虽然多写一步，但数据流清晰
3. **跨很多层但数据简单 → provide/inject** —— 不用一层层传了
4. **全局共享数据 → Pinia** —— 数据复杂、多处读写时用
5. **完全没关系的组件 → mitt** —— 偶尔通知用，别滥用

**不要什么都往 Pinia 里塞。** Pinia 是全局状态库，什么数据都往里面放，时间长了 store 会变成垃圾场——你都不知道哪个数据是干嘛的、谁在改。

只有真正全局共享的数据（用户信息、主题、购物车数量等）才放 Pinia，其他的尽量就近解决。

---

## 十四、总结

组件通信是 Vue 开发的核心技能之一，记住「家里人」的比喻就好记了：

- **props** —— 爸妈给孩子零花钱（父传子）
- **emit** —— 孩子跟爸妈要东西（子传父）
- **v-model** —— 双向的，花了多少爸妈都知道
- **ref + defineExpose** —— 爸妈叫孩子做事（父调子方法）
- **provide/inject** —— 爷爷直接给孙子传家宝（跨层）
- **Pinia** —— 家里的公共仓库（全局共享）
- **mitt** —— 家庭群里喊一声（事件广播）
- **attrs** —— 剩下的东西都给你（透传）

**选型原则**：就近解决，能用 props 就用 props，解决不了再升级。不要什么都往全局扔，不然项目大了维护起来很痛苦。

掌握这 8 种方式，再知道每种的适用场景和注意事项，日常开发和面试都没问题了。
