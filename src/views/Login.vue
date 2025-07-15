<template>
  <div class="card">
      <a-card hoverable class="login-card">
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
            <h2 class="login-title">用户登录</h2>
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
                <a-button type="primary" long @click="login">
                  登录
                </a-button>
                <p>没有账号？<a-link @click="showRegister">注册</a-link></p>
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


const login = async () => {
    const requestBody = {
        'username': form.value.username,
        'password': form.value.password
    };
    const requestInstance = new Request(`${import.meta.env.VITE_BACKEND_URL}/api/user/login`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    })
    console.log(`${import.meta.env.VITE_BACKEND_URL}/api/user/login`);
    const response = await fetch(requestInstance);
    const result = await response.json();
    if(response.ok){
        if(result.code == 0){
          console.log('login');
            const token = await getToken();
            sessionStorage.setItem('isLogin','true');
            localStorage.setItem('token',token);
            localStorage.setItem('token_time',new Date().toISOString());
            localStorage.setItem('username', result.data.username);
            localStorage.setItem('id', result.data.id);
            Message.success('登录成功');
            // 刷新页面
            window.location.reload();
        }
    }
    else{
        console.log(result);
        Message.error('登录失败');
        sessionStorage.removeItem('isLogin');
        localStorage.removeItem('token');
        localStorage.removeItem('token_time');
    }
}

const getToken = async () => {

    const requestBody = {
            'uid': null,
            'limit': null,
            'timeOfHours': 2
            };
    try{
        const requestInstance = new Request(`${import.meta.env.VITE_API_URL}/api/user/createApiToken`,{
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Api-Key': import.meta.env.VITE_API_KEY,
            },
            body: JSON.stringify(requestBody)
        })
        const response = await fetch(requestInstance);
        const result = await response.json();
        if(response.ok){
        if(result.code == 0){
            const token = result.data.token;
            return token;
        }
        else{
            console.log('获取token失败');
            console.log(result);
            console.log(import.meta.env.VITE_API_KEY);
        }
        }
        else{
        console.log('获取token失败');
        }
    }
    catch(error){
    console.log('获取token失败:' + error);
    }
}

const showRegister = () => {
    router.push('/register');
}
</script>

<style scoped>
 .login-card {
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
  
  .login-title {
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