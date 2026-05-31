/** 题型 code → 中文展示名（仅使用 canonical code，DRAG 为历史别名） */

export const QUESTION_TYPE_LABEL: Record<string, string> = {
  SINGLE: "单选题",
  MULTIPLE: "多选题",
  JUDGE: "判断题",
  FILL_BLANK: "填空题",
  SHORT_ANSWER: "简答题",
  DRAG_MATCH: "拖放题",
  HOTSPOT: "热点题",
  /** @deprecated 历史 code，展示同拖放题 */
  DRAG: "拖放题",
};

/** 表格/预览等紧凑场景 */
export const QUESTION_TYPE_LABEL_SHORT: Record<string, string> = {
  SINGLE: "单选",
  MULTIPLE: "多选",
  JUDGE: "判断",
  FILL_BLANK: "填空",
  SHORT_ANSWER: "简答",
  DRAG_MATCH: "拖放",
  HOTSPOT: "热点",
  DRAG: "拖放",
};

export const QUESTION_TYPE_COLOR: Record<string, string> = {
  SINGLE: "primary",
  MULTIPLE: "success",
  JUDGE: "warning",
  FILL_BLANK: "danger",
  SHORT_ANSWER: "info",
  DRAG_MATCH: "",
  HOTSPOT: "success",
  DRAG: "",
};

/** 历史 DRAG 与 DRAG_MATCH 为同一题型 */
export function normalizeQuestionTypeCode(type?: string | null): string {
  if (!type) return "";
  const t = type.trim();
  return t === "DRAG" ? "DRAG_MATCH" : t;
}

export function getQuestionTypeLabel(type: string, short = false): string {
  const map = short ? QUESTION_TYPE_LABEL_SHORT : QUESTION_TYPE_LABEL;
  return map[type] || map[normalizeQuestionTypeCode(type)] || type;
}

export function getQuestionTypeColor(type: string): string {
  const normalized = normalizeQuestionTypeCode(type);
  return QUESTION_TYPE_COLOR[type] || QUESTION_TYPE_COLOR[normalized] || "info";
}
