<template>
  <el-container style="height: 100vh">
    <!-- 侧边栏 -->
    <el-aside
      :width="isCollapse ? '64px' : '200px'"
      style="background-color: #304156; transition: width 0.3s"
    >
      <div
        style="
          height: 60px;
          background-color: #409eff;
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        <span v-if="!isCollapse" style="color: white; font-size: 18px; font-weight: bold"
          >菜单购物车</span
        >
        <span v-else style="color: white; font-size: 20px; font-weight: bold">软</span>
      </div>

      <el-menu
        :default-active="$route.path"
        class="el-menu-vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
      >
        <el-menu-item index="/">
          <el-icon><House /></el-icon>
          <template #title>主页</template>
        </el-menu-item>

        <el-menu-item index="/menu">
          <el-icon><Menu /></el-icon>
          <template #title>菜单</template>
        </el-menu-item>

        <el-menu-item index="/recipes">
          <el-icon><Document /></el-icon>
          <template #title>菜谱</template>
        </el-menu-item>

        <el-menu-item index="/ingredients">
          <el-icon><ShoppingBag /></el-icon>
          <template #title>原料</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 头部 -->
      <el-header
        style="background-color: #fff; padding: 0; box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08)"
      >
        <div style="display: flex; align-items: center; height: 100%; padding: 0 20px">
          <el-button text @click="toggleCollapse" style="font-size: 18px; margin-right: 20px">
            <el-icon>
              <Expand v-if="isCollapse" />
              <Fold v-else />
            </el-icon>
          </el-button>

          <span style="font-size: 16px; color: #303133">{{ getPageTitle() }}</span>
        </div>
      </el-header>

      <!-- 主要内容 -->
      <el-main style="background-color: #f0f2f5; padding: 20px">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { House, Menu, Document, ShoppingBag, Expand, Fold } from '@element-plus/icons-vue'

export default {
  name: 'Layout',
  components: {
    House,
    Menu,
    Document,
    ShoppingBag,
    Expand,
    Fold,
  },
  data() {
    return {
      isCollapse: false,
    }
  },
  methods: {
    toggleCollapse() {
      this.isCollapse = !this.isCollapse
    },
    getPageTitle() {
      const titleMap = {
        '/': '主页',
        '/menu': '菜单管理',
        '/menu/add': '新增菜单',
        '/recipes': '菜谱管理',
        '/recipes/add': '新增菜谱',
        '/ingredients': '原料管理',
      }

      // 处理动态路由
      const path = this.$route.path
      if (path.startsWith('/recipes/edit/')) {
        return '编辑菜谱'
      }
      if (path.startsWith('/recipes/view/')) {
        return '查看菜谱'
      }

      return titleMap[path] || '菜单购物车系统'
    },
  },
}
</script>

<style scoped>
.el-menu-vertical {
  border-right: none;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}

.el-aside {
  overflow: hidden;
}
</style>
