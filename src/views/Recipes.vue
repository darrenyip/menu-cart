<template>
  <div class="recipes-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">菜谱管理</h2>
      <el-button type="primary" @click="goToAdd" class="add-btn">
        <el-icon><Plus /></el-icon>新增菜谱
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="8">
        <div class="stat-card stat-card-total">
          <div class="stat-icon">
            <el-icon :size="28"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ total }}</div>
            <div class="stat-label">全部菜谱</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 菜谱列表 -->
    <el-card class="table-card" shadow="hover">
      <el-table
        :data="recipeList"
        style="width: 100%"
        v-loading="loading"
        empty-text="暂无菜谱数据"
        row-class-name="table-row"
      >
        <el-table-column prop="name" label="菜谱名称" min-width="180">
          <template #default="scope">
            <div class="recipe-name">
              <el-icon class="recipe-icon"><Dish /></el-icon>
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" align="center">
          <template #default="scope">
            <el-tag
              v-if="scope.row.category"
              :type="getCategoryType(scope.row.category)"
              size="small"
              effect="light"
            >
              {{ getCategoryText(scope.row.category) }}
            </el-tag>
            <span v-else class="no-category">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="160" align="center">
          <template #default="scope">
            <el-button size="small" text type="primary" @click="editRecipe(scope.row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button size="small" text type="danger" @click="deleteRecipe(scope.row)">
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
import { Plus, Document, Dish, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import recipesApi from '@/api/recipes'

export default {
  name: 'Recipes',
  components: {
    Plus,
    Document,
    Dish,
    Edit,
    Delete,
  },
  data() {
    return {
      loading: false,
      currentPage: 1,
      pageSize: 10,
      total: 0,
      recipeList: [],
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    // 加载数据
    async loadData() {
      this.loading = true
      try {
        const result = await recipesApi.getList(this.currentPage, this.pageSize)
        this.recipeList = result.items
        this.total = result.totalItems
      } catch (error) {
        console.error('加载菜谱数据失败:', error)
        ElMessage.error('加载数据失败，请检查网络连接')
      } finally {
        this.loading = false
      }
    },
    getCategoryText(category) {
      const categoryMap = {
        meat: '荤菜',
        vegetable: '素菜',
        soup: '汤品',
        staple: '主食',
      }
      return categoryMap[category] || category
    },
    getCategoryType(category) {
      const typeMap = {
        meat: 'danger',
        vegetable: 'success',
        soup: 'warning',
        staple: 'info',
      }
      return typeMap[category] || 'info'
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
    goToAdd() {
      this.$router.push('/recipes/add')
    },
    // 编辑菜谱
    editRecipe(row) {
      this.$router.push(`/recipes/edit/${row.id}`)
    },
    // 删除菜谱
    async deleteRecipe(row) {
      try {
        await ElMessageBox.confirm(
          `确定要删除菜谱"${row.name}"吗？删除后无法恢复！`,
          '删除警告',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )

        this.loading = true
        await recipesApi.delete(row.id)
        ElMessage.success('菜谱删除成功！')
        this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除菜谱失败:', error)
          ElMessage.error('删除失败，请重试')
        } else {
          ElMessage.info('已取消删除')
        }
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.recipes-page {
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

.recipe-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recipe-icon {
  color: #f59e0b;
  font-size: 18px;
}

.no-category {
  color: #9ca3af;
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
