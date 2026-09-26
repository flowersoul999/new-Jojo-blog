---
title: "理解 HTTP：从底层原理到手搓一个 API"
published: 2026-09-11
description: ""
tags: ["前端基础"]
category: "技术总结"
draft: false
lang: "zh-CN"
---
# 理解 HTTP：从底层原理到手搓一个 API

> 目录
>
> 1. [HTTP 到底是什么](#一http-到底是什么)
> 2. [一次 HTTP 请求的完整过程](#二一次-http-请求的完整过程)
> 3. [请求的结构：请求行、头、体](#三请求的结构请求行头体)
> 4. [响应的结构：状态行、头、体](#四响应的结构状态行头体)
> 5. [HTTP 方法：不只是 GET 和 POST](#五http-方法不只是-get-和-post)
> 6. [状态码：服务器在说什么](#六状态码服务器在说什么)
> 7. [HTTP 头部：被忽略的重要信息](#七http-头部被忽略的重要信息)
> 8. [Cookie 和 Session：HTTP 的记忆](#八cookie-和-sessionhttp-的记忆)
> 9. [HTTPS：HTTP 的安全版本](#九httpshttp-的安全版本)
> 10. [HTTP/1.1 vs HTTP/2 vs HTTP/3](#十http11-vs-http2-vs-http3)
> 11. [手搓一个 API：不靠框架](#十一手搓一个-api不靠框架)
> 12. [手搓一个 API：加上路由和中间件](#十二手搓一个-api加上路由和中间件)
> 13. [面试八股](#十三面试八股)
> 14. [总结](#十四总结)

---

## 一、HTTP 到底是什么

HTTP（HyperText Transfer Protocol，超文本传输协议），说人话就是：**浏览器和服务器之间通信的规则。**

你在浏览器输入一个网址，浏览器向服务器发了一段文本，服务器回了一段文本，浏览器把文本渲染成网页。这段文本的格式规则，就是 HTTP。

### 一个最简单的 HTTP 请求长什么样

不用浏览器，不用 Postman，用最原始的方式——telnet 手动发一个 HTTP 请求：

```bash
telnet example.com 80
```

连上后输入以下内容（每行结尾要按回车，最后多按一个空行）：

```
GET / HTTP/1.1
Host: example.com

```

服务器返回：

```
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1256

<!DOCTYPE html>
<html>
  <head><title>Example Domain</title></head>
  <body>...</body>
</html>
```

看到了吗？**HTTP 就是一段纯文本。** 请求是一段文本，响应也是一段文本。没有魔法，就是字符串。

> 你平时用 `fetch('/api/users')`、`axios.get('/users')`，底层干的就是这件事——帮你拼好这段文本，通过 TCP 发出去，再把服务器返回的文本解析给你。

### HTTP 的本质

| 层级 | 协议 | 作用 |
|------|------|------|
| 应用层 | HTTP | 定义消息的格式（请求/响应长什么样） |
| 传输层 | TCP | 保证数据可靠到达（三次握手、重传） |
| 网络层 | IP | 把数据包从 A 送到 B（路由） |

HTTP 建立在 TCP 之上：
1. 先建立 TCP 连接（三次握手）
2. 在这条连接上发送 HTTP 请求文本
3. 服务器返回 HTTP 响应文本
4. 关闭连接（或保持复用）

> HTTP 本身不管数据怎么到达对方，那是 TCP/IP 的事。HTTP 只管：**消息的格式是什么、怎么理解对方发来的消息。**

---

## 二、一次 HTTP 请求的完整过程

你在浏览器输入 `https://api.example.com/users?page=1` 到看到数据，中间发生了什么？

### 完整流程

```
1. DNS 解析：api.example.com → 93.184.216.34
   ↓
2. TCP 三次握手：和服务器建立连接
   ↓
3. TLS 握手（如果是 HTTPS）：协商加密
   ↓
4. 发送 HTTP 请求
   ↓
5. 服务器处理请求，返回 HTTP 响应
   ↓
6. 浏览器解析响应，渲染页面 / JS 拿到数据
   ↓
7. TCP 四次挥手：断开连接（或保持复用）
```

### 每一步发生了什么

#### 第 1 步：DNS 解析

浏览器不知道 `api.example.com` 在哪，先查 DNS——域名系统，把域名翻译成 IP 地址。

```
api.example.com  →  93.184.216.34
```

类似你手机通讯录：存了「张三」的名字，打电话时手机自动找到他的号码。DNS 就是互联网的通讯录。

#### 第 2 步：TCP 三次握手

拿到 IP 后，浏览器和服务器建立 TCP 连接：

```
浏览器 → 服务器：SYN（你好，能连吗？）
服务器 → 浏览器：SYN+ACK（能，你还在吗？）
浏览器 → 服务器：ACK（在的，开始吧）
```

三次握手确保双方都能收发数据，然后才开始传 HTTP 内容。

#### 第 3 步：TLS 握手（HTTPS）

如果 URL 是 `https://`，在 TCP 连接建立后还要做 TLS 握手——协商加密算法、交换证书、生成密钥。这步保证后续传输的数据都是加密的。

#### 第 4 步：发送 HTTP 请求

浏览器拼好一段 HTTP 请求文本，通过 TCP 连接发给服务器：

```
GET /users?page=1 HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0
Accept: application/json
Cookie: token=abc123
```

#### 第 5 步：服务器返回 HTTP 响应

服务器收到请求文本，解析出「要 GET /users，带参数 page=1」，执行对应逻辑，返回响应文本：

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 45

{"code":0,"data":[{"id":1,"name":"张三"}]}
```

#### 第 6 步：浏览器处理响应

浏览器拿到响应，根据 `Content-Type: application/json` 知道这是 JSON，解析成 JS 对象，交给 JS 代码处理。

#### 第 7 步：连接复用或关闭

HTTP/1.1 默认 `keep-alive`，TCP 连接不立即关闭，后续请求可以复用，省去三次握手的时间。

### 为什么理解这个过程很重要

因为你在写接口时遇到的所有问题都和这个过程有关：
- 跨域？因为浏览器在响应阶段检查 Origin
- Cookie 不带过去？因为请求阶段要满足 Cookie 的携带条件
- https 混合内容警告？因为 HTTPS 页面不允许 HTTP 请求
- 接口慢？可能卡在 DNS、TCP、TLS 任一步

---

## 三、请求的结构：请求行、头、体

一个 HTTP 请求由三部分组成：

```
请求行          ← 方法 + 路径 + 协议版本
请求头          ← 元数据（键值对）
（空行）
请求体          ← 数据（GET 通常没有，POST 有）
```

### 真实例子

```
POST /api/users HTTP/1.1               ← 请求行
Host: api.example.com                  ← 请求头开始
Content-Type: application/json
Content-Length: 45
Authorization: Bearer eyJhbGc...
User-Agent: Mozilla/5.0
                                       ← 空行（非常重要！）
{"name":"张三","age":20}               ← 请求体
```

### 1. 请求行

```
POST /api/users HTTP/1.1
  │        │          │
  │        │          └─ 协议版本（HTTP/1.1 或 HTTP/2）
  │        └─ 请求路径（URL 的 path + query）
  └─ 请求方法（GET/POST/PUT/DELETE...）
```

### 2. 请求头

请求头是键值对，告诉服务器关于这个请求的额外信息：

| 头部 | 作用 | 例子 |
|------|------|------|
| `Host` | 目标主机名（必须） | `api.example.com` |
| `Content-Type` | 请求体的数据格式 | `application/json` |
| `Content-Length` | 请求体大小（字节） | `45` |
| `Authorization` | 认证信息 | `Bearer eyJhbGc...` |
| `User-Agent` | 客户端信息 | `Mozilla/5.0` |
| `Accept` | 期望的响应格式 | `application/json` |
| `Cookie` | 携带的 Cookie | `token=abc123` |
| `Origin` | 请求来源（跨域用） | `http://localhost:5173` |
| `Referer` | 从哪个页面来的 | `http://localhost:5173/users` |

> 空行很重要——服务器看到空行就知道：头结束了，后面是请求体。你写 `fetch` 时 `headers` 里配的东西，最后就变成这些请求头。

### 3. 请求体

GET 请求一般没有请求体（参数在 URL 上）。POST/PUT/PATCH 有请求体。

```
Content-Type: application/json
{"name":"张三","age":20}

Content-Type: application/x-www-form-urlencoded
name=张三&age=20

Content-Type: multipart/form-data; boundary=----xxx
------xxx
Content-Disposition: form-data; name="file"; filename="test.png"
（文件二进制数据）
```

> 后端解析请求体时，必须先看 `Content-Type` 才知道怎么解析。Express 的 `express.json()`、FastAPI 的 Pydantic，都是根据 Content-Type 来解析的。

---

## 四、响应的结构：状态行、头、体

HTTP 响应也由三部分组成：

```
状态行          ← 协议版本 + 状态码 + 状态描述
响应头          ← 元数据
（空行）
响应体          ← 数据
```

### 真实例子

```
HTTP/1.1 200 OK                          ← 状态行
Content-Type: application/json            ← 响应头
Content-Length: 45
Set-Cookie: token=abc123; Path=/; HttpOnly
Access-Control-Allow-Origin: *
                                         ← 空行
{"code":0,"data":[{"id":1}]}             ← 响应体
```

### 1. 状态行

```
HTTP/1.1 200 OK
   │      │   │
   │      │   └─ 状态描述（OK / Not Found / Internal Error）
   │      └─ 状态码（200 / 404 / 500）
   └─ 协议版本
```

### 2. 响应头

| 头部 | 作用 | 例子 |
|------|------|------|
| `Content-Type` | 响应体格式 | `application/json` |
| `Content-Length` | 响应体大小 | `45` |
| `Set-Cookie` | 设置 Cookie | `token=abc123; HttpOnly` |
| `Cache-Control` | 缓存策略 | `max-age=3600` |
| `Access-Control-Allow-Origin` | CORS 跨域 | `*` 或 `http://localhost:5173` |
| `Location` | 重定向地址（3xx） | `http://example.com/new` |
| `X-Request-Id` | 请求追踪 ID | `abc-123-def` |

### 3. 响应体

响应体就是服务器返回的实际数据。可以是 HTML、JSON、图片、文件，由 `Content-Type` 决定。

```
Content-Type: text/html        → 网页
Content-Type: application/json → JSON 数据
Content-Type: image/png        → 图片
Content-Type: text/css         → CSS 文件
```

---

## 五、HTTP 方法：不只是 GET 和 POST

| 方法 | 语义 | 有请求体？ | 幂等？ | 安全？ |
|------|------|-----------|--------|--------|
| GET | 获取资源 | ❌ 没有 | ✅ 是 | ✅ 是 |
| POST | 创建资源 | ✅ 有 | ❌ 否 | ❌ 否 |
| PUT | 全量更新 | ✅ 有 | ✅ 是 | ❌ 否 |
| PATCH | 部分更新 | ✅ 有 | ❌ 否 | ❌ 否 |
| DELETE | 删除资源 | 可有可无 | ✅ 是 | ❌ 否 |
| HEAD | 只要头不要体 | ❌ 没有 | ✅ 是 | ✅ 是 |
| OPTIONS | 查询支持的方法 | ❌ 没有 | ✅ 是 | ✅ 是 |

### 幂等是什么

**幂等** = 同一个请求执行一次和执行多次，效果一样。

| 操作 | 幂等？ | 原因 |
|------|--------|------|
| `GET /users/1` | ✅ | 查多少次结果都一样 |
| `POST /users` | ❌ | 每次创建一个新用户，调两次创建两条 |
| `PUT /users/1` | ✅ | 全量更新，改成什么就是什么，调多少次都一样 |
| `DELETE /users/1` | ✅ | 删一次和删十次，结果都是「不存在」 |

> 幂等的意义：网络不稳定时，浏览器/客户端可以安全重试幂等请求，不用担心副作用。非幂等请求（POST）重试可能产生重复数据。

### 安全是什么

**安全** = 不会改变服务器状态。GET、HEAD、OPTIONS 是安全的——它们只读不改。

### 实际开发中的应用

```
GET    /users          → 获取用户列表
POST   /users          → 创建用户
GET    /users/1        → 获取单个用户
PUT    /users/1        → 全量修改用户
PATCH  /users/1        → 只改用户某个字段
DELETE /users/1        → 删除用户
```

> 实际项目里 90% 用 GET 和 POST，但理解 PUT/PATCH/DELETE 能让接口设计更规范。

---

## 六、状态码：服务器在说什么

状态码是三位数，告诉客户端请求的结果如何。

### 五大类

| 范围 | 类别 | 含义 |
|------|------|------|
| 1xx | 信息 | 请求已收到，继续处理 |
| 2xx | 成功 | 请求已成功处理 |
| 3xx | 重定向 | 需要进一步操作才能完成 |
| 4xx | 客户端错误 | 请求有误，客户端的问题 |
| 5xx | 服务器错误 | 服务器出错了 |

### 常见状态码

| 状态码 | 含义 | 什么时候出现 |
|--------|------|-------------|
| 200 | OK | 成功 |
| 201 | Created | POST 创建成功 |
| 204 | No Content | 成功但无返回内容（DELETE） |
| 301 | 永久重定向 | 网址永久搬家了 |
| 302 | 临时重定向 | 临时跳转 |
| 304 | Not Modified | 缓存还有效，用缓存 |
| 400 | Bad Request | 参数错误 |
| 401 | Unauthorized | 未登录 / Token 无效 |
| 403 | Forbidden | 登录了但没权限 |
| 404 | Not Found | 资源不存在 |
| 405 | Method Not Allowed | 方法不对（对 /users 发了 DELETE 但不支持） |
| 409 | Conflict | 冲突（重复注册） |
| 422 | Unprocessable Entity | 参数格式对但校验失败 |
| 429 | Too Many Requests | 限流 |
| 500 | Internal Server Error | 服务器内部错误 |
| 502 | Bad Gateway | 网关错误（后端服务挂了） |
| 503 | Service Unavailable | 服务不可用（维护中） |
| 504 | Gateway Timeout | 网关超时 |

### 401 vs 403

这是最容易搞混的：

- **401 Unauthorized**：你**没登录**，或者 Token 无效 → "你是谁？先证明你是谁"
- **403 Forbidden**：你**登录了但没权限** → "我知道你是谁，但你不能干这个"

```
// 没带 Token → 401
GET /admin/users  （无 Token）
→ 401 Unauthorized

// 带了 Token 但不是管理员 → 403
GET /admin/users  （Token: 普通用户）
→ 403 Forbidden
```

### 200 + 业务状态码

实际项目里经常看到 HTTP 状态码是 200，但 body 里有 `code: 1`：

```json
HTTP/1.1 200 OK
Content-Type: application/json

{"code": 1, "message": "用户名已存在", "data": null}
```

这是因为很多公司习惯用 HTTP 200 + 业务状态码，方便前端统一处理。但更 RESTful 的做法是直接用 HTTP 状态码（4xx 表示客户端错误）。两种风格都行，团队统一就好。

---

## 七、HTTP 头部：被忽略的重要信息

头部是 HTTP 里最被低估的部分。很多问题你查半天，答案就在某个头里。

### 请求头详解

#### Content-Type：告诉对方我发的是什么

```
Content-Type: application/json              → JSON 数据
Content-Type: application/x-www-form-urlencoded → 表单数据
Content-Type: multipart/form-data          → 文件上传
Content-Type: text/plain                   → 纯文本
```

> 后端解析请求体时，第一步就是看 Content-Type。你在 Express 里用 `express.json()`，它就是检查 `Content-Type: application/json` 才解析的。

#### Authorization：认证信息

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

最常见的是 Bearer Token（JWT）。服务器拿到这个 Token，验证身份。

#### Cookie：自动携带

```
Cookie: token=abc123; sessionId=xyz789
```

浏览器会自动把同域的 Cookie 带上。跨域时不自动带，需要前后端配置。

#### Accept：我想要什么格式

```
Accept: application/json          → 我要 JSON
Accept: text/html                 → 我要 HTML
Accept: */*                       → 都行
```

服务器可以根据这个返回不同格式（内容协商）。

### 响应头详解

#### Set-Cookie：设置 Cookie

```
Set-Cookie: token=abc123; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600
```

| 属性 | 作用 |
|------|------|
| `Path=/` | 哪些路径会带这个 Cookie |
| `HttpOnly` | JS 不能通过 document.cookie 读到（防 XSS） |
| `Secure` | 只在 HTTPS 下传输 |
| `SameSite=Lax` | 跨站请求限制携带（防 CSRF） |
| `Max-Age=3600` | 过期时间（秒） |

#### Cache-Control：缓存策略

```
Cache-Control: max-age=3600      → 缓存 1 小时
Cache-Control: no-cache          → 每次都要问服务器
Cache-Control: no-store           → 绝不缓存
```

#### Access-Control-Allow-Origin：CORS 跨域

```
Access-Control-Allow-Origin: *                    → 允许所有域名
Access-Control-Allow-Origin: http://localhost:5173 → 只允许这个域名
Access-Control-Allow-Headers: Content-Type, Authorization  → 允许的请求头
Access-Control-Allow-Methods: GET, POST, PUT, DELETE       → 允许的方法
```

> CORS 就是这么回事：服务器在响应头里告诉浏览器「我允许哪个域名访问」。浏览器看到这个头，才把数据交给 JS。

---

## 八、Cookie 和 Session：HTTP 的记忆

HTTP 是**无状态协议**——服务器不记得你是谁。每次请求都是独立的，服务器不知道上次请求的也是你。

但你登录后，每次请求都带着你的身份——这靠 Cookie 和 Session 实现。

### Cookie 的工作流程

```
1. 用户登录，POST /login { username, password }
2. 服务器验证通过，返回响应，响应头带 Set-Cookie:
   Set-Cookie: token=abc123; HttpOnly; Path=/
3. 浏览器自动保存这个 Cookie
4. 后续请求，浏览器自动带上 Cookie:
   Cookie: token=abc123
5. 服务器读取 Cookie，知道你是谁了
```

### Session vs Token

**Session 方案**：
- 服务器存一个 Session（内存/Redis），Session ID 放在 Cookie 里
- 每次请求，服务器根据 Session ID 找到 Session 数据
- 缺点：服务器要存状态，多台服务器要共享 Session

**Token 方案（JWT）**：
- 服务器不存状态，把用户信息编码成 Token
- Token 里自带用户信息 + 签名
- 客户端把 Token 放在 Authorization 头里
- 服务器只验证签名，不查数据库

```
// Session: 服务器记得你
Cookie: sessionId=xyz
→ 服务器查内存: sessionId=xyz → userId=1 → 张三

// Token: 服务器不记得你，Token 自己说了算
Authorization: Bearer eyJhbG...(里面编码了 userId=1)
→ 服务器解密 Token → userId=1 → 张三
```

| 对比项 | Session | Token (JWT) |
|--------|---------|-------------|
| 服务器存状态 | ✅ 要存 | ❌ 不存 |
| 扩展性 | 差（多台服务器要共享） | 好（无状态） |
| 安全性 | 高（在服务端） | 中（要注意泄露） |
| 注销 | 删 Session 即可 | 要等过期或维护黑名单 |
| 适用 | 传统 Web 应用 | 前后端分离 / 移动端 |

---

## 九、HTTPS：HTTP 的安全版本

HTTP 是明文传输——中间人可以看到、篡改你的数据。HTTPS = HTTP + TLS/SSL 加密。

### HTTPS 做了三件事

1. **加密** —— 数据是密文，中间人看不懂
2. **认证** —— 证明服务器是真的（不是钓鱼网站）
3. **完整性** —— 数据被篡改能发现

### TLS 握手过程（简化）

```
1. 客户端 → 服务器：Client Hello（支持的加密算法、随机数）
2. 服务器 → 客户端：Server Hello（选定的算法、随机数、数字证书）
3. 客户端验证证书 → 生成预主密钥 → 用服务器公钥加密发过去
4. 双方用三个随机数算出会话密钥
5. 后续用这个会话密钥加密通信
```

### 证书是什么

证书是 CA（证书颁发机构）签发的，证明「这个公钥确实是 example.com 的」。

浏览器内置了 CA 的公钥，收到证书时验证签名——验证通过就信任这个公钥。所以你访问 `https://` 时浏览器显示小锁图标。

> 以前证书要花钱买，现在 Let's Encrypt 免费发证书，所以现在大部分网站都是 HTTPS。

---

## 十、HTTP/1.1 vs HTTP/2 vs HTTP/3

| 版本 | 年份 | 核心改进 |
|------|------|---------|
| HTTP/1.0 | 1996 | 每次请求建一个连接 |
| HTTP/1.1 | 1997 | keep-alive 长连接、管道化、Host 头 |
| HTTP/2 | 2015 | 多路复用、头部压缩、二进制分帧 |
| HTTP/3 | 2022 | 基于 QUIC（UDP），解决队头阻塞 |

### HTTP/1.1 的问题

- 队头阻塞：一个请求慢了，后面的都得等
- 头部冗余：每次请求都带一堆重复的头
- 并发受限：一个域名最多 6 个连接

### HTTP/2 的改进

- **多路复用**：一个 TCP 连接上同时传多个请求/响应，互不阻塞
- **头部压缩**：HPACK 算法压缩头部
- **二进制**：不再是纯文本，而是二进制分帧（但 API 用起来和 HTTP/1.1 一样）
- **服务端推送**：服务器可以主动推资源（现已废弃）

### HTTP/3 的改进

- **基于 UDP**（QUIC 协议），不再依赖 TCP
- **解决队头阻塞**：一个流丢了包不影响其他流
- **连接迁移**：从 WiFi 切到 4G 不会断连

> 对开发者来说，HTTP/2 和 HTTP/3 是透明的——你写代码的方式和 HTTP/1.1 一模一样，升级是服务器和浏览器的事。

---

## 十一、手搓一个 API：不靠框架

现在你理解了 HTTP 的原理，我们来不用任何框架，纯手写一个 HTTP 服务器，感受一下底层。

### 用 Python 的 http.server

```python
# raw_api.py
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class MyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # 根据路径返回不同的响应
        if self.path == '/':
            self._respond(200, {'message': 'Hello API!'})
        elif self.path == '/users':
            self._respond(200, {'users': [
                {'id': 1, 'name': '张三'},
                {'id': 2, 'name': '李四'},
            ]})
        else:
            self._respond(404, {'error': 'Not Found'})

    def do_POST(self):
        if self.path == '/users':
            # 读取请求体
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body)
            self._respond(201, {'message': '创建成功', 'user': data})
        else:
            self._respond(404, {'error': 'Not Found'})

    def _respond(self, status, data):
        """封装响应：状态码 + JSON 头 + JSON 体"""
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

# 启动
server = HTTPServer(('localhost', 8000), MyHandler)
print('服务器运行在 http://localhost:8000')
server.serve_forever()
```

运行：

```bash
python raw_api.py
```

测试：

```bash
# GET
curl http://localhost:8000/users
# {"users": [{"id": 1, "name": "张三"}, {"id": 2, "name": "李四"}]}

# POST
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"王五"}'
# {"message": "创建成功", "user": {"name": "王五"}}
```

### 你看到了什么

这段代码就是在手动做框架帮你做的事：

1. **解析请求行** —— `self.path` 就是路径
2. **读请求头** —— `self.headers['Content-Length']`
3. **读请求体** —— `self.rfile.read(content_length)`
4. **构造响应行** —— `self.send_response(200)`
5. **构造响应头** —— `self.send_header('Content-Type', ...)`
6. **写响应体** —— `self.wfile.write(body)`

> 你平时用 Flask 的 `@app.route`、Express 的 `app.get`、FastAPI 的 `@app.get`，底层做的就是这些。框架帮你把解析、路由、序列化都封装了，但本质是一样的。

### 用 Node.js 手搓

```javascript
// raw_api.js
const http = require('http')

const server = http.createServer((req, res) => {
  // 路由
  if (req.method === 'GET' && req.url === '/') {
    respond(res, 200, { message: 'Hello API!' })
  } else if (req.method === 'GET' && req.url === '/users') {
    respond(res, 200, { users: [{ id: 1, name: '张三' }] })
  } else if (req.method === 'POST' && req.url === '/users') {
    // 读请求体
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      const data = JSON.parse(body)
      respond(res, 201, { message: '创建成功', user: data })
    })
  } else {
    respond(res, 404, { error: 'Not Found' })
  }
})

function respond(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

server.listen(8000, () => console.log('http://localhost:8000'))
```

---

## 十二、手搓一个 API：加上路由和中间件

裸写的代码不好维护——路由全在 if-else 里，没有中间件，没有参数解析。我们继续手搓一个迷你框架。

### 迷你框架

```python
# mini_framework.py
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib.parse import urlparse, parse_qs

class MiniAPI:
    def __init__(self):
        self.routes = []   # 路由表
        self.middlewares = []  # 中间件列表

    # 注册路由
    def get(self, path, handler):
        self.routes.append(('GET', path, handler))

    def post(self, path, handler):
        self.routes.append(('POST', path, handler))

    def put(self, path, handler):
        self.routes.append(('PUT', path, handler))

    def delete(self, path, handler):
        self.routes.append(('DELETE', path, handler))

    # 注册中间件
    def use(self, middleware):
        self.middlewares.append(middleware)

    # 运行
    def run(self, host='localhost', port=8000):
        app = self

        class Handler(BaseHTTPRequestHandler):
            def _handle(self):
                parsed = urlparse(self.path)
                path = parsed.path
                query = parse_qs(parsed.query)
                method = self.command

                # 匹配路由
                handler = None
                params = {}
                for route_method, route_path, route_handler in app.routes:
                    if route_method != method:
                        continue
                    # 简单的路径参数匹配 /users/:id
                    route_parts = route_path.split('/')
                    path_parts = path.split('/')
                    if len(route_parts) != len(path_parts):
                        continue
                    matched = True
                    for i, (rp, pp) in enumerate(zip(route_parts, path_parts)):
                        if rp.startswith(':'):
                            params[rp[1:]] = pp
                        elif rp != pp:
                            matched = False
                            break
                    if matched:
                        handler = route_handler
                        break

                if not handler:
                    self._respond(404, {'error': 'Not Found'})
                    return

                # 读请求体
                body = None
                if method in ('POST', 'PUT', 'PATCH'):
                    length = int(self.headers.get('Content-Length', 0))
                    if length > 0:
                        body = json.loads(self.rfile.read(length))

                # 构造上下文
                ctx = {
                    'path': path,
                    'method': method,
                    'query': {k: v[0] for k, v in query.items()},
                    'params': params,
                    'headers': dict(self.headers),
                    'body': body,
                    'status': 200,
                    'response': None,
                    'set_header': {},
                }

                # 执行中间件链
                def run_handler(idx=0):
                    if idx < len(app.middlewares):
                        app.middlewares[idx](ctx, lambda: run_handler(idx + 1))
                    else:
                        result = handler(ctx)
                        ctx['response'] = result
                        self._respond(ctx['status'], ctx['response'], ctx.get('set_header', {}))

                try:
                    run_handler()
                except Exception as e:
                    self._respond(500, {'error': str(e)})

            def _respond(self, status, data, extra_headers=None):
                body = json.dumps(data, ensure_ascii=False).encode('utf-8')
                self.send_response(status)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                if extra_headers:
                    for k, v in extra_headers.items():
                        self.send_header(k, v)
                self.end_headers()
                self.wfile.write(body)

            def do_GET(self):    self._handle()
            def do_POST(self):   self._handle()
            def do_PUT(self):    self._handle()
            def do_DELETE(self): self._handle()

        server = HTTPServer((host, port), Handler)
        print(f'服务器运行在 http://{host}:{port}')
        server.serve_forever()
```

### 用这个迷你框架写接口

```python
# app.py
from mini_framework import MiniAPI

app = MiniAPI()

# 中间件：日志
@app.use
def log_middleware(ctx, next):
    print(f"[{ctx['method']}] {ctx['path']}")
    next()
    print(f"→ {ctx['status']}")

# 中间件：统一响应格式
@app.use
def response_middleware(ctx, next):
    next()
    # 把 handler 的返回值包装成统一格式
    if ctx['response'] is not None:
        ctx['response'] = {
            'code': 0 if ctx['status'] < 400 else 1,
            'message': 'success' if ctx['status'] < 400 else 'error',
            'data': ctx['response'],
        }

# 中间件：CORS
@app.use
def cors_middleware(ctx, next):
    ctx['set_header']['Access-Control-Allow-Origin'] = '*'
    next()

# 路由
@app.get('/')
def index(ctx):
    return {'message': 'Hello Mini API!'}

@app.get('/users')
def list_users(ctx):
    page = int(ctx['query'].get('page', 1))
    size = int(ctx['query'].get('size', 10))
    return {
        'list': [{'id': 1, 'name': '张三'}, {'id': 2, 'name': '李四'}],
        'page': page,
        'size': size,
        'total': 100,
    }

@app.get('/users/:id')
def get_user(ctx):
    user_id = int(ctx['params']['id'])
    if user_id == 1:
        return {'id': 1, 'name': '张三', 'age': 20}
    ctx['status'] = 404
    return {'error': '用户不存在'}

@app.post('/users')
def create_user(ctx):
    body = ctx['body']
    return {'id': 999, 'name': body['name'], 'age': body.get('age', 18)}

@app.put('/users/:id')
def update_user(ctx):
    user_id = ctx['params']['id']
    body = ctx['body']
    return {'id': int(user_id), **body}

@app.delete('/users/:id')
def delete_user(ctx):
    user_id = ctx['params']['id']
    return {'deleted': int(user_id)}

if __name__ == '__main__':
    app.run()
```

运行：

```bash
python app.py
```

测试：

```bash
# 获取用户列表
curl http://localhost:8000/users?page=2&size=5
# {"code":0,"message":"success","data":{"list":[...],"page":2,"size":5,"total":100}}

# 获取单个用户
curl http://localhost:8000/users/1
# {"code":0,"message":"success","data":{"id":1,"name":"张三","age":20}}

# 创建用户
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"王五","age":25}'
# {"code":0,"message":"success","data":{"id":999,"name":"王五","age":25}}
```

### 你实现了什么

这个迷你框架包含了 FastAPI/Express 的核心机制：

| 功能 | 实现方式 |
|------|---------|
| 路由注册 | `@app.get('/path')` 装饰器 |
| 路径参数 | `/users/:id` → `ctx['params']['id']` |
| 查询参数 | `ctx['query']` |
| 请求体 | `ctx['body']` |
| 中间件 | `@app.use` + next() 调用链 |
| 统一响应 | 中间件包装 |
| CORS | 中间件设置头 |
| 404 | 路由不匹配 |
| 500 | try/catch |

**这就是框架的本质**——帮你把路由匹配、参数解析、中间件链、响应封装这些重复工作封装好，你只写业务逻辑。

---

## 十三、面试八股

### 1. HTTP 和 HTTPS 的区别？

**参考答案：**

| 对比项 | HTTP | HTTPS |
|--------|------|-------|
| 端口 | 80 | 443 |
| 安全性 | 明文传输，不安全 | TLS/SSL 加密，安全 |
| 证书 | 不需要 | 需要 CA 证书 |
| 性能 | 快 | 稍慢（TLS 握手开销） |
| SEO | 无优势 | 搜索引擎优先收录 |

HTTPS = HTTP + TLS。TLS 提供加密（数据看不到）、认证（证明服务器是真的）、完整性（数据没被篡改）。TLS 握手时通过证书交换公钥，协商出会话密钥，后续用密钥加密通信。

---

### 2. 一次完整的 HTTP 请求过程？

**参考答案：**

1. **DNS 解析** —— 域名 → IP
2. **TCP 三次握手** —— 建立连接
3. **TLS 握手**（HTTPS）—— 协商加密
4. **发送请求** —— 请求行 + 头 + 体
5. **服务器处理** —— 路由匹配 + 业务逻辑
6. **返回响应** —— 状态行 + 头 + 体
7. **浏览器处理** —— 解析响应
8. **连接关闭或复用** —— keep-alive

> 就是前面第二章讲的那个完整流程。

---

### 3. GET 和 POST 的区别？

**参考答案：**

| 对比项 | GET | POST |
|--------|-----|------|
| 语义 | 获取资源 | 创建资源 |
| 参数位置 | URL 查询参数 | 请求体 |
| 长度限制 | URL 有长度限制（浏览器限制，约 2KB） | 理论上无限制 |
| 缓存 | 可被缓存 | 不缓存 |
| 幂等 | 幂等 | 非幂等 |
| 安全 | 安全（不改数据） | 不安全 |
| 历史 | URL 保留在历史记录 | 不保留 |
| 编码 | URL 编码 | 多种编码 |

**本质区别**：GET 是获取数据，POST 是提交数据。其他差异都是语义延伸出来的——GET 的参数在 URL 上所以有长度限制、能缓存、能被收藏；POST 的参数在请求体里所以没长度限制、不缓存。

---

### 4. 什么是跨域？怎么解决？

**参考答案：**

**跨域**：浏览器的同源策略——协议、域名、端口任一不同就是跨域。跨域请求默认会被浏览器拦截。

**解决方式**：

1. **CORS**（最常用）—— 服务器在响应头设置 `Access-Control-Allow-Origin`，告诉浏览器允许跨域
   ```
   Access-Control-Allow-Origin: http://localhost:5173
   Access-Control-Allow-Headers: Content-Type, Authorization
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE
   ```

2. **代理** —— 开发时用 Vite/Nginx 代理，请求同源的代理服务器，代理服务器转发到目标服务器（服务器之间没有跨域限制）

3. **JSONP** —— 利用 `<script>` 标签不受同源策略限制的原理（过时，只支持 GET）

**CORS 原理**：
- 简单请求：浏览器直接发，服务器响应头带 CORS 头就行
- 复杂请求（如带 Authorization）：浏览器先发 OPTIONS 预检请求，服务器返回允许的方法和头，浏览器才发真正的请求

---

### 5. Cookie、Session、Token 的区别？

**参考答案：**

| 对比项 | Cookie | Session | Token |
|--------|--------|---------|-------|
| 存储位置 | 浏览器 | 服务器 | 客户端 |
| 大小限制 | 4KB | 无 | 无 |
| 安全性 | 低（JS 可读） | 高（在服务端） | 中（注意防泄露） |
| 服务端状态 | 无 | 有 | 无 |
| 跨域 | 受限 | 受限 | 不受限 |
| 适用场景 | 少量数据 | 传统 Web | 前后端分离 |

**Cookie** 是浏览器存储的机制，Session 和 Token 是认证方案：
- Session 的 ID 通过 Cookie 传递，服务器存 Session 数据
- Token 不依赖 Cookie，放在 Authorization 头里，服务器不存状态

> 前后端分离项目一般用 Token + Authorization 头，不用 Cookie。

---

### 6. HTTP/1.1 和 HTTP/2 的区别？

**参考答案：**

| 对比项 | HTTP/1.1 | HTTP/2 |
|--------|----------|--------|
| 传输格式 | 文本 | 二进制 |
| 多路复用 | 不支持（一个连接一个请求） | 支持（一个连接多个请求并发） |
| 队头阻塞 | 有 | 应用层解决（TCP 层还有） |
| 头部压缩 | 无 | HPACK 算法 |
| 服务端推送 | 无 | 支持（现已废弃） |

**HTTP/2 核心改进**：多路复用——一个 TCP 连接上同时传多个请求和响应，互不阻塞。解决 HTTP/1.1 的「一个连接只能处理一个请求，慢了后面全等」的问题。

---

### 7. HTTP 是无状态的，怎么理解？

**参考答案：**

HTTP 无状态 = 服务器不记录客户端的状态。每个请求都是独立的，服务器不知道这个请求和上一个请求是不是同一个用户。

**好处**：简单、容易扩展（加服务器不用同步状态）

**坏处**：登录后不能记住你是谁

**解决方案**：
- Cookie + Session：服务器存状态，ID 通过 Cookie 传
- Token：状态编码在 Token 里，不用服务器存

---

### 8. 什么是 OPTIONS 预检请求？

**参考答案：**

CORS 分为简单请求和复杂请求：

**简单请求**（不会触发预检）：
- 方法是 GET / HEAD / POST
- 请求头只有 `Accept`、`Content-Type`（仅限 text/plain、multipart/form-data、application/x-www-form-urlencoded）、`Content-Language` 等

**复杂请求**（会触发预检）：
- 方法是 PUT / DELETE / PATCH
- 或 Content-Type 是 application/json
- 或有自定义头（如 Authorization）

浏览器在发复杂请求前，先发一个 OPTIONS 请求问服务器：「我可以用这些方法/头吗？」，服务器返回允许的列表，浏览器才发真正的请求。

```
// 预检请求
OPTIONS /api/users HTTP/1.1
Origin: http://localhost:5173
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type, Authorization

// 预检响应
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400  // 预检结果缓存 1 天
```

---

### 9. 什么是 RESTful API？

**参考答案：**

REST 是一种 API 设计风格，核心是：**URL 表示资源，HTTP 方法表示操作。**

```
GET    /users      → 获取用户列表
POST   /users      → 创建用户
GET    /users/1    → 获取单个用户
PUT    /users/1    → 全量更新用户
PATCH  /users/1    → 部分更新用户
DELETE /users/1    → 删除用户
```

**特点**：
- URL 是名词，不是动词
- 用 HTTP 方法表示增删改查
- 用 HTTP 状态码表示结果
- 无状态

> RESTful 是风格不是标准，实际项目可以灵活处理。登录、注册这类特殊操作不一定非要套资源模型。

---

### 10. HTTP 长连接是什么？

**参考答案：**

HTTP/1.1 默认开启 `Connection: keep-alive`，TCP 连接在请求完成后不立即关闭，后续请求可以复用。

**好处**：省去了重复的三次握手和四次挥手，减少延迟。

```
# 不开 keep-alive：每次请求都建连接
请求1 → 三次握手 → 请求 → 响应 → 四次挥手
请求2 → 三次握手 → 请求 → 响应 → 四次挥手

# 开 keep-alive：连接复用
三次握手 → 请求1 → 响应1 → 请求2 → 响应2 → 四次挥手
```

**HTTP/2 进一步优化**：在一个连接上多路复用，多个请求同时传输，互不阻塞。

---

### 11. 什么是 XSS 和 CSRF？怎么防范？

**参考答案：**

**XSS（跨站脚本攻击）**：攻击者在页面注入恶意 JS，用户访问时执行。

- 存储型：恶意代码存到数据库，别人查看时执行
- 反射型：恶意代码在 URL 里，服务器返回到页面
- 防范：输出转义（HTML 编码）、设置 Cookie HttpOnly、CSP 头

**CSRF（跨站请求伪造）**：攻击者诱导用户在已登录的网站上执行非自愿操作。

- 原理：用户登录了 A 网站，浏览器自动带 Cookie，攻击者诱导用户访问恶意页面，页面里发了个对 A 网站的请求，浏览器自动带上 Cookie
- 防范：Token 认证（不依赖 Cookie）、SameSite Cookie、Referer 校验

---

### 12. 什么是 CDN？它和 HTTP 缓存什么关系？

**参考答案：**

CDN（Content Delivery Network，内容分发网络）—— 把静态资源缓存到全球各地的节点服务器上，用户就近访问，速度快。

**和 HTTP 缓存的关系**：

1. **浏览器缓存** —— `Cache-Control: max-age=3600`，资源在浏览器里缓存 1 小时
2. **CDN 缓存** —— CDN 节点也缓存一份，用户请求 CDN 时直接返回，不到源站
3. **协商缓存** —— `ETag` / `Last-Modified`，浏览器问服务器「资源变了没」，没变返回 304

**缓存流程**：
```
用户 → 浏览器缓存？有 → 直接用
         ↓ 没有
       CDN 缓存？有 → 返回给浏览器
         ↓ 没有
       源服务器 → 返回给 CDN → 返回给浏览器
```

> 加了 CDN 后，大部分静态资源请求根本到不了你的服务器，全在 CDN 和浏览器缓存层解决了。这就是为什么网站加载快——不是你的服务器快，是 CDN 帮你挡了。

---

## 十四、总结

HTTP 是前端和后端之间的通信协议，理解 HTTP 就是理解「数据怎么在浏览器和服务器之间流动的」。

**核心知识点速记：**

| 知识点 | 一句话 |
|--------|--------|
| HTTP 是什么 | 浏览器和服务器之间的文本通信规则 |
| 请求结构 | 请求行 + 请求头 + 空行 + 请求体 |
| 响应结构 | 状态行 + 响应头 + 空行 + 响应体 |
| HTTP 方法 | GET 查、POST 增、PUT 全改、PATCH 部分改、DELETE 删 |
| 状态码 | 2xx 成功、3xx 跳转、4xx 客户端错、5xx 服务端错 |
| Cookie | 浏览器存储，每次自动携带 |
| Session | 服务器存状态，ID 通过 Cookie 传 |
| Token | 无状态认证，不依赖 Cookie |
| HTTPS | HTTP + TLS 加密 |
| HTTP/2 | 多路复用，一个连接并发多个请求 |
| CORS | 服务器在响应头告诉浏览器允许谁跨域 |
| 缓存 | Cache-Control 控制浏览器缓存策略 |
| 框架本质 | 帮你封装路由匹配、参数解析、响应构造 |

**手搓 API 的意义**：不是为了真的拿去生产用，而是让你理解框架帮你做了什么。你用 Express 的 `app.get`、FastAPI 的 `@app.get`、Spring Boot 的 `@GetMapping`，底层都是在做：
1. 解析 HTTP 请求文本
2. 匹配路由
3. 提取参数
4. 执行你的处理函数
5. 包装成 HTTP 响应文本返回

搞懂这些，你写接口就不是在「背 API」，而是知道每一步在干什么。
