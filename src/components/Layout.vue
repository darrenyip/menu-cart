<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '72px' : '240px'" class="sidebar">
      <!-- Logo 区域 -->
      <div class="logo-section" @click="$router.push('/')">
        <div class="logo-icon">
          <el-icon><Dish /></el-icon>
        </div>
        <transition name="fade">
          <span v-if="!isCollapse" class="logo-text">菜单购物车</span>
        </transition>
      </div>

      <!-- 导航菜单 -->
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>

        <div class="menu-group-title" v-if="!isCollapse">
          <span>菜单管理</span>
        </div>

        <el-menu-item index="/menu">
          <el-icon><Notebook /></el-icon>
          <template #title>菜单列表</template>
        </el-menu-item>

        <el-menu-item index="/menu/add">
          <el-icon><CirclePlus /></el-icon>
          <template #title>新建菜单</template>
        </el-menu-item>

        <div class="menu-group-title" v-if="!isCollapse">
          <span>数据管理</span>
        </div>

        <el-menu-item index="/recipes">
          <el-icon><Document /></el-icon>
          <template #title>菜谱管理</template>
        </el-menu-item>

        <el-menu-item index="/ingredients">
          <el-icon><ShoppingBag /></el-icon>
          <template #title>原料管理</template>
        </el-menu-item>
      </el-menu>

      <!-- 底部折叠按钮 -->
      <div class="sidebar-footer">
        <div class="collapse-btn" @click="toggleCollapse">
          <el-icon v-if="isCollapse"><Expand /></el-icon>
          <el-icon v-else><Fold /></el-icon>
          <span v-if="!isCollapse">收起菜单</span>
        </div>
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 头部 -->
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentBreadcrumb">
              {{ currentBreadcrumb }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tooltip content="刷新页面" placement="bottom">
            <el-button text circle @click="refreshPage">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
          
          <!-- 用户信息下拉菜单 -->
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="user-name">{{ userName }}</span>
              <el-icon class="user-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  <el-icon><Message /></el-icon>
                  {{ userEmail }}
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主要内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import {
  HomeFilled,
  Notebook,
  Document,
  ShoppingBag,
  Expand,
  Fold,
  Dish,
  CirclePlus,
  Refresh,
  User,
  ArrowDown,
  Message,
  SwitchButton,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import authApi from '@/api/auth'

export default {
  name: 'Layout',
  components: {
    HomeFilled,
    Notebook,
    Document,
    ShoppingBag,
    Expand,
    Fold,
    Dish,
    CirclePlus,
    Refresh,
    User,
    ArrowDown,
    Message,
    SwitchButton,
  },
  data() {
    return {
      isCollapse: false,
    }
  },
  computed: {
    activeMenu() {
      const path = this.$route.path
      // 处理子路由的激活状态
      if (path.startsWith('/menu/add') || path.startsWith('/menu/edit')) {
        return '/menu/add'
      }
      if (path.startsWith('/recipes/')) {
        return '/recipes'
      }
      if (path.startsWith('/menu')) {
        return '/menu'
      }
      return path
    },
    userName() {
      const user = authApi.getCurrentUser()
      return user?.name || user?.email?.split('@')[0] || '用户'
    },
    userEmail() {
      const user = authApi.getCurrentUser()
      return user?.email || ''
    },
    currentBreadcrumb() {
      const breadcrumbMap = {
        '/menu': '菜单列表',
        '/menu/add': '新建菜单',
        '/recipes': '菜谱管理',
        '/ingredients': '原料管理',
      }

      const path = this.$route.path
      if (path.startsWith('/menu/edit/')) {
        return '编辑菜单'
      }
      if (path.startsWith('/recipes/edit/')) {
        return '编辑菜谱'
      }

      return breadcrumbMap[path] || ''
    },
  },
  methods: {
    toggleCollapse() {
      this.isCollapse = !this.isCollapse
    },
    refreshPage() {
      window.location.reload()
    },
    async handleUserCommand(command) {
      if (command === 'logout') {
        try {
          await ElMessageBox.confirm(
            '确定要退出登录吗？',
            '退出确认',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning',
            }
          )
          authApi.logout()
          ElMessage.success('已退出登录')
          this.$router.push('/login')
        } catch {
          // 取消操作
        }
      }
    },
  },
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏 - 深色玻璃质感风格 */
.sidebar {
  background: linear-gradient(165deg, #0c1222 0%, #162032 50%, #0f1729 100%);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 4px 0 32px rgba(0, 0, 0, 0.3);
  position: relative;
}

/* 侧边栏装饰性背景 */
.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(ellipse at 20% 0%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(6, 182, 212, 0.06) 0%, transparent 50%);
  pointer-events: none;
}

/* Logo 区域 */
.logo-section {
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 0 20px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.logo-section:hover {
  background: rgba(16, 185, 129, 0.08);
}

.logo-icon {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 
    0 4px 16px rgba(16, 185, 129, 0.35),
    0 0 20px rgba(16, 185, 129, 0.15);
  position: relative;
}

.logo-icon::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.5) 0%, rgba(6, 182, 212, 0.5) 100%);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.logo-section:hover .logo-icon::after {
  opacity: 1;
}

.logo-text {
  font-size: 17px;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  letter-spacing: 0.3px;
  text-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
}

/* 菜单样式 */
.sidebar-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: 16px 0;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  z-index: 1;
}

.sidebar-menu::-webkit-scrollbar {
  width: 3px;
}

.sidebar-menu::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

.sidebar-menu::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.3);
  border-radius: 3px;
}

.sidebar-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.5);
}

/* 菜单分组标题 */
.menu-group-title {
  padding: 24px 24px 10px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(148, 163, 184, 0.6);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  position: relative;
}

.menu-group-title::before {
  content: '';
  position: absolute;
  left: 24px;
  right: 24px;
  top: 12px;
  height: 1px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.15) 0%, transparent 100%);
}

/* 菜单项样式 */
.sidebar-menu :deep(.el-menu-item) {
  height: 46px;
  line-height: 46px;
  margin: 3px 14px;
  border-radius: 8px;
  color: rgba(203, 213, 225, 0.8);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.sidebar-menu :deep(.el-menu-item::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: linear-gradient(180deg, #10b981 0%, #06b6d4 100%);
  border-radius: 0 2px 2px 0;
  transition: height 0.25s ease;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(16, 185, 129, 0.1);
  color: #e2e8f0;
}

.sidebar-menu :deep(.el-menu-item:hover::before) {
  height: 20px;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%);
  color: #10b981;
  box-shadow: 
    0 0 20px rgba(16, 185, 129, 0.15),
    inset 0 0 20px rgba(16, 185, 129, 0.05);
}

.sidebar-menu :deep(.el-menu-item.is-active::before) {
  height: 24px;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
  transition: transform 0.25s ease;
}

.sidebar-menu :deep(.el-menu-item:hover .el-icon) {
  transform: scale(1.1);
}

.sidebar-menu :deep(.el-menu-item.is-active .el-icon) {
  filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.6));
}

/* 折叠状态下的菜单项 */
.sidebar-menu.el-menu--collapse {
  width: 100%;
}

.sidebar-menu.el-menu--collapse :deep(.el-menu-item) {
  margin: 4px 10px;
  padding: 0 !important;
  min-width: auto;
  width: calc(100% - 20px);
}

.sidebar-menu.el-menu--collapse :deep(.el-menu-item .el-icon) {
  margin: 0 !important;
}

.sidebar-menu.el-menu--collapse :deep(.el-menu-item > .el-tooltip__trigger) {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100% !important;
  padding: 0 !important;
}

.sidebar-menu.el-menu--collapse :deep(.el-sub-menu__icon-arrow) {
  display: none;
}

/* 底部区域 */
.sidebar-footer {
  padding: 16px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  position: relative;
  z-index: 1;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(148, 163, 184, 0.7);
  font-size: 13px;
  transition: all 0.25s ease;
  white-space: nowrap;
  overflow: hidden;
  border: 1px solid transparent;
}

.collapse-btn:hover {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
}

.collapse-btn .el-icon {
  font-size: 18px;
  transition: transform 0.25s ease;
}

.collapse-btn:hover .el-icon {
  transform: scale(1.1);
}

/* 主容器 */
.main-container {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
}

/* 头部 */
.header {
  height: 64px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  z-index: 10;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-left :deep(.el-breadcrumb) {
  font-size: 14px;
}

.header-left :deep(.el-breadcrumb__inner) {
  color: #64748b;
}

.header-left :deep(.el-breadcrumb__inner.is-link:hover) {
  color: #10b981;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right .el-button {
  font-size: 18px;
  color: #64748b;
  transition: all 0.2s ease;
}

.header-right .el-button:hover {
  color: #10b981;
  transform: rotate(180deg);
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.user-info:hover {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.15);
}

.user-avatar {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.user-name {
  font-size: 14px;
  color: #334155;
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-arrow {
  font-size: 12px;
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.user-info:hover .user-arrow {
  transform: translateY(2px);
}

/* 主内容 */
.main-content {
  padding: 24px;
  overflow-y: auto;
  background: transparent;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
