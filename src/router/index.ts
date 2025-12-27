import type { App } from "vue";
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

export const Layout = () => import("@/layouts/index.vue");

// 静态路由
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layout,
    meta: { hidden: true },
    children: [
      {
        path: "/redirect/:path(.*)",
        component: () => import("@/views/redirect/index.vue"),
      },
    ],
  },

  {
    path: "/login",
    component: () => import("@/views/login/index.vue"),
    meta: { hidden: true },
  },

  {
    path: "/",
    name: "/",
    component: Layout,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        // 用于 keep-alive 功能，需要与 SFC 中自动推导或显式声明的组件名称一致
        // 参考文档: https://cn.vuejs.org/guide/built-ins/keep-alive.html#include-exclude
        name: "Dashboard",
        meta: {
          title: "dashboard",
          icon: "homepage",
          affix: true,
          keepAlive: true,
        },
      },
      {
        path: "401",
        component: () => import("@/views/error/401.vue"),
        meta: { hidden: true },
      },
      {
        path: "404",
        component: () => import("@/views/error/404.vue"),
        meta: { hidden: true },
      },
      {
        path: "profile",
        name: "Profile",
        component: () => import("@/views/profile/index.vue"),
        meta: { title: "个人中心", icon: "user", hidden: true },
      },
      {
        path: "my-notice",
        name: "MyNotice",
        component: () => import("@/views/system/notice/components/MyNotice.vue"),
        meta: { title: "我的通知", icon: "user", hidden: true },
      },
      {
        path: "system/dict-item",
        name: "DictItem",
        component: () => import("@/views/system/dict/dict-item.vue"),
        meta: { title: "字典项", icon: "dict", hidden: true },
      },
      {
        path: "exam/import",
        name: "QuestionImport",
        component: () => import("@/views/exam/import/index.vue"),
        meta: { title: "题库导入(旧)", icon: "upload", hidden: true, activeMenu: "/exam/provider" },
      },
      {
        path: "exam/question-bank/draft-list",
        name: "QuestionBankDraftList",
        component: () => import("@/views/exam/question-bank/draft-list.vue"),
        meta: { title: "草稿题库", icon: "document", hidden: true },
      },
      {
        path: "exam/question-bank/upload",
        name: "QuestionBankUpload",
        component: () => import("@/views/exam/question-bank/upload.vue"),
        meta: { title: "题库上传", icon: "upload", hidden: true },
      },
      {
        path: "exam/question-bank/preview",
        name: "QuestionBankPreview",
        component: () => import("@/views/exam/question-bank/preview.vue"),
        meta: { title: "题库预览", icon: "view", hidden: true },
      },
      {
        path: "exam/question",
        name: "QuestionManagement",
        component: () => import("@/views/exam/question/index.vue"),
        meta: { title: "试题管理", icon: "document", hidden: true, activeMenu: "/exam/provider" },
      },
      {
        path: "exam/question/batch-edit",
        name: "QuestionBatchEdit",
        component: () => import("@/views/exam/question/batch-edit.vue"),
        meta: { title: "批量编辑试题", icon: "edit", hidden: true, activeMenu: "/exam/provider" },
      },
      {
        path: "exam/practice",
        name: "PracticeView",
        component: () => import("@/views/exam/practice/index.vue"),
        meta: { title: "题目练习", icon: "reading", hidden: true, activeMenu: "/exam/provider" },
      },
      {
        path: "/detail/:id(\\d+)",
        name: "DemoDetail",
        component: () => import("@/views/demo/detail.vue"),
        meta: { title: "详情页缓存", icon: "user", hidden: true, keepAlive: true },
      },
    ],
  },
];

/**
 * 创建路由
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
  // 刷新时，滚动条位置还原
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

// 全局路由守卫 - 动态设置activeMenu
router.beforeEach((to, from, next) => {
  // 如果路由query中有activeMenu参数，动态设置
  if (to.query.activeMenu && typeof to.query.activeMenu === "string") {
    to.meta.activeMenu = to.query.activeMenu;
  }
  next();
});

// 全局注册 router
export function setupRouter(app: App<Element>) {
  app.use(router);
}

export default router;
