---
title: "Python 快速入门：从 JS 视角到写接口"
published: 2026-09-10
description: "从 JS 视角快速入门 Python：语法、函数、类、常用库，到用 Python 写后端接口的全流程。"
tags: ["Python"]
category: "Python"
image: "/blogs/Python/python-cover.jpg"
author: "jojo"
draft: false
comment: true
lang: "zh-CN"
aiPolished: false
---
# Python 快速入门：从 JS 视角到写接口

> 目录
>
> 1. [Python 是什么](#一python-是什么)
> 2. [快速上手：安装和第一个程序](#二快速上手安装和第一个程序)
> 3. [基础语法：和 JS 对比着学](#三基础语法和-js-对比着学)
> 4. [数据类型：列表、字典、元组、集合](#四数据类型列表字典元组集合)
> 5. [流程控制：if / for / while](#五流程控制if--for--while)
> 6. [函数：def 和 lambda](#六函数def-和-lambda)
> 7. [面向对象：类和继承](#七面向对象类和继承)
> 8. [模块和包：import](#八模块和包import)
> 9. [文件操作](#九文件操作)
> 10. [常用内置函数](#十常用内置函数)
> 11. [异常处理：try / except](#十一异常处理try--except)
> 12. [虚拟环境和 pip](#十二虚拟环境和-pip)
> 13. [实战：用 Flask 写接口](#十三实战用-flask-写接口)
> 14. [Python vs JavaScript](#十四python-vs-javascript)
> 15. [面试八股](#十五面试八股)
> 16. [总结](#十六总结)

---

## 一、Python 是什么

一句话：**Python 是一门简洁、易读、什么都能做的编程语言。**

你可能觉得又学一门新语言很累，但好消息是——你已经会 JS 了，Python 的很多概念和 JS 是相通的：变量、函数、条件、循环、面向对象、异步……核心思路一样，只是语法不同。

### Python 的特点

| 特点 | 说明 |
|------|------|
| 语法简洁 | 没有大括号、分号，靠缩进组织代码 |
| 易读 | 代码看起来像英语句子 |
| 动态类型 | 不用声明类型（和 JS 一样） |
| 万能 | Web、AI、爬虫、数据、自动化都能做 |
| 生态丰富 | pip 上有几十万个第三方包 |
| 运行速度 | 比 JS 慢一点，但开发速度快 |

### Python 能干嘛？

- **Web 后端** —— Django、Flask、FastAPI 写接口
- **AI / 机器学习** —— PyTorch、TensorFlow，Python 是 AI 第一语言
- **数据分析** —— Pandas、NumPy，数据科学首选
- **爬虫** —— Scrapy、BeautifulSoup，抓数据利器
- **自动化** —— 脚本、定时任务、办公自动化
- **工具开发** —— CLI 工具、测试工具

> 打个比方：JS 是「Web 之王」，Python 是「全能选手」。前端用 JS，后端/数据/AI/自动化用 Python。两个都会，基本什么都能做了。

---

## 二、快速上手：安装和第一个程序

### 1. 安装

去 [python.org](https://www.python.org/downloads/) 下载，安装时**勾选 "Add Python to PATH"**（很重要，不然命令行找不到）。

安装完验证：

```bash
python --version    # Python 3.12.x
pip --version        # pip 是 Python 的包管理器（类似 npm）
```

### 2. 第一个程序

新建 `hello.py`：

```python
# hello.py
print("Hello Python!")

name = "前端仔"
print(f"你好，{name}，欢迎来到 Python 世界")

# 列表（类似 JS 数组）
nums = [1, 2, 3]
print([n * 2 for n in nums])  # [2, 4, 6]

# 条件判断
age = 20
if age >= 18:
    print("成年了")
else:
    print("未成年")
```

运行：

```bash
python hello.py
```

看到输出了吗？和 JS 最大的区别是：**没有分号、没有大括号，靠缩进（空格）来组织代码块。**

### 3. 和 JS 的核心区别

| 对比项 | JavaScript | Python |
|--------|-----------|--------|
| 代码块 | `{}` 大括号 | 缩进（4 个空格） |
| 语句结尾 | `;` 分号 | 换行（不加分号） |
| 变量声明 | `let / const` | 直接写变量名 |
| 输出 | `console.log()` | `print()` |
| 字符串拼接 | 模板字符串 `` ` `` | f-string `f""` |
| 等于比较 | `==`（会转型）`===`（严格） | `==`（不推荐）`is`（身份比较） |
| 注释 | `//` 和 `/* */` | `#` 和 `""" """` |
| this | 有 | 没有（用 self 代替） |
| 异步 | Promise / async-await | async-await（类似） |

> 你已经会 JS 了，学 Python 就是学「换一种语法写同样的逻辑」。核心概念都一样，只是表达方式不同。

---

## 三、基础语法：和 JS 对比着学

### 1. 变量

```python
# Python 不用 let/const，直接写
name = "张三"      # 相当于 let name = "张三"
age = 20           # 相当于 let age = 20

# 多变量赋值（Python 特有，很方便）
a, b, c = 1, 2, 3

# 交换变量（不用临时变量）
a, b = b, a

# Python 没有 const，但约定全大写表示常量
MAX_SIZE = 100
```

### 2. 字符串

```python
# 单引号和双引号都行
s1 = 'hello'
s2 = "hello"

# f-string（类似 JS 模板字符串，但用 f 开头）
name = "张三"
age = 20
msg = f"我叫{name}，今年{age}岁"

# 多行字符串（类似 JS 反引号）
html = """
<div>
  <h1>标题</h1>
</div>
"""

# 常用方法
"hello".upper()          # "HELLO"
"hello".lower()          # "hello"
"  hi  ".strip()         # "hi"（去首尾空格）
"hello".split("l")       # ['he', '', 'o']
"-".join(["a", "b"])     # "a-b"
"hello".replace("l", "L")  # "heLLo"
len("hello")             # 5（长度）
```

### 3. 数字

```python
a = 10
b = 3

print(a + b)    # 13
print(a - b)    # 7
print(a * b)    # 30
print(a / b)    # 3.333...（除法，结果是小数）
print(a // b)   # 3（整除，只取整数部分）
print(a % b)    # 1（取余）
print(a ** b)   # 1000（幂运算，10 的 3 次方）

# JS 里 10 ** 3 也可以，但 Python 更常用
```

### 4. 注释

```python
# 单行注释

"""
多行注释
多行注释
多行注释
"""

# 也可以用三个单引号
'''
多行注释
'''
```

### 5. 布尔值和 None

```python
# Python 的布尔值首字母大写！
is_ok = True      # 不是 true
is_done = False   # 不是 false

# 空值
result = None     # 类似 JS 的 null

# Python 里以下都算 False（假值）
# False, None, 0, "", [], {}, ()
```

---

## 四、数据类型：列表、字典、元组、集合

Python 有四个核心数据结构，对应 JS 里的数组和对象。

### 1. 列表（List）—— 对应 JS 数组

```python
# 创建
fruits = ["苹果", "香蕉", "橘子"]
nums = [1, 2, 3, 4, 5]
mixed = [1, "hello", True, None]  # 可以混合类型

# 访问
fruits[0]        # "苹果"（正向索引）
fruits[-1]       # "橘子"（负索引，从后往前，-1 是最后一个）
fruits[-2]       # "香蕉"

# 切片（Python 特色，JS 没有）
nums = [1, 2, 3, 4, 5]
nums[0:3]     # [1, 2, 3]（从 0 到 3，不包含 3）
nums[1:]      # [2, 3, 4, 5]（从 1 到末尾）
nums[:3]      # [1, 2, 3]（从头到 3）
nums[-2:]     # [4, 5]（最后两个）
nums[::2]     # [1, 3, 5]（每隔一个取一个）

# 修改
fruits[0] = "西瓜"

# 常用方法
fruits.append("葡萄")       # 末尾添加（类似 push）
fruits.insert(0, "芒果")    # 指定位置插入
fruits.remove("香蕉")       # 删除指定值
fruits.pop()                # 删除最后一个并返回
fruits.pop(0)              # 删除指定索引
len(fruits)                # 长度（类似 .length）
fruits.sort()              # 排序（会改变原列表）
sorted(fruits)             # 排序但不改原列表
fruits.reverse()           # 反转
"苹果" in fruits          # 是否包含（类似 includes）

# 列表推导式（Python 特色，类似 JS 的 map + filter）
[n * 2 for n in nums]              # [2, 4, 6, 8, 10]（map）
[n for n in nums if n > 2]         # [3, 4, 5]（filter）
[n * 2 for n in nums if n > 2]     # [6, 8, 10]（filter + map）
```

### 2. 字典（Dict）—— 对应 JS 对象

```python
# 创建
user = {
    "name": "张三",
    "age": 20,
    "email": "zhang@xx.com",
}

# 访问
user["name"]           # "张三"
user.get("phone")      # None（不存在不报错）
user.get("phone", "未填写")  # "未填写"（带默认值）

# 修改/添加
user["age"] = 21       # 修改
user["phone"] = "123"  # 添加新的

# 删除
del user["phone"]
user.pop("email")      # 删除并返回值

# 常用方法
user.keys()            # 所有的键（类似 Object.keys）
user.values()          # 所有的值（类似 Object.values）
user.items()           # 键值对（类似 Object.entries）
"name" in user         # 是否有这个键
len(user)              # 键值对数量

# 遍历
for key, value in user.items():
    print(f"{key}: {value}")
```

### 3. 元组（Tuple）—— 不可变的列表

```python
# 创建（用小括号）
point = (10, 20)
colors = ("red", "green", "blue")

# 访问（和列表一样）
point[0]       # 10
point[-1]      # 20

# 但是不能修改！
point[0] = 30  # TypeError!

# 为什么要用元组？
# 1. 数据不应该被修改时用（比如坐标、配置）
# 2. 比列表轻量，性能好
# 3. 字典的键只能用不可变类型，元组可以当键

# 解包（类似 JS 解构）
x, y = point        # x=10, y=20
a, b, c = colors    # a="red", b="green", c="blue"
```

### 4. 集合（Set）—— 对应 JS 的 Set

```python
# 创建
s = {1, 2, 3, 3}    # {1, 2, 3}（自动去重）

# 从列表去重
nums = [1, 2, 2, 3]
unique = set(nums)  # {1, 2, 3}
list(unique)        # [1, 2, 3]（转回列表）

# 常用操作
s.add(4)            # 添加
s.remove(2)         # 删除
1 in s              # True（判断存在）

# 集合运算（Python 特色）
a = {1, 2, 3}
b = {3, 4, 5}

a | b    # {1, 2, 3, 4, 5}（并集）
a & b    # {3}（交集）
a - b    # {1, 2}（差集）
```

### 速查对照表

| JS | Python | 创建 | 特点 |
|----|--------|------|------|
| Array | List | `[1, 2, 3]` | 可修改 |
| — | Tuple | `(1, 2, 3)` | 不可修改 |
| Object | Dict | `{"k": "v"}` | 键值对 |
| Set | Set | `{1, 2, 3}` | 自动去重 |

---

## 五、流程控制：if / for / while

### if 条件判断

```python
# Python 用缩进代替 {}
age = 20

if age >= 18:
    print("成年了")
elif age >= 12:
    print("青少年")
else:
    print("小朋友")

# 注意：没有 else if，是 elif
# 注意：条件不用加括号（加了也不报错，但不规范）
# 注意：后面必须有冒号 :
```

### for 循环

Python 的 for 和 JS 不一样——不是 `for (let i = 0; ...)`，而是直接遍历集合。

```python
# 遍历列表
fruits = ["苹果", "香蕉", "橘子"]
for fruit in fruits:
    print(fruit)

# 遍历字典
user = {"name": "张三", "age": 20}
for key, value in user.items():
    print(f"{key}: {value}")

# range 生成数字序列（类似 JS 的 for (let i = 0; i < n; i++)）
for i in range(5):        # 0, 1, 2, 3, 4
    print(i)

for i in range(2, 6):     # 2, 3, 4, 5
    print(i)

for i in range(0, 10, 2): # 0, 2, 4, 6, 8（步长 2）
    print(i)

# enumerate：同时拿索引和值（类似 JS 的 forEach 第二参数）
for index, fruit in enumerate(fruits):
    print(f"第{index}个是{fruit}")

# break 和 continue（和 JS 一样）
for i in range(10):
    if i == 3:
        continue  # 跳过 3
    if i == 7:
        break     # 到 7 停止
    print(i)
```

### while 循环

```python
count = 0
while count < 5:
    print(count)
    count += 1    # Python 没有 count++

# Python 特色：while...else（循环正常结束执行 else）
count = 0
while count < 3:
    print(count)
    count += 1
else:
    print("循环结束")  # break 的话不会执行
```

---

## 六、函数：def 和 lambda

### 基本函数

```python
# 用 def 定义函数（不是 function）
def greet(name):
    return f"你好，{name}"

msg = greet("张三")
print(msg)  # 你好，张三

# 默认参数
def greet(name="陌生人"):
    return f"你好，{name}"

greet()        # 你好，陌生人
greet("李四")  # 你好，李四

# 关键字参数（Python 特色：可以按参数名传，不关心顺序）
def create_user(name, age, email):
    return {"name": name, "age": age, "email": email}

create_user(age=20, name="张三", email="z@xx.com")  # 顺序无所谓

# 不定参数（类似 JS 的 ...args）
def sum_all(*args):
    return sum(args)

sum_all(1, 2, 3)       # 6
sum_all(1, 2, 3, 4, 5) # 15

# 关键字不定参数（传字典）
def show_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

show_info(name="张三", age=20, city="北京")
```

### 返回多个值（Python 特色）

```python
def get_user():
    name = "张三"
    age = 20
    return name, age    # 返回元组

# 解包
name, age = get_user()  # name="张三", age=20
```

JS 只能返回一个值（要返回多个得用数组/对象），Python 可以直接返回多个，调用时直接解包。

### lambda 匿名函数

```python
# 类似 JS 的箭头函数
add = lambda a, b: a + b
add(1, 2)  # 3

# 常用在排序、过滤等场景
users = [{"name": "张三", "age": 20}, {"name": "李四", "age": 25}]
users.sort(key=lambda u: u["age"])         # 按 age 排序
filtered = list(filter(lambda u: u["age"] > 22, users))  # 过滤
```

### 函数注解（类型提示）

```python
# Python 3.5+ 支持类型提示（类似 TS）
def add(a: int, b: int) -> int:
    return a + b

# 不强制，只是提示，方便 IDE 和阅读
```

---

## 七、面向对象：类和继承

### 基本类

```python
class Person:
    # 构造函数（类似 JS 的 constructor）
    def __init__(self, name, age):
        self.name = name    # self 相当于 JS 的 this
        self.age = age

    # 实例方法
    def say_hi(self):
        print(f"我叫{self.name}，今年{self.age}岁")

    # 类方法（类似 JS 的 static）
    @classmethod
    def create(cls, name):
        return cls(name, 18)

# 使用
p = Person("张三", 20)
p.say_hi()  # 我叫张三，今年20岁

p2 = Person.create("李四")
p2.say_hi()  # 我叫李四，今年18岁
```

**关键区别**：
- Python 用 `self`（必须手动写），JS 用 `this`（自动绑定）
- 构造函数叫 `__init__`，JS 叫 `constructor`
- 实例方法第一个参数永远是 `self`

### 继承

```python
class Student(Person):    # 继承 Person
    def __init__(self, name, age, school):
        super().__init__(name, age)   # 调用父类构造（类似 super()）
        self.school = school

    # 重写父类方法
    def say_hi(self):
        super().say_hi()    # 先调父类的
        print(f"我在{self.school}上学")

    # 新方法
    def study(self):
        print(f"{self.name}正在学习")

s = Student("王五", 22, "清华")
s.say_hi()   # 我叫王五，今年22岁 / 我在清华上学
s.study()    # 王五正在学习
```

### 常用魔法方法

```python
class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    # 类似 JS 的 toString
    def __str__(self):
        return f"{self.name}（¥{self.price}）"

    # 类似 JS 的 === 比较
    def __eq__(self, other):
        return self.name == other.name and self.price == other.price

    # 让对象可以像函数一样调用
    def __call__(self, discount):
        return self.price * discount

p = Product("iPhone", 5999)
print(p)          # iPhone（¥5999）
p(0.8)            # 4799.2（打八折）
```

---

## 八、模块和包：import

### 导入模块

```python
# 导入整个模块
import math
math.sqrt(16)    # 4.0

# 导入并起别名（类似 JS 的 import as）
import numpy as np
np.array([1, 2, 3])

# 从模块导入特定的东西（类似 JS 的 import { xxx }）
from math import sqrt, pi
sqrt(16)     # 4.0
pi           # 3.14159...

# 从模块导入所有（不推荐，容易冲突）
from math import *
```

### 自己写模块

```python
# utils.py
def add(a, b):
    return a + b

def multiply(a, b):
    return a * b

PI = 3.14159
```

```python
# main.py
from utils import add, multiply, PI

print(add(1, 2))       # 3
print(multiply(3, 4))  # 12
print(PI)               # 3.14159
```

### 包（Package）

一个文件夹里有 `__init__.py`（可以是空文件），Python 就把它当成一个包。

```
my_package/
├── __init__.py
├── math_utils.py
└── string_utils.py
```

```python
from my_package.math_utils import add
from my_package import string_utils
```

> 类似 JS 的 `import { add } from './utils.js'`，只是 Python 用 `from...import`。

---

## 九、文件操作

Python 的文件操作比 JS 简单太多了。

### 读文件

```python
# 读全部
with open("data.txt", "r", encoding="utf-8") as f:
    content = f.read()
print(content)

# 按行读
with open("data.txt", "r", encoding="utf-8") as f:
    for line in f:
        print(line.strip())  # strip 去掉换行符

# 读所有行到列表
with open("data.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()
```

### 写文件

```python
# 覆盖写
with open("output.txt", "w", encoding="utf-8") as f:
    f.write("第一行\n")
    f.write("第二行\n")

# 追加写
with open("output.txt", "a", encoding="utf-8") as f:
    f.write("追加的内容\n")
```

### with 语句

`with` 会在代码块结束后自动关闭文件，不用手动 `f.close()`。

```python
# 推荐写法（自动关闭）
with open("data.txt") as f:
    content = f.read()
# 离开 with 块后文件自动关闭

# 不推荐写法（要手动关闭）
f = open("data.txt")
content = f.read()
f.close()  # 忘了关就泄漏了
```

### JSON 文件

```python
import json

# 读 JSON
with open("data.json", "r", encoding="utf-8") as f:
    data = json.load(f)    # 自动解析成 Python 字典/列表

# 写 JSON
data = {"name": "张三", "age": 20}
with open("output.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
```

---

## 十、常用内置函数

Python 自带很多有用的函数，不用导入就能用。

| 函数 | 作用 | JS 对应 |
|------|------|---------|
| `print()` | 打印 | `console.log()` |
| `len()` | 长度 | `.length` |
| `type()` | 类型 | `typeof` |
| `range()` | 生成序列 | — |
| `enumerate()` | 带索引遍历 | `forEach((v, i) => ...)` |
| `map()` | 映射 | `.map()` |
| `filter()` | 过滤 | `.filter()` |
| `sorted()` | 排序 | `.sort()` |
| `reversed()` | 反转 | `.reverse()` |
| `sum()` | 求和 | `.reduce()` |
| `max()` / `min()` | 最大/最小 | `Math.max/min` |
| `abs()` | 绝对值 | `Math.abs()` |
| `round()` | 四舍五入 | `Math.round()` |
| `isinstance()` | 类型检查 | `instanceof` |
| `zip()` | 并行遍历多个 | — |
| `any()` / `all()` | 任一/全部满足 | `.some()` / `.every()` |

### 实用例子

```python
# map 和 filter（Python 3 返回迭代器，要 list() 转换）
nums = [1, 2, 3, 4, 5]
list(map(lambda n: n * 2, nums))         # [2, 4, 6, 8, 10]
list(filter(lambda n: n > 2, nums))      # [3, 4, 5]

# 但列表推导式更 Pythonic
[n * 2 for n in nums]                    # [2, 4, 6, 8, 10]
[n for n in nums if n > 2]              # [3, 4, 5]

# zip：并行遍历
names = ["张三", "李四", "王五"]
ages = [20, 25, 30]
list(zip(names, ages))
# [("张三", 20), ("李四", 25), ("王五", 30)]

# any / all
scores = [80, 90, 60, 100]
any(s >= 100 for s in scores)   # True（至少一个 >= 100）
all(s >= 60 for s in scores)    # True（全部 >= 60）

# sorted 带自定义排序
users = [{"name": "张三", "age": 20}, {"name": "李四", "age": 25}]
sorted(users, key=lambda u: u["age"])         # 按 age 升序
sorted(users, key=lambda u: u["age"], reverse=True)  # 降序
```

---

## 十一、异常处理：try / except

```python
# Python 用 except 代替 catch
try:
    result = 10 / 0
except ZeroDivisionError:
    print("除以零了")
except TypeError as e:
    print(f"类型错误：{e}")
except Exception as e:
    print(f"其他错误：{e}")
else:
    print("没有异常时执行")
finally:
    print("不管有没有异常都执行")
```

### 主动抛异常

```python
def set_age(age):
    if age < 0:
        raise ValueError("年龄不能为负数")
    return age

# 捕获
try:
    set_age(-1)
except ValueError as e:
    print(e)  # 年龄不能为负数
```

### 对比 JS

| Python | JS |
|--------|-----|
| `try / except` | `try / catch` |
| `raise` | `throw` |
| `Exception` | `Error` |
| `else` 分支 | 没有 |
| `finally` | 一样 |

---

## 十二、虚拟环境和 pip

### pip：包管理器（类似 npm）

```bash
# 安装包
pip install flask           # 类似 npm install flask

# 安装指定版本
pip install flask==2.3.0

# 卸载
pip uninstall flask

# 查看已安装
pip list                    # 类似 npm list

# 导出依赖
pip freeze > requirements.txt   # 类似 package.json

# 从文件安装依赖
pip install -r requirements.txt
```

### 虚拟环境（类似 node_modules）

Python 的虚拟环境类似于 Node.js 的 `node_modules`——每个项目有自己独立的依赖，互不影响。

```bash
# 创建虚拟环境
python -m venv myenv

# 激活（Windows）
myenv\Scripts\activate

# 激活（Mac/Linux）
source myenv/bin/activate

# 激活后安装的包只在这个环境里
pip install flask

# 退出虚拟环境
deactivate
```

> **为什么不直接全局安装？** 和 npm 一样——全局安装会导致版本冲突。项目 A 要 Flask 2.0，项目 B 要 Flask 3.0，放全局就打架了。虚拟环境让每个项目有自己的依赖空间。

---

## 十三、实战：用 Flask 写接口

学完基础语法，来写一套接口——和 Node.js Express 一样的思路。

### 安装

```bash
pip install flask
```

### 第一个接口

```python
# app.py
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/hello')
def hello():
    return jsonify({"message": "Hello Flask!"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

运行：

```bash
python app.py
```

浏览器打开 `http://localhost:5000/hello`，看到 JSON 返回就成功了。

> 和 Express 对比：`app.get('/hello', (req, res) => res.json({message: 'hi'}))` → Python 的 Flask 写法几乎一模一样。

### 写一套 CRUD

```python
# app.py
from flask import Flask, jsonify, request

app = Flask(__name__)
app.json.ensure_ascii = False  # 支持中文

# 模拟数据库
users = [
    {"id": 1, "name": "张三", "age": 20},
    {"id": 2, "name": "李四", "age": 25},
]
next_id = 3


# 统一响应格式
def success(data=None, message="success"):
    return jsonify({"code": 0, "message": message, "data": data})

def fail(message="error", code=1):
    return jsonify({"code": code, "message": message, "data": None})


# 获取用户列表（分页）
@app.route('/users', methods=['GET'])
def get_users():
    page = int(request.args.get('page', 1))
    size = int(request.args.get('size', 10))
    keyword = request.args.get('keyword', '')

    # 过滤
    filtered = [u for u in users if keyword in u['name']] if keyword else users

    # 分页
    total = len(filtered)
    start = (page - 1) * size
    list_data = filtered[start:start + size]

    return success({"list": list_data, "total": total, "page": page, "size": size})


# 获取用户详情
@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = next((u for u in users if u['id'] == user_id), None)
    if not user:
        return fail("用户不存在", 404)
    return success(user)


# 创建用户
@app.route('/users', methods=['POST'])
def create_user():
    global next_id
    data = request.get_json()

    if not data or not data.get('name'):
        return fail("用户名不能为空")

    user = {
        "id": next_id,
        "name": data['name'],
        "age": data.get('age', 18),
    }
    users.append(user)
    next_id += 1
    return success(user, "创建成功")


# 修改用户
@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    user = next((u for u in users if u['id'] == user_id), None)
    if not user:
        return fail("用户不存在", 404)

    if 'name' in data:
        user['name'] = data['name']
    if 'age' in data:
        user['age'] = data['age']

    return success(user, "修改成功")


# 删除用户
@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    global users
    user = next((u for u in users if u['id'] == user_id), None)
    if not user:
        return fail("用户不存在", 404)

    users = [u for u in users if u['id'] != user_id]
    return success(None, "删除成功")


if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

用 Postman 测试一下，五个接口全都能跑。和 Express 写的接口一模一样，只是语法不同。

### 对比 Express 和 Flask

| 对比项 | Express (Node.js) | Flask (Python) |
|--------|-------------------|----------------|
| 创建应用 | `const app = express()` | `app = Flask(__name__)` |
| GET 路由 | `app.get('/users', handler)` | `@app.route('/users', methods=['GET'])` |
| POST 路由 | `app.post('/users', handler)` | `@app.route('/users', methods=['POST'])` |
| 获取参数 | `req.query` / `req.params` | `request.args` / 路径参数 |
| 获取 body | `req.body` | `request.get_json()` |
| 返回 JSON | `res.json({...})` | `jsonify({...})` |
| 启动 | `app.listen(3000)` | `app.run(port=5000)` |
| 中间件 | `app.use(middleware)` | 装饰器 / before_request |

思路完全一样，只是语法换了。

---

## 十四、Python vs JavaScript

| 对比项 | Python | JavaScript |
|--------|--------|------------|
| 运行环境 | 服务器、桌面 | 浏览器 + 服务器(Node) |
| 代码块 | 缩进 | `{}` |
| 语句结尾 | 换行 | `;` |
| 变量声明 | 直接写 | `let / const / var` |
| 字符串拼接 | f-string `f""` | 模板字符串 `` `` |
| 数组 | List `[]` | Array `[]` |
| 对象 | Dict `{}` | Object `{}` |
| 遍历 | `for x in list` | `for (let x of list)` |
| 函数 | `def fn():` | `function fn() {}` |
| this | `self`（手动写） | `this`（自动绑定） |
| 异步 | async/await | async/await（几乎一样） |
| 包管理 | pip + venv | npm + node_modules |
| 模块 | `from x import y` | `import { y } from 'x'` |
| 适用领域 | AI/数据/后端/自动化 | 前端/全栈/工具 |
| 运行速度 | 中等 | 中等偏快 |
| 学习曲线 | 简单 | 简单 |

---

## 十五、面试八股

### 1. Python 中 == 和 is 的区别？

**参考答案：**

- `==` 比较的是**值**是否相等（类似 JS 的 `===`，但 Python 不会做类型转换）
- `is` 比较的是**内存地址**（身份）是否相同（类似 JS 的 `Object.is`）

```python
a = [1, 2, 3]
b = [1, 2, 3]
a == b   # True（值相等）
a is b   # False（不是同一个对象）

c = a
a is c   # True（指向同一个对象）
```

**特殊情况**：Python 会缓存小整数（-5 到 256）和短字符串，所以 `a = 1; b = 1; a is b` 是 True。但这不适用于大整数和长字符串。

**什么时候用 is**：判断 None 时推荐用 `if x is None`，而不是 `if x == None`。

---

### 2. 深拷贝和浅拷贝？

**参考答案：**

```python
import copy

# 浅拷贝：只拷贝第一层，嵌套对象还是引用
a = [[1, 2], [3, 4]]
b = copy.copy(a)              # 浅拷贝
b[0].append(3)
print(a)  # [[1, 2, 3], [3, 4]]（a 也变了！）

# 深拷贝：完全独立，互不影响
a = [[1, 2], [3, 4]]
b = copy.deepcopy(a)         # 深拷贝
b[0].append(3)
print(a)  # [[1, 2], [3, 4]]（a 不受影响）
```

| 方式 | 效果 |
|------|------|
| `b = a` | 引用赋值，完全共享 |
| `b = a.copy()` / `b = a[:]` | 浅拷贝，第一层独立 |
| `b = copy.copy(a)` | 浅拷贝（通用方法） |
| `b = copy.deepcopy(a)` | 深拷贝，完全独立 |

---

### 3. 列表和元组有什么区别？

**参考答案：**

| 对比项 | List（列表） | Tuple（元组） |
|--------|-------------|--------------|
| 语法 | `[1, 2, 3]` | `(1, 2, 3)` |
| 可变 | 可修改 | 不可修改 |
| 性能 | 稍慢 | 稍快 |
| 内存 | 占用多 | 占用少 |
| 用途 | 数据要改 | 数据不变 |
| 可哈希 | 不可哈希（不能当字典键） | 可哈希（可以当字典键） |

**什么时候用元组**：
- 数据不应该被修改（比如坐标、配置）
- 需要当字典的键
- 函数返回多个值

---

### 4. *args 和 **kwargs 是什么？

**参考答案：**

- `*args`：收集多余的位置参数为元组
- `**kwargs`：收集多余的关键字参数为字典

```python
def func(a, *args, **kwargs):
    print(f"a = {a}")
    print(f"args = {args}")
    print(f"kwargs = {kwargs}")

func(1, 2, 3, 4, name="张三", age=20)
# a = 1
# args = (2, 3, 4)
# kwargs = {'name': '张三', 'age': 20}
```

**用途**：装饰器、函数转发、参数数量不确定的场景。

---

### 5. Python 的 GIL 是什么？

**参考答案：**

GIL（Global Interpreter Lock，全局解释器锁）是 CPython 的一个机制——同一时刻只有一个线程在执行 Python 字节码。

**影响**：
- 多线程无法真正并行执行 CPU 密集型任务
- I/O 密集型任务不受影响（I/O 等待时 GIL 会释放）

**解决方案**：
- CPU 密集型 → 用多进程（`multiprocessing`），每个进程有自己的 GIL
- I/O 密集型 → 多线程 / async 也够用
- 或用 C 扩展（如 NumPy 底层是 C，不受 GIL 限制）

> 类似 Node.js 的单线程——都不适合 CPU 密集型，都靠异步处理 I/O。

---

### 6. 装饰器是什么？

**参考答案：**

装饰器是一个函数，接受一个函数作为参数，返回一个新函数——在不修改原函数的情况下扩展功能。

```python
# 定义装饰器
def log(func):
    def wrapper(*args, **kwargs):
        print(f"调用 {func.__name__}")
        result = func(*args, **kwargs)
        print(f"调用完毕")
        return result
    return wrapper

# 使用
@log
def add(a, b):
    return a + b

add(1, 2)
# 输出：
# 调用 add
# 调用完毕
```

`@log` 等价于 `add = log(add)`。

**用途**：日志、权限验证、缓存、重试——类似 Java 的注解或 Python 的中间件概念。

---

### 7. 生成器是什么？yield 的作用？

**参考答案：**

生成器是一种特殊的迭代器，用 `yield` 代替 `return` 返回数据。每次调用 `next()` 时执行到 `yield` 暂停，下次从上次暂停的位置继续。

```python
def counter():
    i = 0
    while True:
        yield i
        i += 1

c = counter()
next(c)  # 0
next(c)  # 1
next(c)  # 2
# 不会一次性生成所有值，按需生成，省内存
```

**好处**：不一次性生成所有数据，按需生成，省内存。

**实际场景**：读大文件、处理大数据、无限序列。

```python
# 生成器表达式（类似列表推导式，但用括号）
nums = (n * 2 for n in range(1000000))  # 不占内存
next(nums)  # 0
next(nums)  # 2
```

---

### 8. Python 的作用域规则（LEGB）？

**参考答案：**

Python 查找变量的顺序是 LEGB：

1. **L - Local**：函数内部
2. **E - Enclosing**：外层嵌套函数
3. **G - Global**：模块全局
4. **B - Built-in**：内置（print、len 等）

```python
x = "global"  # G

def outer():
    x = "enclosing"  # E

    def inner():
        x = "local"  # L
        print(x)      # local

    inner()

outer()
```

**修改全局变量**要用 `global` 关键字：
```python
count = 0

def increment():
    global count
    count += 1
```

---

### 9. Python 的垃圾回收机制？

**参考答案：**

Python 的垃圾回收主要靠两种机制：

1. **引用计数**（主要）—— 每个对象有一个引用计数器，引用 +1，删除 -1，为 0 时回收。优点：即时回收。缺点：无法处理循环引用。

2. **分代回收**（辅助）—— 解决循环引用问题。把对象分三代，越老越不容易是垃圾，定期扫描回收。

3. **标记清除**—— 遍历对象图，标记可达对象，清除不可达的。

**手动触发**：`import gc; gc.collect()`

---

### 10. with 语句的原理？

**参考答案：**

`with` 语句是上下文管理器，自动管理资源的获取和释放。

```python
with open("file.txt") as f:
    content = f.read()
# 离开 with 块自动调用 f.close()
```

原理：对象实现了 `__enter__` 和 `__exit__` 两个魔法方法。

```python
class MyResource:
    def __enter__(self):
        print("获取资源")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print("释放资源")
        return True  # 吞掉异常

with MyResource() as r:
    print("使用资源")
# 输出：获取资源 → 使用资源 → 释放资源
```

好处：不用手动关资源、即使出异常也能正确释放。

---

### 11. 列表推导式和生成器表达式的区别？

**参考答案：**

```python
# 列表推导式：一次性生成所有数据，占内存
squares_list = [n ** 2 for n in range(1000000)]
# 占用大量内存

# 生成器表达式：按需生成，几乎不占内存
squares_gen = (n ** 2 for n in range(1000000))
# 只有几百字节的内存开销
```

| 对比项 | 列表推导式 `[]` | 生成器表达式 `()` |
|--------|---------------|------------------|
| 结果 | 列表 | 生成器 |
| 内存 | 一次性全加载 | 按需生成 |
| 遍历次数 | 可多次遍历 | 只能遍历一次 |
| 适合 | 数据量小 | 数据量大 |

---

### 12. Python 中如何实现单例模式？

**参考答案：**

多种方式，最常用的是模块和装饰器：

**方式一：模块（最简单）**
```python
# singleton.py
class Singleton:
    pass

instance = Singleton()
```
```python
# 使用
from singleton import instance  # 模块只加载一次，天然单例
```

**方式二：装饰器**
```python
def singleton(cls):
    instances = {}
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return get_instance

@singleton
class Database:
    pass
```

**方式三：__new__ 方法**
```python
class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

---

## 十六、总结

对会 JS 的人来说，学 Python 就是学「换一种语法写同样的逻辑」。变量、函数、条件、循环、面向对象——核心概念你都懂了，只是写法不同。

**核心学习路径：**

1. **语法基础** —— 变量、字符串、数字、注释（和 JS 很像，注意缩进）
2. **数据结构** —— List（数组）、Dict（对象）、Tuple（不可变数组）、Set（去重）
3. **流程控制** —— if / for / while（注意冒号和缩进）
4. **函数** —— def、默认参数、*args、**kwargs、lambda
5. **面向对象** —— class、__init__、self、继承
6. **模块** —— import / from...import（类似 ES Module）
7. **文件操作** —— with open、json 读写
8. **写接口** —— Flask / FastAPI（和 Express 思路一样）

**JS → Python 速记表：**

| JS | Python |
|----|--------|
| `console.log()` | `print()` |
| `let x = 1` | `x = 1` |
| `` `hello ${name}` `` | `f"hello {name}"` |
| `function fn() {}` | `def fn():` |
| `arr.map(f)` | `[f(x) for x in arr]` |
| `arr.filter(f)` | `[x for x in arr if f(x)]` |
| `Object.keys(obj)` | `obj.keys()` |
| `try/catch` | `try/except` |
| `throw` | `raise` |
| `npm` | `pip` |
| `node_modules` | `venv` |
| `import { x }` | `from x import y` |
| `this` | `self` |
| `null` | `None` |
| `true/false` | `True/False` |

**学习建议**：写两个小项目练手——一个 Flask 接口（和之前 Node.js 的 CRUD 一样），一个爬虫脚本（用 requests + BeautifulSoup 抓网页数据）。写完你就入门了。
