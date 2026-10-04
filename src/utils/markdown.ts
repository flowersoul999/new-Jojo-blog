/**
 * 在 .astro 组件里把 Markdown 字符串渲染成 HTML。
 * ---------------------------------------------------------------------------
 * 为什么需要它：站内「编辑此页」把实习经历的阶段正文收进了
 * src/data/internship.data.json（这样才能直接改文字、增删条目），
 * 而 content 集合的 render() 只能处理 .md 文件。
 *
 * 走的是 Astro 自己的 Markdown 处理器（@astrojs/markdown-remark），
 * 所以标题锚点、代码高亮等行为与文章正文一致，且不需要往 package.json
 * 里加 unified 系列的依赖。
 */
import { createMarkdownProcessor } from "@astrojs/markdown-remark";

/** 处理器是 thenable，首次渲染时懒初始化并缓存 */
let processorPromise: ReturnType<typeof createMarkdownProcessor> | null = null;

function getProcessor() {
	if (!processorPromise) {
		// 传空配置：走 Astro 默认的 Markdown 行为，不引入站点自定义插件
		// （那些插件里有 mermaid / plantuml 等，不适合拿到短文本上跑）
		processorPromise = createMarkdownProcessor({});
	}
	return processorPromise;
}

/**
 * 把 Markdown 渲染为 HTML 字符串。
 * 渲染失败时返回转义后的纯文本，保证页面不会因为内容问题整块崩掉。
 */
export async function renderMarkdown(md: string): Promise<string> {
	const source = (md ?? "").trim();
	if (!source) return "";

	try {
		const processor = await getProcessor();
		// processor.render() 返回 { code, metadata }，HTML 在 code 上
		const rendered = (await processor.render(source)) as {
			code?: string;
		};
		return rendered?.code ?? "";
	} catch {
		return escapeHtml(source)
			.split(/\n{2,}/)
			.map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
			.join("");
	}
}

/** 最小 HTML 转义，兜底路径用 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
