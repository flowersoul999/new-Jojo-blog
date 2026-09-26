---
title: "MySQL 快速入门指南"
published: 2026-09-04
description: ""
tags: []
category: "技术总结"
draft: false
lang: "zh-CN"
---
前端转全栈开发，数据库是绕不开的一关。这篇文章用大白话把 MySQL 的核心知识讲一遍，从头到尾用一个「电商系统」的例子贯穿，看完就能上手写 SQL。

***

## 一、MySQL 是什么

用最简单的话说：**MySQL 是一个用来存数据的软件。**

你可以把它想象成一个超级加强版的 Excel：

| Excel       | MySQL           |
| ----------- | --------------- |
| 一个 .xlsx 文件 | 一个数据库（database） |
| 文件里的一个工作表   | 一张表（table）      |
| 表的每一行       | 一条记录（row）       |
| 表的每一列       | 一个字段（field）     |
| 在单元格里写公式    | 用 SQL 语句查询和操作数据 |

区别在于：Excel 是人手动操作的，MySQL 是用一种叫 **SQL** 的语言来操作的。程序（前端发请求 → 后端收到 → 后端执行 SQL）自动完成数据的增删改查。

### SQL 是什么

SQL（Structured Query Language，结构化查询语言）就是跟数据库「说话」用的语言。你告诉它「帮我存一条数据」「帮我查一下姓张的用户」「帮我把 id=5 的商品价格改成 99」，它就照做。

SQL 关键字不区分大小写，`SELECT` 和 `select` 是一样的。但习惯上关键字用大写，表名和字段名用小写，方便区分。

### SQL 语句分四类

| 分类  | 全名     | 干什么的       | 常用语句                 |
| --- | ------ | ---------- | -------------------- |
| DDL | 数据定义语言 | 建库、建表、改表结构 | CREATE、ALTER、DROP    |
| DML | 数据操作语言 | 增删改数据      | INSERT、UPDATE、DELETE |
| DQL | 数据查询语言 | 查数据        | SELECT               |
| DCL | 数据控制语言 | 管权限        | GRANT、REVOKE         |

日常开发中 90% 的时间在用 DML 和 DQL，也就是增删改查。DDL 偶尔用（建表的时候），DCL 基本不用（DBA 管的）。

***

## 二、安装和连接

### 安装 MySQL

去官网下载 MySQL Community Server，安装时记住你设置的 root 密码。Windows 推荐用 MySQL Installer，一路下一步就行。

安装完你会得到一个命令行工具叫 `mysql`，在终端输入：

```bash
mysql -u root -p
```

输入密码后就连上了 MySQL，可以开始敲 SQL 了。

### 用图形化工具

实际开发中没人天天对着命令行写 SQL。推荐用 **Navicat**、**DBeaver** 或 **DataGrip** 这类图形化工具，能可视化地看表结构、写 SQL、看结果，效率高很多。

### 用后端代码连接

后端代码里通过驱动连接 MySQL。比如 Node.js 项目里：

```js
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'shop',  // 数据库名
})
```

连上之后，后端代码就可以执行 SQL 了：

```js
const [rows] = await pool.query('SELECT * FROM products')
```

***

## 三、数据库和表的基本操作

### 创建数据库

就像建一栋楼之前要先划一块地，存数据之前要先建一个数据库：

```sql
CREATE DATABASE shop;
```

`shop` 是数据库名。建完之后要告诉 MySQL「我要用这个数据库」：

```sql
USE shop;
```

### 查看和删除数据库

```sql
-- 查看所有数据库
SHOW DATABASES;

-- 查看当前数据库
SELECT DATABASE();

-- 删除数据库（慎用，数据全没）
DROP DATABASE shop;
```

### 创建表

数据库建好了，里面还是空的。接下来建表——就像在 Excel 里创建一个工作表，先定好列名和列的类型。

我们建一个商品表：

```sql
CREATE TABLE products (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  price       DECIMAL(10, 2) NOT NULL,
  stock       INT DEFAULT 0,
  status      TINYINT DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

先不用看懂每个关键字，后面会逐个讲。这里先理解一个概念：**建表就是定义「这个表有几列，每列存什么类型的数据」。**

### 查看表

```sql
-- 查看当前数据库有哪些表
SHOW TABLES;

-- 查看 products 表的结构（有哪些字段、什么类型、什么约束）
DESC products;

-- 查看建表语句（能看到完整的 CREATE TABLE 代码）
SHOW CREATE TABLE products;
```

### 修改表结构

表建好了之后发现少了一列？可以加：

```sql
-- 给 products 表加一列 description
ALTER TABLE products ADD COLUMN description TEXT;

-- 修改列的类型
ALTER TABLE products MODIFY COLUMN name VARCHAR(200);

-- 改列名
ALTER TABLE products CHANGE COLUMN name product_name VARCHAR(200);

-- 删一列
ALTER TABLE products DROP COLUMN description;
```

### 删除表

```sql
DROP TABLE products;
```

**注意**：DROP 是物理删除，表和数据一起没了，没法恢复。生产环境千万慎重。

***

## 四、常用数据类型

MySQL 的数据类型很多，但实际开发中常用的就那么几个。

### 整数类型

| 类型      | 范围          | 用在哪              |
| ------- | ----------- | ---------------- |
| TINYINT | -128 \~ 127 | 状态值（0下架/1上架）、布尔值 |
| INT     | -21亿 \~ 21亿 | 主键 ID、库存数量、点赞数   |
| BIGINT  | 非常大         | 自增主键（数据量大时用）     |

**实际开发中**：状态字段用 `TINYINT`，ID 用 `INT` 或 `BIGINT`，其他整数也用 `INT`。不用纠结选哪个。

### 小数类型

| 类型             | 说明              | 用在哪        |
| -------------- | --------------- | ---------- |
| DECIMAL(10,2)  | 精确的小数，总10位，小数2位 | 价格、金额      |
| FLOAT / DOUBLE | 浮点数，有精度问题       | 科学计算（一般不用） |

**为什么价格用 DECIMAL 不用 FLOAT？** 因为浮点数在计算机里存储时有精度问题，`0.1 + 0.2` 可能等于 `0.30000000000000004`。算钱的时候差一分钱都是 bug，所以涉及金额的字段一律用 `DECIMAL`。

### 字符串类型

| 类型         | 说明               | 用在哪           |
| ---------- | ---------------- | ------------- |
| VARCHAR(n) | 可变长度字符串，最多 n 个字符 | 名字、标题、邮箱      |
| CHAR(n)    | 固定长度字符串          | 手机号（11位）、身份证号 |
| TEXT       | 大文本              | 文章内容、商品详情     |
| LONGTEXT   | 超大文本             | 超长文章          |

**实际开发中 90% 用 VARCHAR**。CHAR 只在长度固定时用（比如手机号永远 11 位）。大段文字用 TEXT。

### 日期和时间类型

| 类型        | 格式                  | 用在哪           |
| --------- | ------------------- | ------------- |
| DATE      | YYYY-MM-DD          | 生日、注册日期       |
| DATETIME  | YYYY-MM-DD HH:MM:SS | 创建时间、下单时间     |
| TIMESTAMP | YYYY-MM-DD HH:MM:SS | 时间戳（范围到2038年） |

**实际开发中**：创建时间、更新时间用 `DATETIME`，配合 `DEFAULT CURRENT_TIMESTAMP` 自动填入当前时间。

### 一张速查表

| 你要存什么     | 用什么类型        | 例子                                              |
| --------- | ------------ | ----------------------------------------------- |
| 主键 ID     | INT / BIGINT | `id INT PRIMARY KEY AUTO_INCREMENT`             |
| 名字、标题     | VARCHAR      | `name VARCHAR(50)`                              |
| 价格、金额     | DECIMAL      | `price DECIMAL(10,2)`                           |
| 数量、库存     | INT          | `stock INT`                                     |
| 状态（上架/下架） | TINYINT      | `status TINYINT DEFAULT 1`                      |
| 文章内容      | TEXT         | `content TEXT`                                  |
| 创建时间      | DATETIME     | `created_at DATETIME DEFAULT CURRENT_TIMESTAMP` |
| 手机号       | CHAR(11)     | `phone CHAR(11)`                                |

***

## 五、表的约束

约束就是给字段定规矩，不按规矩来的数据存不进去。

### 主键约束（PRIMARY KEY）

主键是表里每条记录的唯一标识，不能重复、不能为空。

```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  -- PRIMARY KEY：这一列是主键
  -- AUTO_INCREMENT：自动递增，不用手动填
  name VARCHAR(100)
);
```

**为什么要主键？** 就像每个人都有身份证号，每条数据也需要一个唯一标识，这样才能精确找到「这一条」记录。`id=5` 的商品就是 `id=5` 的商品，不会搞混。

### 非空约束（NOT NULL）

```sql
name VARCHAR(100) NOT NULL
```

商品名不能为空，插入时如果不写 name 就会报错。

**为什么用？** 有些字段必须有值，比如商品不能没有名字、用户不能没有手机号。加上 NOT NULL，数据库帮你挡住脏数据。

### 默认值约束（DEFAULT）

```sql
stock INT DEFAULT 0,
status TINYINT DEFAULT 1
```

插入数据时不填 stock，就自动用 0。不填 status，就自动是 1（上架）。

**为什么用？** 大部分商品的初始状态是一样的（库存 0、上架中），每次插入都手动写一遍太烦，设个默认值就行。

### 唯一约束（UNIQUE）

```sql
phone CHAR(11) UNIQUE
```

手机号不能重复。如果插入两条 phone 都是 `13800138000`，第二条会报错。

**为什么用？** 用户表里手机号不能重复、用户名不能重复。加 UNIQUE，数据库帮你检查，不用在代码里写。

### 自增（AUTO\_INCREMENT）

```sql
id INT PRIMARY KEY AUTO_INCREMENT
```

每次插入新数据，id 自动 +1（1、2、3、4...），不用手动指定。

### 实战：完整的建表语句

建一个用户表和一个商品表：

```sql
-- 用户表
CREATE TABLE users (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  username   VARCHAR(50) NOT NULL UNIQUE,
  password   VARCHAR(100) NOT NULL,
  phone      CHAR(11) UNIQUE,
  role       TINYINT DEFAULT 0 COMMENT '0普通用户 1管理员',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 商品表
CREATE TABLE products (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  stock       INT DEFAULT 0,
  status      TINYINT DEFAULT 1 COMMENT '0下架 1上架',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**COMMENT '...' 是什么？** 给字段加注释说明，方便别人看表结构时理解这个字段是干嘛的。不影响功能，但团队协作时很有用。

***

## 六、增：插入数据（INSERT）

表建好了，开始往里面存数据。

### 基本语法

```sql
INSERT INTO 表名 (字段1, 字段2, ...) VALUES (值1, 值2, ...);
```

### 插入一条商品

```sql
INSERT INTO products (name, price, stock)
VALUES ('iPhone 15', 5999.00, 100);
```

id、status、created\_at 没写，但不会报错，因为：

- id 有 AUTO\_INCREMENT，自动递增
- status 有 DEFAULT 1，自动填 1
- created\_at 有 DEFAULT CURRENT\_TIMESTAMP，自动填当前时间

### 插入时不写字段名（不推荐）

```sql
INSERT INTO products VALUES (NULL, 'iPhone 15', 5999.00, 100, 1, '2026-09-04 10:00:00');
```

可以这么写，但不推荐——你得记住每个字段的顺序，表结构一改就废了。**永远写字段名，清晰且不容易出错。**

### 插入多条

```sql
INSERT INTO products (name, price, stock) VALUES
('iPhone 15', 5999.00, 100),
('MacBook Pro', 12999.00, 50),
('AirPods Pro', 1999.00, 200);
```

一条语句插多条数据，比写三条 INSERT 效率高。

### 插入用户

```sql
INSERT INTO users (username, password, phone)
VALUES ('zhangsan', 'hashed_password_123', '13800138000');
```

***

## 七、查：查询数据（SELECT）

这是 SQL 中最重要的部分，也是内容最多的。开发中查数据比写数据多得多。

### 查所有

```sql
SELECT * FROM products;
```

`*` 表示所有字段。实际开发中尽量少用 `*`，明确写字段名：

```sql
SELECT id, name, price, stock FROM products;
```

**为什么不用** **`*`？** 表里如果有 TEXT 类型的大字段（比如商品详情），每次 `SELECT *` 都把大字段查出来，浪费性能。只查需要的字段更高效。

### 条件查询（WHERE）

```sql
-- 查价格大于 5000 的商品
SELECT id, name, price FROM products WHERE price > 5000;

-- 查上架中的商品
SELECT id, name FROM products WHERE status = 1;

-- 查库存少于 50 的商品
SELECT id, name, stock FROM products WHERE stock < 50;
```

### 比较运算符

| 运算符     | 含义   | 例子                  |
| ------- | ---- | ------------------- |
| =       | 等于   | `WHERE status = 1`  |
| != 或 <> | 不等于  | `WHERE status != 0` |
| >       | 大于   | `WHERE price > 100` |
| <       | 小于   | `WHERE stock < 10`  |
| >=      | 大于等于 | `WHERE price >= 99` |
| <=      | 小于等于 | `WHERE stock <= 5`  |

### 多条件组合（AND / OR）

```sql
-- 上架中 且 价格大于 5000
SELECT * FROM products WHERE status = 1 AND price > 5000;

-- 库存小于 10 或 状态为下架
SELECT * FROM products WHERE stock < 10 OR status = 0;
```

### 范围查询（BETWEEN / IN）

```sql
-- 价格在 1000 到 5000 之间
SELECT * FROM products WHERE price BETWEEN 1000 AND 5000;

-- 状态是 0 或 1（等于写多个 OR，更简洁）
SELECT * FROM products WHERE status IN (0, 1);

-- id 是 1、3、5 的商品
SELECT * FROM products WHERE id IN (1, 3, 5);
```

### 模糊查询（LIKE）

```sql
-- 名字里包含 iPhone 的
SELECT * FROM products WHERE name LIKE '%iPhone%';

-- 名字以 Mac 开头的
SELECT * FROM products WHERE name LIKE 'Mac%';

-- 名字第二个字是 'o' 的
SELECT * FROM products WHERE name LIKE '_o%';
```

| 通配符 | 含义     | 例子                                  |
| --- | ------ | ----------------------------------- |
| %   | 任意多个字符 | `'%phone%'` 匹配 iPhone、Android phone |
| \_  | 一个字符   | `'_o%'` 匹配 phone、top                |

### 判空查询（IS NULL）

```sql
-- 查没有填手机号的用户
SELECT * FROM users WHERE phone IS NULL;

-- 查填了手机号的用户
SELECT * FROM users WHERE phone IS NOT NULL;
```

**注意**：NULL 不能用 `= NULL`，必须用 `IS NULL`。这是新手最容易踩的坑。

### 排序（ORDER BY）

```sql
-- 按价格从低到高
SELECT * FROM products ORDER BY price ASC;

-- 按价格从高到低（降序）
SELECT * FROM products ORDER BY price DESC;

-- 先按状态排序，再按价格排序
SELECT * FROM products ORDER BY status DESC, price ASC;
```

| 关键字  | 含义           |
| ---- | ------------ |
| ASC  | 升序（从小到大），默认值 |
| DESC | 降序（从大到小）     |

**为什么默认是 ASC？** 因为从小到大是更自然的排列方式，就像 1、2、3、4、5。需要从大到小时才加 DESC。

### 分页（LIMIT）

```sql
-- 每页 10 条，查第 1 页
SELECT * FROM products LIMIT 0, 10;

-- 每页 10 条，查第 2 页
SELECT * FROM products LIMIT 10, 10;

-- 每页 10 条，查第 3 页
SELECT * FROM products LIMIT 20, 10;
```

LIMIT 后面两个数字：第一个是**偏移量**（跳过多少条），第二个是**取多少条**。

分页公式：`LIMIT (页码 - 1) * 每页条数, 每页条数`

**为什么需要分页？** 如果商品表有 10 万条数据，一次性全查出来，数据库压力大、网络传输慢、前端渲染卡。分页每次只查 10 条，用户体验更好。

### 去重（DISTINCT）

```sql
-- 查商品表里有哪些不同的状态值
SELECT DISTINCT status FROM products;
```

### 聚合函数

聚合函数把多行数据「聚」成一个结果：

```sql
-- 商品总数
SELECT COUNT(*) FROM products;

-- 最高价格
SELECT MAX(price) FROM products;

-- 最低价格
SELECT MIN(price) FROM products;

-- 平均价格
SELECT AVG(price) FROM products;

-- 库存总和
SELECT SUM(stock) FROM products;
```

| 函数        | 作用   |
| --------- | ---- |
| COUNT(\*) | 统计行数 |
| MAX(字段)   | 最大值  |
| MIN(字段)   | 最小值  |
| SUM(字段)   | 求和   |
| AVG(字段)   | 平均值  |

### 分组（GROUP BY）

按某个字段分组，然后对每组做聚合统计：

```sql
-- 按状态分组，统计每种状态有多少商品
SELECT status, COUNT(*) AS count FROM products GROUP BY status;

-- 结果：
-- status | count
--   1    |   8    （上架中 8 个）
--   0    |   2    （已下架 2 个）
```

**AS count 是什么？** 给 `COUNT(*)` 这个结果起个别名叫 `count`，看着更直观。不加也行，结果列名就是 `COUNT(*)`，不好看。

### 分组后过滤（HAVING）

```sql
-- 按状态分组，只看商品数大于 5 的状态
SELECT status, COUNT(*) AS count
FROM products
GROUP BY status
HAVING count > 5;
```

**HAVING 和 WHERE 的区别？**

- `WHERE` 是在分组前过滤（过滤行）
- `HAVING` 是在分组后过滤（过滤组）

比如 `WHERE price > 100` 先筛掉价格低于 100 的商品，然后再分组。`HAVING count > 5` 是分完组之后，只留商品数超过 5 的组。

### 别名（AS）

```sql
-- 给字段起别名
SELECT name AS 商品名称, price AS 价格 FROM products;

-- 给表起别名
SELECT p.name, p.price FROM products p WHERE p.price > 5000;
```

表别名在多表查询时特别有用，后面会讲到。

***

## 八、改：更新数据（UPDATE）

### 基本语法

```sql
UPDATE 表名 SET 字段1 = 值1, 字段2 = 值2 WHERE 条件;
```

### 更新示例

```sql
-- 把 id=1 的商品价格改成 4999
UPDATE products SET price = 4999.00 WHERE id = 1;

-- 把 id=1 的商品价格改成 4999，库存改成 200
UPDATE products SET price = 4999.00, stock = 200 WHERE id = 1;

-- 把所有商品的状态改成 1（批量更新）
UPDATE products SET status = 1;

-- 把所有价格低于 100 的商品状态改为 0
UPDATE products SET status = 0 WHERE price < 100;
```

### 千万别忘了 WHERE

```sql
-- 这会把所有商品的价格都改成 99！灾难性操作
UPDATE products SET price = 99;
```

**UPDATE 不加 WHERE 等于全表更新。** 在生产环境这是要写检讨的操作。建议写 UPDATE 时先写 WHERE 条件，再写 SET 内容，养成习惯。

***

## 九、删：删除数据（DELETE）

### 基本语法

```sql
DELETE FROM 表名 WHERE 条件;
```

### 删除示例

```sql
-- 删除 id=1 的商品
DELETE FROM products WHERE id = 1;

-- 删除所有下架商品
DELETE FROM products WHERE status = 0;

-- 删除价格低于 10 的商品
DELETE FROM products WHERE price < 10;
```

### DELETE 和 TRUNCATE 的区别

```sql
-- DELETE：逐行删除，可以加 WHERE
DELETE FROM products WHERE status = 0;

-- TRUNCATE：直接清空整张表，不能加 WHERE
TRUNCATE TABLE products;
```

| 对比项   | DELETE      | TRUNCATE   |
| ----- | ----------- | ---------- |
| 能加条件吗 | 能（WHERE）    | 不能         |
| 速度    | 慢（逐行删）      | 快（直接清空）    |
| 自增 ID | 不重置（接着之前的大） | 重置（从 1 开始） |
| 可以回滚吗 | 可以（事务）      | 不可以        |
| 触发器   | 触发          | 不触发        |

**实际开发中**：删特定数据用 DELETE + WHERE，清空整张表（比如测试数据）用 TRUNCATE。

### 逻辑删除 vs 物理删除

实际项目中很少用 DELETE 真删数据，更多的是**逻辑删除**——加一个 `is_deleted` 字段，删的时候只是把这个字段改成 1：

```sql
-- 逻辑删除：只是标记为已删除，数据还在
UPDATE products SET is_deleted = 1 WHERE id = 1;

-- 查询时过滤掉已删除的
SELECT * FROM products WHERE is_deleted = 0;
```

**为什么用逻辑删除？** 真删了就没法恢复。用户误删了订单，你能说「删了就没了」吗？逻辑删除相当于回收站，数据还在，随时可以恢复。

***

## 十、多表查询

实际项目中数据分散在多张表里。比如电商系统有用户表、商品表、订单表，查一个订单要同时关联三张表。

### 先建一张订单表

```sql
CREATE TABLE orders (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL COMMENT '哪个用户下的单',
  product_id  INT NOT NULL COMMENT '买的哪个商品',
  quantity    INT NOT NULL COMMENT '买了几个',
  total_price DECIMAL(10,2) NOT NULL COMMENT '总价',
  status      TINYINT DEFAULT 0 COMMENT '0待付款 1已付款 2已发货 3已完成',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

现在我们有三张表：users、products、orders。

### 内连接（INNER JOIN）

内连接取两张表的**交集**——两张表里都有的数据才出来。

```sql
-- 查询订单信息，同时带上商品名称
SELECT
  o.id AS 订单号,
  p.name AS 商品名称,
  o.quantity AS 数量,
  o.total_price AS 总价
FROM orders o
INNER JOIN products p ON o.product_id = p.id;
```

这里出现了多个新东西：

- `FROM orders o` —— 给 orders 表起别名叫 `o`，后面用 `o.id` 就不用写 `orders.id` 了
- `INNER JOIN products p` —— 把 products 表连进来，别名 `p`
- `ON o.product_id = p.id` —— 两张表的关联条件：订单的 product\_id 等于商品的 id
- `o.id`、`p.name` —— 用 `表别名.字段名` 来指定从哪张表取

查询结果长这样：

| 订单号 | 商品名称        | 数量 | 总价       |
| --- | ----------- | -- | -------- |
| 1   | iPhone 15   | 1  | 5999.00  |
| 2   | MacBook Pro | 1  | 12999.00 |
| 3   | AirPods Pro | 2  | 3998.00  |

**为什么要连表？** 订单表里只存了 `product_id`（一个数字），不存商品名称。因为商品名称可能改，如果订单里存了名称，商品改名后订单里的名字就对不上了。所以只存 ID，查的时候用 JOIN 去商品表里取名称。这就是**数据冗余**的问题——避免重复存储，需要的时候 JOIN。

### 三表连接

```sql
-- 查订单信息，同时带上用户名和商品名
SELECT
  o.id AS 订单号,
  u.username AS 用户名,
  p.name AS 商品名称,
  o.quantity AS 数量,
  o.total_price AS 总价,
  o.status AS 订单状态
FROM orders o
INNER JOIN users u ON o.user_id = u.id
INNER JOIN products p ON o.product_id = p.id;
```

先连 users 表再连 products 表，逻辑和两表一样。

### 左外连接（LEFT JOIN）

左连接以**左表为准**，右表没有匹配的数据也会出来，右表字段显示为 NULL。

```sql
-- 查所有用户，包括没有下过单的用户
SELECT
  u.username,
  o.id AS 订单号,
  o.total_price
FROM users u
LEFT JOIN orders o ON o.user_id = u.id;
```

| 用户名      | 订单号  | 总价       |
| -------- | ---- | -------- |
| zhangsan | 1    | 5999.00  |
| lisi     | NULL | NULL     |
| wangwu   | 2    | 12999.00 |

lisi 没下过单，但结果里也有他，只是订单号和总价是 NULL。

**LEFT JOIN 和 INNER JOIN 的区别？**

- INNER JOIN：两张表都有匹配的才出来（只看有订单的用户）
- LEFT JOIN：左表全出来，右表没有的填 NULL（看所有用户，包括没下单的）

### 右外连接（RIGHT JOIN）

右连接以右表为准，和左连接反过来。实际开发中几乎不用 LEFT 之外的外连接，知道有这东西就行。

### 子查询

子查询就是把一条 SELECT 的结果当作另一条 SQL 的条件：

```sql
-- 查买了 iPhone 15 的用户信息
SELECT * FROM users
WHERE id IN (
  SELECT user_id FROM orders
  WHERE product_id = (SELECT id FROM products WHERE name = 'iPhone 15')
);
```

从里往外看：

1. 最里面：查出 iPhone 15 的 id
2. 中间：用这个 id 查出哪些订单买了 iPhone 15，拿到 user\_id
3. 最外面：用这些 user\_id 查用户信息

### 子查询 vs JOIN

大部分子查询都可以改写成 JOIN，JOIN 通常更高效：

```sql
-- 子查询写法
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);

-- JOIN 写法（更高效）
SELECT DISTINCT u.* FROM users u
INNER JOIN orders o ON o.user_id = u.id;
```

**实际开发建议**：能用 JOIN 就用 JOIN，子查询在简单场景用用就行。

***

## 十一、常用函数

### 字符串函数

```sql
-- 拼接字符串
SELECT CONCAT(username, ' 的手机号是 ', phone) FROM users;

-- 转大小写
SELECT UPPER(name) FROM products;        -- 转大写
SELECT LOWER(name) FROM products;        -- 转小写

-- 截取字符串
SELECT SUBSTRING(name, 1, 5) FROM products;  -- 从第1个字符开始取5个

-- 字符串长度
SELECT name, LENGTH(name) FROM products;
```

### 日期函数

```sql
-- 当前日期和时间
SELECT NOW();          -- 2026-09-04 15:30:00
SELECT CURDATE();      -- 2026-09-04
SELECT CURTIME();      -- 15:30:00

-- 日期格式化
SELECT DATE_FORMAT(created_at, '%Y-%m-%d') FROM products;

-- 日期计算
SELECT created_at, DATE_ADD(created_at, INTERVAL 7 DAY) FROM products;  -- 加7天
```

### 数学函数

```sql
SELECT ROUND(3.14159, 2);   -- 四舍五入到2位小数：3.14
SELECT CEIL(3.1);           -- 向上取整：4
SELECT FLOOR(3.9);          -- 向下取整：3
SELECT ABS(-5);             -- 绝对值：5
```

### 流程控制函数

```sql
-- IF：条件判断
SELECT name, IF(stock > 50, '库存充足', '库存不足') FROM products;

-- CASE：多条件分支（类似 switch）
SELECT
  name,
  CASE
    WHEN price < 100 THEN '便宜'
    WHEN price < 1000 THEN '普通'
    WHEN price < 5000 THEN '中等'
    ELSE '贵'
  END AS 价格档位
FROM products;
```

**CASE 在报表统计里特别有用**，把数字状态翻译成人话，一眼看明白。

***

## 十二、数据库设计的三大范式

三大范式是设计表时的指导原则，目的是**减少数据冗余、避免异常**。不用死记，理解思路就行。

### 第一范式：每列不可再分

**每列只能存一个值，不能在一列里塞多个值。**

```
反例：
| id | name  | phone              |
| 1  | 张三  | 138xxx,139xxx      |   ← phone 存了两个手机号，不符合

正例：
| id | name  | phone     |
| 1  | 张三  | 138xxx    |
| 1  | 张三  | 139xxx    |   ← 一个手机号一行
```

### 第二范式：非主键列必须依赖整个主键

**如果主键是复合主键（多个字段组成），其他列必须依赖所有主键字段，不能只依赖一部分。**

简单理解：一张表只存一件事。不要把订单信息和商品信息混在一张表里。

### 第三范式：非主键列之间不能有依赖

**非主键列只能依赖主键，不能互相依赖。**

```
反例：
| order_id | user_id | username | product_name |
| 1        | 1       | 张三     | iPhone       |

user_id → username（username 依赖 user_id，不是直接依赖 order_id）
应该把 username 放到 users 表里，订单表只存 user_id
```

### 实际项目中的取舍

三大范式是理论指导，实际项目里会**适度违反范式**来提升性能。比如订单表里冗余存一个商品名称快照——因为商品名称可能改，但订单里的名称不应该变。这种刻意冗余是合理的。

**范式不是法律，是参考。** 数据一致性和查询性能之间要找平衡。

***

## 十三、索引

索引是 MySQL 性能优化的最重要手段。

### 什么是索引

把索引想象成字典的目录。没有目录，你要找一个字得从头翻到尾（全表扫描）；有了目录，翻到目录页找到那个字在第几页，直接翻过去（索引查找）。

### 创建索引

```sql
-- 建表时加索引
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  -- 主键自动有索引
  INDEX idx_name (name)          -- 给 name 加普通索引
);

-- 建表后加索引
CREATE INDEX idx_name ON products(name);
CREATE INDEX idx_status_price ON products(status, price);  -- 联合索引
```

### 什么时候加索引

| 场景              | 要不要加索引     |
| --------------- | ---------- |
| WHERE 条件里经常查的字段 | 加          |
| JOIN 的关联字段      | 加          |
| ORDER BY 排序的字段  | 加          |
| 表里只有几条数据        | 不用加，全表扫描更快 |
| 经常增删改的字段        | 少加，索引会拖慢写入 |

### 索引不是越多越好

索引能加速查询，但也有代价：

- **写入变慢** —— 每次 INSERT/UPDATE/DELETE 都要更新索引
- **占空间** —— 索引也是数据，占磁盘

**建议**：只给经常查的字段加索引，不要给所有字段都加。

***

## 十四、事务

事务是一组操作，要么全成功，要么全失败。

### 为什么需要事务

转账场景：A 给 B 转 100 元，两步操作：

1. A 的余额减 100
2. B 的余额加 100

如果第一步成功了第二步失败了，A 的钱少了 B 没收到——钱凭空消失了。事务保证这两步要么一起成功，要么一起失败。

### 事务的四个特性（ACID）

| 特性              | 含义          | 通俗解释            |
| --------------- | ----------- | --------------- |
| 原子性 Atomicity   | 要么全成功，要么全失败 | 一荣俱荣，一损俱损       |
| 一致性 Consistency | 事务前后数据一致    | 转账前后总金额不变       |
| 隔离性 Isolation   | 并发事务互不干扰    | A 转账时 B 查不到中间状态 |
| 持久性 Durability  | 事务提交后永久保存   | 断电了也不丢          |

### 使用事务

```sql
-- 开启事务
START TRANSACTION;

-- 执行多条 SQL
UPDATE accounts SET balance = balance - 100 WHERE user_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE user_id = 2;

-- 都成功了，提交
COMMIT;

-- 如果中间出错了，回滚（撤销所有操作）
ROLLBACK;
```

**后端代码里**一般用框架自带的事务管理。比如 Node.js：

```js
const conn = await pool.getConnection()
await conn.beginTransaction()
try {
  await conn.query('UPDATE accounts SET balance = balance - 100 WHERE user_id = 1')
  await conn.query('UPDATE accounts SET balance = balance + 100 WHERE user_id = 2')
  await conn.commit()
} catch (err) {
  await conn.rollback()
  throw err
} finally {
  conn.release()
}
```

***

## 十五、总结

把 MySQL 入门的核心知识点串一遍：

1. **MySQL 是什么** —— 存数据的软件，用 SQL 语言操作，可以理解为加强版 Excel。
2. **基本操作** —— 建库（CREATE DATABASE）、建表（CREATE TABLE）、改表结构（ALTER TABLE）、删表（DROP TABLE）。
3. **数据类型** —— INT 存数字，VARCHAR 存字符串，DECIMAL 存价格，DATETIME 存时间。常用的就这几个。
4. **约束** —— 主键唯一标识、NOT NULL 不能为空、DEFAULT 默认值、UNIQUE 不能重复。
5. **增（INSERT）** —— `INSERT INTO 表名 (字段) VALUES (值)`，可以批量插入。
6. **查（SELECT）** —— 最核心的技能。WHERE 条件、ORDER BY 排序、LIMIT 分页、GROUP BY 分组、聚合函数统计。
7. **改（UPDATE）** —— `UPDATE 表名 SET 字段=值 WHERE 条件`，千万别忘 WHERE。
8. **删（DELETE）** —— `DELETE FROM 表名 WHERE 条件`，也别忘了 WHERE。生产环境推荐逻辑删除。
9. **多表查询** —— INNER JOIN 取交集、LEFT JOIN 左表全保留、子查询嵌套查询。
10. **索引** —— 加速查询，但拖慢写入。只给经常查的字段加。
11. **事务** —— 保证一组操作要么全成功要么全失败，ACID 四个特性。
12. **三大范式** —— 减少冗余的设计指导，实际项目可以适度违反。

学习路径建议：先把增删改查写熟，再学多表查询，然后学索引和事务。范式这些理论了解就行，不用死记。

**练习方法**：建一个电商系统的数据库（用户表、商品表、订单表），自己往里面插数据，然后写各种查询。能把「查出所有买了 iPhone 的用户」这种需求写出来，就算入门了。
