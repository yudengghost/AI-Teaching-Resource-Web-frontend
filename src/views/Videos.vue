<template>
  <div class="video-page">
    <div class="recommend-container">
      <div class="search-section">
        <h2 class="page-title">智能视频推荐</h2>
        <p class="subtitle">探索海量优质教学资源</p>
        <div class="search-box">
          <a-input-search
              v-model="keyword"
              placeholder="输入关键词搜索相关教学视频..."
              search-button
              :loading="loading"
              @search="handleSearch"
              @keydown.enter="handleSearch"
              class="search-input"
          >
            <template #button-icon>
              <icon-search />
            </template>
          </a-input-search>
        </div>
      </div>
  
      <div class="results-section">
        <a-spin :loading="loading" dot>
          <transition-group name="video-list" tag="div" class="video-grid" v-if="searchResults.length">
            <div v-for="(item, index) in searchResults" :key="index" class="video-card">
              <div class="video-card-inner">
                <div class="video-cover-wrapper">
                  <img v-if="!item.loading && item.coverUrl" :src="item.coverUrl" alt="视频封面" />
                  <div v-else class="cover-placeholder">
                    <a-spin v-if="item.loading" />
                    <icon-image v-else />
                  </div>
                  <div class="video-overlay">
                    <a :href="item.url" target="_blank" class="play-btn-link">
                      <a-button shape="circle" type="primary" class="play-btn">
                        <icon-play-arrow />
                      </a-button>
                    </a>
                  </div>
                </div>
                <div class="video-info">
                  <a :href="item.url" target="_blank" class="video-link">
                    <h3 class="video-title">{{ item.title }}</h3>
                  </a>
                  <div class="video-actions">
                    <a-tooltip content="收藏视频">
                      <div class="action-btn favorite-btn" @click.stop="toggleFavorite(item)">
                        <icon-star-fill v-if="item.favorited" class="star-icon favorited" />
                        <icon-star v-else class="star-icon" />
                      </div>
                    </a-tooltip>
                    <a-tooltip content="在新窗口打开">
                      <a :href="item.url" target="_blank" class="action-btn">
                        <icon-link />
                      </a>
                    </a-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </transition-group>
          <a-empty v-else description="暂无搜索结果" />
        </a-spin>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import {
  IconStar,
  IconStarFill,
  IconSearch,
  IconPlayArrow,
  IconImage,
  IconLink
} from '@arco-design/web-vue/es/icon';
  
  interface VideoResult {
    title: string;
    url: string;
    coverUrl: string;  // 这会是blob URL或base64
    loading: boolean;  // 标记封面是否正在加载
    favorited?: boolean; // 是否已收藏
  }
  
  const keyword = ref('');
  const loading = ref(false);
  // 有默认数据
  const searchResults = ref<VideoResult[]>([
    {
      title: '数据结构（Java版）',
      url: 'https://www.icourse163.org/course/ZZU-1207193805?from=searchPage&outVendor=zw_mooc_pcssjg_',
      coverUrl: '../src/assets/pre_1.jpg',
      loading: false,
      favorited: false
    },
    {
      title: '1次讲清算法竞赛核心： 数论与动态规划',
      url: 'https://www.lanqiao.cn/courses/41585',
      coverUrl: '../src/assets/pre_2.jpg',
      loading: false,
      favorited: false
    },
    {
      title: '已完结 SpringBoot3+Vue3 前后端分离项目（4K蓝光画质）基于Session的校验方案',
      url: 'https://www.bilibili.com/video/BV1rT411W7QM/?spm_id_from=333.1387.favlist.content.click&vd_source=7b5c92eed2ed5c6c31b53ac4c54bea62',
      coverUrl: '../src/assets/pre_3.jpg',
      loading: false,
      favorited: false
    },

  ]);
  
  // 调用KIMI API
  const searchVideosFromAPI = async (searchKeyword: string) => {
    try {
      // API密钥应当从环境变量获取
      const apiKey = import.meta.env.VITE_MOONSHOT_API_KEY;
      
      let messages: any = [
        {
          "role": "system",
          "content": `
          你是bilibili视频搜索助手。请执行以下步骤：
          1.联网搜索视频 
          2.必须返回与关键词相关的视频结果，包含标题和视频链接 
          3.确保每个视频链接指向其对应的实际播放页面，你可以打开链接阅读进行二次确认
          4.返回格式：
          标题:
          链接:
          `
        },
        {
          "role": "user",
          "content": `请搜索与关键词"${searchKeyword}"相关的视频，返回最相关的5个结果`
        }
      ];
      
      const tools = [
        {
          "type": "builtin_function",
          "function": {
            "name": "$web_search"
          }
        }
      ];
      
      let finishReason = null;
      let finalContent = null;
      
      while (finishReason === null || finishReason === "tool_calls") {
        const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "kimi-k2-0711-preview",
            messages: messages,
            temperature: 0.3,
            tools: tools
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API请求失败: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        
        const choice = data.choices[0];
        finishReason = choice.finish_reason;
        
        if (finishReason === "tool_calls") {
          messages.push(choice.message); // 将assistant消息添加到上下文
          
          for (const toolCall of choice.message.tool_calls) {
            const toolCallName = toolCall.function.name;
            const toolCallArguments = JSON.parse(toolCall.function.arguments);
            
            // 对于$web_search，直接将参数作为结果返回
            const toolResult = toolCallName === "$web_search" ? toolCallArguments : "no tool found";
            
            // 添加工具调用结果消息
            messages.push({
              "role": "tool",
              "tool_call_id": toolCall.id,
              "name": toolCallName,
              "content": JSON.stringify(toolResult)
            });
          }
        } else {
          finalContent = choice.message.content;
        }
      }
      
      return finalContent;
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  };
  
  // 处理API返回的结果
  const processResults = (content: string): VideoResult[] => {
    const results: VideoResult[] = [];
    const seenUrls = new Set();
    
    // 提取所有标题和链接
    const titleMatches = content.match(/标题:([^\n]*)/g) || content.match(/标题：([^\n]*)/g) || [];
    const urlMatches = content.match(/链接:([^\n]*)/g) || content.match(/链接：([^\n]*)/g) || [];
    
    // 配对标题和链接
    const count = Math.min(titleMatches.length, urlMatches.length);
    
    for (let i = 0; i < count; i++) {
      let title = titleMatches[i].replace('标题:', '').replace('标题：', '').trim();
      let url = urlMatches[i].replace('链接:', '').replace('链接：', '').trim();
      
      // 初始没有封面，需要后续加载
      results.push({ 
        title, 
        url, 
        coverUrl: '', 
        loading: true,
        favorited: false // 初始状态为未收藏
      });
    }
    
    return results;
  };

  const fetchVideoCoversStatic = async () => {
        
    // 先使用静态封面替代

    // 使用正确的URL格式引用静态资源
    const getAssetUrl = (name: string) => {
      return new URL(`../assets/${name}`, import.meta.url).href;
    };
    
    // 从环境变量获取图床Token
    const picuiToken = import.meta.env.VITE_PICUI_TOKEN;
    
    // 为每个结果设置封面
    for (let i = 0; i < searchResults.value.length; i++) {
      const imageIndex = (i % 5) + 1; // 循环使用5张图片
      const localImageUrl = getAssetUrl(`video${imageIndex}.jpg`);
      
      try {
        // 先获取本地图片文件
        const response = await fetch(localImageUrl);
        const blob = await response.blob();
        
        // 创建FormData对象
        const formData = new FormData();
        const file = new File([blob], `video${imageIndex}.jpg`, { type: blob.type });
        formData.append('file', file);
        
        // 上传到图床
        const uploadResponse = await fetch('https://picui.cn/api/v1/upload', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + picuiToken,
            'Accept': 'application/json'
            // 注意：当使用FormData时不要设置Content-Type，浏览器会自动设置正确的boundary
          },
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('图片上传失败');
        }
        
        const result = await uploadResponse.json();
        
        // 使用图床返回的URL作为封面
        searchResults.value[i].coverUrl = result.data.links.url;
        console.log("searchResults.value[i].coverUrl:", searchResults.value[i].coverUrl);
      } catch (error) {
        console.error('图片上传失败:', error);
        // 上传失败时使用本地图片作为备用
        searchResults.value[i].coverUrl = localImageUrl;
      } finally {
      searchResults.value[i].loading = false;
      }
    }
  }

  // 加载视频封面
  const fetchVideoCovers = async () => {
    for (let i = 0; i < searchResults.value.length; i++) {
      try {
        // 从后端获取视频封面
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/video/getVideoCover?videoUrl=${searchResults.value[i].url}`);
        
        if (!response.ok) {
          throw new Error('获取视频封面失败');
        }
        
        const result = await response.json();
        
        if (result.code === 0) {
          // 直接使用返回的Base64编码数据创建Data URL
          searchResults.value[i].coverUrl = `data:image/jpeg;base64,${result.data}`;
          searchResults.value[i].title = result.title;
        } else {
          throw new Error(result.message || '获取视频封面失败');
        }
      } catch (error) {
        console.error('获取视频封面失败:', error);
        // 获取失败时使用默认图片作为备用
        const getAssetUrl = (name: string) => {
          return new URL(`../assets/${name}`, import.meta.url).href;
        };
        const imageIndex = (i % 5) + 1;
        searchResults.value[i].coverUrl = getAssetUrl(`video${imageIndex}.jpg`);
      } finally {
        searchResults.value[i].loading = false;
      }
    }

  };

  // 收藏或取消收藏视频
  const toggleFavorite = async (item: VideoResult) => {
    try {
      // 从localStorage获取用户名
      const username = localStorage.getItem('username');
      if (!username) {
        Message.warning('请先登录');
        return;
      }

      // 构建请求数据
      const data = {
        username,
        coverUrl: item.coverUrl,
        url: item.url,
        title: item.title
      };

      // 发送POST请求
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/video/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      // 检查是否成功
      if (result.code === 0) {
        // 更新收藏状态
        item.favorited = !item.favorited;
        Message.success(item.favorited ? '收藏成功' : '已取消收藏');
      } else {
        throw new Error(result.message || '操作失败');
      }
    } catch (error) {
      console.error('收藏操作错误:', error);
      Message.error(error instanceof Error ? error.message : '操作失败，请稍后重试');
    }
  };
  
  // 获取关键词
  const getKeyword = () => {
    
  }
  
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
      console.log('搜索关键词:', keyword.value.trim());
      
      // 处理返回结果
      const results = processResults(content);
      
      searchResults.value = results;
      if (results.length > 0) {
        // 获取封面(静态)
        // fetchVideoCoversStatic();
        fetchVideoCovers();
      }
      if (results.length === 0) {
        Message.info('未找到相关视频');
      }
    } catch (error) {
      console.error('搜索错误:', error);
      Message.error(error instanceof Error ? error.message : '搜索失败，请稍后重试');
      searchResults.value = [];
    } finally {
      console.log("searchResults.value:", searchResults.value);
      loading.value = false;
    }
  };
  </script>
  
  <style scoped>
  .video-page {
    background: var(--color-bg-2);
  }

  .recommend-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .search-section {
    margin-bottom: 40px;
    text-align: center;
  }

  .page-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 8px;
    background: linear-gradient(45deg, #165DFF, #722ED1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
  }

  .subtitle {
    color: var(--color-text-2);
    font-size: 1.1rem;
    margin-bottom: 24px;
  }

  .search-box {
    max-width: 600px;
    margin: 0 auto;
  }

  .search-input {
    height: 48px;
    border-radius: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .video-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    justify-content: center;
    margin: 0 auto;
    max-width: 1200px;
  }

  .video-card {
    border-radius: 12px;
    overflow: hidden;
    background: var(--color-bg-2);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  .video-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  }

  .video-card-inner {
    display: flex;
    flex-direction: column;
  }

  .video-cover-wrapper {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
    height: 0;
    overflow: hidden;
  }

  .video-cover-wrapper img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .video-card:hover .video-cover-wrapper img {
    transform: scale(1.05);
  }

  .cover-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #f5f6f7;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #86909c;
  }

  .cover-placeholder .arco-icon {
    font-size: 36px;
    opacity: 0.5;
  }

  .video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .video-card:hover .video-overlay {
    opacity: 1;
  }

  .play-btn {
    width: 48px;
    height: 48px;
    font-size: 20px;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(22, 93, 255, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(22, 93, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(22, 93, 255, 0);
    }
  }

  .video-info {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .video-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 12px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: var(--color-text-1);
  }

  .video-link {
    text-decoration: none;
  }

  .video-actions {
    display: flex;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid #f2f3f5;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-bg-3);
    color: #4e5969;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .action-btn:hover {
    background: #e8f2ff;
    color: #165dff;
    transform: scale(1.1);
  }

  .favorite-btn .star-icon {
    font-size: 16px;
  }

  .favorited {
    color: #ffb400;
  }

  .video-list-enter-active,
  .video-list-leave-active {
    transition: all 0.5s ease;
  }

  .video-list-enter-from,
  .video-list-leave-to {
    opacity: 0;
    transform: translateY(30px);
  }

  .play-btn-link {
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .video-grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
      max-width: 800px;
    }
    
    .page-title {
      font-size: 2rem;
    }
    
    .subtitle {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    .recommend-container {
      padding: 0 16px;
    }
    
    .video-grid {
      grid-template-columns: 1fr;
      max-width: 400px;
    }
    
    .search-input {
      height: 40px;
    }
  }

  /* 中等尺寸屏幕（平板电脑） */
  @media (max-width: 992px) {
    .video-grid {
      grid-template-columns: repeat(2, 1fr);
      max-width: 800px;
    }
  }

  /* 小屏幕（手机） */
  @media (max-width: 576px) {
    .video-grid {
      grid-template-columns: 1fr;
      max-width: 400px;
    }
  }

  .results-section {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }

  .results-section .arco-spin {
    width: 100%;
  }

  .results-section .arco-empty {
    margin: 40px auto;
  }
  </style>