<template>
  <div class="home-page">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">
            <span class="greeting">{{ greeting }}</span>
            <span class="wave-emoji">👋</span>
          </h1>
          <p class="welcome-date">
            <el-icon><Calendar /></el-icon>
            {{ currentDate }}
          </p>
        </div>
        <div class="welcome-actions">
          <el-button type="primary" size="large" @click="$router.push('/menu/add')" class="action-btn primary-btn">
            <el-icon><Plus /></el-icon>
            新建菜单
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card menu-card" @click="$router.push('/menu')">
          <div class="stat-icon">
            <el-icon><Notebook /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value" :class="{ loading: loading }">
              {{ loading ? '...' : stats.menuCount }}
            </span>
            <span class="stat-label">菜单总数</span>
          </div>
          <div class="stat-decoration"></div>
        </div>

        <div class="stat-card recipe-card" @click="$router.push('/recipes')">
          <div class="stat-icon">
            <el-icon><Dish /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value" :class="{ loading: loading }">
              {{ loading ? '...' : stats.recipeCount }}
            </span>
            <span class="stat-label">菜谱总数</span>
          </div>
          <div class="stat-decoration"></div>
        </div>

        <div class="stat-card material-card" @click="$router.push('/ingredients')">
          <div class="stat-icon">
            <el-icon><ShoppingBag /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value" :class="{ loading: loading }">
              {{ loading ? '...' : stats.materialCount }}
            </span>
            <span class="stat-label">原料种类</span>
          </div>
          <div class="stat-decoration"></div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 近期菜单 -->
      <div class="content-card recent-menus">
        <div class="card-header">
          <div class="header-title">
            <el-icon class="header-icon"><Calendar /></el-icon>
            <span>近期菜单</span>
          </div>
          <el-button text type="primary" @click="$router.push('/menu')">
            查看全部 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        
        <div class="card-body" v-loading="loading">
          <div v-if="recentMenus.length === 0 && !loading" class="empty-state">
            <el-icon class="empty-icon"><Notebook /></el-icon>
            <p>暂无菜单</p>
            <el-button type="primary" @click="$router.push('/menu/add')">
              创建第一个菜单
            </el-button>
          </div>
          
          <div v-else class="menu-list">
            <div
              v-for="menu in recentMenus"
              :key="menu.id"
              class="menu-item"
              :class="{ 'is-today': isToday(menu.date), 'is-upcoming': isUpcoming(menu.date) }"
            >
              <div class="menu-date-badge">
                <span class="date-month">{{ formatMonth(menu.date) }}</span>
                <span class="date-day">{{ formatDay(menu.date) }}</span>
                <span class="date-weekday">{{ formatWeekday(menu.date) }}</span>
              </div>
              <div class="menu-info">
                <h4 class="menu-name">{{ menu.name }}</h4>
                <div class="menu-meta">
                  <el-tag size="small" type="info" effect="plain">
                    <el-icon><Dish /></el-icon>
                    {{ menu.dishCount || 0 }} 道菜
                  </el-tag>
                  <el-tag v-if="isToday(menu.date)" size="small" type="success" effect="dark">
                    今日菜单
                  </el-tag>
                  <el-tag v-else-if="isUpcoming(menu.date)" size="small" type="warning" effect="plain">
                    即将到来
                  </el-tag>
                </div>
              </div>
              <div class="menu-actions">
                <el-button text circle @click="viewMenu(menu)">
                  <el-icon><View /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷入口 -->
      <div class="content-card quick-access">
        <div class="card-header">
          <div class="header-title">
            <el-icon class="header-icon"><Grid /></el-icon>
            <span>快捷入口</span>
          </div>
        </div>
        
        <div class="card-body">
          <div class="quick-grid">
            <div class="quick-item" @click="$router.push('/menu/add')">
              <div class="quick-icon add-menu">
                <el-icon><Plus /></el-icon>
              </div>
              <span class="quick-label">新建菜单</span>
            </div>
            
            <div class="quick-item" @click="$router.push('/menu')">
              <div class="quick-icon view-menu">
                <el-icon><Notebook /></el-icon>
              </div>
              <span class="quick-label">菜单列表</span>
            </div>
            
            <div class="quick-item" @click="$router.push('/recipes')">
              <div class="quick-icon recipes">
                <el-icon><Dish /></el-icon>
              </div>
              <span class="quick-label">菜谱管理</span>
            </div>
            
            <div class="quick-item" @click="$router.push('/ingredients')">
              <div class="quick-icon ingredients">
                <el-icon><ShoppingBag /></el-icon>
              </div>
              <span class="quick-label">原料管理</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 今日菜单提醒弹窗 -->
    <el-dialog
      v-model="menuDialogVisible"
      :title="selectedMenu?.name || '菜单详情'"
      width="600px"
      class="menu-dialog"
    >
      <div v-if="selectedMenu" class="menu-detail">
        <div class="detail-header">
          <el-tag type="primary" effect="plain">
            {{ formatFullDate(selectedMenu.date) }}
          </el-tag>
          <el-tag type="info" effect="plain">
            {{ selectedMenu.dishCount || 0 }} 道菜
          </el-tag>
        </div>
        <div class="detail-hint">
          <el-icon><InfoFilled /></el-icon>
          <span>前往菜单页面查看完整详情</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="menuDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="goToMenu">
          查看详情
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  Calendar,
  Plus,
  Notebook,
  Dish,
  ShoppingBag,
  ArrowRight,
  View,
  Grid,
  InfoFilled,
} from '@element-plus/icons-vue'
import menusApi from '@/api/menus'
import recipesApi from '@/api/recipes'
import materialsApi from '@/api/materials'

export default {
  name: 'Home',
  components: {
    Calendar,
    Plus,
    Notebook,
    Dish,
    ShoppingBag,
    ArrowRight,
    View,
    Grid,
    InfoFilled,
  },
  data() {
    return {
      loading: true,
      stats: {
        menuCount: 0,
        recipeCount: 0,
        materialCount: 0,
      },
      recentMenus: [],
      menuDialogVisible: false,
      selectedMenu: null,
    }
  },
  computed: {
    greeting() {
      const hour = new Date().getHours()
      if (hour < 6) return '夜深了'
      if (hour < 9) return '早上好'
      if (hour < 12) return '上午好'
      if (hour < 14) return '中午好'
      if (hour < 18) return '下午好'
      if (hour < 22) return '晚上好'
      return '夜深了'
    },
    currentDate() {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const date = now.getDate()
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      const weekday = weekdays[now.getDay()]
      return `${year}年${month}月${date}日 ${weekday}`
    },
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        // 并行加载所有数据
        const [menusResult, recipesResult, materialsResult] = await Promise.all([
          menusApi.getList(1, 10),
          recipesApi.getList(1, 1),
          materialsApi.getList(1, 1),
        ])

        // 设置统计数据
        this.stats.menuCount = menusResult.totalItems || 0
        this.stats.recipeCount = recipesResult.totalItems || 0
        this.stats.materialCount = materialsResult.totalItems || 0

        // 获取近期菜单（按日期排序，取最近5个）
        this.recentMenus = menusResult.items.slice(0, 5)
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    isToday(dateStr) {
      if (!dateStr) return false
      const today = new Date()
      const date = new Date(dateStr)
      return (
        today.getFullYear() === date.getFullYear() &&
        today.getMonth() === date.getMonth() &&
        today.getDate() === date.getDate()
      )
    },

    isUpcoming(dateStr) {
      if (!dateStr) return false
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const date = new Date(dateStr)
      date.setHours(0, 0, 0, 0)
      const diffDays = (date - today) / (1000 * 60 * 60 * 24)
      return diffDays > 0 && diffDays <= 7
    },

    formatMonth(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}月`
    },

    formatDay(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.getDate()
    },

    formatWeekday(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return weekdays[date.getDay()]
    },

    formatFullDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      return `${month}月${day}日 ${weekdays[date.getDay()]}`
    },

    viewMenu(menu) {
      this.selectedMenu = menu
      this.menuDialogVisible = true
    },

    goToMenu() {
      this.menuDialogVisible = false
      this.$router.push('/menu')
    },
  },
}
</script>

<style scoped>
.home-page {
  min-height: 100%;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 32px 40px;
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
}

.welcome-section::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: 10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.wave-emoji {
  display: inline-block;
  animation: wave 1.5s ease-in-out infinite;
  transform-origin: 70% 70%;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  50% { transform: rotate(-10deg); }
  75% { transform: rotate(20deg); }
}

.welcome-date {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.primary-btn {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.primary-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 28px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.stat-decoration {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: 0.1;
}

.menu-card .stat-decoration {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.recipe-card .stat-decoration {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.material-card .stat-decoration {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.menu-card .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.recipe-card .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.material-card .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 6px;
}

.stat-value.loading {
  opacity: 0.5;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

/* 主内容区 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.content-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 600;
  color: #1f2937;
}

.header-icon {
  font-size: 20px;
  color: #667eea;
}

.card-body {
  padding: 20px 24px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.4;
}

.empty-state p {
  margin: 0 0 20px 0;
  font-size: 15px;
}

/* 菜单列表 */
.menu-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item.is-today {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border-color: rgba(102, 126, 234, 0.2);
}

.menu-item.is-upcoming {
  background: rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.15);
}

.menu-date-badge {
  width: 56px;
  height: 68px;
  background: #fff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.menu-item.is-today .menu-date-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.menu-item.is-today .menu-date-badge .date-month,
.menu-item.is-today .menu-date-badge .date-day,
.menu-item.is-today .menu-date-badge .date-weekday {
  color: #fff;
}

.date-month {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
}

.date-day {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.date-weekday {
  font-size: 11px;
  color: #6b7280;
}

.menu-info {
  flex: 1;
  min-width: 0;
}

.menu-name {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.menu-meta .el-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.menu-actions {
  flex-shrink: 0;
}

/* 快捷入口 */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  background: #f9fafb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-item:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
}

.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
}

.quick-icon.add-menu {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.quick-icon.view-menu {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.quick-icon.recipes {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.quick-icon.ingredients {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.quick-label {
  font-size: 13px;
  color: #4b5563;
  font-weight: 500;
}

/* 弹窗 */
.menu-detail .detail-header {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.menu-detail .detail-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f3f4f6;
  border-radius: 10px;
  color: #6b7280;
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .welcome-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 20px;
  }

  .stat-value {
    font-size: 28px;
  }
}
</style>
