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

/* 侧边栏 */
.sidebar {
  background: linear-gradient(180deg, #1e1b4b 0%, #312e81 100%);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
}

/* Logo 区域 */
.logo-section {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
  cursor: pointer;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: background 0.3s ease;
}

.logo-section:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

/* 菜单样式 */
.sidebar-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: 12px 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu::-webkit-scrollbar {
  width: 4px;
}

.sidebar-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

/* 菜单分组标题 */
.menu-group-title {
  padding: 20px 24px 8px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 菜单项样式 */
.sidebar-menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 4px 12px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
}

/* 折叠状态下的菜单项 */
.sidebar-menu.el-menu--collapse {
  width: 100%;
}

.sidebar-menu.el-menu--collapse :deep(.el-menu-item) {
  margin: 4px 8px;
  padding: 0 !important;
  min-width: auto;
  width: calc(100% - 16px);
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
  padding: 16px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.collapse-btn .el-icon {
  font-size: 18px;
}

/* 主容器 */
.main-container {
  background: #f5f7fa;
  overflow: hidden;
}

/* 头部 */
.header {
  height: 64px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-left :deep(.el-breadcrumb) {
  font-size: 14px;
}

.header-left :deep(.el-breadcrumb__inner) {
  color: #6b7280;
}

.header-left :deep(.el-breadcrumb__inner.is-link:hover) {
  color: #667eea;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right .el-button {
  font-size: 18px;
  color: #6b7280;
}

.header-right .el-button:hover {
  color: #667eea;
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-info:hover {
  background: #f3f4f6;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  flex-shrink: 0;
}

.user-name {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-arrow {
  font-size: 12px;
  color: #9ca3af;
}

/* 主内容 */
.main-content {
  padding: 24px;
  overflow-y: auto;
  background: #f5f7fa;
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
