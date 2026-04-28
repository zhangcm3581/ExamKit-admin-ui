<template>
  <div class="dashboard-container">
    <AdminDashboard v-if="canViewDashboard" />
    <Greeting v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUserStore } from "@/store/modules/user-store";
import { DASHBOARD_ROLES } from "@/constants";
import AdminDashboard from "./components/AdminDashboard.vue";
import Greeting from "./components/Greeting.vue";

defineOptions({
  name: "Dashboard",
  inheritAttrs: false,
});

const userStore = useUserStore();
const canViewDashboard = computed(() =>
  Boolean(userStore.userInfo.roles?.some((r) => DASHBOARD_ROLES.includes(r)))
);
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 24px;
}
</style>
