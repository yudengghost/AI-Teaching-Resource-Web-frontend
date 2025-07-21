<template>
  <div class="main-container">
    <header class="header">
      <h1 class="title">AI教学资源生成管理平台</h1>
    </header>

    <div class="content">
      <section class="intro-section">
        <h2>平台简介</h2>
        <p>
          欢迎使用AI教学资源生成管理平台，这是一个专为教育工作者设计的智能化平台，
          致力于提供高效、便捷的教学PPT资源生成与管理服务。我们利用先进的人工智能技术，
          帮助教师快速生成高质量的教学演示文稿，提升教学效率，丰富教学内容。
        </p>
      </section>

      <section class="features-section">
        <h2>功能导航</h2>
        <div class="features-grid">
          <div class="feature-card" @click="$emit('navigate', '1_2')">
            <div class="feature-icon">📊</div>
            <h3>一键生成PPT</h3>
            <p>根据教学内容自动生成结构清晰、内容丰富的PPT，支持多种学科和教学风格</p>
          </div>
          <div class="feature-card" @click="$emit('navigate', '1_0')">
            <div class="feature-icon">🗂️</div>
            <h3>历史记录</h3>
            <p>查看和管理所有生成的教学资源，支持分类、标签和搜索</p>
          </div>
          <div class="feature-card" @click="$emit('navigate', '1_1')">
            <div class="feature-icon">🎨</div>
            <h3>模板查询</h3>
            <p>浏览各种PPT模板，选择适合自己教学风格的模板</p>
          </div>
          <div class="feature-card" @click="$emit('navigate', '2_0')">
            <div class="feature-icon">❓</div>
            <h3>题目生成</h3>
            <p>智能生成各类题目，满足不同教学场景的测试需求</p>
          </div>
          <div class="feature-card" @click="$emit('navigate', '2_1')">
            <div class="feature-icon">📝</div>
            <h3>题目管理</h3>
            <p>集中管理已生成的各类题目，便于后续使用和修改</p>
          </div>
          <div class="feature-card" @click="$emit('navigate', '2_2')">
            <div class="feature-icon">📑</div>
            <h3>试卷组织</h3>
            <p>根据题目库快速组织试卷，提高教学效率</p>
          </div>
          <div class="feature-card" @click="$emit('navigate', '3_0')">
            <div class="feature-icon">🤖</div>
            <h3>AI助手</h3>
            <p>AI助手，根据教学内容，智能推荐功能</p>
          </div>
          <div class="feature-card" @click="$emit('navigate', '4_0')">
            <div class="feature-icon">🎥</div>
            <h3>视频推荐</h3>
            <p>根据教学内容，智能推荐视频</p>
          </div>
        </div>
      </section>

      <!-- <section class="advantages-section">
        <h2>平台优势</h2>
        <ul class="advantage-list">
          <li><strong>提升效率</strong>：减少备课时间，将更多精力投入教学互动</li>
          <li><strong>智能定制</strong>：根据不同教学场景和目标，生成个性化PPT</li>
          <li><strong>资源整合</strong>：集中管理教学资源，避免重复工作</li>
          <li><strong>持续更新</strong>：AI模型不断学习进步，生成质量持续提升</li>
        </ul>
      </section> -->
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义emit事件
defineEmits(['navigate']);
</script>

<style scoped>
.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
}

.title {
  font-size: 32px;
  color: var(--color-text-1);
  margin: 0;
}

.content {
  display: flex;
  flex-direction: column;
}

section {
  margin-bottom: 30px;
}

h2 {
  font-size: 24px;
  color: var(--color-text-2);
  border-left: 4px solid #3498db;
  padding-left: 10px;
  margin-bottom: 20px;
}

.intro-section p {
  font-size: 16px;
  line-height: 1.8;
  color: var(--color-text-2);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.feature-card {
  background: var(--color-bg-3);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  background-color: var(--color-fill-2);
}

.feature-icon {
  font-size: 36px;
  margin-bottom: 15px;
}

.feature-card h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: var(--color-text-2);
}

.feature-card p {
  font-size: 14px;
  color: var(--color-text-2);
  line-height: 1.6;
}

.advantage-list {
  list-style-type: none;
  color: var(--color-text-2);
  padding: 0;
}

.advantage-list li {
  margin-bottom: 15px;
  padding-left: 20px;
  position: relative;
}

.advantage-list li:before {
  content: "✓";
  color: #3498db;
  position: absolute;
  left: 0;
  top: 0;
}
</style>