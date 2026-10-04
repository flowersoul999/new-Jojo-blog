---
title: 牢大商城
summary: 为学校 Java Web 课程实训做的在线商城，前端 Vue 3 + Element Plus，后端不用 Spring Boot，纯 Java Servlet + MySQL 手写。
role: 独立开发
start: 2026-07-02
end: 2026-07-03
status: 已归档
category: 课程
languages:
  - Vue
  - Java
stack:
  - Vue 3
  - Element Plus
  - Pinia
  - Java Servlet
  - MySQL
  - Tomcat
metrics:
  - label: 前端页面
    value: 17 个
  - label: 后端模块
    value: 7 个
  - label: 限制
    value: 不用 Spring Boot
links:
  - label: 源码
    href: https://github.com/flowersoul999/shopping-mall
    icon: material-symbols:code-braces
repo: https://github.com/flowersoul999/shopping-mall
license: ""
featured: false
order: 7
icon: M
---

## 背景

学校 Java Web 课程实训，课程规定不能用 Spring Boot，只能用 Java Servlet。

这本来是限制，但回头看反而是好事——手写Servlet 让我真正理解了 HTTP 请求是怎么走到 Java 对象的、Servlet 生命周期是怎么回事、Session 到底存在哪里。这些东西用框架时永远是黑盒。

## 方案

**前端** `frontend/`：Vue 3 + Element Plus + Pinia + Vue Router + Axios + Vite。
**后端** `backend/`：纯 Java Servlet，按业务模块分包。

```text
backend/src/com/shop/
├── user/       # 用户模块
├── product/    # 商品模块
├── cart/       # 购物车
├── order/      # 订单
├── address/    # 地址
├── admin/      # 管理
└── common/     # 公共
```

Tomcat 9 部署，MySQL 存数据，Gson 做 JSON 序列化。

## 实现

**完整的前后台。** 前台 17 个页面：首页、登录、注册、商品列表、商品详情、购物车、地址管理、结算、订单列表、订单详情、个人中心。后台有仪表盘、订单管理、商品管理、分类管理、用户管理。

**购物车用 Pinia 管。** `cart.js` 和 `user.js` 两个 store，前后台的登录状态和购物车共享同一份。

**Servlet 里的参数流转。** 不用框架，所以每个 Servlet 都要自己从`request` 里取参数、自己 `response.getWriter()` 写 JSON、自己处理编码。写下来最麻烦的是中文乱码和路径参数解析。

## 踩坑

**中文乱码。** 请求和响应编码不一致，前端传 UTF-8，Servlet 按 ISO-8859-1 解。解决是在 `request.setCharacterEncoding("UTF-8")` 和 `response.setCharacterEncoding("UTF-8")` 两处都设上，而且要在读参数**之前**设。

**路径映射和前端路由冲突。** 静态资源请求也会打到 Servlet，需要在 `@WebServlet` 里小心写路径规则。我在这里浪费了不少时间。

**Servlet 里的多线程共享字段。** 容器复用 Servlet 实例，也就是说成员变量是共享的。拿成员变量存「当前用户」会在并发下串号，必须放 `HttpSession`。这个坑是 Servlet 和普通 Java 对象最本质的区别。

## 复盘

项目功能上并不全面，README 里我也写明了「主要是为了应对学校的实训，不会再做后续更新」。但作为学习项目它的价值不低：

**框架会替你藏起的东西，正是这个项目全部的内容。** Spring Boot 里的 `@RestController` 一行搞定的事，这里要自己写路由、解析、序列化。我在之后用框架时，终于能说出「这行代码底下发生了什么」。

另一个收获是体会到**技术约束有时是好事**。不能用框架，逼迫我把底层搞清楚，这比刷十个教程有用。
