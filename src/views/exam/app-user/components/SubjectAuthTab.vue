<template>
  <div class="subject-auth-tab">
    <div v-if="loading" class="state state--loading">
      <el-icon class="is-loading" :size="18"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <el-empty v-else-if="!list.length" description="该用户尚未激活任何题库" :image-size="96" />

    <template v-else>
      <!-- 概览 -->
      <div class="summary">
        <div class="summary__cell">
          <div class="summary__label">总授权</div>
          <div class="summary__value">{{ list.length }}</div>
        </div>
        <div class="summary__divider" />
        <div class="summary__cell">
          <div class="summary__label">正常</div>
          <div class="summary__value summary__value--ok">{{ stats.active }}</div>
        </div>
        <div class="summary__divider" />
        <div class="summary__cell">
          <div class="summary__label">即将到期</div>
          <div class="summary__value summary__value--warn">{{ stats.soon }}</div>
        </div>
        <div class="summary__divider" />
        <div class="summary__cell">
          <div class="summary__label">已过期</div>
          <div class="summary__value summary__value--danger">{{ stats.expired }}</div>
        </div>
        <div class="summary__divider" />
        <div class="summary__cell">
          <div class="summary__label">永久</div>
          <div class="summary__value summary__value--ok">{{ stats.lifetime }}</div>
        </div>
      </div>

      <el-table
        :data="list"
        class="auth-table"
        :border="false"
        :header-cell-style="{ background: '#fafbfc', color: '#606266', fontWeight: 600 }"
        :cell-style="{ padding: '14px 0' }"
        row-key="id"
      >
        <el-table-column label="题库" min-width="240">
          <template #default="{ row }">
            <div class="subject-cell">
              <div class="subject-cell__primary">
                {{ row.subjectNameEn || row.subjectNameZh }}
              </div>
              <div v-if="row.subjectNameZh && row.subjectNameEn" class="subject-cell__secondary">
                {{ row.subjectNameZh }}
              </div>
              <div class="subject-cell__provider">{{ row.providerName }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="来源" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="sourceTagType(row.source)" effect="light" round>
              {{ sourceLabel(row.source) }}
            </el-tag>
            <div v-if="row.code" class="code-line" :title="row.code">
              {{ row.code }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="激活时间" width="150">
          <template #default="{ row }">
            <div class="time-line">{{ formatDateTime(row.activatedAt) }}</div>
          </template>
        </el-table-column>

        <el-table-column label="到期状态" min-width="180">
          <template #default="{ row }">
            <div class="expiry">
              <span class="status-dot" :class="`status-dot--${statusOf(row).key}`" />
              <div class="expiry__text">
                <div class="expiry__primary">{{ statusOf(row).label }}</div>
                <div class="expiry__secondary">
                  <template v-if="!row.expiredAt">长期有效</template>
                  <template v-else>{{ formatDateTime(row.expiredAt) }}</template>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right" align="right">
          <template #default="{ row }">
            <div class="ops">
              <el-button type="primary" size="small" text bg :icon="Edit" @click="openEdit(row)">
                改期
              </el-button>
              <el-button
                v-if="!row.expiredAt || !row.isExpired"
                type="danger"
                size="small"
                text
                bg
                :icon="CircleClose"
                @click="onForceExpire(row)"
              >
                强制过期
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 改期对话框 -->
    <el-dialog
      v-model="editVisible"
      title="修改到期时间"
      width="460px"
      :close-on-click-modal="false"
      append-to-body
      align-center
    >
      <div v-if="editRow" class="edit-dialog">
        <div class="edit-dialog__subject">
          <div class="edit-dialog__name">
            {{ editRow.subjectNameEn || editRow.subjectNameZh }}
          </div>
          <div v-if="editRow.subjectNameZh && editRow.subjectNameEn" class="edit-dialog__sub">
            {{ editRow.subjectNameZh }}
          </div>
        </div>

        <div class="edit-dialog__meta">
          <div class="edit-dialog__meta-row">
            <span class="edit-dialog__meta-label">当前到期</span>
            <span class="edit-dialog__meta-value">
              <template v-if="!editRow.expiredAt">永久</template>
              <template v-else>
                {{ formatDateTime(editRow.expiredAt) }}
                <span
                  class="edit-dialog__hint"
                  :class="editRow.isExpired ? 'is-danger' : 'is-muted'"
                >
                  {{ editRow.isExpired ? "已过期" : "" }}
                </span>
              </template>
            </span>
          </div>
        </div>

        <div class="edit-dialog__field">
          <label class="edit-dialog__field-label">新到期时间</label>
          <el-date-picker
            v-model="editExpiredAt"
            type="datetime"
            placeholder="请选择到期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
          <div class="edit-dialog__presets">
            <span class="edit-dialog__preset-label">快捷设置：</span>
            <el-button
              v-for="p in presets"
              :key="p.label"
              size="small"
              link
              type="primary"
              @click="applyPreset(p.days)"
            >
              {{ p.label }}
            </el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="onEditConfirm">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Edit, CircleClose, Loading } from "@element-plus/icons-vue";
import UserSubjectAuthAPI, { type UserSubjectAuthAdminVO } from "@/api/exam/user-subject-auth-api";
import { formatDateTime } from "@/utils/datetime";

const props = defineProps<{ userId?: number }>();

const loading = ref(false);
const list = ref<UserSubjectAuthAdminVO[]>([]);

const editVisible = ref(false);
const editLoading = ref(false);
const editRow = ref<UserSubjectAuthAdminVO | null>(null);
const editExpiredAt = ref<string>("");

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const presets = [
  { label: "+30 天", days: 30 },
  { label: "+90 天", days: 90 },
  { label: "+365 天", days: 365 },
];

function sourceLabel(source: string): string {
  return (
    ({ CODE: "激活码", ADMIN: "管理员", GIFT: "赠送" } as Record<string, string>)[source] || source
  );
}
function sourceTagType(source: string): "primary" | "success" | "warning" | "info" {
  return (
    (
      { CODE: "primary", ADMIN: "warning", GIFT: "success" } as Record<
        string,
        "primary" | "warning" | "success"
      >
    )[source] || "info"
  );
}

type StatusKey = "lifetime" | "active" | "soon" | "expired";

function statusOf(row: UserSubjectAuthAdminVO): { key: StatusKey; label: string } {
  if (!row.expiredAt) return { key: "lifetime", label: "永久" };
  if (row.isExpired) {
    const days = daysSince(row.expiredAt);
    return { key: "expired", label: days > 0 ? `已过期 ${days} 天` : "已过期" };
  }
  const msLeft = new Date(row.expiredAt).getTime() - Date.now();
  if (msLeft < SEVEN_DAYS_MS) {
    const days = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    return { key: "soon", label: `${days} 天后到期` };
  }
  const days = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  return { key: "active", label: `剩余 ${days} 天` };
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

const stats = computed(() => {
  const out = { active: 0, soon: 0, expired: 0, lifetime: 0 };
  for (const row of list.value) {
    const k = statusOf(row).key;
    out[k]++;
  }
  return out;
});

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

function applyPreset(days: number) {
  // 累加规则与后端一致：未过期从原到期日累加，已过期或无到期日从现在累加
  const base = (() => {
    if (!editRow.value?.expiredAt || editRow.value.isExpired) return new Date();
    return new Date(editRow.value.expiredAt);
  })();
  base.setDate(base.getDate() + days);
  // toISOString 转 +0；用本地时间格式化为 "YYYY-MM-DDTHH:mm:ss"
  editExpiredAt.value = formatLocalIsoNoTz(base);
}

function formatLocalIsoNoTz(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
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

<style lang="scss" scoped>
.subject-auth-tab {
  --auth-border: #ebeef5;
  --auth-text-strong: #1f2937;
  --auth-text: #4b5563;
  --auth-text-muted: #9ca3af;
  --auth-bg-soft: #f7f8fa;
}

/* —— 加载态 —— */
.state {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  font-size: 14px;
  color: var(--auth-text-muted);
}

/* —— 顶部概览 —— */
.summary {
  display: flex;
  align-items: stretch;
  padding: 14px 20px;
  margin-bottom: 16px;
  background: var(--auth-bg-soft);
  border: 1px solid var(--auth-border);
  border-radius: 10px;
}
.summary__cell {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
}
.summary__label {
  font-size: 12px;
  color: var(--auth-text-muted);
  letter-spacing: 0.02em;
}
.summary__value {
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  color: var(--auth-text-strong);
}
.summary__value--ok {
  color: #15803d;
}
.summary__value--warn {
  color: #d97706;
}
.summary__value--danger {
  color: #dc2626;
}
.summary__divider {
  width: 1px;
  margin: 4px 0;
  background: var(--auth-border);
}

/* —— 表格容器 —— */
.auth-table {
  --el-table-border-color: var(--auth-border);
  overflow: hidden;
  border: 1px solid var(--auth-border);
  border-radius: 10px;
}
:deep(.el-table__inner-wrapper::before) {
  display: none;
}
:deep(.el-table tr) {
  transition: background 0.15s ease;
}
:deep(.el-table__row:hover > td) {
  background-color: #f5f9ff !important;
}

/* —— 题库列 —— */
.subject-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 0 4px;
}
.subject-cell__primary {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--auth-text-strong);
}
.subject-cell__secondary {
  font-size: 12px;
  line-height: 1.4;
  color: var(--auth-text);
}
.subject-cell__provider {
  margin-top: 2px;
  font-size: 11px;
  color: var(--auth-text-muted);
  letter-spacing: 0.02em;
}

/* —— 激活码 —— */
.code-line {
  max-width: 110px;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  color: var(--auth-text-muted);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

/* —— 时间 —— */
.time-line {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--auth-text);
}

/* —— 到期状态列 —— */
.expiry {
  display: flex;
  gap: 10px;
  align-items: center;
}
.status-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
}
.status-dot--lifetime {
  background: #22c55e;
}
.status-dot--active {
  background: #22c55e;
}
.status-dot--soon {
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}
.status-dot--expired {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}
.expiry__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.expiry__primary {
  font-size: 13px;
  font-weight: 500;
  color: var(--auth-text-strong);
}
.expiry__secondary {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--auth-text-muted);
}

/* —— 操作列 —— */
.ops {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
}
.ops :deep(.el-button) {
  margin-left: 0;
}

/* —— 改期对话框 —— */
.edit-dialog__subject {
  padding: 12px 16px;
  background: var(--auth-bg-soft);
  border: 1px solid var(--auth-border);
  border-radius: 8px;
}
.edit-dialog__name {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--auth-text-strong);
}
.edit-dialog__sub {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--auth-text);
}
.edit-dialog__meta {
  margin-top: 14px;
}
.edit-dialog__meta-row {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 13px;
}
.edit-dialog__meta-label {
  flex-shrink: 0;
  width: 70px;
  color: var(--auth-text-muted);
}
.edit-dialog__meta-value {
  font-variant-numeric: tabular-nums;
  color: var(--auth-text-strong);
}
.edit-dialog__hint {
  margin-left: 8px;
  font-size: 12px;
}
.edit-dialog__hint.is-danger {
  color: #dc2626;
}
.edit-dialog__field {
  margin-top: 18px;
}
.edit-dialog__field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--auth-text);
}
.edit-dialog__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  margin-top: 10px;
}
.edit-dialog__preset-label {
  margin-right: 4px;
  font-size: 12px;
  color: var(--auth-text-muted);
}
</style>
