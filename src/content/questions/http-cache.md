---
category: "网络"
question: "强缓存和协商缓存的区别是什么？为什么有了 Last-Modified 还要有 ETag？"
level: "高频"
frequency: 5
tags: ["HTTP", "缓存", "性能优化"]
---

## 一句话答案

强缓存**不发请求**，直接用本地副本；协商缓存**一定发请求**，由服务端判断「能不能继续用旧的」，能就返回 304 不带响应体。

## 两类缓存对比

| | 强缓存 | 协商缓存 |
|---|---|---|
| 判断方 | 浏览器自己看时间 | 服务端比对内容 |
| 是否发请求 | 否 | 是 |
| 状态码 | 200 (from disk/memory cache) | 304 |
| 响应头 | `Expires`、`Cache-Control` | `ETag`、`Last-Modified` |

## Cache-Control 常用值

- `max-age=31536000` — 多少秒内直接用本地副本
- `no-cache` — **不是不缓存**，而是每次都要去服务端校验（走协商缓存）
- `no-store` — 真的完全不缓存
- `immutable` — 有效期内容永远不会变，连刷新都跳过校验
- `public` / `private` — 能否被 CDN 等共享缓存

优先级上 `Cache-Control` 高于 `Expires`，因为 `Expires` 依赖客户端时间，用户改系统时间就失效了。

## 为什么需要 ETag

`Last-Modified` 有两个治不好的毛病：

1. **精度只有秒**。一秒内改多次，时间没变，浏览器就会用旧的。
2. **内容没变，时间会变**。文件被重新部署、只是 `touch` 了一下，修改时间变了但内容一样，白白重新下载。

`ETag` 是内容指纹，能避开这两个坑。优先级上 `ETag` 高于 `Last-Modified`。

## 实际怎么配

```
HTML      → no-cache（每次都校验，保证拿到最新入口）
JS/CSS    → max-age=31536000, immutable（文件名带 hash，内容变文件名就变）
图片字体   → max-age=31536000, immutable
接口      → 按业务定，通常是 no-store 或短 max-age
```

## 追问会问什么

- **点了刷新按钮走哪个？** 走协商缓存，强缓存会被跳过。
- **`no-cache` 和 `no-store` 的区别？** 这是最高频的送命题。`no-cache` 还存，只是每次必须校验；`no-store` 连存都不存。
