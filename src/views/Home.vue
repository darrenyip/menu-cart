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

/* 欢迎区域 - 深色科技风格 */
.welcome-section {
  background: linear-gradient(135deg, #0c1222 0%, #162032 60%, #0f1729 100%);
  border-radius: 20px;
  padding: 36px 44px;
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(16, 185, 129, 0.15);
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.2),
    0 0 40px rgba(16, 185, 129, 0.05);
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 60%);
  border-radius: 50%;
  animation: pulse 8s ease-in-out infinite;
}

.welcome-section::after {
  content: '';
  position: absolute;
  bottom: -40%;
  left: 5%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 60%);
  border-radius: 50%;
  animation: pulse 10s ease-in-out infinite reverse;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
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
  color: #e2e8f0;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
}

.greeting {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.wave-emoji {
  display: inline-block;
  animation: wave 1.5s ease-in-out infinite;
  transform-origin: 70% 70%;
  filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4));
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  50% { transform: rotate(-10deg); }
  75% { transform: rotate(20deg); }
}

.welcome-date {
  font-size: 15px;
  color: rgba(148, 163, 184, 0.9);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.welcome-date .el-icon {
  color: #10b981;
}

.primary-btn {
  height: 50px;
  padding: 0 36px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  border: none;
  box-shadow: 
    0 4px 16px rgba(16, 185, 129, 0.35),
    0 0 20px rgba(16, 185, 129, 0.15);
  transition: all 0.3s ease;
}

.primary-btn:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 8px 24px rgba(16, 185, 129, 0.4),
    0 0 30px rgba(16, 185, 129, 0.2);
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
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 26px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.2);
}

.stat-decoration {
  position: absolute;
  top: -30px;
  right: -30px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  opacity: 0.08;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-decoration {
  opacity: 0.15;
  transform: scale(1.1);
}

.menu-card .stat-decoration {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
}

.recipe-card .stat-decoration {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
}

.material-card .stat-decoration {
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
  position: relative;
}

.stat-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover .stat-icon::after {
  opacity: 1;
}

.menu-card .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.menu-card .stat-icon::after {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
}

.recipe-card .stat-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.recipe-card .stat-icon::after {
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
}

.material-card .stat-icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.material-card .stat-icon::after {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}

.stat-info {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 36px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 6px;
}

.menu-card:hover .stat-value {
  color: #10b981;
}

.recipe-card:hover .stat-value {
  color: #f59e0b;
}

.material-card:hover .stat-value {
  color: #8b5cf6;
}

.stat-value.loading {
  opacity: 0.5;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
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
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 600;
  color: #0f172a;
}

.header-icon {
  font-size: 20px;
  color: #10b981;
}

.card-header :deep(.el-button) {
  color: #10b981;
}

.card-header :deep(.el-button:hover) {
  color: #059669;
}

.card-body {
  padding: 20px 24px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.3;
  color: #10b981;
}

.empty-state p {
  margin: 0 0 20px 0;
  font-size: 15px;
}

.empty-state :deep(.el-button) {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  border: none;
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
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.25s ease;
  border: 1px solid transparent;
}

.menu-item:hover {
  background: #f1f5f9;
  border-color: rgba(16, 185, 129, 0.15);
}

.menu-item.is-today {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%);
  border-color: rgba(16, 185, 129, 0.25);
}

.menu-item.is-upcoming {
  background: rgba(245, 158, 11, 0.06);
  border-color: rgba(245, 158, 11, 0.2);
}

.menu-date-badge {
  width: 58px;
  height: 70px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
}

.menu-item:hover .menu-date-badge {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.menu-item.is-today .menu-date-badge {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
}

.menu-item.is-today .menu-date-badge .date-month,
.menu-item.is-today .menu-date-badge .date-day,
.menu-item.is-today .menu-date-badge .date-weekday {
  color: #fff;
}

.date-month {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.date-day {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
}

.date-weekday {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.menu-info {
  flex: 1;
  min-width: 0;
}

.menu-name {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
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

.menu-actions :deep(.el-button) {
  color: #64748b;
}

.menu-actions :deep(.el-button:hover) {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
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
  gap: 12px;
  padding: 22px 16px;
  background: #f8fafc;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid transparent;
}

.quick-item:hover {
  background: #f1f5f9;
  transform: translateY(-3px);
  border-color: rgba(16, 185, 129, 0.2);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.1);
}

.quick-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  transition: all 0.25s ease;
}

.quick-item:hover .quick-icon {
  transform: scale(1.1);
}

.quick-icon.add-menu {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.quick-icon.view-menu {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.quick-icon.recipes {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.quick-icon.ingredients {
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.quick-label {
  font-size: 13px;
  color: #475569;
  font-weight: 600;
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
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%);
  border-radius: 12px;
  color: #475569;
  font-size: 14px;
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.menu-detail .detail-hint .el-icon {
  color: #10b981;
}

/* ================================
   响应式样式
   ================================ */

/* 平板端 (768px - 1024px) */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .quick-access {
    order: -1;
  }

  .quick-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 小平板 / 大手机 (576px - 768px) */
@media (max-width: 768px) {
  .welcome-section {
    padding: 24px 20px;
    border-radius: 16px;
    margin-bottom: 20px;
  }

  .welcome-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .welcome-title {
    font-size: 24px;
  }

  .welcome-date {
    font-size: 13px;
  }

  .primary-btn {
    width: 100%;
    height: 46px;
    padding: 0 24px;
    font-size: 14px;
  }

  .stats-section {
    margin-bottom: 20px;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
    border-radius: 12px;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 22px;
    border-radius: 12px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-label {
    font-size: 12px;
  }

  .stat-decoration {
    display: none;
  }

  .main-content {
    gap: 16px;
  }

  .content-card {
    border-radius: 12px;
  }

  .card-header {
    padding: 14px 16px;
  }

  .header-title {
    font-size: 15px;
    gap: 8px;
  }

  .header-icon {
    font-size: 18px;
  }

  .card-body {
    padding: 14px 16px;
  }

  .menu-list {
    gap: 10px;
  }

  .menu-item {
    padding: 12px;
    border-radius: 10px;
    gap: 12px;
  }

  .menu-date-badge {
    width: 50px;
    height: 60px;
    border-radius: 10px;
  }

  .date-day {
    font-size: 20px;
  }

  .menu-name {
    font-size: 14px;
  }

  .quick-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .quick-item {
    padding: 16px 8px;
    border-radius: 12px;
    gap: 10px;
  }

  .quick-icon {
    width: 44px;
    height: 44px;
    font-size: 20px;
    border-radius: 12px;
  }

  .quick-label {
    font-size: 11px;
  }

  /* 弹窗响应式 */
  .menu-dialog :deep(.el-dialog) {
    width: 90% !important;
    max-width: 500px;
    margin: 0 auto;
  }
}

/* 手机端 (<576px) */
@media (max-width: 576px) {
  .welcome-section {
    padding: 20px 16px;
    border-radius: 14px;
    margin-bottom: 16px;
  }

  .welcome-section::before {
    width: 300px;
    height: 300px;
    top: -40%;
    right: -20%;
  }

  .welcome-section::after {
    width: 200px;
    height: 200px;
    bottom: -30%;
  }

  .welcome-title {
    font-size: 22px;
    gap: 8px;
  }

  .wave-emoji {
    font-size: 20px;
  }

  .welcome-date {
    font-size: 12px;
    gap: 6px;
  }

  .primary-btn {
    height: 44px;
    font-size: 14px;
    border-radius: 10px;
  }

  .stats-section {
    margin-bottom: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .stat-card {
    padding: 12px 8px;
    border-radius: 10px;
    gap: 8px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
    border-radius: 10px;
  }

  .stat-value {
    font-size: 20px;
    margin-bottom: 2px;
  }

  .stat-label {
    font-size: 10px;
  }

  .main-content {
    gap: 12px;
  }

  .content-card {
    border-radius: 10px;
  }

  .card-header {
    padding: 12px 14px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .header-title {
    font-size: 14px;
  }

  .header-icon {
    font-size: 16px;
  }

  .card-header :deep(.el-button) {
    font-size: 12px;
    padding: 4px 8px;
  }

  .card-body {
    padding: 12px 14px;
  }

  .empty-state {
    padding: 32px 16px;
  }

  .empty-icon {
    font-size: 44px;
    margin-bottom: 12px;
  }

  .empty-state p {
    font-size: 13px;
    margin-bottom: 16px;
  }

  .menu-list {
    gap: 8px;
  }

  .menu-item {
    padding: 10px;
    border-radius: 8px;
    gap: 10px;
  }

  .menu-date-badge {
    width: 44px;
    height: 54px;
    border-radius: 8px;
  }

  .date-month {
    font-size: 10px;
  }

  .date-day {
    font-size: 18px;
  }

  .date-weekday {
    font-size: 10px;
  }

  .menu-name {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .menu-meta {
    gap: 6px;
  }

  .menu-meta .el-tag {
    font-size: 10px;
    padding: 2px 6px;
  }

  .menu-actions :deep(.el-button) {
    padding: 6px;
  }

  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .quick-item {
    padding: 18px 12px;
    border-radius: 10px;
    gap: 10px;
  }

  .quick-icon {
    width: 46px;
    height: 46px;
    font-size: 22px;
    border-radius: 10px;
  }

  .quick-label {
    font-size: 12px;
  }

  /* 弹窗响应式 */
  .menu-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 10px auto;
  }

  .menu-detail .detail-header {
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .menu-detail .detail-hint {
    padding: 12px;
    font-size: 13px;
    border-radius: 10px;
  }
}

/* 超小屏幕 (<400px) */
@media (max-width: 400px) {
  .welcome-section {
    padding: 16px 12px;
    border-radius: 12px;
  }

  .welcome-title {
    font-size: 20px;
  }

  .stats-grid {
    gap: 6px;
  }

  .stat-card {
    padding: 10px 6px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .stat-value {
    font-size: 18px;
  }

  .stat-label {
    font-size: 9px;
  }

  .card-header {
    padding: 10px 12px;
  }

  .card-body {
    padding: 10px 12px;
  }

  .menu-item {
    padding: 8px;
  }

  .menu-date-badge {
    width: 40px;
    height: 50px;
  }

  .date-day {
    font-size: 16px;
  }

  .quick-item {
    padding: 14px 10px;
  }

  .quick-icon {
    width: 42px;
    height: 42px;
    font-size: 20px;
  }
}
</style>
