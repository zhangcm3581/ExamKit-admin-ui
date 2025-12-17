/**
 * 前端隐藏的菜单路径配置
 * 这些菜单虽然后端有权限，但前端不显示在侧边栏中
 * 可通过其他入口访问（如：按钮跳转）
 */
export const HIDDEN_MENU_PATHS = [
  "exam/subject/index", // 科目管理 - 已隐藏，通过题库中心访问
  "exam/question-bank/draft-list", // 草稿题库 - 已隐藏，通过题库上传访问
  "exam/question/index", // 试题管理 - 已隐藏，通过题库详情页访问
];
