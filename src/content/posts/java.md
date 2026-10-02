---
title: "Java 快速入门：从 JS 视角到写接口"
published: 2026-09-10
description: "从 JS 视角快速入门 Java：语法、面向对象、集合框架、Spring Boot 写接口，含常见坑点。"
tags: ["Java","Spring"]
category: "Java"
image: "/blogs/Java/java-cover.jpg"
author: "jojo"
draft: false
comment: true
lang: "zh-CN"
aiPolished: false
---
# Java 快速入门：从 JS 视角到写接口

> 目录
>
> 1. [Java 是什么](#一java-是什么)
> 2. [快速上手：安装和第一个程序](#二快速上手安装和第一个程序)
> 3. [基础语法：和 JS 对比着学](#三基础语法和-js-对比着学)
> 4. [面向对象：Java 的灵魂](#四面向对象java-的灵魂)
> 5. [集合框架：List / Set / Map](#五集合框架list--set--map)
> 6. [异常处理](#六异常处理)
> 7. [泛型](#七泛型)
> 8. [Lambda 和 Stream](#八lambda-和-stream)
> 9. [文件操作](#九文件操作)
> 10. [多线程基础](#十多线程基础)
> 11. [实战：用 Spring Boot 写接口](#十一实战用-spring-boot-写接口)
> 12. [Java vs JavaScript](#十二java-vs-javascript)
> 13. [面试八股](#十三面试八股)
> 14. [总结](#十四总结)

---

## 一、Java 是什么

一句话：**Java 是一门强类型、面向对象、编译执行的编程语言。**

你可能觉得 Java 很「重」——写个 Hello World 要建类、写 main 方法、编译、运行……比起 JS 的 `console.log("hi")` 确实麻烦。但这个「重」带来的好处是：**类型安全、错误在编译期就能发现、大项目好维护。**

### Java 的特点

| 特点 | 说明 |
|------|------|
| 强类型 | 每个变量必须声明类型（int、String），不能乱来 |
| 面向对象 | 一切皆对象，类是基本单位 |
| 编译执行 | .java → 编译 → .class → JVM 运行 |
| 跨平台 | 一次编写，到处运行（靠 JVM） |
| 生态丰富 | Maven/Gradle 上有无数成熟框架 |
| 运行速度快 | 比 Python 快，和 JS 差不多或更快 |

### Java 能干嘛？

- **企业后端** —— Spring Boot 写接口，大部分公司的后端
- **安卓开发** —— Android App 原生开发
- **大数据** —— Hadoop、Spark、Flink 都是 Java/Scala 写的
- **金融系统** —— 银行、证券、保险的核心系统
- **工具中间件** —— 各种中间件（Kafka、ElasticSearch 底层是 Java）

> 打个比方：JS 是「灵活的快刀」，Python 是「全能的瑞士军刀」，Java 是「重型机床」——启动慢、操作多，但一旦转起来精度高、不犯错、能干大活。

---

## 二、快速上手：安装和第一个程序

### 1. 安装 JDK

JDK（Java Development Kit）是 Java 开发工具包。去 [adoptium.net](https://adoptium.net/) 下载 LTS 版本（比如 Java 17 或 21），安装后配置环境变量。

验证：

```bash
java -version    # java 17.x.x
javac -version   # javac 17.x.x（编译器）
```

> JDK = 编译器（javac）+ 运行环境（JRE）+ 开发工具。你只需要装 JDK，里面包含一切。

### 2. 第一个程序

Java 的 Hello World 比其他语言「啰嗦」：

```java
// Hello.java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello Java!");

        String name = "前端仔";
        System.out.println("你好，" + name);

        int age = 20;
        if (age >= 18) {
            System.out.println("成年了");
        }
    }
}
```

**注意**：文件名必须和 `public class` 的名字一致。`Hello.java` 里必须是 `public class Hello`。

### 3. 编译和运行

Java 是**编译型语言**——先编译成字节码（.class），再用 JVM 运行。

```bash
# 编译（生成 Hello.class）
javac Hello.java

# 运行（执行字节码）
java Hello
```

> 这是 Java 和 JS/Python 最大的区别：JS/Python 是解释执行的（直接运行源码），Java 要先编译再运行。好处是编译期就能发现很多错误。

### 4. 为什么这么啰嗦

```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("hi");
    }
}
```

逐行解释：
- `public class Hello` —— Java 一切皆对象，代码必须放在类里
- `public static void main(String[] args)` —— 程序入口，固定写法
  - `public` —— 公开的，JVM 能访问
  - `static` —— 静态的，不用实例化就能调
  - `void` —— 没有返回值
  - `main` —— 方法名，JVM 找的就是这个名字
  - `String[] args` —— 命令行参数
- `System.out.println("hi")` —— 就是 `console.log("hi")`

> 啰嗦是啰嗦，但写多了就习惯了。IDE（IntelliJ IDEA）可以一键生成这些模板代码。

### 5. 和 JS 的核心区别

| 对比项 | JavaScript | Java |
|--------|-----------|------|
| 类型系统 | 动态类型 | 强类型（必须声明） |
| 执行方式 | 解释执行 | 编译 → 运行 |
| 代码块 | `{}` | `{}`（一样） |
| 语句结尾 | `;`（可省） | `;`（必须） |
| 输出 | `console.log()` | `System.out.println()` |
| 字符串拼接 | `+` 或模板字符串 | `+` |
| 数组 | `[1, 2, 3]` | `int[] arr = {1, 2, 3}` |
| 对象 | `{}` 字面量 | 必须定义类 |
| this | 动态绑定 | 当前对象实例 |
| 包管理 | npm | Maven / Gradle |

---

## 三、基础语法：和 JS 对比着学

### 1. 变量和类型

Java 是强类型——**每个变量必须先声明类型**。

```java
// 基本类型（8 种）
int age = 20;              // 整数
long count = 99999999999L; // 长整数（末尾加 L）
double price = 19.99;     // 小数
float score = 95.5f;      // 单精度小数（末尾加 f）
boolean isOk = true;      // 布尔值（小写 true/false）
char grade = 'A';         // 单个字符（单引号）
byte b = 100;             // 小整数（-128~127）
short s = 1000;           // 短整数

// 引用类型
String name = "张三";      // 字符串（双引号）
int[] nums = {1, 2, 3};   // 数组
```

**基本类型 vs 引用类型**：
- 基本类型：存在栈里，赋值是复制值。int、long、double、float、boolean、char、byte、short
- 引用类型：存在堆里，赋值是复制引用（地址）。String、数组、所有对象

> 类似 JS 的值类型 vs 引用类型，但 Java 分得更细。

### 2. String

```java
String name = "张三";
String greeting = "你好，" + name;  // 拼接

// Java 没有模板字符串，但有 String.format
String msg = String.format("我叫%s，今年%d岁", name, 20);

// Java 15+ 有文本块（类似 JS 模板字符串的多行）
String html = """
    <div>
      <h1>标题</h1>
    </div>
    """;

// 常用方法
name.length()              // 长度（是方法，不是属性）
name.toUpperCase()          // 大写
name.toLowerCase()          // 小写
name.substring(0, 2)       // 截取
name.split(",")            // 分割
name.replace("三", "四")   // 替换
name.trim()                // 去空格
name.equals("张三")        // 比较（不能用 ==！）
name.isEmpty()             // 是否为空
```

**重要：字符串比较用 equals，不能用 ==**

```java
String a = "hello";
String b = "hello";
String c = new String("hello");

a == b      // true（碰巧同地址，但不保证）
a == c      // false（不同对象，地址不同）
a.equals(c) // true（值相等，这才是对的）
```

> JS 里 `===` 比较值，Java 里 `==` 比较地址。字符串比较必须用 `.equals()`。

### 3. 运算符

```java
// 算术（和 JS 一样）
int a = 10, b = 3;
a + b    // 13
a - b    // 7
a * b    // 30
a / b    // 3（整数除整数还是整数！）
a % b    // 1

// 注意：10 / 3 = 3（不是 3.333）
// 要小数的话，至少一个操作数是小数
10.0 / 3  // 3.333...
(double) 10 / 3  // 3.333...（强转）

// 逻辑
boolean x = true, y = false;
x && y   // false
x || y   // true
!x       // false

// 三元（和 JS 一样）
int max = a > b ? a : b;
```

### 4. 数组

```java
// 声明
int[] nums = {1, 2, 3, 4, 5};
String[] names = {"张三", "李四", "王五"};

// 访问
nums[0]          // 1
nums.length      // 5（是属性，不是方法）

// 修改
nums[0] = 10;

// 创建指定大小的数组
int[] arr = new int[5];  // [0, 0, 0, 0, 0]（默认值是 0）

// 遍历
for (int i = 0; i < nums.length; i++) {
    System.out.println(nums[i]);
}

// 增强 for 循环（类似 JS 的 for...of）
for (int n : nums) {
    System.out.println(n);
}

// Java 数组大小固定，不能 push！
// 要动态增删，用 ArrayList（后面讲）
```

**Java 数组 vs JS 数组**：
- Java 数组大小固定，创建后不能加元素
- Java 数组类型固定，`int[]` 只能放 int
- 要动态增删，用 `ArrayList`（Java 的动态数组）

### 5. 流程控制

```java
// if
int age = 20;
if (age >= 18) {
    System.out.println("成年");
} else if (age >= 12) {
    System.out.println("青少年");
} else {
    System.out.println("小朋友");
}

// switch（Java 14+ 支持箭头语法）
String role = "admin";
switch (role) {
    case "admin" -> System.out.println("管理员");
    case "user"  -> System.out.println("普通用户");
    default      -> System.out.println("未知");
}

// for 循环
for (int i = 0; i < 5; i++) {
    System.out.println(i);
}

// while
int count = 0;
while (count < 5) {
    System.out.println(count);
    count++;
}
```

> 和 JS 的流程控制几乎一模一样，语法是通用的。

### 6. 方法（函数）

```java
// JS: function add(a, b) { return a + b }
// Java:
public static int add(int a, int b) {
    return a + b;
}

// 调用
int result = add(1, 2);  // 3

// 无返回值用 void
public static void greet(String name) {
    System.out.println("你好，" + name);
}

// 默认参数？Java 不支持！要重载
public static void greet() {
    greet("陌生人");
}
public static void greet(String name) {
    System.out.println("你好，" + name);
}
```

**Java 方法和 JS 函数的区别**：
- 必须写返回值类型（`int`、`void`、`String` 等）
- 必须写参数类型（`int a`，不是 `a`）
- 没有默认参数，用方法重载代替
- 必须在类里面定义，不能独立存在

---

## 四、面向对象：Java 的灵魂

Java 是**纯面向对象语言**——一切皆对象，所有代码都在类里。

### 1. 类和对象

```java
// 定义类
public class Person {
    // 属性（字段）
    private String name;
    private int age;

    // 构造方法（类似 JS 的 constructor）
    public Person(String name, int age) {
        this.name = name;   // this 和 JS 一样，指向当前实例
        this.age = age;
    }

    // getter（读取属性）
    public String getName() {
        return name;
    }

    // setter（设置属性）
    public void setName(String name) {
        this.name = name;
    }

    // 方法
    public void sayHi() {
        System.out.println("我叫" + name + "，今年" + age + "岁");
    }
}

// 使用
Person p = new Person("张三", 20);  // 必须 new
p.sayHi();                          // 我叫张三，今年20岁
p.getName();                        // 张三
p.setName("李四");                   // 改名
```

**和 JS class 的区别**：
- Java 属性默认 private（封装），通过 getter/setter 访问
- JS 属性默认 public，直接 `obj.name` 访问
- Java 构造方法名必须和类名一样，JS 用 `constructor`
- Java 方法必须写返回值类型，JS 不用

> 为什么要 private + getter/setter？封装保护——外部不能随便改属性，只能通过你定义的方法改，可以加校验逻辑。这是 Java 的规矩。

### 2. 访问修饰符

| 修饰符 | 本类 | 同包 | 子类 | 其他 |
|--------|------|------|------|------|
| `public` | ✅ | ✅ | ✅ | ✅ |
| `protected` | ✅ | ✅ | ✅ | ❌ |
| 默认（package） | ✅ | ✅ | ❌ | ❌ |
| `private` | ✅ | ❌ | ❌ | ❌ |

> 实际开发中：属性用 `private`，方法用 `public`。

### 3. 继承

```java
// 父类
public class Animal {
    protected String name;  // protected 子类能访问

    public Animal(String name) {
        this.name = name;
    }

    public void eat() {
        System.out.println(name + "在吃东西");
    }
}

// 子类（Java 用 extends 继承，和 JS 一样）
public class Dog extends Animal {
    private String breed;

    public Dog(String name, String breed) {
        super(name);          // 调用父类构造（必须放第一行）
        this.breed = breed;
    }

    // 子类自己的方法
    public void bark() {
        System.out.println(name + "在汪汪叫");
    }

    // 重写父类方法（@Override 是注解，表示重写，可省略但建议加）
    @Override
    public void eat() {
        System.out.println(name + "在啃骨头");
    }
}

// 使用
Dog dog = new Dog("旺财", "金毛");
dog.eat();   // 旺财在啃骨头（子类重写的）
dog.bark();  // 旺财在汪汪叫
```

**和 JS 继承的区别**：
- Java 只能单继承（一个类只能 extends 一个父类），JS 也没多继承
- Java 用 `super()` 调父类构造，JS 也是 `super()`
- Java 用 `@Override` 注解标记重写，JS 没有这个概念

### 4. 接口

接口是 Java 面向对象的重要概念——**定义一组方法签名，不实现，让类去实现**。

```java
// 定义接口
public interface Flyable {
    void fly();  // 只有声明，没有实现
}

// 实现接口（用 implements）
public class Bird extends Animal implements Flyable {
    public Bird(String name) {
        super(name);
    }

    @Override
    public void fly() {
        System.out.println(name + "在飞");
    }
}

// 接口可以多实现（解决单继承的局限）
public class Duck extends Animal implements Flyable, Swimmable {
    // 必须实现 Flyable 和 Swimmable 的所有方法
    @Override
    public void fly() { ... }

    @Override
    public void swim() { ... }
}
```

**接口 vs 抽象类**：

| 对比项 | 接口（interface） | 抽象类（abstract class） |
|--------|------------------|------------------------|
| 继承 | 可多实现 | 只能单继承 |
| 构造方法 | 没有 | 有 |
| 字段 | 只能有常量 | 可以有普通字段 |
| 方法 | 只能有声明（Java 8 前） | 可以有实现 |
| 适合 | 定义规范/契约 | 共享代码 |

> 简单说：接口是「能做什么」（Can-do），抽象类是「是什么」（Is-a）。

### 5. 多态

```java
// 父类引用指向子类对象
Animal a = new Dog("旺财");
a.eat();  // 旺财在啃骨头（调用的是 Dog 的 eat，不是 Animal 的）

// 这叫多态：编译时是 Animal 类型，运行时执行 Dog 的方法
```

多态的好处：方法参数可以传父类类型，实际传子类对象，方法内部调用时自动执行子类的实现。

```java
// 一个方法处理所有动物
public void feed(Animal animal) {
    animal.eat();  // 不管传 Dog 还是 Cat，都能正确调用各自的 eat
}

feed(new Dog("旺财"));  // 旺财在啃骨头
feed(new Cat("咪咪"));  // 咪咪在吃鱼
```

---

## 五、集合框架：List / Set / Map

Java 的数组大小固定，实际开发中用**集合**——大小可变、功能丰富。

### 1. ArrayList（动态数组，类似 JS Array）

```java
import java.util.ArrayList;

ArrayList<String> list = new ArrayList<>();

// 增
list.add("张三");
list.add("李四");
list.add(0, "王五");    // 指定位置插入

// 删
list.remove("张三");    // 按值删
list.remove(0);        // 按索引删

// 改
list.set(0, "赵六");   // 修改指定位置

// 查
list.get(0);           // 获取指定位置
list.size();           // 长度
list.contains("李四");  // 是否包含
list.indexOf("李四");   // 索引

// 遍历
for (String name : list) {
    System.out.println(name);
}

// 转 JS 对应：
// add → push       remove → splice     get → arr[i]
// size → length    contains → includes
```

### 2. HashSet（去重集合，类似 JS Set）

```java
import java.util.HashSet;

HashSet<String> set = new HashSet<>();
set.add("苹果");
set.add("香蕉");
set.add("苹果");   // 重复的加不进去

set.size();        // 2
set.contains("苹果");  // true
set.remove("香蕉");

// 数组去重
int[] nums = {1, 2, 2, 3, 3, 3};
Set<Integer> unique = new HashSet<>();
for (int n : nums) unique.add(n);
```

### 3. HashMap（键值对，类似 JS Object）

```java
import java.util.HashMap;

HashMap<String, Integer> map = new HashMap<>();

// 增/改
map.put("张三", 20);
map.put("李四", 25);
map.put("张三", 21);   // 覆盖

// 查
map.get("张三");        // 21
map.getOrDefault("王五", 0);  // 0（不存在返回默认值）
map.containsKey("张三");  // true

// 删
map.remove("李四");

// 遍历
for (String key : map.keySet()) {
    System.out.println(key + ": " + map.get(key));
}

for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}

// size
map.size();  // 1
```

### 4. 集合对照表

| JS | Java | 特点 |
|----|------|------|
| `Array` | `ArrayList` | 有序、可重复、可变大小 |
| `Set` | `HashSet` | 无序、不可重复 |
| `Object` | `HashMap` | 键值对 |
| — | `LinkedList` | 链表（频繁增删头尾时更快） |
| — | `TreeMap` | 有序的键值对（按 key 排序） |

### 5. 包装类

Java 集合只能存**对象**，不能存基本类型。所以有包装类：

| 基本类型 | 包装类 |
|---------|--------|
| int | Integer |
| long | Long |
| double | Double |
| boolean | Boolean |
| char | Character |

```java
// 集合不能存 int
// ArrayList<int> list = new ArrayList<>();  // ❌

// 要用 Integer
ArrayList<Integer> list = new ArrayList<>();
list.add(1);     // 自动装箱：int → Integer
list.add(2);
int n = list.get(0);  // 自动拆箱：Integer → int
```

> 自动装箱/拆箱是 Java 自动完成的，你不用管。只要知道集合里存的是 Integer 不是 int 就行。

---

## 六、异常处理

```java
// Java 用 try/catch/finally（和 JS 几乎一样）
try {
    int result = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println("算术错误：" + e.getMessage());
} catch (NullPointerException e) {
    System.out.println("空指针错误");
} catch (Exception e) {
    System.out.println("其他错误");
} finally {
    System.out.println("不管有没有异常都执行");
}
```

### 受检异常 vs 非受检异常

Java 异常分两种（这是 JS 没有的概念）：

| 类型 | 特点 | 例子 | 处理 |
|------|------|------|------|
| 受检异常（Checked） | 编译器强制要求处理 | IOException、SQLException | 必须 try/catch 或 throws |
| 非受检异常（Unchecked） | 编译器不管 | NullPointerException、ArithmeticException | 可处理可不处理 |

```java
import java.io.FileReader;

// 受检异常：必须处理，不处理编译不过！
try {
    FileReader reader = new FileReader("data.txt");
} catch (Exception e) {
    e.printStackTrace();
}

// 或者用 throws 声明抛出
public void readFile() throws IOException {
    FileReader reader = new FileReader("data.txt");
}
```

### 主动抛异常

```java
// Java 用 throw（和 JS 一样）
public void setAge(int age) {
    if (age < 0) {
        throw new IllegalArgumentException("年龄不能为负数");
    }
    this.age = age;
}
```

### 自定义异常

```java
public class BusinessException extends RuntimeException {
    private int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}

// 使用
throw new BusinessException(400, "用户名已存在");
```

---

## 七、泛型

泛型让你在定义类/方法时**不指定具体类型，使用时再确定**——类似 TypeScript 的泛型。

```java
// 不用泛型：集合里什么都能放，不安全
ArrayList list = new ArrayList();
list.add("hello");
list.add(123);     // 居然能放进去
String s = (String) list.get(1);  // 运行时 ClassCastException！

// 用泛型：类型安全
ArrayList<String> list = new ArrayList<>();
list.add("hello");
// list.add(123);  // 编译报错，放不进去
String s = list.get(0);  // 不用强转
```

### 泛型方法

```java
// 类似 TS 的 function fn<T>(arg: T): T
public static <T> T getFirst(T[] arr) {
    return arr[0];
}

String[] names = {"a", "b", "c"};
String first = getFirst(names);  // "a"

Integer[] nums = {1, 2, 3};
Integer n = getFirst(nums);  // 1
```

### 泛型类

```java
// 自定义泛型类
public class Result<T> {
    private int code;
    private String message;
    private T data;

    public Result(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public T getData() { return data; }
}

// 使用（类似 TS 的 Result<User>）
Result<String> r1 = new Result<>(0, "成功", "hello");
Result<User> r2 = new Result<>(0, "成功", new User("张三", 20));
```

> 泛型 = 类型参数化。你写的时候不知道类型，用的时候指定。好处是类型安全 + 复用。

---

## 八、Lambda 和 Stream

Java 8 引入了 Lambda 和 Stream，让 Java 终于能像 JS/Python 一样写函数式代码了。

### Lambda 表达式

```java
// Java 8 之前：用匿名内部类（很啰嗦）
Runnable r = new Runnable() {
    @Override
    public void run() {
        System.out.println("hello");
    }
};

// Java 8+：Lambda
Runnable r = () -> System.out.println("hello");

// 类似 JS 箭头函数：() => console.log("hello")
```

### 集合 + Lambda

```java
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

List<Integer> nums = Arrays.asList(1, 2, 3, 4, 5);

// map：每个元素乘 2
List<Integer> doubled = nums.stream()
    .map(n -> n * 2)
    .collect(Collectors.toList());  // [2, 4, 6, 8, 10]

// filter：过滤大于 2 的
List<Integer> filtered = nums.stream()
    .filter(n -> n > 2)
    .collect(Collectors.toList());  // [3, 4, 5]

// reduce：求和
int sum = nums.stream()
    .reduce(0, Integer::sum);  // 15

// sorted：排序
List<Integer> sorted = nums.stream()
    .sorted((a, b) -> b - a)  // 降序
    .collect(Collectors.toList());

// forEach
nums.stream().forEach(n -> System.out.println(n));

// 对象列表操作
List<User> users = Arrays.asList(
    new User("张三", 20),
    new User("李四", 25),
    new User("王五", 30)
);

// 获取所有名字
List<String> names = users.stream()
    .map(User::getName)           // 方法引用，等价于 u -> u.getName()
    .collect(Collectors.toList());

// 过滤年龄大于 22 的
List<User> adults = users.stream()
    .filter(u -> u.getAge() > 22)
    .collect(Collectors.toList());

// 按年龄排序
users.stream()
    .sorted((a, b) -> a.getAge() - b.getAge())
    .collect(Collectors.toList());
```

**对比 JS**：

| 操作 | JS | Java Stream |
|------|----|-------------|
| 遍历 | `arr.forEach(f)` | `list.stream().forEach(f)` |
| 映射 | `arr.map(f)` | `list.stream().map(f).collect(...)` |
| 过滤 | `arr.filter(f)` | `list.stream().filter(f).collect(...)` |
| 排序 | `arr.sort(f)` | `list.stream().sorted(f).collect(...)` |
| 归约 | `arr.reduce(f, init)` | `list.stream().reduce(init, f)` |

> Java 的 Stream 比 JS 数组方法多一步 `.stream()` 和 `.collect()`，但思路完全一样。方法引用 `User::getName` 是 `u -> u.getName()` 的简写。

---

## 九、文件操作

```java
import java.io.*;
import java.nio.file.*;
import java.util.List;

// 读文本文件（Java 11+ 简单写法）
String content = Files.readString(Path.of("data.txt"));
System.out.println(content);

// 按行读
List<String> lines = Files.readAllLines(Path.of("data.txt"));
for (String line : lines) {
    System.out.println(line);
}

// 写文件
Files.writeString(Path.of("output.txt"), "Hello Java");
```

### JSON 读写（用 Jackson）

Java 没有内置 JSON 支持，用第三方库 Jackson：

```java
import com.fasterxml.jackson.databind.ObjectMapper;

ObjectMapper mapper = new ObjectMapper();

// 对象 → JSON 字符串
User user = new User("张三", 20);
String json = mapper.writeValueAsString(user);
// {"name":"张三","age":20}

// JSON 字符串 → 对象
User user2 = mapper.readValue(json, User.class);
```

> 类似 JS 的 `JSON.stringify()` 和 `JSON.parse()`，但要指定目标类。

---

## 十、多线程基础

Java 的多线程比 JS 强大——JS 是单线程，Java 可以真正并行。

### 创建线程

```java
// 方式一：继承 Thread
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("线程运行中：" + Thread.currentThread().getName());
    }
}
new MyThread().start();

// 方式二：实现 Runnable（推荐）
Thread t = new Thread(() -> {
    System.out.println("Lambda 线程");
});
t.start();
```

### 线程池

```java
import java.util.concurrent.*;

// 创建线程池
ExecutorService pool = Executors.newFixedThreadPool(4);

// 提交任务
pool.submit(() -> {
    System.out.println("任务执行");
});

// 关闭
pool.shutdown();
```

### 并发集合

多线程环境下，普通的 ArrayList/HashMap 不安全，要用并发版本：

```java
import java.util.concurrent.*;

// 线程安全的 List
CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();

// 线程安全的 Map
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
```

> 不用深入学，知道有这东西就行。实际开发中 Spring Boot 帮你处理了大部分并发问题。

---

## 十一、实战：用 Spring Boot 写接口

学完基础语法，来写一套接口——和 Express/Flask 一样的思路，只是用 Java 的方式。

### 1. 创建项目

去 [start.spring.io](https://start.spring.io/) 生成项目，选 Web + JPA + MySQL Driver，下载后用 IDEA 打开。

> 类似 `npm init` + `npm install express mysql2`，Spring Initializr 帮你初始化项目。

### 2. 项目结构

```
src/main/java/com/example/demo/
├── DemoApplication.java       ← 启动类
├── controller/
│   └── UserController.java     ← 控制器（路由）
├── service/
│   └── UserService.java        ← 业务逻辑
├── repository/
│   └── UserRepository.java    ← 数据库操作
├── entity/
│   └── User.java              ← 实体类（对应数据库表）
└── dto/
    └── UserDTO.java           ← 数据传输对象
```

### 3. 实体类

```java
// entity/User.java
@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "users")
public class User {
    @jakarta.persistence.Id
    @jakarta.persistence.GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Integer age;
    private String email;

    // 构造方法、getter、setter（IDEA 可一键生成）
    public User() {}

    public User(String name, Integer age, String email) {
        this.name = name;
        this.age = age;
        this.email = email;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
```

> `@Entity` 注解表示这是一个数据库实体类，对应一张表。`@Id` 表示主键。注解是 Java 的特色——类似 Python 装饰器。

### 4. 数据访问层

```java
// repository/UserRepository.java
import org.springframework.data.jpa.repository.JpaRepository;

// 继承 JpaRepository，自动有 CRUD 方法，不用写 SQL！
public interface UserRepository extends JpaRepository<User, Long> {
    // 按名字模糊查询
    List<User> findByNameContaining(String keyword);
}
```

> 这是 Spring Data JPA 的魔法——你只要定义接口，实现自动生成。比手写 SQL 爽多了。

### 5. 业务逻辑层

```java
// service/UserService.java
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;

    // 构造器注入（Spring 自动注入）
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> findAll(String keyword) {
        if (keyword != null && !keyword.isEmpty()) {
            return userRepository.findByNameContaining(keyword);
        }
        return userRepository.findAll();
    }

    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("用户不存在"));
    }

    public User create(User user) {
        return userRepository.save(user);
    }

    public User update(Long id, User user) {
        User existing = findById(id);
        existing.setName(user.getName());
        existing.setAge(user.getAge());
        existing.setEmail(user.getEmail());
        return userRepository.save(existing);
    }

    public void delete(Long id) {
        userRepository.deleteById(id);
    }
}
```

### 6. 控制器（路由）

```java
// controller/UserController.java
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/users?keyword=张
    @GetMapping
    public List<User> list(@RequestParam(required = false) String keyword) {
        return userService.findAll(keyword);
    }

    // GET /api/users/1
    @GetMapping("/{id}")
    public User detail(@PathVariable Long id) {
        return userService.findById(id);
    }

    // POST /api/users
    @PostMapping
    public User create(@RequestBody User user) {
        return userService.create(user);
    }

    // PUT /api/users/1
    @PutMapping("/{id}")
    public User update(@PathVariable Long id, @RequestBody User user) {
        return userService.update(id, user);
    }

    // DELETE /api/users/1
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}
```

### 7. 启动

```java
// DemoApplication.java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

运行后，接口就在 `http://localhost:8080/api/users` 了。

### 8. 对比 Express 和 Spring Boot

| 对比项 | Express | Spring Boot |
|--------|---------|-------------|
| 路由定义 | `app.get('/users', fn)` | `@GetMapping("/users")` |
| 路径参数 | `req.params.id` | `@PathVariable Long id` |
| 查询参数 | `req.query.keyword` | `@RequestParam String keyword` |
| 请求体 | `req.body` | `@RequestBody User user` |
| 返回 JSON | `res.json(data)` | 直接 return（自动转 JSON） |
| 中间件 | `app.use(fn)` | `@Component` / 拦截器 |
| 分层 | 自由组织 | Controller/Service/Repository |
| 数据库 | 手写 SQL 或 ORM | JPA 自动生成 |

> Spring Boot 的注解虽然看起来眼花缭乱，但每个注解就对应一个功能——`@GetMapping` = 路由，`@RequestBody` = 取 body，`@PathVariable` = 取路径参数。搞懂这些注解就会写接口了。

---

## 十二、Java vs JavaScript

| 对比项 | Java | JavaScript |
|--------|------|------------|
| 类型系统 | 强类型 | 动态类型 |
| 执行方式 | 编译 → JVM 运行 | 解释执行 |
| 面向对象 | 纯面向对象 | 多范式 |
| 代码块 | `{}` | `{}` |
| 字符串 | `+` 拼接 | 模板字符串 |
| 数组 | 固定大小，用 ArrayList | 动态 |
| 对象 | 必须定义类 | 字面量 `{}` |
| 继承 | 单继承 + 接口多实现 | 原型链 |
| 多线程 | 真多线程 | 单线程事件循环 |
| 泛型 | 有 | 没有（TS 有） |
| Lambda | Java 8+ 有 | 箭头函数 |
| 包管理 | Maven/Gradle | npm |
| 适用领域 | 企业后端/安卓/大数据 | 前端/全栈/工具 |
| 运行速度 | 快 | 中等 |
| 学习曲线 | 较陡 | 平缓 |
| 代码量 | 多（啰嗦） | 少（简洁） |

---

## 十三、面试八股

### 1. Java 中 == 和 equals 的区别？

**参考答案：**

- `==`：比较基本类型的**值**，比较引用类型的**内存地址**
- `equals`：Object 默认也是比较地址，但 String、Integer 等重写了 equals，比较的是**内容**

```java
String a = new String("hello");
String b = new String("hello");
a == b       // false（不同对象，地址不同）
a.equals(b)  // true（内容相同）

int x = 10, y = 10;
x == y  // true（基本类型比较值）
```

**规则**：比较基本类型用 `==`，比较字符串/对象用 `equals`。

---

### 2. String、StringBuilder、StringBuffer 的区别？

**参考答案：**

| 类 | 可变性 | 线程安全 | 性能 | 用途 |
|----|--------|---------|------|------|
| String | 不可变 | 安全 | 慢 | 少量拼接 |
| StringBuilder | 可变 | 不安全 | 快 | 单线程拼接 |
| StringBuffer | 可变 | 安全 | 中等 | 多线程拼接 |

**为什么 String 不可变**：每次拼接都创建新对象，大量拼接性能差。用 StringBuilder 可以在原对象上追加，不用反复创建。

```java
// ❌ 每次拼接都创建新 String
String s = "";
for (int i = 0; i < 1000; i++) {
    s += i;  // 创建 1000 个临时对象
}

// ✅ 用 StringBuilder
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i);  // 在原对象上追加
}
String result = sb.toString();
```

---

### 3. HashMap 的原理？

**参考答案：**

Java 8 的 HashMap 是**数组 + 链表 + 红黑树**。

1. **put**：计算 key 的 hash → 定位数组位置 → 没有就直接放，有就追加到链表
2. **链表太长（≥8）**：转成红黑树，查找从 O(n) 变 O(log n)
3. **扩容**：元素超过容量 × 0.75（负载因子），数组扩容一倍，重新分布

**要点**：
- 默认初始容量 16
- 负载因子 0.75
- 链表长度 ≥ 8 且数组长度 ≥ 64 才转红黑树
- 线程不安全，多线程用 ConcurrentHashMap

---

### 4. ArrayList 和 LinkedList 的区别？

**参考答案：**

| 对比项 | ArrayList | LinkedList |
|--------|-----------|------------|
| 底层 | 数组 | 双向链表 |
| 随机访问 | O(1) | O(n) |
| 头部插入 | O(n) | O(1) |
| 尾部插入 | 均摊 O(1) | O(1) |
| 内存 | 连续 | 不连续（多存前后指针） |
| 适合 | 读多写少 | 频繁增删 |

> 实际开发中 99% 用 ArrayList。LinkedList 的优势场景很少。

---

### 5. 接口和抽象类的区别？

**参考答案：**

| 对比项 | 接口 | 抽象类 |
|--------|------|--------|
| 关键字 | interface | abstract class |
| 继承 | 可多实现 | 单继承 |
| 构造方法 | 无 | 有 |
| 字段 | 只能常量 | 普通字段 |
| 方法 | 默认 public abstract（Java 8+ 可有默认方法） | 可有普通方法 |
| 设计理念 | Can-do（能做什么） | Is-a（是什么） |

**选择**：定义规范用接口，共享代码用抽象类。

---

### 6. Java 的垃圾回收（GC）机制？

**参考答案：**

Java 的 GC 自动管理内存，不需要手动释放（不像 C/C++）。

**核心概念**：
- **新生代**：新创建的对象，GC 频繁
- **老年代**：存活久的对象，GC 少
- **Minor GC**：清理新生代，频繁但快
- **Major GC / Full GC**：清理老年代 + 新生代，慢

**回收算法**：
- **复制算法**：新生代用，把存活对象复制到另一半
- **标记-清除**：标记存活对象，清除其他
- **标记-整理**：标记 + 清除 + 整理（防碎片）

**判断对象是否可回收**：可达性分析——从 GC Roots 开始遍历，不可达的就是垃圾。

> 类似 Python 的引用计数 + 分代回收，但 Java 用的是可达性分析。

---

### 7. 什么是多态？

**参考答案：**

多态是面向对象三大特性之一（封装、继承、多态）。

**多态的三个条件**：
1. 继承（子类继承父类）
2. 重写（子类重写父类方法）
3. 父类引用指向子类对象（`Animal a = new Dog()`）

**效果**：编译时看父类类型，运行时执行子类方法。

```java
Animal a = new Dog();  // 父类引用指向子类对象
a.eat();               // 执行 Dog 的 eat（运行时决定）
```

**好处**：提高扩展性——新增子类不用改原有代码，方法参数用父类类型，传任何子类都行。

---

### 8. 什么是 Java 的注解？

**参考答案：**

注解是 Java 的元数据机制，给代码加标记，不直接影响执行。

```java
@Override        // 标记重写父类方法
@Deprecated      // 标记已过时
@SuppressWarnings // 抑制警告
```

**Spring Boot 中大量使用**：
```java
@RestController     // 标记这是个 REST 控制器
@RequestMapping     // 定义路由
@Autowired          // 自动注入依赖
@Service            // 标记这是个 Service
@Entity             // 标记这是个数据库实体
```

**原理**：注解本身不做任何事，是框架在运行时通过反射读取注解，然后执行相应逻辑。

> 类似 Python 装饰器，但 Java 注解只是标记，逻辑由框架实现。

---

### 9. final 关键字的作用？

**参考答案：**

`final` 可以修饰类、方法、变量：

| 修饰对象 | 效果 |
|---------|------|
| 类 | 不能被继承（如 String） |
| 方法 | 不能被重写 |
| 变量 | 只能赋值一次（常量） |
| 对象 | 引用不能改，但属性可以改 |

```java
final int MAX = 100;        // 常量，不能再改
final User user = new User(...);  // 引用不能改
user.setName("李四");       // ✅ 属性可以改
user = new User(...);       // ❌ 引用不能改

final class String { }      // 不能被继承
```

> 类似 JS 的 `const`，但 Java 的 final 更灵活——可以只锁引用不锁属性。

---

### 10. Java 中的 Stream API 是什么？

**参考答案：**

Stream API（Java 8+）是对集合的函数式操作，类似 JS 的数组方法链式调用。

```java
// 过滤 + 映射 + 排序 + 收集
List<String> names = users.stream()
    .filter(u -> u.getAge() > 20)
    .map(User::getName)
    .sorted()
    .collect(Collectors.toList());
```

**特点**：
- 不改变原集合（返回新流）
- 惰性执行（终端操作才真正执行）
- 可并行（parallelStream 多线程）

**对比 JS**：

| Java Stream | JS Array |
|-------------|----------|
| `.stream().map(f).collect(...)` | `.map(f)` |
| `.stream().filter(f).collect(...)` | `.filter(f)` |
| `.stream().sorted()` | `.sort()` |
| `.stream().reduce(init, f)` | `.reduce(f, init)` |
| `.stream().forEach(f)` | `.forEach(f)` |

---

### 11. 什么是 Spring IoC 和 DI？

**参考答案：**

- **IoC（Inversion of Control，控制反转）**：对象的创建和管理交给 Spring 容器，不在代码里 new
- **DI（Dependency Injection，依赖注入）**：Spring 自动把依赖的对象传进来

```java
// 不用 Spring：自己 new
UserService service = new UserService(new UserRepository());

// 用 Spring：自动注入
@Service
public class UserService {
    private final UserRepository userRepository;

    // Spring 自动把 UserRepository 注入进来
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
```

**好处**：解耦——组件之间不用直接依赖，换实现不用改代码。

> 类似 Express 里 `app.use(express.json())`——Express 帮你创建和管理中间件。Spring 更彻底，所有组件都由容器管理。

---

### 12. Java 中 sleep 和 wait 的区别？

**参考答案：**

| 对比项 | sleep | wait |
|--------|-------|------|
| 所属 | Thread 类 | Object 类 |
| 释放锁 | 不释放 | 释放 |
| 用途 | 暂停执行 | 线程间通信 |
| 唤醒 | 超时自动 | notify/notifyAll 或超时 |
| 调用位置 | 任意 | 必须在同步块 |

```java
// sleep：暂停 1 秒，不释放锁
Thread.sleep(1000);

// wait：等待，释放锁，需要 notify 唤醒
synchronized (lock) {
    lock.wait();       // 释放锁，等待
}
synchronized (lock) {
    lock.notify();     // 唤醒等待的线程
}
```

---

## 十四、总结

Java 对会 JS 的人来说，核心难点不是语法——是**强类型和面向对象**。你得习惯：每个变量写类型、一切皆类、属性 private + getter/setter、接口和继承。

**核心学习路径：**

1. **语法基础** —— 变量类型、字符串、流程控制（和 JS 很像，注意类型声明）
2. **面向对象** —— 类、对象、继承、接口、多态（Java 的灵魂）
3. **集合** —— ArrayList（数组）、HashMap（对象）、HashSet（Set）
4. **异常** —— try/catch、受检 vs 非受检
5. **泛型** —— 类型参数化（类似 TS 泛型）
6. **Lambda/Stream** —— 函数式编程（类似 JS 数组方法）
7. **Spring Boot** —— 写接口（注解驱动，和 Express 思路一样）

**JS → Java 速记表：**

| JS | Java |
|----|------|
| `let x = 1` | `int x = 1;` |
| `const s = "hi"` | `String s = "hi";` |
| `` `hello ${name}` `` | `"hello " + name` |
| `function fn() {}` | `public static void fn() {}` |
| `arr.map(f)` | `list.stream().map(f).collect(...)` |
| `arr.filter(f)` | `list.stream().filter(f).collect(...)` |
| `class extends` | `class extends` |
| `super()` | `super()` |
| `try/catch` | `try/catch` |
| `throw new Error()` | `throw new RuntimeException()` |
| `npm` | `Maven / Gradle` |
| `import { x }` | `import x` |
| `JSON.parse()` | `mapper.readValue()` |
| `console.log()` | `System.out.println()` |
| `null` | `null` |
| `undefined` | 没有（用 null 代替） |
| `const obj = {}` | 必须定义类 |
| `Object.keys(obj)` | `map.keySet()` |

**学习建议**：用 Spring Boot 写一个 CRUD 接口（和之前 Express/Flask 的一样），感受一下 Java 的开发方式。虽然啰嗦，但类型安全、编译期查错、大项目好维护是实打实的好处。写完你就入门了。
