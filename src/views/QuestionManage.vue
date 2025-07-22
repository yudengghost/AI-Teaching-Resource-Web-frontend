<template>
  <div class="question-manage-container">
    <a-card class="question-filter-card">
      <template #title>
        <h2 class="card-title">题目管理</h2>
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

    <a-card class="question-list-card">
      <a-table
        :data="questions"
        :loading="loading"
        :pagination="false"
      >
        <template #columns>
          <a-table-column title="主题" data-index="subject" :minWidth="90" :ellipsis="true" :tooltip="true"/>
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
          <a-table-column title="创建时间" data-index="createTime" :minWidth="90" :ellipsis="true" :tooltip="true"/>
          <a-table-column title="创建人" data-index="username" :minWidth="90" :ellipsis="true" :tooltip="true"/>
          <a-table-column title="操作" :width="180">
            <template #cell="{ record }">
              <a-space>
                <a-button type="text" @click="viewQuestionDetail(record)">查看详情</a-button>
                <a-button type="text" status="success" @click="editQuestion(record)">编辑</a-button>
              </a-space>
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
            <span class="detail-time">创建时间: {{ currentQuestion.createTime }}</span>
          </div>
          <h3 class="detail-subject">{{ currentQuestion.subject }}</h3>
        </div>
        <div class="detail-content" v-html="formattedContent"></div>
      </div>
    </a-modal>

    <!-- 题目编辑对话框 -->
    <a-modal
      v-model:visible="editVisible"
      title="编辑题目"
      @ok="saveQuestion"
      :mask-closable="false"
      :width="800"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item field="subject" label="主题" :rules="[{ required: true, message: '请输入题目主题' }]">
          <a-input v-model="editForm.subject" placeholder="请输入题目主题" allow-clear />
        </a-form-item>
        
        <a-form-item field="type" label="类型" :rules="[{ required: true, message: '请选择题目类型' }]">
          <a-select v-model="editForm.type" placeholder="请选择题目类型">
            <a-option value="单选题">单选题</a-option>
            <a-option value="多选题">多选题</a-option>
            <a-option value="简答题">简答题</a-option>
            <a-option value="应用题">应用题</a-option>
            <a-option value="论述题">论述题</a-option>
            <a-option value="计算题">计算题</a-option>
          </a-select>
        </a-form-item>
        
        <a-form-item field="level" label="难度" :rules="[{ required: true, message: '请选择难度级别' }]">
          <a-select v-model="editForm.level" placeholder="请选择难度级别">
            <a-option value="入门">入门</a-option>
            <a-option value="简单">简单</a-option>
            <a-option value="中等">中等</a-option>
            <a-option value="困难">困难</a-option>
            <a-option value="极难">极难</a-option>
          </a-select>
        </a-form-item>
        
        <a-form-item field="content" label="内容" :rules="[{ required: true, message: '请输入题目内容' }]">
          <a-textarea 
            v-model="editForm.content" 
            placeholder="请输入题目内容，支持Markdown格式" 
            :auto-size="{ minRows: 10, maxRows: 20 }"
          />
        </a-form-item>
        
        <div class="markdown-tips">
          <p>提示：内容支持Markdown格式，可以使用以下格式标记答案和解析：</p>
          <pre>
题目内容...

答案：
正确答案内容

解析：
解析内容
          </pre>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { marked } from 'marked';

interface Question {
  subject: string;
  type: string;
  level: string;
  content: string;
  createTime: string;
  username: string;
  id?: number | string;
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

// 详情对话框
const detailVisible = ref(false);
const currentQuestion = ref<Question>({
  subject: '',
  type: '',
  level: '',
  content: '',
  createTime: '',
  username: ''
});

// 编辑对话框
const editVisible = ref(false);
const editForm = reactive<Question>({
  subject: '',
  type: '',
  level: '',
  content: '',
  createTime: '',
  username: '',
  id: undefined
});

// 编辑保存状态
const saveLoading = ref(false);

// 格式化Markdown内容
const formattedContent = computed(() => {
  if (!currentQuestion.value.content) return '';
  const result = marked.parse(currentQuestion.value.content);
  return typeof result === 'string' ? result : '';
});

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
      questions.value = result.data.records;
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

// 编辑题目
const editQuestion = (question: Question) => {
  // 复制题目数据到编辑表单
  editForm.id = question.id;
  editForm.subject = question.subject;
  editForm.type = question.type;
  editForm.level = question.level;
  editForm.content = question.content;
  editForm.username = question.username;
  editForm.createTime = question.createTime;
  
  // 显示编辑对话框
  editVisible.value = true;
};

// 保存题目
const saveQuestion = async () => {
  // 表单验证
  if (!editForm.subject || !editForm.type || !editForm.level || !editForm.content) {
    Message.error('请填写完整的题目信息');
    return;
  }
  
  saveLoading.value = true;
  
  try {
    // 准备请求数据
    const requestData = {
      id: editForm.id,
      subject: editForm.subject,
      type: editForm.type,
      level: editForm.level,
      content: editForm.content,
      username: localStorage.getItem('username') || editForm.username
    };
    
    // 发送更新请求
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/question/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    
    if (result.code === 0) {
      Message.success('题目更新成功');
      editVisible.value = false;
      
      // 刷新题目列表
      fetchQuestions(current.value);
    } else {
      Message.error(result.message || '更新题目失败');
    }
  } catch (error) {
    console.error('更新题目失败:', error);
    Message.error('更新题目失败，请检查网络连接');
  } finally {
    saveLoading.value = false;
  }
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
.question-manage-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 16px;
}

.question-filter-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.question-list-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

.detail-time {
  color: #86909c;
  font-size: 14px;
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

.markdown-tips {
  margin-top: 16px;
  padding: 12px;
  background-color: #f2f3f5;
  border-radius: 4px;
}

.markdown-tips p {
  margin-bottom: 8px;
  color: #4e5969;
}

.markdown-tips pre {
  background-color: #ffffff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e5e6eb;
  color: #4e5969;
  font-size: 14px;
}
</style>
