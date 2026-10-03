/**
 * 我的技能树数据
 *
 * 结构：从高到低一层一层往下长。同一层里的技术难度与占比相同，层号越大越深。
 *
 * 维护方式：
 *   1. 想改自己的掌握度，直接改节点的 level（0-5，含义见 LEVELS）
 *   2. 想加技能，往对应层级的 nodes 里加一条即可，页面会自动排版
 *   3. 想调整层级结构，改 TIERS 的 stage / purpose，或把节点在不同层之间挪动
 *
 * level 预设按 2026 年 10 月的真实状态填写，仅供参考，随时可改。
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

/** 单个技能节点 */
export interface SkillNode {
	/** 唯一 id，用于本地存储 */
	id: string;
	name: string;
	/** 我当前的掌握度 0-5 */
	level: number;
	/** 所属方向，详情面板里标注用 */
	track: string;
	/** 一句话说明这个技能解决什么问题 */
	note: string;
	/** 学习要点 / 推荐资源 */
	tips?: string[];
}

/** 一个层级：同层技术的难度与占比相同 */
export interface SkillTier {
	tier: number;
	/** 阶段名 */
	stage: string;
	/** 这一层要解决的核心问题 */
	purpose: string;
	nodes: SkillNode[];
}

/** 树的起点，挂在最上面那一层的正上方 */
export const ROOT = {
	name: "Web 前端 · 起点",
	note: "从零开始，一层一层往上长。",
};

export const TIERS: SkillTier[] = [
	{
		tier: 0,
		stage: "起跑",
		purpose: "先把页面写出来，能看见东西",
		nodes: [
			{
				id: "html",
				name: "HTML 语义化",
				level: 4,
				track: "语言",
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
				level: 4,
				track: "语言",
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
				level: 4,
				track: "语言",
				note: "变量、类型、函数、作用域四件套。",
				tips: [
					"原型与原型链",
					"this 指向的四种情况",
					"闭包与作用域链",
					"数组与对象常用方法",
				],
			},
		],
	},
	{
		tier: 1,
		stage: "骨架",
		purpose: "把页面排得对、排得稳，并且能提交到仓库",
		nodes: [
			{
				id: "css-layout",
				name: "Flex / Grid 布局",
				level: 4,
				track: "语言",
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
				level: 4,
				track: "语言",
				note: "一套代码从手机适配到 4K。",
				tips: [
					"媒体查询与断点设计",
					"相对单位 rem / vw / %",
					"容器查询 container query",
					"移动端 1px 与安全区适配",
				],
			},
			{
				id: "js-es6",
				name: "ES6+ 新特性",
				level: 4,
				track: "语言",
				note: "解构、模块、Promise、可选链。",
				tips: [
					"let / const 与暂时性死区",
					"解构赋值与展开运算符",
					"ESM 模块化",
					"Promise 与 async / await",
				],
			},
			{
				id: "js-dom",
				name: "DOM 与 BOM",
				level: 4,
				track: "语言",
				note: "操作页面这棵节点树。",
				tips: [
					"选择器与节点遍历",
					"事件流与事件委托",
					"冒泡、捕获与阻止默认行为",
					"localStorage / history API",
				],
			},
			{
				id: "git",
				name: "Git 版本控制",
				level: 4,
				track: "工程",
				note: "团队协作的地基，越早学越省事。",
				tips: [
					"提交规范与历史整理",
					"分支与合并",
					"rebase 与 merge 的取舍",
					"stash 与 cherry-pick",
				],
			},
		],
	},
	{
		tier: 2,
		stage: "语法进阶",
		purpose: "从「能写」到「写得对」，建立类型与异步的直觉",
		nodes: [
			{
				id: "css-preprocess",
				name: "CSS 预处理器",
				level: 3,
				track: "语言",
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
				level: 2,
				track: "语言",
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
				level: 3,
				track: "语言",
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
				level: 2,
				track: "语言",
				note: "文本处理的瑞士军刀。",
				tips: [
					"字符类与量词",
					"分组与反向引用",
					"零宽断言",
					"常见表单校验场景",
				],
			},
			{
				id: "typescript",
				name: "TypeScript",
				level: 3,
				track: "类型",
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
				level: 3,
				track: "类型",
				note: "写可复用又类型安全的代码。",
				tips: [
					"泛型约束 extends",
					"条件类型与 infer",
					"映射类型 Mapped Types",
					"类型推导优先级",
				],
			},
		],
	},
	{
		tier: 3,
		stage: "工程化",
		purpose: "让多人协作和自动化交付都不出事故",
		nodes: [
			{
				id: "functional",
				name: "函数式编程",
				level: 2,
				track: "类型",
				note: "纯函数、不可变数据、组合优于继承。",
				tips: [
					"纯函数与副作用隔离",
					"map / filter / reduce 思维",
					"柯里化与函数组合",
					"不可变数据更新",
				],
			},
			{
				id: "ts-utility",
				name: "工具类型与类型体操",
				level: 2,
				track: "类型",
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
				level: 2,
				track: "类型",
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
				level: 2,
				track: "类型",
				note: "把老项目一点点搬到 TS 上。",
				tips: [
					"any 治理策略",
					"类型断言与类型守卫",
					"渐进式迁移路线",
					"类型覆盖率度量",
				],
			},
			{
				id: "git-flow",
				name: "分支策略与协作流",
				level: 3,
				track: "工程",
				note: "main / dev / test / pre-prod 这套怎么走。",
				tips: [
					"环境分支模型",
					"feature 分支命名规范",
					"冲突处理流程",
					"PR / MR 评审流程",
				],
			},
			{
				id: "pnpm",
				name: "包管理器",
				level: 3,
				track: "工程",
				note: "快、省磁盘、依赖严格。",
				tips: [
					"pnpm 与 npm / yarn 的差异",
					"lockfile 与依赖锁定",
					"workspace 协议",
					"peer 依赖处理",
				],
			},
			{
				id: "vite",
				name: "Vite",
				level: 3,
				track: "工程",
				note: "新一代构建工具，开发体验质变。",
				tips: [
					"开发态 ESM 与依赖预构建",
					"插件机制",
					"产物分包与体积分析",
					"生产构建优化",
				],
			},
			{
				id: "lint",
				name: "代码规范",
				level: 3,
				track: "工程",
				note: "让团队写出来的代码像同一个人写的。",
				tips: [
					"ESLint / Biome 配置",
					"Prettier 格式化",
					"Git hooks 与 lint-staged",
					"提交信息规范",
				],
			},
		],
	},
	{
		tier: 4,
		stage: "框架应用",
		purpose: "真正开始用框架造业务页面",
		nodes: [
			{
				id: "vue",
				name: "Vue 3",
				level: 4,
				track: "框架",
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
				level: 4,
				track: "框架",
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
				level: 4,
				track: "框架",
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
				level: 4,
				track: "框架",
				note: "跨组件共享状态的唯一入口。",
				tips: [
					"Pinia store 定义",
					"getters 与 actions",
					"持久化插件",
					"按业务域拆分模块",
				],
			},
			{
				id: "tsx-vue",
				name: "Vue + TSX",
				level: 3,
				track: "框架",
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
				level: 3,
				track: "框架",
				note: "Element Plus / Ant Design / vxe-table 这类。",
				tips: [
					"按需引入与体积控制",
					"主题定制",
					"二次封装业务组件",
					"表格与表单最佳实践",
				],
			},
			{
				id: "vben",
				name: "中后台框架",
				level: 3,
				track: "框架",
				note: "Vben Admin 这类开箱即用的中台底座。",
				tips: [
					"目录结构与约定",
					"路由与权限体系",
					"公共包抽取思路",
					"二次开发的正确姿势",
				],
			},
			{
				id: "react",
				name: "React",
				level: 2,
				track: "框架",
				note: "另一套主流心智模型，值得懂。",
				tips: [
					"JSX 与组件化",
					"useState / useEffect",
					"虚拟 DOM 与 diff 策略",
					"Hooks 使用规则",
				],
			},
			{
				id: "monorepo",
				name: "Monorepo",
				level: 2,
				track: "工程",
				note: "多个包在同一个仓库里管理。",
				tips: [
					"pnpm workspace 配置",
					"内部包互相引用",
					"版本与发布策略",
					"构建缓存与增量",
				],
			},
		],
	},
	{
		tier: 5,
		stage: "原理与质量",
		purpose: "知道为什么快、为什么慢，以及怎么保证改不坏",
		nodes: [
			{
				id: "browser-render",
				name: "浏览器渲染原理",
				level: 3,
				track: "浏览器",
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
				level: 3,
				track: "浏览器",
				note: "所有数据都靠它传输。",
				tips: [
					"请求响应与状态码",
					"HTTP/2 与 HTTP/3",
					"请求头与内容协商",
					"TLS 握手过程",
				],
			},
			{
				id: "cache",
				name: "缓存策略",
				level: 2,
				track: "浏览器",
				note: "让用户第二次打开快三倍。",
				tips: [
					"强缓存与协商缓存",
					"Cache-Control / ETag",
					"CDN 缓存与刷新",
					"Service Worker",
				],
			},
			{
				id: "performance",
				name: "性能优化",
				level: 3,
				track: "浏览器",
				note: "把指标从红变绿。",
				tips: [
					"Core Web Vitals：LCP / INP / CLS",
					"资源压缩与按需加载",
					"图片与字体优化",
					"设置性能预算",
				],
			},
			{
				id: "devtools",
				name: "DevTools 调试",
				level: 4,
				track: "浏览器",
				note: "排查问题的第一现场。",
				tips: [
					"Network 瀑布流分析",
					"Performance 火焰图",
					"内存快照与泄漏排查",
					"断点与条件断点",
				],
			},
			{
				id: "network",
				name: "跨域与网络协议",
				level: 3,
				track: "浏览器",
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
				level: 2,
				track: "浏览器",
				note: "防住最常见的那几类攻击。",
				tips: [
					"XSS 与输出转义",
					"CSRF 与 SameSite",
					"CSP 内容安全策略",
					"依赖漏洞扫描",
				],
			},
			{
				id: "a11y",
				name: "无障碍",
				level: 1,
				track: "浏览器",
				note: "让所有人都能用你的网站。",
				tips: [
					"语义化与键盘可达",
					"颜色对比度",
					"屏幕阅读器",
					"无障碍检测工具",
				],
			},
			{
				id: "code-review",
				name: "代码审查",
				level: 3,
				track: "质量",
				note: "读别人的代码本身就是学习。",
				tips: [
					"Review 该关注什么",
					"小步提交便于评审",
					"如何提出和接受建议",
					"建立评审清单",
				],
			},
			{
				id: "refactor",
				name: "重构",
				level: 2,
				track: "质量",
				note: "不改变行为地改善结构。",
				tips: ["识别代码坏味道", "小步重构手法", "抽取与内联", "安全网：测试"],
			},
			{
				id: "type-check",
				name: "静态检查",
				level: 3,
				track: "质量",
				note: "在代码跑起来之前就发现问题。",
				tips: ["tsc --noEmit", "astro check", "类型覆盖率", "把检查放进 CI"],
			},
		],
	},
	{
		tier: 6,
		stage: "全栈打通",
		purpose: "从浏览器走到服务器，一个人把功能上线",
		nodes: [
			{
				id: "node",
				name: "Node.js",
				level: 3,
				track: "服务端",
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
				level: 2,
				track: "服务端",
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
				level: 2,
				track: "服务端",
				note: "数据最终要落到这里。",
				tips: [
					"SQL 基础与连表查询",
					"索引与查询优化",
					"事务与锁",
					"Redis 缓存",
				],
			},
			{
				id: "api-design",
				name: "API 设计",
				level: 3,
				track: "服务端",
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
				level: 2,
				track: "服务端",
				note: "你是谁、你能干什么。",
				tips: [
					"Session / JWT / OAuth2",
					"RBAC 权限模型",
					"Token 刷新与失效",
					"单点登录 SSO",
				],
			},
			{
				id: "orm",
				name: "ORM 与数据建模",
				level: 1,
				track: "服务端",
				note: "用代码而不是拼字符串操作数据库。",
				tips: [
					"Prisma / TypeORM / Drizzle",
					"表关系设计",
					"迁移 migration",
					"N+1 查询问题",
				],
			},
			{
				id: "deploy",
				name: "云部署",
				level: 2,
				track: "服务端",
				note: "把项目真正放到网上。",
				tips: [
					"云服务器与域名解析",
					"Node 进程管理 pm2",
					"对象存储与 CDN",
					"自动化部署脚本",
				],
			},
			{
				id: "unit-test",
				name: "单元测试",
				level: 2,
				track: "质量",
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
				level: 1,
				track: "质量",
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
				level: 1,
				track: "质量",
				note: "先写测试，再写实现。",
				tips: ["红绿重构循环", "测试驱动设计", "适度 TDD", "给遗留代码补测试"],
			},
			{
				id: "webpack",
				name: "Webpack",
				level: 1,
				track: "工程",
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
				level: 2,
				track: "工程",
				note: "提交后自动构建、测试、上线。",
				tips: [
					"GitHub Actions / GitLab CI",
					"流水线编排",
					"环境变量与密钥管理",
					"自动部署与回滚",
				],
			},
		],
	},
	{
		tier: 7,
		stage: "架构与深度",
		purpose: "从写页面的人，变成能定方案的人",
		nodes: [
			{
				id: "design-patterns",
				name: "设计模式",
				level: 2,
				track: "架构",
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
				level: 3,
				track: "架构",
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
				level: 3,
				track: "架构",
				note: "数据怎么流，决定了项目好不好维护。",
				tips: [
					"单向数据流",
					"本地态与全局态的边界",
					"服务端状态的缓存与失效",
					"状态同步与竞态处理",
				],
			},
			{
				id: "astro",
				name: "Astro",
				level: 2,
				track: "框架",
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
				level: 2,
				track: "框架",
				note: "首屏速度和 SEO 的解法。",
				tips: [
					"三种渲染模式对比",
					"水合 hydration 原理",
					"数据预取",
					"静态生成与增量更新",
				],
			},
			{
				id: "micro-fe",
				name: "微前端",
				level: 1,
				track: "架构",
				note: "多个团队共用一个大页面。",
				tips: [
					"qiankun / Module Federation",
					"沙箱与样式隔离",
					"应用间通信",
					"什么时候不该用",
				],
			},
			{
				id: "docker",
				name: "Docker",
				level: 1,
				track: "服务端",
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
				level: 0,
				track: "服务端",
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
				level: 0,
				track: "服务端",
				note: "上线之后才是真正的开始。",
				tips: [
					"日志采集",
					"错误上报 Sentry",
					"接口耗时与告警",
					"线上问题定位思路",
				],
			},
			{
				id: "npm-publish",
				name: "发包与版本管理",
				level: 1,
				track: "工程",
				note: "把自己的代码发布出去给别人用。",
				tips: [
					"语义化版本 semver",
					"changeset 管理多包版本",
					"私有 registry",
					"产物体积与格式 ESM/CJS",
				],
			},
			{
				id: "css-animation",
				name: "CSS 动画与过渡",
				level: 4,
				track: "视觉",
				note: "性能最好的动效方案，优先用它。",
				tips: [
					"transition 与 transform",
					"keyframes 关键帧",
					"动画性能与合成层",
					"prefers-reduced-motion 适配",
				],
			},
			{
				id: "svg",
				name: "SVG 绘图",
				level: 3,
				track: "视觉",
				note: "矢量、可交互、体积还小。",
				tips: [
					"路径与基本图形",
					"viewBox 与自适应缩放",
					"SVG 动画与滤镜",
					"图标系统与 sprite",
				],
			},
			{
				id: "design",
				name: "视觉与交互设计感",
				level: 3,
				track: "视觉",
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
				level: 2,
				track: "视觉",
				note: "Motion / GSAP 这类，处理复杂动画编排。",
				tips: [
					"声明式动画 API",
					"手势与拖拽",
					"时间轴编排",
					"与框架的集成方式",
				],
			},
		],
	},
	{
		tier: 8,
		stage: "大师之境",
		purpose: "造轮子、影响别人，把技术变成自己的东西",
		nodes: [
			{
				id: "canvas",
				name: "Canvas 2D",
				level: 2,
				track: "视觉",
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
				level: 0,
				track: "视觉",
				note: "把 3D 世界搬进浏览器。",
				tips: [
					"场景 / 相机 / 渲染器",
					"材质与光照",
					"加载 GLTF 模型",
					"性能优化与优雅降级",
				],
			},
			{
				id: "cross-end",
				name: "跨端开发",
				level: 1,
				track: "架构",
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
				level: 1,
				track: "架构",
				note: "把每一毫秒都抢回来。",
				tips: [
					"长任务拆分",
					"虚拟列表与时间切片",
					"Worker 多线程",
					"极致首屏方案",
				],
			},
			{
				id: "ai-assist",
				name: "AI 辅助编程",
				level: 4,
				track: "成长",
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
				level: 3,
				track: "成长",
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
				level: 2,
				track: "成长",
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
				level: 1,
				track: "成长",
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
				level: 1,
				track: "成长",
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
				level: 1,
				track: "成长",
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
];

/** 全部节点，按层级顺序展开 */
export const ALL_NODES: SkillNode[] = TIERS.flatMap((t) => t.nodes);

export const TOTAL_NODES = ALL_NODES.length;

/** 层级总数 */
export const TIER_COUNT = TIERS.length;

/** 最高等级 */
export const MAX_LEVEL = LEVELS.length - 1;

/** id → 节点 的索引，方便详情面板查询 */
export const NODE_MAP: Record<string, SkillNode> = Object.fromEntries(
	ALL_NODES.map((n) => [n.id, n]),
);

/** id → 所在层级 的索引 */
export const TIER_OF_NODE: Record<string, number> = Object.fromEntries(
	TIERS.flatMap((t) => t.nodes.map((n) => [n.id, t.tier])),
);

/** 某一层在整棵树里的占比（= 该层节点数 / 总节点数），同层技术占比相同 */
export function tierRatio(tier: SkillTier): number {
	return TOTAL_NODES === 0 ? 0 : tier.nodes.length / TOTAL_NODES;
}
