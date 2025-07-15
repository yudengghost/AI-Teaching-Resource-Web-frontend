<template>
  <div class="ppt-generator-container">
    <a-card class="generator-card" :bordered="false">
      <template #title>
        <div class="card-title">
          <i class="icon-ppt"></i>
          PPT自动生成器
        </div>
      </template>
      
      <!-- 选项和主题输入表单 -->
      <a-form :model="formData" layout="vertical" class="input-form">
        <a-form-item field="topic" label="PPT主题">
          <a-input v-model="formData.topic" placeholder="请输入PPT主题" allow-clear />
        </a-form-item>
        
        <div v-if="usingTemplate" class="template-mode-tip">
          <a-alert type="info" show-icon>
            当前使用模板模式，类目、风格和主题颜色已根据所选模板设置
          </a-alert>
        </div>
        
        <a-row :gutter="24">
          <a-col :span="8">
            <a-form-item field="category" label="类目">
              <a-select v-model="formData.category" placeholder="请选择类目" allow-clear :disabled="usingTemplate" >
                <a-option v-for="option in categoryOptions" :key="option.value" :value="option.value">
                  {{ option.name }}
                </a-option>
              </a-select>
            </a-form-item>
          </a-col>
          
          <a-col :span="8">
            <a-form-item field="style" label="风格">
              <a-select v-model="formData.style" placeholder="请选择风格" allow-clear :disabled="usingTemplate" >
                <a-option v-for="option in styleOptions" :key="option.value" :value="option.value">
                  {{ option.name }}
                </a-option>
              </a-select>
            </a-form-item>
          </a-col>
          
          <a-col :span="8">
            <a-form-item field="themeColor" label="主题颜色">
              <a-select v-model="formData.themeColor" placeholder="请选择主题颜色" allow-clear :disabled="usingTemplate" >
                <a-option v-for="option in themeColorOptions" :key="option.value" :value="option.value">
                  {{ option.name }}
                </a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item>
          <a-button type="primary" :loading="generating" @click="handleGenerate" long class="generate-btn">
            <template #icon><icon-play /></template>
            {{ generating ? '生成中...' : '开始生成PPT' }}
          </a-button>
        </a-form-item>
      </a-form>
      
      <!-- 生成进度 -->
      <div v-if="generating" class="progress-container">
        <a-progress :percent="generateProgress" :stroke-width="10" animation />
        <div class="progress-status">
          <a-spin v-if="generateProgress < 100" />
          <icon-check-circle-fill v-else class="success-icon" />
          {{ progressStatus }}
        </div>
      </div>
      
      <!-- 大纲内容展示 -->
      <a-collapse v-if="showOutline" :default-active-key="['1']" class="outline-collapse">
        <a-collapse-item key="1" header="PPT大纲">
          <div class="outline-content">
            <div v-if="outlineLoading" class="outline-loading">
              <a-spin />
              <div class="stream-content">{{ streamContent }}</div>
            </div>
            <div v-else class="markdown-container">
              <!-- 使用v-html渲染markdown内容 -->
              <div class="markdown-content" v-html="renderMarkdown(streamContent)"></div>
            </div>
          </div>
        </a-collapse-item>
      </a-collapse>
      
      <!-- PPT结果展示 -->
      <a-card v-if="pptGenerated" class="result-card" title="生成结果" :bordered="false">
        <div class="result-content">
          <div class="ppt-cover">
            <img :src="pptInfo.coverUrl" alt="PPT封面" />
            <div class="cover-overlay">
              <a-button type="primary" shape="round" @click="downloadPPT" class="download-btn">
                <template #icon><icon-download /></template>
                下载PPT
              </a-button>
            </div>
          </div>
          <div class="ppt-info">
            <h3>{{ pptInfo.subject }}</h3>
            <p><icon-calendar /> 创建时间: {{ formatDate(pptInfo.createTime) }}</p>
          </div>
        </div>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineComponent, h } from 'vue';
import { Message, Notification } from '@arco-design/web-vue';
import * as marked from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import {
  IconDownload,
  IconCalendar,
  IconCheckCircleFill
} from '@arco-design/web-vue/es/icon';

// 创建一个渲染markdown的函数
const renderMarkdown = (content: string): string => {
  if (!content) return '';
  try {
    // @ts-ignore - 忽略类型检查问题
    return marked.parse(content);
  } catch (error) {
    console.error('Markdown渲染错误:', error);
    return content;
  }
};

// 定义大纲节点类型
interface OutlineNode {
  level: number;
  name: string;
  children?: OutlineNode[];
}

// 递归展示大纲组件
const RecursiveOutline = defineComponent({
  name: 'RecursiveOutline',
  props: {
    node: {
      type: Object as () => OutlineNode,
      required: true
    }
  },
  render() {
    if (!this.node) return null;
    
    const renderChildren = () => {
      if (!this.node.children || this.node.children.length === 0) {
        return null;
      }
      
      return h('div', { class: 'outline-children' }, 
        this.node.children.map((child: OutlineNode) => h(RecursiveOutline, { node: child, key: child.name }))
      );
    };
    
    const getIndentClass = () => {
      if (this.node.level === 0) return 'outline-content-text';
      return `outline-level-${this.node.level}`;
    };
    
    return h('div', { class: 'outline-node' }, [
      h('div', { class: getIndentClass() }, this.node.name),
      renderChildren()
    ]);
  }
});

// 定义选项类型
interface Option {
  name: string;
  value: string | number;
}

// 选项数据
const categoryOptions = ref<Option[]>([]);
const styleOptions = ref<Option[]>([]);
const themeColorOptions = ref<Option[]>([]);

// 定义PPT信息类型
interface PptInfo {
  id: string;
  subject: string;
  coverUrl: string;
  templateId: string;
  pptxProperty: string;
  userId: string;
  userName: string;
  companyId: number;
  updateTime: any;
  createTime: string;
}

// 请求体
const requestBody = ref({
    "page": 1,
    "size": 10,
    "filters": {
        "type": 1, // 模板类型（必传）：1系统模板、4用户自定义模板，这里只使用1
        "category": null, // 类目筛选
        "style": null, // 风格筛选
        "themeColor": null // 主题颜色筛选
    }
});

// 加载状态
const loading = ref<boolean>(true);
const generating = ref<boolean>(false);
const outlineLoading = ref<boolean>(false);
const showOutline = ref<boolean>(false);
const pptGenerated = ref<boolean>(false);
const generateProgress = ref<number>(0);
const progressStatus = ref<string>('');
// 是否使用模板模式（禁用下拉框）
const usingTemplate = ref<boolean>(false);

// 表单数据
const formData = reactive({
  topic: '', // 用户输入的PPT主题
  category: null,
  style: null,
  themeColor: null
});

// 大纲数据
const streamContent = ref<string>('');
const outlineResult = ref<OutlineNode | null>(null);

const pptInfo = ref<PptInfo>({
    // ppt信息
    "id": "", // ppt id
    "subject": "", // 主题
    "coverUrl": "", // 封面
    "templateId": "", // 模板ID
    "pptxProperty": "", // PPT数据结构（json gzip base64）
    "userId": "", // 用户ID
    "userName": "", // 用户名称
    "companyId": 1000,
    "updateTime": null,
    "createTime": ""
});

// 生成任务ID
let taskId = '';
let templateId = '';
let markdown = ''; // 大纲

// 获取token
const getToken = () => {
  return localStorage.getItem('token');
};

// 获取选项列表
const getOptions = async () => {
    if(localStorage.getItem('selectedTemplateId') !== null){
      usingTemplate.value = true;
      console.log('从localStorage获取到模板ID:', localStorage.getItem('selectedTemplateId'));
      templateId = localStorage.getItem('selectedTemplateId') || '';
      localStorage.removeItem('selectedTemplateId');
      return ;
    }
    try{
        console.log('开始获取筛选选项...');
        const token = localStorage.getItem('token');
        console.log('当前token状态:', token ? '已获取' : '未获取');
        if(token){
            const requestInstance = new Request(`${import.meta.env.VITE_API_URL}/api/ppt/template/options`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'token': token
                }
            });
            console.log('发送获取选项请求:', `${import.meta.env.VITE_API_URL}/api/ppt/template/options`);
            const response = await fetch(requestInstance);
            const result = await response.json();
            console.log('获取选项响应:', result);
            if(response.ok && result.code === 0) {
                // 更新选项数据
                categoryOptions.value = result.data.category;
                styleOptions.value = result.data.style;
                themeColorOptions.value = result.data.themeColor;
                console.log('类目选项:', categoryOptions.value);
                console.log('风格选项:', styleOptions.value);
                console.log('主题颜色选项:', themeColorOptions.value);
            } else {
                console.error('获取筛选选项失败:', result.message);
                console.error('错误代码:', result.code);
                console.error('完整响应:', result);
                Message.error('获取筛选选项失败: ' + result.message);
            }
        }
        else{
            console.log('token为空');
            Message.error('token为空');
        }
    }
    catch(error) {
        console.error('获取筛选选项出错:', error);
        console.error('详细错误信息:', error instanceof Error ? error.stack : '未知错误');
        Message.error('获取筛选选项失败');
    }
};

// 获取模板（取第一个）
const getTheme = async () => {
    loading.value = true;
    try{
        // 更新筛选条件
        requestBody.value.filters.category = formData.category;
        requestBody.value.filters.style = formData.style;
        requestBody.value.filters.themeColor = formData.themeColor;
        
        console.log('获取模板请求参数:', JSON.stringify(requestBody.value));
        
        const token = localStorage.getItem('token');
        console.log('当前token状态:', token ? '已获取' : '未获取');
        if(token){
            const requestInstance = new Request(`${import.meta.env.VITE_API_URL}/api/ppt/templates`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': token
                },
                body: JSON.stringify(requestBody.value)
            });
            console.log('发送获取模板请求:', `${import.meta.env.VITE_API_URL}/api/ppt/templates`);
            const response = await fetch(requestInstance);
            const result = await response.json();
            console.log('获取模板响应:', result);
            if(response.ok){
                if(result.code == 0 && result.data && result.data.length > 0){
                    templateId = result.data[0].id;
                    console.log('获取到模板ID:', templateId);
                    return true;
                }
                else{
                    console.log('获取主题列表失败:' + result.message);
                    console.error('错误代码:', result.code);
                    console.error('完整响应:', result);
                    Message.error('获取主题列表失败:' + result.message);
                    return false;
                }
            }
            return false;
        }
        else{
            console.log('token为空')
            Message.error('token为空');
            return false;
        }
    }
    catch(error){
        console.log('获取主题列表失败:' + error);
        console.error('详细错误信息:', error instanceof Error ? error.stack : '未知错误');
        Message.error('获取主题列表失败');
        return false;
    }
    finally {
        loading.value = false;
    }
};

// 根据模板ID获取模板详细信息
const getTemplateDetail = async (templateId: string) => {
  try {
    console.log('开始获取模板详情，模板ID:', templateId);
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('token为空');
      Message.error('token为空');
      return false;
    }

    const requestInstance = new Request(`${import.meta.env.VITE_API_URL}/api/ppt/template/${templateId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      }
    });

    console.log('发送获取模板详情请求:', `${import.meta.env.VITE_API_URL}/api/ppt/template/${templateId}`);
    const response = await fetch(requestInstance);
    const result = await response.json();
    console.log('获取模板详情响应:', result);

    if (response.ok && result.code === 0) {
      // 根据模板信息设置表单数据
      if (result.data) {
        const template = result.data;
        console.log('获取到模板详情:', template);
        // 根据API返回的模板数据结构设置表单字段
        formData.category = template.category || null;
        formData.style = template.style || null;
        formData.themeColor = template.themeColor || null;
        // 提示用户已应用模板
        Message.success(`已应用模板：${template.subject || '未命名模板'}`);
        return true;
      }
    } else {
      console.error('获取模板详情失败:', result.message);
      Message.error('获取模板详情失败: ' + result.message);
      return false;
    }
  } catch (error) {
    console.error('获取模板详情出错:', error);
    Message.error('获取模板详情失败');
    return false;
  }
};

// 创建任务
const createTask = async () => {
  try {
    console.log('开始创建任务，主题:', formData.topic);
    const form = new FormData();
    form.append('type', "1");
    form.append('content', formData.topic);

    const token = getToken();
    console.log('当前token状态:', token ? '已获取' : '未获取');
    console.log('发送创建任务请求:', `${import.meta.env.VITE_API_URL}/api/ppt/v2/createTask`);
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ppt/v2/createTask`, {
      method: 'POST',
      headers: {
        'token': token || '',
      },
      body: form,
    });

    const result = await response.json();
    console.log('创建任务响应:', result);
    
    if (result.code === 0) {
      taskId = result.data.id;
      console.log('成功创建任务，任务ID:', taskId);
      return taskId;
    } else {
      console.error('创建任务API错误:', result.msg);
      console.error('错误代码:', result.code);
      throw new Error(result.msg || '创建任务失败');
    }
  } catch (error) {
    console.error('创建任务失败:', error);
    console.error('详细错误信息:', error instanceof Error ? error.stack : '未知错误');
    throw error;
  }
};

// 生成大纲内容
const generateContent = async (taskId: string) => {
  try {
    console.log('开始生成大纲内容，任务ID:', taskId);
    streamContent.value = '';
    outlineLoading.value = true;
    showOutline.value = true;
    
    const requestBody = {
        id: taskId,
        stream: true, // 是否流式（默认 true）
        length: "medium", // 篇幅长度：short/medium/long => 10-15页/20-30页/25-35页
        scene: null, // 演示场景
        audience: null, // 受众
        lang: null, // 语言
        prompt: null // 用户要求（小于50字）
    };
    
    console.log('生成大纲请求参数:', JSON.stringify(requestBody));
    console.log('发送生成大纲请求:', `${import.meta.env.VITE_API_URL}/api/ppt/v2/generateContent`);

    const token = getToken();
    console.log('当前token状态:', token ? '已获取' : '未获取');
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ppt/v2/generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token || '',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('大纲生成响应状态:', response.status, response.statusText);

    // 检查是否为流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      console.error('无法读取响应流');
      throw new Error('无法读取响应流');
    }

    // 处理流式响应
    const decoder = new TextDecoder();
    let completeData = '';
    console.log('开始处理流式响应...');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('流式响应读取完成');
        break;
      }
      
      // 解码响应数据
      const chunk = decoder.decode(value, { stream: true });
      console.log('收到新数据块:', chunk.length, '字节');
      completeData += chunk;
      
      // 处理每个数据块 - 按行分割
      const lines = completeData.split('\n');
      
      // 最后一行可能不完整，所以保留
      completeData = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            // 检查是否是SSE格式的数据行
            console.log('处理行:', line);
            
            // 处理SSE格式 (data: {...})
            if (line.startsWith('data:')) {
              // 提取data后的JSON部分
              const jsonString = line.substring(5).trim();
              console.log('提取的JSON字符串:', jsonString);
              
              const data = JSON.parse(jsonString);
              console.log('解析流数据:', data.status);
              
              // 处理不同状态的响应
              if (data.status === 3) {
                // 流式文本
                streamContent.value += data.text;
                generateProgress.value = 50;
                progressStatus.value = '正在生成大纲...';
              } else if (data.status === 4) {
                // 最终结果
                outlineResult.value = data.result;
                markdown = streamContent.value; // 保存大纲内容
                outlineLoading.value = false;
                generateProgress.value = 75;
                progressStatus.value = '大纲生成完成，准备生成PPT...';
                console.log('大纲生成完成:', outlineResult.value);
                return true;
              }
            } else if (line.includes('data:')) {
              // 处理可能的多行SSE
              const parts = line.split('data:');
              if (parts.length > 1) {
                const jsonString = parts[1].trim();
                console.log('从复杂行提取的JSON字符串:', jsonString);
                
                try {
                  const data = JSON.parse(jsonString);
                  console.log('解析复杂行数据:', data.status);
                  
                  if (data.status === 3) {
                    streamContent.value += data.text;
                  } else if (data.status === 4) {
                    outlineResult.value = data.result;
                    markdown = streamContent.value;
                    outlineLoading.value = false;
                    generateProgress.value = 75;
                    progressStatus.value = '大纲生成完成，准备生成PPT...';
                    console.log('大纲生成完成:', outlineResult.value);
                    return true;
                  }
                } catch (e) {
                  console.error('解析复杂行JSON失败:', e);
                }
              }
            }
          } catch (e) {
            console.error('解析流数据失败:', e, '原始行:', line);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('生成内容失败:', error);
    console.error('详细错误信息:', error instanceof Error ? error.stack : '未知错误');
    outlineLoading.value = false;
    throw error;
  }
};

// 生成PPT
const generatePptx = async (taskId: string) => {
  try {
    console.log('开始生成PPT，任务ID:', taskId, '模板ID:', templateId);
    
    const requestBody = {
      id: taskId,
      templateId: templateId,
      markdown: markdown
    };
    
    console.log('生成PPT请求参数:', JSON.stringify(requestBody).substring(0, 200) + '...');
    console.log('发送生成PPT请求:', `${import.meta.env.VITE_API_URL}/api/ppt/v2/generatePptx`);

    const token = getToken();
    console.log('当前token状态:', token ? '已获取' : '未获取');
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ppt/v2/generatePptx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token || '',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    console.log('生成PPT响应:', result);
    
    if (result.code === 0) {
        pptInfo.value = result.data.pptInfo;
        pptGenerated.value = true;
        generateProgress.value = 100;
        progressStatus.value = 'PPT生成完成！';
        console.log('PPT生成成功:', pptInfo.value);
        return true;
    } else {
      console.error('生成PPT API错误:', result.msg);
      console.error('错误代码:', result.code);
      throw new Error(result.msg || '生成PPT失败');
    }
  } catch (error) {
    console.error('生成PPT失败:', error);
    console.error('详细错误信息:', error instanceof Error ? error.stack : '未知错误');
    throw error;
  }
};

// 下载PPT
const downloadPPT = async () => {
  try {
    console.log('开始下载PPT，ID:', pptInfo.value.id);
    
    const token = getToken();
    console.log('当前token状态:', token ? '已获取' : '未获取');
    
    // 构建请求体
    const requestBody = {
      id: pptInfo.value.id,
      refresh: false
    };
    
    console.log('下载PPT请求参数:', requestBody);
    console.log('发送下载PPT请求:', 'https://open.docmee.cn/api/ppt/downloadPptx');
    
    // 发送POST请求获取下载链接
    const response = await fetch('https://open.docmee.cn/api/ppt/downloadPptx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token || '',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('下载PPT响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('获取下载链接失败，HTTP状态码:', response.status);
      throw new Error('获取下载链接失败');
    }
    
    // 解析响应获取下载链接
    const result = await response.json();
    console.log('下载PPT响应:', result);
    
    if (result.code !== 0 || !result.data || !result.data.fileUrl) {
      console.error('获取下载链接失败:', result.message);
      throw new Error('获取下载链接失败: ' + (result.message || '未知错误'));
    }
    
    // 从响应中获取文件URL
    const fileUrl = result.data.fileUrl;
    console.log('获取到的文件下载链接:', fileUrl);
    
    // 使用a标签触发下载
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = fileUrl;
    a.download = `${result.data.subject || pptInfo.value.subject}.pptx`;
    document.body.appendChild(a);
    console.log('准备下载文件:', a.download);
    a.click();
    a.remove();
    
    console.log('PPT下载完成');
    Message.success('PPT下载成功');
  } catch (error) {
    console.error('下载PPT失败:', error);
    console.error('详细错误信息:', error instanceof Error ? error.stack : '未知错误');
    Message.error('下载PPT失败: ' + (error instanceof Error ? error.message : '未知错误'));
  }
};

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString().replace(/\//g, "-");
};

// 生成PPT流程
const handleGenerate = async () => {
  if (!formData.topic) {
    Message.error('请输入PPT主题');
    return;
  }
  
  console.log('开始生成PPT，表单数据:', formData);
  
  try {
    generating.value = true;
    showOutline.value = false;
    pptGenerated.value = false;
    outlineResult.value = null;
    streamContent.value = '';
    
    generateProgress.value = 10;
    progressStatus.value = '获取PPT模板...';
    console.log('步骤1: 获取PPT模板');
    
    // 1. 获取主题模板
    const themeResult = await getTheme();
    console.log('获取模板结果:', themeResult);
    if (!themeResult) {
      Message.error('获取PPT模板失败');
      generating.value = false;
      return;
    }
    
    generateProgress.value = 25;
    progressStatus.value = '创建生成任务...';
    console.log('步骤2: 创建生成任务');
    
    // 2. 创建任务
    const taskIdResult = await createTask();
    console.log('创建任务结果, taskId:', taskIdResult);
    if (!taskIdResult) {
      Message.error('创建任务失败');
      generating.value = false;
      return;
    }
    
    console.log('步骤3: 生成大纲');
    // 3. 生成大纲
    const contentResult = await generateContent(taskIdResult);
    console.log('生成大纲结果:', contentResult);
    if (!contentResult) {
      Message.error('生成大纲失败');
      generating.value = false;
      return;
    }
    
    console.log('步骤4: 生成PPT');
    // 4. 生成PPT
    const pptResult = await generatePptx(taskIdResult);
    console.log('生成PPT结果:', pptResult, '生成的PPT信息:', pptInfo.value);
    if (!pptResult) {
      Message.error('生成PPT失败');
      generating.value = false;
      return;
    }
    
    
    
    Notification.success({
      title: '生成成功',
      content: `PPT《${pptInfo.value.subject}》已生成完成`,
      duration: 5000
    });

    // 将生成的PPT信息保存
    await savePptHistory(pptInfo.value);
  } catch (error) {
    console.error('生成PPT过程中出错:', error);
    console.error('详细错误信息:', error instanceof Error ? error.stack : '未知错误');
    Message.error('生成PPT失败: ' + error);
  } finally {
    generating.value = false;
  }
};

// 提交PPT信息
const savePptHistory = async (pptData: PptInfo) => {
    
    // 添加当前PPT信息到历史记录中
    const historyItem = {
      id: pptData.id,
      subject: pptData.subject,
      coverUrl: pptData.coverUrl,
      createTime: pptData.createTime,
      templateId: pptData.templateId,
      username: localStorage.getItem('username'),
      outline: markdown, // 保存大纲内容
      category: formData.category,
      style: formData.style,
      themeColor: formData.themeColor,
      userId: localStorage.getItem('id')
    };

  try {
    const requestInstance = new Request(`${import.meta.env.VITE_BACKEND_URL}/api/ppt/upload`,{
      method: "POST",
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(historyItem)
    })
    console.log(JSON.stringify(historyItem));
    const response = await fetch(requestInstance);
    const result = await response.json();
    if(response.ok){
      if(result.code === 0){
        console.log("上传成功");
      }
      else{
        console.log("上传失败");
      }
    }
  }
  catch(error) {
    console.log("上传失败"+error);
  }

}
onMounted(() => {
  if(sessionStorage.getItem('isLogin') === 'true'){
    getOptions();
  }
  else{
    Message.error('请先登录');
  }
});
</script>


<style scoped>
.ppt-generator-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
  min-height: 100vh;
}

.template-mode-tip {
  margin-bottom: 16px;
}

.generator-card {
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  background-color: var(--color-bg-3);
}

.card-title {
  font-size: 22px;
  font-weight: bold;
  color: var(--color-text-1);
  display: flex;
  align-items: center;
}

.icon-ppt {
  display: inline-block;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  margin-right: 12px;
  border-radius: 4px;
  position: relative;
}

.icon-ppt:before {
  content: "P";
  position: absolute;
  color: white;
  font-size: 16px;
  font-weight: bold;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.input-form {
  margin-top: 24px;
}

.generate-btn {
  margin-top: 12px;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #165DFF 0%, #0CB6FF 100%);
  border: none;
  transition: all 0.3s ease;
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(22, 93, 255, 0.2);
}

.progress-container {
  margin: 32px 0;
  padding: 20px;
  background-color: #f9fafc;
  border-radius: 8px;
  border: 1px dashed #e5e6eb;
}

.progress-status {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4e5969;
  font-size: 15px;
}

.success-icon {
  color: #00b42a;
  margin-right: 8px;
  font-size: 18px;
}

.outline-collapse {
  margin-top: 32px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  animation: fadeIn 0.5s ease;
}

.outline-content {
  min-height: 200px;
}

.outline-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.stream-content {
  margin-top: 20px;
  white-space: pre-wrap;
  font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
  border: 1px solid #e5e6eb;
  padding: 16px;
  border-radius: 6px;
  max-height: 400px;
  overflow-y: auto;
  width: 100%;
  background-color: #fafafa;
  font-size: 14px;
  line-height: 1.6;
  color: #4e5969;
}

.markdown-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 6px;
}

.markdown-content {
  width: 100%;
  overflow-y: auto;
  max-height: 600px;
  line-height: 1.6;
  color: #1d2129;
}

/* Markdown样式 */
.markdown-content :deep(h1) {
  font-size: 26px;
  margin-top: 28px;
  margin-bottom: 18px;
  font-weight: 600;
  line-height: 1.25;
  border-bottom: 1px solid #e5e6eb;
  padding-bottom: 12px;
}

.markdown-content :deep(h2) {
  font-size: 22px;
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-content :deep(h3) {
  font-size: 18px;
  margin-top: 20px;
  margin-bottom: 12px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-content :deep(h4) {
  font-size: 16px;
  margin-top: 18px;
  margin-bottom: 10px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-content :deep(p) {
  margin-top: 0;
  margin-bottom: 16px;
  color: #4e5969;
}

.markdown-content :deep(ul), .markdown-content :deep(ol) {
  margin-top: 0;
  margin-bottom: 16px;
  padding-left: 2em;
  color: #4e5969;
}

.markdown-content :deep(li) {
  margin-top: 6px;
}

.markdown-content :deep(code) {
  font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
  background-color: #f2f3f5;
  border-radius: 4px;
  padding: 0.2em 0.4em;
  font-size: 85%;
  color: #165dff;
}

.markdown-content :deep(pre) {
  background-color: #f2f3f5;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  margin-bottom: 16px;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  font-size: 90%;
  line-height: 1.6;
  color: #4e5969;
}

.outline-tree {
  padding: 16px;
}

.outline-node {
  margin-bottom: 6px;
}

.outline-children {
  margin-left: 28px;
}

.outline-level-1 {
  font-size: 18px;
  font-weight: bold;
  margin-top: 18px;
  color: #1d2129;
}

.outline-level-2 {
  font-size: 16px;
  font-weight: bold;
  margin-top: 14px;
  color: #4e5969;
}

.outline-level-3 {
  font-size: 15px;
  font-weight: bold;
  margin-top: 10px;
  color: #86909c;
}

.outline-level-4 {
  font-size: 14px;
  margin-top: 6px;
  color: #86909c;
}

.outline-content-text {
  font-size: 14px;
  color: #86909c;
}

.result-card {
  margin-top: 32px;
  border-radius: 8px;
  overflow: hidden;
  animation: slideUp 0.6s ease;
}

.result-content {
  display: flex;
  flex-direction: column;
}

.ppt-cover {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.ppt-cover:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.ppt-cover:hover .cover-overlay {
  opacity: 1;
}

.ppt-cover img {
  width: 100%;
  height: auto;
  display: block;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.download-btn {
  padding: 8px 20px;
  font-size: 16px;
  font-weight: 500;
  background: #fff;
  color: #165dff;
  border: none;
  transition: all 0.3s ease;
}

.download-btn:hover {
  background: #f2f3f5;
  transform: scale(1.05);
}

.ppt-info {
  padding: 24px;
  text-align: center;
}

.ppt-info h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 20px;
  color: #1d2129;
}

.ppt-info p {
  margin-bottom: 16px;
  color: #86909c;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ppt-info p :deep(svg) {
  margin-right: 6px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .ppt-generator-container {
    padding: 16px;
  }
  
  .card-title {
    font-size: 18px;
  }
  
  .result-content {
    flex-direction: column;
  }
  
  .ppt-cover {
    margin-bottom: 20px;
  }
}
</style> 