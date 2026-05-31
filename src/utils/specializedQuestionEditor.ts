/**
 * 热点题 / 拖放题专用编辑器：提交时从组件 live state 序列化，避免 v-model 仅在校验通过时回写导致脏提交
 */

import { ElMessage } from "element-plus";
import { hasPerRowHotspotPools, parseHotspotOptions } from "./hotspot";
import { parseDragMatchOptions } from "./dragMatch";

export interface SpecializedOptionsEditorExpose {
  validate: (zhOptionsJson?: string, zhAnswer?: string) => string | null;
  serialize: (zhOptionsJson?: string, zhAnswer?: string) => { optionsJson: string; answer: string };
  isValid: () => boolean;
}

export function resolveEditorRef<T>(refValue: T | T[] | null | undefined): T | null {
  if (!refValue) return null;
  if (Array.isArray(refValue)) {
    return refValue.find((r) => r != null) ?? null;
  }
  return refValue;
}

/** 校验并序列化；失败时提示并返回 null */
export function flushSpecializedEditor(
  editor: SpecializedOptionsEditorExpose | null | undefined,
  options?: { silent?: boolean; missingMessage?: string }
): { optionsJson: string; answer: string } | null {
  if (!editor) {
    if (!options?.silent) {
      ElMessage.warning(options?.missingMessage ?? "题目配置编辑器未就绪，请稍后重试");
    }
    return null;
  }
  const err = editor.validate();
  if (err) {
    if (!options?.silent) ElMessage.warning(err);
    return null;
  }
  return editor.serialize();
}

export function validateHotspotBilingualOptions(
  optionsZh: string,
  optionsEn?: string | null
): string | null {
  if (!optionsEn?.trim() || optionsEn === "[]") return null;
  const zh = parseHotspotOptions(optionsZh);
  const en = parseHotspotOptions(optionsEn);
  if (!zh || !en) return null;
  if (zh.interaction !== en.interaction) {
    return "中英文热点题的交互模式须一致（均为下拉或均为判断）";
  }
  if (zh.rows.length !== en.rows.length) {
    return "中英文热点题的行数须一致";
  }
  if (hasPerRowHotspotPools(zh) !== hasPerRowHotspotPools(en)) {
    return "中英文热点题的选项池模式须一致（共享池 / 各行独立池）";
  }
  return null;
}

export function validateDragMatchBilingualOptions(
  optionsZh: string,
  optionsEn?: string | null
): string | null {
  if (!optionsEn?.trim() || optionsEn === "[]") return null;
  const zh = parseDragMatchOptions(optionsZh);
  const en = parseDragMatchOptions(optionsEn);
  if (!zh || !en) return null;
  if (zh.slots.length !== en.slots.length) {
    return "中英文拖放题的槽位数量须一致";
  }
  return null;
}
