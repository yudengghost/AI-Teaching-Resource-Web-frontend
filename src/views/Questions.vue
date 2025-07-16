<template>
  <div class="questions-container">
    <a-card class="question-card">
      <template #title>
        <h2 class="card-title">AI题目生成器</h2>
      </template>

      <a-form :model="form" layout="vertical">
        <!-- 题目类型和难度选择（一行） -->
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="questionType" label="题目类型">
              <a-select
                v-model="form.questionType"
                placeholder="请选择题目类型"
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
          <a-col :span="12">
            <a-form-item field="difficulty" label="题目难度">
              <a-select
                v-model="form.difficulty"
                placeholder="请选择题目难度"
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
        </a-row>

        <!-- 题目要求输入 -->
        <a-form-item field="requirements" label="题目要求">
          <a-textarea
            v-model="form.requirements"
            placeholder="请输入题目要求，如：高中物理牛顿第二定律相关的题目"
            :auto-size="{ minRows: 3, maxRows: 6 }"
            :max-length="255"
          />
        </a-form-item>

        <a-button
          type="primary"
          :loading="loading"
          @click="generateQuestion"
          :disabled="!form.questionType || !form.requirements || !form.difficulty"
          long
        >
          生成题目
        </a-button>
      </a-form>
    </a-card>

    <!-- 题目展示区域 -->
    <a-card v-if="generatedContent" class="result-card">
      <template #title>
        <div class="result-header">
          <h3>生成的题目</h3>
          <a-button type="text" @click="copyContent">
            <template #icon>
              <icon-copy />
            </template>
            复制
          </a-button>
        </div>
      </template>

      <div class="generated-content" v-html="formattedContent"></div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { marked } from 'marked';
import dayjs from 'dayjs';

const form = ref({
  questionType: '',
  difficulty: '',
  requirements: ''
});

const loading = ref(false);
const generatedContent = ref('');

// 格式化生成的内容，支持markdown
const formattedContent = computed(() => {
  if (!generatedContent.value) return '';
  return marked.parse(generatedContent.value);
});

const generateQuestion = async () => {
  if (!form.value.questionType || !form.value.requirements || !form.value.difficulty) {
    Message.warning('请选择题目类型、难度并填写题目要求');
    return;
  }

  loading.value = true;
  try {
    // 构建请求内容
    const prompt = `请生成一道${form.value.difficulty}难度的${form.value.questionType}，主题内容如下：${form.value.requirements}。按题目、答案和解析三部分输出。`;
    
    // API请求，使用moonshot-v1-8k模型
    const response = await generateFromAPI(prompt);
    generatedContent.value = response;
    saveResult();
    
    Message.success('题目生成成功');
  } catch (error) {
    console.error('生成题目失败:', error);
    Message.error('生成题目失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 保存结果
const saveResult = async () => {
  const body = {
    type: form.value.questionType,
    level: form.value.difficulty,
    content: generatedContent.value,
    subject: form.value.requirements,
    createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    username: localStorage.getItem('username')
  }

  const requestInstance = new Request(`${import.meta.env.VITE_BACKEND_URL}/api/question/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  })

  const response = await fetch(requestInstance)
  const result = await response.json()
  if (result.code === 200) {
    console.log('题目保存成功')
  } else {
    console.log('题目保存失败')
  }
}

// API调用函数
const generateFromAPI = async (prompt: string) => {
  try {
    // API密钥应当从环境变量获取或通过后端提供
    const apiKey = import.meta.env.VITE_MOONSHOT_API_KEY;
    
    if (!apiKey) {
      throw new Error('未配置API密钥');
    }
    
    const requestBody = {
      model: "moonshot-v1-8k",
      messages: [
        {"role": "system", "content": "你是题目编写专家，负责根据要求编写出合适的题目，并给出相应答案和解析"},
        {"role": "user", "content": prompt}
      ],
      temperature: 0.3,
      tools:[
            {
                "type": "builtin_function",
                "function": {
                    "name": "$web_search",
                },
            }
        ]
    };
    
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API请求失败: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
};


// 复制内容功能
const copyContent = () => {
  if (!generatedContent.value) return '';
  
  navigator.clipboard.writeText(generatedContent.value)
    .then(() => {
      Message.success('内容已复制到剪贴板');
    })
    .catch(() => {
      Message.error('复制失败，请手动复制');
    });
};

onMounted(() => {
  if(sessionStorage.getItem('isLogin') === 'true'){
    
  }
  else{
    Message.error('请先登录');
  }
});
</script>

<style scoped>
.questions-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
}

.question-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.result-card {
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.card-title {
  text-align: center;
  margin-bottom: 16px;
  color: var(--color-text-1);
  font-size: 24px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.generated-content {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  white-space: pre-wrap;
}

.generated-content :deep(h1),
.generated-content :deep(h2),
.generated-content :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
}

.generated-content :deep(p) {
  margin-bottom: 12px;
}
</style>
