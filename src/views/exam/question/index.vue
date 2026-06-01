<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" class="toolbar-btn" @click="handleAdd">添加试题</el-button>
          <el-dropdown trigger="click">
            <el-button class="toolbar-btn">
              {{ currentTypeLabel }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  :class="{ 'is-active': queryParams.type === '' }"
                  @click="handleTypeFilter('')"
                >
                  全部题型
                </el-dropdown-item>
                <el-dropdown-item
                  :class="{ 'is-active': queryParams.type === 'SINGLE' }"
                  @click="handleTypeFilter('SINGLE')"
                >
                  单选题
                </el-dropdown-item>
                <el-dropdown-item
                  :class="{ 'is-active': queryParams.type === 'MULTIPLE' }"
                  @click="handleTypeFilter('MULTIPLE')"
                >
                  多选题
                </el-dropdown-item>
                <el-dropdown-item
                  :class="{ 'is-active': queryParams.type === 'JUDGE' }"
                  @click="handleTypeFilter('JUDGE')"
                >
                  判断题
                </el-dropdown-item>
                <el-dropdown-item
                  :class="{ 'is-active': queryParams.type === 'FILL_BLANK' }"
                  @click="handleTypeFilter('FILL_BLANK')"
                >
                  填空题
                </el-dropdown-item>
                <el-dropdown-item
                  :class="{ 'is-active': queryParams.type === 'SHORT_ANSWER' }"
                  @click="handleTypeFilter('SHORT_ANSWER')"
                >
                  简答题
                </el-dropdown-item>
                <el-dropdown-item
                  :class="{ 'is-active': queryParams.type === 'DRAG_MATCH' }"
                  @click="handleTypeFilter('DRAG_MATCH')"
                >
                  拖放题
                </el-dropdown-item>
                <el-dropdown-item
                  :class="{ 'is-active': queryParams.type === 'HOTSPOT' }"
                  @click="handleTypeFilter('HOTSPOT')"
                >
                  热点题
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown trigger="click">
            <el-button class="toolbar-btn">
              更多操作
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :disabled="ids.length === 0" @click="handleBatchChangeType">
                  批量更换题型
                </el-dropdown-item>
                <el-dropdown-item :disabled="ids.length === 0" @click="handleBatchEdit">
                  批量编辑
                </el-dropdown-item>
                <el-dropdown-item :disabled="ids.length === 0" @click="handleMoveQuestions">
                  移动题目
                </el-dropdown-item>
                <el-dropdown-item
                  :disabled="ids.length === 0"
                  class="delete-item"
                  @click="handleDelete()"
                >
                  批量删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button class="toolbar-btn" @click="handleQuery">试题查重</el-button>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="queryParams.keywords"
            placeholder="请输入内容"
            clearable
            style="width: 300px"
            @keyup.enter="handleQuery"
          >
            <template #suffix>
              <el-icon class="search-icon" @click="handleQuery"><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 试题表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        :border="false"
        row-key="id"
        class="question-table"
        :header-cell-style="{ background: '#f5f7fa', color: '#000', fontWeight: 'bold' }"
        :row-style="{ height: '60px' }"
        :cell-style="{ padding: '12px 0' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="question-detail-grid" :class="{ 'has-both-languages': hasBothLanguages() }">
              <!-- 左侧：中文内容 -->
              <div v-if="subjectSupportLanguages.includes('zh')" class="left-section">
                <!-- 案例背景（中文） -->
                <div v-if="row.isCase && row.caseContentZh" class="detail-block case-block">
                  <div class="block-label">案例背景</div>
                  <div class="block-content" v-html="row.caseContentZh"></div>
                </div>
                <!-- 中文题干 -->
                <div v-if="row.contentZh" class="detail-block">
                  <div class="block-label">题干</div>
                  <div class="block-content" v-html="row.contentZh"></div>
                </div>
                <!-- 中文选项 -->
                <div v-if="row.optionsZh && hasChoiceOptions(row.type)" class="detail-block">
                  <div class="options-list">
                    <div
                      v-for="option in parseOptions(row.optionsZh)"
                      :key="'zh-' + option.label"
                      class="option-item"
                    >
                      <span class="option-key">{{ option.label }}</span>
                      <span class="option-text" v-html="option.value"></span>
                    </div>
                  </div>
                </div>
                <div v-else-if="row.optionsZh && isHotspotType(row.type)" class="detail-block">
                  <div class="block-label">热点配置</div>
                  <div class="block-content">{{ formatHotspotOptionsSummary(row.optionsZh) }}</div>
                </div>
                <div v-else-if="row.optionsZh && isDragMatchType(row.type)" class="detail-block">
                  <div class="block-label">拖放配置</div>
                  <div class="block-content">
                    {{ formatDragMatchOptionsSummary(row.optionsZh) }}
                  </div>
                </div>
                <!-- 答案（中文区域总是显示） -->
                <div class="detail-block">
                  <div class="block-label">答案</div>
                  <!-- 简答题显示富文本答案 -->
                  <div
                    v-if="isTextAnswerType(row.type)"
                    class="block-content"
                    v-html="row.answer"
                  ></div>
                  <!-- 其他题型显示字母答案 -->
                  <div v-else class="block-content answer-content">{{ row.answer }}</div>
                </div>
                <!-- 中文解析 -->
                <div v-if="row.explanationZh" class="detail-block">
                  <div class="block-label">解析</div>
                  <div class="block-content" v-html="formatExplanation(row.explanationZh)"></div>
                </div>
              </div>

              <!-- 右侧：英文内容 -->
              <div v-if="subjectSupportLanguages.includes('en')" class="right-section">
                <!-- 案例背景（英文） -->
                <div v-if="row.isCase && row.caseContentEn" class="detail-block case-block">
                  <div class="block-label">Case Background</div>
                  <div class="block-content" v-html="row.caseContentEn"></div>
                </div>
                <!-- 英文题干 -->
                <div v-if="row.contentEn" class="detail-block">
                  <div class="block-label">Question</div>
                  <div class="block-content" v-html="row.contentEn"></div>
                </div>
                <!-- 英文选项 -->
                <div v-if="row.optionsEn && hasChoiceOptions(row.type)" class="detail-block">
                  <div class="options-list">
                    <div
                      v-for="option in parseOptions(row.optionsEn)"
                      :key="'en-' + option.label"
                      class="option-item"
                    >
                      <span class="option-key">{{ option.label }}</span>
                      <span class="option-text" v-html="option.value"></span>
                    </div>
                  </div>
                </div>
                <div v-else-if="row.optionsEn && isHotspotType(row.type)" class="detail-block">
                  <div class="block-label">Hotspot</div>
                  <div class="block-content">{{ formatHotspotOptionsSummary(row.optionsEn) }}</div>
                </div>
                <div v-else-if="row.optionsEn && isDragMatchType(row.type)" class="detail-block">
                  <div class="block-label">Drag Match</div>
                  <div class="block-content">
                    {{ formatDragMatchOptionsSummary(row.optionsEn) }}
                  </div>
                </div>
                <!-- 答案（英文区域） -->
                <div class="detail-block">
                  <div class="block-label">Answer</div>
                  <!-- 简答题显示富文本答案 -->
                  <div
                    v-if="isTextAnswerType(row.type)"
                    class="block-content"
                    v-html="row.answer"
                  ></div>
                  <!-- 其他题型显示字母答案 -->
                  <div v-else class="block-content answer-content">{{ row.answer }}</div>
                </div>
                <!-- 英文解析 -->
                <div v-if="row.explanationEn" class="detail-block">
                  <div class="block-label">Explanation</div>
                  <div class="block-content" v-html="formatExplanation(row.explanationEn)"></div>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="题型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getQuestionTypeColor(row.type) as any" size="small">
              {{ getQuestionTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="编号" prop="questionNumber" width="80" align="center" />
        <el-table-column label="题目" min-width="400">
          <template #default="{ row }">
            <div ref="contentPreviewRef" class="question-content-preview">
              <div v-if="row.isCase && (row.caseContentZh || row.caseContentEn)" class="case-badge">
                <el-tag type="warning" size="small" effect="plain">案例题</el-tag>
                <span
                  class="case-preview"
                  v-html="getContentPreview(row.caseContentZh || row.caseContentEn, 50)"
                ></span>
              </div>
              <div v-if="row.contentZh" v-html="getContentPreview(row.contentZh)"></div>
              <div
                v-if="row.contentEn"
                class="en-content"
                v-html="getContentPreview(row.contentEn)"
              ></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="答案" width="200" align="center">
          <template #default="{ row }">
            <!-- 简答题显示富文本答案预览 -->
            <div
              v-if="isTextAnswerType(row.type)"
              class="answer-preview"
              v-html="getContentPreview(row.answer)"
            ></div>
            <!-- 其他题型显示字母答案 -->
            <span v-else>{{ row.answer }}</span>
          </template>
        </el-table-column>
        <el-table-column label="编辑时间" width="200" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link class="action-btn" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link class="action-btn" @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="fetchData"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="1000px"
      class="question-dialog"
      @close="handleCloseDialog"
    >
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item label="试题类型" prop="type">
          <el-radio-group v-model="formData.type" @change="handleTypeChange">
            <el-radio label="SINGLE">单选题</el-radio>
            <el-radio label="MULTIPLE">多选题</el-radio>
            <el-radio label="JUDGE">判断题</el-radio>
            <el-radio label="FILL_BLANK">填空题</el-radio>
            <el-radio label="SHORT_ANSWER">简答题</el-radio>
            <el-radio label="DRAG_MATCH">拖放题</el-radio>
            <el-radio label="HOTSPOT">热点题</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 中英文内容切换标签页 -->
        <!-- 同时支持中英文时显示标签页 -->
        <el-tabs
          v-if="hasBothLanguagesForEdit()"
          v-model="activeLanguageTab"
          type="border-card"
          class="language-tabs"
        >
          <!-- 中文标签页 -->
          <el-tab-pane label="中文" name="zh">
            <el-form-item
              label="试题题目"
              :prop="subjectSupportLanguages.includes('zh') ? 'contentZh' : ''"
              :required="subjectSupportLanguages.includes('zh')"
            >
              <RichTextField v-model="formData.contentZh" />
            </el-form-item>

            <HotspotOptionsEditor
              v-if="formData.type === 'HOTSPOT'"
              ref="hotspotZhEditorRef"
              v-model="formData.optionsZh"
              v-model:answer="formData.answer"
            />

            <DragMatchOptionsEditor
              v-else-if="isDragMatchType(formData.type)"
              :key="`dm-zh-${formData.id ?? 'new'}-${formData.type}`"
              ref="dragMatchZhEditorRef"
              v-model="formData.optionsZh"
              v-model:answer="formData.answer"
            />

            <el-form-item
              v-else-if="hasChoiceOptions(formData.type)"
              label="试题选项"
              :prop="subjectSupportLanguages.includes('zh') ? 'optionsZh' : ''"
              :required="subjectSupportLanguages.includes('zh')"
            >
              <div class="options-editor">
                <div v-for="(option, index) in optionsList" :key="index" class="option-editor-item">
                  <span class="option-badge">{{ option.label }}</span>
                  <div class="option-editor">
                    <RichTextField v-model="option.value" min-height="60px" />
                  </div>
                  <el-button
                    v-if="optionsList.length > 2"
                    type="danger"
                    text
                    icon="Delete"
                    class="option-delete-btn"
                    @click="removeOption(index)"
                  >
                    删除
                  </el-button>
                </div>
                <el-button
                  class="add-option-btn"
                  type="primary"
                  plain
                  icon="Plus"
                  @click="addOption"
                >
                  添加选项
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="解析">
              <RichTextField v-model="formData.explanationZh" />
            </el-form-item>
          </el-tab-pane>

          <!-- 英文标签页 -->
          <el-tab-pane label="英文" name="en">
            <el-form-item
              label="试题题目"
              :prop="subjectSupportLanguages.includes('en') ? 'contentEn' : ''"
              :required="subjectSupportLanguages.includes('en')"
            >
              <RichTextField v-model="formData.contentEn" />
            </el-form-item>

            <el-alert
              v-if="formData.type === 'HOTSPOT' || isDragMatchType(formData.type)"
              type="info"
              :closable="false"
              show-icon
              class="specialized-editor-bilingual-hint"
              title="英文 Tab 须单独配置选项池/Tool 池与答案（结构与中文行数/槽位数一致）。"
            />

            <HotspotOptionsEditor
              v-if="formData.type === 'HOTSPOT'"
              ref="hotspotEnEditorRef"
              v-model="formData.optionsEn"
              v-model:answer="formData.answerEn"
            />

            <DragMatchOptionsEditor
              v-else-if="isDragMatchType(formData.type)"
              :key="`dm-en-${formData.id ?? 'new'}-${formData.type}`"
              ref="dragMatchEnEditorRef"
              v-model="formData.optionsEn"
              v-model:answer="formData.answerEn"
            />

            <el-form-item
              v-else-if="hasChoiceOptions(formData.type)"
              label="试题选项"
              :prop="subjectSupportLanguages.includes('en') ? 'optionsEn' : ''"
              :required="subjectSupportLanguages.includes('en')"
            >
              <div class="options-editor">
                <div
                  v-for="(option, index) in optionsListEn"
                  :key="index"
                  class="option-editor-item"
                >
                  <span class="option-badge">{{ option.label }}</span>
                  <div class="option-editor">
                    <RichTextField v-model="option.value" min-height="60px" />
                  </div>
                  <el-button
                    v-if="optionsListEn.length > 2"
                    type="danger"
                    text
                    icon="Delete"
                    class="option-delete-btn"
                    @click="removeOptionEn(index)"
                  >
                    删除
                  </el-button>
                </div>
                <el-button
                  class="add-option-btn"
                  type="primary"
                  plain
                  icon="Plus"
                  @click="addOptionEn"
                >
                  添加选项
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="解析">
              <RichTextField v-model="formData.explanationEn" />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>

        <!-- 单语言时直接显示内容，不使用标签页 -->
        <template v-else>
          <!-- 仅中文 -->
          <template v-if="subjectSupportLanguages.includes('zh')">
            <el-form-item label="试题题目" prop="contentZh" :required="true">
              <RichTextField v-model="formData.contentZh" />
            </el-form-item>

            <HotspotOptionsEditor
              v-if="formData.type === 'HOTSPOT'"
              ref="hotspotZhEditorRef"
              v-model="formData.optionsZh"
              v-model:answer="formData.answer"
            />

            <DragMatchOptionsEditor
              v-else-if="isDragMatchType(formData.type)"
              :key="`dm-zh-solo-${formData.id ?? 'new'}-${formData.type}`"
              ref="dragMatchZhEditorRef"
              v-model="formData.optionsZh"
              v-model:answer="formData.answer"
            />

            <el-form-item
              v-else-if="hasChoiceOptions(formData.type)"
              label="试题选项"
              prop="optionsZh"
              :required="true"
            >
              <div class="options-editor">
                <div v-for="(option, index) in optionsList" :key="index" class="option-editor-item">
                  <span class="option-badge">{{ option.label }}</span>
                  <div class="option-editor">
                    <RichTextField v-model="option.value" min-height="60px" />
                  </div>
                  <el-button
                    v-if="optionsList.length > 2"
                    type="danger"
                    text
                    icon="Delete"
                    class="option-delete-btn"
                    @click="removeOption(index)"
                  >
                    删除
                  </el-button>
                </div>
                <el-button
                  class="add-option-btn"
                  type="primary"
                  plain
                  icon="Plus"
                  @click="addOption"
                >
                  添加选项
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="解析">
              <RichTextField v-model="formData.explanationZh" />
            </el-form-item>
          </template>

          <!-- 仅英文 -->
          <template
            v-if="subjectSupportLanguages.includes('en') && !subjectSupportLanguages.includes('zh')"
          >
            <el-form-item label="Question" prop="contentEn" :required="true">
              <RichTextField v-model="formData.contentEn" />
            </el-form-item>

            <HotspotOptionsEditor
              v-if="formData.type === 'HOTSPOT'"
              ref="hotspotEnEditorRef"
              v-model="formData.optionsEn"
              v-model:answer="formData.answer"
            />

            <DragMatchOptionsEditor
              v-else-if="isDragMatchType(formData.type)"
              ref="dragMatchEnEditorRef"
              v-model="formData.optionsEn"
              v-model:answer="formData.answer"
            />

            <el-form-item
              v-else-if="hasChoiceOptions(formData.type)"
              label="Options"
              prop="optionsEn"
              :required="true"
            >
              <div class="options-editor">
                <div
                  v-for="(option, index) in optionsListEn"
                  :key="index"
                  class="option-editor-item"
                >
                  <span class="option-badge">{{ option.label }}</span>
                  <div class="option-editor">
                    <RichTextField v-model="option.value" min-height="60px" />
                  </div>
                  <el-button
                    v-if="optionsListEn.length > 2"
                    type="danger"
                    text
                    icon="Delete"
                    class="option-delete-btn"
                    @click="removeOptionEn(index)"
                  >
                    Delete
                  </el-button>
                </div>
                <el-button
                  class="add-option-btn"
                  type="primary"
                  plain
                  icon="Plus"
                  @click="addOptionEn"
                >
                  Add Option
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="Explanation">
              <RichTextField v-model="formData.explanationEn" />
            </el-form-item>
          </template>
        </template>

        <!-- 答案（通用；热点/拖放在专用编辑器内配置） -->
        <el-form-item
          v-if="formData.type !== 'HOTSPOT' && !isDragMatchType(formData.type)"
          label="答案"
          prop="answer"
        >
          <!-- 简答题使用富文本编辑器 -->
          <template v-if="isTextAnswerType(formData.type)">
            <RichTextField v-model="formData.answer" />
          </template>
          <!-- 填空题 -->
          <template v-else-if="formData.type === 'FILL_BLANK'">
            <el-input
              v-model="formData.answer"
              placeholder="请输入填空答案，多个空可用 | 分隔"
              clearable
            />
          </template>
          <!-- 单选题 -->
          <template v-else-if="formData.type === 'SINGLE'">
            <el-radio-group v-model="formData.answer">
              <el-radio v-for="option in optionsList" :key="option.label" :label="option.label">
                {{ option.label }}
              </el-radio>
            </el-radio-group>
          </template>
          <!-- 多选题 -->
          <template v-else-if="formData.type === 'MULTIPLE'">
            <el-checkbox-group v-model="multipleAnswers">
              <el-checkbox v-for="option in optionsList" :key="option.label" :label="option.label">
                {{ option.label }}
              </el-checkbox>
            </el-checkbox-group>
          </template>
          <!-- 判断题 -->
          <template v-else-if="formData.type === 'JUDGE'">
            <el-radio-group v-model="formData.answer">
              <el-radio label="A">正确</el-radio>
              <el-radio label="B">错误</el-radio>
            </el-radio-group>
          </template>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog">取 消</el-button>
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 移动题目对话框 -->
    <el-dialog v-model="moveDialogVisible" title="移动题目" width="450px" destroy-on-close>
      <div class="move-info">
        <p>
          已选择
          <strong>{{ ids.length }}</strong>
          道题目
        </p>
        <p class="move-hint">当前题号：{{ moveSelectedNumbers }}</p>
      </div>
      <el-form label-width="100px" style="margin-top: 16px">
        <el-form-item label="目标起始题号">
          <el-input-number
            v-model="moveTargetNumber"
            :min="1"
            :step="1"
            controls-position="right"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="">
          <div class="move-preview">
            移动后：题号 {{ moveTargetNumber }} ~
            {{ moveTargetNumber + ids.length - 1 }}，其余题目自动重新排序
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveDialogVisible = false"><b>取消</b></el-button>
        <el-button type="primary" :loading="moveLoading" @click="confirmMoveQuestions">
          <b>确认移动</b>
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import QuestionAPI, {
  type QuestionPageQuery,
  type QuestionVO,
  type QuestionForm,
} from "@/api/exam/question-api";
import SubjectAPI from "@/api/exam/subject-api";
import { formatDateTime } from "@/utils/datetime";
import RichTextField from "@/components/RichTextField/index.vue";
import HotspotOptionsEditor from "@/components/HotspotOptionsEditor/index.vue";
import DragMatchOptionsEditor from "@/components/DragMatchOptionsEditor/index.vue";
import {
  createDefaultDragMatchEditorState,
  editorStateToDragMatchOptionsJson,
  parseDragMatchOptions,
} from "@/utils/dragMatch";
import {
  createDefaultEditorState,
  editorStateToOptionsJson,
  parseHotspotOptions,
} from "@/utils/hotspot";
import {
  flushSpecializedEditor,
  resolveEditorRef,
  requiresLocalizedAnswerEn,
  validateDragMatchBilingualOptions,
  validateHotspotBilingualOptions,
  type SpecializedOptionsEditorExpose,
} from "@/utils/specializedQuestionEditor";
import {
  getQuestionTypeColor,
  getQuestionTypeLabel,
  normalizeQuestionTypeCode,
} from "@/utils/questionType";

defineOptions({
  name: "QuestionManagement",
  inheritAttrs: false,
});

const route = useRoute();
const router = useRouter();
const dataFormRef = ref();
const hotspotZhEditorRef = ref<SpecializedOptionsEditorExpose | null>(null);
const hotspotEnEditorRef = ref<SpecializedOptionsEditorExpose | null>(null);
const dragMatchZhEditorRef = ref<SpecializedOptionsEditorExpose | null>(null);
const dragMatchEnEditorRef = ref<SpecializedOptionsEditorExpose | null>(null);
const loading = ref(false);
const ids = ref<number[]>([]);
const total = ref(0);

const queryParams = reactive<QuestionPageQuery>({
  subjectId: route.query.subjectId as string,
  pageNum: 1,
  pageSize: 100,
});

const tableData = ref<QuestionVO[]>([]);

// 科目支持的语言（默认中文）
const subjectSupportLanguages = ref<string>("zh");

const dialog = reactive({
  title: "",
  visible: false,
});

// 当前激活的语言标签页
const activeLanguageTab = ref("zh");

const formData = reactive<QuestionForm>({
  type: "SINGLE",
});

// 选项列表（中文）
const optionsList = ref<{ label: string; value: string }[]>([
  { label: "A", value: "" },
  { label: "B", value: "" },
  { label: "C", value: "" },
  { label: "D", value: "" },
]);

// 选项列表（英文）
const optionsListEn = ref<{ label: string; value: string }[]>([
  { label: "A", value: "" },
  { label: "B", value: "" },
  { label: "C", value: "" },
  { label: "D", value: "" },
]);

// 多选题答案数组
const multipleAnswers = ref<string[]>([]);

// 当前选中的题型标签
const currentTypeLabel = computed(() => {
  const typeMap: Record<string, string> = {
    "": "全部题型",
    SINGLE: "单选题",
    MULTIPLE: "多选题",
    JUDGE: "判断题",
    FILL_BLANK: "填空题",
    SHORT_ANSWER: "简答题",
    DRAG_MATCH: "拖放题",
    HOTSPOT: "热点题",
  };
  return typeMap[queryParams.type || ""] || "全部题型";
});

/** 拖放题：options 为 JSON，答案为 pipe，不走 A/B/C 与富文本答案 */
function isDragMatchType(type?: string) {
  return normalizeQuestionTypeCode(type || "") === "DRAG_MATCH";
}

// 无选项的文本答案题型（简答）
function isTextAnswerType(type?: string) {
  return type === "SHORT_ANSWER";
}

function isNoChoiceOptionsType(type?: string) {
  return (
    isTextAnswerType(type) || type === "FILL_BLANK" || isHotspotType(type) || isDragMatchType(type)
  );
}

function isHotspotType(type?: string) {
  return type === "HOTSPOT";
}

/** 使用 A/B/C 选项编辑器的题型 */
function hasChoiceOptions(type?: string) {
  return (
    type !== "JUDGE" &&
    !isTextAnswerType(type) &&
    type !== "FILL_BLANK" &&
    !isHotspotType(type) &&
    !isDragMatchType(type)
  );
}

function formatHotspotOptionsSummary(optionsStr?: string): string {
  const opts = parseHotspotOptions(optionsStr);
  if (!opts) return "—";
  const mode =
    opts.interaction === "yesno"
      ? "判断"
      : opts.rows.every((r) => (r.items?.length ?? 0) > 0)
        ? "下拉·各行独立池"
        : "下拉·共享池";
  return `${mode}，${opts.rows.length} 行`;
}

function formatDragMatchOptionsSummary(optionsStr?: string): string {
  const opts = parseDragMatchOptions(optionsStr);
  if (!opts) return "—";
  return `Tool ${opts.items.length} 项，${opts.slots.length} 槽位`;
}

// 表单验证规则 - 根据科目支持的语言动态设置
const rules = computed(() => {
  const baseRules: any = {
    type: [{ required: true, message: "请选择题型", trigger: "change" }],
  };

  // 热点/拖放答案在专用编辑器内校验，不走通用 answer 表单项
  if (!isHotspotType(formData.type) && !isDragMatchType(formData.type)) {
    baseRules.answer = [{ required: true, message: "请选择答案", trigger: "change" }];
  }

  const languages = subjectSupportLanguages.value.split(",").filter(Boolean);

  // 根据支持的语言动态设置必填规则
  if (languages.includes("zh")) {
    baseRules.contentZh = [{ required: true, message: "请输入题目内容（中文）", trigger: "blur" }];
  }

  if (languages.includes("en")) {
    baseRules.contentEn = [{ required: true, message: "请输入题目内容（英文）", trigger: "blur" }];
  }

  return baseRules;
});

// 监听多选答案变化
watch(multipleAnswers, (newVal) => {
  if (formData.type === "MULTIPLE") {
    formData.answer = newVal.sort().join("");
  }
});

// 判断科目是否同时支持中英文
function hasBothLanguages(): boolean {
  const languages = subjectSupportLanguages.value.split(",").filter(Boolean);
  return languages.includes("zh") && languages.includes("en");
}

// 判断编辑对话框中科目是否同时支持中英文
function hasBothLanguagesForEdit(): boolean {
  const languages = subjectSupportLanguages.value.split(",").filter(Boolean);
  return languages.includes("zh") && languages.includes("en");
}

function getQuestionTypeText(type: string): string {
  return getQuestionTypeLabel(type);
}

// 解析选项JSON
function parseOptions(optionsStr: string): { label: string; value: string }[] {
  try {
    const parsed = JSON.parse(optionsStr);
    // 支持两种格式: {label, value} 和 {key, text}
    return parsed.map((opt: any) => ({
      label: opt.label || opt.key,
      value: opt.value || opt.text,
    }));
  } catch {
    return [];
  }
}

// 获取题目内容预览
function getContentPreview(content: string, overrideMaxLength?: number): string {
  if (!content) return "";
  const text = content.replace(/<[^>]+>/g, "");

  // 根据容器宽度动态计算显示字符数
  // 假设每个字符平均宽度为 14px，留一些边距
  const containerWidth = window.innerWidth;

  // 根据屏幕宽度计算适合的字符数
  let maxLength: number;
  if (containerWidth >= 1920) {
    maxLength = 100; // 超大屏幕
  } else if (containerWidth >= 1600) {
    maxLength = 80; // 大屏幕
  } else if (containerWidth >= 1366) {
    maxLength = 60; // 中屏幕
  } else if (containerWidth >= 1024) {
    maxLength = 40; // 小屏幕
  } else {
    maxLength = 30; // 超小屏幕
  }

  const finalMax = overrideMaxLength ?? maxLength;
  return text.length > finalMax ? text.substring(0, finalMax) + "..." : text;
}

// 格式化解析内容，将 \n 转换为 <br>，并处理代码块
function formatExplanation(content: string): string {
  if (!content) return "";

  // 首先处理 Markdown 风格的代码块（```language 和 ```）
  const markdownCodeBlockRegex = /```\w*\n([\s\S]*?)```/g;
  let hasMarkdownCode = false;

  content = content.replace(markdownCodeBlockRegex, (match, code) => {
    hasMarkdownCode = true;
    return "<pre><code>" + escapeHtml(code.trim()) + "</code></pre>";
  });

  // 如果已经处理了 Markdown 代码块，直接处理剩余的换行
  if (hasMarkdownCode) {
    return content
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed && !line.includes("<pre>") && !line.includes("</pre>")) {
          return "<p>" + line + "</p>";
        }
        return line;
      })
      .join("");
  }

  // 检测代码块：连续的包含 {、}、[ 等字符的行
  const lines = content.split("\n");
  let result = "";
  let inCodeBlock = false;
  let codeBlockContent = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 检测是否是代码行（包含 JSON/代码特征）
    const isCodeLine =
      /^[{[\]},":]+$|^\s*["={[}\],]+.*["={[}\],]+\s*$|^\s*".*"\s*[,:]*\s*$/.test(trimmedLine) ||
      trimmedLine.startsWith("{") ||
      trimmedLine.startsWith("}") ||
      trimmedLine.startsWith("[") ||
      trimmedLine.startsWith("]") ||
      /^\s*"[^"]+"\s*:\s*/.test(trimmedLine);

    if (isCodeLine && !inCodeBlock) {
      // 开始代码块
      inCodeBlock = true;
      codeBlockContent = line;
    } else if (isCodeLine && inCodeBlock) {
      // 继续代码块
      codeBlockContent += "\n" + line;
    } else if (!isCodeLine && inCodeBlock) {
      // 结束代码块
      result += "<pre><code>" + escapeHtml(codeBlockContent) + "</code></pre>";
      inCodeBlock = false;
      codeBlockContent = "";

      // 处理当前行
      if (trimmedLine) {
        result += "<p>" + line + "</p>";
      }
    } else {
      // 普通文本行
      if (trimmedLine) {
        result += "<p>" + line + "</p>";
      } else if (result && !result.endsWith("</p>")) {
        result += "<br>";
      }
    }
  }

  // 如果最后还在代码块中，关闭它
  if (inCodeBlock && codeBlockContent) {
    result += "<pre><code>" + escapeHtml(codeBlockContent) + "</code></pre>";
  }

  return (
    result ||
    content
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")
      .replace(/^(.*)$/, "<p>$1</p>")
  );
}

// HTML 转义函数
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 添加选项（中文）
function addOption() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nextKey = letters[optionsList.value.length];
  if (nextKey) {
    optionsList.value.push({ label: nextKey, value: "" });
  }
}

// 添加选项（英文）
function addOptionEn() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nextKey = letters[optionsListEn.value.length];
  if (nextKey) {
    optionsListEn.value.push({ label: nextKey, value: "" });
  }
}

// 删除选项（中文）
function removeOption(index: number) {
  optionsList.value.splice(index, 1);
  // 重新赋值标签
  optionsList.value.forEach((option, idx) => {
    option.label = String.fromCharCode(65 + idx);
  });
}

// 删除选项（英文）
function removeOptionEn(index: number) {
  optionsListEn.value.splice(index, 1);
  // 重新赋值标签
  optionsListEn.value.forEach((option, idx) => {
    option.label = String.fromCharCode(65 + idx);
  });
}

// 监听多选答案变化
watch(multipleAnswers, (newVal) => {
  formData.answer = newVal.sort().join("");
});

// 监听题型变化
function handleTypeChange() {
  // 重置答案
  formData.answer = "";
  multipleAnswers.value = [];

  // 简答题/填空题/拖放题/热点题不需要 A/B/C 选项
  if (isNoChoiceOptionsType(formData.type)) {
    optionsList.value = [];
    optionsListEn.value = [];
    if (isHotspotType(formData.type)) {
      const empty = editorStateToOptionsJson(createDefaultEditorState());
      formData.optionsZh = empty;
      formData.optionsEn = empty;
      formData.answer = "";
      formData.answerEn = "";
    } else if (isDragMatchType(formData.type)) {
      const empty = editorStateToDragMatchOptionsJson(createDefaultDragMatchEditorState());
      formData.optionsZh = empty;
      formData.optionsEn = empty;
      formData.answer = "";
      formData.answerEn = "";
    }
  }
  // 如果是判断题，重置选项
  else if (formData.type === "JUDGE") {
    optionsList.value = [
      { label: "A", value: "正确" },
      { label: "B", value: "错误" },
    ];
    optionsListEn.value = [
      { label: "A", value: "True" },
      { label: "B", value: "False" },
    ];
  } else if (optionsList.value.length === 0 || optionsList.value.length === 2) {
    // 从简答题或判断题切换回单选/多选，恢复默认选项
    optionsList.value = [
      { label: "A", value: "" },
      { label: "B", value: "" },
      { label: "C", value: "" },
      { label: "D", value: "" },
    ];
    optionsListEn.value = [
      { label: "A", value: "" },
      { label: "B", value: "" },
      { label: "C", value: "" },
      { label: "D", value: "" },
    ];
  }
}

// 获取数据
async function fetchData() {
  loading.value = true;
  try {
    const res = await QuestionAPI.getPage(queryParams);
    tableData.value = res.data || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

// 题型筛选
function handleTypeFilter(type: string) {
  queryParams.type = type;
  queryParams.pageNum = 1;
  fetchData();
}

// 批量更换题型
// ==================== 移动题目 ====================
const moveDialogVisible = ref(false);
const moveTargetNumber = ref(1);
const moveLoading = ref(false);

const moveSelectedNumbers = computed(() => {
  if (ids.value.length === 0) return "";
  const selected = tableData.value
    .filter((q: QuestionVO) => ids.value.includes(q.id))
    .map((q: QuestionVO) => q.questionNumber)
    .sort((a: number, b: number) => a - b);
  return selected.join(", ");
});

function handleMoveQuestions() {
  if (ids.value.length === 0) {
    ElMessage.warning("请选择要移动的题目");
    return;
  }
  // 默认目标题号为选中题目中最小的题号
  const selected = tableData.value
    .filter((q: QuestionVO) => ids.value.includes(q.id))
    .map((q: QuestionVO) => q.questionNumber);
  moveTargetNumber.value = Math.min(...selected);
  moveDialogVisible.value = true;
}

async function confirmMoveQuestions() {
  moveLoading.value = true;
  try {
    await QuestionAPI.moveQuestions(
      queryParams.subjectId,
      ids.value as number[],
      moveTargetNumber.value
    );
    ElMessage.success(
      `移动成功！${ids.value.length} 道题目已移至第 ${moveTargetNumber.value} 题开始`
    );
    moveDialogVisible.value = false;
    fetchData();
  } catch (error: any) {
    ElMessage.error(error.message || "移动失败");
  } finally {
    moveLoading.value = false;
  }
}

function handleBatchChangeType() {
  if (ids.value.length === 0) {
    ElMessage.warning("请选择要更换题型的试题");
    return;
  }
  // 跳转到批量编辑页面
  router.push({
    path: "/exam/question/batch-edit",
    query: {
      ids: ids.value.join(","),
      subjectId: queryParams.subjectId,
    },
  });
}

// 批量编辑
function handleBatchEdit() {
  if (ids.value.length === 0) {
    ElMessage.warning("请选择要编辑的试题");
    return;
  }
  // 跳转到批量编辑页面
  router.push({
    path: "/exam/question/batch-edit",
    query: {
      ids: ids.value.join(","),
      subjectId: queryParams.subjectId,
    },
  });
}

// 查询
function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}

// 选择改变
function handleSelectionChange(selection: QuestionVO[]) {
  ids.value = selection.map((item) => item.id);
}

// 新增
function handleAdd() {
  dialog.visible = true;
  dialog.title = "新增试题";
  resetForm();
}

// 编辑
async function handleEdit(row: QuestionVO) {
  dialog.visible = true;
  dialog.title = "编辑试题";

  const data = await QuestionAPI.getFormData(row.id);
  Object.assign(formData, data);
  if (data.type) {
    formData.type = normalizeQuestionTypeCode(data.type);
  }

  // 简答题/填空题/拖放题/热点题不需要 A/B/C 选项
  if (isNoChoiceOptionsType(data.type)) {
    optionsList.value = [];
    optionsListEn.value = [];
  } else {
    // 解析中文选项
    if (data.optionsZh) {
      optionsList.value = parseOptions(data.optionsZh);
    }

    // 解析英文选项
    if (data.optionsEn) {
      optionsListEn.value = parseOptions(data.optionsEn);
    } else {
      // 如果没有英文选项，初始化为与中文相同数量的空选项
      optionsListEn.value = optionsList.value.map((opt) => ({ label: opt.label, value: "" }));
    }
  }

  // 解析多选答案
  if (data.type === "MULTIPLE" && data.answer) {
    multipleAnswers.value = data.answer.split("");
  }
}

// 删除
function handleDelete(id?: number) {
  const delIds = id ? [id] : ids.value;
  if (delIds.length === 0) {
    ElMessage.warning("请选择要删除的试题");
    return;
  }

  // 检查科目ID
  if (!queryParams.subjectId) {
    ElMessage.error("缺少科目ID参数，无法删除试题");
    return;
  }

  const confirmMessage =
    delIds.length === 1 ? "确认删除该试题吗？" : `确认删除选中的 ${delIds.length} 道试题吗？`;

  ElMessageBox.confirm(confirmMessage, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    // 单个删除使用 DELETE 方法，批量删除使用 POST 方法
    const deletePromise =
      delIds.length === 1
        ? QuestionAPI.deleteById(delIds[0], queryParams.subjectId)
        : QuestionAPI.batchDelete(delIds, queryParams.subjectId);

    deletePromise.then(() => {
      ElMessage.success("删除成功");
      fetchData();
    });
  });
}

function validateBilingualSpecializedAnswers(): boolean {
  if (!requiresLocalizedAnswerEn(subjectSupportLanguages.value, formData.type)) {
    return true;
  }
  if (!formData.answer?.trim()) {
    ElMessage.warning("请在中文章节配置热点/拖放答案");
    return false;
  }
  if (!formData.answerEn?.trim()) {
    ElMessage.warning("请在英文章节配置热点/拖放答案");
    return false;
  }
  return true;
}

/** 提交前从专用编辑器 live state 刷入 formData（避免仅合法时才 v-model 回写） */
function applySpecializedEditorsFromForm(): boolean {
  const langs = subjectSupportLanguages.value.split(",").filter(Boolean);
  const enOnly = langs.includes("en") && !langs.includes("zh");

  if (isHotspotType(formData.type)) {
    const primaryRef = enOnly ? hotspotEnEditorRef : hotspotZhEditorRef;
    const flushed = flushSpecializedEditor(resolveEditorRef(primaryRef.value));
    if (!flushed) return false;
    const optionsZh = flushed.optionsJson;
    if (enOnly) {
      formData.optionsEn = optionsZh;
    } else {
      formData.optionsZh = optionsZh;
    }
    formData.answer = flushed.answer;

    if (hasBothLanguagesForEdit()) {
      const enEditor = resolveEditorRef(hotspotEnEditorRef.value);
      if (enEditor) {
        const enErr = enEditor.validate();
        if (enErr) {
          ElMessage.warning(enErr);
          return false;
        }
        const enSerialized = enEditor.serialize();
        formData.optionsEn = enSerialized.optionsJson;
        formData.answerEn = enSerialized.answer;
        const biErr = validateHotspotBilingualOptions(optionsZh, formData.optionsEn);
        if (biErr) {
          ElMessage.warning(biErr);
          return false;
        }
      }
    }
    return validateBilingualSpecializedAnswers();
  }

  if (isDragMatchType(formData.type)) {
    const primaryRef = enOnly ? dragMatchEnEditorRef : dragMatchZhEditorRef;
    const flushed = flushSpecializedEditor(resolveEditorRef(primaryRef.value));
    if (!flushed) return false;
    const optionsZh = flushed.optionsJson;
    if (enOnly) {
      formData.optionsEn = optionsZh;
    } else {
      formData.optionsZh = optionsZh;
    }
    formData.answer = flushed.answer;

    if (hasBothLanguagesForEdit()) {
      const enEditor = resolveEditorRef(dragMatchEnEditorRef.value);
      if (enEditor) {
        const enErr = enEditor.validate();
        if (enErr) {
          ElMessage.warning(enErr);
          return false;
        }
        const enSerialized = enEditor.serialize();
        formData.optionsEn = enSerialized.optionsJson;
        formData.answerEn = enSerialized.answer;
        const biErr = validateDragMatchBilingualOptions(optionsZh, formData.optionsEn);
        if (biErr) {
          ElMessage.warning(biErr);
          return false;
        }
      }
    }
    return validateBilingualSpecializedAnswers();
  }

  return true;
}

// 提交
function handleSubmit() {
  if (
    (isHotspotType(formData.type) || isDragMatchType(formData.type)) &&
    !applySpecializedEditorsFromForm()
  ) {
    return;
  }

  dataFormRef.value.validate((valid: boolean) => {
    if (!valid) return;

    // 简答题/填空题不需要 options；拖放/热点 options/answer 已由 applySpecializedEditorsFromForm 写入
    if (isTextAnswerType(formData.type) || formData.type === "FILL_BLANK") {
      formData.optionsZh = "[]";
      formData.optionsEn = "[]";
    } else if (formData.type === "JUDGE") {
      formData.optionsZh = JSON.stringify([
        { label: "A", value: "正确" },
        { label: "B", value: "错误" },
      ]);
      formData.optionsEn = JSON.stringify([
        { label: "A", value: "True" },
        { label: "B", value: "False" },
      ]);
    } else if (formData.type === "SINGLE" || formData.type === "MULTIPLE") {
      formData.optionsZh = JSON.stringify(optionsList.value);
      const hasEnglishOptions = optionsListEn.value.some((opt) => opt.value.trim() !== "");
      formData.optionsEn = hasEnglishOptions ? JSON.stringify(optionsListEn.value) : "";
    }

    formData.subjectId = queryParams.subjectId;

    const action = formData.id
      ? QuestionAPI.update(formData.id, formData)
      : QuestionAPI.create(formData);

    action.then(() => {
      ElMessage.success(formData.id ? "修改成功" : "新增成功");
      dialog.visible = false;
      fetchData();
    });
  });
}

// 关闭对话框
function handleCloseDialog() {
  dialog.visible = false;
  activeLanguageTab.value = "zh"; // 重置为中文标签页
  resetForm();
}

// 重置表单
function resetForm() {
  formData.id = undefined;
  formData.type = "SINGLE";
  formData.contentZh = "";
  formData.contentEn = "";
  formData.optionsZh = "";
  formData.optionsEn = "";
  formData.answer = "";
  formData.answerEn = "";
  formData.explanationZh = "";
  formData.explanationEn = "";

  optionsList.value = [
    { label: "A", value: "" },
    { label: "B", value: "" },
    { label: "C", value: "" },
    { label: "D", value: "" },
  ];

  optionsListEn.value = [
    { label: "A", value: "" },
    { label: "B", value: "" },
    { label: "C", value: "" },
    { label: "D", value: "" },
  ];

  multipleAnswers.value = [];

  if (dataFormRef.value) {
    dataFormRef.value.resetFields();
  }
}

onMounted(() => {
  if (!queryParams.subjectId) {
    ElMessage.error("缺少科目ID参数");
    return;
  }

  // 获取科目信息，以便确定支持的语言
  loadSubjectInfo();
  fetchData();

  // 监听窗口大小变化，重新渲染题目预览
  window.addEventListener("resize", handleResize);
});

// 加载科目信息
async function loadSubjectInfo() {
  try {
    const subjectInfo = await SubjectAPI.getFormData(queryParams.subjectId);
    subjectSupportLanguages.value = subjectInfo.supportLanguages || "zh"; // 默认支持中文
  } catch (error) {
    console.error("获取科目信息失败", error);
    subjectSupportLanguages.value = "zh"; // 失败时默认支持中文
  }
}

// 处理窗口大小变化
let resizeTimer: NodeJS.Timeout | null = null;
function handleResize() {
  // 使用防抖，避免频繁触发
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }
  resizeTimer = setTimeout(() => {
    // 强制重新渲染表格，触发 getContentPreview 重新计算
    const temp = tableData.value;
    tableData.value = [];
    nextTick(() => {
      tableData.value = temp;
    });
  }, 300);
}

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  margin-bottom: 16px;

  .toolbar-left {
    display: flex;
    gap: 12px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;

    .search-icon {
      cursor: pointer;
    }
  }

  .toolbar-btn {
    font-weight: bold;
  }
}

:deep(.el-dropdown-menu__item.is-active) {
  font-weight: bold;
  color: #409eff;
}

:deep(.el-dropdown-menu__item) {
  font-weight: bold;
}

:deep(.el-dropdown-menu__item.delete-item) {
  font-weight: bold;
  color: #f56c6c;

  &:not(.is-disabled):hover {
    color: #f56c6c;
    background-color: #fef0f0;
  }
}

.question-table {
  overflow: hidden;
  border: 1px solid #ebeef5;
  border-radius: 4px;

  :deep(.el-table__inner-wrapper) {
    &::before {
      display: none;
    }
  }

  :deep(.el-table__row) {
    border-bottom: 1px solid #ebeef5;
  }

  .action-btn {
    font-weight: bold;
  }
}

.question-detail-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  font-size: 14px;
  background-color: #f5f7fa;

  // 双列布局（中英文都有）
  &.has-both-languages {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;

    // 左侧中文内容加边框
    .left-section {
      padding-right: 24px;
      border-right: 2px solid #dcdfe6;
    }
  }

  .left-section,
  .right-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .divider {
    width: 100%;
    height: 1px;
    margin: 8px 0;
    background-color: #dcdfe6;
  }

  .detail-block {
    .block-label {
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #606266;
    }

    .case-block {
      padding: 10px 12px;
      background: #fff7e6;
      border-left: 3px solid #faad14;
      border-radius: 4px;
    }

    .block-content {
      max-width: 100%;
      overflow-x: auto;
      line-height: 1.8;
      color: #303133;
      word-wrap: break-word;
      overflow-wrap: break-word;

      &.answer-content {
        font-size: 15px;
        font-weight: 600;
        color: #409eff;
      }

      // 解析内容段落样式
      :deep(p) {
        margin: 8px 0;
        line-height: 1.8;
      }

      :deep(br) {
        display: block;
        margin: 4px 0;
      }

      // 代码块样式
      :deep(pre) {
        padding: 16px;
        margin: 12px 0;
        overflow-x: auto;
        font-family: "Courier New", "Consolas", monospace;
        font-size: 13px;
        line-height: 1.6;
        color: #333;
        background-color: #f6f8fa;
        border: 1px solid #e1e4e8;
        border-radius: 6px;

        code {
          padding: 0;
          font-family: inherit;
          font-size: inherit;
          color: inherit;
          background-color: transparent;
          border: none;
        }
      }

      :deep(code) {
        padding: 2px 6px;
        font-family: "Courier New", "Consolas", monospace;
        font-size: 90%;
        color: #d73a49;
        background-color: #f6f8fa;
        border-radius: 3px;
      }
    }
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .option-item {
      display: flex;
      align-items: baseline;

      .option-key {
        flex-shrink: 0;
        min-width: 20px;
        margin-right: 12px;
        font-weight: 500;
        color: #606266;
      }

      .option-text {
        flex: 1;
        line-height: 1.8;
        color: #303133;
        word-break: break-all;
        word-wrap: break-word;
      }
    }
  }
}

.question-content-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  word-break: break-all;
  white-space: normal;

  .en-content {
    padding-top: 4px;
    margin-top: 4px;
    font-size: 13px;
    color: #606266;
    border-top: 1px dashed #dcdfe6;
  }

  .case-badge {
    display: flex;
    gap: 6px;
    align-items: center;
    padding-bottom: 4px;
    margin-bottom: 4px;
    border-bottom: 1px dashed #faad14;

    .case-preview {
      font-size: 12px;
      color: #e6a23c;
    }
  }
}

// 移动题目对话框
.move-info {
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
  background: #f5f7fa;
  border-radius: 6px;

  p {
    margin: 0;
  }

  .move-hint {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
  }
}

.move-preview {
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
}

// 简答题答案预览样式
.answer-preview {
  display: -webkit-box;
  max-height: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 3;
  line-height: 1.6;
  color: #606266;
  text-align: left;
  overflow-wrap: break-word;
  -webkit-box-orient: vertical;

  :deep(p) {
    margin: 4px 0;
  }
}

.options-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.option-editor-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
  padding: 12px 14px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--el-border-color);
  }

  .option-badge {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-top: 4px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 6px;
  }

  .option-editor {
    flex: 1;
    min-width: 0;
  }

  .option-delete-btn {
    flex-shrink: 0;
    margin-top: 6px;
  }
}

.add-option-btn {
  align-self: flex-start;
  margin-top: 4px;
}

.specialized-editor-bilingual-hint {
  margin-bottom: 12px;
}

.question-dialog {
  :deep(.el-form-item__content) {
    flex: 1;
    min-width: 0;
    max-width: 100%;
    overflow: visible;
  }

  :deep(.el-tabs__content) {
    overflow: visible;
  }

  :deep(.wang-editor-wrap),
  :deep(.rtf-root) {
    max-width: 100%;
  }

  :deep(.w-e-text-container [data-slate-editor] img),
  :deep(.rtf-preview-html img),
  :deep(.block-content img) {
    display: block;
    width: auto !important;
    max-width: 100% !important;
    height: auto !important;
  }

  :deep(.el-dialog__header) {
    padding: 16px 20px;
    margin-right: 0;
    border-bottom: 1px solid #e4e7ed;
  }

  :deep(.el-dialog__body) {
    padding: 20px;
    overflow-x: hidden;
  }

  :deep(.el-dialog__footer) {
    padding: 12px 20px;
    border-top: 1px solid #e4e7ed;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;

    .el-button {
      font-weight: bold;
    }
  }

  // 语言标签页样式
  .language-tabs {
    margin-top: 16px;

    :deep(.el-tabs__item) {
      font-size: 15px;
      font-weight: 500;

      &.is-active {
        font-weight: 700;
      }
    }
  }
}
</style>
