<template>
    <a-layout class="layout-demo">
        <a-layout-sider :collapsible="true" breakpoint="xl" :collapsed="isCollapsed" @collapse="onCollapse">
          <div :class="[isCollapsed ? 'logo2' : 'logo']" />
          <a-menu
            :default-selected-keys="['0_1']"
            :selected-keys="selectedKeys"
            :style="{ width: '100%' }"
            @menu-item-click = handleMenuClick
          >
          <!--根据点击的菜单项渲染content内容，不用再转到新路由-->
            <a-menu-item key="0_1">
              <IconHome></IconHome>
              首页
            </a-menu-item>

            <a-menu-item key="3_0">
              <icon-robot />
              AI 助手
            </a-menu-item>
    
            <a-sub-menu key="1">
              <template #icon><icon-apps /></template>
              <template #title>PPT管理</template>
              <a-menu-item key="1_2">
                <icon-bulb />
                一键生成PPT
              </a-menu-item>
              <a-menu-item key="1_1">
                <icon-cloud />
                模板查询
              </a-menu-item>
              <a-menu-item key="1_0">
                <icon-list />
                历史记录
              </a-menu-item>
            </a-sub-menu>

            <a-sub-menu key="2">
              <template #icon><icon-book /></template>
              <template #title>题目管理</template>
              <a-menu-item key="2_0">
                <icon-question />
                题目生成
              </a-menu-item>
              <a-menu-item key="2_1">
                <icon-list />
                题目管理
              </a-menu-item>
              <a-menu-item key="2_2">
                <icon-file />
                试卷组织
              </a-menu-item>
            </a-sub-menu>

            <a-menu-item key="4_0">
              <icon-thumb-up />
              视频推荐
            </a-menu-item>

            <a-menu-item key="5_0">
              <icon-user />
                修改个人信息
            </a-menu-item>
    
          </a-menu>
    
        </a-layout-sider>
        <a-layout>
          <a-layout-header>
            <div class="header" style="font-size: medium;">
              <a-breadcrumb :routes="routes"/>
              <div class="header-actions">
                <a-button type="primary" :status="isLoggedIn ? 'warning' : 'normal'" @click="isLoggedIn ? handleLogout() : showLoginModal()" class="login-btn">
                  <template #icon><icon-user /></template>
                  {{ isLoggedIn ? '退出登录' : '登录' }}
                </a-button>
                <a-button
                  class="theme-toggle"
                  shape="circle"
                  @click="toggleTheme"
                >
                  <template #icon>
                    <icon-moon-fill v-if="isDarkMode" />
                    <icon-sun-fill v-else />
                  </template>
                </a-button>
              </div>
            </div>
          </a-layout-header >
          <a-layout style="padding: 0 24px;">
            <a-breadcrumb :style="{ margin: '16px 0' }">
            </a-breadcrumb>
            <!--动态渲染-->
            <a-layout-content>
              
              <keep-alive>
                <component :is="currentComponent" @navigate="handleMenuClick"/>
              </keep-alive>
            </a-layout-content>
            <div class="footer">
                <div class="center">
                  <div>此网站仅供个人学习用途</div>
                  <div style="margin-left: 5px;margin-right: 5px;">|</div>
                  <div>不得以任何形式转发、宣传此网站相关内容</div> 
                </div>
            </div>
          </a-layout>
        </a-layout>
      </a-layout>
    
    <!-- 登录弹窗 -->
    <a-modal
      v-model:visible="loginModalVisible"
      title="用户登录"
      :width="600"
      :mask-closable="true"
      :footer="false"
      :unmount-on-close="true"
    >
      <Login />
    </a-modal>
    
      </template>
      
    
    
    
    
<script setup lang="ts">
import { Message, Notification,type BreadcrumbRoute } from '@arco-design/web-vue';
import { defineAsyncComponent, markRaw, onMounted, ref } from 'vue';
// import { jwtDecode } from 'jwt-decode'

import {
  IconHome,
  IconUser,
  IconThumbUp,
  IconBook,
  IconCloud,
  IconList,
  IconQuestion,
  IconApps,
  IconBulb,
  IconFile,
  IconRobot,
  IconMoonFill,
  IconSunFill,
} from '@arco-design/web-vue/es/icon';
import { useRouter } from 'vue-router';

const Main = defineAsyncComponent(() => import('./Main.vue'));
const Themes = defineAsyncComponent(() => import('./Themes.vue'));
const PptGenerator = defineAsyncComponent(() => import('./PptGenerator.vue'));
const History = defineAsyncComponent(() => import('./History.vue'));
const UserInfo = defineAsyncComponent(() => import('./UserInfo.vue'));
const Questions = defineAsyncComponent(() => import('./Questions.vue'));
const QuestionManage = defineAsyncComponent(() => import('./QuestionManage.vue'));
const ExamOrganization = defineAsyncComponent(() => import('./ExamOrganization.vue'));
const Login = defineAsyncComponent(() => import('./Login.vue'));
const AIChat = defineAsyncComponent(() => import('./AIChat.vue'));
const Videos = defineAsyncComponent(() => import('./Videos.vue'));

const isCollapsed = ref();
const currentComponent = ref();
const loginModalVisible = ref(false);
const isLoggedIn = ref(false);
const selectedKeys = ref(['0_1']);

const router = useRouter();

currentComponent.value = markRaw(Main);

// 显示登录弹窗
const showLoginModal = () => {
  loginModalVisible.value = true;
};

// 退出登录
const handleLogout = () => {
  // 清除登录状态和令牌
  sessionStorage.removeItem('isLogin');
  localStorage.removeItem('username');
  localStorage.removeItem('token');
  localStorage.removeItem('token_time');
  localStorage.removeItem('id');
  isLoggedIn.value = false;
  Message.success('已成功退出登录');
  window.location.reload();
};

const onCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  document.documentElement.style.setProperty('--header-width', isCollapsed.value ? '90%' : '80%');
}


const routes = ref<BreadcrumbRoute[]>([]);
const isDarkMode = ref(document.body.getAttribute('arco-theme') === 'dark');



const handleMenuClick = (key: string) => {
  switch (key) {
    case '0_1':
      routes.value = [
        {
          path: '/',
          label: '首页'
        }
      ]
      currentComponent.value = markRaw(Main);
      selectedKeys.value = ['0_1'];
      break;


    case '1_0':
      routes.value = [
        {
          path: '/',
          label: '首页'
        },
        {
          path: '/',
          label: 'PPT管理'
        },
        {
          path: '/',
          label: '历史记录'
        },
      ]
      currentComponent.value = markRaw(History);
      selectedKeys.value = ['1_0'];
      break;

    case '1_1':
      routes.value = [
        {
          path: '/',
          label: '首页'
        },
        {
          path: '/',
          label: 'PPT管理'
        },
        {
          path: '/',
          label: '模板查询'
        },
      ]
      currentComponent.value = markRaw(Themes);
      selectedKeys.value = ['1_1'];
      break;

    case '1_2':
      routes.value = [
        {
          path: '/',
          label: '首页'
        },
        {
          path: '/',
          label: 'PPT管理'
        },
        {
          path: '/',
          label: '一键生成PPT'
        },
      ]
      currentComponent.value = markRaw(PptGenerator);
      selectedKeys.value = ['1_2'];
      break;

    case '2_0':
      routes.value = [
        {
          path: '/',
          label: '首页'
        },
        {
          path: '/',
          label: '题目管理'
        },
        {
          path: '/',
          label: '题目生成'
        },
      ]
      currentComponent.value = markRaw(Questions);
      selectedKeys.value = ['2_0'];
      break;

    case '2_1':
      routes.value = [
        {
          path: '/',
          label: '首页'
        },
        {
          path: '/',
          label: '题目管理'
        },
        {
          path: '/',
          label: '题目管理'
        }
      ]
      currentComponent.value = markRaw(QuestionManage);
      selectedKeys.value = ['2_1'];
      break;

      case '2_2':
      routes.value = [
        {
          path: '/',
          label: '首页'
        },
        {
          path: '/',
          label: '题目管理'
        },
        {
          path: '/',
          label: '试卷组织'
        }
      ]
      currentComponent.value = markRaw(ExamOrganization);
      selectedKeys.value = ['2_2'];
      break;

      case '3_0':
        routes.value = [
          {
            path: '/',
            label: 'AI助手'
          }
        ]
        currentComponent.value = markRaw(AIChat);
        selectedKeys.value = ['3_0'];
        break;

      case '4_0':
      routes.value = [
        {
          path: '/',
          label: '视频推荐'
        }
      ]
      currentComponent.value = markRaw(Videos);
      selectedKeys.value = ['4_0'];
      break;

      case '5_0':
      routes.value = [
        {
          path: '/',
          label: '修改个人信息'
        }
      ]
      currentComponent.value = markRaw(UserInfo);
      selectedKeys.value = ['5_0'];
      break;

    default:
      Message.error('未找到匹配的子菜单');
  }
}

const toggleTheme = () => {
  if (isDarkMode.value) {
    document.body.removeAttribute('arco-theme');
  } else {
    document.body.setAttribute('arco-theme', 'dark');
  }
  isDarkMode.value = !isDarkMode.value;
  // 保存主题偏好到本地存储
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
};

// 设置2小时(7200000毫秒)的定时器,提前3分钟告诉用户token即将过期,每分钟检查一次
const twoHoursInMs = 2 * 60 * 60 * 1000;
const expireTimer = () => { 
  return setInterval(() => {
    const leftTime = twoHoursInMs - (new Date().getTime() - new Date(localStorage.getItem('token_time') || '').getTime());
      if(leftTime < 3 * 60 * 1000){
        Message.info('token即将过期，请重新登录，即将跳转至登录页面');
        sessionStorage.removeItem('isLogin');
        localStorage.removeItem('token');
        localStorage.removeItem('token_time');
        isLoggedIn.value = false;
        // 等待3秒
        setTimeout(() => {
          router.push('/login');
        }, 3 * 1000);
      }
  }, 60 * 1000);
};

// 在组件挂载时读取本地存储的主题设置和登录状态
onMounted(() => {
  document.documentElement.style.setProperty('--header-width', '80%')
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.setAttribute('arco-theme', 'dark');
    isDarkMode.value = true;
  }
  
  // 检查用户是否已登录
  isLoggedIn.value = sessionStorage.getItem('isLogin') === 'true';
  if(isLoggedIn.value){
    expireTimer();
  }
});

    
</script>
    
<style scoped>
    .layout-demo {
      height: 99vh;
      background: var(--color-bg-2);
      border: 1px solid var(--color-border);
    }
    .layout-demo :deep(.arco-layout-sider) .logo {
      height: 32px;
      margin: 12px 8px;
    }
    /*设置Logo图片 */
    .layout-demo :deep(.arco-layout-sider-light) .logo{
      background-image: url(../assets/Logo.png);
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    
    .layout-demo :deep(.arco-layout-sider) .logo2 {
      height: 32px;
      margin: 12px 8px;
    }
    /*设置Logo图片 */
    .layout-demo :deep(.arco-layout-sider-light) .logo2{
      background-image: url(../assets/Logo2.png);
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    
    .layout-demo :deep(.arco-layout-header) {
      height: 64px;
      line-height: 64px;
      margin: 0 32px;
      border-bottom: 3px solid rgb(189, 189, 189);
      position: fixed;
      width: var(--header-width);
      z-index: 100;
      background: var(--color-bg-2);
      transition: all 0.2s;
    }
    
    /* 调整内容区域的上距，避免被固定header遮挡 */
    .layout-demo :deep(.arco-layout-content) {
      margin-top: 64px;
    }
    
    .layout-demo :deep(.arco-layout-footer) {
      height: 48px;
      color: var(--color-text-2);
      font-weight: 400;
      font-size: 14px;
      line-height: 48px;
    }
    .layout-demo :deep(.arco-layout-footer) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      font-size: 16px;
      font-stretch: condensed;
      text-align: center;
    }
    .center {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .footer {
      margin-top: 10px;
      font-size: 12px;
      color: var(--color-text-3);
    }
    .theme-toggle {
      margin-left: auto;
      transition: all 0.3s;
      background-color: var(--color-text-4);
      border: 1px solid var(--color-border-2);
    }
    
    .theme-toggle:hover {
      transform: rotate(30deg);
      background-color: var(--color-fill-2);
    }
    
    /* 修改 header 样式以适应新按钮 */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 90%;
      margin-left: 3%;
      margin-top: 1.5%;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .login-btn {
      margin-right: 8px;
    }

</style>
