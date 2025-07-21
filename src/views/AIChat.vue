<template>
    <a-card class="chat-card">
      <template #title>
        <div class="chat-header">
          <a-space>
            <icon-robot />
            <span>AI 智能助手</span>
          </a-space>
          <a-button type="text" status="danger" @click="clearHistory">
            <icon-delete />清空对话
          </a-button>
        </div>
      </template>

      <div class="chat-messages" ref="chatMessages">
        <!-- 替换原来的a-empty组件，使用自定义设计 -->
        <div v-if="messages.length <= 1" class="custom-empty-state">
          <div class="empty-state-content">
            <div class="robot-avatar-container">
              <div class="robot-avatar">
                <icon-robot />
              </div>

            </div>
            
            <div class="empty-state-text">
              <h2>欢迎使用 AI 教学助手</h2>
              <p>我可以帮您准备教学资料、生成试题或回答教育相关问题</p>
            </div>
            
            <div class="suggestion-cards">
              <div class="suggestion-card" @click="userInput = '请帮我生成一份初中语文《水浒传》的PPT大纲'">
                <icon-file />
                <span>生成PPT大纲</span>
              </div>
              <div class="suggestion-card" @click="userInput = '出5道高中物理力学题目'">
                <icon-question-circle />
                <span>生成习题</span>
              </div>
              <div class="suggestion-card" @click="userInput = '推荐3个适合初中生的数学教学视频'">
                <icon-video-camera />
                <span>推荐教学视频</span>
              </div>
              <div class="suggestion-card" @click="userInput = '如何提高学生的学习积极性？'">
                <icon-bulb />
                <span>教学方法咨询</span>
              </div>
              <div class="suggestion-card" @click="userInput = '设计一份初中语文《水浒传》教案，包含教学目标、教学重难点、教学过程、板书设计、教学反思。'">
                <icon-pen />
                <span>教案设计</span>
              </div>
              <div class="suggestion-card" @click="userInput = '切换为幽默风格'">
                <icon-palette />
                <span>风格切换</span>
              </div>
            </div>
          </div>
        </div>
        
        <template v-else>
          <div v-for="(message, index) in messages.slice(1)" :key="index" :class="['message-item', message.role]">
            <a-avatar :style="{ backgroundColor: message.role === 'user' ? '#B0C4DE' : '#9370DB' }">
              {{ message.role === 'user' ? '👤' : '🤖' }}
            </a-avatar>
            <a-card :bordered="false" :class="['message-card', message.role]">
              <div v-html="formatMessage(message.content)"></div>
              
              <!-- 添加功能按钮区域 -->
              <div v-if="message.role === 'assistant'" class="action-buttons">
                <a-button 
                  v-if="detectFunctionType(message.content) === 'ppt'" 
                  type="primary" 
                  size="small" 
                  @click="$emit('navigate', '1_2')"
                >
                  <template #icon><icon-file /></template>
                  前往PPT生成页面
                </a-button>
                
                <a-button 
                  v-if="detectFunctionType(message.content) === 'question'" 
                  type="primary" 
                  size="small" 
                  @click="$emit('navigate', '2_0')"
                >
                  <template #icon><icon-question-circle /></template>
                  前往题目生成页面
                </a-button>
                
                <a-button 
                  v-if="detectFunctionType(message.content) === 'video'" 
                  type="primary" 
                  size="small" 
                  @click="$emit('navigate', '4_0')"
                >
                  <template #icon><icon-video-camera /></template>
                  前往视频推荐页面
                </a-button>
              </div>
            </a-card>
          </div>
          
          <div v-if="loading" class="message-item assistant">
            <a-avatar :style="{ backgroundColor: '#9370DB' }">🤖</a-avatar>
            <a-card :bordered="false" class="message-card assistant">
              <a-skeleton v-if="!streamingContent" loading animation>
                <a-skeleton-line :rows="3" />
              </a-skeleton>
              <div v-else class="streaming" v-html="formatMessage(streamingContent)"></div>
            </a-card>
          </div>
        </template>
      </div>

      <div class="chat-input">
        <a-input-group compact class="input-group">
          <a-textarea
            v-model="userInput"
            placeholder="请输入您的问题..."
            :auto-size="{ minRows: 2, maxRows: 7 }"
            allow-clear
            @keydown.ctrl.enter="sendMessage"
            class="input-area"
          />
          <a-button 
            type="primary" 
            :disabled="loading || !userInput.trim()" 
            @click="sendMessage"
            class="send-button"
          >
            <template #icon>
              <icon-send />
            </template>
            {{ loading ? '请稍等' : '发送' }}
          </a-button>
        </a-input-group>
        <div class="input-hint">按Ctrl+Enter发送</div>
      </div>
    </a-card>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import * as marked from 'marked';
import { Message } from '@arco-design/web-vue';
import { useRouter } from 'vue-router';
import {
  IconRobot,
  IconSend,
  IconDelete,
  IconFile,
  IconQuestionCircle,
  IconVideoCamera,
  IconBulb,
  IconPen,
  IconPalette
} from '@arco-design/web-vue/es/icon';

// 引入路由
const router = useRouter();

// 定义接口
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }[];
}

// 从环境变量获取 API Key
const apiKey = ref<string>(import.meta.env.VITE_MOONSHOT_API_KEY || '');
const userInput = ref<string>('');
const loading = ref<boolean>(false);
const streamingContent = ref<string>('');
const chatMessages = ref<HTMLElement | null>(null);

// 消息历史（包含系统提示）
const messages = ref<Message[]>([
  {
    role: "system", 
    content: `
你是一位"AI教学资源辅助智能体"，同时具备以下四重身份：
1) 教案设计师：擅长把任何知识点拆解成符合布鲁姆认知层级的教学目标、课堂活动与评估方式。  
2) 内容生成器：可产出高质量PPT大纲、原创试题、可视化图表脚本、互动小游戏。 
3) 资源推荐：可推荐符合教学目标的优质教学资源，包括视频、音频、文档等。
4) 24h教育顾问：能即时回答学生、家长、教师的任何教学/学习疑问，并给出可落地的下一步行动清单。

行为守则  
- 精准教学：所有输出先标注适用学段（小学/初中/高中/本科/职教/成人），再给出内容。  
- 证据溯源：如引用资料，在文末附可公开访问的链接或DOI。  
- 透明可控：若用户未指定风格，默认"简洁+可视化"，并在末尾提示"如需学术/活泼/极简风格，请回复'切换为xx风格'"。

核心功能指令 
1. 生成PPT：  
   用户："生成高一物理《牛顿第二定律》PPT，25页，双语"  
   你：内容正文输出【ppt描述+大纲+备注】三部分，并提醒用户前往PPT生成页面操作。  

2. 原创出题：  
   用户："出5道小学四年级数学应用题，情境为超市购物，附评分标准。"  
   你：内容正文按【考点+题目概要】两部分呈现，并提醒用户前往题目生成界面操作。  

3. 资源推荐：  
   用户："推荐初中英语语法动画，CC字幕，3–5分钟。"  
   你：内容正文列出3条符合要求的视频资源关键词，并提醒用户前往视频推荐页面。 
   
4. 教案设计：
   用户："设计一份初中语文《水浒传》教案，包含教学目标、教学重难点、教学过程、板书设计、教学反思。"
   你：内容正文输出【教学目标+教学重难点+教学过程+板书设计+教学反思】五部分。

5. 即时问答：  
   用户："我家孩子二年级，识字量低，不爱阅读，怎么办？"  
   你：内容正文用"原因→策略→工具→7天打卡表"四步回答。  

6. 风格切换：  
   用户："切换为'幽默漫画风'。"  
   你：后续所有输出改用轻松漫画口吻，并插入emoji/颜文字。

输出模板示例  
适用学段：（小学/初中/高中/本科/职教/成人）
核心功能指令：（生成PPT/原创出题/资源推荐/教案设计/即时问答/风格切换）
内容正文： 
如需调整回答风格，请直接说"改为XX风格"。

记忆与个性化  
- 每轮对话记住用户身份（教师/学生/家长/教研员）。  
- 若用户说"记住我是高二班主任，偏好实验探究类资源"，则在后续输出中优先推荐实验视频、探究任务单。
    `
  }
]);

// 检测AI回复中的功能类型
const detectFunctionType = (content: string): string | null => {
  if (!content) return null;
  
  // 检测是否包含"核心功能指令：生成PPT"或相似文本
  if (content.includes('核心功能指令：生成PPT') || 
      content.includes('前往PPT生成页面') ||
      content.includes('PPT大纲') && content.includes('生成PPT')) {
    return 'ppt';
  }
  
  // 检测是否包含"核心功能指令：原创出题"或相似文本
  if (content.includes('核心功能指令：原创出题') || 
      content.includes('前往题目生成界面') ||
      content.includes('出题') && content.includes('题目生成')) {
    return 'question';
  }
  
  // 检测是否包含"核心功能指令：资源推荐"或相似文本
  if (content.includes('核心功能指令：资源推荐') || 
      content.includes('前往视频推荐页面') ||
      content.includes('视频资源')) {
    return 'video';
  }
  
  return null;
};


// 消息格式化（支持Markdown）
const formatMessage = (content: string): string => {
  if (!content) return '';
  return marked.parse(content) as string;
};

// 发送消息到Kimi API
const sendMessage = async (): Promise<void> => {
  if (!userInput.value.trim() || loading.value || !apiKey.value) return;
  
  // 添加用户消息
  const userMessage: Message = {
    role: "user",
    content: userInput.value.trim()
  };
  messages.value.push(userMessage);
  
  // 清空输入并设置加载状态
  userInput.value = '';
  loading.value = true;
  streamingContent.value = '';
  
  try {
    // 限制消息历史长度，保留最新的20条消息
    const messageHistory = [...messages.value];
    if (messageHistory.length > 21) { // 系统提示+20条消息
      messageHistory.splice(1, messageHistory.length - 21); // 保留系统提示
    }
    
    // 发送API请求
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/event-stream',
        'Authorization': `Bearer ${apiKey.value}`
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: messageHistory,
        temperature: 0.3,
        stream: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    // 处理流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }
    
    const decoder = new TextDecoder('utf-8');
    let fullContent = '';
    
    // 读取流
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // 解码响应数据
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data:') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.substring(5).trim()) as ApiResponse;
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              const content = data.choices[0].delta.content;
              fullContent += content;
              streamingContent.value = fullContent;
            }
          } catch (e) {
            console.error('解析SSE数据失败:', e);
          }
        }
      }
      
      // 滚动到底部
      await nextTick();
      scrollToBottom();
    }
    
    // 添加AI回复到消息历史
    messages.value.push({
      role: "assistant",
      content: fullContent
    });
    
  } catch (error) {
    console.error('发送消息失败:', error);
    messages.value.push({
      role: "assistant",
      content: `发生错误: ${error}`
    });
  } finally {
    loading.value = false;
    streamingContent.value = '';
    
    // 滚动到底部
    await nextTick();
    scrollToBottom();
  }
};

// 清空聊天历史
const clearHistory = (): void => {
  messages.value = messages.value.slice(0, 1); // 只保留系统提示
  Message.success('对话已清空');
};

// 滚动到底部
const scrollToBottom = (): void => {
  if (chatMessages.value) {
    chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
  }
};

// 组件挂载时滚动到底部
onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
.chat-card {
  width: 90%;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  margin: 16px 0;
  background-color: var(--color-fill-1);
  border-radius: 4px;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-card {
  max-width: 80%;
  border-radius: 8px;
  margin: 0 12px;
  background-color: var(--color-bg-2);
}

.message-card.user {
  background-color: var(--color-primary-light-1);
}

.message-card.assistant {
  background-color: var(--color-bg-2);
}

/* 添加功能按钮样式 */
.action-buttons {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.streaming::after {
  content: "▋";
  display: inline-block;
  vertical-align: bottom;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.chat-input {
  margin-top: auto;
  padding-top: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.input-area {
  flex: 1;
  border-radius: 4px !important;
}
.send-button {
  margin-top: 10px;
  margin-left: auto;
  border-radius: 4px !important;
}

.input-hint {
  text-align: right;
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 4px;
}

/* 适配Markdown内容样式 */
:deep(.arco-typography) {
  margin-bottom: 0;
}

:deep(pre) {
  background-color: var(--color-fill-1);
  padding: 12px;
  border-radius: 4px;
  margin: 8px 0;
  overflow-x: auto;
}

:deep(code) {
  font-family: monospace;
  background-color: var(--color-fill-1);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}

:deep(p) {
  margin: 0 0 10px;
}

:deep(p:last-child) {
  margin-bottom: 0;
}

:deep(ul), :deep(ol) {
  padding-left: 20px;
  margin: 10px 0;
}

/* 自定义空白状态样式 */
.custom-empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  background-color: var(--color-fill-1);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.robot-avatar-container {
  position: relative;
  margin-bottom: 20px;
}

.robot-avatar {
  width: 100px;
  height: 100px;
  background-color: var(--color-primary-light-1);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 40px;
  color: var(--color-primary);
}

.pulse-circles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pulse-circle {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--color-primary-light-2);
  animation: pulse 1.5s infinite ease-in-out;
}

.circle-1 {
  animation-delay: -0.3s;
}
.circle-2 {
  animation-delay: -0.1s;
}
.circle-3 {
  animation-delay: 0.1s;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.2);
    opacity: 0;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

.empty-state-text h2 {
  font-size: 24px;
  color: var(--color-text-1);
  margin-bottom: 8px;
}

.empty-state-text p {
  font-size: 16px;
  color: var(--color-text-3);
  margin-bottom: 20px;
}

.suggestion-cards {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.suggestion-card {
  background-color: var(--color-bg-2);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  width: 200px; /* Fixed width for cards */
}

.suggestion-card:hover {
  background-color: var(--color-fill-2);
}

.suggestion-card span {
  font-size: 14px;
  color: var(--color-text-1);
}
</style>
