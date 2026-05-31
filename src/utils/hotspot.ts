/** 热点题 pipe 解析与 options JSON（与 web-app hotspot.ts 对齐） */

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

export type HotspotInteraction = "dropdown" | "yesno";

export interface HotspotOptions {
  interaction: HotspotInteraction;
  items?: string[];
  rows: { id: string; prompt: string; label?: string }[];
  reusable?: boolean;
}

export function parseHotspotOptions(raw: string | null | undefined): HotspotOptions | null {
  if (!raw || raw === "[]") return null;
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    const interaction: HotspotInteraction = obj.interaction === "yesno" ? "yesno" : "dropdown";
    const rows = Array.isArray(obj.rows)
      ? obj.rows.map((r: { id?: string; prompt?: string; label?: string }, i: number) => ({
          id: String(r?.id ?? i + 1),
          prompt: String(r?.prompt ?? "").trim(),
          label: r?.label ? String(r.label).trim() : undefined,
        }))
      : [];
    if (rows.length === 0) return null;
    if (interaction === "dropdown") {
      const items = Array.isArray(obj.items)
        ? obj.items.map((x: unknown) => String(x ?? "").trim()).filter(Boolean)
        : [];
      if (items.length === 0) return null;
      return { interaction, items, rows, reusable: obj.reusable === true };
    }
    return { interaction, rows };
  } catch {
    return null;
  }
}

export function hotspotOptionsToFields(raw: string | null | undefined): {
  interaction: HotspotInteraction;
  items: string;
  prompts: string;
} {
  const opts = parseHotspotOptions(raw);
  if (!opts) return { interaction: "dropdown", items: "", prompts: "" };
  return {
    interaction: opts.interaction,
    items: opts.items ? joinPipe(opts.items) : "",
    prompts: joinPipe(opts.rows.map((r) => r.prompt)),
  };
}

export function buildHotspotOptionsJson(
  interaction: HotspotInteraction,
  itemsRaw: string,
  promptsRaw: string,
  reusable: boolean
): { optionsJson: string; error?: string } {
  const prompts = splitPipe(promptsRaw);
  if (prompts.length === 0) return { optionsJson: "", error: "行描述不能为空" };
  const rows = prompts.map((prompt, i) => {
    return {
      id: String(i + 1),
      prompt,
    };
  });
  if (interaction === "yesno") {
    return { optionsJson: JSON.stringify({ interaction: "yesno", rows }) };
  }
  const items = splitPipe(itemsRaw);
  if (items.length === 0) return { optionsJson: "", error: "选项池不能为空" };
  return {
    optionsJson: JSON.stringify({ interaction: "dropdown", items, rows, reusable }),
  };
}

export function normalizeYesNoToken(token: string): "Y" | "N" | null {
  const t = token.trim();
  if (!t) return null;
  const upper = t.toUpperCase();
  if (upper === "Y" || upper === "YES" || t === "是" || upper === "A") return "Y";
  if (upper === "N" || upper === "NO" || t === "否" || upper === "B") return "N";
  return null;
}

export function validateHotspotAnswer(
  interaction: HotspotInteraction,
  itemsRaw: string,
  promptsRaw: string,
  answerRaw: string,
  reusable = false
): string | null {
  const prompts = splitPipe(promptsRaw);
  const answers = splitPipe(answerRaw);
  if (prompts.length === 0) return "行描述不能为空";
  if (answers.length === 0) return "答案不能为空";
  if (prompts.length !== answers.length) {
    return `行描述数量(${prompts.length})与答案数量(${answers.length})不一致`;
  }
  if (interaction === "yesno") {
    for (const ans of answers) {
      if (!normalizeYesNoToken(ans)) return `无法识别的判断答案: ${ans}`;
    }
    return null;
  }
  const items = splitPipe(itemsRaw);
  if (items.length === 0) return "选项池不能为空";
  const lowerItems = items.map((s) => s.toLowerCase());
  if (reusable) {
    for (const ans of answers) {
      if (!lowerItems.includes(ans.toLowerCase())) {
        return `答案「${ans}」不在选项池中`;
      }
    }
    return null;
  }
  const seen = new Set<string>();
  for (const ans of answers) {
    if (!lowerItems.includes(ans.toLowerCase())) {
      return `答案「${ans}」不在选项池中`;
    }
    const key = ans.toLowerCase();
    if (seen.has(key)) return "排序题答案不能重复";
    seen.add(key);
  }
  return null;
}

export function normalizeYesNoAnswerPipe(answerRaw: string): string {
  return splitPipe(answerRaw)
    .map((p) => normalizeYesNoToken(p))
    .filter((x): x is "Y" | "N" => x !== null)
    .join("|");
}

export function hotspotSummary(raw: string | null | undefined): string {
  const opts = parseHotspotOptions(raw);
  if (!opts) return "";
  const mode = opts.interaction === "yesno" ? "判断" : "下拉";
  return `${mode} / 行×${opts.rows.length}`;
}

export function resolveHotspotOptionsRaw(
  optionsZh?: string | null,
  optionsEn?: string | null
): string {
  for (const raw of [optionsZh, optionsEn]) {
    if (raw && raw !== "[]" && parseHotspotOptions(raw)) return raw;
  }
  return optionsZh || optionsEn || "";
}

export function applyHotspotOptionsToForm(
  optionsJson: string,
  languages: string[]
): { optionsZh: string; optionsEn: string } {
  const hasZh = languages.includes("zh");
  const hasEn = languages.includes("en");
  if (hasZh && hasEn) return { optionsZh: optionsJson, optionsEn: optionsJson };
  if (hasEn) return { optionsZh: "[]", optionsEn: optionsJson };
  return { optionsZh: optionsJson, optionsEn: "" };
}

export function resolveHotspotExplanation(data: {
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

export function applyHotspotExplanation(
  value: string,
  target: "zh" | "en",
  _current: { explanationZh?: string | null; explanationEn?: string | null }
): { explanationZh?: string; explanationEn?: string } {
  if (target === "en") return { explanationEn: value };
  return { explanationZh: value };
}
