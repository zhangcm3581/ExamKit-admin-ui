<template>
  <div class="app-container agent-orders">
    <el-card shadow="never">
      <el-tabs v-model="tab" class="ord-tabs">
        <!-- ============ 订单记录 ============ -->
        <el-tab-pane name="orders">
          <template #label>
            <span>订单记录</span>
            <el-badge
              v-if="orderTotal > 0"
              :value="orderTotal"
              :max="999"
              class="tab-badge"
              type="primary"
            />
          </template>

          <div class="toolbar">
            <el-form inline :model="orderQuery">
              <el-form-item label="状态">
                <el-select
                  v-model="orderQuery.status"
                  clearable
                  placeholder="全部状态"
                  style="width: 140px"
                  @change="loadOrders"
                >
                  <el-option label="待支付" value="PENDING" />
                  <el-option label="已支付" value="PAID" />
                  <el-option label="已关闭" value="CLOSED" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadOrders">查询</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table
            :data="orders"
            stripe
            :header-cell-style="{ background: 'var(--el-fill-color-light)' }"
            empty-text="还没有订单，去「购买激活码」生成第一笔吧"
          >
            <el-table-column prop="orderNo" label="订单号" min-width="200">
              <template #default="{ row }">
                <span class="mono">{{ row.orderNo }}</span>
              </template>
            </el-table-column>
            <el-table-column label="科目" min-width="240">
              <template #default="{ row }">
                <div class="subject-cell">
                  <div class="zh">{{ row.subjectName || row.subjectNameEn || "—" }}</div>
                  <div v-if="row.subjectName && row.subjectNameEn" class="en">
                    {{ row.subjectNameEn }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" align="center" />
            <el-table-column prop="unitPriceYuan" label="单价" width="90" align="right">
              <template #default="{ row }">¥{{ row.unitPriceYuan }}</template>
            </el-table-column>
            <el-table-column prop="totalYuan" label="总额" width="100" align="right">
              <template #default="{ row }">
                <strong>¥{{ row.totalYuan }}</strong>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="statusTag(row.status)" effect="light">
                  {{ statusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="170" />
            <el-table-column prop="paidAt" label="支付时间" width="170">
              <template #default="{ row }">{{ row.paidAt || "—" }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'PAID'"
                  link
                  type="primary"
                  @click="viewCodes(row.orderNo, row.id)"
                >
                  查看激活码
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <pagination
            v-if="orderTotal > 0"
            v-model:page="orderQuery.pageNum"
            v-model:limit="orderQuery.pageSize"
            :total="orderTotal"
            @pagination="loadOrders"
          />
        </el-tab-pane>

        <!-- ============ 激活码 ============ -->
        <el-tab-pane name="codes">
          <template #label>
            <span>激活码</span>
            <el-badge
              v-if="codeTotal > 0"
              :value="codeTotal"
              :max="9999"
              class="tab-badge"
              type="primary"
            />
          </template>

          <div class="toolbar">
            <el-form inline :model="codeQuery">
              <el-form-item label="状态">
                <el-select
                  v-model="codeQuery.status"
                  clearable
                  placeholder="全部状态"
                  style="width: 140px"
                  @change="loadCodes"
                >
                  <el-option label="未使用" :value="0" />
                  <el-option label="已使用" :value="1" />
                  <el-option label="已过期" :value="2" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="codeQuery.orderId">
                <el-tag closable type="info" @close="clearOrderFilter">
                  按订单筛选：{{ filteredOrderNo }}
                </el-tag>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadCodes">查询</el-button>
                <el-button :icon="CopyDocument" @click="copyAllUnused">复制全部未用</el-button>
                <el-button :icon="Download" type="success" plain @click="exportCodes">
                  导出 Excel
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table
            :data="codes"
            stripe
            :header-cell-style="{ background: 'var(--el-fill-color-light)' }"
            empty-text="还没有激活码，先去「订单记录」找一笔已支付的订单查看"
          >
            <el-table-column prop="code" label="激活码" width="170">
              <template #default="{ row }">
                <span class="mono code-cell">{{ row.code }}</span>
              </template>
            </el-table-column>
            <el-table-column label="科目" min-width="240">
              <template #default="{ row }">
                <div class="subject-cell">
                  <div class="zh">{{ row.subjectName || row.subjectNameEn || "—" }}</div>
                  <div v-if="row.subjectName && row.subjectNameEn" class="en">
                    {{ row.subjectNameEn }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="codeStatusTag(row.status)" effect="light">
                  {{ codeStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="validDays" label="有效天数" width="100" align="center" />
            <el-table-column prop="usedByName" label="使用人" min-width="140">
              <template #default="{ row }">{{ row.usedByName || "—" }}</template>
            </el-table-column>
            <el-table-column prop="usedAt" label="使用时间" width="170">
              <template #default="{ row }">{{ row.usedAt || "—" }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="生成时间" width="170" />
          </el-table>

          <pagination
            v-if="codeTotal > 0"
            v-model:page="codeQuery.pageNum"
            v-model:limit="codeQuery.pageSize"
            :total="codeTotal"
            @pagination="loadCodes"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import { CopyDocument, Download } from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import AgentAPI, { type AgentOrderVO, type AgentCodePageQuery } from "@/api/agent-api";

const tab = ref<"orders" | "codes">("orders");

// ===== 订单 =====
const orderQuery = reactive({ pageNum: 1, pageSize: 10, status: "" as string });
const orders = ref<AgentOrderVO[]>([]);
const orderTotal = ref(0);
async function loadOrders() {
  const res = await AgentAPI.pageOrders(orderQuery as any);
  orders.value = res.data;
  orderTotal.value = res.total;
}
type TagType = "primary" | "success" | "warning" | "info" | "danger";
const statusTag = (s: string): TagType =>
  (({ PENDING: "warning", PAID: "success", CLOSED: "info" }) as Record<string, TagType>)[s] ??
  "info";
const statusLabel = (s: string) =>
  (({ PENDING: "待支付", PAID: "已支付", CLOSED: "已关闭" }) as Record<string, string>)[s] ?? s;

// ===== 激活码 =====
const codeQuery = reactive<AgentCodePageQuery>({ pageNum: 1, pageSize: 10 });
const codes = ref<any[]>([]);
const codeTotal = ref(0);
const filteredOrderNo = ref("");
async function loadCodes() {
  const res = await AgentAPI.pageCodes(codeQuery);
  codes.value = res.data;
  codeTotal.value = res.total;
}
const codeStatusTag = (s: number): TagType =>
  (({ 0: "warning", 1: "success", 2: "info" }) as Record<number, TagType>)[s] ?? "info";
const codeStatusLabel = (s: number) =>
  (({ 0: "未使用", 1: "已使用", 2: "已过期" }) as Record<number, string>)[s] ?? "未知";

function viewCodes(orderNo: string, orderId: number) {
  codeQuery.orderId = orderId;
  filteredOrderNo.value = orderNo;
  tab.value = "codes";
  loadCodes();
}

function clearOrderFilter() {
  codeQuery.orderId = undefined;
  filteredOrderNo.value = "";
  loadCodes();
}

async function copyAllUnused() {
  const all = await AgentAPI.exportCodes(codeQuery.subjectId, 0);
  if (!all.length) {
    ElMessage.warning("当前没有可复制的未用激活码");
    return;
  }
  const text = all.map((c) => c.code).join("\n");
  await navigator.clipboard.writeText(text);
  ElMessage.success(`已复制 ${all.length} 个激活码`);
}

async function exportCodes() {
  const all = await AgentAPI.exportCodes(codeQuery.subjectId, codeQuery.status);
  if (!all.length) {
    ElMessage.warning("当前筛选条件下没有可导出的数据");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(
    all.map((c) => ({
      激活码: c.code,
      科目: c.subjectName || c.subjectNameEn || "",
      "科目(英文)": c.subjectName && c.subjectNameEn ? c.subjectNameEn : "",
      状态: codeStatusLabel(c.status),
      有效天数: c.validDays,
      使用人: c.usedByName ?? "",
      使用时间: c.usedAt ?? "",
      创建时间: c.createTime,
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "激活码");
  XLSX.writeFile(wb, `agent-codes-${Date.now()}.xlsx`);
  ElMessage.success(`已导出 ${all.length} 条`);
}

watch(tab, (v) => {
  if (v === "codes" && codes.value.length === 0) loadCodes();
});
onMounted(loadOrders);
</script>

<style scoped lang="scss">
.agent-orders {
  .ord-tabs {
    :deep(.el-tabs__item) {
      .tab-badge {
        margin-left: 6px;
        vertical-align: middle;
      }
    }
  }

  .toolbar {
    margin-bottom: 12px;
  }

  .mono {
    font-family: "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 12.5px;
  }

  .subject-cell {
    line-height: 1.4;

    .zh {
      color: var(--el-text-color-primary);
    }

    .en {
      margin-top: 2px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .code-cell {
    font-weight: 600;
    color: var(--el-color-primary);
    letter-spacing: 0.5px;
  }
}
</style>
