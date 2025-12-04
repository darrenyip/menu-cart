<template>
  <div class="menu-page">
    <div class="page-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <h2 class="page-title">菜单管理</h2>
        <el-button type="primary" @click="goToAdd" class="add-btn">
          <el-icon><Plus /></el-icon>
          <span class="btn-text">新增菜单</span>
        </el-button>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-card stat-card-total">
          <div class="stat-icon">
            <el-icon :size="28"><Calendar /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ total }}</div>
            <div class="stat-label">全部菜单</div>
          </div>
        </div>
        <div class="stat-card stat-card-dishes">
          <div class="stat-icon">
            <el-icon :size="28"><Dish /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalDishCount }}</div>
            <div class="stat-label">菜品总数</div>
          </div>
        </div>
      </div>

      <!-- 菜单列表 - 桌面端表格 -->
      <el-card class="table-card desktop-table" shadow="hover">
        <el-table
          :data="menuList"
          style="width: 100%"
          v-loading="loading"
          empty-text="暂无菜单数据"
          row-class-name="table-row"
        >
          <el-table-column prop="name" label="菜单名称" min-width="150">
            <template #default="scope">
              <div class="menu-name">
                <el-icon class="menu-icon"><Notebook /></el-icon>
                <span>{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="dishCount" label="菜品数量" width="120" align="center">
            <template #default="scope">
              <el-tag type="info" size="small" effect="plain">
                {{ scope.row.dishCount || 0 }} 道菜
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="160" align="center">
            <template #default="scope">
              <el-button size="small" text type="primary" @click="editMenu(scope.row)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button size="small" text type="danger" @click="deleteMenu(scope.row)">
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrap">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            background
          />
        </div>
      </el-card>

      <!-- 菜单列表 - 移动端卡片列表 -->
      <div class="mobile-list" v-loading="loading">
        <div v-if="menuList.length === 0 && !loading" class="empty-state">
          <el-icon class="empty-icon"><Notebook /></el-icon>
          <p>暂无菜单数据</p>
          <el-button type="primary" @click="goToAdd">创建第一个菜单</el-button>
        </div>
        
        <div 
          v-for="item in menuList" 
          :key="item.id" 
          class="mobile-card"
          @click="editMenu(item)"
        >
          <div class="mobile-card-main">
            <div class="mobile-card-icon">
              <el-icon><Notebook /></el-icon>
            </div>
            <div class="mobile-card-info">
              <div class="mobile-card-name">{{ item.name }}</div>
              <div class="mobile-card-meta">
                <el-tag type="info" size="small" effect="plain">
                  {{ item.dishCount || 0 }} 道菜
                </el-tag>
              </div>
            </div>
          </div>
          <div class="mobile-card-actions">
            <el-button size="small" text type="primary" @click.stop="editMenu(item)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button size="small" text type="danger" @click.stop="deleteMenu(item)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 移动端分页 -->
        <div class="mobile-pagination" v-if="menuList.length > 0">
          <el-pagination
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-size="pageSize"
            layout="prev, pager, next"
            :total="total"
            :pager-count="5"
            background
            small
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Plus, Calendar, Dish, Notebook, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import menusApi from '@/api/menus'

export default {
  name: 'Menu',
  components: {
    Plus,
    Calendar,
    Dish,
    Notebook,
    Edit,
    Delete,
  },
  data() {
    return {
      loading: false,
      currentPage: 1,
      pageSize: 10,
      total: 0,
      menuList: [],
    }
  },
  computed: {
    // 菜品总数
    totalDishCount() {
      return this.menuList.reduce((sum, item) => sum + (item.dishCount || 0), 0)
    },
  },
  mounted() {
    this.loadData()
  },
  methods: {
    // 加载数据
    async loadData() {
      this.loading = true
      try {
        const result = await menusApi.getList(this.currentPage, this.pageSize)
        this.menuList = result.items
        this.total = result.totalItems
      } catch (error) {
        console.error('加载菜单数据失败:', error)
        ElMessage.error('加载数据失败，请检查网络连接')
      } finally {
        this.loading = false
      }
    },
    goToAdd() {
      this.$router.push('/menu/add')
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.loadData()
    },
    handleCurrentChange(val) {
      this.currentPage = val
      this.loadData()
    },
    // 编辑菜单
    editMenu(row) {
      this.$router.push(`/menu/edit/${row.id}`)
    },
    // 删除菜单
    async deleteMenu(row) {
      try {
        await ElMessageBox.confirm(
          `确定要删除菜单"${row.name}"吗？删除后无法恢复！`,
          '删除确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )

        this.loading = true
        await menusApi.delete(row.id)
        ElMessage.success('菜单删除成功！')
        this.loadData()
      } catch (error) {
        // 用户点击取消或关闭按钮
        if (error === 'cancel' || error === 'close') {
          return
        }
        console.error('删除菜单失败:', error)
        ElMessage.error('删除失败，请重试')
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.menu-page {
  padding: 0;
}

/* 页面容器 - 限制最大宽度 */
.page-container {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: 0.5px;
}

.add-btn {
  border-radius: 8px;
  font-weight: 500;
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.add-btn:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.stat-card-total .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.stat-card-dishes .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

/* 表格卡片 */
.table-card {
  border-radius: 12px;
}

.table-card :deep(.el-card__body) {
  padding: 20px;
}

.table-row {
  transition: background-color 0.2s ease;
}

.menu-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-icon {
  color: #10b981;
  font-size: 18px;
}

/* 分页 */
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 移动端卡片列表 - 默认隐藏 */
.mobile-list {
  display: none;
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

/* 移动端卡片 */
.mobile-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  cursor: pointer;
}

.mobile-card:hover {
  border-color: rgba(16, 185, 129, 0.2);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
}

.mobile-card:active {
  transform: scale(0.99);
}

.mobile-card-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.mobile-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
  font-size: 20px;
  flex-shrink: 0;
}

.mobile-card-info {
  flex: 1;
  min-width: 0;
}

.mobile-card-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.mobile-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
}

/* ================================
   响应式样式
   ================================ */

/* 平板端 (768px - 1024px) */
@media (max-width: 1024px) {
  .page-container {
    max-width: 100%;
  }

  .stats-row {
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
  }

  .stat-icon :deep(.el-icon) {
    font-size: 24px !important;
  }

  .stat-value {
    font-size: 24px;
  }
}

/* 小平板 (576px - 768px) */
@media (max-width: 768px) {
  .page-header {
    margin-bottom: 16px;
  }

  .page-title {
    font-size: 18px;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }

  .stat-card {
    padding: 14px;
    border-radius: 10px;
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    margin-right: 12px;
    border-radius: 10px;
  }

  .stat-icon :deep(.el-icon) {
    font-size: 20px !important;
  }

  .stat-value {
    font-size: 22px;
  }

  .stat-label {
    font-size: 12px;
  }

  .table-card :deep(.el-card__body) {
    padding: 16px;
  }

  .pagination-wrap :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .pagination-wrap :deep(.el-pagination__sizes) {
    display: none;
  }

  .pagination-wrap :deep(.el-pagination__jump) {
    display: none;
  }
}

/* 手机端 (<576px) */
@media (max-width: 576px) {
  .page-header {
    margin-bottom: 14px;
  }

  .page-title {
    font-size: 17px;
  }

  .add-btn {
    padding: 8px 12px;
  }

  .add-btn .btn-text {
    display: none;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }

  .stat-card {
    padding: 12px;
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    margin-right: 0;
    border-radius: 10px;
  }

  .stat-icon :deep(.el-icon) {
    font-size: 18px !important;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-label {
    font-size: 11px;
  }

  /* 隐藏桌面端表格，显示移动端卡片 */
  .desktop-table {
    display: none;
  }

  .mobile-list {
    display: block;
  }

  .mobile-card {
    padding: 12px 14px;
    border-radius: 10px;
    margin-bottom: 8px;
  }

  .mobile-card-icon {
    width: 38px;
    height: 38px;
    font-size: 18px;
  }

  .mobile-card-name {
    font-size: 14px;
  }

  .mobile-card-meta .el-tag {
    font-size: 11px;
  }

  .mobile-pagination :deep(.el-pagination) {
    --el-pagination-button-width: 28px;
    --el-pagination-button-height: 28px;
  }
}

/* 超小屏幕 (<400px) */
@media (max-width: 400px) {
  .page-title {
    font-size: 16px;
  }

  .stats-row {
    gap: 6px;
  }

  .stat-card {
    padding: 10px 8px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
  }

  .stat-icon :deep(.el-icon) {
    font-size: 16px !important;
  }

  .stat-value {
    font-size: 18px;
  }

  .stat-label {
    font-size: 10px;
  }

  .mobile-card {
    padding: 10px 12px;
  }

  .mobile-card-icon {
    width: 34px;
    height: 34px;
    font-size: 16px;
  }

  .mobile-card-name {
    font-size: 13px;
  }
}
</style>
