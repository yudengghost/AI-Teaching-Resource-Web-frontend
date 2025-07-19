<template>
    <div class="recommend-container">
      <div class="search-section">
        <h2>视频推荐</h2>
        <div class="search-box">
          <a-input-search
              v-model="keyword"
              placeholder="输入关键词搜索相关教学视频..."
              search-button
              :loading="loading"
              @search="handleSearch"
          />
        </div>
      </div>
  
      <div class="results-section">
        <a-spin :loading="loading">
          <div class="video-list" v-if="searchResults.length">
            <div v-for="(item, index) in searchResults" :key="index" class="video-item">
              <a :href="item.url" target="_blank" class="video-link">
                <span class="video-title">{{ item.title }}</span>
              </a>
            </div>
          </div>
          <a-empty v-else description="暂无搜索结果" />
        </a-spin>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  
  interface VideoResult {
    title: string;
    url: string;
  }
  
  const keyword = ref('');
  const loading = ref(false);
  const searchResults = ref<VideoResult[]>([]);
  
  // 直接调用KIMI API
  const searchVideosFromAPI = async (searchKeyword: string) => {
    try {
      // API密钥应当从环境变量获取
      const apiKey = import.meta.env.VITE_MOONSHOT_API_KEY;
      
      const requestBody = {
        model: "moonshot-v1-8k",
        messages: [
          {
            "role": "system",
            "content": "你是B站视频搜索助手。请执行以下步骤：1.使用web_search工具在B站搜索视频 2.仅返回视频标题匹配搜索关键词的结果 3.确保每个视频链接指向其对应的实际播放页面 4.返回格式：'标题|链接'"
          },
          {
            "role": "user",
            "content": `请在B站搜索标题包含"${searchKeyword}"的教学视频，返回最相关的5个结果，确保每个视频标题和链接所对应的视频标题相同`
          }
        ],
        temperature: 0.1,
        tools: [
          {
            "type": "builtin_function",
            "function": {
              "name": "$web_search"
            }
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
  
  // 处理API返回的结果
  const processResults = (content: string): VideoResult[] => {
    const lines = content.split('\n').filter(line => line.includes('|'));
    const results: VideoResult[] = [];
    const seenUrls = new Set();
  
    for (const line of lines) {
      const [titlePart, urlPart] = line.split('|').map(s => s.trim());
  
      const title = titlePart
        .replace(/^\d+\.\s*/, '')
        .replace(/\*\*/g, '')
        .replace(/\[.*?\]/g, '')
        .trim();
  
      const urlMatch = urlPart.match(/\[.*?\]\((.*?)\)/);
      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];
        if (url.includes('bilibili.com/video/') && !seenUrls.has(url)) {
          seenUrls.add(url);
          results.push({
            title,
            url
          });
        }
      }
    }
  
    return results;
  };
  
  const handleSearch = async () => {
    if (!keyword.value.trim()) {
      Message.warning('请输入搜索关键词');
      return;
    }
  
    loading.value = true;
    try {
      console.log('发送搜索请求:', keyword.value);
      
      // 直接调用KIMI API
      const content = await searchVideosFromAPI(keyword.value.trim());
      
      // 处理返回结果
      const results = processResults(content);
      console.log('处理后的结果:', results);
      
      searchResults.value = results;
      if (results.length === 0) {
        Message.info('未找到相关视频');
      }
    } catch (error) {
      console.error('搜索错误:', error);
      Message.error(error instanceof Error ? error.message : '搜索失败，请稍后重试');
      searchResults.value = [];
    } finally {
      loading.value = false;
    }
  };
  </script>
  
  <style scoped>
  .recommend-container {
    max-width: 800px;
    margin: 20px auto;
    padding: 0 16px;
  }
  
  .search-section {
    margin-bottom: 24px;
    text-align: center;
  }
  
  .search-section h2 {
    margin-bottom: 16px;
    color: #1d2129;
  }
  
  .search-box {
    max-width: 500px;
    margin: 0 auto;
  }
  
  .video-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .video-item {
    padding: 12px 16px;
    background: #f5f6f7;
    border-radius: 6px;
    transition: all 0.3s ease;
  }
  
  .video-item:hover {
    background: #e8f2ff;
    transform: translateY(-2px);
  }
  
  .video-link {
    display: flex;
    color: #1d2129;
    text-decoration: none;
  }
  
  .video-title {
    flex: 1;
  }
  </style>