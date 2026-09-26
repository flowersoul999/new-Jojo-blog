---
title: "JavaScript零基础速成：从入门到写项目（保姆级教程）"
published: 2026-08-28
description: ""
tags: ["前端基础"]
category: "技术总结"
draft: false
lang: "zh-CN"
---

> 💡 **写在前面**：HTML有了，CSS也有了，但你的网页还是"死"的——点了没反应，数据不会变，就像一个没有灵魂的躯壳。今天咱们来学JavaScript，给你的网页注入灵魂！看完这篇，你就能写出有交互的网页了。全文约12000字，建议收藏后慢慢啃，边看边敲！

---

## 📑 目录导航

- [一、JavaScript是什么？能干嘛？](#一javascript是什么能干嘛)
  - [1.1 一句话理解JS](#11-一句话理解js)
  - [1.2 JS能做什么？](#12-js能做什么)
  - [1.3 学习路线一览](#13-学习路线一览)
- [二、环境准备：怎么运行JS代码？](#二环境准备怎么运行js代码)
  - [2.1 在哪里写JS？](#21-在哪里写js)
  - [2.2 三种引入方式](#22-三种引入方式)
  - [2.3 调试神器：console.log](#23-调试神器consolelog)
- [三、基础语法：变量与数据类型](#三基础语法变量与数据类型)
  - [3.1 变量：存数据的盒子](#31-变量存数据的盒子)
  - [3.2 数据类型大家族](#32-数据类型大家族)
  - [3.3 类型转换](#33-类型转换)
  - [3.4 运算符](#34-运算符)
- [四、流程控制：让代码学会思考](#四流程控制让代码学会思考)
  - [4.1 条件判断 if/else](#41-条件判断-ifelse)
  - [4.2 三元运算符](#42-三元运算符)
  - [4.3 switch多分支](#43-switch多分支)
  - [4.4 循环：for和while](#44-循环for和while)
- [五、函数：代码的打包器](#五函数代码的打包器)
  - [5.1 什么是函数？](#51-什么是函数)
  - [5.2 函数的定义和调用](#52-函数的定义和调用)
  - [5.3 参数和返回值](#53-参数和返回值)
  - [5.4 作用域](#54-作用域)
- [六、数组和对象：数据的容器](#六数组和对象数据的容器)
  - [6.1 数组：一排盒子](#61-数组一排盒子)
  - [6.2 数组常用方法](#62-数组常用方法)
  - [6.3 对象：属性的集合](#63-对象属性的集合)
  - [6.4 对象的增删改查](#64-对象的增删改查)
- [七、DOM操作：JS操控网页的魔法](#七dom操作js操控网页的魔法)
  - [7.1 DOM是什么？](#71-dom是什么)
  - [7.2 获取元素](#72-获取元素)
  - [7.3 操作内容和属性](#73-操作内容和属性)
  - [7.4 操作样式](#74-操作样式)
  - [7.5 创建和删除元素](#75-创建和删除元素)
- [八、事件：让网页响应用户](#八事件让网页响应用户)
  - [8.1 事件是什么？](#81-事件是什么)
  - [8.2 绑定事件的三种方式](#82-绑定事件的三种方式)
  - [8.3 常用事件一览](#83-常用事件一览)
  - [8.4 事件对象](#84-事件对象)
- [九、实战项目：Todo待办事项清单](#九实战项目todo待办事项清单)
  - [9.1 功能需求](#91-功能需求)
  - [9.2 HTML结构](#92-html结构)
  - [9.3 CSS样式](#93-css样式)
  - [9.4 JS逻辑实现](#94-js逻辑实现)
  - [9.5 完整代码](#95-完整代码)
- [十、新手必避的10个坑 ⚠️](#十新手必避的10个坑-️)
- [十一、总结与后续学习建议](#十一总结与后续学习建议)

---

## 一、JavaScript是什么？能干嘛？

### 1.1 一句话理解JS

**JavaScript就是网页的灵魂。**

老规矩，先上经典类比：
- HTML = 骨架（毛坯房）
- CSS = 妆容（精装修）
- **JavaScript = 灵魂（智能家居，能互动、会思考）**

JavaScript（简称JS）是一种**编程语言**，而且是目前唯一一种能在浏览器里运行的编程语言。有了它，网页就能"活"过来——点按钮有反应、表单能校验、数据能刷新、页面能动画。

💡 **冷知识**：JavaScript和Java没关系！就像雷锋和雷峰塔的关系，只是名字像而已。JS当年为了蹭Java的热度才改的名，原名是LiveScript。

### 1.2 JS能做什么？

JS的本事可大了去了，简单列几个：

| 领域 | 能做什么 |
|------|---------|
| 🌐 网页交互 | 表单验证、弹窗、轮播图、下拉菜单 |
| 🎮 网页游戏 | 2D/3D游戏、微信小游戏 |
| 📱 移动端 | 小程序、React Native、混合App |
| 🖥️ 后端开发 | Node.js，用JS写服务器 |
| 🖲️ 桌面应用 | Electron，VS Code就是用它写的 |
| 🤖 人工智能 | TensorFlow.js，在浏览器里跑AI模型 |

可以说，JavaScript是目前世界上应用最广泛的编程语言，没有之一。

### 1.3 学习路线一览

JS内容很多，给你画个清晰的学习路径：

```
第一阶段：基础语法（本篇前半部分）
  ├─ 变量和数据类型
  ├─ 运算符
  ├─ 条件判断和循环
  ├─ 函数
  └─ 数组和对象

第二阶段：Web API（本篇后半部分）
  ├─ DOM操作
  ├─ 事件处理
  └─ BOM操作

第三阶段：进阶
  ├─ ES6+新特性
  ├─ 异步编程（Promise、async/await）
  ├─ 面向对象
  └─ 闭包、原型链

第四阶段：框架
  ├─ Vue.js / React
  ├─ 工程化（Webpack、Vite）
  └─ Node.js后端
```

---

## 二、环境准备：怎么运行JS代码？

### 2.1 在哪里写JS？

跟HTML/CSS一样，用VS Code写就行，浏览器就能跑，不用装什么乱七八糟的环境。

当然，如果你想在命令行里跑JS，可以装个 [Node.js](https://nodejs.org/)，不过初学阶段先不用，浏览器足够了。

### 2.2 三种引入方式

JS代码写在哪？跟CSS类似，也有三种方式。

#### （1）行内式

直接写在HTML标签的事件属性里：

```html
<button onclick="alert('点我干嘛！')">点我一下</button>
```

⚠️ **不推荐**：结构和行为混在一起，维护起来噩梦。知道有这么回事就行。

#### （2）内嵌式

写在 `<script>` 标签里，一般放 `</body>` 前面：

```html
<body>
  <!-- 网页内容 -->
  
  <script>
    alert('我是JS代码！')
    console.log('Hello World!')
  </script>
</body>
```

**优点**：写demo方便，一个文件搞定
**缺点**：只能管当前页面，代码不能复用

👉 **初学阶段用这个就行**，简单直接。

#### （3）外部JS文件（推荐）

把JS写在单独的 `.js` 文件里，然后引入：

第一步：新建 `main.js`

```javascript
alert('我是外部JS文件！')
console.log('Hello World!')
```

第二步：在HTML中引入

```html
<body>
  <!-- 网页内容 -->
  
  <script src="./main.js"></script>
</body>
```

**优点**：
- 结构和行为完全分离
- 多个页面可以共用
- 方便维护

👉 **做项目一定要用外部JS文件！**

⚠️ **注意**：
- `<script>` 标签一般放在 `</body>` 前面，因为JS要等HTML加载完再执行，不然找不到元素
- 引用了外部JS的script标签，中间就不要再写代码了，写了也不执行

### 2.3 调试神器：console.log

学JS，你一定要认识一个好朋友——`console.log()`。

它的作用就是**在控制台打印东西**，是你调试代码的好帮手。

```javascript
console.log('Hello World!')   // 打印文字
console.log(123)              // 打印数字
console.log(true)             // 打印布尔值
```

怎么看控制台？打开浏览器，按 **F12**，找到 **Console（控制台）** 面板，就能看到输出了。

💡 **小技巧**：
- `console.log` 可以打印多个值，用逗号隔开：`console.log(a, b, c)`
- 可以加个标签方便找：`console.log('用户名：', username)`
- 以后你会经常用它来排查问题，记住它！

---

## 三、基础语法：变量与数据类型

### 3.1 变量：存数据的盒子

变量就是**用来存数据的容器**，你可以把它想象成一个盒子，里面可以放各种东西。

#### （1）声明变量

ES6之后，声明变量用 `let` 和 `const`：

```javascript
// 声明一个变量，名字叫age，值是18
let age = 18

// 声明一个常量，名字叫PI，值是3.14（不能改）
const PI = 3.14
```

**var、let、const的区别**：

| 关键字 | 作用域 | 能否重复声明 | 能否修改 | 推荐程度 |
|--------|--------|-------------|---------|---------|
| `var` | 函数作用域 | 能 | 能 | ❌ 别用了 |
| `let` | 块级作用域 | 不能 | 能 | ✅ 常用 |
| `const` | 块级作用域 | 不能 | 不能 | ✅ 优先用 |

👉 **建议**：默认用 `const`，确定要改的再用 `let`，`var` 就别用了，那是老黄历了。

#### （2）变量命名规则

起名字不是随便起的，有规矩：

1. 只能用 **字母、数字、下划线、$**，不能以数字开头
2. 严格区分大小写，`age` 和 `Age` 是两个变量
3. 不能用关键字和保留字（比如 `let`、`const`、`function` 这些）
4. 名字要有意义，别用 `a`、`b`、`c`，过两天你自己都不知道啥意思

👉 **命名习惯**：用小驼峰（camelCase），比如 `userName`、`totalPrice`、`getUserInfo`

### 3.2 数据类型大家族

JS里的数据有不同的类型，就像东西有不同的种类一样。

#### （1）基本数据类型

| 类型 | 说明 | 栗子 |
|------|------|------|
| `number` | 数字 | `18`、`3.14`、`-10` |
| `string` | 字符串 | `'你好'`、`"hello"`、`` `模板字符串` `` |
| `boolean` | 布尔值 | `true`（真）、`false`（假） |
| `undefined` | 未定义 | 声明了没赋值，就是undefined |
| `null` | 空值 | 表示空，啥也没有 |
| `symbol` | 符号 | ES6新增，唯一值，初学不用管 |
| `bigint` | 大整数 | 超大数字，初学不用管 |

#### （2）引用数据类型

| 类型 | 说明 | 栗子 |
|------|------|------|
| `Object` | 对象 | `{ name: '小明', age: 18 }` |
| `Array` | 数组 | `[1, 2, 3, 4, 5]` |
| `Function` | 函数 | `function() {}` |

💡 **怎么判断数据类型？** 用 `typeof`：

```javascript
console.log(typeof 18)          // 'number'
console.log(typeof 'hello')     // 'string'
console.log(typeof true)        // 'boolean'
console.log(typeof undefined)   // 'undefined'
console.log(typeof null)        // 'object'  ← 这是个历史bug！
console.log(typeof {})          // 'object'
console.log(typeof [])          // 'object'  ← 数组也是对象
console.log(typeof function(){}) // 'function'
```

⚠️ **注意**：`typeof null` 返回 `'object'`，这是JS的历史遗留bug，记住就好，别纠结。

#### （3）字符串详解

字符串有三种写法：

```javascript
// 单引号
let name = '小明'

// 双引号
let age = "18岁"

// 模板字符串（反引号，ES6新增，强烈推荐）
let str = `我叫${name}，今年${age}`
```

模板字符串的好处：
1. 可以换行，不会报错
2. 可以用 `${变量名}` 直接插入变量，不用拼接了

以前拼接字符串老麻烦了：

```javascript
// 老写法（丑拒）
let str = '我叫' + name + '，今年' + age + '岁'

// 新写法（真香）
let str = `我叫${name}，今年${age}岁`
```

### 3.3 类型转换

不同类型的数据碰到一起，会发生类型转换。这玩意儿坑挺多的，但常用的就几种。

#### （1）转数字

```javascript
// Number()：整体转，转不了就是NaN
Number('123')    // 123
Number('123px')  // NaN（Not a Number，不是一个数字）

// parseInt()：从左往右转，遇到非数字就停，取整
parseInt('123px')   // 123
parseInt('3.14')    // 3

// parseFloat()：和parseInt类似，但能识别小数
parseFloat('3.14')  // 3.14
```

#### （2）转字符串

```javascript
// String()
String(123)   // '123'

// 变量.toString()
let num = 123
num.toString()  // '123'

// 加个空字符串也行（隐式转换）
123 + ''   // '123'
```

#### （3）转布尔值

```javascript
Boolean(0)         // false
Boolean('')        // false
Boolean(null)      // false
Boolean(undefined) // false
Boolean(NaN)       // false
// 其他的都是 true
Boolean(1)         // true
Boolean('hello')   // true
Boolean([])        // true
Boolean({})        // true
```

💡 **口诀**：`0、''、null、undefined、NaN` 这五个是假的，其他都是真的。

### 3.4 运算符

#### （1）算术运算符

| 符号 | 作用 | 栗子 |
|------|------|------|
| `+` | 加 | `1 + 2 = 3` |
| `-` | 减 | `5 - 2 = 3` |
| `*` | 乘 | `2 * 3 = 6` |
| `/` | 除 | `6 / 2 = 3` |
| `%` | 取余（模） | `5 % 2 = 1` |
| `++` | 自增 | `a++` 或 `++a` |
| `--` | 自减 | `a--` 或 `--a` |

⚠️ **注意**：`+` 号如果两边有字符串，就不是加法了，而是字符串拼接：

```javascript
1 + '2'   // '12' （数字加字符串，变成字符串拼接）
```

这是新手最容易踩的坑之一，后面避坑指南详细说。

#### （2）赋值运算符

| 符号 | 作用 | 等价于 |
|------|------|--------|
| `=` | 赋值 | - |
| `+=` | 加等于 | `a = a + b` |
| `-=` | 减等于 | `a = a - b` |
| `*=` | 乘等于 | `a = a * b` |
| `/=` | 除等于 | `a = a / b` |
| `%=` | 模等于 | `a = a % b` |

```javascript
let a = 10
a += 5   // a = a + 5 → 15
a -= 3   // a = a - 3 → 12
```

#### （3）比较运算符

| 符号 | 作用 | 栗子 |
|------|------|------|
| `>` | 大于 | `5 > 3 → true` |
| `<` | 小于 | `5 < 3 → false` |
| `>=` | 大于等于 | `5 >= 5 → true` |
| `<=` | 小于等于 | `5 <= 3 → false` |
| `==` | 等于（只比较值） | `5 == '5' → true` |
| `===` | 全等于（值和类型都比） | `5 === '5' → false` |
| `!=` | 不等于 | `5 != 3 → true` |
| `!==` | 不全等于 | `5 !== '5' → true` |

⚠️ **划重点**：永远用 `===` 和 `!==`，别用 `==` 和 `!=`！`==` 会做隐式类型转换，坑多到你怀疑人生。

#### （4）逻辑运算符

| 符号 | 作用 | 说明 |
|------|------|------|
| `&&` | 与（并且） | 两边都真才是真 |
| `||` | 或（或者） | 有一个真就是真 |
| `!` | 非（取反） | 真变假，假变真 |

```javascript
true && true    // true
true && false   // false
true || false   // true
false || false  // false
!true           // false
!false          // true
```

---

## 四、流程控制：让代码学会思考

### 4.1 条件判断 if/else

代码不是一条道走到黑的，它也会"思考"，根据不同情况做不同的事。

#### （1）基本语法

```javascript
if (条件) {
  // 条件为真时执行
} else {
  // 条件为假时执行
}
```

#### （2）栗子

```javascript
let age = 18

if (age >= 18) {
  console.log('你是成年人了')
} else {
  console.log('你还是个孩子')
}
```

#### （3）多条件判断

```javascript
let score = 85

if (score >= 90) {
  console.log('优秀')
} else if (score >= 80) {
  console.log('良好')
} else if (score >= 60) {
  console.log('及格')
} else {
  console.log('不及格')
}
```

执行顺序：从上往下判断，哪个条件满足就执行哪个，后面的就不看了。

### 4.2 三元运算符

简单的 if/else 可以用三元运算符来简写：

```javascript
条件 ? 表达式1 : 表达式2
```

条件为真就执行表达式1，为假就执行表达式2。

```javascript
let age = 18
let result = age >= 18 ? '成年人' : '未成年人'
console.log(result)  // '成年人'
```

💡 **使用场景**：简单的二选一判断，写起来比if/else简洁。但别嵌套太多，不然可读性差。

### 4.3 switch多分支

如果判断条件很多，而且是固定值的比较，可以用 switch：

```javascript
let day = 3

switch (day) {
  case 1:
    console.log('星期一')
    break
  case 2:
    console.log('星期二')
    break
  case 3:
    console.log('星期三')
    break
  case 4:
    console.log('星期四')
    break
  case 5:
    console.log('星期五')
    break
  default:
    console.log('周末')
}
```

⚠️ **注意**：每个case后面要加 `break`，不然会"穿透"，继续执行后面的case。

### 4.4 循环：for和while

有些事要重复做很多次，总不能复制粘贴吧？这时候就用循环。

#### （1）for循环（最常用）

```javascript
for (初始化; 条件; 更新) {
  // 循环体
}
```

打印1到10：

```javascript
for (let i = 1; i <= 10; i++) {
  console.log(i)
}
```

执行过程：
1. 初始化 `let i = 1`（只执行一次）
2. 判断条件 `i <= 10`，为真就执行循环体，为假就退出
3. 执行完循环体，执行 `i++`
4. 回到第2步，继续判断

#### （2）遍历数组

for循环最常用的场景就是遍历数组：

```javascript
let arr = ['苹果', '香蕉', '橘子']

for (let i = 0; i < arr.length; i++) {
  console.log(arr[i])
}
```

#### （3）while循环

```javascript
while (条件) {
  // 条件为真就一直循环
}
```

```javascript
let i = 1
while (i <= 10) {
  console.log(i)
  i++
}
```

#### （4）do...while循环

和while差不多，区别是**先执行一次，再判断条件**：

```javascript
let i = 1
do {
  console.log(i)
  i++
} while (i <= 10)
```

#### （5）break和continue

- `break`：跳出整个循环，不玩了
- `continue`：跳过本次循环，继续下一次

```javascript
// 打印1到10，遇到5就跳过
for (let i = 1; i <= 10; i++) {
  if (i === 5) {
    continue
  }
  console.log(i)
}

// 打印1到10，遇到5就退出
for (let i = 1; i <= 10; i++) {
  if (i === 5) {
    break
  }
  console.log(i)
}
```

---

## 五、函数：代码的打包器

### 5.1 什么是函数？

函数就是**把一堆代码打包起来，给它起个名字，想用的时候叫它的名字就行**。

为什么要用函数？
1. **代码复用**：写一次，用N次
2. **方便维护**：改一处，处处生效
3. **结构清晰**：把复杂的逻辑拆成一个个小函数

### 5.2 函数的定义和调用

#### （1）函数声明

```javascript
function 函数名() {
  // 函数体：要做的事情
}
```

栗子：

```javascript
// 定义一个打招呼的函数
function sayHi() {
  console.log('你好呀！')
}

// 调用函数
sayHi()  // 输出：你好呀！
sayHi()  // 可以调用多次
sayHi()
```

#### （2）函数表达式

也可以把函数赋值给一个变量：

```javascript
const sayHi = function() {
  console.log('你好呀！')
}

sayHi()
```

#### （3）箭头函数（ES6，推荐）

更简洁的写法：

```javascript
const sayHi = () => {
  console.log('你好呀！')
}
```

如果函数体只有一行，可以省略大括号：

```javascript
const sayHi = () => console.log('你好呀！')
```

💡 **什么时候用箭头函数？** 大部分场景都能用，特别是回调函数的时候写起来超简洁。但注意箭头函数没有自己的this，这个后面再说。

### 5.3 参数和返回值

#### （1）参数

函数可以接收参数，就像机器可以接收原材料一样：

```javascript
function sayHi(name) {
  console.log(`你好呀，${name}！`)
}

sayHi('小明')   // 你好呀，小明！
sayHi('小红')   // 你好呀，小红！
```

多个参数用逗号隔开：

```javascript
function add(a, b) {
  console.log(a + b)
}

add(1, 2)   // 3
add(10, 20) // 30
```

#### （2）返回值

函数可以返回一个结果，用 `return`：

```javascript
function add(a, b) {
  return a + b
}

let result = add(1, 2)
console.log(result)  // 3
```

⚠️ **注意**：
- `return` 后面的代码不会执行
- 没有return的函数，默认返回 `undefined`

### 5.4 作用域

作用域就是**变量能起作用的范围**。

#### （1）全局作用域

在最外层声明的变量，哪儿都能访问：

```javascript
let a = 10  // 全局变量

function fn() {
  console.log(a)  // 能访问到
}

fn()
console.log(a)    // 也能访问到
```

#### （2）局部作用域

在函数内部声明的变量，只有函数内部能访问：

```javascript
function fn() {
  let b = 20  // 局部变量
  console.log(b)  // 能访问
}

fn()
console.log(b)    // 报错！b is not defined
```

#### （3）块级作用域

ES6之后，`let` 和 `const` 有块级作用域——在 `{}` 里声明的，外面访问不到：

```javascript
if (true) {
  let c = 30
  console.log(c)  // 能访问
}

console.log(c)    // 报错！
```

💡 **这就是为什么推荐用let不用var**：var没有块级作用域，容易出bug。

#### （4）作用域链

函数里面可以嵌套函数，内层函数访问变量的时候，会一层一层往外找，这就是作用域链：

```javascript
let a = 10  // 全局

function outer() {
  let b = 20  // outer函数内
  
  function inner() {
    let c = 30  // inner函数内
    console.log(a)  // 10（从全局找到的）
    console.log(b)  // 20（从outer找到的）
    console.log(c)  // 30（自己的）
  }
  
  inner()
}

outer()
```

**规则**：就近原则，自己有就用自己的，自己没有就找爸爸的，爸爸没有就找爷爷的，一直找到全局，都没有就报错。

---

## 六、数组和对象：数据的容器

### 6.1 数组：一排盒子

数组就是**一组数据的集合**，你可以把它想象成一排盒子，每个盒子里放一个东西，按顺序排好。

#### （1）创建数组

```javascript
// 方式1：字面量（推荐）
let arr = [1, 2, 3, 4, 5]

// 方式2：new Array（不推荐）
let arr2 = new Array(1, 2, 3)
```

数组里可以放任何类型的数据：

```javascript
let arr = [1, 'hello', true, null, undefined, {name: '小明'}, [1, 2, 3]]
```

#### （2）访问数组元素

通过**下标（索引）**来访问，注意：**下标从0开始！**

```javascript
let arr = ['苹果', '香蕉', '橘子']

console.log(arr[0])   // '苹果'
console.log(arr[1])   // '香蕉'
console.log(arr[2])   // '橘子'
console.log(arr[3])   // undefined（越界了）
```

#### （3）数组长度

```javascript
let arr = [1, 2, 3, 4, 5]
console.log(arr.length)  // 5
```

修改length可以改变数组长度：

```javascript
arr.length = 3
console.log(arr)  // [1, 2, 3]，后面的被截掉了
```

### 6.2 数组常用方法

数组的方法有几十个，但常用的也就十几个，给你整理好了：

#### （1）增删元素

| 方法 | 作用 | 返回值 | 会不会改变原数组 |
|------|------|--------|-----------------|
| `push()` | 末尾添加一个或多个 | 新长度 | ✅ 会 |
| `pop()` | 删除最后一个 | 被删的元素 | ✅ 会 |
| `unshift()` | 开头添加一个或多个 | 新长度 | ✅ 会 |
| `shift()` | 删除第一个 | 被删的元素 | ✅ 会 |
| `splice()` | 增删改都行 | 被删元素组成的数组 | ✅ 会 |

```javascript
let arr = [1, 2, 3]

arr.push(4)      // [1, 2, 3, 4]，返回4
arr.pop()        // [1, 2, 3]，返回4
arr.unshift(0)   // [0, 1, 2, 3]，返回4
arr.shift()      // [1, 2, 3]，返回0

// splice：从第2个位置开始，删1个，插入'a'和'b'
arr.splice(1, 1, 'a', 'b')  
console.log(arr)  // [1, 'a', 'b', 3]
```

#### （2）排序和翻转

| 方法 | 作用 | 会不会改变原数组 |
|------|------|-----------------|
| `sort()` | 排序 | ✅ 会 |
| `reverse()` | 翻转 | ✅ 会 |

```javascript
let arr = [3, 1, 4, 2, 5]

arr.reverse()  // [5, 2, 4, 1, 3]

// sort默认按字符串排序，数字排序要传函数
arr.sort((a, b) => a - b)  // [1, 2, 3, 4, 5] 升序
arr.sort((a, b) => b - a)  // [5, 4, 3, 2, 1] 降序
```

#### （3）查找元素

| 方法 | 作用 | 返回值 |
|------|------|--------|
| `indexOf()` | 查找元素的索引 | 找到返回索引，没找到返回-1 |
| `includes()` | 是否包含某个元素 | true/false |
| `find()` | 找第一个满足条件的元素 | 找到返回元素，没找到返回undefined |
| `findIndex()` | 找第一个满足条件的索引 | 找到返回索引，没找到返回-1 |

```javascript
let arr = [1, 2, 3, 4, 5]

arr.indexOf(3)        // 2
arr.indexOf(10)       // -1
arr.includes(3)       // true
arr.includes(10)      // false

// find：找第一个大于2的元素
arr.find(item => item > 2)  // 3

// findIndex：找第一个大于2的元素的索引
arr.findIndex(item => item > 2)  // 2
```

#### （4）遍历数组（高阶函数）

| 方法 | 作用 | 返回值 |
|------|------|--------|
| `forEach()` | 遍历每一项 | 无 |
| `map()` | 映射，每一项都处理一下 | 新数组 |
| `filter()` | 过滤，留下满足条件的 | 新数组 |
| `every()` | 所有项都满足条件吗？ | true/false |
| `some()` | 有一项满足条件吗？ | true/false |
| `reduce()` | 累加器 | 最终结果 |

这几个非常重要，一个个来：

**forEach：遍历**

```javascript
let arr = [1, 2, 3]

arr.forEach((item, index) => {
  console.log(`第${index}个是${item}`)
})
```

**map：映射（一一对应）**

```javascript
let arr = [1, 2, 3]

// 每个元素都乘2
let newArr = arr.map(item => item * 2)
console.log(newArr)  // [2, 4, 6]
```

**filter：过滤**

```javascript
let arr = [1, 2, 3, 4, 5]

// 留下大于2的
let newArr = arr.filter(item => item > 2)
console.log(newArr)  // [3, 4, 5]
```

**reduce：累加**

```javascript
let arr = [1, 2, 3, 4, 5]

// 求和
let sum = arr.reduce((total, item) => total + item, 0)
console.log(sum)  // 15
```

reduce的第一个参数是回调函数，第二个参数是初始值。回调函数里第一个参数是累加器，第二个是当前项。

### 6.3 对象：属性的集合

对象就是**一组键值对的集合**，用来描述一个事物的各种特征。

比如描述一个人：

```javascript
let person = {
  name: '小明',
  age: 18,
  gender: '男',
  hobby: ['写代码', '打游戏', '听音乐'],
  sayHi: function() {
    console.log('大家好，我是小明')
  }
}
```

- `name`、`age` 这些叫**属性名（键）**
- `'小明'`、`18` 这些叫**属性值**
- 属性值是函数的话，我们叫它**方法**

### 6.4 对象的增删改查

#### （1）查（获取属性）

两种方式：

```javascript
console.log(person.name)    // '小明' （点语法，常用）
console.log(person['name']) // '小明' （方括号语法）
```

什么时候用方括号？属性名是变量的时候：

```javascript
let key = 'name'
console.log(person[key])  // '小明' （这里不能用person.key！）
```

#### （2）改（修改属性）

```javascript
person.age = 20
console.log(person.age)  // 20
```

#### （3）增（添加属性）

有就改，没有就加：

```javascript
person.city = '上海'
console.log(person.city)  // '上海'
```

#### （4）删（删除属性）

```javascript
delete person.gender
console.log(person.gender)  // undefined
```

#### （5）遍历对象

用 `for...in` 遍历：

```javascript
for (let key in person) {
  console.log(key + ': ' + person[key])
}
```

---

## 七、DOM操作：JS操控网页的魔法

### 7.1 DOM是什么？

DOM = **Document Object Model**（文档对象模型），听着挺玄乎对吧？

翻译成人话就是：**浏览器把HTML文档变成了一棵对象树，每个标签都是一个对象，你可以通过JS操作这些对象，从而改变网页**。

```
document
  └─ html
      ├─ head
      │   └─ title
      └─ body
          ├─ h1
          ├─ p
          └─ div
              └─ span
```

每个HTML标签对应一个DOM对象，操作这个对象就能改变网页的内容、样式、结构。

### 7.2 获取元素

要操作元素，首先得"找到"它。

#### （1）通过id获取

```javascript
let box = document.getElementById('box')
```

获取到的是一个DOM对象，如果找不到返回null。

#### （2）通过类名获取

```javascript
let items = document.getElementsByClassName('item')
```

获取到的是一个**伪数组**（HTMLCollection），哪怕只有一个也是数组形式。

#### （3）通过标签名获取

```javascript
let lis = document.getElementsByTagName('li')
```

也是伪数组。

#### （4）querySelector（推荐！）

用CSS选择器的方式获取元素，**只返回第一个匹配的**：

```javascript
// id为box的元素
let box = document.querySelector('#box')

// 类名为item的第一个元素
let item = document.querySelector('.item')

// 第一个li
let li = document.querySelector('li')

// 复合选择器也行
let navItem = document.querySelector('.nav .item')
```

#### （5）querySelectorAll（推荐！）

获取**所有**匹配的元素，返回一个NodeList（也是伪数组，但能forEach）：

```javascript
let items = document.querySelectorAll('.item')

// 可以直接遍历
items.forEach(item => {
  console.log(item)
})
```

👉 **强烈推荐**：就用 `querySelector` 和 `querySelectorAll`，简单好用，CSS怎么写选择器，这里就怎么写。

### 7.3 操作内容和属性

找到元素之后，就能对它动手动脚了。

#### （1）操作内容

| 属性 | 作用 | 区别 |
|------|------|------|
| `innerText` | 文本内容 | 只识别文字，不识别标签 |
| `innerHTML` | HTML内容 | 能识别标签 |
| `value` | 表单元素的值 | input、textarea等用这个 |

```html
<div id="box">
  <p>我是一个div</p>
</div>
```

```javascript
let box = document.querySelector('#box')

console.log(box.innerText)  // '我是一个div'（只有文字）
console.log(box.innerHTML)  // '<p>我是一个div</p>'（带标签）

// 修改内容
box.innerText = '<h1>新内容</h1>'  // 会把标签当文字显示
box.innerHTML = '<h1>新内容</h1>'  // 会解析成h1标签
```

表单元素用 `value`：

```javascript
let input = document.querySelector('input')
console.log(input.value)  // 获取输入框的值
input.value = '新的值'    // 设置输入框的值
```

#### （2）操作属性

```javascript
let img = document.querySelector('img')

// 获取属性
console.log(img.src)
console.log(img.alt)

// 设置属性
img.src = './new.jpg'
img.alt = '新图片'
```

自定义属性用 `getAttribute` 和 `setAttribute`：

```javascript
let div = document.querySelector('div')

// 设置自定义属性
div.setAttribute('data-id', '123')

// 获取自定义属性
console.log(div.getAttribute('data-id'))  // '123'

// 删除属性
div.removeAttribute('data-id')
```

### 7.4 操作样式

#### （1）操作行内样式

通过 `style` 属性：

```javascript
let box = document.querySelector('.box')

box.style.width = '200px'
box.style.height = '200px'
box.style.backgroundColor = 'red'
box.style.borderRadius = '10px'
```

⚠️ **注意**：
- CSS里的background-color，JS里变成 backgroundColor（小驼峰）
- 设置的是行内样式，优先级比较高

#### （2）操作类名

通过修改类名来改变样式（推荐，结构样式分离）：

```javascript
let box = document.querySelector('.box')

// 添加类名
box.classList.add('active')

// 删除类名
box.classList.remove('active')

// 切换类名（有就删，没有就加）
box.classList.toggle('active')

// 判断有没有这个类
box.classList.contains('active')  // true/false
```

👉 **最佳实践**：JS只负责切换类名，具体样式写在CSS里。这样代码更清晰，也更好维护。

### 7.5 创建和删除元素

#### （1）创建元素

```javascript
// 创建一个新的div元素
let newDiv = document.createElement('div')
newDiv.innerText = '我是新来的'
newDiv.className = 'box'
```

#### （2）添加元素

```javascript
// 追加到父元素的末尾
父元素.appendChild(newDiv)

// 插入到某个元素的前面
父元素.insertBefore(newDiv, 参考元素)
```

栗子：

```javascript
let ul = document.querySelector('ul')
let li = document.createElement('li')
li.innerText = '新的列表项'

ul.appendChild(li)  // 加到ul最后
```

#### （3）删除元素

```javascript
// 自己删自己
元素.remove()

// 父元素删子元素
父元素.removeChild(子元素)
```

```javascript
let li = document.querySelector('li')
li.remove()  // 直接删除
```

#### （4）克隆元素

```javascript
let 新元素 = 旧元素.cloneNode(true)
// 参数true表示深克隆（连子元素一起克隆），false只克隆自己
```

---

## 八、事件：让网页响应用户

### 8.1 事件是什么？

事件就是**用户对网页做的操作**，比如点击、鼠标移动、输入文字、按下键盘等等。

JS可以监听这些事件，当事件发生时，执行相应的代码。这就是网页交互的原理。

一个事件有三要素：
1. **事件源**：谁触发了事件？（比如按钮）
2. **事件类型**：什么事件？（比如点击）
3. **事件处理函数**：触发后要做什么？（比如弹窗）

### 8.2 绑定事件的三种方式

#### （1）行内绑定（不推荐）

```html
<button onclick="alert('点我干嘛！')">点我</button>
```

结构和行为混在一起，不推荐。

#### （2）DOM 0级绑定

```javascript
let btn = document.querySelector('button')

btn.onclick = function() {
  alert('点我干嘛！')
}
```

**缺点**：同一个事件只能绑定一个处理函数，后面的会覆盖前面的。

#### （3）DOM 2级绑定（推荐！）

用 `addEventListener`：

```javascript
let btn = document.querySelector('button')

btn.addEventListener('click', function() {
  alert('点我干嘛！')
})
```

**优点**：
- 同一个事件可以绑定多个处理函数，按顺序执行
- 可以移除事件监听

移除事件监听：

```javascript
function handleClick() {
  alert('点我干嘛！')
}

btn.addEventListener('click', handleClick)

// 移除（注意：移除的函数必须和绑定的是同一个函数）
btn.removeEventListener('click', handleClick)
```

### 8.3 常用事件一览

#### （1）鼠标事件

| 事件 | 触发时机 |
|------|---------|
| `click` | 点击（鼠标按下并抬起） |
| `dblclick` | 双击 |
| `mousedown` | 鼠标按下 |
| `mouseup` | 鼠标抬起 |
| `mousemove` | 鼠标移动 |
| `mouseenter` | 鼠标进入（不冒泡） |
| `mouseleave` | 鼠标离开（不冒泡） |
| `mouseover` | 鼠标经过（冒泡） |
| `mouseout` | 鼠标移出（冒泡） |
| `contextmenu` | 右键菜单 |

💡 **mouseenter vs mouseover**：mouseenter不冒泡，mouseover冒泡。简单说就是：mouseenter只有鼠标进入元素本身才触发，进入子元素不触发；mouseover进入子元素也会触发。一般用mouseenter和mouseleave就好。

#### （2）键盘事件

| 事件 | 触发时机 |
|------|---------|
| `keydown` | 键盘按下 |
| `keyup` | 键盘抬起 |
| `keypress` | 按键按下（只识别字符键，不识别功能键） |

```javascript
document.addEventListener('keydown', function(e) {
  console.log('你按下了：' + e.key)
})
```

#### （3）表单事件

| 事件 | 触发时机 |
|------|---------|
| `focus` | 获得焦点 |
| `blur` | 失去焦点 |
| `change` | 内容改变且失去焦点 |
| `input` | 内容改变（实时触发） |
| `submit` | 表单提交 |

#### （4）其他事件

| 事件 | 触发时机 |
|------|---------|
| `load` | 页面加载完成 |
| `scroll` | 滚动条滚动 |
| `resize` | 窗口大小改变 |

### 8.4 事件对象

当事件触发时，处理函数会收到一个**事件对象**（一般叫 `e` 或 `event`），里面包含了事件的详细信息。

```javascript
btn.addEventListener('click', function(e) {
  console.log(e)  // 事件对象
})
```

常用属性：

| 属性 | 作用 |
|------|------|
| `e.target` | 真正触发事件的元素 |
| `e.currentTarget` | 绑定事件的元素 |
| `e.type` | 事件类型 |
| `e.clientX` / `e.clientY` | 鼠标在可视区的坐标 |
| `e.pageX` / `e.pageY` | 鼠标在页面的坐标 |
| `e.key` | 按下的键 |
| `e.keyCode` | 键码（数字） |

常用方法：

| 方法 | 作用 |
|------|------|
| `e.preventDefault()` | 阻止默认行为（比如链接跳转、表单提交） |
| `e.stopPropagation()` | 阻止事件冒泡 |

#### 事件冒泡

什么是事件冒泡？就是**子元素的事件会一层一层往上传递给父元素**。

```html
<div class="father">
  <div class="son">点我</div>
</div>
```

```javascript
let father = document.querySelector('.father')
let son = document.querySelector('.son')

son.addEventListener('click', function() {
  console.log('儿子被点击了')
})

father.addEventListener('click', function() {
  console.log('爸爸被点击了')
})
```

点击儿子的时候，爸爸的点击事件也会触发！这就是事件冒泡。

如果想阻止冒泡：

```javascript
son.addEventListener('click', function(e) {
  e.stopPropagation()  // 阻止冒泡
  console.log('儿子被点击了')
})
```

#### 事件委托

利用事件冒泡的特性，我们可以把事件绑定在父元素上，让父元素代理子元素的事件。这就是**事件委托**。

比如有很多个li，挨个绑定事件太麻烦了，直接绑在ul上：

```javascript
let ul = document.querySelector('ul')

ul.addEventListener('click', function(e) {
  // e.target是真正被点击的元素
  if (e.target.tagName === 'LI') {
    console.log('你点击了：' + e.target.innerText)
  }
})
```

**好处**：
1. 代码更少，性能更好
2. 动态添加的子元素也能触发事件（不用重新绑定）

---

## 九、实战项目：Todo待办事项清单

学了这么多，咱们来做一个经典的实战项目——Todo待办事项清单。做完这个，JS基础和DOM操作你就都掌握了。

### 9.1 功能需求

我们要实现的功能：
1. ✅ 在输入框输入内容，按回车或点添加按钮，添加一条待办
2. ✅ 点击复选框，可以标记为已完成（文字加删除线）
3. ✅ 点击删除按钮，可以删除这条待办
4. ✅ 显示已完成数量和总数量
5. ✅ 清空所有已完成的待办

### 9.2 HTML结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todo待办事项</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <div class="todo-container">
    <h1>📝 Todo List</h1>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <input type="text" id="todoInput" placeholder="输入待办事项，按回车添加...">
      <button id="addBtn">添加</button>
    </div>
    
    <!-- 待办列表 -->
    <ul id="todoList" class="todo-list">
      <!-- JS动态生成 -->
    </ul>
    
    <!-- 底部统计 -->
    <div class="todo-footer">
      <span id="todoCount">共 0 条，已完成 0 条</span>
      <button id="clearBtn">清除已完成</button>
    </div>
  </div>
  
  <script src="./main.js"></script>
</body>
</html>
```

### 9.3 CSS样式

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 40px 20px;
}

.todo-container {
  max-width: 500px;
  margin: 0 auto;
  background-color: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 24px;
}

.input-area {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

#todoInput {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

#todoInput:focus {
  outline: none;
  border-color: #667eea;
}

#addBtn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
}

#addBtn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.todo-list {
  list-style: none;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.todo-item:hover {
  background-color: #f9f9f9;
}

.todo-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-right: 12px;
  cursor: pointer;
}

.todo-item .todo-text {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.todo-item.done .todo-text {
  text-decoration: line-through;
  color: #999;
}

.todo-item .delete-btn {
  padding: 4px 12px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.todo-item:hover .delete-btn {
  opacity: 1;
}

.todo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  font-size: 13px;
  color: #999;
}

#clearBtn {
  padding: 6px 12px;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

#clearBtn:hover {
  background-color: #e8e8e8;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 14px;
}
```

### 9.4 JS逻辑实现

```javascript
// 获取元素
const todoInput = document.querySelector('#todoInput')
const addBtn = document.querySelector('#addBtn')
const todoList = document.querySelector('#todoList')
const todoCount = document.querySelector('#todoCount')
const clearBtn = document.querySelector('#clearBtn')

// 待办数据（用数组存）
let todos = [
  // { id: 1, text: '学习JavaScript', done: false }
]

// 渲染列表
function render() {
  // 清空列表
  todoList.innerHTML = ''
  
  // 如果没有数据，显示空提示
  if (todos.length === 0) {
    todoList.innerHTML = '<li class="empty-tip">暂无待办事项，添加一个吧~</li>'
  } else {
    // 遍历数组，生成列表项
    todos.forEach(todo => {
      const li = document.createElement('li')
      li.className = 'todo-item' + (todo.done ? ' done' : '')
      li.dataset.id = todo.id
      
      li.innerHTML = `
        <input type="checkbox" ${todo.done ? 'checked' : ''}>
        <span class="todo-text">${todo.text}</span>
        <button class="delete-btn">删除</button>
      `
      
      todoList.appendChild(li)
    })
  }
  
  // 更新统计
  const doneCount = todos.filter(t => t.done).length
  todoCount.textContent = `共 ${todos.length} 条，已完成 ${doneCount} 条`
}

// 添加待办
function addTodo() {
  const text = todoInput.value.trim()
  
  if (!text) {
    alert('请输入待办内容！')
    return
  }
  
  todos.push({
    id: Date.now(),  // 用时间戳当id，保证唯一
    text: text,
    done: false
  })
  
  todoInput.value = ''  // 清空输入框
  render()
}

// 切换完成状态
function toggleDone(id) {
  const todo = todos.find(t => t.id === id)
  if (todo) {
    todo.done = !todo.done
    render()
  }
}

// 删除待办
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id)
  render()
}

// 清除已完成
function clearDone() {
  todos = todos.filter(t => !t.done)
  render()
}

// ===== 绑定事件 =====

// 点击添加按钮
addBtn.addEventListener('click', addTodo)

// 按回车添加
todoInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    addTodo()
  }
})

// 事件委托：列表的点击事件
todoList.addEventListener('click', function(e) {
  const li = e.target.closest('.todo-item')
  if (!li) return
  
  const id = Number(li.dataset.id)
  
  // 点击了复选框
  if (e.target.type === 'checkbox') {
    toggleDone(id)
  }
  
  // 点击了删除按钮
  if (e.target.classList.contains('delete-btn')) {
    deleteTodo(id)
  }
})

// 清除已完成按钮
clearBtn.addEventListener('click', clearDone)

// 初始渲染
render()
```

### 9.5 完整代码

把上面三个文件（HTML、CSS、JS）放在同一个文件夹里，打开HTML就能用了。

👉 **动手试试**：
1. 把代码敲一遍（别直接复制，自己敲印象深）
2. 测试所有功能是否正常
3. 试试加一些新功能，比如：编辑功能、优先级标记、本地存储（localStorage）

做完这个项目，你对JS的理解会上一个大台阶！

---

## 十、新手必避的10个坑 ⚠️

JS这门语言，设计得有点"随意"，坑那是相当多。我把新手最容易踩的10个坑列出来：

### 坑1：变量提升和undefined
**现象**：变量还没声明就用了，不报错，返回undefined
**原因**：var声明的变量会"提升"到作用域顶部
**解决**：用let和const，它们有暂时性死区，没声明就用会报错，反而安全

### 坑2：== 和 ===
**现象**：`5 == '5'` 返回true，明明类型不一样
**原因**：== 会做隐式类型转换，坑很多
**解决**：永远用 === 和 !==，别用 == 和 !=

### 坑3：NaN
**现象**：`NaN === NaN` 返回false，自己都不等于自己
**原因**：NaN的特殊规定
**解决**：判断是不是NaN用 `isNaN()` 或者 `Number.isNaN()`

### 坑4：0.1 + 0.2 !== 0.3
**现象**：`0.1 + 0.2 = 0.30000000000000004`
**原因**：浮点数精度问题（所有编程语言都有这问题）
**解决**：金额计算用整数（分），或者用toFixed保留小数位

### 坑5：var没有块级作用域
**现象**：for循环里用var声明的i，循环结束外面还能访问到
**原因**：var是函数作用域，不是块级作用域
**解决**：用let！用let！用let！

### 坑6：this指向混乱
**现象**：同样一个函数，不同的调用方式，this不一样
**原因**：this是函数调用时决定的，不是定义时决定的
**解决**：
- 普通函数调用：this指向window（严格模式是undefined）
- 对象方法调用：this指向对象
- 构造函数调用：this指向新创建的对象
- 箭头函数：没有自己的this，继承外层的

### 坑7：数组是对象
**现象**：`typeof []` 返回 'object'
**原因**：数组本质上也是对象
**解决**：判断是不是数组用 `Array.isArray(arr)`

### 坑8：sort默认按字符串排序
**现象**：`[1, 10, 2, 20].sort()` 变成 `[1, 10, 2, 20]`
**原因**：sort默认把元素转成字符串再比较
**解决**：传比较函数：`arr.sort((a, b) => a - b)`

### 坑9：事件绑定后移除不了
**现象**：addEventListener绑定的事件，removeEventListener移除不掉
**原因**：移除的函数和绑定的函数不是同一个（匿名函数每次都是新的）
**解决**：把处理函数单独定义成具名函数，绑定和移除都用同一个

### 坑10：JS是单线程的
**现象**：定时器不准时，或者页面卡死了
**原因**：JS只有一个线程，同一时间只能做一件事
**解决**：耗时操作放到异步里，理解事件循环机制

---

## 十一、总结与后续学习建议

### 11.1 本篇要点回顾

回顾一下这篇文章的核心内容：

**基础语法部分：**
1. **变量**：let和const，小驼峰命名
2. **数据类型**：number、string、boolean、undefined、null、对象、数组
3. **运算符**：算术、比较、逻辑，记住用 ===
4. **流程控制**：if/else、switch、for、while
5. **函数**：封装代码，参数和返回值，作用域
6. **数组**：push/pop、map/filter/reduce等常用方法
7. **对象**：键值对集合，增删改查

**Web API部分：**
8. **DOM操作**：获取元素（querySelector）、操作内容和样式、创建删除元素
9. **事件**：addEventListener绑定事件、事件对象、事件冒泡、事件委托

### 11.2 怎么学好JavaScript？

JS比HTML和CSS难多了，因为它是真正的编程语言，需要逻辑思维。给你几条建议：

**✅ 正确的姿势：**
- 多动手写，光看不练等于白学
- 多做项目，在实战中成长
- 多调试，console.log和F12是你最好的朋友
- 多思考，理解原理而不是死记硬背
- 踩坑别怕，每个坑都是成长的机会

**❌ 错误的姿势：**
- 收藏了一堆教程，一篇都没看完
- 看视频觉得"我会了"，一动手就懵
- 遇到问题就问，不自己先想想
- 追求速成，基础不牢就想学框架

我常跟新手说：**JS这东西，没有捷径，就是多写多练。写够1万行代码，你就入门了；写够10万行，你就熟练了。**

### 11.3 接下来学什么？

学完JS基础，你已经可以做一些简单的交互了。接下来的学习方向：

```
JS基础 → ES6+新特性 → 异步编程 → 面向对象 → Vue/React框架 → Node.js
```

重点推荐学的内容：
1. **ES6+新特性**：箭头函数、解构赋值、展开运算符、Promise、async/await、模块化等
2. **异步编程**：JS的核心难点，回调、Promise、async/await一定要搞懂
3. **DOM和BOM**：更深入地学习浏览器API
4. **Vue.js 或 React**：前端框架，工作必备，推荐先学Vue，上手快

### 11.4 学习资源推荐

- **MDN JavaScript文档**：最权威的JS参考手册，遇到不会的就查
- **现代JavaScript教程**：非常棒的在线教程，从基础到高级都有
- **GitHub**：多看别人的代码，学习优秀的写法
- **掘金/CSDN**：看技术博客，了解行业动态

---

> 💬 **最后说两句**：
> 
> 恭喜你看完了这篇12000字的JS速成教程！能坚持看到这里，说明你是真的想学前端，而且有毅力。
> 
> 说实话，JS这东西入门不难，但要学好真的不容易。我刚开始学的时候，什么闭包、原型链、异步，看的我头都大了。但后来写得多了，慢慢就理解了。
> 
> 学习编程就是这样，不可能一蹴而就。慢慢来，别着急，谁都是从小白过来的。重要的是坚持，每天进步一点点，时间长了你就会发现自己已经走了很远。
> 
> 现在就打开你的编辑器，把Todo项目敲一遍，再试着加一些自己的功能。有什么问题欢迎在评论区交流~
> 
> **万水千山总是情，点个👍行不行？** 你的点赞收藏是我更新的最大动力！

---

*相关推荐：《HTML零基础速成：3小时搞定网页骨架》《CSS零基础速成：3小时让你的网页颜值翻倍》*
