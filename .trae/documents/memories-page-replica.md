# /memories/ 回忆页 1:1 复刻方案

## Context

用户希望把 `https://daily.yybb.us/memories/` 的整页效果一比一搬到本博客（Astro 5 + Svelte 5，仓库 `flowersoul999/Jojo-blog`）。

对方是 Hugo（sakura 主题）+ 该页专属的 `memories.css`(37KB) / `memories-init.js`(52KB)，**纯 CSS 动画 + 原生 JS，无任何第三方动画库**。我已把这两个源文件完整读过，确认可复刻。

已与用户确认的三项：
1. 范围 = **完整 1:1**（开屏闪频 + 黑胶唱片机 + 胶片墙 + 详情弹窗 + 暗色星空 + 移动端另一套）
2. 位置 = **新建 `/memories/` 页面 + Markdown 内容集合**
3. 音乐 = **复用现有播放器与歌词**（`MusicManager` 与 `/api/music/lyrics.json`）

**只复刻机制，不搬运素材**：对方的图片、人物立绘、文案、歌曲一律不用；一律换成用户自己的素材与文案，配色接本项目的 `--hue / --primary`。

## 效果拆解（复刻目标 = 6 个子系统）

| 子系统 | 机制 |
| --- | --- |
| 开屏闪频 `.memories-flash` | 全屏图片 ~320ms/帧 高速轮播，每帧 `scale(1.14)→(1.0)` + 旋转 ±2.4deg，配 `@property --flash-blur` 可动画模糊；叠颗粒噪点、暗角、椭圆遮罩边缘 blur、`filter:url(#…)` 位移滤镜；底部玻璃字幕条打字机 + 闪烁光标 + 2.8s 扫光；点击可跳过 |
| 舞台 `.memories-page__body` | `100dvh`、`max-width:1280px`、`overflow:hidden` 的 flex 两栏（左 `flex:6` 右 `flex:4`）；整块入场 `translate3d(0,28px) scale(.985)` → 归位 |
| 黑胶 `.memories-music` | 唱片 `24s linear infinite` 自转、唱臂 `-8°→12°`、中心圆形播放键、封面/曲名/歌手；**96 根放射状律动条**（`container-type:size` + `cqh`、每根 `rotate(--a) translateY(-50cqh)`、`--level` keyframes）；歌词列表上下 `mask-image` 渐隐 + 自动滚动 + 当前行高亮发光 |
| 胶片墙 `.memories-films` | 竖向无缝跑马灯：内容复制一份 + `translateY(-50%)` 42s 循环；卡片 16/9 胶片框（深色边框 + 齿孔 + 等宽字体编号），hover 上浮 + 主色描边 |
| 详情弹窗 `.memories-modal` | 点胶片卡打开；背景整页 `blur(9px) saturate(1.05)`；2/1 封面 + 底部渐隐 + 标题/日期/摘要叠在封面上；正文首行缩进 2em、两端对齐 |
| 暗色星空 `.memories-galaxy` | 仅暗色模式启用，canvas 按 `devicePixelRatio` 绘制的星点 |

外加：`prefers-reduced-motion` 全量降级；移动端（`≤720px`）**另做一套**——顶部专辑信息条 + 三条 `rotate(-10deg)` 水平胶片带（可拖拽）。桌面端的单列竖排换成三行，靠 CSS 切换。

## 实施方案

### 1. 页面骨架：独立全屏布局（照 `WriteLayout.astro` 先例）

新建 `src/layouts/MemoriesLayout.astro`，自带 `<html class="is-memories-page">` + `<body>`：

- 内联主题初始化脚本（`localStorage` 的 `theme` / `hue`）——直接复制 [WriteLayout.astro](file:///d:/前端资源/超好看的博客/Aemeath/src/layouts/WriteLayout.astro#L26-L48) 的写法
- `import "@/styles/main.css"` 与新增的 `@/styles/memories.css`
- **显式挂 `<MusicManager />`**：它平时只出现在 [Layout.astro](file:///d:/前端资源/超好看的博客/Aemeath/src/layouts/Layout.astro#L609)；独立布局不带 `Layout.astro`，必须自己引，否则 `window.__fireflyMusic` 不存在
- 右上角一个淡入的「返回主页」胶囊（同 WriteLayout 的写法），开屏结束后才显示
- 不含 `MainGridLayout` 的导航栏/页脚（原站在本页也是隐藏导航栏的）

**Swup 必须排除**：在 [astro.config.mjs](file:///d:/前端资源/超好看的博客/Aemeath/astro.config.mjs#L121-L130) 的 `ignore` 里加上 `/memories/`（理由同 `/portfolio/`、`/write/`：跨布局边界做局部 DOM 替换会残留容器与样式）。

### 2. 内容集合

在 [content.config.ts](file:///d:/前端资源/超好看的博客/Aemeath/src/content.config.ts) 里按现有写法（显式 `CollectionConfig<z.ZodType<…>>` 类型别名，因为有 `--isolatedDeclarations`）新增 `memories` 集合：

```ts
type MemoriesData = { title: string; date: Date; summary: string; image: string; };
const memoriesCollection: CollectionConfig<z.ZodType<MemoriesData>> = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/memories" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    summary: z.string().optional().default(""),
    image: z.string(),          // 形如 /memories/xxx.webp
  }),
});
```

并加进 `collections` 导出。新建 `src/content/memories/*.md`，先放 **6 条示例条目**（我自己写的占位文案，不抄对方内容），字段与上面一致；正文即弹窗里的长文。

封面图放 `public/memories/`，一张图两用（弹窗用 2:1，胶片卡用 `object-fit:cover` 裁 4:3）。

### 3. 样式：`src/styles/memories.css`

把对方的 `memories.css` 移植为一份普通 CSS 文件（本仓库已有 `src/styles/*.css` 先例，如 `treasure-compat.css`）。**结构照原样保留**，只做两类改动：

- 根类名 `.sakura-memories-page` → `.memories-page`
- 顶部那一处 `--memories-*` 变量定义的取值来源换成本项目令牌

| 原站 | 本项目 |
| --- | --- |
| `--sakura-color-background` | `var(--card-bg)`（暗色下配合 `--page-bg`） |
| `--sakura-color-text-deep` | `var(--deep-text)` |
| `--sakura-color-text-muted` | `color-mix(in srgb, var(--deep-text) 62%, transparent)`（本项目 `--muted` 是**背景色**，不能当文字色用） |
| `--sakura-color-primary` | `var(--primary)` |
| `--sakura-navbar-bg` / `--sakura-navbar-height` / `--sakura-navbar-layout-offset` | 删掉（本页没有导航栏） |

暗色分支由 `html.dark` 提供（本项目就是 `:root.dark`，见 [variables.styl](file:///d:/前端资源/超好看的博客/Aemeath/src/styles/variables.styl#L92-L96)），原文件里 `html.dark .sakura-memories-page { … }` 的覆写块整段保留即可。
`prefers-reduced-motion` 那一段原样保留。

### 4. 组件拆分

| 文件 | 形态 | 职责 |
| --- | --- | --- |
| `src/components/memories/MemoriesSplash.astro` | 服务端渲染 + `<script>` | 开屏闪频：字幕打字机、图片轮播、点击/按键跳过、结束时给根节点切 `is-splash-done`。图片清单从 JSON island 读（照原站 `#memories-flash-images` 的做法） |
| `src/components/memories/MemoriesStage.svelte` | Svelte 5 island | 舞台容器 + 胶片墙（桌面竖排跑马灯 / 移动端三行倾斜带，同一份数据靠 CSS 切换）+ 弹窗开关状态 |
| `src/components/memories/MemoriesVinyl.svelte` | Svelte 5 island | 唱片、唱臂、播放键、封面/曲名、**96 根律动条**、歌词列表与当前行高亮 |
| `src/components/memories/MemoriesDetail.svelte` | Svelte 5 island | 详情弹窗 |
| `src/components/memories/MemoriesGalaxy.astro` | 内联 `<script>` | 暗色星空 canvas（`requestAnimationFrame` + dPR） |

`src/pages/memories/index.astro` 用 `getCollection("memories")` 取数、按 `date` 倒序，把数据序列化后传给上面的 island。

**96 根律动条**由 Svelte `{#each Array.from({length:96}) as _, i}` 渲染，逐根写 `style="--i:{i}; --a:{(i/96*360).toFixed(2)}deg"`；动画本身交给移植过来的 CSS keyframes。

**胶片墙无缝循环**用原站同一招：卡片列表渲染两遍，轨道 `translateY(-50%)`（移动端 `translateX(-50%)`）——纯 CSS，不写 JS 跑马灯。移动端拖拽用 `pointerdown/move/up` 改 `scrollLeft`。

### 5. 接现有播放器（不建第二个 audio）

复用 [MusicManager.astro](file:///d:/前端资源/超好看的博客/Aemeath/src/components/features/MusicManager.astro) 的既有接口（类型定义见 [global.d.ts](file:///d:/前端资源/超好看的博客/Aemeath/src/global.d.ts#L22-L65)）：

- 曲目字段 `{ name, artist, url, pic, lrc? }`
- `window.__fireflyMusic.getState()` 取 `track` / `isPlaying` / `lyrics: Array<{time,text}>` / `currentLrcIndex`
- 事件：`fm:track`、`fm:time`、`fm:lyrics`、`fm:lrc-index`（[MusicManager.astro#L376-L403](file:///d:/前端资源/超好看的博客/Aemeath/src/components/features/MusicManager.astro#L376-L403)）
- 命令：`togglePlay()` / `playNext()` / `playPrev()` / `playTrackByIndex()`

`MemoriesVinyl` 只做「订阅事件 + 渲染」：`fm:track` 换封面、`fm:time` 走进度、`fm:lyrics` 铺歌词、`fm:lrc-index` 高亮并滚动到当前行；播放键直接调 `togglePlay()`，碟片转速由 `isPlaying` 控制。歌词在线兜底已由 `/api/music/lyrics.json` 负责，无需改动。

**真实频谱（可选增强）**：原站在能拿到 AnalyserNode 时切 `.is-analyser` 用真频谱驱动那 96 根条，拿不到就退回纯 CSS keyframes。为不改动既有播放行为，方案是给 `MusicManager` **追加**一个惰性接口 `window.__fireflyMusic.enableAnalyser()`：首次调用才建 `AudioContext` + `createMediaElementSource` + `AnalyserNode`，并在用户手势时 `resume()`；`MemoriesVinyl` 用 `try/catch` 调用，失败就保持纯 CSS 律动。

> **已确认要做。** 这是本次唯一改到既有文件的地方，风险点：`createMediaElementSource` 对同一个 `<audio>` 只能调用一次、且一旦创建声音就会走 AudioContext。因此必须惰性创建 + 全程 `try/catch` + 失败静默回退（回退后视觉不变，只是不跟歌跳）。

### 6. 导航入口

在 [navBarConfig.ts](file:///d:/前端资源/超好看的博客/Aemeath/src/config/navBarConfig.ts) 的 `LinkPresets` 加 `Memories: { name: "回忆", url: "/memories/", icon: "material-symbols:history-rounded" }`，并 push 进「我的」子菜单（图标用仓库里已验证存在的名字，避免出现不存在的图标名）。

## 验证

1. `pnpm check`（沙箱内会因 `D:\.pnpm-store` 失败，需 `dangerouslyDisableSandbox`）→ 0 errors
2. `pnpm type-check`（动过 `content.config.ts`，必须过）
3. `pnpm dev` 后抓 `/memories/` 的 HTML 断言：`<html>` 带 `is-memories-page`；`.memories-music__bar` 数量 = 96；胶片卡数量 = 条目数 × 行数；`.memories-flash` 存在
4. 浏览器双尺寸核对
   - 1440×900：开屏闪频自动播完并可点击跳过 → 舞台两栏入场 → 唱片自转/唱臂落下/歌词高亮推进 → 胶片墙匀速上滚 → 点卡片出弹窗（背景整页模糊）→ ESC/点遮罩关闭 → 切暗色看星空 canvas
   - 390×844：顶部专辑信息条 + 三条 -10° 胶片带可拖拽
   - 开一次系统「减弱动态效果」，确认全部动画降级且内容可见
5. 按项目规则提交并推送（推送需你明确授权）

## 已确认的决定

1. 96 根律动条**接真实频谱**——给 `MusicManager` 追加惰性 `enableAnalyser()` 接口
2. 回忆条目封面图**先用 `text_to_image` 生成的示意图占位**

## 风险与注意

1. **封面图是占位图**：6 张用 `text_to_image` 接口生成（`image_size=landscape_16_9`，弹窗是 2:1 比例最接近），文件名会写明是占位。你之后换成自己的照片时**必须换文件名**（直接覆盖会撞浏览器缓存 key）。
2. **开屏闪频的图片量**：原站有一大组图，闪起来才够密；只有 6 张时我会把列表重复到约 2.5s 的时长，并把单帧时长调到 ~380ms，观感接近。
3. **人物立绘**：原站开屏有个从底部滑入的角色 PNG，属其专属素材，不会使用。默认**不做立绘**（该元素缺省时 CSS 不受影响）；你要的话给我图。