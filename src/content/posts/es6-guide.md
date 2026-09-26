---
title: "ES6 完全指南，都给我记住啊！"
published: 2026-09-10
description: "es6速成"
tags: []
category: "技术总结"
draft: false
lang: "zh-CN"
---


> 目录
>
> 1. [ES6 是什么](#一es6-是什么)
> 2. [let 和 const：变量声明的革命](#二let-和-const变量声明的革命)
> 3. [箭头函数：不只是简写](#三箭头函数不只是简写)
> 4. [解构赋值：取数据更优雅](#四解构赋值取数据更优雅)
> 5. [模板字符串：告别字符串拼接](#五模板字符串告别字符串拼接)
> 6. [默认参数和扩展运算符](#六默认参数和扩展运算符)
> 7. [Promise：异步编程的救星](#七promise异步编程的救星)
> 8. [async / await：用同步写异步](#八async--await用同步写异步)
> 9. [类（Class）：面向对象](#九类class面向对象)
> 10. [模块化：import 和 export](#十模块化import-和-export)
> 11. [Map 和 Set：新的数据结构](#十一map-和-set新的数据结构)
> 12. [数组方法扩展](#十二数组方法扩展)
> 13. [可选链和空值合并](#十三可选链和空值合并)
> 14. [面试八股](#十四面试八股)
> 15. [总结](#十五总结)

---

## 一、ES6 是什么

ES6 全称 ECMAScript 2015，是 JavaScript 语言的重大升级版本。

在 ES6 之前，JS 有很多让人诟病的地方：变量提升导致 bug、没有模块系统、回调地狱、写个类要绕半天……ES6 一次性解决了这些问题，让 JS 从「玩具语言」变成了「真正的工程语言」。

**你现在写的 Vue、React、Node.js 代码，里面 90% 的语法都来自 ES6+。**

> 把 ES6 之前的 JS 想象成「老版手机」，ES6 就是「智能机」——功能更强、写起来更爽、bug 更少。学会 ES6，你的 JS 就正式进入现代时代了。

**实际上现在说的「ES6」已经不只是 2015 版了**，它泛指 ES2015 之后所有新版本的语法。ES2020、ES2022 的东西大家也习惯叫 ES6 语法。下面把常用的都讲了。

---

## 二、let 和 const：变量声明的革命

### var 的问题

ES5 只有 `var` 声明变量，它有三个大坑：

#### 坑 1：变量提升

```js
console.log(a)  // undefined（不报错，但也不对）
var a = 1
```

`var` 声明的变量会在代码执行前被「提升」到作用域顶部，所以 `a` 在声明前就能访问——但值是 `undefined`。这导致很多难以发现的 bug。

#### 坑 2：没有块级作用域

```js
if (true) {
  var b = 1
}
console.log(b)  // 1（居然能访问到！）
```

`var` 声明的变量不受 `{}` 限制，泄漏到外面去了。

#### 坑 3：可以重复声明

```js
var a = 1
var a = 2  // 不报错，静默覆盖
console.log(a)  // 2
```

不小心重名了也不会提醒你，直接覆盖，bug 很难找。

### let：修复 var 的所有问题

```js
let a = 1

// 没有变量提升
console.log(b)  // ReferenceError: Cannot access 'b' before initialization
let b = 2

// 有块级作用域
if (true) {
  let c = 1
}
console.log(c)  // ReferenceError: c is not defined

// 不能重复声明
let d = 1
let d = 2  // SyntaxError: Identifier 'd' has already been declared
```

三个坑全修了。

### const：常量，不能重新赋值

```js
const PI = 3.14159
PI = 3  // TypeError: Assignment to constant variable

const obj = { name: '张三' }
obj = { name: '李四' }  // ❌ 不能重新赋值
obj.name = '李四'  // ✅ 可以修改属性！
```

**注意**：`const` 不是说值不能改，而是说变量指向的地址不能改。对象内部的属性是可以修改的。

### 怎么选？

| 场景 | 用什么 |
|------|--------|
| 不会重新赋值的值 | `const`（默认用这个） |
| 会重新赋值的值（计数器、循环变量） | `let` |
| 就是不要用 | `var` |

**经验法则**：默认全用 `const`，需要改的时候才用 `let`，永远不用 `var`。

> 就像购物：看中的东西先放购物车（const），发现要换的才拿出来重新挑（let），但永远不要偷别人的（var）。

---

## 三、箭头函数：不只是简写

### 语法

```js
// 传统写法
function add(a, b) {
  return a + b
}

// 箭头函数
const add = (a, b) => a + b

// 只有一个参数可以省略括号
const square = x => x * x

// 没有参数要写空括号
const sayHi = () => console.log('hi')

// 多行用大括号，要手动 return
const compute = (a, b) => {
  const sum = a + b
  const diff = a - b
  return sum * diff
}

// 返回对象要加括号
const makeUser = name => ({ name, age: 18 })
```

### 和普通函数的核心区别：没有 this

这是面试必考点，也是最容易踩的坑。

```js
// 普通函数：this 指向调用者
const obj = {
  name: '张三',
  sayName: function () {
    console.log(this.name)  // 张三（this 指向 obj）
  }
}

// 箭头函数：没有自己的 this，用外层的 this
const obj2 = {
  name: '李四',
  sayName: () => {
    console.log(this.name)  // undefined（this 指向外层，不是 obj2）
  }
}
```

**箭头函数没有自己的 `this`**，它的 `this` 是定义时外层作用域的 `this`。普通函数的 `this` 是调用时决定的，箭头函数的 `this` 是定义时就定死了。

### 最常见的场景：回调函数里用 this

```js
// ❌ 普通函数的坑
const obj = {
  name: '张三',
  friends: ['李四', '王五'],
  showFriends() {
    this.friends.forEach(function (friend) {
      console.log(`${this.name} 的朋友是 ${friend}`)
      // this.name 是 undefined！因为 forEach 回调里的 this 不是 obj
    })
  }
}

// ✅ 箭头函数解决
const obj2 = {
  name: '张三',
  friends: ['李四', '王五'],
  showFriends() {
    this.friends.forEach(friend => {
      console.log(`${this.name} 的朋友是 ${friend}`)
      // ✅ this.name 是张三！箭头函数没有自己的 this，用外层的 this
    })
  }
}
```

这就是为什么 Vue 的 `methods` 里你要么用普通函数（this 指向组件实例），要么在普通函数内部用箭头函数（借用外层 this）。

### 什么时候不能用箭头函数

1. **对象方法** —— this 不指向对象
2. **构造函数** —— 不能 new
3. **DOM 事件回调（需要 this 指向元素）** —— this 不指向 DOM 元素
4. **prototype 方法** —— this 不指向实例

```js
// ❌ 对象方法不要用箭头函数
const obj = {
  name: '张三',
  sayName: () => console.log(this.name)  // this 不指向 obj
}

// ✅ 用普通函数
const obj = {
  name: '张三',
  sayName() { console.log(this.name) }  // ✅
}
```

---

## 四、解构赋值：取数据更优雅

### 数组解构

```js
const arr = [10, 20, 30]

// 传统
const a = arr[0]
const b = arr[1]
const c = arr[2]

// 解构
const [a, b, c] = arr

// 跳过某些
const [first, , third] = arr  // first=10, third=30

// 剩余运算符
const [first, ...rest] = [1, 2, 3, 4]  // first=1, rest=[2,3,4]

// 交换变量
let x = 1, y = 2
[x, y] = [y, x]  // x=2, y=1，不用临时变量！
```

### 对象解构（最常用）

```js
const user = {
  name: '张三',
  age: 20,
  email: 'zhang@xx.com',
  address: {
    city: '北京',
  }
}

// 基本解构
const { name, age } = user  // name='张三', age=20

// 重命名
const { name: userName } = user  // userName='张三'

// 默认值
const { phone = '未填写' } = user  // phone='未填写'

// 嵌套解构
const { address: { city } } = user  // city='北京'

// 解构 + 重命名 + 默认值
const { name: userName = '匿名', phone = '无' } = user
```

### 函数参数解构（超级实用）

```js
// 传统写法：参数顺序固定，不好维护
function createUser(name, age, email, phone, role) { ... }
createUser('张三', 20, 'zhang@xx.com', null, 'user')

// 解构写法：参数不关心顺序，想传什么传什么
function createUser({ name, age, email, phone = '', role = 'user' }) { ... }
createUser({ name: '张三', age: 20, email: 'zhang@xx.com' })
```

> 你在 Vue/React 里天天写的 `const { name, age } = props` 就是解构赋值。

---

## 五、模板字符串：告别字符串拼接

### 基本用法

```js
const name = '张三'
const age = 20

// 传统拼接（痛苦）
const msg = '我叫' + name + '，今年' + age + '岁'

// 模板字符串
const msg = `我叫${name}，今年${age}岁`
```

反引号包裹，`${}` 里放变量或表达式，写起来和读起来都舒服多了。

### 支持表达式

```js
const a = 1, b = 2
const result = `${a} + ${b} = ${a + b}`  // "1 + 2 = 3"

const user = { name: '张三', age: 20 }
const msg = `${user.name}明年${user.age + 1}岁`  // "张三明年21岁"

// 支持三元运算
const status = true
const msg = `状态：${status ? '在线' : '离线'}`
```

### 支持多行

```js
const html = `
  <div>
    <h1>标题</h1>
    <p>内容</p>
  </div>
`
```

直接换行，不用 `\n` 和 `+` 拼接。

### 标签模板（知道就行）

```js
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    return result + str + (values[i] ? `<b>${values[i]}</b>` : '')
  }, '')
}

const name = '张三'
const age = 20
const result = highlight`我叫${name}，今年${age}岁`
// "我叫<b>张三</b>，今年<b>20</b>岁"
```

Styled Components 的 `styled.div` 就是这个原理。

---

## 六、默认参数和扩展运算符

### 默认参数

```js
// 传统
function greet(name) {
  name = name || '陌生人'
  console.log(`你好，${name}`)
}

// ES6
function greet(name = '陌生人') {
  console.log(`你好，${name}`)
}

greet()        // 你好，陌生人
greet('张三')  // 你好，张三
```

### 扩展运算符 ...

三个点 `...`，意思是「把里面的东西展开」。

#### 展开数组

```js
const arr1 = [1, 2, 3]
const arr2 = [...arr1, 4, 5]  // [1, 2, 3, 4, 5]

// 合并数组
const merged = [...arr1, ...arr2]

// 复制数组（浅拷贝）
const copy = [...arr1]
```

#### 展开对象

```js
const user = { name: '张三', age: 20 }
const newUser = { ...user, email: 'zhang@xx.com' }
// { name: '张三', age: 20, email: 'zhang@xx.com' }

// 合并对象
const defaults = { theme: 'light', lang: 'zh' }
const userConfig = { lang: 'en' }
const config = { ...defaults, ...userConfig }
// { theme: 'light', lang: 'en' }（后面的覆盖前面的）
```

#### 收集参数（rest）

`...` 放在函数参数里，作用反过来——「收集」成数组：

```js
function sum(...nums) {
  return nums.reduce((total, n) => total + n, 0)
}

sum(1, 2, 3)       // 6
sum(1, 2, 3, 4, 5) // 15
```

> 同样是 `...`，放在赋值右边是「展开」，放在函数参数左边是「收集」。看上下文就知道了。

---

## 七、Promise：异步编程的救星

### 为什么要 Promise

ES5 的异步靠回调，层级多了就是「回调地狱」：

```js
// 回调地狱
getUser(userId, function (user) {
  getOrders(user, function (orders) {
    getOrderDetail(orders[0], function (detail) {
      getComments(detail, function (comments) {
        // 四层嵌套，还能继续嵌...
      })
    })
  })
})
```

横向发展，越写越往右，像 `>` 形状。代码难看、难读、难改。

### Promise 基本用法

Promise 是一个对象，代表一个异步操作的最终结果。它有三种状态：

- **pending**（进行中）—— 初始状态
- **fulfilled**（已成功）—— 操作成功
- **rejected**（已失败）—— 操作失败

状态一旦从 pending 变成 fulfilled 或 rejected，就再也不能变了。

```js
const promise = new Promise((resolve, reject) => {
  // 异步操作
  setTimeout(() => {
    const success = true
    if (success) {
      resolve('操作成功')  // 成功
    } else {
      reject(new Error('操作失败'))  // 失败
    }
  }, 1000)
})

promise
  .then(result => console.log(result))    // 成功回调
  .catch(err => console.error(err))       // 失败回调
  .finally(() => console.log('结束了'))    // 不管成功失败都执行
```

### 链式调用：解决回调地狱

```js
// 用 Promise 改写上面的回调地狱
getUser(userId)
  .then(user => getOrders(user))
  .then(orders => getOrderDetail(orders[0]))
  .then(detail => getComments(detail))
  .then(comments => console.log(comments))
  .catch(err => console.error(err))
```

从横向变成了纵向，从 `>` 形变成了 `|` 形，清晰多了。

### 常用 API

```js
// all：所有都成功才成功，一个失败就失败
Promise.all([p1, p2, p3])
  .then(results => console.log(results))  // [结果1, 结果2, 结果3]
  .catch(err => console.error(err))       // 任何一个失败就进这里

// race：第一个完成的（不管成功还是失败）
Promise.race([p1, p2])
  .then(result => console.log('第一个完成的:', result))

// allSettled：等所有完成，不管成功失败（ES2020）
Promise.allSettled([p1, p2, p3])
  .then(results => {
    // results 是 [{ status: 'fulfilled', value: ... }, { status: 'rejected', reason: ... }]
  })

// any：第一个成功的（ES2021）
Promise.any([p1, p2, p3])
  .then(result => console.log('第一个成功的:', result))
```

**实际场景**：
- `Promise.all` —— 同时请求多个接口，等全部完成
- `Promise.race` —— 请求超时控制
- `Promise.allSettled` —— 批量请求，不管成功失败都收集结果

---

## 八、async / await：用同步写异步

### 语法

`async/await` 是 Promise 的语法糖，让异步代码看起来像同步代码。

```js
// Promise 写法
function getData() {
  return fetch('/api/user')
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error(err))
}

// async/await 写法
async function getData() {
  try {
    const res = await fetch('/api/user')
    const data = await res.json()
    console.log(data)
  } catch (err) {
    console.error(err)
  }
}
```

**两个关键词：**
- `async` —— 加在函数前面，表示这是个异步函数，返回值自动包装成 Promise
- `await` —— 等待 Promise 完成，拿到结果。只能在 async 函数里用

### 为什么 await 更好

1. **没有 then 链** —— 不用一层层 .then() 了，直接写
2. **try/catch 处理错误** —— 和同步代码一样用 try/catch
3. **好调试** —— 可以直接在 await 后面打断点，Promise 链不行

### 实际例子

```js
// 并发请求（不要一个一个 await）
async function loadPage() {
  // ❌ 串行：等 2 秒 + 3 秒 = 5 秒
  const user = await getUser()
  const posts = await getPosts()

  // ✅ 并发：等 max(2秒, 3秒) = 3 秒
  const [user, posts] = await Promise.all([
    getUser(),
    getPosts()
  ])
}
```

> 注意：多个独立的异步操作要用 `Promise.all` 并发，不要一个一个 await（那就变串行了）。

### 错误处理

```js
async function getData() {
  try {
    const res = await fetch('/api/user')
    if (!res.ok) throw new Error('请求失败')
    const data = await res.json()
    return data
  } catch (err) {
    console.error('出错了:', err.message)
    return null
  }
}
```

---

## 九、类（Class）：面向对象

### 语法

```js
class Person {
  // 构造函数
  constructor(name, age) {
    this.name = name
    this.age = age
  }

  // 实例方法
  sayHi() {
    console.log(`我叫${this.name}，今年${this.age}岁`)
  }

  // 静态方法（挂在类上，不是实例上）
  static create(name) {
    return new Person(name, 18)
  }
}

const p = new Person('张三', 20)
p.sayHi()  // 我叫张三，今年20岁

const p2 = Person.create('李四')
p2.sayHi()  // 我叫李四，今年18岁
```

### 继承

```js
class Student extends Person {
  constructor(name, age, school) {
    super(name, age)  // 必须先调 super
    this.school = school
  }

  // 重写父类方法
  sayHi() {
    super.sayHi()  // 调用父类的 sayHi
    console.log(`我在${this.school}上学`)
  }

  study() {
    console.log(`${this.name}正在学习`)
  }
}

const s = new Student('王五', 22, '清华')
s.sayHi()   // 我叫王五，今年22岁 / 我在清华上学
s.study()   // 王五正在学习
```

### 私有属性（ES2022）

```js
class Person {
  #name  // 私有属性，前面加 #

  constructor(name) {
    this.#name = name
  }

  getName() {
    return this.#name
  }
}

const p = new Person('张三')
console.log(p.name)   // undefined（外部访问不到）
console.log(p.getName())  // 张三（通过方法访问）
```

### Class 本质是语法糖

```js
// Class 写法
class Person {
  constructor(name) { this.name = name }
  sayHi() { console.log(this.name) }
}

// 等价的 ES5 写法
function Person(name) {
  this.name = name
}
Person.prototype.sayHi = function () {
  console.log(this.name)
}
```

Class 本质上还是基于原型链的，只是写法更清晰、更像传统面向对象语言。

---

## 十、模块化：import 和 export

### 为什么需要模块化

没有模块化之前，JS 通过 `<script>` 标签加载，所有变量都在全局作用域，容易冲突、不好复用、依赖关系混乱。

ES6 的模块系统让 JS 终于有了标准的模块化方案。

### 导出

```js
// utils.js

// 方式一：分别导出
export function add(a, b) { return a + b }
export function subtract(a, b) { return a - b }
export const PI = 3.14

// 方式二：统一导出
function add(a, b) { return a + b }
function subtract(a, b) { return a - b }
const PI = 3.14

export { add, subtract, PI }

// 方式三：默认导出（一个模块只能有一个默认导出）
export default function multiply(a, b) { return a * b }
```

### 导入

```js
// 方式一：按名导入
import { add, subtract, PI } from './utils.js'

// 方式二：重命名
import { add as plus } from './utils.js'

// 方式三：导入默认导出
import multiply from './utils.js'

// 方式四：默认 + 按名 一起导入
import multiply, { add, subtract } from './utils.js'

// 方式五：全部导入
import * as utils from './utils.js'
utils.add(1, 2)
utils.PI
```

### 动态导入

```js
// 按需加载，返回 Promise
const module = await import('./utils.js')
module.add(1, 2)

// 实际场景：路由懒加载
const routes = [
  { path: '/user', component: () => import('@/views/User.vue') }
]
```

> Vue Router 的路由懒加载就是动态 import。

---

## 十一、Map 和 Set：新的数据结构

### Map：键值对，比对象更强大

对象的键只能是字符串或 Symbol，Map 的键可以是任何类型（包括对象、函数）。

```js
const map = new Map()

// 添加
map.set('name', '张三')
map.set('age', 20)
map.set({ id: 1 }, '对象当键')

// 读取
map.get('name')  // 张三

// 有没有
map.has('name')  // true

// 删除
map.delete('name')

// 大小
map.size  // 2

// 遍历
map.forEach((value, key) => {
  console.log(key, value)
})

for (const [key, value] of map) {
  console.log(key, value)
}
```

### Set：值的集合，自动去重

```js
const set = new Set()

set.add(1)
set.add(2)
set.add(2)  // 重复的加不进去
set.add(3)

console.log(set)  // Set(3) { 1, 2, 3 }

// 最常见的用途：数组去重
const arr = [1, 2, 2, 3, 3, 3]
const unique = [...new Set(arr)]  // [1, 2, 3]
```

### Map vs 对象，Set vs 数组

| 对比项 | Map | 对象 |
|--------|-----|------|
| 键的类型 | 任意 | 字符串/Symbol |
| 有序性 | 按插入顺序 | 无序 |
| 大小 | `map.size` | `Object.keys().length` |
| 遍历 | 可直接 for...of | 要转成数组 |
| 适用场景 | 频繁增删、键不是字符串 | 固定结构的数据 |

| 对比项 | Set | 数组 |
|--------|-----|------|
| 特点 | 自动去重 | 可以重复 |
| 查找 | `set.has()` O(1) | `arr.includes()` O(n) |
| 适用场景 | 去重、判断存在 | 有序、可重复 |

---

## 十二、数组方法扩展

ES6 加了很多数组方法，都是面试常考的。

| 方法 | 作用 | 返回值 | 是否改原数组 |
|------|------|--------|------------|
| `forEach` | 遍历 | undefined | 不改 |
| `map` | 映射成新数组 | 新数组 | 不改 |
| `filter` | 过滤 | 新数组 | 不改 |
| `find` | 找第一个满足条件的 | 元素 or undefined | 不改 |
| `findIndex` | 找第一个满足条件的索引 | 索引 or -1 | 不改 |
| `some` | 至少一个满足 | boolean | 不改 |
| `every` | 全部满足 | boolean | 不改 |
| `reduce` | 累积 | 累积值 | 不改 |
| `flat` | 拍平嵌套数组 | 新数组 | 不改 |
| `flatMap` | map + flat | 新数组 | 不改 |
| `includes` | 是否包含 | boolean | 不改 |
| `Array.from` | 类数组转数组 | 新数组 | — |
| `Array.of` | 创建数组 | 新数组 | — |

### 实用例子

```js
// map：把每个元素映射成新值
[1, 2, 3].map(n => n * 2)  // [2, 4, 6]

// filter：过滤
[1, 2, 3, 4].filter(n => n > 2)  // [3, 4]

// find：找第一个
[1, 2, 3].find(n => n > 1)  // 2

// reduce：求和
[1, 2, 3].reduce((sum, n) => sum + n, 0)  // 6

// flat：拍平
[1, [2, [3]]].flat(Infinity)  // [1, 2, 3]

// 数组去重
[...new Set([1, 2, 2, 3])]  // [1, 2, 3]

// 类数组转数组
function test() {
  const args = Array.from(arguments)
  // 或者
  const args2 = [...arguments]
}
```

---

## 十三、可选链和空值合并

这两个虽然不是 ES6（是 ES2020），但现在必用，一起讲了。

### 可选链 ?.

安全地访问深层属性，不用写一堆 `&&` 判断。

```js
const user = {
  name: '张三',
  address: {
    city: '北京'
  }
}

// 传统写法（又长又烦）
const city = user && user.address && user.address.city

// 可选链
const city = user?.address?.city  // 如果中间是 null/undefined，返回 undefined

// 函数调用也可以用
const result = obj?.method?.()  // 如果 obj 或 method 不存在，返回 undefined

// 数组也可以用
const first = arr?.[0]  // 如果 arr 是 null/undefined，返回 undefined
```

### 空值合并 ??

给 null 或 undefined 提供默认值。

```js
// 传统
const name = user.name || '匿名'
// 问题：如果 user.name 是 '' 或 0 或 false，也会被当成「没有值」

// 空值合并：只有 null 和 undefined 才用默认值
const name = user.name ?? '匿名'
// 0、''、false 都会保留，只有 null/undefined 才走默认值
```

### 组合使用

```js
// 从深层对象取值，带默认值
const city = user?.address?.city ?? '未知'
```

> 你在 Vue/React 里天天写 `props?.user?.name ?? ''`，就是这两个。

---

## 十四、面试八股

### 1. let、const、var 的区别？

**参考答案：**

| 对比项 | var | let | const |
|--------|-----|-----|-------|
| 变量提升 | 有（值是 undefined） | 有（但 TDZ，访问报错） | 有（但 TDZ，访问报错） |
| 作用域 | 函数级 | 块级 | 块级 |
| 重复声明 | 允许 | 不允许 | 不允许 |
| 重新赋值 | 允许 | 允许 | 不允许 |
| 全局变量 | 挂到 window | 不挂到 window | 不挂到 window |

**var 的问题**：
- 变量提升导致先访问后声明不报错（但值是 undefined）
- 没有块级作用域，变量泄漏
- 可以重复声明，静默覆盖

**let/const 的 TDZ（暂时性死区）**：
- 变量也会提升，但在声明语句执行前访问会报 ReferenceError
- 这段「提升但不可访问」的区间就叫 TDZ

**使用建议**：默认用 const，需要改才用 let，永远不用 var。

---

### 2. 箭头函数和普通函数的区别？

**参考答案：**

1. **this 指向不同** —— 普通函数的 this 由调用方式决定；箭头函数没有自己的 this，继承外层作用域的 this
2. **不能 new** —— 箭头函数不能当构造函数用
3. **没有 arguments** —— 箭头函数没有 arguments 对象，用 rest 参数 `...args` 代替
4. **没有 prototype** —— 箭头函数没有原型属性
5. **不能作为 Generator** —— 不能用 yield

**什么时候用箭头函数**：回调函数（setTimeout、forEach、Promise.then）
**什么时候不用**：对象方法、构造函数、DOM 事件绑定、prototype 方法

---

### 3. Promise 的原理和状态？

**参考答案：**

Promise 是异步编程的方案，本质是一个代表异步操作最终结果的对象。

**三种状态**：
- pending（进行中）→ 初始状态
- fulfilled（已成功）→ 操作成功
- rejected（已失败）→ 操作失败

**状态变化**：
- 只能从 pending → fulfilled 或 pending → rejected
- 一旦变化就锁定，不会再变

**特点**：
- then/catch/finally 都返回新的 Promise，可以链式调用
- then 的回调是微任务，在当前宏任务后执行
- 错误会沿着链传递，直到被 catch 捕获

---

### 4. async/await 的原理是什么？

**参考答案：**

async/await 是 Generator + Promise 的语法糖。

- `async` 函数返回一个 Promise，函数里 return 的值会包装成 Promise.resolve
- `await` 会暂停函数执行，等 Promise 完成，拿到结果后继续。如果 Promise reject，会抛出异常（可以用 try/catch 捕获）
- 本质上 await 就是「暂停执行 + 自动 .then」

**和 Promise 的关系**：
- async/await 基于 Promise，不是替代
- await 后面跟的一定是 Promise（如果不是，会自动包装成 Promise.resolve）
- 多个独立异步操作要用 `Promise.all` 并发，不能串行 await

---

### 5. 什么是解构赋值？

**参考答案：**

解构赋值是 ES6 的语法，可以从数组或对象中快速提取值，赋给变量。

**数组解构**：按位置取值
```js
const [a, b, c] = [1, 2, 3]
```

**对象解构**：按属性名取值
```js
const { name, age } = { name: '张三', age: 20 }
```

**常用场景**：
- 函数参数解构（传对象参数，不关心顺序）
- 交换变量（`[a, b] = [b, a]`）
- 从 API 响应取数据
- Vue/React 里从 props 解构

---

### 6. 扩展运算符的作用？

**参考答案：**

三个点 `...`，根据上下文有两个作用：

1. **展开**（在赋值右边、函数调用时）—— 把数组/对象展开
   ```js
   Math.max(...[1, 2, 3])  // 3
   const newObj = { ...oldObj, key: 'value' }
   ```

2. **收集**（在函数参数、解构左边）—— 把多个值收集成数组
   ```js
   function sum(...nums) { return nums.reduce((a, b) => a + b, 0) }
   const [first, ...rest] = [1, 2, 3, 4]  // rest = [2, 3, 4]
   ```

---

### 7. Map 和 Object 的区别？

**参考答案：**

| 对比项 | Map | Object |
|--------|-----|--------|
| 键的类型 | 任意（对象、函数都行） | 字符串或 Symbol |
| 键的顺序 | 按插入顺序 | 无序（整数键除外） |
| 大小 | `map.size` | `Object.keys(obj).length` |
| 性能 | 频繁增删更好 | 固定结构更好 |
| 遍历 | 可直接 for...of | 要先 Object.entries() |
| 原型链 | 没有，干净 | 有，可能被覆盖 |

**什么时候用 Map**：键不是字符串、需要频繁增删、需要有序遍历
**什么时候用 Object**：定义数据结构、JSON 序列化、大部分常规场景

---

### 8. Set 是什么？有什么用？

**参考答案：**

Set 是值的集合，特点是不重复、无序。

**常用操作**：
```js
const set = new Set([1, 2, 2, 3])  // Set { 1, 2, 3 }
set.add(4)
set.has(2)  // true
set.delete(2)
set.size  // 3
```

**最常见用途**：数组去重
```js
[...new Set([1, 2, 2, 3])]  // [1, 2, 3]
```

**Set vs 数组**：Set 查找用 `has()`，时间复杂度 O(1)；数组用 `includes()`，时间复杂度 O(n)。只判断存在性、不需要有序的话，Set 更快。

---

### 9. ES6 的 Class 和 ES5 的构造函数有什么区别？

**参考答案：**

Class 本质是 ES5 构造函数 + 原型链的语法糖，但有些区别：

1. **写法不同** —— Class 写法更清晰、更像面向对象语言
2. **必须 new** —— Class 只能 new 调用，构造函数可以直接调用（虽然不规范）
3. **方法不可枚举** —— Class 定义的方法默认不可枚举（for...in 遍历不到），ES5 的要手动设置
4. **没有变量提升** —— Class 不会提升，先定义后使用
5. **私有属性** —— ES2022 加了 `#` 私有属性语法，ES5 只能靠约定
6. **extends 继承** —— 内置继承语法，ES5 要手动改原型链

---

### 10. for...of 和 for...in 的区别？

**参考答案：**

| 对比项 | for...of | for...in |
|--------|----------|----------|
| 遍历什么 | 可迭代对象的值（数组、Map、Set、字符串） | 对象的可枚举属性（包括原型链上的） |
| 适合 | 数组、Map、Set | 对象 |
| 索引 | 直接拿值 | 拿到的是键名（字符串） |
| 原型链 | 不遍历原型链 | 会遍历原型链 |
| Symbol | 不遍历 | 不遍历 |

```js
const arr = [10, 20, 30]

for (const v of arr) { console.log(v) }  // 10, 20, 30（值）
for (const k in arr) { console.log(k) }  // "0", "1", "2"（索引字符串）

const obj = { a: 1, b: 2 }
for (const v of obj) { }  // TypeError（普通对象不可迭代）
for (const k in obj) { console.log(k) }  // "a", "b"（键名）
```

**原则**：遍历数组用 for...of，遍历对象用 for...in（或 Object.entries/Object.keys）。

---

### 11. 什么是 ES6 的模块化？和 CommonJS 有什么区别？

**参考答案：**

ES6 模块化（ES Module）是 JS 官方的模块系统，用 `import` 和 `export`。

**和 CommonJS（require）的区别：**

| 对比项 | ES Module | CommonJS |
|--------|-----------|----------|
| 语法 | import / export | require / module.exports |
| 加载方式 | 编译时确定（静态） | 运行时确定（动态） |
| 是否异步 | 异步加载 | 同步加载 |
| 是否可 Tree Shaking | 可以（静态分析） | 不可以 |
| this | undefined | module.exports |
| 顶层 await | 支持 | 不支持 |

**Tree Shaking**：因为 ES Module 是静态的，打包工具能在编译时分析出哪些导出没被用到，直接删掉。CommonJS 是运行时的，做不到。

---

### 12. reduce 方法怎么用？

**参考答案：**

reduce 是数组最强大的方法，可以把数组「累积」成一个值。

```js
arr.reduce((prev, cur, index, arr) => {
  return newPrev
}, initialValue)
```

**参数**：
- `prev`：上一次回调的返回值（累积值）
- `cur`：当前元素
- `index`：当前索引
- `arr`：原数组
- `initialValue`：初始值

**常见用途**：
```js
// 求和
[1, 2, 3].reduce((sum, n) => sum + n, 0)  // 6

// 求最大值
[1, 5, 3].reduce((max, n) => Math.max(max, n))  // 5

// 数组转对象
[{ id: 1, name: '张三' }, { id: 2, name: '李四' }]
  .reduce((obj, item) => {
    obj[item.id] = item.name
    return obj
  }, {})
// { 1: '张三', 2: '李四' }

// 数组扁平化
[[1, 2], [3, 4]].reduce((flat, arr) => flat.concat(arr), [])  // [1,2,3,4]

// 管道函数
const pipe = fns => data => fns.reduce((acc, fn) => fn(acc), data)
```

---

## 十五、总结

ES6 是现代 JavaScript 的基础，不管你用 Vue、React 还是 Node.js，里面 90% 的语法都来自 ES6+。

**核心知识点速记：**

| 知识点 | 一句话 |
|--------|--------|
| let / const | 块级作用域、不提升、不可重复声明 |
| 箭头函数 | 没有 this、不能 new、适合回调 |
| 解构赋值 | 数组按位置、对象按名字 |
| 模板字符串 | 反引号 + `${}` |
| 默认参数 | `function fn(x = 1)` |
| 扩展运算符 | 右边展开、左边收集 |
| Promise | 异步链式调用、三种状态 |
| async/await | Promise 语法糖、同步写异步 |
| Class | 构造函数语法糖、extends 继承 |
| 模块化 | import/export、静态加载 |
| Map/Set | Map 键可任意、Set 自动去重 |
| 可选链 ?. | 安全访问深层属性 |
| 空值合并 ?? | 只有 null/undefined 才用默认值 |

**学习建议**：这些语法不用死记，在实际项目里写多了自然就会。最核心的几个是 let/const、箭头函数、解构、Promise/async-await——这几个搞懂了，其他的就是看一眼就会的语法糖。
