/** 题型 code → 中文展示名（全局统一「拖放题」） */

export const QUESTION_TYPE_LABEL: Record<string, string> = {
  SINGLE: "单选题",
  MULTIPLE: "多选题",
  JUDGE: "判断题",
  FILL_BLANK: "填空题",
  SHORT_ANSWER: "简答题",
  DRAG_MATCH: "拖放题",
};

/** 表格/预览等紧凑场景 */
export const QUESTION_TYPE_LABEL_SHORT: Record<string, string> = {
  SINGLE: "单选",
  MULTIPLE: "多选",
  JUDGE: "判断",
  FILL_BLANK: "填空",
  SHORT_ANSWER: "简答",
  DRAG_MATCH: "拖放",
};

export const QUESTION_TYPE_COLOR: Record<string, string> = {
  SINGLE: "primary",
  MULTIPLE: "success",
  JUDGE: "warning",
  FILL_BLANK: "danger",
  SHORT_ANSWER: "info",
  DRAG_MATCH: "",
};

export function getQuestionTypeLabel(type: string, short = false): string {
  const map = short ? QUESTION_TYPE_LABEL_SHORT : QUESTION_TYPE_LABEL;
  return map[type] || type;
}

export function getQuestionTypeColor(type: string): string {
  return QUESTION_TYPE_COLOR[type] || "info";
}
