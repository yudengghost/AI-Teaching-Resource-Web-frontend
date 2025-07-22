<template>
  <div class="exam-organization-container">
    <!-- 筛选区域 -->
    <a-card class="filter-card">
      <template #title>
        <h2 class="card-title">试卷组装</h2>
      </template>

      <a-form :model="filterForm" layout="horizontal">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item field="questionType" label="类型">
              <a-select
                v-model="filterForm.questionType"
                placeholder="全部类型"
                allow-clear
              >
                <a-option value="单选题">单选题</a-option>
                <a-option value="多选题">多选题</a-option>
                <a-option value="简答题">简答题</a-option>
                <a-option value="应用题">应用题</a-option>
                <a-option value="论述题">论述题</a-option>
                <a-option value="计算题">计算题</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item field="difficulty" label="难度">
              <a-select
                v-model="filterForm.difficulty"
                placeholder="全部难度"
                allow-clear
              >
                <a-option value="入门">入门</a-option>
                <a-option value="简单">简单</a-option>
                <a-option value="中等">中等</a-option>
                <a-option value="困难">困难</a-option>
                <a-option value="极难">极难</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item field="subject" label="主题">
              <a-input v-model="filterForm.subject" placeholder="搜索主题" allow-clear />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-space>
              <a-button type="primary" @click="fetchQuestions(1)">查询</a-button>
              <a-button @click="resetFilter">重置</a-button>
            </a-space>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 题目列表和已选题目区域 -->
    <div class="exam-content">
      <!-- 可选题目列表 -->
      <a-card class="question-list-card">
        <template #title>
          <div class="title-with-actions">
            <span>可选题目</span>
            <div class="action-buttons">
              <a-button type="text" @click="addSelectedToExam" :disabled="!hasSelectedQuestions">
                添加到试卷
              </a-button>
              <a-button type="text" @click="handleSelectAll">
                {{ isAllSelected ? '取消全选' : '全选' }}
              </a-button>
            </div>
          </div>
        </template>

        <a-table
          :data="questions"
          :loading="loading"
          :pagination="false"
          row-key="id"
          v-model:selectedKeys="selectedRowKeys"
          :row-selection="rowSelection"
        >
          <template #columns>
            <a-table-column title="主题" data-index="subject" :ellipsis="true" :tooltip="true"/>
            <a-table-column title="类型" data-index="type" :width="100">
              <template #cell="{ record }">
                <a-tag>{{ record.type }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="难度" data-index="level" :width="100">
              <template #cell="{ record }">
                <a-tag :color="getDifficultyColor(record.level)">{{ record.level }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="操作" :width="120">
              <template #cell="{ record }">
                <a-button type="text" @click="viewQuestionDetail(record)">查看详情</a-button>
              </template>
            </a-table-column>
          </template>
        </a-table>

        <div class="pagination-container">
          <a-pagination
            :total="total"
            :current="current"
            :page-size="size"
            show-total
            show-jumper
            @change="handlePageChange"
          />
        </div>
      </a-card>

      <!-- 已选题目 -->
      <a-card class="selected-questions-card">
        <template #title>
          <div class="title-with-actions">
            <span>已选题目 ({{ examQuestions.length }})</span>
            <div class="action-buttons">
              <a-button type="primary" @click="previewExam" :disabled="examQuestions.length === 0">
                预览试卷
              </a-button>
              <a-button type="primary" status="success" @click="downloadExam" :disabled="examQuestions.length === 0">
                下载试卷
              </a-button>
              <a-button type="primary" status="warning" @click="downloadAnswers" :disabled="examQuestions.length === 0">
                下载答案
              </a-button>
            </div>
          </div>
        </template>

        <div v-if="examQuestions.length === 0" class="empty-exam">
          <a-empty description="暂无已选题目" />
        </div>

        <a-collapse v-else>
          <a-collapse-item v-for="(group, type) in groupedExamQuestions" :key="type" :header="`${type} (${group.length}题)`">
            <a-list>
              <a-list-item v-for="(item, index) in group" :key="item.id">
                <div class="selected-question-item">
                  <span class="selected-question-index">{{ index + 1 }}. {{ item.subject }}</span>
                  <a-space>
                    <a-button type="text" size="small" @click="viewQuestionDetail(item)">查看</a-button>
                    <a-button type="text" size="small" status="danger" @click="removeFromExam(item)">删除</a-button>
                  </a-space>
                </div>
              </a-list-item>
            </a-list>
          </a-collapse-item>
        </a-collapse>

        <!-- 试卷信息设置 -->
        <div class="exam-info-form" v-show="examQuestions.length > 0">
          <h3>试卷信息</h3>
          <a-form :model="examInfo">
            <a-form-item field="title" label="试卷标题">
              <a-input v-model="examInfo.title" placeholder="请输入试卷标题" />
            </a-form-item>
            <a-form-item field="description" label="试卷说明">
              <a-textarea v-model="examInfo.description" placeholder="请输入试卷说明" />
            </a-form-item>
          </a-form>
        </div>
      </a-card>
    </div>

    <!-- 题目详情对话框 -->
    <a-modal
      v-model:visible="detailVisible"
      title="题目详情"
      :footer="false"
      :mask-closable="true"
      :width="800"
    >
      <div class="question-detail">
        <div class="detail-header">
          <div class="detail-meta">
            <a-tag>{{ currentQuestion.type }}</a-tag>
            <a-tag :color="getDifficultyColor(currentQuestion.level)">{{ currentQuestion.level }}</a-tag>
          </div>
          <h3 class="detail-subject">{{ currentQuestion.subject }}</h3>
        </div>
        <div class="detail-content" v-html="formattedContent"></div>
      </div>
    </a-modal>

    <!-- 试卷预览对话框 -->
    <a-modal
      v-model:visible="previewVisible"
      title="试卷预览"
      :footer="false"
      :mask-closable="true"
      :width="900"
    >
      <div class="exam-preview">
        <h1 class="exam-title">{{ examInfo.title || '未命名试卷' }}</h1>
        <div class="exam-description" v-if="examInfo.description">
          {{ examInfo.description }}
        </div>

                  <div v-for="(group, type) in groupedExamQuestions" :key="type" class="exam-section">
          <h2 class="section-title">{{ type }}</h2>
          <div v-for="(question, index) in group" :key="question.id" class="preview-question">
            <h3 class="question-number">{{ index + 1 }}. {{ question.subject }}</h3>
            <div class="question-content" v-html="formatContent(extractQuestionParts(question.content).questionText)"></div>
          </div>
        </div>

                  <div class="preview-actions">
            <a-button type="primary" @click="downloadExam">下载试卷</a-button>
            <a-button type="primary" status="warning" @click="downloadAnswers" style="margin-left: 12px;">下载答案</a-button>
          </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { marked } from 'marked';

interface Question {
  id: string;
  subject: string;
  type: string;
  level: string;
  content: string;
  createTime?: string;
  username?: string;
}

interface ExamInfo {
  title: string;
  description: string;
}

// 过滤表单
const filterForm = reactive({
  questionType: '',
  difficulty: '',
  subject: ''
});

// 分页参数
const size = ref(10);
const current = ref(1);
const total = ref(0);

// 数据相关
const questions = ref<Question[]>([]);
const loading = ref(false);
const selectedRowKeys = ref<string[]>([]);
const examQuestions = ref<Question[]>([]);

// 详情对话框
const detailVisible = ref(false);
const currentQuestion = ref<Question>({
  id: '',
  subject: '',
  type: '',
  level: '',
  content: '',
});

// 试卷预览对话框
const previewVisible = ref(false);

// 试卷信息
const examInfo = reactive<ExamInfo>({
  title: '',
  description: ''
});

// 格式化Markdown内容
const formattedContent = computed(() => {
  if (!currentQuestion.value.content) return '';
  const result = marked.parse(currentQuestion.value.content);
  return typeof result === 'string' ? result : '';
});

// 按题型分组的已选题目
const groupedExamQuestions = computed(() => {
  const groups: Record<string, Question[]> = {};
  examQuestions.value.forEach(q => {
    if (!groups[q.type]) {
      groups[q.type] = [];
    }
    groups[q.type].push(q);
  });
  return groups;
});

// 是否有选中的题目
const hasSelectedQuestions = computed(() => selectedRowKeys.value.length > 0);

// 是否全部选中
const isAllSelected = computed(() => {
  return questions.value.length > 0 && selectedRowKeys.value.length === questions.value.length;
});

// 表格选择配置
const rowSelection = {
  type: 'checkbox',
  showCheckedAll: true,
  selectedRowKeys: selectedRowKeys.value,
  onChange: (rowKeys: string[]) => {
    selectedRowKeys.value = rowKeys;
  },
};

// 初始化
onMounted(() => {
  if(sessionStorage.getItem('isLogin') === 'true'){
    fetchQuestions(1);
  }
  else{
    Message.error('请先登录');
  }
});

// 获取题目列表
const fetchQuestions = async (page: number) => {
  loading.value = true;
  current.value = page;
  
  try {
    // 构建查询参数
    const params = new URLSearchParams({
      current: page.toString(),
      size: size.value.toString(),
      username: localStorage.getItem('username') || ''
    });
    
    // 添加筛选条件（如果有）
    if (filterForm.questionType) params.append('type', filterForm.questionType);
    if (filterForm.difficulty) params.append('level', filterForm.difficulty);
    if (filterForm.subject) params.append('subject', filterForm.subject);
    
    // 发送请求
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/question/history?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.code === 0) {
      questions.value = result.data.records.map((q: any) => ({
        ...q,
        id: q.id || `${q.subject}-${Math.random().toString(36).substring(2, 10)}` // 确保每条记录有唯一ID
      }));
      total.value = result.data.total;
      current.value = result.data.current;
    } else {
      Message.error(result.message || '获取题目列表失败');
    }
  } catch (error) {
    console.error('获取题目列表失败:', error);
    Message.error('获取题目列表失败，请检查网络连接');
  } finally {
    loading.value = false;
  }
};

// 页码变更处理
const handlePageChange = (page: number) => {
  fetchQuestions(page);
};

// 重置筛选条件
const resetFilter = () => {
  filterForm.questionType = '';
  filterForm.difficulty = '';
  filterForm.subject = '';
  fetchQuestions(1);
};

// 查看题目详情
const viewQuestionDetail = (question: Question) => {
  currentQuestion.value = question;
  detailVisible.value = true;
};

// 全选/取消全选
const handleSelectAll = () => {
  if (isAllSelected.value) {
    selectedRowKeys.value = [];
  } else {
    selectedRowKeys.value = questions.value.map(q => q.id);
  }
};

// 添加所选题目到试卷
const addSelectedToExam = () => {
  if (selectedRowKeys.value.length === 0) {
    Message.warning('请先选择题目');
    return;
  }

  // 找出被选中的题目
  const selectedQuestions = questions.value.filter(q => selectedRowKeys.value.includes(q.id));
  
  // 添加到试卷，避免重复添加
  const newExamQuestions = [...examQuestions.value];
  selectedQuestions.forEach(question => {
    if (!newExamQuestions.some(q => q.id === question.id)) {
      newExamQuestions.push(question);
    }
  });
  
  examQuestions.value = newExamQuestions;
  selectedRowKeys.value = []; // 清空选择
  
  Message.success(`已添加 ${selectedQuestions.length} 道题目到试卷`);
};

// 从试卷中移除题目
const removeFromExam = (question: Question) => {
  examQuestions.value = examQuestions.value.filter(q => q.id !== question.id);
  Message.success('已从试卷中移除题目');
};

// 预览试卷
const previewExam = () => {
  if (examQuestions.value.length === 0) {
    Message.warning('试卷中暂无题目');
    return;
  }
  previewVisible.value = true;
};

// 格式化内容（用于预览）
const formatContent = (content: string): string => {
  // 如果内容为空，直接返回
  if (!content) return '';
  
  const result = marked.parse(content);
  return typeof result === 'string' ? result : '';
};

// 下载试卷为docx
const downloadExam = () => {
  if (examQuestions.value.length === 0) {
    Message.warning('试卷中暂无题目');
    return;
  }

  try {
    // 构建试卷文本内容
    let examContent = '';
    
    // 添加试卷标题
    examContent += `${examInfo.title || '未命名试卷'}\n\n`;
    
    // 添加试卷说明
    if (examInfo.description) {
      examContent += `${examInfo.description}\n\n`;
    }
    
    // 按题型添加题目
    Object.entries(groupedExamQuestions.value).forEach(([type, questions]) => {
      // 添加题型标题
      examContent += `【${type}】\n\n`;
      
      // 添加每道题目
      questions.forEach((question, index) => {
        // 题目序号和标题
        examContent += `${index + 1}. ${question.subject}\n`;
        
        // 题目内容（去除HTML标签和答案解析）
        const { questionText } = extractQuestionParts(question.content);
        examContent += `${questionText}\n\n`;
      });
      
      examContent += '\n';
    });
    
    // 创建Blob对象
    const blob = new Blob([examContent], { type: 'text/plain;charset=utf-8' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examInfo.title || '未命名试卷'}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    Message.success('试卷下载成功');
  } catch (error) {
    console.error('下载试卷失败:', error);
    Message.error('下载试卷失败，请重试');
  }
};

// 下载答案和解析
const downloadAnswers = () => {
  if (examQuestions.value.length === 0) {
    Message.warning('试卷中暂无题目');
    return;
  }

  try {
    // 构建答案文本内容
    let answersContent = '';
    
    // 添加答案标题
    answersContent += `${examInfo.title || '未命名试卷'} - 参考答案与解析\n\n`;
    
    // 按题型添加题目答案
    Object.entries(groupedExamQuestions.value).forEach(([type, questions]) => {
      // 添加题型标题
      answersContent += `【${type}】\n\n`;
      
      // 添加每道题目的答案
      questions.forEach((question, index) => {
        // 题目序号和标题
        answersContent += `${index + 1}. ${question.subject}\n`;
        
        // 提取答案和解析
        const { answer, explanation } = extractQuestionParts(question.content);
        
        if (answer) {
          answersContent += `答案：${answer}\n`;
        }
        
        if (explanation) {
          answersContent += `解析：${explanation}\n`;
        }
        
        if (!answer && !explanation) {
          answersContent += `（未提供答案和解析）\n`;
        }
        
        answersContent += '\n';
      });
      
      answersContent += '\n';
    });
    
    // 创建Blob对象
    const blob = new Blob([answersContent], { type: 'text/plain;charset=utf-8' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examInfo.title || '未命名试卷'}-答案.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    Message.success('答案下载成功');
  } catch (error) {
    console.error('答案下载失败:', error);
    Message.error('答案下载失败，请重试');
  }
};

// 提取题目、答案和解析部分
const extractQuestionParts = (content: string): { questionText: string; answer: string; explanation: string } => {
  const result = {
    questionText: '',
    answer: '',
    explanation: ''
  };
  
  if (!content) return result;
  
  // 将Markdown转换为纯文本
  const plainText = stripHtml(content);
  
  // 查找答案和解析的起始位置
  const answerIndex = plainText.indexOf('答案');
  const explanationIndex = plainText.indexOf('解析');
  
  if (answerIndex !== -1) {
    // 题目内容截止到答案开始
    result.questionText = plainText.substring(0, answerIndex).trim();
    
    // 提取答案内容
    const answerEnd = explanationIndex !== -1 ? explanationIndex : plainText.length;
    result.answer = plainText.substring(answerIndex + 3, answerEnd).trim();
  } else {
    // 如果没有答案，则题目内容截止到解析开始或全文
    result.questionText = plainText.substring(0, explanationIndex !== -1 ? explanationIndex : plainText.length).trim();
  }
  
  // 提取解析内容
  if (explanationIndex !== -1) {
    result.explanation = plainText.substring(explanationIndex + 3).trim();
  }
  
  return result;
};

// 去除HTML标签，保留纯文本
const stripHtml = (html: string): string => {
  // 创建临时DOM元素
  const temp = document.createElement('div');
  const parsed = typeof marked.parse(html) === 'string' 
    ? marked.parse(html) as string
    : '';
  temp.innerHTML = parsed;
  // 获取纯文本内容
  return temp.textContent || temp.innerText || '';
};

// 获取难度对应的颜色
const getDifficultyColor = (difficulty: string): string => {
  const colorMap: Record<string, string> = {
    '入门': 'green',
    '简单': 'blue',
    '中等': 'orange',
    '困难': 'red',
    '极难': 'purple'
  };
  
  return colorMap[difficulty] || 'default';
};
</script>

<style scoped>
.exam-organization-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 16px;
}

.filter-card, 
.question-list-card,
.selected-questions-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.exam-content {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-title {
  text-align: center;
  margin-bottom: 16px;
  color: var(--color-text-1);
  font-size: 20px;
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.title-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.selected-question-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.selected-question-index {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}

.empty-exam {
  padding: 40px 0;
  text-align: center;
}

.exam-info-form {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f2f3f5;
}

.exam-preview {
  padding: 24px;
}

.exam-title {
  text-align: center;
  margin-bottom: 20px;
}

.exam-description {
  text-align: center;
  margin-bottom: 40px;
  color: #86909c;
  white-space: pre-wrap;
}

.exam-section {
  margin-bottom: 30px;
}

.section-title {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e6eb;
}

.preview-question {
  margin-bottom: 24px;
}

.question-number {
  font-weight: 600;
  margin-bottom: 8px;
}

.question-content {
  padding: 8px 0;
}

.preview-actions {
  margin-top: 40px;
  text-align: center;
}

.question-detail {
  padding: 16px;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-meta {
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.detail-subject {
  font-size: 18px;
  font-weight: 600;
  margin: 12px 0;
}

.detail-content {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  white-space: pre-wrap;
}

.detail-content :deep(h1),
.detail-content :deep(h2),
.detail-content :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
}

.detail-content :deep(p) {
  margin-bottom: 12px;
}
</style>
