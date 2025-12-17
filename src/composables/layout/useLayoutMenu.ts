import { useRoute } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useAppStore, usePermissionStore } from "@/store";
import { HIDDEN_MENU_PATHS } from "@/config/hidden-menus";

/**
 * 过滤隐藏的菜单项
 */
function filterHiddenMenus(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  return routes
    .map((route) => {
      // 检查当前路由是否在隐藏列表中
      const shouldHide =
        route.component &&
        typeof route.component === "function" &&
        HIDDEN_MENU_PATHS.some((hiddenPath) => {
          // 检查路由组件路径是否匹配隐藏路径
          const componentStr = route.component?.toString() || "";
          return componentStr.includes(hiddenPath);
        });

      if (shouldHide) {
        return null;
      }

      // 递归过滤子路由
      if (route.children && route.children.length > 0) {
        const filteredChildren = filterHiddenMenus(route.children);
        return {
          ...route,
          children: filteredChildren,
        };
      }

      return route;
    })
    .filter((route): route is RouteRecordRaw => route !== null);
}

/**
 * 布局菜单处理逻辑
 */
export function useLayoutMenu() {
  const route = useRoute();
  const appStore = useAppStore();
  const permissionStore = usePermissionStore();

  // 顶部菜单激活路径
  const activeTopMenuPath = computed(() => appStore.activeTopMenuPath);

  // 常规路由（左侧菜单或顶部菜单）- 过滤隐藏的菜单
  const routes = computed(() => filterHiddenMenus(permissionStore.routes));

  // 混合布局左侧菜单路由 - 过滤隐藏的菜单
  const sideMenuRoutes = computed(() => filterHiddenMenus(permissionStore.mixLayoutSideMenus));

  // 当前激活的菜单
  const activeMenu = computed(() => {
    const { meta, path } = route;

    // 如果设置了activeMenu，则使用
    if (meta?.activeMenu) {
      return meta.activeMenu;
    }

    return path;
  });

  return {
    routes,
    sideMenuRoutes,
    activeMenu,
    activeTopMenuPath,
  };
}
