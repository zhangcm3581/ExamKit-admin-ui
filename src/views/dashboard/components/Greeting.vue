<template>
  <el-card shadow="never" class="mt-2">
    <div class="flex flex-wrap">
      <div class="flex-1 flex items-start">
        <img
          class="w80px h80px rounded-full"
          :src="userStore.userInfo.avatar + '?imageView2/1/w/80/h/80'"
        />
        <div class="ml-5">
          <p>{{ greetings }}</p>
          <p class="text-sm text-gray">欢迎使用 ExamKit 在线做题系统！</p>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUserStore } from "@/store/modules/user-store";

const userStore = useUserStore();
const currentDate = new Date();

const greetings = computed(() => {
  const hours = currentDate.getHours();
  const nickname = userStore.userInfo.nickname;
  if (hours >= 6 && hours < 8) {
    return "晨起披衣出草堂，轩窗已自喜微凉🌅！";
  } else if (hours >= 8 && hours < 12) {
    return `上午好，${nickname}！`;
  } else if (hours >= 12 && hours < 18) {
    return `下午好，${nickname}！`;
  } else if (hours >= 18 && hours < 24) {
    return `晚上好，${nickname}！`;
  } else {
    return "偷偷向银河要了一把碎星，只等你闭上眼睛撒入你的梦中，晚安🌛！";
  }
});
</script>
