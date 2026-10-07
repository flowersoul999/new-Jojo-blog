// 通用 frontmatter 解析 / 序列化（纯函数，无浏览器依赖，服务端 / 客户端均可 import）
// 支持本项目实际出现的 YAML 子集：
//   - 引号字符串 / 裸标量 / 裸数字 / 裸布尔
//   - flow 数组：["a", "b"] / [15, 167]
//   - block 标量数组：- TypeScript
//   - block 对象数组：metrics / links（每项多 key，缩进续行）
// 解析只做「语法 → 原始值」，类型语义（string/number/boolean/date...）交给调用方的字段配置。

export type FieldValue =
	| string
	| number
	| boolean
	| string[]
	| number[]
	| Record<string, string>[];

export interface ParsedFrontmatter {
	data: Record<string, FieldValue>;
	body: string;
}

/** 去引号并处理基础转义（\" → "，\\ → \） */
function unquote(token: string): string {
	const t = token.trim();
	if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
		return t.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
	}
	if (t.length >= 2 && t.startsWith("'") && t.endsWith("'")) {
		return t.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
	}
	return t;
}

/** 把单个 token 解析为标量原始值（字符串 / 数字 / 布尔） */
function parseScalar(token: string): string | number | boolean {
	const t = token.trim();
	if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) {
		return unquote(t);
	}
	if (t === "true") return true;
	if (t === "false") return false;
	if (/^-?\d+$/.test(t)) return Number(t);
	if (/^-?\d*\.\d+$/.test(t)) return Number(t);
	return t;
}

/** 解析 flow 数组 [a, b] / [15, 167] / [] */
function parseFlowArray(raw: string): Array<string | number> {
	const inner = raw.trim().slice(1, -1).trim();
	if (!inner) return [];
	return inner
		.split(",")
		.map((part) => parseScalar(part) as string | number);
}

/** 解析 block 列表（标量数组或对象数组），返回 { value, next } */
function parseBlock(
	lines: string[],
	start: number,
): { value: Array<string | Record<string, string>>; next: number } {
	const items: Array<string | Record<string, string>> = [];
	let i = start;
	while (i < lines.length) {
		const line = lines[i];
		const dash = /^\s*-\s+(.*)$/.exec(line);
		if (!dash) break; // 块结束
		const after = dash[1];
		if (after.includes(":")) {
			// 对象项：先解析 dash 行内的 key:val，再读后续缩进续行
			const obj: Record<string, string> = {};
			const colon = after.indexOf(":");
			obj[after.slice(0, colon).trim()] = unquote(after.slice(colon + 1));
			i += 1;
			while (i < lines.length) {
				const cont = lines[i];
				if (/^\s*-\s/.test(cont)) break; // 下一个对象项
				const ckv = /^(\s+)([A-Za-z_][\w-]*):\s*(.*)$/.exec(cont);
				if (ckv && cont.startsWith("  ")) {
					obj[ckv[2]] = unquote(ckv[3]);
					i += 1;
				} else {
					break;
				}
			}
			items.push(obj);
		} else {
			items.push(unquote(after));
			i += 1;
		}
	}
	return { value: items, next: i };
}

/** 解析整个 frontmatter 块（不含 --- 包裹行） */
function parseBlockBody(fm: string): Record<string, FieldValue> {
	const lines = fm.split(/\r?\n/);
	const data: Record<string, FieldValue> = {};
	let i = 0;
	while (i < lines.length) {
		const line = lines[i];
		if (line.trim() === "") {
			i += 1;
			continue;
		}
		const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
		if (!kv) {
			i += 1;
			continue;
		}
		const key = kv[1];
		const rest = kv[2].replace(/\s+$/, "");
		if (rest === "") {
			const block = parseBlock(lines, i + 1);
			data[key] = block.value as FieldValue;
			i = block.next;
			continue;
		}
		if (rest.startsWith("[")) {
			data[key] = parseFlowArray(rest) as FieldValue;
			i += 1;
			continue;
		}
		data[key] = parseScalar(rest) as FieldValue;
		i += 1;
	}
	return data;
}

/** 解析完整 markdown：拆出 frontmatter 与正文 */
export function parseFrontmatter(raw: string): ParsedFrontmatter {
	const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
	if (!fmMatch) {
		return { data: {}, body: raw };
	}
	return { data: parseBlockBody(fmMatch[1]), body: fmMatch[2] };
}

/** 字符串是否需要加引号（YAML 安全） */
function needsQuote(v: string): boolean {
	return (
		v === "" ||
		/[:#\[\]{}",]/.test(v) ||
		/^\s|\s$/.test(v) ||
		/^(true|false|null|~)$/i.test(v)
	);
}

function quoteStr(v: string): string {
	return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export type FieldType =
	| "text"
	| "textarea"
	| "date"
	| "number"
	| "boolean"
	| "tags"
	| "select"
	| "objectList";

export interface SubField {
	key: string;
	label: string;
	type: "text" | "number";
}

/** 序列化单个字段值（根据类型） */
function serializeValue(
	key: string,
	value: FieldValue | undefined,
	type: FieldType,
	subFields?: SubField[],
): string {
	if (value === undefined || value === null) {
		return type === "objectList" ? `${key}: []` : `${key}: ""`;
	}
	switch (type) {
		case "number":
			return `${key}: ${typeof value === "number" ? value : Number(value) || 0}`;
		case "boolean":
			return `${key}: ${value === true || value === "true" ? "true" : "false"}`;
		case "tags": {
			const arr = Array.isArray(value) ? (value as string[]) : [];
			if (arr.length === 0) return `${key}: []`;
			return `${key}: [${arr.map((s) => quoteStr(String(s))).join(", ")}]`;
		}
		case "objectList": {
			const arr = Array.isArray(value) ? (value as Record<string, string>[]) : [];
			if (arr.length === 0) return `${key}: []`;
			const lines: string[] = [`${key}:`];
			for (const item of arr) {
			const entries: string[] = subFields
				? subFields.map((sf) => sf.key)
				: Object.keys(item);
			entries.forEach((sk, idx) => {
					const sv = item[sk] ?? "";
					const indent = idx === 0 ? "  - " : "    ";
					lines.push(`${indent}${sk}: ${quoteStr(sv)}`);
				});
			}
			return lines.join("\n");
		}
		default: {
			// text / textarea / date / select
			const s = String(value);
			return needsQuote(s) ? `${key}: ${quoteStr(s)}` : `${key}: ${s}`;
		}
	}
}

/** 序列化 frontmatter + 正文为完整 markdown */
export function buildMarkdown(
	fields: { key: string; type: FieldType; subFields?: SubField[] }[],
	values: Record<string, FieldValue>,
	body: string,
): string {
	// 已知字段按配置顺序输出
	const known = new Set(fields.map((f) => f.key));
	const lines: string[] = ["---"];
	for (const f of fields) {
		lines.push(serializeValue(f.key, values[f.key], f.type, f.subFields));
	}
	// 兼容：data 里存在但配置没声明的字段，原样以字符串补在末尾，避免丢失
	for (const k of Object.keys(values)) {
		if (known.has(k)) continue;
		const v = values[k];
		const s = typeof v === "string" ? v : JSON.stringify(v);
		lines.push(needsQuote(s) ? `${k}: ${quoteStr(s)}` : `${k}: ${s}`);
	}
	lines.push("---", "");
	const b = body.replace(/\s+$/, "");
	return `${lines.join("\n")}\n${b}\n`;
}
