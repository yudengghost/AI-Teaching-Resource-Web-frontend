<template>
    <div class="card">
      <a-card hoverable class="register-card">
        <template #cover>
          <div class="card-cover">
            <img
              class="cover-image"
              alt="dessert"
              src="https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/a20012a2d4d5b9db43dfc6a01fe508c0.png~tplv-uwbnlip3yd-webp.webp"
            />
          </div>
        </template>
        
        <a-card-meta>
          <template #title>
            <h2 class="register-title">用户注册</h2>
          </template>
          <template #description>
            <a-form :model="form" layout="vertical">
              <a-form-item field="name" label="用户名">
                <a-input 
                  v-model="form.username" 
                  placeholder="请输入用户名..." 
                  allow-clear
                >
                  <template #prefix>
                    <icon-user />
                  </template>
                </a-input>
              </a-form-item>
              <a-form-item field="post" label="密码">
                <a-input-password 
                  v-model="form.password" 
                  placeholder="请输入密码..." 
                  allow-clear
                >
                  <template #prefix>
                    <icon-lock />
                  </template>
                </a-input-password>
              </a-form-item>
              <div class="button-wrapper">
                <a-button type="primary" long @click="register">
                  注册
                </a-button>
              </div>
            </a-form>
          </template>
        </a-card-meta>
      </a-card>
    </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const form = ref({
    username: '',
    password: ''
});

const register = async () => {
    const requestBody = {
        'username': form.value.username,
        'password': form.value.password,
        'role': 2
    };
    const requestInstance = new Request(`${import.meta.env.VITE_BACKEND_URL}/api/user/register`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    })
    const response = await fetch(requestInstance);
    const result = await response.json();
    if(response.ok){
        if(result.code == 0){
            Message.success('注册成功,即将跳转至首页');
            setTimeout(() => {
                router.push('/');
            }, 1000);
        }
    }
    else{
        Message.error('注册失败');
    }
}
</script>

<style scoped>
  .register-card {
    width: 360px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1;
  }
  
  .card-cover {
    height: 204px;
    overflow: hidden;
  }
  
  .cover-image {
    width: 100%;
    transform: translateY(-20px);
    transition: transform 0.3s ease;
  }
  
  .register-title {
    text-align: center;
    margin-bottom: 15px;
    color: #1d2129;
    font-size: 24px;
  }
  
  .button-wrapper {
    margin-top: 24px;
    margin-bottom: 10px;
  }
  
  .card {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    background-image: url(../assets/1.jpg);
    background-size:cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
  }
  
  .card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(4px);
  }
  
  :deep(.arco-form-item) {
    margin-bottom: 24px;
  }
  
  :deep(.arco-input-wrapper) {
    padding: 8px 12px;
  }
  
  :deep(.arco-btn) {
    height: 40px;
    font-size: 16px;
  }
</style>