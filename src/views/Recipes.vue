<template>
  <div class="recipes-page">
    <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">菜谱管理</h2>
      <el-button type="primary" @click="goToAdd" class="add-btn">
        <el-icon><Plus /></el-icon>新增菜谱
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索菜谱名称或原料..."
        size="large"
        clearable
        @keyup.enter="handleSearch"
        @clear="handleClear"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button @click="handleSearch" :loading="searching">
            <el-icon><Search /></el-icon>搜索
          </el-button>
        </template>
      </el-input>
      <div class="search-tips" v-if="searchKeyword && searchResult">
        <el-tag type="info" size="small" effect="plain">
          {{ searchResult }}
        </el-tag>
        <el-button text type="primary" size="small" @click="handleClear">
          清除搜索
        </el-button>
      </div>
    </div>

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
              <span v-html="highlightKeyword(scope.row.name)"></span>
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
        <el-table-column prop="materialsCount" label="原料数量" width="120" align="center">
          <template #default="scope">
            <el-tag type="success" size="small" effect="plain">
              {{ scope.row.materialsCount || 0 }} 种
            </el-tag>
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
  </div>
</template>

<script>
import { Plus, Dish, Edit, Delete, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import recipesApi from '@/api/recipes'
import { getCategoryTagType } from '@/constants/dishCategories'

export default {
  name: 'Recipes',
  components: {
    Plus,
    Dish,
    Edit,
    Delete,
    Search,
  },
  data() {
    return {
      loading: false,
      searching: false,
      currentPage: 1,
      pageSize: 10,
      total: 0,
      recipeList: [],
      searchKeyword: '',
      searchResult: '',
      isSearchMode: false,
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
        let result
        
        if (this.isSearchMode && this.searchKeyword.trim()) {
          // 搜索模式：搜索菜谱名称和原料
          result = await this.searchRecipes(this.searchKeyword.trim())
        } else {
          // 普通分页模式
          result = await recipesApi.getList(this.currentPage, this.pageSize)
        }
        
        // 获取每个菜谱的原料数量
        const recipesWithCount = await Promise.all(
          result.items.map(async (recipe) => {
            try {
              const detail = await recipesApi.getOne(recipe.id)
              return {
                ...recipe,
                materialsCount: detail.materials?.length || 0,
                materials: detail.materials || [],
              }
            } catch {
              return {
                ...recipe,
                materialsCount: 0,
                materials: [],
              }
            }
          })
        )
        
        this.recipeList = recipesWithCount
        this.total = result.totalItems
      } catch (error) {
        console.error('加载菜谱数据失败:', error)
        ElMessage.error('加载数据失败，请检查网络连接')
      } finally {
        this.loading = false
      }
    },

    // 搜索菜谱（支持菜谱名称和原料名称）
    async searchRecipes(keyword) {
      // 先搜索菜谱名称
      const nameResults = await recipesApi.search(keyword)
      
      // 获取所有菜谱（用于搜索原料）
      const allRecipes = await recipesApi.getAllWithMaterials()
      
      // 搜索包含该原料的菜谱
      const ingredientResults = allRecipes.filter((recipe) =>
        recipe.ingredients?.some((ing) =>
          ing.name?.toLowerCase().includes(keyword.toLowerCase())
        )
      )
      
      // 合并结果并去重
      const resultMap = new Map()
      nameResults.forEach((r) => resultMap.set(r.id, r))
      ingredientResults.forEach((r) => resultMap.set(r.id, r))
      
      const items = Array.from(resultMap.values())
      
      // 更新搜索结果提示
      const nameCount = nameResults.length
      const ingredientCount = ingredientResults.length
      if (nameCount > 0 && ingredientCount > 0) {
        this.searchResult = `找到 ${items.length} 个结果（${nameCount} 个菜谱名称匹配，${ingredientCount} 个原料匹配）`
      } else if (nameCount > 0) {
        this.searchResult = `找到 ${nameCount} 个菜谱名称匹配`
      } else if (ingredientCount > 0) {
        this.searchResult = `找到 ${ingredientCount} 个原料匹配`
      } else {
        this.searchResult = '未找到匹配结果'
      }
      
      return {
        items,
        totalItems: items.length,
      }
    },

    // 执行搜索
    async handleSearch() {
      if (!this.searchKeyword.trim()) {
        this.handleClear()
        return
      }
      
      this.searching = true
      this.isSearchMode = true
      this.currentPage = 1
      
      try {
        await this.loadData()
      } finally {
        this.searching = false
      }
    },

    // 清除搜索
    handleClear() {
      this.searchKeyword = ''
      this.searchResult = ''
      this.isSearchMode = false
      this.currentPage = 1
      this.loadData()
    },

    // 高亮关键词
    highlightKeyword(text) {
      if (!this.searchKeyword.trim() || !text) return text
      
      const keyword = this.searchKeyword.trim()
      const regex = new RegExp(`(${keyword})`, 'gi')
      return text.replace(regex, '<span class="highlight">$1</span>')
    },

    getCategoryText(category) {
      if (!category) return ''
      // 兼容旧的英文分类值
      const oldToNew = {
        'meat': '荤菜',
        'vegetable': '素菜',
        'soup': '炖汤',
        'staple': '主食',
      }
      return oldToNew[category] || category
    },
    // 使用统一配置的分类颜色
    getCategoryType: getCategoryTagType,
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
  color: #0f172a;
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

/* 搜索栏 */
.search-bar {
  margin-bottom: 20px;
}

.search-input {
  max-width: 500px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px 0 0 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-input :deep(.el-input-group__append) {
  border-radius: 0 10px 10px 0;
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.search-input :deep(.el-input-group__append .el-button) {
  color: #fff;
  font-weight: 500;
}

.search-input :deep(.el-input-group__append .el-button:hover) {
  background: transparent;
}

.search-tips {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

/* 表格卡片 */
.table-card {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
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
  color: #10b981;
  font-size: 18px;
}

.no-category {
  color: #94a3b8;
}

/* 高亮样式 */
.recipe-name :deep(.highlight) {
  background-color: rgba(16, 185, 129, 0.2);
  color: #059669;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
}

/* 分页 */
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 表格按钮样式 */
.table-card :deep(.el-button--primary) {
  color: #10b981;
}

.table-card :deep(.el-button--primary:hover) {
  color: #059669;
}

/* ================================
   响应式样式
   ================================ */

/* 平板端 (768px - 1024px) */
@media (max-width: 1024px) {
  .page-container {
    max-width: 100%;
  }

  .search-input {
    max-width: 400px;
  }

  .table-card :deep(.el-card__body) {
    padding: 16px;
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

  .add-btn {
    padding: 8px 14px;
    font-size: 14px;
  }

  .search-bar {
    margin-bottom: 16px;
  }

  .search-input {
    max-width: 100%;
  }

  .search-input :deep(.el-input-group__append) {
    padding: 0 12px;
  }

  .search-tips {
    flex-wrap: wrap;
    gap: 8px;
  }

  /* 表格卡片 */
  .table-card {
    border-radius: 10px;
  }

  .table-card :deep(.el-card__body) {
    padding: 12px;
  }

  /* 隐藏分类列 */
  .table-card :deep(.el-table__header-wrapper th:nth-child(2)),
  .table-card :deep(.el-table__body-wrapper td:nth-child(2)) {
    display: none;
  }

  /* 分页调整 */
  .pagination-wrap {
    margin-top: 16px;
    padding-top: 12px;
  }

  .pagination-wrap :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .pagination-wrap :deep(.el-pagination__sizes),
  .pagination-wrap :deep(.el-pagination__jump) {
    display: none;
  }
}

/* 手机端 (<576px) */
@media (max-width: 576px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 14px;
  }

  .page-title {
    font-size: 17px;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
  }

  .search-bar {
    margin-bottom: 14px;
  }

  .search-input {
    max-width: 100%;
  }

  .search-input :deep(.el-input__wrapper) {
    border-radius: 8px 0 0 8px;
  }

  .search-input :deep(.el-input-group__append) {
    border-radius: 0 8px 8px 0;
    padding: 0 10px;
  }

  .search-input :deep(.el-input-group__append .el-button span:last-child) {
    display: none;
  }

  .search-tips {
    margin-top: 8px;
    gap: 6px;
  }

  /* 表格卡片 */
  .table-card {
    border-radius: 8px;
  }

  .table-card :deep(.el-card__body) {
    padding: 10px;
  }

  /* 表格样式 */
  .table-card :deep(.el-table) {
    font-size: 13px;
  }

  .table-card :deep(.el-table__header th) {
    padding: 8px 0;
    font-size: 13px;
  }

  .table-card :deep(.el-table__body td) {
    padding: 10px 0;
  }

  /* 隐藏分类和原料数量列 */
  .table-card :deep(.el-table__header-wrapper th:nth-child(2)),
  .table-card :deep(.el-table__body-wrapper td:nth-child(2)),
  .table-card :deep(.el-table__header-wrapper th:nth-child(3)),
  .table-card :deep(.el-table__body-wrapper td:nth-child(3)) {
    display: none;
  }

  .recipe-name {
    gap: 6px;
  }

  .recipe-icon {
    font-size: 16px;
  }

  /* 操作列 */
  .table-card :deep(.el-table__fixed-right) {
    right: 0 !important;
  }

  .table-card :deep(.el-button--small) {
    padding: 6px 10px;
    font-size: 12px;
  }

  .table-card :deep(.el-button--small .el-icon) {
    margin-right: 2px;
  }

  /* 分页 */
  .pagination-wrap {
    margin-top: 14px;
    padding-top: 10px;
  }

  .pagination-wrap :deep(.el-pagination) {
    gap: 4px;
  }

  .pagination-wrap :deep(.el-pagination .el-pagination__total) {
    font-size: 12px;
  }

  .pagination-wrap :deep(.el-pager li) {
    min-width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .pagination-wrap :deep(.btn-prev),
  .pagination-wrap :deep(.btn-next) {
    min-width: 28px;
    height: 28px;
  }
}

/* 超小屏幕 (<400px) */
@media (max-width: 400px) {
  .page-title {
    font-size: 16px;
  }

  .add-btn {
    padding: 8px 12px;
    font-size: 13px;
  }

  .table-card :deep(.el-card__body) {
    padding: 8px;
  }

  .table-card :deep(.el-table) {
    font-size: 12px;
  }

  .recipe-name {
    gap: 4px;
  }

  .recipe-icon {
    font-size: 14px;
  }

  .table-card :deep(.el-button--small) {
    padding: 5px 8px;
    font-size: 11px;
  }

  /* 隐藏按钮文字，只显示图标 */
  .table-card :deep(.el-button--small span:last-child) {
    display: none;
  }

  .table-card :deep(.el-button--small .el-icon) {
    margin-right: 0;
    font-size: 14px;
  }

  .pagination-wrap :deep(.el-pager li) {
    min-width: 24px;
    height: 24px;
    font-size: 11px;
  }

  .pagination-wrap :deep(.btn-prev),
  .pagination-wrap :deep(.btn-next) {
    min-width: 24px;
    height: 24px;
  }
}
</style>
