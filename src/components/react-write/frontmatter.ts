// Aemeath 文章 frontmatter 解析与生成（对应 src/content.config.ts 的 posts schema）
// 基础字段：title / published / description / tags / category / draft / image
// 高级字段：updated / lang / pinned / pinnedOrder / author / sourceLink / licenseName /
//           licenseUrl / comment / password / passwordHint / aiSummary / aiPolished

export interface PostMeta {
	// 基础
	title: string;
	published: string; // YYYY-MM-DD
	description: string;
	tags: string[];
	category: string;
	draft: boolean;
	image: string;
	// 高级
	updated: string; // YYYY-MM-DD，空串 = 未设置
	lang: string; // 默认 "zh-CN"
	pinned: boolean;
	pinnedOrder: number | ""; // 空串 = 未设置（表单友好），build 时转 number
	author: string;
	sourceLink: string;
	licenseName: string;
	licenseUrl: string;
	comment: boolean; // schema 默认 true
	password: string;
	passwordHint: string;
	aiSummary: string;
	aiPolished: boolean; // schema 默认 true
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

/** 默认元信息（新增高级字段的默认值在此定义，保证 parse 无 frontmatter 时字段齐全） */
export function defaultPostMeta(): PostMeta {
	return {
		title: "",
		published: "",
		description: "",
		tags: [],
		category: "",
		draft: false,
		image: "",
		updated: "",
		lang: "zh-CN",
		pinned: false,
		pinnedOrder: "",
		author: "",
		sourceLink: "",
		licenseName: "",
		licenseUrl: "",
		comment: true,
		password: "",
		passwordHint: "",
		aiSummary: "",
		aiPolished: true,
	};
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
			meta: defaultPostMeta(),
			body: raw,
		};
	}

	const fmBlock = fmMatch[1];
	const body = fmMatch[2];
	const meta = defaultPostMeta();

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
			case "updated":
				meta.updated = yamlUnquote(value).slice(0, 10);
				break;
			case "lang":
				meta.lang = yamlUnquote(value);
				break;
			case "pinned":
				meta.pinned = value.trim() === "true";
				break;
			case "pinnedOrder":
				meta.pinnedOrder = Number.parseInt(yamlUnquote(value), 10) || "";
				break;
			case "author":
				meta.author = yamlUnquote(value);
				break;
			case "sourceLink":
				meta.sourceLink = yamlUnquote(value);
				break;
			case "licenseName":
				meta.licenseName = yamlUnquote(value);
				break;
			case "licenseUrl":
				meta.licenseUrl = yamlUnquote(value);
				break;
			case "comment":
				meta.comment = value.trim() !== "false";
				break;
			case "password":
				meta.password = yamlUnquote(value);
				break;
			case "passwordHint":
				meta.passwordHint = yamlUnquote(value);
				break;
			case "aiSummary":
				meta.aiSummary = yamlUnquote(value);
				break;
			case "aiPolished":
				meta.aiPolished = value.trim() !== "false";
				break;
		}
	}

	return { meta, body };
}

/** 生成完整文章 Markdown（frontmatter + 正文）
 * 幂等规则：恒输出基础字段 + lang；
 * 高级字段仅在非空 / 非默认值时输出，保证 parse→build 往返稳定、不污染既有文件。
 */
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
		`lang: ${yamlQuote(meta.lang || "zh-CN")}`,
	];
	if (meta.updated)
		lines.push(`updated: ${yamlQuote(meta.updated.slice(0, 10))}`);
	if (meta.pinned) lines.push("pinned: true");
	if (meta.pinned && meta.pinnedOrder !== "" && meta.pinnedOrder != null) {
		lines.push(`pinnedOrder: ${Number(meta.pinnedOrder)}`);
	}
	if (meta.author) lines.push(`author: ${yamlQuote(meta.author)}`);
	if (meta.sourceLink) lines.push(`sourceLink: ${yamlQuote(meta.sourceLink)}`);
	if (meta.licenseName)
		lines.push(`licenseName: ${yamlQuote(meta.licenseName)}`);
	if (meta.licenseUrl) lines.push(`licenseUrl: ${yamlQuote(meta.licenseUrl)}`);
	if (meta.comment === false) lines.push("comment: false");
	if (meta.password) lines.push(`password: ${yamlQuote(meta.password)}`);
	if (meta.passwordHint)
		lines.push(`passwordHint: ${yamlQuote(meta.passwordHint)}`);
	if (meta.aiSummary) lines.push(`aiSummary: ${yamlQuote(meta.aiSummary)}`);
	if (meta.aiPolished === false) lines.push("aiPolished: false");
	lines.push("---", "", body.trim(), "");
	return lines.join("\n");
}
