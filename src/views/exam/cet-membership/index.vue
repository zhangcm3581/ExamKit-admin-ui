<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-group">
          <el-button type="success" @click="openExport">导出</el-button>
          <el-button type="primary" @click="openGenerate">生成激活码</el-button>
          <el-button @click="priceOpen = true">会员售价</el-button>
        </div>
        <el-form class="toolbar-group" @submit.prevent="applyFilters">
          <el-input
            v-model="filters.keyword"
            placeholder="请输入激活码"
            aria-label="激活码"
            maxlength="12"
            clearable
            class="filter-code"
            @clear="applyFilters"
          />
          <el-select
            v-model="filters.examType"
            placeholder="考试级别"
            aria-label="考试级别"
            clearable
            class="filter-level"
            @change="applyFilters"
          >
            <el-option
              v-for="(label, level) in labels"
              :key="level"
              :value="level"
              :label="label"
            />
          </el-select>
          <el-select
            v-model="filters.status"
            placeholder="状态"
            aria-label="状态"
            clearable
            class="filter-status"
            @change="applyFilters"
          >
            <el-option
              v-for="(entry, state) in states"
              :key="state"
              :value="state"
              :label="entry.label"
            />
          </el-select>
          <el-button type="primary" native-type="submit" :icon="Search" aria-label="搜索" />
          <el-button :icon="Refresh" aria-label="重置筛选" @click="resetFilters" />
        </el-form>
      </div>

      <el-table
        v-loading="loading"
        :data="codes"
        row-key="id"
        header-cell-class-name="table-header"
        class="code-table"
        stripe
        empty-text="暂无激活码"
      >
        <el-table-column label="序号" width="60" align="center">
          <template #default="{ $index }">{{ (page - 1) * size + $index + 1 }}</template>
        </el-table-column>
        <el-table-column label="激活码" min-width="170">
          <template #default="{ row }: { row: CodeRow }">
            <span v-if="row.code" class="code-text">{{ row.code }}</span>
            <el-button
              v-if="row.code"
              link
              :icon="DocumentCopy"
              aria-label="复制激活码"
              @click="copyCode(row.code)"
            />
            <span v-else class="legacy-code" title="历史记录只保留了尾号">
              尾号 {{ row.suffix }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="考试级别" min-width="110">
          <template #default="{ row }: { row: CodeRow }">{{ labels[row.examType] }}</template>
        </el-table-column>
        <el-table-column label="有效期（月）" prop="durationMonths" width="116" align="center" />
        <el-table-column label="状态" width="94" align="center">
          <template #default="{ row }: { row: CodeRow }">
            <el-tag :type="states[row.status].type" size="small" effect="plain">
              {{ states[row.status].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用户" prop="userName" min-width="115" show-overflow-tooltip>
          <template #default="{ row }: { row: CodeRow }">{{ row.userName || "—" }}</template>
        </el-table-column>
        <el-table-column label="使用时间" min-width="164" align="center">
          <template #default="{ row }: { row: CodeRow }">{{ date(row.redeemedAt) }}</template>
        </el-table-column>
        <el-table-column label="生成时间" min-width="164" align="center">
          <template #default="{ row }: { row: CodeRow }">{{ date(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="104" fixed="right" align="center">
          <template #default="{ row }: { row: CodeRow }">
            <el-button
              v-if="row.status !== 'recycled'"
              type="danger"
              size="small"
              text
              bg
              :icon="CircleClose"
              :loading="recycling === row.id"
              @click="recycle(row)"
            >
              {{ row.status === "unused" ? "作废" : "回收" }}
            </el-button>
            <span v-else :title="date(row.recycledAt)">—</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="page"
        v-model:page-size="size"
        :page-sizes="[20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        background
        class="code-pagination"
        @current-change="loadCodes"
        @size-change="applyFilters"
      />
    </el-card>

    <el-dialog
      v-model="generateOpen"
      title="生成激活码"
      width="min(700px, 94vw)"
      align-center
      :close-on-click-modal="false"
    >
      <el-form label-width="104px" @submit.prevent="generate">
        <el-form-item label="考试级别" required>
          <el-select v-model="form.examType" class="full-width">
            <el-option
              v-for="(label, level) in labels"
              :key="level"
              :value="level"
              :label="label"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生成方式">
          <el-radio-group v-model="form.mode">
            <el-radio value="batch">自动生成</el-radio>
            <el-radio value="custom">自定义输入</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.mode === 'batch'" label="生成数量" required>
          <el-input-number
            v-model="form.count"
            :min="1"
            :max="100"
            :precision="0"
            class="full-width"
          />
        </el-form-item>
        <el-form-item v-else label="激活码列表" required>
          <el-input
            v-model="form.codes"
            type="textarea"
            :rows="6"
            :maxlength="1500"
            placeholder="一行一个激活码，最多 100 个"
          />
          <p class="form-tip">每个激活码 12 位，排除 I、O、0、1。</p>
        </el-form-item>
        <el-form-item label="有效期（月）" required>
          <el-input-number v-model="form.durationMonths" :min="1" :max="36" :precision="0" />
          <span class="months-hint">默认 {{ durationMonths }} 个月</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            :maxlength="250"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="generating" @click="generateOpen = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="generate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="exportOpen" title="导出激活码" width="min(460px, 94vw)" align-center>
      <el-form label-width="90px" @submit.prevent="exportCodes">
        <el-form-item label="考试级别">
          <el-select v-model="exportType" class="full-width">
            <el-option label="全部级别" value="" />
            <el-option
              v-for="(label, level) in labels"
              :key="level"
              :value="level"
              :label="label"
            />
          </el-select>
        </el-form-item>
        <p class="form-tip">导出未使用且可复制完整码的激活码。</p>
      </el-form>
      <template #footer>
        <el-button :disabled="exporting" @click="exportOpen = false">取消</el-button>
        <el-button type="primary" :loading="exporting" @click="exportCodes">确定导出</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="priceOpen" title="四六级会员售价" width="min(500px, 94vw)" align-center>
      <p class="price-note">微信支付开通 {{ durationMonths }} 个月，新价格对后续订单生效。</p>
      <el-form v-for="plan in plans" :key="plan.examType" inline @submit.prevent="savePrice(plan)">
        <el-form-item :label="labels[plan.examType] + '（元）'">
          <el-input-number
            v-model="prices[plan.examType]"
            :min="0.01"
            :max="9999.99"
            :precision="2"
            :step="1"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="saving === plan.examType">
            保存价格
          </el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { CircleClose, DocumentCopy, Refresh, Search } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { formatDateTime } from "@/utils/datetime";
import request from "@/utils/request";

defineOptions({ name: "CetMembershipAdmin" });

const labels = { CET4: "英语四级", CET6: "英语六级" };
const states = {
  unused: { label: "未使用", type: "success" },
  used: { label: "已使用", type: "info" },
  expired: { label: "已过期", type: "warning" },
  recycled: { label: "已回收", type: "danger" },
} as const;
type Level = keyof typeof labels;
type CodeStatus = keyof typeof states;
interface Plan {
  examType: Level;
  priceCents: number;
}
interface Settings {
  plans: Plan[];
  durationMonths: number;
}
interface CodeRow {
  id: number;
  examType: Level;
  code?: string;
  suffix: string;
  durationMonths: number;
  status: CodeStatus;
  userName?: string;
  remark?: string;
  createdAt: string;
  redeemedAt?: string;
  recycledAt?: string;
}

const api = "/v1/cet-membership";
const filters = reactive<{ keyword: string; examType: Level | ""; status: CodeStatus | "" }>({
  keyword: "",
  examType: "",
  status: "",
});
const page = ref(1);
const size = ref(20);
const total = ref(0);
const codes = ref<CodeRow[]>([]);
const loading = ref(false);
let loadId = 0;
const recycling = ref<number>();

const generateOpen = ref(false);
const generating = ref(false);
const form = reactive<{
  examType: Level;
  mode: "batch" | "custom";
  count?: number;
  durationMonths?: number;
  codes: string;
  remark: string;
}>({ examType: "CET4", mode: "batch", count: 1, durationMonths: 6, codes: "", remark: "" });

const exportOpen = ref(false);
const exporting = ref(false);
const exportType = ref<Level | "">("");
const priceOpen = ref(false);
const plans = ref<Plan[]>([]);
const prices = reactive<Record<Level, number | undefined>>({ CET4: undefined, CET6: undefined });
const durationMonths = ref(6);
const saving = ref<Level>();

const date = (value?: string) => (value ? formatDateTime(value) : "—");

async function loadCodes() {
  const id = ++loadId;
  loading.value = true;
  try {
    const result = await request.get<unknown, { items: CodeRow[]; total: number }>(api + "/codes", {
      params: { ...filters, keyword: filters.keyword.trim(), page: page.value, size: size.value },
    });
    if (id === loadId) {
      codes.value = result.items;
      total.value = result.total;
    }
  } finally {
    if (id === loadId) loading.value = false;
  }
}

function applyFilters() {
  page.value = 1;
  void loadCodes();
}

function resetFilters() {
  Object.assign(filters, { keyword: "", examType: "", status: "" });
  applyFilters();
}

async function loadSettings() {
  const settings = await request.get<unknown, Settings>(api);
  plans.value = settings.plans;
  durationMonths.value = settings.durationMonths;
  settings.plans.forEach((plan) => {
    prices[plan.examType] = plan.priceCents / 100;
  });
}

async function savePrice(plan: Plan) {
  const price = prices[plan.examType];
  if (saving.value || !price || price <= 0) return;
  saving.value = plan.examType;
  try {
    await request.put(api + "/" + plan.examType + "/price", {
      priceCents: Math.round(price * 100),
    });
    ElMessage.success("售价已保存");
  } finally {
    saving.value = undefined;
  }
}

function openGenerate() {
  Object.assign(form, {
    examType: filters.examType || "CET4",
    mode: "batch",
    count: 1,
    durationMonths: durationMonths.value,
    codes: "",
    remark: "",
  });
  generateOpen.value = true;
}

async function generate() {
  if (generating.value || !form.durationMonths) return;
  const input = form.codes
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
  if (form.mode === "custom" && !input.length) {
    ElMessage.warning("请输入激活码");
    return;
  }
  if (form.mode === "batch" && !form.count) return;

  generating.value = true;
  const payload = {
    examType: form.examType,
    durationMonths: form.durationMonths,
    remark: form.remark.trim() || undefined,
  };
  try {
    if (form.mode === "custom")
      await request.post(api + "/codes/custom", { ...payload, codes: input });
    else await request.post(api + "/codes", { ...payload, count: form.count });
    generateOpen.value = false;
    Object.assign(filters, { keyword: "", examType: form.examType, status: "" });
    applyFilters();
    ElMessage.success("激活码已生成");
  } finally {
    generating.value = false;
  }
}

function openExport() {
  exportType.value = filters.examType;
  exportOpen.value = true;
}

async function exportCodes() {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const rows = await request.get<unknown, CodeRow[]>(api + "/codes/export", {
      params: { examType: exportType.value },
    });
    if (!rows.length) {
      ElMessage.warning("没有可导出的激活码");
      return;
    }
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((row) => ({
        激活码: row.code,
        考试级别: labels[row.examType],
        "有效期（月）": row.durationMonths,
        生成时间: date(row.createdAt),
        备注: row.remark || "",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "四六级激活码");
    XLSX.writeFile(workbook, `四六级激活码_${Date.now()}.xlsx`);
    exportOpen.value = false;
    ElMessage.success("导出成功");
  } finally {
    exporting.value = false;
  }
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    ElMessage.success("已复制");
  } catch {
    ElMessage.warning("请选中激活码后手动复制");
  }
}

async function recycle(row: CodeRow) {
  if (recycling.value !== undefined) return;
  const unused = row.status === "unused";
  const action = unused ? "作废" : "回收";
  const explanation = unused ? "这张码将无法使用。" : "将收回这张码尚未使用的会员时长。";
  recycling.value = row.id;
  try {
    try {
      await ElMessageBox.confirm(
        `确认${action}激活码「${row.code || "尾号 " + row.suffix}」吗？${explanation}`,
        action + "确认",
        {
          type: "warning",
          confirmButtonText: "确认" + action,
          cancelButtonText: "取消",
        }
      );
    } catch {
      return;
    }
    await request.post(api + "/codes/" + row.id + "/recycle");
    if (codes.value.length === 1 && page.value > 1 && filters.status) page.value--;
    await loadCodes();
    ElMessage.success("已" + action);
  } finally {
    recycling.value = undefined;
  }
}

onMounted(() => {
  void loadSettings();
  void loadCodes();
});
</script>

<style scoped>
.toolbar,
.toolbar-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.toolbar {
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
}
.toolbar-group :deep(.el-button + .el-button) {
  margin-left: 0;
}
.filter-code {
  width: 200px;
}
.filter-level {
  width: 140px;
}
.filter-status {
  width: 100px;
}
.code-table :deep(.table-header) {
  background: var(--el-fill-color-light);
}
.code-table :deep(.el-table__cell) {
  padding-block: 14px;
}
.code-text {
  font-family: ui-monospace, monospace;
  font-weight: 700;
  color: var(--el-color-primary);
}
.code-text + .el-button {
  margin-left: 5px;
}
.legacy-code,
.form-tip,
.months-hint {
  color: var(--el-text-color-secondary);
}
.code-pagination {
  justify-content: flex-end;
  margin-top: 16px;
}
.full-width {
  width: 100%;
}
.form-tip {
  margin: 4px 0 0;
  font-size: 12px;
}
.months-hint {
  margin-left: 12px;
  font-size: 12px;
}
.price-note {
  margin-bottom: 14px;
}
</style>
