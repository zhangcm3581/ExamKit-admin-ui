/** 拖放题 pipe 解析与 options JSON 构建（与 web-app dragMatch.ts 对齐） */

export function splitPipe(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  const parts: string[] = [];
  let current = "";
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === "\\" && i + 1 < raw.length && raw[i + 1] === "|") {
      current += "|";
      i++;
    } else if (c === "|") {
      parts.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  parts.push(current.trim());
  return parts.filter((p) => p.length > 0);
}

export function joinPipe(parts: string[]): string {
  return parts.join("|");
}

export interface DragMatchOptions {
  items: string[];
  slots: { id: string; purpose: string }[];
  reusable?: boolean;
}

export function parseDragMatchOptions(raw: string | null | undefined): DragMatchOptions | null {
  if (!raw || raw === "[]") return null;
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    const items = Array.isArray(obj.items)
      ? obj.items.map((x: unknown) => String(x ?? "").trim()).filter(Boolean)
      : [];
    const slots = Array.isArray(obj.slots)
      ? obj.slots.map((s: { id?: string; purpose?: string }, i: number) => ({
          id: String(s?.id ?? i + 1),
          purpose: String(s?.purpose ?? "").trim(),
        }))
      : [];
    if (items.length === 0 || slots.length === 0) return null;
    return { items, slots, reusable: obj.reusable !== false };
  } catch {
    return null;
  }
}

export function dragMatchOptionsToFields(raw: string | null | undefined): {
  tools: string;
  purposes: string;
} {
  const opts = parseDragMatchOptions(raw);
  if (!opts) return { tools: "", purposes: "" };
  return {
    tools: joinPipe(opts.items),
    purposes: joinPipe(opts.slots.map((s) => s.purpose)),
  };
}

export function buildDragMatchOptionsJson(
  toolsRaw: string,
  purposesRaw: string
): { optionsJson: string; error?: string } {
  const items = splitPipe(toolsRaw);
  const purposes = splitPipe(purposesRaw);
  if (items.length === 0) return { optionsJson: "", error: "Tool池不能为空" };
  if (purposes.length === 0) return { optionsJson: "", error: "Purpose不能为空" };
  const slots = purposes.map((purpose, i) => ({ id: String(i + 1), purpose }));
  return {
    optionsJson: JSON.stringify({ items, slots, reusable: true }),
  };
}

export function validateDragMatchAnswer(
  toolsRaw: string,
  purposesRaw: string,
  answerRaw: string
): string | null {
  const items = splitPipe(toolsRaw);
  const purposes = splitPipe(purposesRaw);
  const answers = splitPipe(answerRaw);
  if (items.length === 0) return "Tool池不能为空";
  if (purposes.length === 0) return "Purpose不能为空";
  if (answers.length === 0) return "槽位答案不能为空";
  if (purposes.length !== answers.length) {
    return `Purpose数量(${purposes.length})与槽位答案数量(${answers.length})不一致`;
  }
  const lowerItems = items.map((s) => s.toLowerCase());
  for (const ans of answers) {
    if (!lowerItems.includes(ans.toLowerCase())) {
      return `槽位答案「${ans}」不在 Tool 池中`;
    }
  }
  return null;
}

export function dragMatchSummary(raw: string | null | undefined): string {
  const opts = parseDragMatchOptions(raw);
  if (!opts) return "";
  return `Tool×${opts.items.length} / Slot×${opts.slots.length}`;
}

/** 从 optionsZh / optionsEn 中取有效的拖放题 options JSON（英文导入存在 optionsEn） */
export function resolveDragMatchOptionsRaw(
  optionsZh?: string | null,
  optionsEn?: string | null
): string {
  for (const raw of [optionsZh, optionsEn]) {
    if (raw && raw !== "[]" && parseDragMatchOptions(raw)) {
      return raw;
    }
  }
  return optionsZh || optionsEn || "";
}

/** 按科目支持语言写入拖放题 options */
export function applyDragMatchOptionsToForm(
  optionsJson: string,
  languages: string[]
): { optionsZh: string; optionsEn: string } {
  const hasZh = languages.includes("zh");
  const hasEn = languages.includes("en");
  if (hasZh && hasEn) {
    return { optionsZh: optionsJson, optionsEn: optionsJson };
  }
  if (hasEn) {
    return { optionsZh: "[]", optionsEn: optionsJson };
  }
  return { optionsZh: optionsJson, optionsEn: "" };
}

/** 加载拖放题解析：英文导入在 explanationEn */
export function resolveDragMatchExplanation(data: {
  explanationZh?: string | null;
  explanationEn?: string | null;
  contentZh?: string | null;
  contentEn?: string | null;
}): { value: string; target: "zh" | "en" } {
  const en = (data.explanationEn || "").trim();
  const zh = (data.explanationZh || "").trim();
  if (en) return { value: data.explanationEn || "", target: "en" };
  if (zh) return { value: data.explanationZh || "", target: "zh" };
  const enContent = (data.contentEn || "").trim();
  const zhContent = (data.contentZh || "").trim();
  if (enContent && !zhContent) return { value: "", target: "en" };
  return { value: "", target: "zh" };
}

/** 保存拖放题解析到对应语言字段（不覆盖另一语言已有内容） */
export function applyDragMatchExplanation(
  value: string,
  target: "zh" | "en",
  current: { explanationZh?: string | null; explanationEn?: string | null }
): { explanationZh?: string; explanationEn?: string } {
  if (target === "en") {
    return { explanationEn: value };
  }
  return { explanationZh: value };
}
