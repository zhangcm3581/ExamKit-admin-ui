<template>
  <div class="app-container agent-purchase">
    <el-row :gutter="16">
      <!-- 左：表单 -->
      <el-col :xs="24" :md="15" :lg="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">购买激活码</span>
              <span class="subtitle">选择科目、设置数量与有效期，扫码支付后系统自动生成激活码</span>
            </div>
          </template>
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="90px"
            @submit.prevent="submit"
          >
            <el-form-item label="科目" prop="subjectId">
              <el-select
                v-model="form.subjectId"
                placeholder="搜索/选择题库科目"
                filterable
                :filter-method="filterSubject"
                style="width: 100%"
              >
                <el-option
                  v-for="s in subjects"
                  :key="s.subjectId"
                  :label="s.subjectName"
                  :value="s.subjectId"
                >
                  <div class="subject-option">
                    <span class="subject-name">{{ s.subjectName }}</span>
                    <span class="subject-price">
                      <span class="original">¥{{ s.originalPriceYuan }}</span>
                      <span class="agent">¥{{ s.agentUnitPriceYuan }}</span>
                    </span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="数量" prop="quantity">
              <el-input-number v-model="form.quantity" :min="1" :max="1000" />
              <span class="hint">每次最多 1000 个</span>
            </el-form-item>

            <el-form-item label="有效天数" prop="validDays">
              <el-input-number v-model="form.validDays" :min="30" :max="730" :step="30" />
              <span class="hint">激活后开始计算（30 ~ 730 天）</span>
            </el-form-item>

            <el-form-item label="备注">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="2"
                maxlength="255"
                show-word-limit
                placeholder="可选，给自己看的标记"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="submitting"
                :disabled="!selectedSubject"
                @click="submit"
              >
                立即购买
                <template v-if="totalYuan">
                  <el-divider direction="vertical" />
                  ¥{{ totalYuan }}
                </template>
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右：订单摘要 -->
      <el-col :xs="24" :md="9" :lg="8">
        <el-card shadow="never" class="summary-card">
          <template #header>
            <span class="title">订单摘要</span>
          </template>

          <div v-if="!selectedSubject" class="empty">
            <el-icon class="empty-icon"><ShoppingCart /></el-icon>
            <p>请先选择科目</p>
          </div>

          <template v-else>
            <div class="summary-row">
              <span class="label">科目</span>
              <span class="value">{{ selectedSubject.subjectName }}</span>
            </div>
            <div class="summary-row">
              <span class="label">单价</span>
              <span class="value">
                <span class="strike">¥{{ selectedSubject.originalPriceYuan }}</span>
                <span class="now">¥{{ selectedSubject.agentUnitPriceYuan }}</span>
              </span>
            </div>
            <div class="summary-row">
              <span class="label">数量</span>
              <span class="value">× {{ form.quantity }}</span>
            </div>
            <div class="summary-row">
              <span class="label">有效期</span>
              <span class="value">{{ form.validDays }} 天</span>
            </div>

            <el-divider class="thin" />

            <div class="summary-row total">
              <span class="label">应付</span>
              <span class="value">¥{{ totalYuan }}</span>
            </div>

            <div class="meta">
              <el-tag size="small" type="success" effect="plain">折扣 {{ discountRate }}%</el-tag>
              <span class="saved">为你省 ¥{{ savedYuan }}</span>
            </div>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <!-- 微信扫码支付弹窗 -->
    <el-dialog
      v-model="payDialogVisible"
      title="微信扫码支付"
      width="380px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="qrcode-wrap">
        <img v-if="qrcodeDataUrl" :src="qrcodeDataUrl" alt="支付二维码" class="qrcode-img" />
        <p class="line">
          订单号
          <span class="mono">{{ payInfo?.orderNo }}</span>
        </p>
        <p class="line">
          金额
          <strong class="amount">¥{{ payInfo?.totalYuan }}</strong>
        </p>
        <p class="line">
          剩余时间
          <strong class="countdown">{{ countdownText }}</strong>
        </p>
        <p class="status-hint">{{ statusHint }}</p>
      </div>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, type FormRules } from "element-plus";
import { ShoppingCart } from "@element-plus/icons-vue";
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
const savedYuan = computed(() =>
  selectedSubject.value
    ? (selectedSubject.value.originalPriceYuan - selectedSubject.value.agentUnitPriceYuan) *
      form.quantity
    : 0
);
const discountRate = computed(() => {
  if (!selectedSubject.value || !selectedSubject.value.originalPriceYuan) return 0;
  const rate =
    (selectedSubject.value.agentUnitPriceYuan / selectedSubject.value.originalPriceYuan) * 100;
  return Math.round(rate * 100) / 100;
});

// el-select filterable 用 filter-method 控制搜索字段，避免被 label 限制
function filterSubject(query: string) {
  // el-select 默认按 label 过滤；这里手动做的话需要管控显示集
  // 为简化保持默认 label 过滤即可；占位以保留 hook
  return query;
}

const submitting = ref(false);
const payDialogVisible = ref(false);
const payInfo = ref<AgentOrderCreateResponse | null>(null);
const qrcodeDataUrl = ref<string>("");
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

async function submit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const resp = await AgentAPI.createOrder({ ...form });
    try {
      qrcodeDataUrl.value = await QRCode.toDataURL(resp.codeUrl, { width: 240 });
    } catch (qrErr) {
      console.error("QR render failed", qrErr);
      ElMessage.error("二维码生成失败，请重试");
      return;
    }
    payInfo.value = resp;
    payDialogVisible.value = true;
    statusHint.value = "等待扫码支付...";
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
  let consecutiveErrors = 0;
  pollTimer = window.setInterval(async () => {
    try {
      const status = await AgentAPI.getOrderStatus(orderNo);
      consecutiveErrors = 0;
      if (status.status === "PAID") {
        stopTimers();
        payDialogVisible.value = false;
        ElMessage.success(`购买成功，已生成 ${status.generatedCount ?? form.quantity} 个激活码`);
        router.push("/agent/orders");
      } else if (status.status === "CLOSED") {
        stopTimers();
        statusHint.value = "订单已关闭";
      }
    } catch (e) {
      consecutiveErrors += 1;
      console.warn("订单状态查询失败", consecutiveErrors, e);
      if (consecutiveErrors >= 5) {
        stopTimers();
        statusHint.value = "状态查询失败，请刷新页面或稍后到「我的订单」页查看";
      }
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
  qrcodeDataUrl.value = "";
  payDialogVisible.value = false;
}
</script>

<style scoped lang="scss">
.agent-purchase {
  .card-header {
    display: flex;
    gap: 12px;
    align-items: baseline;

    .title {
      font-size: 16px;
      font-weight: 600;
    }

    .subtitle {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .hint {
    margin-left: 12px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  /* 科目下拉两行布局 */
  .subject-option {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 4px 0;

    .subject-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 13px;
      line-height: 1.3;
      color: var(--el-text-color-primary);
      white-space: nowrap;
    }

    .subject-price {
      display: inline-flex;
      gap: 8px;
      align-items: baseline;
      font-size: 12px;

      .original {
        color: var(--el-text-color-placeholder);
        text-decoration: line-through;
      }

      .agent {
        font-weight: 600;
        color: var(--el-color-danger);
      }
    }
  }

  /* 摘要卡 */
  .summary-card {
    position: sticky;
    top: 16px;

    .title {
      font-size: 15px;
      font-weight: 600;
    }

    .empty {
      padding: 32px 0;
      color: var(--el-text-color-placeholder);
      text-align: center;

      .empty-icon {
        font-size: 36px;
        color: var(--el-color-info-light-5);
      }

      p {
        margin: 8px 0 0;
        font-size: 13px;
      }
    }

    .summary-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;

      .label {
        color: var(--el-text-color-secondary);
      }

      .value {
        max-width: 65%;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--el-text-color-primary);
        white-space: nowrap;
      }

      .strike {
        margin-right: 6px;
        color: var(--el-text-color-placeholder);
        text-decoration: line-through;
      }

      .now {
        font-weight: 600;
        color: var(--el-color-danger);
      }

      &.total {
        padding: 12px 0 4px;

        .label {
          font-size: 14px;
          color: var(--el-text-color-primary);
        }

        .value {
          font-size: 22px;
          font-weight: 700;
          color: var(--el-color-danger);
        }
      }
    }

    .thin {
      margin: 8px 0;
    }

    .meta {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 8px;

      .saved {
        font-size: 12px;
        color: var(--el-color-success);
      }
    }
  }

  /* 支付弹窗 */
  .qrcode-wrap {
    text-align: center;

    .qrcode-img {
      width: 240px;
      height: 240px;
      margin-bottom: 8px;
    }

    .line {
      margin: 4px 0;
      font-size: 13px;
      color: var(--el-text-color-secondary);

      .mono {
        font-family: "SFMono-Regular", Menlo, monospace;
        font-size: 12px;
        color: var(--el-text-color-primary);
      }

      .amount {
        font-size: 18px;
        color: var(--el-color-danger);
      }

      .countdown {
        color: var(--el-color-warning);
      }
    }

    .status-hint {
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }
}
</style>
