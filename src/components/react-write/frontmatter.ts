// Aemeath 文章 frontmatter 解析与生成（对应 src/content.config.ts 的 posts schema）
// 写作页只暴露常用字段：title / published / description / tags / category / draft / image

export interface PostMeta {
	title: string;
	published: string; // YYYY-MM-DD
	description: string;
	tags: string[];
	category: string;
	draft: boolean;
	image: string;
}

export interface ParsedPost {
	meta: PostMeta;
	body: string;
}

/** YAML 双引号字符串转义 */
function yamlQuote(value: string): string {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** 去掉 YAML 双引号包裹并还原转义 */
function yamlUnquote(value: string): string {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		const inner = trimmed.slice(1, -1);
		if (trimmed.startsWith('"')) {
			return inner.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
		}
		return inner.replace(/''/g, "'");
	}
	return trimmed;
}

/** 解析 flow 风格数组 ["a", "b"] / ['a'] */
function parseFlowArray(value: string): string[] {
	const inner = value.trim().replace(/^\[/, "").replace(/\]$/, "");
	if (!inner.trim()) return [];
	return inner
		.split(",")
		.map((item) => yamlUnquote(item.trim()))
		.filter(Boolean);
}

/** 解析整篇 Markdown（含 frontmatter）为 meta + body */
export function parsePostMarkdown(raw: string): ParsedPost {
	const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
	if (!fmMatch) {
		return {
			meta: {
				title: "",
				published: "",
				description: "",
				tags: [],
				category: "",
				draft: false,
				image: "",
			},
			body: raw,
		};
	}

	const fmBlock = fmMatch[1];
	const body = fmMatch[2];
	const meta: PostMeta = {
		title: "",
		published: "",
		description: "",
		tags: [],
		category: "",
		draft: false,
		image: "",
	};

	for (const line of fmBlock.split(/\r?\n/)) {
		const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
		if (!kv) continue;
		const key = kv[1];
		const value = kv[2];
		switch (key) {
			case "title":
				meta.title = yamlUnquote(value);
				break;
			case "published":
				meta.published = yamlUnquote(value).slice(0, 10);
				break;
			case "description":
				meta.description = yamlUnquote(value);
				break;
			case "tags":
				meta.tags = parseFlowArray(value);
				break;
			case "category":
				meta.category = yamlUnquote(value);
				break;
			case "draft":
				meta.draft = value.trim() === "true";
				break;
			case "image":
				meta.image = yamlUnquote(value);
				break;
		}
	}

	return { meta, body };
}

/** 生成完整文章 Markdown（frontmatter + 正文） */
export function buildPostMarkdown(meta: PostMeta, body: string): string {
	const published = meta.published || new Date().toISOString().slice(0, 10);
	const lines = [
		"---",
		`title: ${yamlQuote(meta.title)}`,
		`published: ${published}`,
		`description: ${yamlQuote(meta.description)}`,
		`tags: [${meta.tags.map((tag) => yamlQuote(tag)).join(", ")}]`,
		`category: ${yamlQuote(meta.category)}`,
		`draft: ${meta.draft}`,
		`image: ${yamlQuote(meta.image)}`,
		'lang: "zh-CN"',
		"---",
		"",
		body.trim(),
		"",
	];
	return lines.join("\n");
}
