<template>
  <div class="menu-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">菜单管理</h2>
      <el-button type="primary" @click="goToAdd" class="add-btn">
        <el-icon><Plus /></el-icon>新增菜单
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
        <el-col :span="8">
        <div class="stat-card stat-card-total">
          <div class="stat-icon">
            <el-icon :size="28"><Calendar /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ total }}</div>
            <div class="stat-label">全部菜单</div>
          </div>
        </div>
        </el-col>
        <el-col :span="8">
        <div class="stat-card stat-card-dishes">
          <div class="stat-icon">
            <el-icon :size="28"><Dish /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalDishCount }}</div>
            <div class="stat-label">菜品总数</div>
          </div>
        </div>
        </el-col>
      </el-row>

    <!-- 菜单列表 -->
    <el-card class="table-card" shadow="hover">
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
        <el-table-column prop="date" label="日期" width="120" align="center">
          <template #default="scope">
            <span class="date-text">{{ formatDate(scope.row.date) }}</span>
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
    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return '-'
      // PocketBase 返回的日期格式可能是 ISO 格式
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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
}

/* 统计卡片 */
.stats-row {
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
}

.stat-card-total .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.stat-card-dishes .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.stat-content {
  flex: 1;
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
  color: #409eff;
  font-size: 18px;
}

.date-text {
  color: #374151;
  font-weight: 500;
}

/* 分页 */
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-row .el-col {
    margin-bottom: 12px;
  }
}
</style>
