/**
 * 我的技能树数据
 *
 * 结构分两层，故意不铺平：
 *   大类（category）—— 技能树上能看见的方块，代表一个方向，比如「语言基石」「框架生态」
 *   小类（skill）   —— 挂在大类下面，点开大类才展开，比如「语言基石」里的 HTML / CSS / JS
 *
 * 维护方式：
 *   1. 改自己的掌握度：动 skill 的 level（0-5，含义见 LEVELS）
 *   2. 加技能：往对应大类的 skills 里加一条
 *   3. 加方向：在 CATEGORIES 里加一个大类，并给它挑一个 row（1-4）
 *   4. 调整解锁顺序：改大类的 dependsOn（数组里全部点亮 1 级才解锁）
 *
 * 等级预设按 2026 年 10 月的真实状态填写，仅供参考，随时可改。
 */

/** 掌握度等级定义：0 未接触 → 5 大师 */
export interface SkillLevelDef {
	level: number;
	name: string;
	/** 一句话解释这个等级是什么状态 */
	desc: string;
	/** 怎么判断自己到了这一级 */
	judge: string;
}

export const LEVELS: SkillLevelDef[] = [
	{
		level: 0,
		name: "未接触",
		desc: "知道有这么个东西，但一行都没写过。",
		judge: "——",
	},
	{
		level: 1,
		name: "听说过",
		desc: "了解它大概解决什么问题，能跟人聊上两句。",
		judge: "能说出它的用途、以及它能替代什么",
	},
	{
		level: 2,
		name: "会用",
		desc: "照着文档能完成常规需求，卡住了会先查资料。",
		judge: "跟着教程做出过可运行的东西",
	},
	{
		level: 3,
		name: "熟练",
		desc: "能独立开发、独立排错，知道什么时候不该用它。",
		judge: "真实项目里用过，并且踩过坑",
	},
	{
		level: 4,
		name: "精通",
		desc: "懂原理和源码，能把性能优化到极致，能带别人做。",
		judge: "能讲清楚为什么，别人遇到问题会来问你",
	},
	{
		level: 5,
		name: "大师",
		desc: "能造轮子、定标准、影响一整个生态。",
		judge: "写过被广泛使用的库，或在社区有稳定输出",
	},
];

/** 小类：具体技术点，挂在大类下面 */
export interface Skill {
	/** 唯一 id，用于本地存储 */
	id: string;
	name: string;
	/** 方块/清单里显示的短名 */
	short: string;
	/** 我当前的掌握度 0-5 */
	level: number;
	/** 一句话说明这个技能解决什么问题 */
	note: string;
	/** 学习要点 / 推荐资源 */
	tips?: string[];
}

/** 大类：技能树上的方块，点一下展开它包含的小类 */
export interface SkillCategory {
	id: string;
	name: string;
	/** 方块上显示的短名，太长会把方块撑变形 */
	short: string;
	/** 一句话概括这个方向 */
	note: string;
	/** 前置大类 id：全部至少点亮 1 级后，本大类才解锁 */
	dependsOn: string[];
	/** 这个方向的学习路线 / 心态 */
	tips?: string[];
	/** 包含的小类 */
	skills: Skill[];
}

/** 一层：同一层的类目份量相同 */
export interface CategoryTier {
	tier: number;
	/** 这一层的学习阶段 */
	stage: string;
	/** 这一层要达成什么 */
	purpose: string;
	categories: SkillCategory[];
}

export const TIERS: CategoryTier[] = [
	{
		tier: 1,
		stage: "起跑",
		purpose: "先能写出来",
		categories: [
			{
				id: "lang-basics",
				name: "语言基石",
				short: "语言",
				note: "HTML / CSS / JavaScript 三件套，前端一切的地基。地基不牢，后面全是补丁。",
				dependsOn: [],
				tips: [
					"先把语义化和盒模型吃透，再谈框架",
					"JS 的原型、闭包、事件循环，决定你后面学得快不快",
					"每天写一点，比周末突击一整天管用",
				],
				skills: [
					{
						id: "html",
						name: "HTML 语义化",
						short: "HTML",
						level: 4,
						note: "用标签表达结构，而不是用 div 堆出来。",
						tips: [
							"header / nav / main / article / section / footer 的正确用法",
							"表单与原生校验",
							"aria-* 属性与可访问性",
							"meta 标签与 SEO 基础",
						],
					},
					{
						id: "css",
						name: "CSS 基础",
						short: "CSS",
						level: 4,
						note: "选择器、盒模型、层叠与继承。",
						tips: [
							"选择器权重与层叠规则",
							"盒模型与 box-sizing",
							"定位与层叠上下文 z-index",
							"伪类与伪元素",
						],
					},
					{
						id: "js",
						name: "JavaScript 基础",
						short: "JS",
						level: 4,
						note: "变量、类型、函数、作用域四件套。",
						tips: [
							"原型与原型链",
							"this 指向的四种情况",
							"闭包与作用域链",
							"数组与对象常用方法",
						],
					},
					{
						id: "css-layout",
						name: "Flex / Grid 布局",
						short: "Flex/Grid",
						level: 4,
						note: "现代布局只靠这两个就够用了。",
						tips: [
							"Flex 主轴交叉轴与换行",
							"Grid 网格模板与命名区域",
							"align / justify 对齐体系",
							"两栏三栏经典布局实操",
						],
					},
					{
						id: "css-responsive",
						name: "响应式适配",
						short: "响应式",
						level: 4,
						note: "一套代码从手机适配到 4K。",
						tips: [
							"媒体查询与断点设计",
							"相对单位 rem / vw / %",
							"容器查询 container query",
							"移动端 1px 与安全区适配",
						],
					},
					{
						id: "js-dom",
						name: "DOM 与 BOM",
						short: "DOM",
						level: 4,
						note: "操作页面这棵节点树。",
						tips: [
							"选择器与节点遍历",
							"事件流与事件委托",
							"冒泡、捕获与阻止默认行为",
							"localStorage / history API",
						],
					},
					{
						id: "js-es6",
						name: "ES6+ 新特性",
						short: "ES6+",
						level: 4,
						note: "解构、模块、Promise、可选链。",
						tips: [
							"let / const 与暂时性死区",
							"解构赋值与展开运算符",
							"ESM 模块化",
							"Promise 与 async / await",
						],
					},
					{
						id: "css-preprocess",
						name: "CSS 预处理器",
						short: "预处理器",
						level: 3,
						note: "Sass / Less / Stylus，写更少、更好维护的样式。",
						tips: [
							"变量与嵌套",
							"mixin 与函数",
							"样式模块化拆分",
							"Stylus 缩进语法",
						],
					},
					{
						id: "css-modern",
						name: "现代 CSS 特性",
						short: "现代 CSS",
						level: 2,
						note: "把以前要 JS 干的活交回给 CSS。",
						tips: [
							"CSS 变量与主题切换",
							"color-mix / oklch 色彩函数",
							":has() 与 :is() 选择器",
							"过渡与关键帧动画",
						],
					},
					{
						id: "js-async",
						name: "异步与事件循环",
						short: "异步",
						level: 3,
						note: "宏任务微任务搞懂了才算真的入门。",
						tips: [
							"调用栈与任务队列",
							"Promise 状态机",
							"async / await 的错误处理",
							"并发控制 Promise.all / race / allSettled",
						],
					},
					{
						id: "regex",
						name: "正则表达式",
						short: "正则",
						level: 2,
						note: "文本处理的瑞士军刀。",
						tips: [
							"字符类与量词",
							"分组与反向引用",
							"零宽断言",
							"常见表单校验场景",
						],
					},
				],
			},
		],
	},
	{
		tier: 2,
		stage: "骨架",
		purpose: "能看懂原理",
		categories: [
			{
				id: "type-system",
				name: "类型系统",
				short: "类型",
				note: "让错误在编译期暴露。项目一大，类型就从「加分项」变成「必需品」。",
				dependsOn: ["lang-basics"],
				tips: [
					"先会用，再去啃类型体操，别一上来就玩花活",
					"泛型和工具类型是分水岭，也是面试重点",
				],
				skills: [
					{
						id: "functional",
						name: "函数式编程",
						short: "函数式",
						level: 2,
						note: "纯函数、不可变数据、组合优于继承。",
						tips: [
							"纯函数与副作用隔离",
							"map / filter / reduce 思维",
							"柯里化与函数组合",
							"不可变数据更新",
						],
					},
					{
						id: "typescript",
						name: "TypeScript",
						short: "TS",
						level: 3,
						note: "给 JavaScript 加一层类型保险。",
						tips: [
							"基础类型与接口定义",
							"类型收窄与联合类型",
							"泛型基础",
							"tsconfig 严格模式",
						],
					},
					{
						id: "ts-generics",
						name: "泛型与类型推导",
						short: "泛型",
						level: 3,
						note: "写可复用又类型安全的代码。",
						tips: [
							"泛型约束 extends",
							"条件类型与 infer",
							"映射类型 Mapped Types",
							"类型推导优先级",
						],
					},
					{
						id: "ts-utility",
						name: "工具类型与类型体操",
						short: "工具类型",
						level: 2,
						note: "Partial / Record / Pick 这些要烂熟于心。",
						tips: [
							"内置工具类型全家桶",
							"模板字符串类型",
							"递归类型",
							"分布式条件类型",
						],
					},
					{
						id: "ts-dts",
						name: "声明文件 .d.ts",
						short: ".d.ts",
						level: 2,
						note: "给没有类型的库补上类型。",
						tips: [
							"declare module 模块声明",
							"全局类型声明",
							"声明合并",
							"用 JSDoc 生成类型",
						],
					},
					{
						id: "ts-migration",
						name: "类型规范与渐进迁移",
						short: "渐进迁移",
						level: 2,
						note: "把老项目一点点搬到 TS 上。",
						tips: [
							"any 治理策略",
							"类型断言与类型守卫",
							"渐进式迁移路线",
							"类型覆盖率度量",
						],
					},
				],
			},
			{
				id: "browser",
				name: "浏览器与体验",
				short: "浏览器",
				note: "知道浏览器怎么工作，才知道性能该往哪儿优化、bug 该去哪儿找。",
				dependsOn: ["lang-basics"],
				tips: [
					"性能面板的火焰图，至少要会看",
					"渲染管线、重排重绘、缓存策略，是优化的三个抓手",
				],
				skills: [
					{
						id: "browser-render",
						name: "浏览器渲染原理",
						short: "渲染原理",
						level: 3,
						note: "从输入 URL 到看见像素的完整链路。",
						tips: [
							"关键渲染路径",
							"重排与重绘",
							"合成层与 GPU 加速",
							"帧率与 60fps",
						],
					},
					{
						id: "http",
						name: "HTTP / HTTPS",
						short: "HTTP",
						level: 3,
						note: "所有数据都靠它传输。",
						tips: [
							"请求响应与状态码",
							"HTTP/2 与 HTTP/3",
							"请求头与内容协商",
							"TLS 握手过程",
						],
					},
					{
						id: "network",
						name: "跨域与网络协议",
						short: "网络协议",
						level: 3,
						note: "前后端联调绕不开的坎。",
						tips: [
							"同源策略与 CORS",
							"开发代理与反向代理",
							"WebSocket / SSE",
							"DNS 解析与 TCP 握手",
						],
					},
					{
						id: "security",
						name: "Web 安全",
						short: "安全",
						level: 2,
						note: "防住最常见的那几类攻击。",
						tips: [
							"XSS 与输出转义",
							"CSRF 与 SameSite",
							"CSP 内容安全策略",
							"依赖漏洞扫描",
						],
					},
					{
						id: "performance",
						name: "性能优化",
						short: "性能",
						level: 3,
						note: "把指标从红变绿。",
						tips: [
							"Core Web Vitals：LCP / INP / CLS",
							"资源压缩与按需加载",
							"图片与字体优化",
							"设置性能预算",
						],
					},
					{
						id: "cache",
						name: "缓存策略",
						short: "缓存",
						level: 2,
						note: "让用户第二次打开快三倍。",
						tips: [
							"强缓存与协商缓存",
							"Cache-Control / ETag",
							"CDN 缓存与刷新",
							"Service Worker",
						],
					},
					{
						id: "devtools",
						name: "DevTools 调试",
						short: "调试",
						level: 4,
						note: "排查问题的第一现场。",
						tips: [
							"Network 瀑布流分析",
							"Performance 火焰图",
							"内存快照与泄漏排查",
							"断点与条件断点",
						],
					},
					{
						id: "a11y",
						name: "无障碍",
						short: "无障碍",
						level: 1,
						note: "让所有人都能用你的网站。",
						tips: [
							"语义化与键盘可达",
							"颜色对比度",
							"屏幕阅读器",
							"无障碍检测工具",
						],
					},
				],
			},
		],
	},
	{
		tier: 3,
		stage: "成形",
		purpose: "能独立做项目",
		categories: [
			{
				id: "framework",
				name: "框架生态",
				short: "框架",
				note: "把重复劳动交给框架，你只专注业务本身。",
				dependsOn: ["type-system", "browser"],
				tips: ["吃透一个，再看别的会非常快", "理解响应式原理，别只背 API"],
				skills: [
					{
						id: "vue",
						name: "Vue 3",
						short: "Vue 3",
						level: 4,
						note: "你的主力框架，吃饭的家伙。",
						tips: [
							"响应式原理 ref / reactive",
							"模板语法与内置指令",
							"生命周期钩子",
							"v-model 与自定义组件",
						],
					},
					{
						id: "vue-composition",
						name: "组合式 API",
						short: "组合式",
						level: 4,
						note: "逻辑复用才是它的真正价值。",
						tips: [
							"setup 与 script setup",
							"computed 与 watch 的区别",
							"抽自定义组合函数",
							"provide / inject 跨层通信",
						],
					},
					{
						id: "vue-router",
						name: "Vue Router",
						short: "路由",
						level: 4,
						note: "单页应用的骨架。",
						tips: [
							"动态路由与参数传递",
							"导航守卫做权限",
							"路由懒加载与分包",
							"meta 元信息设计",
						],
					},
					{
						id: "pinia",
						name: "状态管理",
						short: "Pinia",
						level: 4,
						note: "跨组件共享状态的唯一入口。",
						tips: [
							"Pinia store 定义",
							"getters 与 actions",
							"持久化插件",
							"按业务域拆分模块",
						],
					},
					{
						id: "vben",
						name: "中后台框架",
						short: "中后台",
						level: 3,
						note: "Vben Admin 这类开箱即用的中台底座。",
						tips: [
							"目录结构与约定",
							"路由与权限体系",
							"公共包抽取思路",
							"二次开发的正确姿势",
						],
					},
					{
						id: "tsx-vue",
						name: "Vue + TSX",
						short: "TSX",
						level: 3,
						note: "在 Vue 里写 JSX，复杂渲染逻辑更顺手。",
						tips: [
							"render 函数与 h()",
							"TSX 的类型标注",
							"与 SFC 混用的取舍",
							"什么场景值得用",
						],
					},
					{
						id: "component-lib",
						name: "组件库",
						short: "组件库",
						level: 3,
						note: "Element Plus / Ant Design / vxe-table 这类。",
						tips: [
							"按需引入与体积控制",
							"主题定制",
							"二次封装业务组件",
							"表格与表单最佳实践",
						],
					},
					{
						id: "react",
						name: "React",
						short: "React",
						level: 2,
						note: "另一套主流心智模型，值得懂。",
						tips: [
							"JSX 与组件化",
							"useState / useEffect",
							"虚拟 DOM 与 diff 策略",
							"Hooks 使用规则",
						],
					},
					{
						id: "astro",
						name: "Astro",
						short: "Astro",
						level: 2,
						note: "内容站点的性能天花板。",
						tips: [
							"岛屿架构 Islands",
							"默认零 JS",
							"内容集合 Content Collections",
							"与各框架混用",
						],
					},
					{
						id: "ssr",
						name: "SSR / SSG / ISR",
						short: "SSR",
						level: 2,
						note: "首屏速度和 SEO 的解法。",
						tips: [
							"三种渲染模式对比",
							"水合 hydration 原理",
							"数据预取",
							"静态生成与增量更新",
						],
					},
				],
			},
			{
				id: "engineering",
				name: "工程化",
				short: "工程",
				note: "从「我这儿能跑」到「团队一起能跑」，中间的差距就是工程化。",
				dependsOn: ["framework"],
				tips: ["先搞懂构建工具到底在干什么", "CI/CD 是团队协作的分界线"],
				skills: [
					{
						id: "git",
						name: "Git 版本控制",
						short: "Git",
						level: 4,
						note: "团队协作的地基，越早学越省事。",
						tips: [
							"提交规范与历史整理",
							"分支与合并",
							"rebase 与 merge 的取舍",
							"stash 与 cherry-pick",
						],
					},
					{
						id: "lint",
						name: "代码规范",
						short: "Lint",
						level: 3,
						note: "让团队写出来的代码像同一个人写的。",
						tips: [
							"ESLint / Biome 配置",
							"Prettier 格式化",
							"Git hooks 与 lint-staged",
							"提交信息规范",
						],
					},
					{
						id: "vite",
						name: "Vite",
						short: "Vite",
						level: 3,
						note: "新一代构建工具，开发体验质变。",
						tips: [
							"开发态 ESM 与依赖预构建",
							"插件机制",
							"产物分包与体积分析",
							"生产构建优化",
						],
					},
					{
						id: "pnpm",
						name: "包管理器",
						short: "pnpm",
						level: 3,
						note: "快、省磁盘、依赖严格。",
						tips: [
							"pnpm 与 npm / yarn 的差异",
							"lockfile 与依赖锁定",
							"workspace 协议",
							"peer 依赖处理",
						],
					},
					{
						id: "git-flow",
						name: "分支策略与协作流",
						short: "分支流",
						level: 3,
						note: "main / dev / test / pre-prod 这套怎么走。",
						tips: [
							"环境分支模型",
							"feature 分支命名规范",
							"冲突处理流程",
							"PR / MR 评审流程",
						],
					},
					{
						id: "monorepo",
						name: "Monorepo",
						short: "Monorepo",
						level: 2,
						note: "多个包在同一个仓库里管理。",
						tips: [
							"pnpm workspace 配置",
							"内部包互相引用",
							"版本与发布策略",
							"构建缓存与增量",
						],
					},
					{
						id: "webpack",
						name: "Webpack",
						short: "Webpack",
						level: 1,
						note: "老项目的构建标配，懂它才能改老项目。",
						tips: [
							"entry / output / loader / plugin",
							"代码分割",
							"tree-shaking",
							"迁移到 Vite 的路径",
						],
					},
					{
						id: "ci-cd",
						name: "CI / CD",
						short: "CI/CD",
						level: 2,
						note: "提交后自动构建、测试、上线。",
						tips: [
							"GitHub Actions / GitLab CI",
							"流水线编排",
							"环境变量与密钥管理",
							"自动部署与回滚",
						],
					},
					{
						id: "npm-publish",
						name: "发包与版本管理",
						short: "发包",
						level: 1,
						note: "把自己的代码发布出去给别人用。",
						tips: [
							"语义化版本 semver",
							"changeset 管理多包版本",
							"私有 registry",
							"产物体积与格式 ESM/CJS",
						],
					},
				],
			},
			{
				id: "quality",
				name: "质量保障",
				short: "质量",
				note: "测试和评审决定你的代码能不能上生产，也决定你敢不敢重构。",
				dependsOn: ["engineering"],
				tips: [
					"测试做不到 100%，但关键路径必须覆盖",
					"Code Review 是性价比最高的学习方式",
				],
				skills: [
					{
						id: "type-check",
						name: "静态检查",
						short: "类型检查",
						level: 3,
						note: "在代码跑起来之前就发现问题。",
					},
					{
						id: "refactor",
						name: "重构",
						short: "重构",
						level: 2,
						note: "不改变行为地改善结构。",
					},
					{
						id: "code-review",
						name: "代码审查",
						short: "评审",
						level: 3,
						note: "读别人的代码本身就是学习。",
						tips: [
							"Review 该关注什么",
							"小步提交便于评审",
							"如何提出和接受建议",
							"建立评审清单",
						],
					},
					{
						id: "unit-test",
						name: "单元测试",
						short: "单元测试",
						level: 2,
						note: "给核心逻辑上一份保险。",
						tips: [
							"Vitest / Jest 基础",
							"断言与 mock",
							"测试覆盖率",
							"怎么写可测试的代码",
						],
					},
					{
						id: "e2e",
						name: "端到端测试",
						short: "E2E",
						level: 1,
						note: "模拟真人把全流程点一遍。",
						tips: [
							"Playwright / Cypress",
							"选择器与等待策略",
							"视觉回归测试",
							"在 CI 里跑 E2E",
						],
					},
					{
						id: "tdd",
						name: "TDD 思维",
						short: "TDD",
						level: 1,
						note: "先写测试，再写实现。",
					},
				],
			},
		],
	},
	{
		tier: 4,
		stage: "纵深",
		purpose: "能扛事、能输出",
		categories: [
			{
				id: "visual",
				name: "视觉与动效",
				short: "视觉",
				note: "技术之上是体验。动效不是炫技，是让信息流动得更顺。",
				dependsOn: ["framework"],
				tips: [
					"动画第一原则：服务于信息，而不是装饰",
					"Canvas 与 WebGL 按需学，别为了简历硬上",
				],
				skills: [
					{
						id: "design",
						name: "视觉与交互设计感",
						short: "设计感",
						level: 3,
						note: "技术之外决定作品上限的东西。",
						tips: [
							"配色与对比度",
							"间距与对齐节奏",
							"信息层次与视觉动线",
							"微交互细节",
						],
					},
					{
						id: "motion",
						name: "动效库",
						short: "动效",
						level: 2,
						note: "Motion / GSAP 这类，处理复杂动画编排。",
						tips: [
							"声明式动画 API",
							"手势与拖拽",
							"时间轴编排",
							"与框架的集成方式",
						],
					},
					{
						id: "svg",
						name: "SVG 绘图",
						short: "SVG",
						level: 3,
						note: "矢量、可交互、体积还小。",
						tips: [
							"路径与基本图形",
							"viewBox 与自适应缩放",
							"SVG 动画与滤镜",
							"图标系统与 sprite",
						],
					},
					{
						id: "css-animation",
						name: "CSS 动画与过渡",
						short: "CSS 动画",
						level: 4,
						note: "性能最好的动效方案，优先用它。",
						tips: [
							"transition 与 transform",
							"keyframes 关键帧",
							"动画性能与合成层",
							"prefers-reduced-motion 适配",
						],
					},
					{
						id: "canvas",
						name: "Canvas 2D",
						short: "Canvas",
						level: 2,
						note: "像素级的自由绘制。",
						tips: [
							"绘图上下文",
							"requestAnimationFrame 动画循环",
							"坐标系与变换",
							"性能与离屏渲染",
						],
					},
					{
						id: "three",
						name: "WebGL / Three.js",
						short: "Three.js",
						level: 0,
						note: "把 3D 世界搬进浏览器。",
						tips: [
							"场景 / 相机 / 渲染器",
							"材质与光照",
							"加载 GLTF 模型",
							"性能优化与优雅降级",
						],
					},
				],
			},
			{
				id: "backend",
				name: "服务端与全栈",
				short: "服务端",
				note: "能自己把东西部署上线，才算真正交付了一个产品。",
				dependsOn: ["engineering"],
				tips: ["先会写接口、连数据库", "Docker 是现代部署的通用语言"],
				skills: [
					{
						id: "node",
						name: "Node.js",
						short: "Node.js",
						level: 3,
						note: "让 JavaScript 跑在服务器上。",
						tips: [
							"模块系统与事件循环",
							"fs / path / stream",
							"写并发布 npm 包",
							"进程管理与内存",
						],
					},
					{
						id: "server-framework",
						name: "服务端框架",
						short: "服务端",
						level: 2,
						note: "Express / Koa / Nest / Fastify。",
						tips: [
							"路由与中间件",
							"参数校验",
							"Controller / Service 分层",
							"日志与错误处理",
						],
					},
					{
						id: "database",
						name: "数据库",
						short: "数据库",
						level: 2,
						note: "数据最终要落到这里。",
						tips: [
							"SQL 基础与连表查询",
							"索引与查询优化",
							"事务与锁",
							"Redis 缓存",
						],
					},
					{
						id: "orm",
						name: "ORM 与数据建模",
						short: "ORM",
						level: 1,
						note: "用代码而不是拼字符串操作数据库。",
						tips: [
							"Prisma / TypeORM / Drizzle",
							"表关系设计",
							"迁移 migration",
							"N+1 查询问题",
						],
					},
					{
						id: "api-design",
						name: "API 设计",
						short: "API 设计",
						level: 3,
						note: "接口是前后端之间的合同。",
						tips: [
							"RESTful 规范",
							"接口版本管理",
							"错误码与统一响应结构",
							"分页、排序与幂等",
						],
					},
					{
						id: "auth",
						name: "认证与鉴权",
						short: "鉴权",
						level: 2,
						note: "你是谁、你能干什么。",
						tips: [
							"Session / JWT / OAuth2",
							"RBAC 权限模型",
							"Token 刷新与失效",
							"单点登录 SSO",
						],
					},
					{
						id: "deploy",
						name: "云部署",
						short: "部署",
						level: 2,
						note: "把项目真正放到网上。",
						tips: [
							"云服务器与域名解析",
							"Node 进程管理 pm2",
							"对象存储与 CDN",
							"自动化部署脚本",
						],
					},
					{
						id: "docker",
						name: "Docker",
						short: "Docker",
						level: 1,
						note: "把运行环境和应用一起打包。",
						tips: [
							"镜像与容器",
							"Dockerfile 编写",
							"docker compose 编排",
							"多阶段构建瘦身",
						],
					},
					{
						id: "nginx",
						name: "Nginx",
						short: "Nginx",
						level: 0,
						note: "线上流量的第一道门。",
						tips: [
							"反向代理与负载均衡",
							"静态资源与 gzip",
							"HTTPS 证书配置",
							"常见性能调优",
						],
					},
					{
						id: "monitor",
						name: "监控与排障",
						short: "监控",
						level: 0,
						note: "上线之后才是真正的开始。",
						tips: [
							"日志采集",
							"错误上报 Sentry",
							"接口耗时与告警",
							"线上问题定位思路",
						],
					},
				],
			},
			{
				id: "architecture",
				name: "架构与设计",
				short: "架构",
				note: "从写页面到设计系统，是工程师迈向架构师的分水岭。",
				dependsOn: ["quality"],
				tips: [
					"设计模式要结合场景记，别背定义",
					"微前端是组织的解法，不是技术的炫技",
				],
				skills: [
					{
						id: "design-patterns",
						name: "设计模式",
						short: "设计模式",
						level: 2,
						note: "前人总结好的解法模板。",
						tips: [
							"观察者 / 发布订阅",
							"策略与工厂",
							"单例与代理",
							"在前端项目里的具体落地",
						],
					},
					{
						id: "component-design",
						name: "组件设计",
						short: "组件设计",
						level: 3,
						note: "好组件是设计出来的，不是堆出来的。",
						tips: [
							"受控与非受控",
							"组合优于继承",
							"插槽与 Render Props",
							"API 的稳定性",
						],
					},
					{
						id: "state-arch",
						name: "状态架构",
						short: "状态架构",
						level: 3,
						note: "数据怎么流，决定了项目好不好维护。",
						tips: [
							"单向数据流",
							"本地态与全局态的边界",
							"服务端状态的缓存与失效",
							"状态同步与竞态处理",
						],
					},
					{
						id: "micro-fe",
						name: "微前端",
						short: "微前端",
						level: 1,
						note: "多个团队共用一个大页面。",
						tips: [
							"qiankun / Module Federation",
							"沙箱与样式隔离",
							"应用间通信",
							"什么时候不该用",
						],
					},
					{
						id: "cross-end",
						name: "跨端开发",
						short: "跨端",
						level: 1,
						note: "一套代码多端运行。",
						tips: [
							"小程序 / uni-app / Taro",
							"React Native / Flutter",
							"Electron 桌面端",
							"条件编译与差异抹平",
						],
					},
					{
						id: "perf-extreme",
						name: "性能极限优化",
						short: "极限优化",
						level: 1,
						note: "把每一毫秒都抢回来。",
						tips: [
							"长任务拆分",
							"虚拟列表与时间切片",
							"Worker 多线程",
							"极致首屏方案",
						],
					},
				],
			},
			{
				id: "growth",
				name: "成长与输出",
				short: "成长",
				note: "把学到的东西讲出去，才算真的学会。输出是最快的输入。",
				dependsOn: ["architecture"],
				tips: ["写作是最好的复盘", "AI 是杠杆，不是替代"],
				skills: [
					{
						id: "ai-assist",
						name: "AI 辅助编程",
						short: "AI 协作",
						level: 4,
						note: "把 AI 变成放大器，而不是拐杖。",
						tips: [
							"Prompt 与上下文工程",
							"补全与审查工具链",
							"用 AI 读大型源码",
							"边界：什么不能交给 AI 写",
						],
					},
					{
						id: "interview",
						name: "面试与职业成长",
						short: "面试",
						level: 3,
						note: "把会的东西讲清楚，也是一种能力。",
						tips: [
							"用 STAR 讲项目",
							"八股背后的原理",
							"手写代码与算法题",
							"职业路径规划",
						],
					},
					{
						id: "writing",
						name: "技术写作与分享",
						short: "写作",
						level: 2,
						note: "输出才是最好的输入。",
						tips: [
							"把一个 bug 写成文章",
							"搭建自己的技术博客",
							"做一次内部分享",
							"沉淀个人知识库",
						],
					},
					{
						id: "open-source",
						name: "开源贡献",
						short: "开源",
						level: 1,
						note: "从提一个 issue 到提交第一个 PR。",
						tips: [
							"读懂大型开源仓库",
							"提交第一个 PR",
							"维护自己的小库",
							"社区协作礼仪",
						],
					},
					{
						id: "langchain",
						name: "大模型应用开发",
						short: "LangChain",
						level: 1,
						note: "把 LLM 接进自己的产品里。",
						tips: [
							"模型调用与流式输出",
							"Chain 与 Tool 调用",
							"记忆与多轮对话",
							"成本与限流控制",
						],
					},
					{
						id: "rag",
						name: "RAG 检索增强",
						short: "RAG",
						level: 1,
						note: "让模型回答你私有知识库里的问题。",
						tips: [
							"文档切分与向量化",
							"向量库检索",
							"重排序与引用溯源",
							"效果评估",
						],
					},
				],
			},
		],
	},
];

/** 所有大类（按层级顺序铺平） */
export const CATEGORIES: SkillCategory[] = TIERS.flatMap((t) => t.categories);

/** id → 大类，便于查询 */
export const CATEGORY_MAP: Record<string, SkillCategory> = Object.fromEntries(
	CATEGORIES.map((c) => [c.id, c]),
);

/** 所有小类（铺平） */
export const ALL_SKILLS: Skill[] = CATEGORIES.flatMap((c) => c.skills);

/** 小类 id → 所属大类 */
export const SKILL_OWNER: Record<string, string> = Object.fromEntries(
	CATEGORIES.flatMap((c) => c.skills.map((s) => [s.id, c.id])),
);

export const TOTAL_CATEGORIES = CATEGORIES.length;
export const TOTAL_SKILLS = ALL_SKILLS.length;
export const MAX_LEVEL = LEVELS.length - 1;
