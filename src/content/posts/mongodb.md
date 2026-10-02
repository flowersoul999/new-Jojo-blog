---
title: "MongoDB 快速入门：从 JSON 到 Mongoose 实战"
published: 2026-09-09
description: "MongoDB 快速入门：从 JSON 到 Mongoose 实战，文档模型、增删改查、索引、聚合、Node.js 实战连接。"
tags: ["MongoDB","Mongoose"]
category: "数据库"
image: "/blogs/数据库/mongodb-cover.jpg"
author: "jojo"
draft: false
comment: true
lang: "zh-CN"
aiPolished: false
---
# MongoDB 快速入门：从 JSON 到 Mongoose 实战

> 目录
>
> 1. [MongoDB 是什么](#一mongodb-是什么)
> 2. [核心概念：和 MySQL 对比着学](#二核心概念和-mysql-对比着学)
> 3. [安装和基本命令](#三安装和基本命令)
> 4. [Mongoose：Node.js 的最佳拍档](#四mongoosenodejs-的最佳拍档)
> 5. [增删改查（CRUD）详解](#五增删改查crud详解)
> 6. [高级查询：条件、排序、分页](#六高级查询条件排序分页)
> 7. [聚合管道](#七聚合管道)
> 8. [索引](#八索引)
> 9. [实战：博客系统模型设计](#九实战博客系统模型设计)
> 10. [MongoDB vs MySQL 怎么选](#十mongodb-vs-mysql-怎么选)
> 11. [面试八股](#十一面试八股)
> 12. [总结](#十二总结)

---

## 一、MongoDB 是什么

一句话：**MongoDB 是一个存 JSON 的数据库。**

你已经很熟悉 JSON 了吧？MongoDB 存的就是 JSON 格式的数据——只不过它叫「文档」（Document）。

对于前端开发者来说，MongoDB 几乎是零学习成本的数据库——因为你天天都在写 JSON。

> 想象一下：你把一个 JS 对象直接塞进数据库，取出来还是那个对象，不用转换、不用映射。就是这么直接。

### 为什么叫「文档型」数据库

传统的 MySQL 是**关系型数据库**，数据存在一张张表里，就像 Excel：

```
用户表：
| id | name  | age | email         |
|----|-------|-----|---------------|
| 1  | 张三  | 20  | zhang@xx.com  |
| 2  | 李四  | 25  | li@xx.com     |
```

MongoDB 是**文档型数据库**，数据存的是一个个 JSON 文档：

```js
// 用户集合（users）里的一条文档
{
  _id: ObjectId("650..."),
  name: "张三",
  age: 20,
  email: "zhang@xx.com",
  hobbies: ["篮球", "音乐"],  // 数组也能直接存
  address: {                   // 嵌套对象也能直接存
    city: "北京",
    street: "某某路"
  }
}
```

看到了吗？数组、嵌套对象，想存就存，不用改表结构。灵活得很。

---

## 二、核心概念：和 MySQL 对比着学

学 MongoDB 最快的方式就是和 MySQL 对比，很多概念是一一对应的。

| MySQL 概念 | MongoDB 概念 | 说明 |
|-----------|-------------|------|
| Database（数据库） | Database（数据库） | 一样，就是一个库 |
| Table（表） | Collection（集合） | 表 vs 集合，都是一组数据 |
| Row（行） | Document（文档） | 一条数据 |
| Column（列） | Field（字段） | 一个字段/属性 |
| JOIN（关联查询） | 嵌入文档 / $lookup | MySQL 用 JOIN，MongoDB 可以直接嵌进去 |
| 主键（Primary Key） | _id | MongoDB 自动生成的唯一 ID |
| SQL 语句 | MQL（MongoDB Query Language） | 查询语法不一样 |
| 不支持 | 数组、嵌套对象 | MongoDB 直接存 JSON，支持复杂结构 |

### 一个直观的对比

**MySQL 的用户表：**
```
+----+--------+-----+----------------+
| id | name   | age | email          |
+----+--------+-----+----------------+
| 1  | 张三   | 20  | zhang@xx.com   |
+----+--------+-----+----------------+
```

**MongoDB 的用户集合：**
```js
{
  _id: ObjectId("..."),
  name: "张三",
  age: 20,
  email: "zhang@xx.com"
}
```

**但是！MongoDB 还能这么存：**

```js
{
  _id: ObjectId("..."),
  name: "张三",
  age: 20,
  email: "zhang@xx.com",
  hobbies: ["篮球", "游泳", "音乐"],    // 数组
  address: {                              // 嵌套对象
    city: "北京",
    zipCode: "100000"
  },
  orders: [                               // 订单列表直接嵌进去
    { id: 1, product: "iPhone", price: 5999 },
    { id: 2, product: "AirPods", price: 1999 }
  ]
}
```

在 MySQL 里，你得建三张表（用户表、地址表、订单表），查询的时候 JOIN 半天。MongoDB 里一条文档就搞定了。

**这就是 MongoDB 的优势：结构灵活，读起来快。**

---

## 三、安装和基本命令

### 1. 安装 MongoDB

去官网下载 MongoDB Community Server，安装的时候一路下一步就行。

**也可以用图形化工具**：推荐 **MongoDB Compass**（官方的，免费），或者 **Navicat**、**DBeaver**，和看 MySQL 一样直观。

### 2. 基本命令（mongo shell）

安装完后在命令行输入 `mongosh` 就能进入 MongoDB 的交互终端。

```bash
# 查看所有数据库
show dbs

# 切换数据库（没有就自动创建）
use mydb

# 查看当前数据库下的集合
show collections

# 插入一条数据
db.users.insertOne({ name: "张三", age: 20 })

# 查询所有
db.users.find()

# 条件查询
db.users.find({ age: 20 })

# 修改
db.users.updateOne({ name: "张三" }, { $set: { age: 21 } })

# 删除
db.users.deleteOne({ name: "张三" })
```

> 实际开发中一般不用命令行操作，要么用图形化工具，要么用代码里的 Mongoose 操作。

### 3. _id 是什么

每个文档都有一个 `_id` 字段，相当于主键，唯一标识一条文档。

```js
_id: ObjectId("650abc123def456...")
```

特点：
- 自动生成，不用手动指定
- 全局唯一，不会重复
- 里面包含了时间戳（可以提取出创建时间）
- 是 ObjectId 类型，不是普通字符串，比较的时候要注意类型

你也可以自己指定 `_id`（比如用自增数字、UUID），但一般直接用自动生成的就行。

---

## 四、Mongoose：Node.js 的最佳拍档

直接用原生 MongoDB 驱动写代码有点糙，一般都用 **Mongoose**——一个 MongoDB 的 ODM（对象文档映射）工具，类似 MySQL 的 ORM。

> ODM 是什么？就是把数据库的文档映射成 JS 对象，你操作对象就等于操作数据库，不用手写原生查询。

### 安装

```bash
npm install mongoose
```

### 连接数据库

```js
const mongoose = require('mongoose')

// 连接格式：mongodb://用户名:密码@地址:端口/数据库名
mongoose.connect('mongodb://localhost:27017/mydb')
  .then(() => console.log('连接成功'))
  .catch(err => console.error('连接失败:', err))
```

连接成功之后就可以开始定义模型了。

### Mongoose 的三剑客：Schema、Model、Document

| 概念 | 作用 | 类比 |
|------|------|------|
| Schema | 定义数据结构（有哪些字段、什么类型、什么约束） | 像「设计图纸」 |
| Model | 根据 Schema 生成的模型，用来操作数据库 | 像「工厂」，能生产和查询文档 |
| Document | Model 创建出来的实例，对应一条具体的文档 | 像「产品」 |

#### 第一步：定义 Schema（画图纸）

```js
const userSchema = new mongoose.Schema({
  name: {
    type: String,          // 类型：字符串
    required: true,        // 必填
  },
  age: {
    type: Number,
    default: 18,           // 默认值
    min: 0,                // 最小值
    max: 120,              // 最大值
  },
  email: {
    type: String,
    unique: true,          // 唯一约束
  },
  role: {
    type: String,
    enum: ['user', 'admin'],  // 只能是这两个值之一
    default: 'user',
  },
  hobbies: [String],         // 字符串数组
  address: {                 // 嵌套对象
    city: String,
    street: String,
  },
}, {
  timestamps: true,          // 自动加 createdAt 和 updatedAt
})
```

**Schema 里能定义什么？**

- 字段类型：String、Number、Boolean、Date、Array、Object、ObjectId...
- 校验：required、min、max、enum、unique、自定义 validator
- 默认值：default
- 时间戳：timestamps（自动加创建和更新时间）

> MongoDB 本身是无模式的——你第一条存 3 个字段、第二条存 8 个字段都能存。但实际项目里必须用 Schema 来约束，不然数据就乱了。

#### 第二步：生成 Model（建工厂）

```js
const User = mongoose.model('User', userSchema)

module.exports = User
```

`mongoose.model('User', userSchema)` 会自动对应到 MongoDB 里的 `users` 集合（自动转小写加 s）。

#### 第三步：用 Model 操作数据库（生产产品）

```js
// 创建一个用户
const user = new User({ name: '张三', age: 20 })
await user.save()

// 或者直接用 create
await User.create({ name: '张三', age: 20 })

// 查询
const users = await User.find()
```

---

## 五、增删改查（CRUD）详解

下面全是 Mongoose 的写法，实际项目里就用这些。

### C：新增（Create）

```js
// 方式一：new + save
const user = new User({ name: '张三', age: 20 })
await user.save()

// 方式二：create（更常用）
const user = await User.create({ name: '张三', age: 20 })

// 批量插入
const users = await User.insertMany([
  { name: '张三', age: 20 },
  { name: '李四', age: 25 },
  { name: '王五', age: 30 },
])
```

### R：查询（Read）

```js
// 查询所有
const users = await User.find()

// 条件查询
const users = await User.find({ age: 20 })

// 查询单条
const user = await User.findOne({ name: '张三' })

// 按 ID 查询
const user = await User.findById('650abc123...')

// 只查指定字段（第二个参数）
const users = await User.find({}, 'name age')  // 只返回 name 和 age

// 排除字段
const users = await User.find({}, '-password')  // 不返回 password
```

### U：更新（Update）

```js
// 更新一条（返回更新后的数据，用 new: true）
const user = await User.findOneAndUpdate(
  { name: '张三' },          // 条件
  { age: 21 },               // 更新内容
  { new: true }              // 选项：返回更新后的数据
)

// 按 ID 更新
const user = await User.findByIdAndUpdate(
  '650abc123...',
  { age: 21 },
  { new: true }
)

// 只更新，不返回
await User.updateOne({ name: '张三' }, { age: 21 })

// 批量更新
await User.updateMany({ age: { $lt: 18 } }, { role: 'teen' })
```

**注意 `new: true`**：不加的话返回的是更新**前**的数据，加了才返回更新**后**的。99% 的情况你想要的都是更新后的数据，所以记得加上。

### D：删除（Delete）

```js
// 删除一条
await User.deleteOne({ name: '张三' })

// 按 ID 删除
await User.findByIdAndDelete('650abc123...')

// 批量删除
await User.deleteMany({ age: { $lt: 18 } })
```

> 注意：Mongoose 里推荐用 `findByIdAndDelete`，而不是 `remove()`。

---

## 六、高级查询：条件、排序、分页

### 比较运算符

| Mongoose 符号 | 含义 | 例子 |
|--------------|------|------|
| `$gt` | 大于（greater than） | `{ age: { $gt: 20 } }` 年龄 > 20 |
| `$gte` | 大于等于 | `{ age: { $gte: 20 } }` |
| `$lt` | 小于（less than） | `{ age: { $lt: 30 } }` |
| `$lte` | 小于等于 | `{ age: { $lte: 30 } }` |
| `$ne` | 不等于（not equal） | `{ role: { $ne: 'admin' } }` |
| `$in` | 在数组里 | `{ role: { $in: ['user', 'vip'] } }` |
| `$nin` | 不在数组里 | `{ role: { $nin: ['banned'] } }` |

```js
// 年龄在 20 到 30 之间
const users = await User.find({ age: { $gte: 20, $lte: 30 } })

// 角色是 user 或 admin
const users = await User.find({ role: { $in: ['user', 'admin'] } })
```

### 逻辑运算符

| 符号 | 含义 |
|------|------|
| `$and` | 且 |
| `$or` | 或 |
| `$not` | 非 |

```js
// 年龄 > 20 且 角色是 admin
await User.find({ $and: [{ age: { $gt: 20 } }, { role: 'admin' }] })

// 名字叫张三 或者 年龄 > 30
await User.find({ $or: [{ name: '张三' }, { age: { $gt: 30 } }] })
```

### 模糊查询（正则）

```js
// 名字里包含「张」的（模糊搜索）
await User.find({ name: { $regex: '张', $options: 'i' } })

// $options: 'i' 表示不区分大小写
// 以张开头
await User.find({ name: { $regex: '^张' } })

// 以三结尾
await User.find({ name: { $regex: '三$' } })
```

### 排序

```js
// 按年龄升序（从小到大）
await User.find().sort({ age: 1 })

// 按年龄降序（从大到小）
await User.find().sort({ age: -1 })

// 多重排序：先按年龄升序，年龄一样按创建时间降序
await User.find().sort({ age: 1, createdAt: -1 })
```

`1` 是升序，`-1` 是降序。记住：**正升负降**。

### 分页

```js
const page = 1   // 第几页
const size = 10  // 每页几条

// 查询总数
const total = await User.countDocuments(query)

// 查询分页数据
const list = await User.find(query)
  .sort({ createdAt: -1 })   // 排序
  .skip((page - 1) * size)   // 跳过前面几条
  .limit(size)               // 取几条
```

和 MySQL 的 `LIMIT offset, count` 是一个意思。

### 链式调用

`find()` 返回的是 Query 对象，可以链式调用：

```js
await User.find({ role: 'user' })
  .sort({ age: -1 })
  .skip(10)
  .limit(10)
  .select('name age')   // 只返回 name 和 age
```

### 数量统计

```js
// 总数
const count = await User.countDocuments()

// 条件统计
const count = await User.countDocuments({ role: 'admin' })

// 查询的结果有多少条
const count = await User.find({ age: { $gt: 20 } }).countDocuments()
```

---

## 七、聚合管道

如果普通查询满足不了需求（比如分组统计、多表关联），就要用**聚合管道**（Aggregation Pipeline）。

你可以把它想象成流水线：

```
原始数据 → $match（筛选） → $group（分组） → $sort（排序） → 最终结果
```

每一步处理完，把结果传给下一步。一步步处理，像流水线一样。

### 例子 1：按角色分组，统计每个角色有多少人

```js
const result = await User.aggregate([
  {
    $group: {
      _id: '$role',           // 按 role 分组
      count: { $sum: 1 },     // 每组计数
      avgAge: { $avg: '$age' } // 每组的平均年龄
    }
  }
])
```

结果大概长这样：
```js
[
  { _id: 'user', count: 100, avgAge: 25.3 },
  { _id: 'admin', count: 5, avgAge: 30.2 }
]
```

### 例子 2：筛选 + 分组 + 排序

```js
const result = await User.aggregate([
  // 第一步：筛选年龄大于 18 的
  { $match: { age: { $gt: 18 } } },

  // 第二步：按城市分组
  {
    $group: {
      _id: '$address.city',
      total: { $sum: 1 },
    }
  },

  // 第三步：按人数从多到少排序
  { $sort: { total: -1 } },

  // 第四步：取前 5 名
  { $limit: 5 },
])
```

### 例子 3：关联查询（\$lookup）

MongoDB 也能像 MySQL 的 JOIN 一样关联两张表：

```js
// 订单集合关联用户集合
const result = await Order.aggregate([
  {
    $lookup: {
      from: 'users',           // 关联哪个集合
      localField: 'userId',    // 当前集合的哪个字段
      foreignField: '_id',     // 目标集合的哪个字段
      as: 'userInfo',          // 结果存到哪个字段
    }
  }
])
```

这和 MySQL 的 LEFT JOIN 差不多。

**但一般不推荐频繁用 \$lookup**——MongoDB 的设计理念就是「能嵌就嵌」，把关联数据直接嵌到文档里，读的时候一次读出来，比关联查询快多了。

### 常用聚合阶段

| 阶段 | 作用 | 类比 SQL |
|------|------|---------|
| `$match` | 筛选数据 | WHERE |
| `$group` | 分组 | GROUP BY |
| `$sort` | 排序 | ORDER BY |
| `$skip` / `$limit` | 分页 | LIMIT |
| `$project` | 投影（选哪些字段） | SELECT |
| `$lookup` | 关联查询 | JOIN |
| `$count` | 计数 | COUNT |
| `$unwind` | 拆分数组 | — |

---

## 八、索引

索引是数据库性能优化的第一手段，和 MySQL 的索引是一个道理——就像字典的目录，有了目录找字就快。

### 创建索引

```js
// 在 Schema 里定义
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
})

// 给 name 加普通索引
userSchema.index({ name: 1 })

// 给 email 加唯一索引
userSchema.index({ email: 1 }, { unique: true })

// 复合索引（多个字段一起）
userSchema.index({ name: 1, age: -1 })
```

`1` 是升序索引，`-1` 是降序索引。单字段索引升序降序区别不大，复合索引有影响。

### 索引的代价

索引不是越多越好：

- **好处**：查询变快
- **代价 1**：写入变慢 —— 每次插入/更新都要更新索引
- **代价 2**：占空间 —— 索引本身也要占存储空间

**原则**：经常查的字段才加索引，写入多的字段少加索引。

### 查看索引

```js
// 查看集合有哪些索引
await User.collection.getIndexes()

// 查看查询有没有走索引
await User.find({ name: '张三' }).explain('executionStats')
// 看 executionStats.executionStage 是不是 COLLSCAN（全表扫描）
// 走了索引就是 IXSCAN
```

---

## 九、实战：博客系统模型设计

光说不练假把式，我们来设计一个博客系统的数据模型，看看 MongoDB 怎么组织数据。

### 需求

- 用户（User）：用户名、密码、邮箱、头像、简介
- 文章（Post）：标题、内容、作者、分类、标签、浏览量、评论
- 评论（Comment）：评论人、评论内容、评论时间
- 分类（Category）：分类名

### 设计思路：嵌入还是引用？

MongoDB 设计的核心问题：**哪些数据嵌进去，哪些数据单独建集合？**

**嵌入的优点**：一次查询就能拿到所有数据，读得快
**引用的优点**：数据不冗余，修改方便

**判断标准**：
- 如果是「包含」关系，且不会变得很大 → 嵌入
- 如果数据会被多处引用，且经常改 → 单独建集合 + 引用

### 模型设计

#### 1. 用户模型

```js
// models/User.js
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },  // select: false 表示查询时默认不返回
  email: String,
  avatar: String,
  bio: String,
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
```

#### 2. 分类模型

```js
// models/Category.js
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  sort: { type: Number, default: 0 },
}, { timestamps: true })

module.exports = mongoose.model('Category', categorySchema)
```

#### 3. 文章模型

```js
// models/Post.js
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: String,
  cover: String,

  // 作者：引用用户（单独集合，因为用户信息可能改）
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // 分类：引用分类集合
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },

  // 标签：直接存数组，因为标签就是几个字符串
  tags: [String],

  // 统计数据
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },

  // 评论：嵌入进去？还是单独建表？
  // 评论不多的话可以嵌，评论多的话建议单独建集合
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      content: String,
      createdAt: { type: Date, default: Date.now },
    }
  ],

  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
}, {
  timestamps: true,
})

// 给标题加全文索引，支持搜索
postSchema.index({ title: 'text', content: 'text' })

module.exports = mongoose.model('Post', postSchema)
```

### 查询示例：文章详情 + 作者信息

```js
// 查文章详情，同时把作者信息带出来
const post = await Post.findById(id)
  .populate('author', 'username avatar')  // 关联作者，只取用户名和头像
  .populate('category', 'name')           // 关联分类
  .populate('comments.user', 'username avatar')  // 关联评论里的用户
```

`populate` 就是「把引用的 ID 换成对应的文档」，类似 MySQL 的 JOIN。底层是分两次查询的，不是真正的 JOIN。

### 性能思考

- 列表页文章很多，每条都 `populate('author')`，会查 N+1 次数据库吗？
  - 不会，Mongoose 做了优化，会把所有作者 ID 收集起来，一次查出来，再分配给对应文章

- 评论如果很多，嵌在文章里会不会导致文档太大？
  - 会的。评论超过几百条的话，建议单独建 Comment 集合，用文章 ID 关联

---

## 十、MongoDB vs MySQL 怎么选

| 对比项 | MongoDB | MySQL |
|--------|---------|-------|
| 数据模型 | 文档型（JSON） | 关系型（表） |
| 结构灵活性 | 高，字段随时加 | 低，要改表结构 |
| 查询语言 | MQL（JS 风格） | SQL |
| 事务支持 | 一般（4.0 以后支持，但性能一般） | 强 |
| 关联查询 | 弱（\$lookup 性能一般） | 强（JOIN 很成熟） |
| 大数据量性能 | 好（水平扩展容易） | 还可以（分库分表麻烦） |
| 上手难度 | 低（前端友好，就是 JSON） | 稍高（要学 SQL） |
| 适合场景 | 博客、社交、IoT、日志 | 电商、金融、OA、企业系统 |

### 什么时候选 MongoDB？

1. **数据结构不确定，经常变** —— 比如社交产品，需求老改，字段随时加
2. **嵌套多、数组多** —— 比如文章的评论、商品的规格、用户的爱好
3. **读多写少，追求读取速度** —— 嵌入式设计读起来快
4. **前端团队全栈开发** —— 不用学 SQL，直接写 JS

### 什么时候选 MySQL？

1. **数据关系复杂** —— 订单、库存、支付，关系绕来绕去
2. **事务要求高** —— 金融、电商，转账、下单必须事务
3. **数据一致性要求高** —— 不能有脏数据
4. **传统企业项目** —— 大部分企业系统还是 MySQL 为主

### 能不能一起用？

当然可以！很多项目是混合用的：

- 用户、订单、支付 → MySQL（事务、一致性）
- 文章、评论、日志、消息 → MongoDB（灵活、读得快）

根据业务场景选合适的数据库，不是非此即彼。

---

## 十一、面试八股

下面是 MongoDB 的高频面试题。

### 1. MongoDB 是什么？和关系型数据库有什么区别？

**参考答案：**

MongoDB 是一个文档型 NoSQL 数据库，存储的是 BSON 格式的文档（可以理解为 JSON）。

和关系型数据库（MySQL）的区别：

| 对比项 | MongoDB | MySQL |
|--------|---------|-------|
| 数据模型 | 文档（JSON） | 表、行、列 |
| 结构 | 灵活，动态模式 | 固定，需要先定义表结构 |
| 查询语言 | MQL | SQL |
| 事务 | 支持但较弱 | 成熟稳定 |
| 关联 | 嵌入文档或 $lookup | JOIN，功能强 |
| 扩展方式 | 水平扩展（分片） | 垂直扩展为主，分库分表复杂 |
| 适合场景 | 数据结构多变、读多写少 | 关系复杂、事务要求高 |

**一句话总结**：MongoDB 存的是 JSON，灵活、上手快；MySQL 存的是表，严谨、事务强。

---

### 2. 什么是文档、集合、数据库？

**参考答案：**

对应关系：

| MySQL | MongoDB | 说明 |
|-------|---------|------|
| Database | Database | 数据库，一样的 |
| Table | Collection | 表 vs 集合，都是一组同类数据 |
| Row | Document | 行 vs 文档，一条数据 |
| Column | Field | 列 vs 字段 |

- **数据库（Database）**：最高层级，存放多个集合
- **集合（Collection）**：一组文档的集合，类似表
- **文档（Document）**：一条具体的数据，JSON/BSON 格式

---

### 3. Mongoose 是什么？为什么要用它？

**参考答案：**

Mongoose 是 MongoDB 的 ODM（Object Document Mapper，对象文档映射）库，在 Node.js 项目中广泛使用。

**为什么要用？**

1. **Schema 约束** —— MongoDB 本身是无模式的，但实际项目需要约束。Mongoose 的 Schema 能定义字段类型、默认值、校验规则，保证数据一致性。
2. **模型化操作** —— 用 Model 操作数据库，API 友好，比原生驱动写起来更简洁。
3. **中间件** —— pre/post 钩子，可以在 save、find 前后做处理（比如密码加密、字段转换）。
4. **类型推导** —— TypeScript 支持好，有类型提示。
5. **内置方法多** —— 分页、排序、populate 关联查询，都是封装好的。

简单说：原生 MongoDB 驱动就像原生 JS，Mongoose 就像 jQuery/框架，用起来更方便。

---

### 4. MongoDB 的索引有了解吗？

**参考答案：**

索引能大大加快查询速度。MongoDB 的索引是 B 树结构（和 MySQL 类似）。

**常见索引类型：**

1. **单字段索引** —— 给单个字段加索引
2. **复合索引** —— 多个字段组合的索引，遵循最左前缀原则
3. **唯一索引** —— 保证字段值唯一，比如用户名、邮箱
4. **文本索引** —— 支持全文搜索
5. **数组索引** —— 对数组字段建索引，数组每个元素都会被索引

**索引不是越多越好：**
- 好处：查询变快
- 坏处：写入变慢（每次写入都要更新索引）、占存储空间

**怎么判断有没有走索引**：用 `explain()` 查看执行计划，`IXSCAN` 是走了索引，`COLLSCAN` 是全表扫描（慢）。

---

### 5. 什么是聚合管道？常用的阶段有哪些？

**参考答案：**

聚合管道（Aggregation Pipeline）是 MongoDB 处理复杂查询的方式，数据经过一系列「阶段」的处理，每一步处理完传给下一步，像流水线一样。

**常用阶段：**

| 阶段 | 作用 |
|------|------|
| `$match` | 筛选数据（WHERE） |
| `$group` | 分组统计（GROUP BY） |
| `$sort` | 排序（ORDER BY） |
| `$skip` / `$limit` | 分页 |
| `$project` | 投影，选择/重命名字段 |
| `$lookup` | 关联查询（LEFT JOIN） |
| `$count` | 统计数量（COUNT） |
| `$unwind` | 拆分数组 |

**优化原则**：`$match` 尽量放前面，先过滤再处理，减少后续处理的数据量。

---

### 6. MongoDB 里的 \_id 是什么类型？有什么特点？

**参考答案：**

`_id` 是 MongoDB 每个文档默认的主键，类型是 `ObjectId`，是一个 12 字节的 BSON 类型。

**结构（12 字节）：**
- 4 字节：时间戳（秒级）
- 5 字节：随机值（进程 + 机器标识）
- 3 字节：递增计数器

**特点：**
1. **全局唯一** —— 不会重复
2. **包含时间戳** —— 可以从 `_id` 里提取出文档的创建时间，不用单独存 `createdAt`
3. **不是字符串** —— 是 ObjectId 类型，和字符串比较要注意类型
4. **自动生成** —— 插入时不指定 `_id` 会自动生成

> 小技巧：`ObjectId('xxx').getTimestamp()` 能拿到创建时间。

---

### 7. MongoDB 支持事务吗？

**参考答案：**

MongoDB 从 4.0 版本开始支持多文档事务，但有前提条件：

- 4.0 版本：支持副本集上的多文档事务
- 4.2 版本：支持分片集群上的多文档事务

**和 MySQL 的事务比：**
- MongoDB 也支持 ACID
- 但性能不如 MySQL 的事务，适用场景有限
- 事务不能太大，有 16MB 的限制
- 一般不推荐重度依赖事务

**实际使用建议**：能通过文档嵌入解决的就用嵌入设计，尽量减少事务的使用。真的需要强事务的场景，还是用 MySQL 更合适。

---

### 8. 嵌入文档和引用文档怎么选？

**参考答案：**

这是 MongoDB 设计的核心问题。

**嵌入文档（Embed）**：把子文档直接嵌到父文档里
- 优点：一次查询就能拿到全部数据，读得快
- 缺点：数据冗余，修改麻烦，子文档太多时文档会很大

**引用文档（Reference）**：只存子文档的 ID，查的时候用 populate / $lookup 关联
- 优点：数据不冗余，修改方便
- 缺点：要查两次（或多次），读得慢

**选型原则：**

| 情况 | 推荐方式 |
|------|---------|
| 子数据量小，不怎么改 | 嵌入 |
| 子数据经常独立修改 | 引用 |
| 子数据会很多（几百条以上） | 引用，单独建集合 |
| 数据总是一起读 | 嵌入 |
| 数据经常独立用 | 引用 |

比如：
- 用户的收货地址 → 嵌入（少、一起用）
- 文章的评论 → 评论少就嵌，评论多就单独建表
- 订单的商品 → 嵌入快照（下单时的商品数据不能变）

---

### 9. 什么是 MongoDB 的分片（Sharding）？

**参考答案：**

分片是 MongoDB 的水平扩展方案，把数据分散到多台服务器上，每台服务器只存一部分数据。

**为什么需要分片？**
- 数据量太大，一台服务器存不下
- 读写压力太大，一台服务器扛不住

**三个核心组件：**
1. **Shard（分片服务器）** —— 真正存数据的，每个分片存一部分数据
2. **Mongos（路由）** —— 对外提供服务，知道数据在哪个分片上，转发请求
3. **Config Server（配置服务器）** —— 存元数据，记录数据和分片的对应关系

**分片键（Shard Key）**：决定数据按什么字段分到不同分片上。分片键选得好不好直接影响性能——选不好会导致数据倾斜（某一个分片数据特别多）。

> 一般中小项目用不上分片，单台服务器 + 副本集就够了。数据量真的大到一定程度才需要分片。

---

### 10. MongoDB 怎么实现分页？大量数据时怎么优化？

**参考答案：**

**普通分页**：用 `skip + limit`

```js
const list = await Post.find()
  .sort({ createdAt: -1 })
  .skip((page - 1) * size)
  .limit(size)
```

**问题**：数据量大的时候，`skip` 跳过很多数据会很慢。

**优化方式**：用「上次最后一条的标识」来分页（类似微博的加载更多）：

```js
// 第一页：直接查
const list = await Post.find()
  .sort({ _id: -1 })
  .limit(size)

// 第二页及以后：带上最后一条的 id
const list = await Post.find({ _id: { $lt: lastId } })
  .sort({ _id: -1 })
  .limit(size)
```

原理：利用索引的范围查询，比 `skip` 跳过大量数据快得多。

---

### 11. populate 是什么？底层原理是什么？

**参考答案：**

`populate` 是 Mongoose 提供的关联查询方法，可以把文档里引用的 ID 替换成对应的文档。

```js
// 文章里存了作者 ID
const post = await Post.findById(id).populate('author')
// post.author 就从 ID 变成了用户对象
```

**底层原理**：
- 不是真正的 JOIN（MongoDB 是文档数据库，没有 MySQL 那种 JOIN）
- 是分两次查询的：先查文章，拿到所有作者 ID，再去用户集合查这些 ID 对应的用户，最后把结果组装到一起
- 如果查 10 篇文章，populate 作者，也只会多查一次用户（不是 10 次），因为 Mongoose 会把所有 ID 收集起来一次查完

**缺点**：多次查询，不如嵌入文档快。适合关联不复杂的场景。

---

### 12. MongoDB 有什么缺点？

**参考答案：**

1. **不支持复杂事务** —— 虽然 4.0 以后有事务，但性能和成熟度不如关系型数据库
2. **不擅长复杂关联查询** —— \$lookup 功能和性能都不如 SQL 的 JOIN
3. **内存占用大** —— 索引和数据都会尽量放内存，吃内存
4. **空间占用大** —— 每个文档都存字段名，数据有冗余
5. **数据一致性不如关系型数据库** —— 灵活的代价就是一致性约束弱
6. **join 能力弱** —— 数据模型设计不好的话，查起来很麻烦

所以 MongoDB 不是银弹，要选合适的场景用。金融、电商这类强事务强关系的场景还是 MySQL 更合适。

---

## 十二、总结

MongoDB 对前端开发者来说是最友好的数据库——你已经会写 JSON 了，上手几乎零成本。

**快速回忆核心要点：**

1. **基础概念** —— 数据库 → 集合 → 文档，对应 MySQL 的 库 → 表 → 行
2. **Mongoose 三件套** —— Schema（画图纸）→ Model（建工厂）→ Document（生产产品）
3. **CRUD** —— `create` / `find` / `findByIdAndUpdate` / `findByIdAndDelete`
4. **查询条件** —— `$gt`、`$lt`、`$in`、`$regex`、`$or`
5. **排序分页** —— `sort({ age: -1 })`、`skip().limit()`
6. **聚合管道** —— `$match` → `$group` → `$sort`，像流水线一样
7. **索引** —— 加速查询，但写入会变慢，只给常查的字段加
8. **设计原则** —— 能嵌就嵌，嵌不下了再引用

**和 MySQL 的选择**：
- 结构灵活、读多写少 → MongoDB
- 关系复杂、事务要求高 → MySQL
- 大部分公司两者都用，各取所长

**学习建议**：先用 Mongoose 写一个博客或 Todo 的后端接口，感受一下 MongoDB 的操作方式。写完你就会发现——写起来真的很顺手，全是 JS 对象，不用学 SQL。
