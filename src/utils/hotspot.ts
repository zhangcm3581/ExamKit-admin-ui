/**
 * 热点题（HOTSPOT）— 管理后台：解析 / 编辑态序列化
 */

export type HotspotInteraction = "dropdown" | "yesno";
export type HotspotPoolMode = "shared" | "perRow";

export interface HotspotRow {
  id: string;
  prompt: string;
  label?: string;
  items?: string[];
}

export interface HotspotOptions {
  interaction: HotspotInteraction;
  items?: string[];
  rows: HotspotRow[];
  reusable?: boolean;
}

export interface HotspotEditorRow {
  prompt: string;
  label: string;
  /** 行级选项池文本（换行分隔，仅 perRow + dropdown） */
  itemsText: string;
  answer: string;
}

export interface HotspotEditorState {
  interaction: HotspotInteraction;
  poolMode: HotspotPoolMode;
  sharedItemsText: string;
  reusable: boolean;
  rows: HotspotEditorRow[];
}

export function splitLines(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

const POOL_SEPARATOR = ";;";

export function splitOptionPools(raw: string): string[][] {
  if (!raw || !raw.trim()) return [];
  if (!raw.includes(POOL_SEPARATOR)) {
    const single = splitLines(raw);
    return single.length > 0 ? [single] : [];
  }
  const pools: string[][] = [];
  let current = "";
  for (let i = 0; i < raw.length; i++) {
    if (i + 1 < raw.length && raw[i] === ";" && raw[i + 1] === ";") {
      pools.push(splitLines(current));
      current = "";
      i++;
    } else {
      current += raw[i];
    }
  }
  pools.push(splitLines(current));
  return pools;
}

export function joinLines(lines: string[]): string {
  return lines
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n");
}

export function joinOptionPoolsText(pools: string[][]): string {
  return pools.map((pool) => joinLines(pool)).join(POOL_SEPARATOR);
}

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

export function buildHotspotAnswer(values: string[]): string {
  return values.map((s) => s.trim()).join("|");
}

export function parseHotspotOptions(raw: string | null | undefined): HotspotOptions | null {
  if (!raw || raw === "[]") return null;
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    const interaction: HotspotInteraction = obj.interaction === "yesno" ? "yesno" : "dropdown";
    const rows = Array.isArray(obj.rows)
      ? obj.rows.map(
          (r: { id?: string; prompt?: string; label?: string; items?: unknown[] }, i: number) => {
            const rowItems = Array.isArray(r?.items)
              ? r.items.map((x: unknown) => String(x ?? "").trim()).filter(Boolean)
              : undefined;
            return {
              id: String(r?.id ?? i + 1),
              prompt: String(r?.prompt ?? "").trim(),
              label: r?.label ? String(r.label).trim() : undefined,
              items: rowItems?.length ? rowItems : undefined,
            };
          }
        )
      : [];
    if (rows.length === 0) return null;
    if (interaction === "dropdown") {
      const items = Array.isArray(obj.items)
        ? obj.items.map((x: unknown) => String(x ?? "").trim()).filter(Boolean)
        : [];
      const perRowItems = rows.every((r: HotspotRow) => (r.items?.length ?? 0) > 0);
      if (!perRowItems && items.length === 0) return null;
      return {
        interaction,
        items: items.length > 0 ? items : undefined,
        rows,
        reusable: perRowItems ? true : obj.reusable === true,
      };
    }
    return { interaction, rows };
  } catch {
    return null;
  }
}

export function hasPerRowHotspotPools(options: HotspotOptions): boolean {
  return options.rows.length > 0 && options.rows.every((r) => (r.items?.length ?? 0) > 0);
}

export function getHotspotRowItems(options: HotspotOptions, rowIndex: number): string[] {
  const row = options.rows[rowIndex];
  if (row?.items?.length) return row.items;
  return options.items ?? [];
}

export function createDefaultEditorState(): HotspotEditorState {
  return {
    interaction: "dropdown",
    poolMode: "shared",
    sharedItemsText: "",
    reusable: false,
    rows: [{ prompt: "", label: "", itemsText: "", answer: "" }],
  };
}

export function optionsToEditorState(
  optionsJson: string | undefined,
  answerPipe: string | undefined
): HotspotEditorState {
  const parsed = parseHotspotOptions(optionsJson);
  const answers = splitPipe(answerPipe || "");
  if (!parsed) {
    const state = createDefaultEditorState();
    return state;
  }

  const perRow = parsed.interaction === "dropdown" && hasPerRowHotspotPools(parsed);
  const rows: HotspotEditorRow[] = parsed.rows.map((r, i) => ({
    prompt: r.prompt,
    label: r.label || "",
    itemsText: perRow && r.items ? joinLines(r.items) : "",
    answer: answers[i] || "",
  }));

  return {
    interaction: parsed.interaction,
    poolMode: perRow ? "perRow" : "shared",
    sharedItemsText:
      parsed.interaction === "dropdown" && !perRow && parsed.items ? joinLines(parsed.items) : "",
    reusable: parsed.reusable === true,
    rows: rows.length > 0 ? rows : [{ prompt: "", label: "", itemsText: "", answer: "" }],
  };
}

export function editorStateToOptionsJson(state: HotspotEditorState): string {
  const rows = state.rows.map((r, i) => {
    const row: Record<string, unknown> = {
      id: String(i + 1),
      prompt: r.prompt.trim(),
    };
    if (r.label.trim()) row.label = r.label.trim();
    if (state.interaction === "dropdown" && state.poolMode === "perRow") {
      row.items = splitLines(r.itemsText);
    }
    return row;
  });

  const options: Record<string, unknown> = {
    interaction: state.interaction,
    rows,
  };

  if (state.interaction === "dropdown") {
    if (state.poolMode === "perRow") {
      options.reusable = true;
    } else {
      options.items = splitLines(state.sharedItemsText);
      options.reusable = state.reusable;
    }
  }

  return JSON.stringify(options);
}

/** 校验编辑态；通过返回 null，否则返回错误文案 */
export function validateHotspotEditorState(state: HotspotEditorState): string | null {
  if (!state.rows.length) return "至少配置一行";
  const prompts = state.rows.map((r) => r.prompt.trim());
  if (prompts.some((p) => !p)) return "行描述不能为空";
  if (state.interaction === "yesno") {
    for (const r of state.rows) {
      const t = r.answer.trim().toUpperCase();
      if (t !== "Y" && t !== "N" && r.answer !== "是" && r.answer !== "否") {
        return "判断题每行答案须为 Y/N（或 是/否）";
      }
    }
    return null;
  }
  if (state.poolMode === "shared") {
    const items = splitLines(state.sharedItemsText);
    if (!items.length) return "选项池不能为空";
    for (const r of state.rows) {
      if (!r.answer.trim()) return "请为每行选择正确答案";
      if (!items.some((it) => it.toLowerCase() === r.answer.trim().toLowerCase())) {
        return `答案「${r.answer}」不在选项池中`;
      }
    }
    if (!state.reusable) {
      const seen = new Set<string>();
      for (const r of state.rows) {
        const key = r.answer.trim().toLowerCase();
        if (seen.has(key)) return "共享池模式下同一选项不能选择多次";
        seen.add(key);
      }
    }
    return null;
  }
  for (let i = 0; i < state.rows.length; i++) {
    const items = splitLines(state.rows[i].itemsText);
    if (!items.length) return `第 ${i + 1} 行选项池不能为空`;
    if (!state.rows[i].answer.trim()) return `请为第 ${i + 1} 行选择正确答案`;
    if (!items.some((it) => it.toLowerCase() === state.rows[i].answer.trim().toLowerCase())) {
      return `第 ${i + 1} 行答案不在该行选项池中`;
    }
  }
  return null;
}

export function editorStateToAnswer(state: HotspotEditorState): string {
  if (state.interaction === "yesno") {
    return buildHotspotAnswer(
      state.rows.map((r) => {
        const t = r.answer.trim().toUpperCase();
        if (t === "Y" || t === "YES" || r.answer === "是") return "Y";
        if (t === "N" || t === "NO" || r.answer === "否") return "N";
        return r.answer.trim();
      })
    );
  }
  return buildHotspotAnswer(state.rows.map((r) => r.answer));
}

/** 导出为 Excel 列格式（C/D/E 或选项池/行/答案） */
export function editorStateToExcelFields(state: HotspotEditorState): {
  items: string;
  prompts: string;
  answers: string;
} {
  const prompts = joinLines(state.rows.map((r) => r.prompt));
  if (state.interaction === "yesno") {
    return {
      items: "",
      prompts,
      answers: joinLines(
        state.rows.map((r) => {
          const t = r.answer.trim().toUpperCase();
          if (t === "Y" || t === "YES" || r.answer === "是") return "Y";
          if (t === "N" || t === "NO" || r.answer === "否") return "N";
          return r.answer;
        })
      ),
    };
  }
  const answers = joinLines(state.rows.map((r) => r.answer));
  let items = "";
  if (state.poolMode === "perRow") {
    items = joinOptionPoolsText(state.rows.map((r) => splitLines(r.itemsText)));
  } else {
    items = state.sharedItemsText;
  }
  return { items, prompts, answers };
}

export function editorStateFromExcelFields(
  items: string,
  prompts: string,
  answers: string,
  interaction: HotspotInteraction = "dropdown"
): HotspotEditorState {
  if (interaction === "yesno") {
    const rows = splitLines(prompts).map((p, i) => ({
      prompt: p,
      label: "",
      itemsText: "",
      answer: splitLines(answers)[i] || "",
    }));
    return {
      interaction: "yesno",
      poolMode: "shared",
      sharedItemsText: "",
      reusable: true,
      rows: rows.length > 0 ? rows : createDefaultEditorState().rows,
    };
  }

  const perRow = items.includes(POOL_SEPARATOR);
  const promptLines = splitLines(prompts);
  const answerLines = splitLines(answers);
  const pools = splitOptionPools(items);

  if (perRow) {
    return {
      interaction: "dropdown",
      poolMode: "perRow",
      sharedItemsText: "",
      reusable: true,
      rows: promptLines.map((p, i) => ({
        prompt: p,
        label: "",
        itemsText: joinLines(pools[i] || []),
        answer: answerLines[i] || "",
      })),
    };
  }

  return {
    interaction: "dropdown",
    poolMode: "shared",
    sharedItemsText: items,
    reusable: false,
    rows: promptLines.map((p, i) => ({
      prompt: p,
      label: "",
      itemsText: "",
      answer: answerLines[i] || "",
    })),
  };
}
