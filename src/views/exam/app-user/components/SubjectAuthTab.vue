<template>
  <div class="subject-auth-tab">
    <div v-if="loading" style="padding: 24px; color: #909399; text-align: center">加载中...</div>
    <el-empty v-else-if="!list.length" description="该用户尚未激活任何题库" />
    <el-table v-else :data="list" stripe border>
      <el-table-column label="题库" min-width="220">
        <template #default="{ row }">
          <div>
            <div style="font-weight: 500">{{ row.subjectNameEn || row.subjectNameZh }}</div>
            <div
              v-if="row.subjectNameZh && row.subjectNameEn"
              style="font-size: 12px; color: #909399"
            >
              {{ row.subjectNameZh }}
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="供应商" prop="providerName" width="140" />
      <el-table-column label="来源" width="100" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="sourceTagType(row.source)">
            {{ sourceLabel(row.source) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="激活码" prop="code" width="160" show-overflow-tooltip />
      <el-table-column label="激活时间" width="160">
        <template #default="{ row }">{{ formatDateTime(row.activatedAt) }}</template>
      </el-table-column>
      <el-table-column label="到期时间" width="180">
        <template #default="{ row }">
          <span v-if="!row.expiredAt" style="color: #67c23a">永久</span>
          <span v-else :style="row.isExpired ? { color: '#f56c6c' } : {}">
            {{ formatDateTime(row.expiredAt) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="!row.expiredAt" type="success" size="small">永久</el-tag>
          <el-tag v-else-if="row.isExpired" type="danger" size="small">已过期</el-tag>
          <el-tag v-else type="success" size="small">正常</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openEdit(row)">
            修改到期时间
          </el-button>
          <el-button
            v-if="!row.expiredAt || !row.isExpired"
            type="danger"
            link
            size="small"
            @click="onForceExpire(row)"
          >
            强制过期
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="editVisible" title="修改到期时间" width="420px">
      <el-form label-width="100px">
        <el-form-item label="到期时间">
          <el-date-picker
            v-model="editExpiredAt"
            type="datetime"
            placeholder="请选择到期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="onEditConfirm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import UserSubjectAuthAPI, { type UserSubjectAuthAdminVO } from "@/api/exam/user-subject-auth-api";
import { formatDateTime } from "@/utils/datetime";

const props = defineProps<{ userId?: number }>();

const loading = ref(false);
const list = ref<UserSubjectAuthAdminVO[]>([]);

const editVisible = ref(false);
const editLoading = ref(false);
const editRow = ref<UserSubjectAuthAdminVO | null>(null);
const editExpiredAt = ref<string>("");

function sourceLabel(source: string): string {
  return { CODE: "激活码", ADMIN: "管理员", GIFT: "赠送" }[source] || source;
}
function sourceTagType(source: string): "primary" | "success" | "warning" {
  return { CODE: "primary", ADMIN: "warning", GIFT: "success" }[source] as any;
}

async function load() {
  if (!props.userId) {
    list.value = [];
    return;
  }
  loading.value = true;
  try {
    list.value = await UserSubjectAuthAPI.listByUserId(props.userId);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.userId,
  () => load(),
  { immediate: true }
);

function openEdit(row: UserSubjectAuthAdminVO) {
  editRow.value = row;
  editExpiredAt.value = row.expiredAt || "";
  editVisible.value = true;
}

async function onEditConfirm() {
  if (!editRow.value || !editExpiredAt.value) {
    ElMessage.warning("请选择到期时间");
    return;
  }
  editLoading.value = true;
  try {
    await UserSubjectAuthAPI.updateExpiredAt(editRow.value.id, editExpiredAt.value);
    ElMessage.success("修改成功");
    editVisible.value = false;
    await load();
  } finally {
    editLoading.value = false;
  }
}

async function onForceExpire(row: UserSubjectAuthAdminVO) {
  try {
    await ElMessageBox.confirm(
      `确认将题库「${row.subjectNameEn || row.subjectNameZh}」强制过期吗？`,
      "强制过期确认",
      { type: "warning", confirmButtonText: "确定", cancelButtonText: "取消" }
    );
  } catch {
    return;
  }
  await UserSubjectAuthAPI.forceExpire(row.id);
  ElMessage.success("已强制过期");
  await load();
}

defineExpose({ reload: load });
</script>
