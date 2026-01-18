<template>
  <div class="batch-edit-container">
    <el-card>
      <!-- 顶部操作栏 -->
      <div class="header-toolbar">
        <el-button type="primary" @click="handleSave">保存修改</el-button>
        <el-button type="warning" @click="showBatchChangeTypeDialog">批量更换题型</el-button>
        <el-button @click="handleCancel">取消</el-button>
      </div>

      <!-- 批量编辑表格 -->
      <el-table :data="tableData" border stripe class="batch-edit-table">
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column label="题型" width="100" align="center">
          <template #default="{ row }">
            <el-select v-model="row.type" size="small" @change="handleTypeChange(row)">
              <el-option label="单选题" value="SINGLE" />
              <el-option label="多选题" value="MULTIPLE" />
              <el-option label="判断题" value="JUDGE" />
              <el-option label="简答题" value="SHORT_ANSWER" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="题干" min-width="400">
          <template #default="{ row }">
            <!-- 只有中文 -->
            <div v-if="row.hasZh && !row.hasEn">
              <div class="lang-label">中文</div>
              <el-input
                v-model="row.contentZh"
                type="textarea"
                :rows="2"
                placeholder="请输入题干（中文）"
              />
            </div>
            <!-- 只有英文 -->
            <div v-else-if="!row.hasZh && row.hasEn">
              <div class="lang-label">English</div>
              <el-input
                v-model="row.contentEn"
                type="textarea"
                :rows="2"
                placeholder="Please input question (English)"
              />
            </div>
            <!-- 中英文都有 -->
            <div v-else class="dual-lang">
              <div class="lang-section">
                <div class="lang-label">中文</div>
                <el-input
                  v-model="row.contentZh"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入题干（中文）"
                />
              </div>
              <div class="lang-section" style="margin-top: 8px">
                <div class="lang-label">English</div>
                <el-input
                  v-model="row.contentEn"
                  type="textarea"
                  :rows="2"
                  placeholder="Please input question (English)"
                />
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="选项A" min-width="250">
          <template #default="{ row }">
            <template v-if="row.type !== 'JUDGE' && row.type !== 'SHORT_ANSWER'">
              <!-- 只有中文 -->
              <div v-if="row.hasZh && !row.hasEn">
                <div class="lang-label">中文</div>
                <el-input
                  v-model="row.optionA"
                  type="textarea"
                  :rows="2"
                  placeholder="选项A"
                  size="small"
                />
              </div>
              <!-- 只有英文 -->
              <div v-else-if="!row.hasZh && row.hasEn">
                <div class="lang-label">English</div>
                <el-input
                  v-model="row.optionA_en"
                  type="textarea"
                  :rows="2"
                  placeholder="Option A"
                  size="small"
                />
              </div>
              <!-- 中英文都有 -->
              <div v-else class="dual-lang">
                <div class="lang-section">
                  <div class="lang-label">中文</div>
                  <el-input
                    v-model="row.optionA"
                    type="textarea"
                    :rows="2"
                    placeholder="选项A"
                    size="small"
                  />
                </div>
                <div class="lang-section" style="margin-top: 4px">
                  <div class="lang-label">English</div>
                  <el-input
                    v-model="row.optionA_en"
                    type="textarea"
                    :rows="2"
                    placeholder="Option A"
                    size="small"
                  />
                </div>
              </div>
            </template>
            <span v-else-if="row.type === 'JUDGE'" class="judge-option">正确</span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="选项B" min-width="250">
          <template #default="{ row }">
            <template v-if="row.type !== 'JUDGE' && row.type !== 'SHORT_ANSWER'">
              <!-- 只有中文 -->
              <div v-if="row.hasZh && !row.hasEn">
                <div class="lang-label">中文</div>
                <el-input
                  v-model="row.optionB"
                  type="textarea"
                  :rows="2"
                  placeholder="选项B"
                  size="small"
                />
              </div>
              <!-- 只有英文 -->
              <div v-else-if="!row.hasZh && row.hasEn">
                <div class="lang-label">English</div>
                <el-input
                  v-model="row.optionB_en"
                  type="textarea"
                  :rows="2"
                  placeholder="Option B"
                  size="small"
                />
              </div>
              <!-- 中英文都有 -->
              <div v-else class="dual-lang">
                <div class="lang-section">
                  <div class="lang-label">中文</div>
                  <el-input
                    v-model="row.optionB"
                    type="textarea"
                    :rows="2"
                    placeholder="选项B"
                    size="small"
                  />
                </div>
                <div class="lang-section" style="margin-top: 4px">
                  <div class="lang-label">English</div>
                  <el-input
                    v-model="row.optionB_en"
                    type="textarea"
                    :rows="2"
                    placeholder="Option B"
                    size="small"
                  />
                </div>
              </div>
            </template>
            <span v-else-if="row.type === 'JUDGE'" class="judge-option">错误</span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="选项C" min-width="250">
          <template #default="{ row }">
            <template
              v-if="
                (row.type === 'SINGLE' || row.type === 'MULTIPLE') && row.type !== 'SHORT_ANSWER'
              "
            >
              <!-- 只有中文 -->
              <div v-if="row.hasZh && !row.hasEn">
                <div class="lang-label">中文</div>
                <el-input
                  v-model="row.optionC"
                  type="textarea"
                  :rows="2"
                  placeholder="选项C"
                  size="small"
                />
              </div>
              <!-- 只有英文 -->
              <div v-else-if="!row.hasZh && row.hasEn">
                <div class="lang-label">English</div>
                <el-input
                  v-model="row.optionC_en"
                  type="textarea"
                  :rows="2"
                  placeholder="Option C"
                  size="small"
                />
              </div>
              <!-- 中英文都有 -->
              <div v-else class="dual-lang">
                <div class="lang-section">
                  <div class="lang-label">中文</div>
                  <el-input
                    v-model="row.optionC"
                    type="textarea"
                    :rows="2"
                    placeholder="选项C"
                    size="small"
                  />
                </div>
                <div class="lang-section" style="margin-top: 4px">
                  <div class="lang-label">English</div>
                  <el-input
                    v-model="row.optionC_en"
                    type="textarea"
                    :rows="2"
                    placeholder="Option C"
                    size="small"
                  />
                </div>
              </div>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="选项D" min-width="250">
          <template #default="{ row }">
            <template v-if="row.type === 'SINGLE' || row.type === 'MULTIPLE'">
              <!-- 只有中文 -->
              <div v-if="row.hasZh && !row.hasEn">
                <div class="lang-label">中文</div>
                <el-input
                  v-model="row.optionD"
                  type="textarea"
                  :rows="2"
                  placeholder="选项D"
                  size="small"
                />
              </div>
              <!-- 只有英文 -->
              <div v-else-if="!row.hasZh && row.hasEn">
                <div class="lang-label">English</div>
                <el-input
                  v-model="row.optionD_en"
                  type="textarea"
                  :rows="2"
                  placeholder="Option D"
                  size="small"
                />
              </div>
              <!-- 中英文都有 -->
              <div v-else class="dual-lang">
                <div class="lang-section">
                  <div class="lang-label">中文</div>
                  <el-input
                    v-model="row.optionD"
                    type="textarea"
                    :rows="2"
                    placeholder="选项D"
                    size="small"
                  />
                </div>
                <div class="lang-section" style="margin-top: 4px">
                  <div class="lang-label">English</div>
                  <el-input
                    v-model="row.optionD_en"
                    type="textarea"
                    :rows="2"
                    placeholder="Option D"
                    size="small"
                  />
                </div>
              </div>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="选项E" min-width="250">
          <template #default="{ row }">
            <template v-if="row.type === 'SINGLE' || row.type === 'MULTIPLE'">
              <!-- 只有中文 -->
              <div v-if="row.hasZh && !row.hasEn">
                <div class="lang-label">中文</div>
                <el-input
                  v-model="row.optionE"
                  type="textarea"
                  :rows="2"
                  placeholder="选项E（可选）"
                  size="small"
                />
              </div>
              <!-- 只有英文 -->
              <div v-else-if="!row.hasZh && row.hasEn">
                <div class="lang-label">English</div>
                <el-input
                  v-model="row.optionE_en"
                  type="textarea"
                  :rows="2"
                  placeholder="Option E (optional)"
                  size="small"
                />
              </div>
              <!-- 中英文都有 -->
              <div v-else class="dual-lang">
                <div class="lang-section">
                  <div class="lang-label">中文</div>
                  <el-input
                    v-model="row.optionE"
                    type="textarea"
                    :rows="2"
                    placeholder="选项E（可选）"
                    size="small"
                  />
                </div>
                <div class="lang-section" style="margin-top: 4px">
                  <div class="lang-label">English</div>
                  <el-input
                    v-model="row.optionE_en"
                    type="textarea"
                    :rows="2"
                    placeholder="Option E (optional)"
                    size="small"
                  />
                </div>
              </div>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="选项F" min-width="250">
          <template #default="{ row }">
            <template v-if="row.type === 'SINGLE' || row.type === 'MULTIPLE'">
              <!-- 只有中文 -->
              <div v-if="row.hasZh && !row.hasEn">
                <div class="lang-label">中文</div>
                <el-input
                  v-model="row.optionF"
                  type="textarea"
                  :rows="2"
                  placeholder="选项F（可选）"
                  size="small"
                />
              </div>
              <!-- 只有英文 -->
              <div v-else-if="!row.hasZh && row.hasEn">
                <div class="lang-label">English</div>
                <el-input
                  v-model="row.optionF_en"
                  type="textarea"
                  :rows="2"
                  placeholder="Option F (optional)"
                  size="small"
                />
              </div>
              <!-- 中英文都有 -->
              <div v-else class="dual-lang">
                <div class="lang-section">
                  <div class="lang-label">中文</div>
                  <el-input
                    v-model="row.optionF"
                    type="textarea"
                    :rows="2"
                    placeholder="选项F（可选）"
                    size="small"
                  />
                </div>
                <div class="lang-section" style="margin-top: 4px">
                  <div class="lang-label">English</div>
                  <el-input
                    v-model="row.optionF_en"
                    type="textarea"
                    :rows="2"
                    placeholder="Option F (optional)"
                    size="small"
                  />
                </div>
              </div>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="选项G" min-width="250">
          <template #default="{ row }">
            <template v-if="row.type === 'SINGLE' || row.type === 'MULTIPLE'">
              <!-- 只有中文 -->
              <div v-if="row.hasZh && !row.hasEn">
                <div class="lang-label">中文</div>
                <el-input
                  v-model="row.optionG"
                  type="textarea"
                  :rows="2"
                  placeholder="选项G（可选）"
                  size="small"
                />
              </div>
              <!-- 只有英文 -->
              <div v-else-if="!row.hasZh && row.hasEn">
                <div class="lang-label">English</div>
                <el-input
                  v-model="row.optionG_en"
                  type="textarea"
                  :rows="2"
                  placeholder="Option G (optional)"
                  size="small"
                />
              </div>
              <!-- 中英文都有 -->
              <div v-else class="dual-lang">
                <div class="lang-section">
                  <div class="lang-label">中文</div>
                  <el-input
                    v-model="row.optionG"
                    type="textarea"
                    :rows="2"
                    placeholder="选项G（可选）"
                    size="small"
                  />
                </div>
                <div class="lang-section" style="margin-top: 4px">
                  <div class="lang-label">English</div>
                  <el-input
                    v-model="row.optionG_en"
                    type="textarea"
                    :rows="2"
                    placeholder="Option G (optional)"
                    size="small"
                  />
                </div>
              </div>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="选项H" min-width="250">
          <template #default="{ row }">
            <template v-if="row.type === 'SINGLE' || row.type === 'MULTIPLE'">
              <!-- 只有中文 -->
              <div v-if="row.hasZh && !row.hasEn">
                <div class="lang-label">中文</div>
                <el-input
                  v-model="row.optionH"
                  type="textarea"
                  :rows="2"
                  placeholder="选项H（可选）"
                  size="small"
                />
              </div>
              <!-- 只有英文 -->
              <div v-else-if="!row.hasZh && row.hasEn">
                <div class="lang-label">English</div>
                <el-input
                  v-model="row.optionH_en"
                  type="textarea"
                  :rows="2"
                  placeholder="Option H (optional)"
                  size="small"
                />
              </div>
              <!-- 中英文都有 -->
              <div v-else class="dual-lang">
                <div class="lang-section">
                  <div class="lang-label">中文</div>
                  <el-input
                    v-model="row.optionH"
                    type="textarea"
                    :rows="2"
                    placeholder="选项H（可选）"
                    size="small"
                  />
                </div>
                <div class="lang-section" style="margin-top: 4px">
                  <div class="lang-label">English</div>
                  <el-input
                    v-model="row.optionH_en"
                    type="textarea"
                    :rows="2"
                    placeholder="Option H (optional)"
                    size="small"
                  />
                </div>
              </div>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="正确答案" width="200" align="center">
          <template #default="{ row }">
            <!-- 简答题使用多行文本框 -->
            <el-input
              v-if="row.type === 'SHORT_ANSWER'"
              v-model="row.answer"
              type="textarea"
              :rows="3"
              placeholder="请输入简答题答案"
              size="small"
            />
            <!-- 其他题型使用单行输入 -->
            <el-input
              v-else
              v-model="row.answer"
              placeholder="如：A 或 ABC"
              size="small"
              maxlength="8"
            />
          </template>
        </el-table-column>

        <el-table-column label="解析" min-width="400">
          <template #default="{ row }">
            <!-- 只有中文 -->
            <div v-if="row.hasZh && !row.hasEn">
              <div class="lang-label">中文</div>
              <el-input
                v-model="row.explanationZh"
                type="textarea"
                :rows="2"
                placeholder="请输入解析（可选）"
              />
            </div>
            <!-- 只有英文 -->
            <div v-else-if="!row.hasZh && row.hasEn">
              <div class="lang-label">English</div>
              <el-input
                v-model="row.explanationEn"
                type="textarea"
                :rows="2"
                placeholder="Please input explanation (optional)"
              />
            </div>
            <!-- 中英文都有 -->
            <div v-else class="dual-lang">
              <div class="lang-section">
                <div class="lang-label">中文</div>
                <el-input
                  v-model="row.explanationZh"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入解析（可选）"
                />
              </div>
              <div class="lang-section" style="margin-top: 8px">
                <div class="lang-label">English</div>
                <el-input
                  v-model="row.explanationEn"
                  type="textarea"
                  :rows="2"
                  placeholder="Please input explanation (optional)"
                />
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 批量更换题型对话框 -->
    <el-dialog v-model="batchChangeTypeVisible" title="选择题型" width="400px">
      <el-select v-model="selectedType" placeholder="请选择题型" style="width: 100%" size="large">
        <el-option label="单选题" value="SINGLE" />
        <el-option label="多选题" value="MULTIPLE" />
        <el-option label="判断题" value="JUDGE" />
        <el-option label="简答题" value="SHORT_ANSWER" />
      </el-select>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchChangeTypeVisible = false">取消</el-button>
          <el-button type="primary" @click="handleBatchChangeType">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import QuestionAPI from "@/api/exam/question-api";

defineOptions({
  name: "QuestionBatchEdit",
  inheritAttrs: false,
});

const route = useRoute();
const router = useRouter();

interface EditRow {
  id: number;
  type: string;
  contentZh: string;
  contentEn: string;
  optionA: string;
  optionA_en: string;
  optionB: string;
  optionB_en: string;
  optionC: string;
  optionC_en: string;
  optionD: string;
  optionD_en: string;
  optionE: string;
  optionE_en: string;
  optionF: string;
  optionF_en: string;
  optionG: string;
  optionG_en: string;
  optionH: string;
  optionH_en: string;
  answer: string;
  explanationZh: string;
  explanationEn: string;
  subjectId: string;
  hasZh: boolean;
  hasEn: boolean;
}

const tableData = ref<EditRow[]>([]);
const subjectId = ref<string>("");
const batchChangeTypeVisible = ref(false);
const selectedType = ref<string>("");

onMounted(() => {
  const ids = route.query.ids as string;
  subjectId.value = route.query.subjectId as string;

  if (!ids || !subjectId.value) {
    ElMessage.error("参数错误");
    router.back();
    return;
  }

  loadQuestions(ids.split(",").map(Number));
});

// 加载题目数据
async function loadQuestions(ids: number[]) {
  try {
    const promises = ids.map((id) => QuestionAPI.getFormData(id));
    const results = await Promise.all(promises);

    tableData.value = results.map((data) => {
      // 简答题不需要解析选项
      const optionsZh = data.type === "SHORT_ANSWER" ? [] : parseOptions(data.optionsZh);
      const optionsEn = data.type === "SHORT_ANSWER" ? [] : parseOptions(data.optionsEn);

      // 检测题目实际拥有的语言
      const hasZh = !!(data.contentZh && stripHtml(data.contentZh).trim());
      const hasEn = !!(data.contentEn && stripHtml(data.contentEn).trim());

      return {
        id: data.id,
        type: data.type,
        contentZh: stripHtml(data.contentZh),
        contentEn: stripHtml(data.contentEn),
        optionA: optionsZh[0]?.value || "",
        optionA_en: optionsEn[0]?.value || "",
        optionB: optionsZh[1]?.value || "",
        optionB_en: optionsEn[1]?.value || "",
        optionC: optionsZh[2]?.value || "",
        optionC_en: optionsEn[2]?.value || "",
        optionD: optionsZh[3]?.value || "",
        optionD_en: optionsEn[3]?.value || "",
        optionE: optionsZh[4]?.value || "",
        optionE_en: optionsEn[4]?.value || "",
        optionF: optionsZh[5]?.value || "",
        optionF_en: optionsEn[5]?.value || "",
        optionG: optionsZh[6]?.value || "",
        optionG_en: optionsEn[6]?.value || "",
        optionH: optionsZh[7]?.value || "",
        optionH_en: optionsEn[7]?.value || "",
        answer: data.answer,
        explanationZh: stripHtml(data.explanationZh),
        explanationEn: stripHtml(data.explanationEn),
        subjectId: data.subjectId,
        hasZh,
        hasEn,
      };
    });
  } catch (error) {
    ElMessage.error("加载题目失败");
    console.error(error);
  }
}

// 解析选项
function parseOptions(optionsStr: string): { label: string; value: string }[] {
  try {
    return JSON.parse(optionsStr || "[]");
  } catch {
    return [];
  }
}

// 去除HTML标签
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "");
}

// 题型改变
function handleTypeChange(row: EditRow) {
  if (row.type === "JUDGE") {
    row.optionA = "正确";
    row.optionA_en = "True";
    row.optionB = "错误";
    row.optionB_en = "False";
    row.optionC = "";
    row.optionC_en = "";
    row.optionD = "";
    row.optionD_en = "";
    row.optionE = "";
    row.optionE_en = "";
    row.optionF = "";
    row.optionF_en = "";
    row.optionG = "";
    row.optionG_en = "";
    row.optionH = "";
    row.optionH_en = "";
    row.answer = "A";
  } else if (row.type === "SHORT_ANSWER") {
    // 简答题清空所有选项
    row.optionA = "";
    row.optionA_en = "";
    row.optionB = "";
    row.optionB_en = "";
    row.optionC = "";
    row.optionC_en = "";
    row.optionD = "";
    row.optionD_en = "";
    row.optionE = "";
    row.optionE_en = "";
    row.optionF = "";
    row.optionF_en = "";
    row.optionG = "";
    row.optionG_en = "";
    row.optionH = "";
    row.optionH_en = "";
    row.answer = "";
  } else {
    // 单选或多选题，清空答案让用户重新输入
    row.answer = "";
  }
}

// 显示批量更换题型对话框
function showBatchChangeTypeDialog() {
  selectedType.value = "";
  batchChangeTypeVisible.value = true;
}

// 批量更换题型
async function handleBatchChangeType() {
  if (!selectedType.value) {
    ElMessage.warning("请选择题型");
    return;
  }

  try {
    // 直接调用API更换题型
    const ids = tableData.value.map((row) => row.id);
    await QuestionAPI.batchChangeType(ids, selectedType.value);

    batchChangeTypeVisible.value = false;
    ElMessage.success(`已将所有题目更换为${getTypeLabel(selectedType.value)}`);

    // 返回上一页
    router.back();
  } catch (error) {
    ElMessage.error("批量更换题型失败");
    console.error(error);
  }
}

// 获取题型标签
function getTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    SINGLE: "单选题",
    MULTIPLE: "多选题",
    JUDGE: "判断题",
    SHORT_ANSWER: "简答题",
  };
  return typeMap[type] || type;
}

// 保存修改
async function handleSave() {
  try {
    // 验证数据
    for (let i = 0; i < tableData.value.length; i++) {
      const row = tableData.value[i];

      // 验证至少有一种语言的题干
      const hasContent = (row.hasZh && row.contentZh.trim()) || (row.hasEn && row.contentEn.trim());
      if (!hasContent) {
        ElMessage.error(`第 ${i + 1} 题的题干不能为空`);
        return;
      }

      // 简答题不需要验证选项
      if (row.type !== "JUDGE" && row.type !== "SHORT_ANSWER") {
        // 如果有中文，验证中文选项
        if (row.hasZh) {
          if (!row.optionA.trim() || !row.optionB.trim()) {
            ElMessage.error(`第 ${i + 1} 题的中文选项至少需要两个`);
            return;
          }
        }
        // 如果有英文，验证英文选项
        if (row.hasEn) {
          if (!row.optionA_en.trim() || !row.optionB_en.trim()) {
            ElMessage.error(`第 ${i + 1} 题的英文选项至少需要两个`);
            return;
          }
        }
      }

      if (!row.answer || !row.answer.trim()) {
        ElMessage.error(`第 ${i + 1} 题请输入答案`);
        return;
      }

      // 非简答题验证答案格式
      if (row.type !== "SHORT_ANSWER") {
        const answerPattern = /^[A-H]+$/;
        if (!answerPattern.test(row.answer.toUpperCase())) {
          ElMessage.error(`第 ${i + 1} 题答案格式错误，请输入A-H的字母组合（如：A 或 ABC）`);
          return;
        }
      }
    }

    // 构建更新请求
    const questions = tableData.value.map((row) => {
      const updateData: any = {
        id: row.id,
        type: row.type,
        subjectId: row.subjectId,
      };

      // 设置中文内容（如果有）
      if (row.hasZh && row.contentZh.trim()) {
        updateData.contentZh = `<p>${row.contentZh}</p>`;
      }

      // 设置英文内容（如果有）
      if (row.hasEn && row.contentEn.trim()) {
        updateData.contentEn = `<p>${row.contentEn}</p>`;
      }

      // 简答题不需要选项
      if (row.type === "SHORT_ANSWER") {
        updateData.optionsZh = "[]";
        updateData.optionsEn = "[]";
        updateData.answer = row.answer; // 简答题答案为完整文本
      } else {
        // 其他题型需要选项
        // 构建中文选项
        const optionsZh = [];
        if (row.hasZh) {
          if (row.optionA) optionsZh.push({ label: "A", value: row.optionA });
          if (row.optionB) optionsZh.push({ label: "B", value: row.optionB });
          if (row.optionC) optionsZh.push({ label: "C", value: row.optionC });
          if (row.optionD) optionsZh.push({ label: "D", value: row.optionD });
          if (row.optionE) optionsZh.push({ label: "E", value: row.optionE });
          if (row.optionF) optionsZh.push({ label: "F", value: row.optionF });
          if (row.optionG) optionsZh.push({ label: "G", value: row.optionG });
          if (row.optionH) optionsZh.push({ label: "H", value: row.optionH });
        }

        // 构建英文选项
        const optionsEn = [];
        if (row.hasEn) {
          if (row.optionA_en) optionsEn.push({ label: "A", value: row.optionA_en });
          if (row.optionB_en) optionsEn.push({ label: "B", value: row.optionB_en });
          if (row.optionC_en) optionsEn.push({ label: "C", value: row.optionC_en });
          if (row.optionD_en) optionsEn.push({ label: "D", value: row.optionD_en });
          if (row.optionE_en) optionsEn.push({ label: "E", value: row.optionE_en });
          if (row.optionF_en) optionsEn.push({ label: "F", value: row.optionF_en });
          if (row.optionG_en) optionsEn.push({ label: "G", value: row.optionG_en });
          if (row.optionH_en) optionsEn.push({ label: "H", value: row.optionH_en });
        }

        updateData.optionsZh = JSON.stringify(optionsZh);
        updateData.optionsEn = JSON.stringify(optionsEn);
        updateData.answer = row.answer.toUpperCase();
      }

      // 设置中文解析（如果有）
      if (row.hasZh && row.explanationZh && row.explanationZh.trim()) {
        updateData.explanationZh = `<p>${row.explanationZh}</p>`;
      }

      // 设置英文解析（如果有）
      if (row.hasEn && row.explanationEn && row.explanationEn.trim()) {
        updateData.explanationEn = `<p>${row.explanationEn}</p>`;
      }

      return updateData;
    });

    await QuestionAPI.batchUpdate(questions);
    ElMessage.success("批量更新成功");
    router.back();
  } catch (error) {
    ElMessage.error("批量更新失败");
    console.error(error);
  }
}

// 取消
function handleCancel() {
  ElMessageBox.confirm("确认取消编辑吗？未保存的修改将丢失", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    router.back();
  });
}
</script>

<style scoped lang="scss">
.batch-edit-container {
  padding: 20px;
}

.header-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  :deep(.el-button) {
    font-weight: bold;
  }
}

.batch-edit-table {
  :deep(.el-table__header) {
    th {
      font-weight: bold;
      color: #000;
      background-color: #f5f7fa;
    }
  }

  :deep(.el-input__inner) {
    font-size: 13px;
  }

  :deep(.el-textarea__inner) {
    font-size: 13px;
  }

  .judge-option {
    font-size: 13px;
    color: #909399;
  }
}

// 语言标签样式
.lang-label {
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
}

.dual-lang {
  .lang-section {
    .lang-label {
      margin-bottom: 4px;
      font-size: 12px;
      font-weight: 600;
      color: #606266;
    }
  }
}

// 批量更换题型对话框样式
:deep(.el-dialog) {
  .el-dialog__header {
    padding: 16px 20px 12px;
    margin-right: 0;
    border-bottom: 1px solid #e8eaec;

    .el-dialog__title {
      font-size: 16px;
      font-weight: 600;
      line-height: 24px;
      color: #303133;
    }

    .el-dialog__headerbtn {
      top: 16px;
      right: 20px;
      width: 24px;
      height: 24px;
      font-size: 16px;
      line-height: 24px;
    }
  }

  .el-dialog__body {
    padding: 24px 20px;
  }

  .el-dialog__footer {
    padding: 15px 20px 20px;
    border-top: 1px solid #e8eaec;
  }

  .el-select {
    .el-input__wrapper {
      font-size: 16px;
    }
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;

    .el-button {
      font-weight: bold;
    }
  }
}
</style>
