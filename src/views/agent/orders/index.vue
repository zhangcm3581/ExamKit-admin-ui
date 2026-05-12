<template>
  <div class="app-container">
    <el-tabs v-model="tab">
      <el-tab-pane label="订单记录" name="orders">
        <el-form inline :model="orderQuery">
          <el-form-item label="状态">
            <el-select
              v-model="orderQuery.status"
              clearable
              placeholder="全部"
              style="width: 120px"
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
        <el-table :data="orders" border>
          <el-table-column prop="orderNo" label="订单号" width="220" />
          <el-table-column prop="subjectName" label="科目" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="unitPriceYuan" label="单价(¥)" width="100" />
          <el-table-column prop="totalYuan" label="总额(¥)" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column prop="paidAt" label="支付时间" width="180" />
          <el-table-column label="操作" width="120">
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

      <el-tab-pane label="激活码" name="codes">
        <el-form inline :model="codeQuery">
          <el-form-item label="状态">
            <el-select v-model="codeQuery.status" clearable placeholder="全部" style="width: 120px">
              <el-option label="未使用" :value="0" />
              <el-option label="已使用" :value="1" />
              <el-option label="已过期" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="订单号">
            <el-input v-model="codeOrderNoFilter" clearable placeholder="可选" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadCodes">查询</el-button>
            <el-button @click="copyAllUnused">一键复制全部未用</el-button>
            <el-button @click="exportCodes">导出 Excel</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="codes" border>
          <el-table-column prop="code" label="激活码" width="160" />
          <el-table-column prop="subjectName" label="科目" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="codeStatusTag(row.status)">{{ codeStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="validDays" label="有效天数" width="100" />
          <el-table-column prop="usedByName" label="使用人" width="160" />
          <el-table-column prop="usedAt" label="使用时间" width="180" />
          <el-table-column prop="createTime" label="创建时间" width="180" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import * as XLSX from "xlsx";
import AgentAPI, { type AgentOrderVO, type AgentCodePageQuery } from "@/api/agent-api";

const tab = ref<"orders" | "codes">("orders");

// 订单
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

// 激活码
const codeQuery = reactive<AgentCodePageQuery>({ pageNum: 1, pageSize: 10 });
const codeOrderNoFilter = ref("");
const codes = ref<any[]>([]);
const codeTotal = ref(0);
async function loadCodes() {
  const res = await AgentAPI.pageCodes(codeQuery);
  codes.value = res.data;
  codeTotal.value = res.total;
}
const codeStatusTag = (s: number): TagType =>
  (({ 0: "warning", 1: "success", 2: "info" }) as Record<number, TagType>)[s] ?? "info";
const codeStatusLabel = (s: number) =>
  (({ 0: "未使用", 1: "已使用", 2: "已过期" }) as Record<number, string>)[s] ?? "未知";

function viewCodes(_orderNo: string, orderId: number) {
  codeQuery.orderId = orderId;
  tab.value = "codes";
  loadCodes();
}

async function copyAllUnused() {
  const all = await AgentAPI.exportCodes(codeQuery.subjectId, 0);
  const text = all.map((c) => c.code).join("\n");
  await navigator.clipboard.writeText(text);
  ElMessage.success(`已复制 ${all.length} 个激活码`);
}

async function exportCodes() {
  const all = await AgentAPI.exportCodes(codeQuery.subjectId, codeQuery.status);
  const ws = XLSX.utils.json_to_sheet(
    all.map((c) => ({
      激活码: c.code,
      科目: c.subjectName,
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
}

watch(tab, (v) => {
  if (v === "codes" && codes.value.length === 0) loadCodes();
});
onMounted(loadOrders);
</script>
