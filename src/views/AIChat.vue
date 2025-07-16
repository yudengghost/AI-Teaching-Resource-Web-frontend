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
        <a-empty
            v-if="messages.length <= 1"   
            description="🤖开始和AI助手聊天吧"
            style="height: 50vh;display: flex;align-items: center;justify-content: center;"
        >
            <template #image>
            </template>
        </a-empty>
        
        <template v-else>
          <div v-for="(message, index) in messages.slice(1)" :key="index" :class="['message-item', message.role]">
            <a-avatar :style="{ backgroundColor: message.role === 'user' ? '#B0C4DE' : '#9370DB' }">
              {{ message.role === 'user' ? '👤' : '🤖' }}
            </a-avatar>
            <a-card :bordered="false" :class="['message-card', message.role]">
              <div v-html="formatMessage(message.content)"></div>
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
            @keypress.ctrl.enter="sendMessage"
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
import {
  IconRobot,
  IconSend,
  IconDelete
} from '@arco-design/web-vue/es/icon';

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
    content: "你是智慧问答助手，负责帮用户答疑解难，用户的问题可能涉及多个领域，请根据用户的问题，给出准确的回答。回答可以加上emoji表情，让回答更加生动有趣。"
  }
]);

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
</style>
