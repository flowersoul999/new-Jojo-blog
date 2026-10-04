/**
 * 极简 Markdown 块编辑器
 * ---------------------------------------------------------------------------
 * 用户明确要求「直接改文字、不出现代码」，所以正文不能是一个装 Markdown
 * 源码的 textarea。这个模块把 Markdown 正文拆成「块」，让前端渲染成
 * 接近成品的样式（标题、粗体、列表、代码、引用），编辑时所见即所得。
 *
 * 只覆盖站内正文实际会用到的语法，不做完整 CommonMark：
 *   段落 / # 标题 / - 列表 / 1. 有序列表 / > 引用 / ``` 代码块 / **粗体** / `行内码`
 * 序列化时再拼回 Markdown 字符串，存进 JSON 的 body 字段。
 */

export type InlineNode =
	| { kind: "text"; text: string }
	| { kind: "bold"; text: string }
	| { kind: "code"; text: string };

export type Block =
	| { kind: "paragraph"; id: string; html: string }
	| { kind: "heading"; id: string; level: number; inline: InlineNode[] }
	| { kind: "bullets"; id: string; items: string[] }
	| { kind: "numbers"; id: string; items: string[] }
	| { kind: "quote"; id: string; inline: InlineNode[] }
	| { kind: "code"; id: string; code: string };

/** 行内语法：`code` 与 **bold**，顺序为先找反引号避免把代码里的星号当粗体 */
export function parseInline(text: string): InlineNode[] {
	const nodes: InlineNode[] = [];
	const re = /`([^`]+)`|\*\*([^*]+)\*\*/g;
	let last = 0;
	let m = re.exec(text);
	while (m !== null) {
		if (m.index > last) {
			nodes.push({ kind: "text", text: text.slice(last, m.index) });
		}
		if (m[1] !== undefined) {
			nodes.push({ kind: "code", text: m[1] });
		} else if (m[2] !== undefined) {
			nodes.push({ kind: "bold", text: m[2] });
		}
		last = m.index + m[0].length;
		m = re.exec(text);
	}
	if (last < text.length) nodes.push({ kind: "text", text: text.slice(last) });
	return nodes.length > 0 ? nodes : [{ kind: "text", text }];
}

/** 行内节点还原成纯文本（编辑器里显示用） */
export function inlineToText(nodes: InlineNode[]): string {
	return nodes
		.map((n) =>
			n.kind === "bold"
				? `**${n.text}**`
				: n.kind === "code"
					? `\`${n.text}\``
					: n.text,
		)
		.join("");
}

/** 去掉行内标记，得到纯文字（内容摘要、列表预览用） */
export function inlineToPlain(nodes: InlineNode[]): string {
	return nodes.map((n) => n.text).join("");
}

let seq = 0;
function nextId(): string {
	seq += 1;
	return `b${seq}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Markdown → 块数组 */
export function parseMarkdown(md: string): Block[] {
	const lines = (md ?? "").replace(/\r\n/g, "\n").split("\n");
	const blocks: Block[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		// 空行：跳过
		if (!line.trim()) {
			i += 1;
			continue;
		}

		// 代码块 ``` … ```
		if (/^```/.test(line.trim())) {
			const body: string[] = [];
			i += 1;
			while (i < lines.length && !/^```/.test(lines[i].trim())) {
				body.push(lines[i]);
				i += 1;
			}
			i += 1; // 跳过收尾的 ```
			blocks.push({ kind: "code", id: nextId(), code: body.join("\n") });
			continue;
		}

		// 标题 # ## ###
		const heading = /^(#{1,4})\s+(.*)$/.exec(line.trim());
		if (heading) {
			blocks.push({
				kind: "heading",
				id: nextId(),
				level: heading[1].length,
				inline: parseInline(heading[2].trim()),
			});
			i += 1;
			continue;
		}

		// 引用 >
		if (/^>\s?/.test(line.trim())) {
			const text = lines
				.slice(i)
				.filter((l) => /^>\s?/.test(l.trim()) || l.trim())
				.map((l) => l.replace(/^>\s?/, ""))
				.join(" ");
			blocks.push({
				kind: "quote",
				id: nextId(),
				inline: parseInline(text.trim()),
			});
			// 连续引用行消费掉
			while (
				i < lines.length &&
				(/^>\s?/.test(lines[i].trim()) || lines[i].trim())
			) {
				i += 1;
			}
			continue;
		}

		// 无序列表 - / *
		if (/^[-*]\s+/.test(line.trim())) {
			const items: string[] = [];
			while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
				items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
				i += 1;
			}
			blocks.push({ kind: "bullets", id: nextId(), items });
			continue;
		}

		// 有序列表 1.
		if (/^\d+[.)]\s+/.test(line.trim())) {
			const items: string[] = [];
			while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
				items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ""));
				i += 1;
			}
			blocks.push({ kind: "numbers", id: nextId(), items });
			continue;
		}

		// 普通段落：吃到空行或下一个块级标记为止
		const para: string[] = [];
		while (
			i < lines.length &&
			lines[i].trim() &&
			!/^(#{1,4}\s|[-*]\s+|\d+[.)]\s+|>|```)/.test(lines[i].trim())
		) {
			para.push(lines[i].trim());
			i += 1;
		}
		if (para.length > 0) {
			blocks.push({
				kind: "paragraph",
				id: nextId(),
				html: para.join(" "),
			});
		}
	}

	return blocks;
}

/** 块数组 → Markdown 字符串 */
export function serializeBlocks(blocks: Block[]): string {
	const parts: string[] = [];

	for (const block of blocks) {
		switch (block.kind) {
			case "heading":
				parts.push(`${"#".repeat(block.level)} ${inlineToText(block.inline)}`);
				break;
			case "bullets":
				parts.push(block.items.map((it) => `- ${it}`).join("\n"));
				break;
			case "numbers":
				parts.push(
					block.items.map((it, idx) => `${idx + 1}. ${it}`).join("\n"),
				);
				break;
			case "quote":
				parts.push(`> ${inlineToText(block.inline)}`);
				break;
			case "code":
				parts.push(["```", block.code, "```"].join("\n"));
				break;
			case "paragraph":
				parts.push(block.html);
				break;
		}
	}

	return parts.join("\n\n");
}

/** 新建一个空块（工具栏用） */
export function emptyBlock(kind: Block["kind"]): Block {
	switch (kind) {
		case "heading":
			return {
				kind: "heading",
				id: nextId(),
				level: 2,
				inline: [{ kind: "text", text: "小标题" }],
			};
		case "bullets":
			return { kind: "bullets", id: nextId(), items: ["新的要点"] };
		case "numbers":
			return { kind: "numbers", id: nextId(), items: ["新的条目"] };
		case "quote":
			return {
				kind: "quote",
				id: nextId(),
				inline: [{ kind: "text", text: "引用" }],
			};
		case "code":
			return { kind: "code", id: nextId(), code: "// 代码" };
		default:
			return { kind: "paragraph", id: nextId(), html: "新的一段" };
	}
}
