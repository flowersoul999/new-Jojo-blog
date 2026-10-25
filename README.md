# new-Jojo-blog

个人博客「Aemeath」的 **Astro 7 + Svelte + TypeScript** 重构版，部署于 Vercel + Cloudflare。二次元 / 动漫风格，中文诗意命名。

## 功能特性

- 📚 **博客系统**：基于 Markdown 的内容集合（Content Collections），支持分类、标签、封面与目录
- 📔 **日记 / 相册 / 画廊**：`public/diary`、`public/gallery` 记录生活碎片
- 🎵 **音乐播放**：内置播放器与歌词（LRC）支持
- 💬 **评论与友链**：集成 Twikoo 评论、友链页面
- 📊 **站点分析**：`public/assets/images/analytics` 提供访问统计可视化
- 🎴 **Live2D / 特效**：首页动画、樱花、挂件等氛围效果
- 🔍 **全文检索**：Pagefind 构建期索引

## 技术栈

- Astro 7（Content Collections + SSR）
- Svelte
- TypeScript
- Tailwind CSS
- Pagefind（搜索）
- Biome（格式化 / Lint）

## 本地开发

```bash
pnpm install
pnpm dev        # 本地预览
pnpm build      # 生产构建
```

## 相关文档

- `PRODUCT.md` — 产品定位与功能说明
- `CLAUDE.md` — 开发约定
- `CONTRIBUTING.md` — 贡献指南

> 旧版（Next.js）实现见 [`Jojo-blog`](https://github.com/flowersoul999/Jojo-blog)。
