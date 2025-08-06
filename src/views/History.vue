<template>
  <div class="history-container">
    <div class="history-header">
      <h2>📑PPT历史记录</h2>
      <div class="header-actions">
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索主题"
          style="width: 300px"
          allow-clear
          @search="handleSearch"
        />
        <a-button type="primary" @click="refreshHistory">刷新</a-button>
      </div>
    </div>
    
      <a-table
        :data="filteredHistory"
        :loading="loading"
        :pagination="{
          total: page.total,
          showTotal: true,
          pageSize: page.size,
          current: page.current,
          onChange: onPageChange
        }"
        :bordered="false"
        row-key="id"
        class="history-table"
      >
        <template #columns>
          <a-table-column title="封面" data-index="coverUrl" :width="140">
            <template #cell="{ record }">
              <div class="cover-container">
                <a-image :src="record.coverUrl" alt="PPT封面" height="100%" />
              </div>
            </template>
          </a-table-column>
          <a-table-column title="主题" data-index="subject" :ellipsis="true" :tooltip="true"/>
          <a-table-column title="创建人" data-index="username" :width="120" :ellipsis="true" :tooltip="true"/>
          <a-table-column title="生成时间" data-index="createTime" :ellipsis="true" :tooltip="true">
            <template #cell="{ record }">
              {{ formatDate(record.createTime) }}
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="200">
            <template #cell="{ record }">
              <a-space>
                <a-button type="primary" size="small" @click="showDetail(record)">查看大纲</a-button>
                <a-button type="secondary" size="small" @click="handleDownload(record)">下载</a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
        
        <template #empty>
          <div class="empty-history">
            <a-empty description="暂无历史记录" />
          </div>
        </template>
      </a-table>

    <!-- 大纲详情对话框 -->
    <a-modal
      v-model:visible="detailVisible"
      :title="currentPpt ? '大纲详情：' + currentPpt.subject : '大纲详情'"
      :footer="false"
      :maskClosable="false"
      width="700px"
    >
      <div v-if="currentPpt" class="outline-detail">
        <div class="outline-header">
          <a-space>
            <span>生成时间：{{ formatDate(currentPpt.createTime) }}</span>
          </a-space>
        </div>
        <div class="markdown-container">
          <div class="markdown-content" v-html="renderMarkdown(currentPpt.outline || '')"></div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Message, Notification } from '@arco-design/web-vue';
import * as marked from 'marked';

// PPT信息类型定义
interface PptInfo {
  id: string;
  subject: string;
  coverUrl: string;
  templateId: string;
  username: string;
  createTime: string;
  outline: string;
  category?: string | number | null;
  style?: string | number | null;
  themeColor?: string | number | null;
  userId?: string | number | null;
}

// 状态变量
const historyList = ref<PptInfo[]>([]);
const loading = ref(false);
const searchKeyword = ref('');
const detailVisible = ref(false);
const currentPpt = ref<PptInfo | null>(null);

const page = ref({
  current: '1',
  size: '10',
  total: ''
})

const onPageChange = (p: number) => {
  page.value.current = p.toString();
  loadHistory();
};

// 过滤后的历史记录
const filteredHistory = computed(() => {
  if (!searchKeyword.value) {
    return historyList.value;
  }
  
  const keyword = searchKeyword.value.toLowerCase();
  return historyList.value.filter(item => 
    item.subject.toLowerCase().includes(keyword)
  );
});

// 渲染markdown的函数
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

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
};

// 获取历史记录
const loadHistory = async () => {
  loading.value = true;

  try{
    const requestInstance = new Request(`${import.meta.env.VITE_BACKEND_URL}/api/ppt/history?current=${page.value.current}&size=${page.value.size}&username=${localStorage.getItem('username') || ''}`, {
      method: "GET",
    })
    const response = await fetch(requestInstance)
    const result = await response.json();
    if(response.ok){
      console.log("获取历史记录成功"+result);
      page.value.size = result.size;
      page.value.total = result.total;
      historyList.value = result.records;
    }
    else{
      historyList.value = [];
      console.log("获取历史记录失败");
    }
  }
  catch(error){
    console.error('加载历史记录失败:', error);
    Message.error('加载历史记录失败');
    historyList.value = [];
  } finally {
    loading.value = false;
  }

};

// 刷新历史记录
const refreshHistory = () => {
  loadHistory();
  Message.success('历史记录已刷新');
};

// 搜索
const handleSearch = () => {
  console.log('搜索关键词:', searchKeyword.value);
};

// 显示详情
const showDetail = (record: PptInfo) => {
  currentPpt.value = record;
  detailVisible.value = true;
};

// 处理下载
const handleDownload = async (record: PptInfo) => {
  try {
    Message.info('准备下载PPT: ' + record.subject);
    
    // 获取token
    const token = localStorage.getItem('token');
    if (!token) {
      Message.error('未找到token，请先登录');
      return;
    }
    
    // 构建请求体
    const requestBody = {
      id: record.id,
      refresh: false
    };
    
    console.log('下载PPT请求参数:', requestBody);
    
    // 发送POST请求获取下载链接
    const response = await fetch('https://open.docmee.cn/api/ppt/downloadPptx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      console.error('获取下载链接失败，HTTP状态码:', response.status);
      throw new Error('获取下载链接失败');
    }
    
    // 解析响应获取下载链接
    const result = await response.json();
    console.log("下载PPT请求结果:", result);
    
    if (result.code !== 0 || !result.data || !result.data.fileUrl) {
      console.error('获取下载链接失败:', result.message);
      throw new Error('获取下载链接失败: ' + (result.message || '未知错误'));
    }
    
    // 从响应中获取文件URL
    const fileUrl = result.data.fileUrl;
    
    // 使用a标签触发下载
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = fileUrl;
    a.download = `${result.data.subject || record.subject}.pptx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    
    Message.success('PPT下载成功');
  } catch (error) {
    console.error('下载PPT失败:', error);
    Message.error('下载PPT失败: ' + (error instanceof Error ? error.message : '未知错误'));
  }
};

// 页面加载时获取历史记录
onMounted(() => {
  if(sessionStorage.getItem('isLogin') === 'true'){
    loadHistory();
  }
  else{
    Message.error('请先登录');
  }
});
</script>

<style scoped>
.history-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
  flex-wrap: wrap;
}

.history-header h2 {
  color: var(--color-text-1);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}

.history-table {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.cover-container {
  width: 120px;
  height: 68px;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-history {
  padding: 40px 0;
}

.outline-detail {
  padding: 0 10px;
}

.outline-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e6eb;
  color: #86909c;
}

.markdown-container {
  padding: 20px;
  background-color: #f9fafc;
  border-radius: 6px;
  max-height: 500px;
  overflow-y: auto;
}

.markdown-content {
  width: 100%;
  line-height: 1.6;
  color: #1d2129;
}

/* Markdown样式 */
.markdown-content :deep(h1) {
  font-size: 24px;
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  border-bottom: 1px solid #e5e6eb;
  padding-bottom: 10px;
  color: #1d2129;
}

.markdown-content :deep(h2) {
  font-size: 20px;
  margin-top: 20px;
  margin-bottom: 14px;
  font-weight: 600;
  line-height: 1.25;
  color: #1d2129;
}

.markdown-content :deep(h3) {
  font-size: 18px;
  margin-top: 16px;
  margin-bottom: 10px;
  font-weight: 600;
  line-height: 1.25;
  color: #1d2129;
}

.markdown-content :deep(h4) {
  font-size: 16px;
  margin-top: 14px;
  margin-bottom: 8px;
  font-weight: 600;
  line-height: 1.25;
  color: #1d2129;
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
  margin-top: 4px;
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
  border-radius: 4px;
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
</style>