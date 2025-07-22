<template>
    <div class="themes-container">
        <div class="themes-header">
            <h2>PPT模板库</h2>
            <div class="filter-section">
                <a-select v-model="requestBody.filters.category" placeholder="选择类目" allow-clear style="width: 120px; margin-right: 15px;">
                    <a-option v-for="option in categoryOptions" :key="option.value" :value="option.value">
                        {{ option.name }}
                    </a-option>
                </a-select>
                <a-select v-model="requestBody.filters.style" placeholder="选择风格" allow-clear style="width: 120px; margin-right: 15px;">
                    <a-option v-for="option in styleOptions" :key="option.value" :value="option.value">
                        {{ option.name }}
                    </a-option>
                </a-select>
                <a-select v-model="requestBody.filters.themeColor" placeholder="主题颜色" allow-clear style="width: 120px;">
                    <a-option v-for="option in themeColorOptions" :key="option.value" :value="option.value">
                        <div class="color-option">
                            <span v-if="option.value" class="color-block" :style="{ backgroundColor: option.value }"></span>
                            {{ option.name }}
                        </div>
                    </a-option>
                </a-select>
                <a-button type="primary" @click="handleSearch" style="margin-left: 15px;">搜索</a-button>
            </div>
        </div>

        <div class="themes-content">
            <a-spin :loading="loading" tip="加载中...">
                <a-table 
                    :columns="columns" 
                    :data="data" 
                    :pagination="{
                        total: total,
                        current: requestBody.page,
                        pageSize: requestBody.size,
                        showTotal: true,
                        onChange: onPageChange
                    }"
                    row-key="id"
                    :bordered="false"
                >
                    <template #coverUrl="{ record }">
                        <div class="cover-container">
                            <a-image
                                :src="record.coverUrl + '?token=' + token" 
                                :alt="record.subject || '模板封面'"
                                class="cover-image"
                            />
                        </div>
                    </template>
                    
                    <template #operations="{ record }">
                        <a-button type="text" @click="useTemplate(record)">
                            使用
                        </a-button>
                    </template>
                </a-table>
            </a-spin>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const token = ref(localStorage.getItem('token') || '');
const loading = ref(false);
const total = ref(0);

const categoryOptions = ref([{ name: "加载中...", value: "" }]);
const styleOptions = ref([{ name: "加载中...", value: "" }]);
const themeColorOptions = ref([{ name: "加载中...", value: "" }]);

const columns = ref([
    {
        title: '封面',
        dataIndex: 'coverUrl',
        slotName: 'coverUrl',
        width: 150,
    },
    {
        title: '主题',
        dataIndex: 'subject',
        ellipsis: true,
        tooltip: true
    },
    {
        title: '类目',
        dataIndex: 'category',
        ellipsis: true,
        tooltip: true
    },
    {
        title: '风格',
        dataIndex: 'style',
        ellipsis: true,
        tooltip: true
    },
    {
        title: '页数',
        dataIndex: 'num',
        width: 80,
    },
    {
        title: '创建时间',
        dataIndex: 'createTime',
        ellipsis: true,
        tooltip: true
    },
    {
        title: '操作',
        slotName: 'operations',
        width: 100,
        fixed: 'right',
    }
]);

const data = ref([]);
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

const getOptions = async () => {
    try{
        const token = localStorage.getItem('token');
        if(token){
            const requestInstance = new Request(`${import.meta.env.VITE_API_URL}/api/ppt/template/options`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'token': token
                }
            });
            const response = await fetch(requestInstance);
            const result = await response.json();
            if(response.ok && result.code === 0) {
                // 更新选项数据
                categoryOptions.value = result.data.category;
                styleOptions.value = result.data.style;
                themeColorOptions.value = result.data.themeColor;
            } else {
                console.error('获取筛选选项失败:', result.message);
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
        Message.error('获取筛选选项失败');
    }
}

const getThemes = async () => {
    loading.value = true;
    try{
        const token = localStorage.getItem('token');
        if(token){
            const requestInstance = new Request(`${import.meta.env.VITE_API_URL}/api/ppt/templates`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': token
                },
                body: JSON.stringify(requestBody.value)
            })
            const response = await fetch(requestInstance);
            const result = await response.json();
            if(response.ok){
                if(result.code == 0){
                    data.value = result.data;
                    total.value = result.total;
                }
                else{
                    console.log('获取主题列表失败:' + result.message);
                    Message.error('获取主题列表失败:' + result.message);
                }
            }
        }
        else{
            console.log('token为空')
            Message.error('token为空');
        }
    }
    catch(error){
        console.log('获取主题列表失败:' + error);
        Message.error('获取主题列表失败')
    }
    finally {
        loading.value = false;
    }
}

// 分页变化
const onPageChange = (page: number) => {
    requestBody.value.page = page;
    getThemes();
}

// 使用模板
const useTemplate = (template: any) => {
    Message.info(`正在准备使用模板：${template.subject}`);
    // 将选中的模板ID保存在本地存储中
    localStorage.setItem('selectedTemplateId', template.id);
    // 跳转到PPT生成页面
    router.push({
        path: '/ppt-generator',
        query: { templateId: template.id }
    });
}

// 搜索
const handleSearch = () => {
    requestBody.value.page = 1; // 重置到第一页
    getThemes();
}

// 组件挂载时获取数据
onMounted(() => {
    if(sessionStorage.getItem('isLogin') === 'true'){
        getOptions(); // 先获取筛选选项
        getThemes(); // 然后获取主题列表数据
    }
    else{
        Message.error('请先登录');
    }
});
</script>

<style scoped>
.themes-container {
    padding: 20px;
}

.themes-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.themes-header h2 {
    margin: 0;
    font-size: 20px;
    color: var(--color-text-1);
}

.filter-section {
    display: flex;
    align-items: center;
}

.cover-container {
    width: 120px;
    height: 68px;
    overflow: hidden;
    border-radius: 4px;
    background-color: #f2f3f5;
}

.cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
}

.cover-image:hover {
    transform: scale(1.05);
}

:deep(.arco-table-container) {
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

.color-option {
    display: flex;
    align-items: center;
    gap: 5px;
}

.color-block {
    width: 16px;
    height: 16px;
    border-radius: 3px;
    border: 1px solid #e5e5e5;
}
</style>