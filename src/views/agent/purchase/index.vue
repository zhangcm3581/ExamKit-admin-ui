<template>
  <div class="app-container">
    <el-card>
      <h3>购买激活码</h3>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        style="max-width: 600px"
      >
        <el-form-item label="科目" prop="subjectId">
          <el-select
            v-model="form.subjectId"
            placeholder="请选择科目"
            filterable
            style="width: 100%"
            @change="onSubjectChange"
          >
            <el-option
              v-for="s in subjects"
              :key="s.subjectId"
              :label="`${s.subjectName} - 原价 ¥${s.originalPriceYuan} / 你的单价 ¥${s.agentUnitPriceYuan}`"
              :value="s.subjectId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="form.quantity" :min="1" :max="1000" />
          <span style="margin-left: 12px; color: #909399">合计：¥{{ totalYuan }}</span>
        </el-form-item>
        <el-form-item label="有效天数" prop="validDays">
          <el-input-number v-model="form.validDays" :min="30" :max="730" :step="30" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">立即购买</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-dialog
      v-model="payDialogVisible"
      title="微信扫码支付"
      width="380px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div style="text-align: center">
        <canvas ref="qrcodeCanvas" />
        <p>订单号：{{ payInfo?.orderNo }}</p>
        <p>
          金额：
          <strong>¥{{ payInfo?.totalYuan }}</strong>
        </p>
        <p>
          剩余时间：
          <strong style="color: #f56c6c">{{ countdownText }}</strong>
        </p>
        <p style=" font-size: 12px;color: #909399">{{ statusHint }}</p>
      </div>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, type FormRules } from "element-plus";
import QRCode from "qrcode";
import AgentAPI, { type AgentSubjectOption, type AgentOrderCreateResponse } from "@/api/agent-api";

const router = useRouter();
const subjects = ref<AgentSubjectOption[]>([]);
const formRef = ref();
const form = reactive({ subjectId: "", quantity: 10, validDays: 365, remark: "" });
const rules: FormRules = {
  subjectId: [{ required: true, message: "请选择科目", trigger: "change" }],
  quantity: [{ required: true, type: "number", message: "请填写数量", trigger: "blur" }],
  validDays: [{ required: true, type: "number", message: "请填写有效天数", trigger: "blur" }],
};
const selectedSubject = computed(() => subjects.value.find((s) => s.subjectId === form.subjectId));
const totalYuan = computed(() =>
  selectedSubject.value ? selectedSubject.value.agentUnitPriceYuan * form.quantity : 0
);

const submitting = ref(false);
const payDialogVisible = ref(false);
const payInfo = ref<AgentOrderCreateResponse | null>(null);
const qrcodeCanvas = ref<HTMLCanvasElement>();
const countdownSec = ref(0);
const statusHint = ref("等待扫码支付...");
let pollTimer: number | null = null;
let countdownTimer: number | null = null;

const countdownText = computed(() => {
  const m = Math.floor(countdownSec.value / 60)
    .toString()
    .padStart(2, "0");
  const s = (countdownSec.value % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
});

onMounted(async () => {
  subjects.value = await AgentAPI.listSubjects();
});

onUnmounted(() => {
  stopTimers();
});

function onSubjectChange() {}

async function submit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const resp = await AgentAPI.createOrder({ ...form });
    payInfo.value = resp;
    payDialogVisible.value = true;
    await nextTick();
    await QRCode.toCanvas(qrcodeCanvas.value!, resp.codeUrl, { width: 240 });
    startCountdown(new Date(resp.expiresAt).getTime());
    startPolling(resp.orderNo);
  } catch (e: any) {
    ElMessage.error(e?.message || "创建订单失败");
  } finally {
    submitting.value = false;
  }
}

function startCountdown(expiresAtMs: number) {
  countdownSec.value = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
  countdownTimer = window.setInterval(() => {
    countdownSec.value -= 1;
    if (countdownSec.value <= 0) {
      stopTimers();
      statusHint.value = "订单已超时，请重新下单";
    }
  }, 1000);
}

function startPolling(orderNo: string) {
  pollTimer = window.setInterval(async () => {
    try {
      const status = await AgentAPI.getOrderStatus(orderNo);
      if (status.status === "PAID") {
        stopTimers();
        payDialogVisible.value = false;
        ElMessage.success(`购买成功，已生成 ${status.generatedCount ?? form.quantity} 个激活码`);
        router.push("/agent/orders");
      } else if (status.status === "CLOSED") {
        stopTimers();
        statusHint.value = "订单已关闭";
      }
    } catch {
      // ignore polling errors; keep retrying until status resolves or dialog closes
    }
  }, 2000);
}

function stopTimers() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

async function closeDialog() {
  await ElMessageBox.confirm("确定取消支付？订单将在超时后自动关闭。", "提示", { type: "warning" });
  stopTimers();
  payDialogVisible.value = false;
}
</script>
