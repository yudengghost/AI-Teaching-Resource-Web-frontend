<template>
    <div class="user-info-container">
      <div class="page-header">
        <h1 class="page-title">个人信息</h1>
        <p class="page-subtitle">查看和修改您的个人资料信息</p>
      </div>
      
      <div class="card">
        <div class="user-header">
          <div class="avatar-container">
            <a-avatar :size="80" :style="{ backgroundColor: '#3370ff' }">
              {{ avatarText }}
            </a-avatar>
          </div>
          <div class="user-info">
            <h2 class="user-name">{{ form.nickname || form.username || '用户' }}</h2>
            <p class="user-id">账号: {{ form.username }}</p>
          </div>
        </div>
        
        <a-divider />
        
        <a-form :model="form" layout="vertical" class="form-container">
          <div class="form-grid">
            <a-form-item field="username" label="用户名" required>
              <a-input v-model="form.username" placeholder="请输入用户名" allow-clear>
                <template #prefix>
                  <icon-user />
                </template>
              </a-input>
            </a-form-item>
            
            <a-form-item field="nickname" label="昵称">
              <a-input v-model="form.nickname" placeholder="请输入昵称" allow-clear>
                <template #prefix>
                  <icon-user-add />
                </template>
              </a-input>
            </a-form-item>
            
            <a-form-item field="phone" label="电话">
              <a-input v-model="form.phone" placeholder="请输入电话" allow-clear>
                <template #prefix>
                  <icon-phone />
                </template>
              </a-input>
            </a-form-item>
            
            <a-form-item field="birthday" label="生日">
              <a-date-picker v-model="form.birthday" placeholder="请选择生日" allow-clear>
                <template #prefix>
                  <icon-calendar />
                </template>
              </a-date-picker>
            </a-form-item>
            
            <a-form-item field="gender" label="性别">
              <a-select v-model="form.gender" placeholder="请选择性别">
                <a-option value="男">男</a-option>
                <a-option value="女">女</a-option>
                <a-option value="保密">保密</a-option>
              </a-select>
            </a-form-item>
  
          </div>
          
          <div class="form-actions">
            <a-space>
              <a-button type="primary" @click="saveUserInfo" :loading="loading" class="save-button">
                <template #icon><icon-save /></template>
                保存修改
              </a-button>
              <a-button @click="resetForm" class="reset-button">
                <template #icon><icon-refresh /></template>
                重置
              </a-button>
            </a-space>
          </div>
        </a-form>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { 
    IconUser, 
    IconUserAdd,
    IconPhone, 
    IconSave,
    IconRefresh,
    IconCalendar
  } from '@arco-design/web-vue/es/icon';
  
  // 表单数据
  const form = ref({
      id: '',
      username: '',
      nickname: '',
      phone: '',
      gender: '',
      birthday: '',
  });
  
  const loading = ref(false);
  
  // 计算头像显示文字
  const avatarText = computed(() => {
    if (form.value.nickname) {
      return form.value.nickname.substring(0, 1).toUpperCase();
    }
    if (form.value.username) {
      return form.value.username.substring(0, 1).toUpperCase();
    }
    return 'U';
  });
  
  const getUserInfo = async () => {
    const id = localStorage.getItem('id');
  
    const requestInstance = new Request(`${import.meta.env.VITE_BACKEND_URL}/api/user/getUser?id=${id}`,{
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      })
      const response = await fetch(requestInstance);
      const result = await response.json();
  
      if(response.ok){
        if(result.code == '0'){
            form.value.id = result.data.id;
            form.value.username = result.data.username;
            form.value.nickname = result.data.nickname;
            form.value.phone = result.data.phone;
            form.value.birthday = result.data.birthday;
            form.value.gender = result.data.gender;
        }
      }
  }
  
  // 保存用户信息
  const saveUserInfo = async () => {
    loading.value = true;
    try {
        const id = localStorage.getItem('id');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/update?id=${id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(form.value)
      })
  
      const result = await response.json();
      if(response.ok){
          if(result.code == '0'){
              Message.success('个人信息保存成功');
          }else{
              Message.error('保存失败，请稍后重试');
          }
      }else{
          Message.error('保存失败，请稍后重试');
      }
    } catch (error) {
      console.error('保存失败:', error);
      Message.error('保存失败，请稍后重试');
    } finally {
      loading.value = false;
    }
  };
  
  // 重置表单
  const resetForm = () => {
    // 保留用户名，重置其他字段
    const username = form.value.username;
    form.value = {
      id: '',
      username,
      nickname: '',
      phone: '',
      gender: '',
      birthday: '',
    };
  };
  
  
  onMounted(() => {
    if(sessionStorage.getItem('isLogin') === 'true'){
        getUserInfo();
    }
    else{
        Message.error('请先登录');
    }
  });
  </script>
  
  <style scoped>
  .user-info-container {
    margin: 0 auto;
    padding: 24px;
  }
  
  .page-header {
    margin-bottom: 24px;
  }
  
  .page-title {
    font-size: 28px;
    color: var(--color-text-1);
    margin-bottom: 8px;
    font-weight: 600;
  }
  
  .page-subtitle {
    color: var(--color-text-3);
    font-size: 14px;
  }
  
  .card {
    background-color: var(--color-bg-1);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    padding: 24px;
    transition: all 0.3s;
  }
  
  .user-header {
    display: flex;
    align-items: center;
    margin-bottom: 24px;
    gap: 24px;
  }
  
  .avatar-container {
    flex-shrink: 0;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
  }
  
  .user-name {
    font-size: 20px;
    margin: 0 0 8px 0;
    color: var(--color-text-1);
    font-weight: 500;
  }
  
  .user-id {
    margin: 0;
    color: var(--color-text-3);
    font-size: 14px;
  }
  
  .form-container {
    margin-top: 16px;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 32px;
  }
  
  .save-button, .reset-button {
    min-width: 120px;
    transition: all 0.2s;
  }
  
  .save-button:hover, .reset-button:hover {
    transform: translateY(-2px);
  }
  
  :deep(.arco-form-item-label) {
    font-weight: 500;
  }
  
  :deep(.arco-input),
  :deep(.arco-select) {
    border-radius: 4px;
    transition: all 0.3s;
  }
  
  :deep(.arco-input:hover),
  :deep(.arco-select:hover) {
    border-color: var(--color-primary-light-3);
  }
  
  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .user-header {
      flex-direction: column;
      text-align: center;
    }
  }
  </style>