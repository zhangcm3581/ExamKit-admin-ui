/**
 * 拖放题（DRAG_MATCH）— 管理后台：解析 / 编辑态序列化
 * Excel：C Tool 池、D Purpose、E 答案 — 换行分隔；Tool 池多段用 ;;
 */

import { joinLines, splitLines, splitOptionPools, splitPipe } from "./hotspot";

export interface DragMatchSlot {
  id: string;
  purpose: string;
}

export interface DragMatchOptions {
  items: string[];
  slots: DragMatchSlot[];
  reusable?: boolean;
}

export interface DragMatchEditorRow {
  purpose: string;
  answer: string;
}

export interface DragMatchEditorState {
  toolsText: string;
  rows: DragMatchEditorRow[];
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
    if (!items.length || !slots.length) return null;
    return { items, slots, reusable: obj.reusable !== false };
  } catch {
    return null;
  }
}

export function parseToolsText(raw: string): string[] {
  return splitOptionPools(raw).flatMap((pool) => pool);
}

export function createDefaultDragMatchEditorState(): DragMatchEditorState {
  return { toolsText: "", rows: [{ purpose: "", answer: "" }] };
}

export function optionsToDragMatchEditorState(
  optionsJson: string | undefined,
  answerPipe: string | undefined
): DragMatchEditorState {
  const parsed = parseDragMatchOptions(optionsJson);
  const answers = splitPipe(answerPipe || "");
  if (!parsed) return createDefaultDragMatchEditorState();
  return {
    toolsText: joinLines(parsed.items),
    rows: parsed.slots.map((s, i) => ({
      purpose: s.purpose,
      answer: answers[i] || "",
    })),
  };
}

export function editorStateToDragMatchOptionsJson(state: DragMatchEditorState): string {
  const tools = parseToolsText(state.toolsText);
  const rows = state.rows.map((r, i) => ({
    id: String(i + 1),
    purpose: r.purpose.trim(),
  }));
  return JSON.stringify({ items: tools, slots: rows, reusable: true });
}

export function editorStateToDragMatchAnswer(state: DragMatchEditorState): string {
  return state.rows.map((r) => r.answer.trim()).join("|");
}

export function validateDragMatchEditorState(state: DragMatchEditorState): string | null {
  const tools = parseToolsText(state.toolsText);
  if (!tools.length) return "Tool 池不能为空";
  if (!state.rows.length) return "至少配置一个槽位";
  for (let i = 0; i < state.rows.length; i++) {
    const row = state.rows[i];
    if (!row.answer.trim()) return `请为第 ${i + 1} 个槽位选择正确答案`;
    if (!tools.some((t) => t.toLowerCase() === row.answer.trim().toLowerCase())) {
      return `第 ${i + 1} 个槽位答案不在 Tool 池中`;
    }
  }
  return null;
}

export function editorStateToDragMatchExcelFields(state: DragMatchEditorState): {
  tools: string;
  purposes: string;
  answers: string;
} {
  return {
    tools: state.toolsText,
    purposes: joinLines(state.rows.map((r) => r.purpose)),
    answers: joinLines(state.rows.map((r) => r.answer)),
  };
}
