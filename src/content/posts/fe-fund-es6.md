---
title: "JS进化史：ES6+语法糖一把梭，写完直呼过瘾"
published: 2026-08-29
description: ""
tags: ["前端基础"]
category: "技术总结"
draft: false
lang: "zh-CN"
---

> 💡 **写在前面**：上一篇咱们学了JS基础，写代码的感觉是不是有点"土"？变量用var、拼接字符串用加号、写个回调套三层……别担心，ES6来救场了！ES6就像是JS的"升级大礼包"，一次性加了超多好用的语法，写代码的幸福感直接拉满。看完这篇，你的JS代码会从"能用"变成"优雅"。全文约10000字，建议收藏后慢慢啃！

---

## 📑 目录导航

- [一、ES6是什么？为什么叫"语法糖"？](#一es6是什么为什么叫语法糖)
  - [1.1 一句话理解ES6](#11-一句话理解es6)
  - [1.2 ES6之前的JS有多难用？](#12-es6之前的js有多难用)
  - [1.3 学习路线一览](#13-学习路线一览)
- [二、变量声明：let和const取代var](#二变量声明let和const取代var)
  - [2.1 var的三大罪状](#21-var的三大罪状)
  - [2.2 let和const怎么选？](#22-let和const怎么选)
  - [2.3 什么是块级作用域？](#23-什么是块级作用域)
- [三、箭头函数：不就是简写吗？才不是！](#三箭头函数不就是简写吗才不是)
  - [3.1 箭头函数的几种写法](#31-箭头函数的几种写法)
  - [3.2 箭头函数和普通函数的区别](#32-箭头函数和普通函数的区别)
  - [3.3 什么时候用箭头函数？](#33-什么时候用箭头函数)
- [四、解构赋值：取数据的优雅姿势](#四解构赋值取数据的优雅姿势)
  - [4.1 数组解构](#41-数组解构)
  - [4.2 对象解构](#42-对象解构)
  - [4.3 嵌套解构与默认值](#43-嵌套解构与默认值)
  - [4.4 实战场景一览](#44-实战场景一览)
- [五、模板字符串：告别加号拼接](#五模板字符串告别加号拼接)
- [六、展开运算符：三个点的魔法](#六展开运算符三个点的魔法)
  - [6.1 数组展开](#61-数组展开)
  - [6.2 对象展开](#62-对象展开)
  - [6.3 剩余参数](#63-剩余参数)
- [七、Promise：从回调地狱到天堂](#七promise从回调地狱到天堂)
  - [7.1 什么是回调地狱？](#71-什么是回调地狱)
  - [7.2 Promise基本用法](#72-promise基本用法)
  - [7.3 Promise链式调用](#73-promise链式调用)
  - [7.4 Promise常用方法](#74-promise常用方法)
- [八、async/await：异步编程的终极答案](#八asyncawait异步编程的终极答案)
  - [8.1 基本用法](#81-基本用法)
  - [8.2 错误处理](#82-错误处理)
  - [8.3 并行请求怎么写？](#83-并行请求怎么写)
- [九、其他好用的新特性](#九其他好用的新特性)
  - [9.1 可选链?.和空值合并??](#91-可选链和空值合并)
  - [9.2 Map和Set](#92-map和set)
  - [9.3 模块化import/export](#93-模块化importexport)
  - [9.4 类Class](#94-类class)
- [十、实战项目：用ES6+重构TodoList](#十实战项目用es6重构todolist)
  - [10.1 重构思路](#101-重构思路)
  - [10.2 分步重构](#102-分步重构)
  - [10.3 完整代码](#103-完整代码)
- [十一、新手必避的10个坑 ⚠️](#十一新手必避的10个坑-️)
- [十二、面试八股精选](#十二面试八股精选)
- [十三、总结与后续学习建议](#十三总结与后续学习建议)

---

## 一、ES6是什么？为什么叫"语法糖"？

### 1.1 一句话理解ES6

**ES6就是JavaScript的一次大升级，加了超多好用的新语法，让你写代码又快又爽。**

先解释一下名字：
- **ES** = ECMAScript，是JS的官方标准名
- **6** = 第6版，2015年发布的，所以也叫 ES2015

为啥叫"语法糖"？因为这些新特性**不增加新功能，只是让写法更简洁、更舒服**——就像糖一样，吃着甜，但不是必需品。不过嘛，用过之后就回不去了……

💡 **冷知识**：现在说的"ES6"其实是个泛指，ES2016、ES2017、ES2020……这些新版本的语法大家也统称为"ES6+"或者"现代JS语法"。反正就是比老JS好用的都算。

### 1.2 ES6之前的JS有多难用？

来，感受一下"史前时代"的JS有多痛苦：

| 场景 | ES5老写法 | ES6新写法 |
|------|----------|----------|
| 声明变量 | `var a = 1`（各种坑） | `let a = 1` / `const a = 1` |
| 拼接字符串 | `'你好，' + name + '！'` | `` `你好，${name}！` `` |
| 函数简写 | `function(a, b) { return a + b }` | `(a, b) => a + b` |
| 取对象属性 | `var name = obj.name` <br> `var age = obj.age` | `const { name, age } = obj` |
| 数组合并 | `arr1.concat(arr2)` | `[...arr1, ...arr2]` |
| 异步回调 | 三层嵌套（回调地狱） | `async/await` 像写同步一样 |
| 继承 | 原型链，绕半天 | `class` + `extends` |

是不是光看着就觉得累？ES6一次性解决了这些痛点，所以说**不学ES6，你写的JS就还停留在2015年以前**。

🤖 **AI小助手**：如果你刚接触ES6，可以这么问AI："把这段ES5代码改写成ES6+的现代写法，并解释每一处改动的好处"——对照着学，进步飞快！

### 1.3 学习路线一览

ES6+内容不少，给你排个优先级，按这个顺序学：

```
必学（天天用）：
  ├─ let / const
  ├─ 箭头函数
  ├─ 解构赋值
  ├─ 模板字符串
  ├─ 展开运算符
  ├─ Promise / async-await
  └─ 模块化 import/export

选学（按需用）：
  ├─ Map / Set
  ├─ Class
  ├─ 可选链 / 空值合并
  └─ Symbol / BigInt / Proxy / Reflect
```

---

## 二、变量声明：let和const取代var

### 2.1 var的三大罪状

以前声明变量只能用 `var`，这玩意儿坑可多了，随便列三个你感受下：

#### 罪状1：变量提升（声明提前）

```javascript
console.log(a)  // undefined（不报错，但也不对）
var a = 10
```

`var` 声明的变量会被"提升"到作用域顶部，所以还没声明就能用——但值是 `undefined`。这就像你还没出生，名字就已经被登记了，但人还没到。

这种设计会导致很多莫名其妙的bug，而且很难排查。

#### 罪状2：没有块级作用域

```javascript
if (true) {
  var b = 20
}
console.log(b)  // 20（居然能访问到！）
```

`var` 声明的变量不受 `{}` 的限制，直接泄漏到外面了。你在if里声明的变量，外面也能用——这就很容易变量污染。

#### 罪状3：可以重复声明

```javascript
var c = 1
var c = 2  // 不报错，直接覆盖
console.log(c)  // 2
```

不小心变量重名了也不提醒你，悄悄就给覆盖了。项目大了之后，找bug找到头秃。

### 2.2 let和const怎么选？

ES6出了两个新的声明变量的关键字：`let` 和 `const`，完美解决了var的所有问题。

**let：可变的变量**

```javascript
let a = 10
a = 20  // 可以改
```

**const：常量，不能改**

```javascript
const PI = 3.14
PI = 3.14159  // 报错！Assignment to constant variable
```

⚠️ **注意**：const声明的对象，属性是可以改的！const只是保证变量指向的地址不变：

```javascript
const obj = { name: '小明' }
obj.name = '小红'  // 可以改，obj还是那个obj
console.log(obj.name)  // '小红'

obj = { name: '小刚' }  // 不行，改了指向就报错
```

👉 **最佳实践**：**默认用const，确定要改的再用let**。

为什么？因为大多数变量声明了之后其实不会改，用const能防止不小心被修改。统计一下你自己的代码，看看let用得多还是const用得多——成熟的开发者代码里80%都是const。

### 2.3 什么是块级作用域？

let和const都有**块级作用域**——在 `{}` 里声明的，外面访问不到：

```javascript
if (true) {
  let a = 10
  const b = 20
}
console.log(a)  // 报错！a is not defined
console.log(b)  // 报错！b is not defined
```

除了if，for、while、函数，甚至单独一个 `{}` 都是块级作用域：

```javascript
{
  let msg = 'hello'
  console.log(msg)  // 'hello'
}
console.log(msg)  // 报错
```

最经典的例子就是for循环：

```javascript
// 用var的话，i会泄漏到全局，最后都是5
for (var i = 0; i < 5; i++) {
  setTimeout(() => {
    console.log(i)  // 全是5！
  }, 1000)
}

// 用let就没问题，每次循环都是独立的i
for (let i = 0; i < 5; i++) {
  setTimeout(() => {
    console.log(i)  // 0, 1, 2, 3, 4
  }, 1000)
}
```

---

## 三、箭头函数：不就是简写吗？才不是！

### 3.1 箭头函数的几种写法

箭头函数是ES6最常用的特性之一，写起来特别简洁：

```javascript
// 普通函数
function add(a, b) {
  return a + b
}

// 箭头函数（等价写法）
const add = (a, b) => {
  return a + b
}
```

如果函数体只有一行，可以省略大括号和return：

```javascript
const add = (a, b) => a + b
```

如果只有一个参数，可以省略括号：

```javascript
// 完整写法
const double = (n) => {
  return n * 2
}

// 简写
const double = n => n * 2
```

如果没有参数，就写个空括号：

```javascript
const sayHi = () => console.log('你好！')
```

如果要返回一个对象，得加个括号，不然大括号会被当成函数体：

```javascript
// 错误写法（大括号被当成语句块了）
const getUser = () => { name: '小明', age: 18 }

// 正确写法（加括号包裹对象）
const getUser = () => ({ name: '小明', age: 18 })
```

### 3.2 箭头函数和普通函数的区别

很多人以为箭头函数就是简写，那就大错特错了！它和普通函数有本质区别：

| 区别 | 普通函数 | 箭头函数 |
|------|---------|---------|
| 写法 | function关键字 | 箭头 `=>` |
| this指向 | 调用时决定（谁调用指向谁） | 继承外层的this（定义时就定了） |
| arguments | 有 | 没有 |
| 能不能当构造函数 | 能（new） | 不能 |
| 有没有原型prototype | 有 | 没有 |

**最关键的区别是this！** 来个栗子：

```javascript
const obj = {
  name: '小明',
  sayHi: function() {
    console.log('你好，我是' + this.name)  // this指向obj
  },
  sayHiArrow: () => {
    console.log('你好，我是' + this.name)  // this指向全局（window），不是obj！
  }
}

obj.sayHi()       // '你好，我是小明'
obj.sayHiArrow()  // '你好，我是undefined'
```

为啥会这样？因为**箭头函数没有自己的this**，它的this是从外层作用域"继承"来的。对象不构成作用域，所以箭头函数的this就跑到全局去了。

但在有些场景下，这反而是优点——比如回调函数里：

```javascript
// 老写法：得存一下this
const obj = {
  name: '小明',
  delayedSay: function() {
    const _this = this  // 把this存起来
    setTimeout(function() {
      console.log(_this.name)  // 用存起来的_this
    }, 1000)
  }
}

// 箭头函数写法：直接用，不用存this
const obj = {
  name: '小明',
  delayedSay: function() {
    setTimeout(() => {
      console.log(this.name)  // 箭头函数的this继承自外层，就是obj
    }, 1000)
  }
}
```

是不是方便多了？以前写回调经常要 `const _this = this` 或者 `.bind(this)`，有了箭头函数就不用了。

### 3.3 什么时候用箭头函数？

**✅ 推荐用的场景：**
- 回调函数（数组的map、filter、forEach等）
- setTimeout、setInterval里的函数
- 函数式编程的场景
- 简短的工具函数

**❌ 不推荐用的场景：**
- 对象的方法（this不对）
- 构造函数（不能new）
- 需要arguments的场景
- 需要动态this的场景（比如事件处理函数）

👉 **经验之谈**：大部分时候都能用箭头函数，写起来简洁。但如果你发现this不对，先看看是不是用了箭头函数。

---

## 四、解构赋值：取数据的优雅姿势

### 4.1 数组解构

以前取数组里的元素，得一个个来：

```javascript
const arr = ['小明', 18, '男']

const name = arr[0]
const age = arr[1]
const gender = arr[2]
```

有了解构赋值，一行搞定：

```javascript
const [name, age, gender] = ['小明', 18, '男']

console.log(name)    // '小明'
console.log(age)     // 18
console.log(gender)  // '男'
```

就像"拆快递"一样，把数组里的东西一个个拿出来，按顺序对应。

还可以跳过某些元素：

```javascript
const [, age] = ['小明', 18, '男']  // 第一个不要
console.log(age)  // 18
```

### 4.2 对象解构

对象解构更常用，按属性名来对应：

```javascript
const person = {
  name: '小明',
  age: 18,
  gender: '男'
}

// 老写法
const name = person.name
const age = person.age

// 解构写法
const { name, age } = person

console.log(name)  // '小明'
console.log(age)   // 18
```

注意：对象解构是**按名字匹配**的，顺序不重要：

```javascript
const { age, name } = person  // 换顺序也没问题
```

还可以改名字（起别名）：

```javascript
const { name: myName, age: myAge } = person
console.log(myName)  // '小明'
console.log(name)    // 报错！name不存在，因为改名成myName了
```

### 4.3 嵌套解构与默认值

#### （1）默认值

解构的时候可以设默认值，取不到就用默认的：

```javascript
const [a = 0, b = 0] = [1]
console.log(a)  // 1
console.log(b)  // 0（没取到，用默认值）

const { name, age = 18 } = { name: '小明' }
console.log(age)  // 18（没取到，用默认值）
```

⚠️ 注意：只有值是 `undefined` 的时候才会用默认值，`null` 不会：

```javascript
const { name = '默认' } = { name: null }
console.log(name)  // null（不是undefined，所以不用默认值）
```

#### （2）嵌套解构

对象套对象也能解构：

```javascript
const person = {
  name: '小明',
  age: 18,
  address: {
    city: '上海',
    district: '浦东新区'
  }
}

// 嵌套解构
const { name, address: { city, district } } = person

console.log(name)      // '小明'
console.log(city)      // '上海'
console.log(district)  // '浦东新区'
```

### 4.4 实战场景一览

解构赋值在实际开发中用得特别多，举几个常见的：

#### 场景1：函数参数

```javascript
// 老写法
function printUser(user) {
  console.log(user.name)
  console.log(user.age)
}

// 解构写法（直接在参数里解构）
function printUser({ name, age }) {
  console.log(name)
  console.log(age)
}

printUser({ name: '小明', age: 18 })
```

#### 场景2：交换变量

```javascript
let a = 1
let b = 2

// 老写法：得用临时变量
let temp = a
a = b
b = temp

// 解构写法：一行搞定
[a, b] = [b, a]
```

#### 场景3：函数返回多个值

```javascript
function getUser() {
  return ['小明', 18, '男']
}

const [name, age, gender] = getUser()
```

#### 场景4：导入模块

```javascript
// 只导入需要的方法
import { ref, reactive, computed } from 'vue'
```

---

## 五、模板字符串：告别加号拼接

以前拼接字符串老痛苦了，全是加号，看着眼晕：

```javascript
const name = '小明'
const age = 18

// 老写法
const str = '大家好，我叫' + name + '，今年' + age + '岁。'

// 换行更痛苦
const html = '<div>' +
             '  <h1>' + name + '</h1>' +
             '  <p>年龄：' + age + '</p>' +
             '</div>'
```

有了模板字符串（反引号 `` ` ``），世界都美好了：

```javascript
const name = '小明'
const age = 18

// 普通拼接
const str = `大家好，我叫${name}，今年${age}岁。`

// 直接换行，不用加号
const html = `
  <div>
    <h1>${name}</h1>
    <p>年龄：${age}</p>
  </div>
`
```

`${}` 里面可以放任何JS表达式：

```javascript
const a = 1
const b = 2

// 可以放运算
console.log(`${a} + ${b} = ${a + b}`)  // '1 + 2 = 3'

// 可以放函数调用
function toUpper(str) {
  return str.toUpperCase()
}
console.log(`大写：${toUpper('hello')}`)  // '大写：HELLO'

// 可以放三元运算符
const age = 18
console.log(`你是${age >= 18 ? '成年人' : '未成年人'}`)
```

🤖 **AI小助手**：写了一大串加号拼接的老代码？直接扔给AI："把这段字符串拼接改写成模板字符串"——一秒钟帮你改完，省得你一个个加号去删。

---

## 六、展开运算符：三个点的魔法

三个点 `...` 就是展开运算符，功能强大，用了就回不去。

### 6.1 数组展开

把数组的元素"展开"成一个个单独的值：

```javascript
const arr1 = [1, 2, 3]
const arr2 = [4, 5, 6]

// 合并数组（比concat好用多了）
const arr3 = [...arr1, ...arr2]
console.log(arr3)  // [1, 2, 3, 4, 5, 6]

// 中间还能加东西
const arr4 = [0, ...arr1, 4]
console.log(arr4)  // [0, 1, 2, 3, 4]

// 复制数组（浅拷贝）
const arr5 = [...arr1]
console.log(arr5)  // [1, 2, 3]
```

### 6.2 对象展开

对象也能展开，用来复制和合并对象特别方便：

```javascript
const obj1 = { a: 1, b: 2 }
const obj2 = { c: 3, d: 4 }

// 合并对象
const obj3 = { ...obj1, ...obj2 }
console.log(obj3)  // { a:1, b:2, c:3, d:4 }

// 复制对象（浅拷贝）
const obj4 = { ...obj1 }
console.log(obj4)  // { a:1, b:2 }

// 复制并修改属性（后面的会覆盖前面的）
const obj5 = { ...obj1, b: 20 }
console.log(obj5)  // { a:1, b:20 }
```

💡 **实战场景**：更新state的时候特别常用，比如Vue或React里：

```javascript
// 修改用户信息，其他属性保留
setUser({
  ...user,
  name: '新名字',
  age: 20
})
```

### 6.3 剩余参数

三个点放在函数参数里，叫"剩余参数"，把剩下的参数收集成一个数组：

```javascript
function sum(...args) {
  console.log(args)  // [1, 2, 3, 4, 5]
  return args.reduce((total, n) => total + n, 0)
}

sum(1, 2, 3, 4, 5)  // 15
```

以前得用 `arguments`，那是个伪数组，用起来不方便。剩余参数是真数组，可以直接用数组方法。

还可以和解构配合用：

```javascript
const [first, ...rest] = [1, 2, 3, 4, 5]
console.log(first)  // 1
console.log(rest)   // [2, 3, 4, 5]
```

⚠️ **注意**：剩余参数必须放在最后，不能放在中间或前面。

---

## 七、Promise：从回调地狱到天堂

### 7.1 什么是回调地狱？

在Promise出来之前，写异步代码全靠回调函数。如果多个异步操作有先后顺序，就会一层套一层：

```javascript
// 先获取用户信息，再获取用户的文章，再获取文章的评论……
getUser(userId, function(user) {
  getArticles(user.id, function(articles) {
    getComments(articles[0].id, function(comments) {
      getLikes(comments[0].id, function(likes) {
        // 继续套……
        console.log(likes)
      })
    })
  })
})
```

看到了吗？一层套一层，越套越深，这就是**回调地狱**（Callback Hell），也叫"厄运金字塔"。代码可读性差，维护起来想死。

Promise就是来解决这个问题的。

### 7.2 Promise基本用法

Promise是一个**承诺**——承诺过一会儿给你结果。它有三种状态：

- `pending`：进行中
- `fulfilled`：成功了
- `rejected`：失败了

状态只能从 pending 变成 fulfilled 或者 rejected，变了之后就不会再改了。

**创建一个Promise：**

```javascript
const promise = new Promise((resolve, reject) => {
  // 做一些异步操作
  setTimeout(() => {
    const success = true
    if (success) {
      resolve('成功了！')  // 成功了，调用resolve，状态变成fulfilled
    } else {
      reject('失败了！')   // 失败了，调用reject，状态变成rejected
    }
  }, 1000)
})
```

**使用Promise：**

```javascript
promise
  .then(result => {
    console.log(result)  // '成功了！' （resolve的时候触发）
  })
  .catch(error => {
    console.log(error)   // '失败了！' （reject的时候触发）
  })
  .finally(() => {
    console.log('不管成功失败都会执行')
  })
```

### 7.3 Promise链式调用

Promise的厉害之处在于 `.then()` 可以链式调用，解决了回调地狱：

```javascript
// 用Promise重写上面的例子
getUser(userId)
  .then(user => {
    return getArticles(user.id)  // 返回一个新的Promise
  })
  .then(articles => {
    return getComments(articles[0].id)
  })
  .then(comments => {
    return getLikes(comments[0].id)
  })
  .then(likes => {
    console.log(likes)
  })
  .catch(error => {
    // 任何一步出错都会到这里
    console.log('出错了：', error)
  })
```

是不是清爽多了？从横向发展变成了纵向发展，逻辑清晰。

### 7.4 Promise常用方法

| 方法 | 作用 | 场景 |
|------|------|------|
| `Promise.resolve()` | 生成一个成功的Promise | 包装一个值为Promise |
| `Promise.reject()` | 生成一个失败的Promise | 手动抛出错误 |
| `Promise.all()` | 等待所有Promise都成功 | 并行请求多个接口 |
| `Promise.race()` | 谁先完成就用谁的结果 | 超时控制 |
| `Promise.allSettled()` | 等待所有Promise都完成（不管成败） | 批量请求，不关心失败 |

#### Promise.all（最常用）

多个请求并行，等所有的都回来了再一起处理：

```javascript
// 同时获取用户信息和文章列表
Promise.all([
  getUser(userId),
  getArticles(userId)
]).then(([user, articles]) => {
  console.log('用户：', user)
  console.log('文章：', articles)
}).catch(error => {
  // 有一个失败就全部失败
  console.log('出错了：', error)
})
```

特点：**全成才成，一个失败就全失败**。

#### Promise.allSettled

跟all类似，但不关心失败，所有请求完成了就返回（每个结果带状态）：

```javascript
Promise.allSettled([
  getUser(userId),
  getArticles(userId)
]).then(results => {
  console.log(results)
  // [
  //   { status: 'fulfilled', value: {...} },
  //   { status: 'rejected', reason: '...' }
  // ]
})
```

---

## 八、async/await：异步编程的终极答案

### 8.1 基本用法

Promise已经不错了，但还是有一堆 `.then()`，看着也累。ES2017出了 `async/await`，让异步代码写起来跟同步代码一样！

用法很简单：
- 在函数前面加 `async` 关键字
- 在异步操作前面加 `await`

```javascript
// 用async/await重写之前的例子
async function getData() {
  const user = await getUser(userId)
  const articles = await getArticles(user.id)
  const comments = await getComments(articles[0].id)
  const likes = await getLikes(comments[0].id)
  console.log(likes)
}

getData()
```

是不是跟写同步代码一模一样？没有回调，没有.then，就是按顺序一行一行写——但它确实是异步的，不会阻塞。

💡 **原理**：async/await 其实是Promise的"语法糖"，底层还是Promise。只是让写法更简洁了。

### 8.2 错误处理

async/await怎么处理错误？用 try/catch：

```javascript
async function getData() {
  try {
    const user = await getUser(userId)
    const articles = await getArticles(user.id)
    console.log(articles)
  } catch (error) {
    console.log('出错了：', error)
  }
}
```

任何一个await出错，都会跳到catch里。这跟Promise的.catch是一样的。

如果有多个请求，想分别处理错误，可以每个都单独try/catch：

```javascript
async function getData() {
  let user
  try {
    user = await getUser(userId)
  } catch (error) {
    console.log('获取用户失败：', error)
    return
  }
  
  let articles
  try {
    articles = await getArticles(user.id)
  } catch (error) {
    console.log('获取文章失败：', error)
  }
}
```

### 8.3 并行请求怎么写？

上面的写法是**串行**的——等一个请求回来再发下一个。如果两个请求没有依赖关系，可以并行发，更快！

```javascript
async function getData() {
  // 串行（一个一个来，慢）
  // const user = await getUser(userId)
  // const articles = await getArticles(userId)
  
  // 并行（同时发，快）
  const [user, articles] = await Promise.all([
    getUser(userId),
    getArticles(userId)
  ])
  
  console.log(user, articles)
}
```

配合 `Promise.all` 使用，多个请求同时发，等所有的都回来了再继续。

🤖 **AI小助手**：刚学async/await容易搞混串行和并行？可以这么问AI："帮我看看这段代码里哪些请求是串行的，哪些可以改成并行，并给出优化后的代码"——AI还能帮你分析性能瓶颈。

---

## 九、其他好用的新特性

ES6+好用的东西太多了，再挑几个高频的说一下。

### 9.1 可选链?.和空值合并??

这俩是ES2020出的，用过都说香，写代码再也不用层层判断了。

#### 可选链 `?.`

访问深层嵌套的属性时，不用担心中间某层不存在会报错：

```javascript
const user = {
  name: '小明',
  // address: {
  //   city: '上海'
  // }
}

// 老写法：得层层判断，不然报错
// const city = user.address && user.address.city

// 可选链写法：中间任何一层是undefined/null，直接返回undefined
const city = user.address?.city
console.log(city)  // undefined（不报错！）
```

还能用在数组和函数上：

```javascript
// 数组可能不存在
const firstItem = arr?.[0]

// 函数可能不存在
obj.someMethod?.()
```

#### 空值合并 `??`

给默认值用的，跟 `||` 类似，但更严谨：

```javascript
const a = 0

// || 的问题：0、''、false都会被当成假值，用默认值
console.log(a || 100)  // 100（0被当成假的了）

// ?? 只有 null 和 undefined 才用默认值
console.log(a ?? 100)  // 0（0是有效值，不用默认值）
```

两者经常配合使用：

```javascript
const city = user.address?.city ?? '未知'
console.log(city)  // 如果有城市就显示，没有就显示'未知'
```

### 9.2 Map和Set

#### Set：集合（元素不重复）

最常用的场景：数组去重

```javascript
const arr = [1, 2, 2, 3, 3, 3, 4, 5]

// 数组转Set，自动去重
const set = new Set(arr)

// Set转回数组
const newArr = [...set]
console.log(newArr)  // [1, 2, 3, 4, 5]
```

Set常用方法：

```javascript
const set = new Set()

set.add(1)       // 添加
set.delete(1)    // 删除
set.has(1)       // 有没有（返回true/false）
set.size         // 大小（元素个数）
set.clear()      // 清空
```

#### Map：字典（键值对）

跟对象类似，但键可以是任意类型（对象的键只能是字符串或Symbol）：

```javascript
const map = new Map()

const objKey = { id: 1 }
map.set(objKey, '这是值')  // 键可以是对象！

console.log(map.get(objKey))  // '这是值'
```

Map常用方法：

```javascript
map.set(key, value)  // 设置
map.get(key)         // 获取
map.has(key)         // 有没有
map.delete(key)      // 删除
map.size             // 大小
map.clear()          // 清空

// 遍历
map.forEach((value, key) => {
  console.log(key, value)
})
```

### 9.3 模块化import/export

ES6之前JS没有原生的模块系统，只能靠各种第三方规范（CommonJS、AMD）。ES6终于有了官方的模块化语法。

**导出（export）：**

```javascript
// 方式1：导出单个
export const name = '小明'
export function sayHi() {
  console.log('你好')
}

// 方式2：统一导出
const name = '小明'
function sayHi() {
  console.log('你好')
}
export { name, sayHi }

// 默认导出（一个模块只能有一个）
export default function() {
  console.log('我是默认导出的')
}
```

**导入（import）：**

```javascript
// 命名导入（名字要对应）
import { name, sayHi } from './utils.js'

// 改名导入
import { name as myName } from './utils.js'

// 全部导入
import * as utils from './utils.js'
console.log(utils.name)

// 默认导入（名字随便起）
import whatever from './utils.js'
```

模块化的好处：
1. **代码拆分**：每个文件一个模块，结构清晰
2. **按需加载**：用什么导什么
3. **避免全局污染**：每个模块有自己的作用域
4. **方便维护**：改一个模块不影响其他的

### 9.4 类Class

ES6给JS加了 `class` 语法，写面向对象代码再也不用绕原型链了：

```javascript
// 老写法（原型链，绕半天）
function Person(name, age) {
  this.name = name
  this.age = age
}
Person.prototype.sayHi = function() {
  console.log('我叫' + this.name)
}

// ES6 class写法（清爽多了）
class Person {
  constructor(name, age) {
    this.name = name
    this.age = age
  }
  
  sayHi() {
    console.log('我叫' + this.name)
  }
}

// 使用方式一样
const xiaoming = new Person('小明', 18)
xiaoming.sayHi()
```

继承也很简单，用 `extends`：

```javascript
class Student extends Person {
  constructor(name, age, grade) {
    super(name, age)  // 调用父类的constructor
    this.grade = grade
  }
  
  study() {
    console.log(this.name + '在学习')
  }
}
```

💡 **注意**：class本质上还是原型链的语法糖，底层原理没变，只是写法更优雅了。

---

## 十、实战项目：用ES6+重构TodoList

学了这么多新语法，咱们来把上一篇写的TodoList用ES6+重构一遍，感受一下现代JS的魅力。

### 10.1 重构思路

| 优化点 | 老写法 | 新写法 |
|--------|--------|--------|
| 变量声明 | var / let混用 | 全用const（需要改的才用let） |
| 函数 | function | 箭头函数 |
| 字符串拼接 | 加号 | 模板字符串 |
| 数组操作 | for循环 | map/filter/forEach |
| 对象操作 | 一个个赋值 | 展开运算符 |
| 模块化 | 全写在一个文件里 | 拆分模块 |

### 10.2 分步重构

#### 第一步：变量声明全部换成const/let

```javascript
// 老写法
var todoInput = document.querySelector('#todoInput')
var todos = []

// 新写法
const todoInput = document.querySelector('#todoInput')
let todos = []  // 数组本身会变，用let
```

#### 第二步：函数改箭头函数

```javascript
// 老写法
function addTodo() {
  // ...
}

// 新写法
const addTodo = () => {
  // ...
}
```

#### 第三步：字符串拼接改模板字符串

```javascript
// 老写法
li.innerHTML = 
  '<input type="checkbox" ' + (todo.done ? 'checked' : '') + '>' +
  '<span class="todo-text">' + todo.text + '</span>' +
  '<button class="delete-btn">删除</button>'

// 新写法
li.innerHTML = `
  <input type="checkbox" ${todo.done ? 'checked' : ''}>
  <span class="todo-text">${todo.text}</span>
  <button class="delete-btn">删除</button>
`
```

#### 第四步：用数组方法代替手动循环

```javascript
// 老写法
var doneCount = 0
for (var i = 0; i < todos.length; i++) {
  if (todos[i].done) {
    doneCount++
  }
}

// 新写法
const doneCount = todos.filter(t => t.done).length
```

#### 第五步：模块化拆分

把代码拆成几个模块：

```
src/
  ├─ main.js       // 入口文件
  ├─ store.js      // 数据管理
  ├─ dom.js        // DOM操作
  └─ events.js     // 事件绑定
```

**store.js：数据管理**

```javascript
// 数据
let todos = JSON.parse(localStorage.getItem('todos') || '[]')

// 保存到本地存储
const save = () => {
  localStorage.setItem('todos', JSON.stringify(todos))
}

// 添加
export const addTodo = (text) => {
  todos.push({
    id: Date.now(),
    text,
    done: false
  })
  save()
}

// 切换完成状态
export const toggleTodo = (id) => {
  const todo = todos.find(t => t.id === id)
  if (todo) todo.done = !todo.done
  save()
}

// 删除
export const deleteTodo = (id) => {
  todos = todos.filter(t => t.id !== id)
  save()
}

// 清除已完成
export const clearDone = () => {
  todos = todos.filter(t => !t.done)
  save()
}

// 获取列表
export const getTodos = () => [...todos]
```

**dom.js：渲染相关**

```javascript
import { getTodos } from './store.js'

const todoList = document.querySelector('#todoList')
const todoCount = document.querySelector('#todoCount')

// 渲染列表
export const render = () => {
  const todos = getTodos()
  
  todoList.innerHTML = todos.length === 0
    ? '<li class="empty-tip">暂无待办事项，添加一个吧~</li>'
    : todos.map(todo => `
        <li class="todo-item ${todo.done ? 'done' : ''}" data-id="${todo.id}">
          <input type="checkbox" ${todo.done ? 'checked' : ''}>
          <span class="todo-text">${todo.text}</span>
          <button class="delete-btn">删除</button>
        </li>
      `).join('')
  
  const doneCount = todos.filter(t => t.done).length
  todoCount.textContent = `共 ${todos.length} 条，已完成 ${doneCount} 条`
}
```

**events.js：事件绑定**

```javascript
import { addTodo, toggleTodo, deleteTodo, clearDone } from './store.js'
import { render } from './dom.js'

const todoInput = document.querySelector('#todoInput')
const addBtn = document.querySelector('#addBtn')
const todoList = document.querySelector('#todoList')
const clearBtn = document.querySelector('#clearBtn')

// 添加
const handleAdd = () => {
  const text = todoInput.value.trim()
  if (!text) {
    alert('请输入待办内容！')
    return
  }
  addTodo(text)
  todoInput.value = ''
  render()
}

// 列表点击（事件委托）
const handleListClick = (e) => {
  const li = e.target.closest('.todo-item')
  if (!li) return
  
  const id = Number(li.dataset.id)
  
  if (e.target.type === 'checkbox') {
    toggleTodo(id)
    render()
  }
  
  if (e.target.classList.contains('delete-btn')) {
    deleteTodo(id)
    render()
  }
}

// 绑定事件
export const bindEvents = () => {
  addBtn.addEventListener('click', handleAdd)
  
  todoInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAdd()
  })
  
  todoList.addEventListener('click', handleListClick)
  clearBtn.addEventListener('click', () => { clearDone(); render() })
}
```

**main.js：入口**

```javascript
import { render } from './dom.js'
import { bindEvents } from './events.js'

// 初始化
render()
bindEvents()
```

### 10.3 完整代码

重构完之后，代码量可能差不多，但**可读性、可维护性、模块化程度**都上了一个大台阶。这就是ES6+的价值——不是为了炫技，而是为了写出更好维护的代码。

👉 **动手试试**：把你之前写的TodoList拿出来，按照上面的思路重构一遍。重构完你就会发现，现代JS写起来真的很爽。

🤖 **AI小助手**：重构老代码是AI最擅长的事情之一。把你的老代码扔给AI，加上一句"用ES6+的现代语法重构这段代码，要求：1. 全部用const/let 2. 箭头函数 3. 模板字符串 4. 数组方法 5. 模块化拆分"——几秒钟就能给你一版重构后的代码，你再审查修改就行。

---

## 十一、新手必避的10个坑 ⚠️

### 坑1：const声明的对象属性还能改
**现象**：用const声明了对象，改属性居然不报错
**原因**：const保证的是变量指向的内存地址不变，对象的属性是可以改的
**解决**：如果要完全冻结对象，用 `Object.freeze(obj)`（浅冻结）

### 坑2：箭头函数的this不对
**现象**：对象方法用箭头函数写，this变成了window/undefined
**原因**：箭头函数没有自己的this，继承外层的
**解决**：对象方法用普通函数，或者用类的方法写法

### 坑3：解构的时候重命名搞错了
**现象**：解构并重命名后，用原来的名字访问报错
**原因**：`const { name: myName } = obj` 是把name改名叫myName，不是两个都有
**解决**：记住语法：`原名: 新名`，冒号后面才是你能用的变量名

### 坑4：展开运算符是浅拷贝
**现象**：拷贝了对象，修改嵌套的属性还是会影响原对象
**原因**：展开运算符只拷贝第一层，深层的还是引用关系
**解决**：简单对象用展开就行；深层嵌套的用 `JSON.parse(JSON.stringify(obj))` 或 lodash 的 `cloneDeep`

### 坑5：Promise.all一个失败全失败
**现象**：用Promise.all发了5个请求，有1个失败，其他4个成功的结果也拿不到
**原因**：Promise.all的特性就是"全成才成，一败全败"
**解决**：如果允许部分失败，用 `Promise.allSettled()`

### 坑6：async函数里没有await
**现象**：async函数里没写await，代码跟普通函数一样
**原因**：async只是把函数返回值包装成Promise，里面的代码还是同步执行的
**解决**：真正的异步操作前要加await，不然async就白加了

### 坑7：await只能在async函数里用
**现象**：在顶层直接写await，报错"await is only valid in async function"
**原因**：早期await只能在async函数内使用
**解决**：可以用"立即执行函数"包裹，或者用ES2022的顶层await（需要模块环境）

```javascript
// 方式1：立即执行函数
;(async () => {
  const data = await fetchData()
  console.log(data)
})()
```

### 坑8：可选链用太多
**现象**：代码里全是 `?.`，属性不存在也不报错，出了问题很难找
**原因**：可选链把错误"吞"掉了，静默返回undefined
**解决**：合理使用可选链，该报错的地方还是要报错，不然bug藏得更深

### 坑9：Set去重只对基本类型有用
**现象**：对象数组用Set去重，发现没效果
**原因**：Set是按引用比较的，两个对象内容一样但地址不一样，就不算重复
**解决**：对象数组去重要手动处理，比如用Map按id去重

### 坑10：模块化路径写错
**现象**：import的时候路径不对，报错找不到模块
**原因**：相对路径没搞清楚，或者忘了加后缀
**解决**：
- 相对路径：`./` 是当前目录，`../` 是上一级
- 导入JS文件可以省略后缀（看配置），但导入其他文件不行
- 找不到的时候先打印一下路径对不对

---

## 十二、面试八股精选

面试的时候ES6相关的问题特别多，挑几个高频的给你：

### 1. var、let、const的区别？
**参考答案**：
- var是ES5的，let/const是ES6的
- var有变量提升，let/const有暂时性死区
- var没有块级作用域，let/const有
- var可以重复声明，let/const不行
- const声明的变量不能重新赋值，但对象属性可以改

### 2. 箭头函数和普通函数的区别？
**参考答案**：
- 写法更简洁
- 没有自己的this，继承外层的this
- 没有arguments对象
- 不能作为构造函数（不能new）
- 没有prototype原型

### 3. Promise有几种状态？怎么切换？
**参考答案**：
- 三种状态：pending（进行中）、fulfilled（成功）、rejected（失败）
- 只能从pending变成fulfilled或者rejected，不可逆
- 成功调用resolve，失败调用reject

### 4. Promise.all和Promise.race的区别？
**参考答案**：
- all：等待所有Promise都成功，返回结果数组；一个失败就整体失败
- race：谁先完成就用谁的结果，不管成功失败
- 补充：allSettled等待所有都完成（不管成败），返回每个的状态和结果

### 5. async/await和Promise的关系？
**参考答案**：
- async/await是Promise的语法糖，底层还是Promise
- async函数返回值是一个Promise
- await后面跟一个Promise，会暂停执行直到Promise完成
- 错误用try/catch捕获，相当于Promise的.catch

### 6. 什么是解构赋值？常用场景有哪些？
**参考答案**：
- 解构赋值是一种快速从数组或对象中提取值并赋值给变量的语法
- 常用场景：函数参数解构、交换变量、函数返回多个值、导入模块、提取嵌套属性

---

## 十三、总结与后续学习建议

### 13.1 本篇要点回顾

回顾一下这篇的核心内容：

**必学语法（天天用）：**
1. **let/const**：取代var，默认用const
2. **箭头函数**：简洁，this继承外层，回调函数首选
3. **解构赋值**：快速从数组/对象中取值
4. **模板字符串**：反引号+${}，告别加号拼接
5. **展开运算符**：三个点，数组/对象合并复制神器
6. **Promise**：异步编程解决方案，链式调用
7. **async/await**：Promise的语法糖，异步写得像同步
8. **模块化**：import/export，工程化必备

**好用的加分项：**
9. **可选链+空值合并**：`?.` 和 `??`，安全访问深层属性
10. **Map/Set**：新的数据结构，各有用途
11. **Class**：面向对象的糖，写继承更方便

### 13.2 学习心得

ES6+的东西说多不多，说少不少。我的建议是：

1. **先学高频的**：let/const、箭头函数、解构、模板字符串、展开运算符、async/await、模块化——这几个天天用，必须熟练
2. **边用边学**：不用专门花一周时间背，写代码的时候刻意用新语法，用几次就会了
3. **老代码重构**：把你之前写的老项目用ES6+重构一遍，进步最快
4. **不用追求全都会**：有些特性可能一辈子都用不上，需要的时候再查就行

🤖 **AI时代怎么学**：
- 不建议死记硬背所有API，AI记得比你牢
- 重点是**理解原理和思想**，知道"有这个东西"、"能解决什么问题"
- 具体语法忘了？问AI就行，一秒钟给你答案
- 但是！基础概念一定要懂，不然AI写出来的代码你都看不懂，出了bug也不会调

### 13.3 接下来学什么？

学完ES6+，你的JS就已经是"现代水准"了。接下来该学工程化和框架了：

```
ES6+ → npm包管理 → Vite构建工具 → Git版本控制 → Vue3 → 组件库 → 全栈项目
```

下一篇咱们讲 **npm包管理**——前端的"外卖平台"，想要啥功能直接点，不用自己从零写。

### 13.4 学习资源推荐

- **MDN**：最权威的JS文档，每个特性都有详细说明
- **现代JavaScript教程**：非常棒的在线教程，深入浅出
- **ES6入门教程（阮一峰）**：经典的ES6教程，内容很全
- **GitHub**：多看别人的代码，学习优雅的写法

---

> 💬 **最后说两句**：
> 
> 恭喜你又看完了一篇10000字的长文！能坚持看到这里，说明你对前端是真爱。
> 
> 我刚开始学ES6的时候，觉得这些语法糖"不就是简写吗，有啥大不了的"。但后来写得多了才发现，这些"糖"不仅仅是写起来爽，更重要的是让代码更清晰、更不容易出bug、更好维护。
> 
> 技术的进步就是这样——从难用到好用，从复杂到简洁。ES6+就是JS的一次大进化，学会了它，你才算真正进入了现代前端的大门。
> 
> 现在就去把你之前写的JS代码用ES6+重构一遍，你会发现：**原来代码还能写得这么优雅**。
> 
> **万水千山总是情，点个👍行不行？** 你的点赞收藏是我更新的最大动力！

---

*相关推荐：《网页骨架速成：3小时徒手搭出你的第一个HTML页面》《网页化妆术：3小时让你的网页从土味变高级》《给网页注入灵魂：JavaScript零基础快速上手》*
