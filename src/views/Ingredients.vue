<template>
  <div class="ingredients-page">
    <div class="page-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">原料管理</h2>
      <el-button type="primary" @click="openAddDialog" class="add-btn">
        <el-icon><Plus /></el-icon>新增原料
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索原料名称..."
        size="large"
        clearable
        @keyup.enter="handleSearch"
        @clear="handleSearch"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
        </template>
      </el-input>
      <div class="search-result" v-if="searchKeyword && total > 0">
        <el-tag type="info" size="small" effect="plain">
          找到 {{ total }} 个原料
        </el-tag>
        <el-button text type="primary" size="small" @click="clearSearch">
          清除搜索
        </el-button>
      </div>
    </div>

    <!-- 原料列表 -->
    <el-card class="table-card" shadow="hover">
      <el-table
        :data="ingredientList"
        style="width: 100%"
        v-loading="loading"
        empty-text="暂无原料数据"
        row-class-name="table-row"
      >
        <el-table-column prop="name" label="原料名称" min-width="180">
          <template #default="scope">
            <span class="ingredient-name" v-html="highlightKeyword(scope.row.name)"></span>
          </template>
        </el-table-column>
        <el-table-column label="采购信息" min-width="140" align="center">
          <template #default="scope">
            <div class="purchase-info">
              <span class="price">¥{{ formatPrice(scope.row.purchase_price || scope.row.price) }}</span>
              <span class="unit">/{{ scope.row.purchase_unit || scope.row.unit || '份' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="换算" min-width="150" align="center">
          <template #default="scope">
            <div class="conversion-info" v-if="scope.row.conversion_rate">
              <span class="from">1{{ scope.row.purchase_unit || '份' }}</span>
              <el-icon class="arrow"><Right /></el-icon>
              <span class="to">{{ scope.row.conversion_rate }}{{ scope.row.base_unit || '克' }}</span>
            </div>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="160" align="center">
          <template #default="scope">
            <div class="action-btns">
              <el-button class="action-btn edit-btn" @click="openEditDialog(scope.row)">
                编辑
              </el-button>
              <el-button class="action-btn delete-btn" @click="handleDelete(scope.row)">
                删除
              </el-button>
            </div>
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

    <!-- 新增/编辑原料对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isEdit ? '编辑原料' : '新增原料'"
      width="560px"
      @close="resetForm"
      class="edit-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
        label-position="left"
      >
        <el-form-item label="原料名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入原料名称" size="large" clearable />
        </el-form-item>

        <el-divider>
          <el-icon><ShoppingCart /></el-icon>
          <span>采购信息</span>
        </el-divider>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="采购单位" prop="purchase_unit">
              <el-select v-model="form.purchase_unit" placeholder="选择单位" filterable allow-create style="width: 100%">
                <el-option label="斤" value="斤" />
                <el-option label="公斤" value="公斤" />
                <el-option label="个" value="个" />
                <el-option label="只" value="只" />
                <el-option label="瓶" value="瓶" />
                <el-option label="袋" value="袋" />
                <el-option label="包" value="包" />
                <el-option label="盒" value="盒" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采购单价" prop="purchase_price">
              <el-input-number
                v-model="form.purchase_price"
                :min="0"
                :precision="2"
                :step="0.5"
                placeholder="0.00"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider>
          <el-icon><ScaleToOriginal /></el-icon>
          <span>单位换算</span>
        </el-divider>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="基础单位" prop="base_unit">
              <el-select v-model="form.base_unit" placeholder="配菜单位" style="width: 100%">
                <el-option-group label="重量">
                  <el-option label="克" value="克" />
                  <el-option label="千克" value="千克" />
                </el-option-group>
                <el-option-group label="数量">
                  <el-option label="个" value="个" />
                  <el-option label="只" value="只" />
                  <el-option label="根" value="根" />
                  <el-option label="片" value="片" />
                </el-option-group>
                <el-option-group label="容量">
                  <el-option label="毫升" value="毫升" />
                  <el-option label="升" value="升" />
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="换算比例" prop="conversion_rate">
              <el-input-number
                v-model="form.conversion_rate"
                :min="0"
                :precision="0"
                placeholder="如: 500"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="conversion-preview" v-if="form.purchase_unit && form.base_unit && form.conversion_rate">
          <el-icon><InfoFilled /></el-icon>
          <span>换算关系：1 {{ form.purchase_unit }} = {{ form.conversion_rate }} {{ form.base_unit }}</span>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ isEdit ? '保存修改' : '确认添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  Plus,
  Edit,
  Delete,
  Search,
  Right,
  ShoppingCart,
  ScaleToOriginal,
  InfoFilled,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import materialsApi from '@/api/materials'

export default {
  name: 'Ingredients',
  components: {
    Plus,
    Edit,
    Delete,
    Search,
    Right,
    ShoppingCart,
    ScaleToOriginal,
    InfoFilled,
  },
  data() {
    return {
      loading: false,
      saving: false,
      currentPage: 1,
      pageSize: 20,
      total: 0,
      ingredientList: [],
      searchKeyword: '',
      // 新增/编辑对话框
      editDialogVisible: false,
      isEdit: false,
      editId: null,
      form: {
        name: '',
        purchase_unit: '斤',
        purchase_price: 0,
        base_unit: '克',
        conversion_rate: 500,
      },
      formRules: {
        name: [
          { required: true, message: '请输入原料名称', trigger: 'blur' },
          { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' },
        ],
        purchase_unit: [
          { required: true, message: '请选择采购单位', trigger: 'change' },
        ],
        base_unit: [
          { required: true, message: '请选择基础单位', trigger: 'change' },
        ],
      },
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    formatPrice(price) {
      if (price === null || price === undefined) return '0.00'
      return Number(price).toFixed(2)
    },

    highlightKeyword(text) {
      if (!this.searchKeyword.trim() || !text) return text
      const keyword = this.searchKeyword.trim()
      const regex = new RegExp(`(${keyword})`, 'gi')
      return text.replace(regex, '<span class="highlight">$1</span>')
    },

    async loadData() {
      this.loading = true
      try {
        const options = {}
        if (this.searchKeyword?.trim()) {
          options.filter = `name ~ "${this.searchKeyword.trim()}"`
        }
        const result = await materialsApi.getList(this.currentPage, this.pageSize, options)
        this.ingredientList = result.items
        this.total = result.totalItems
      } catch (error) {
        console.error('加载原料数据失败:', error)
        ElMessage.error('加载数据失败，请检查网络连接')
      } finally {
        this.loading = false
      }
    },

    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },

    clearSearch() {
      this.searchKeyword = ''
      this.handleSearch()
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

    openAddDialog() {
      this.isEdit = false
      this.editId = null
      this.form = {
        name: '',
        purchase_unit: '斤',
        purchase_price: 0,
        base_unit: '克',
        conversion_rate: 500,
      }
      this.editDialogVisible = true
    },

    openEditDialog(row) {
      this.isEdit = true
      this.editId = row.id
      this.form = {
        name: row.name || '',
        purchase_unit: row.purchase_unit || row.unit || '斤',
        purchase_price: row.purchase_price || row.price || 0,
        base_unit: row.base_unit || '克',
        conversion_rate: row.conversion_rate || 500,
      }
      this.editDialogVisible = true
    },

    resetForm() {
      this.$refs.formRef?.resetFields()
    },

    async handleSave() {
      try {
        await this.$refs.formRef.validate()
      } catch {
        return
      }

      this.saving = true
      try {
        const data = {
          name: this.form.name.trim(),
          purchase_unit: this.form.purchase_unit || '斤',
          purchase_price: this.form.purchase_price || 0,
          base_unit: this.form.base_unit || '克',
          conversion_rate: this.form.conversion_rate || 500,
          unit: this.form.base_unit || '克',
          price: this.form.purchase_price || 0,
        }

        if (this.isEdit) {
          await materialsApi.update(this.editId, data)
          ElMessage.success('原料修改成功！')
        } else {
          await materialsApi.create(data)
          ElMessage.success('原料添加成功！')
        }

        this.editDialogVisible = false
        this.loadData()
      } catch (error) {
        console.error('保存原料失败:', error)
        ElMessage.error('保存失败，请重试')
      } finally {
        this.saving = false
      }
    },

    async handleDelete(row) {
      try {
        await ElMessageBox.confirm(
          `确定要删除原料"${row.name}"吗？`,
          '删除确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )

        this.loading = true
        await materialsApi.delete(row.id)
        ElMessage.success('删除成功！')
        this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除原料失败:', error)
          ElMessage.error('删除失败')
        }
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.ingredients-page {
  padding: 0;
}

/* 页面容器 - 限制最大宽度 */
.page-container {
  max-width: 900px;
  margin: 0 auto;
}

/* 页面头部 */
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
}

.add-btn {
  border-radius: 8px;
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
  max-width: 450px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px 0 0 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-input :deep(.el-input-group__append) {
  border-radius: 0 10px 10px 0;
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  border: none;
}

.search-input :deep(.el-input-group__append .el-button) {
  color: #fff;
  font-weight: 500;
}

.search-result {
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

/* 表格单元格 */
.ingredient-name {
  font-weight: 500;
  color: #1e293b;
}

.ingredient-name :deep(.highlight) {
  background-color: rgba(16, 185, 129, 0.2);
  color: #059669;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
}

.purchase-info {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
}

.purchase-info .price {
  color: #ef4444;
  font-weight: 600;
  font-size: 14px;
}

.purchase-info .unit {
  color: #64748b;
  font-size: 12px;
}

.conversion-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
}

.conversion-info .from {
  color: #f59e0b;
  font-weight: 500;
}

.conversion-info .arrow {
  color: #94a3b8;
  font-size: 12px;
}

.conversion-info .to {
  color: #10b981;
  font-weight: 500;
}

.no-data {
  color: #cbd5e1;
}

/* 分页 */
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 操作按钮 */
.action-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  min-width: 60px;
}

.edit-btn {
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.edit-btn:hover {
  background-color: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
  color: #059669;
}

.delete-btn {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.delete-btn:hover {
  background-color: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #dc2626;
}

/* 编辑对话框 */
.edit-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.edit-dialog :deep(.el-divider__text) {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
}

.conversion-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%);
  border-radius: 8px;
  color: #10b981;
  font-size: 14px;
  font-weight: 500;
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
    max-width: 380px;
  }

  .table-card :deep(.el-card__body) {
    padding: 16px;
  }

  .edit-dialog :deep(.el-dialog) {
    width: 90% !important;
    max-width: 520px;
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

  .search-result {
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

  /* 隐藏换算列 */
  .table-card :deep(.el-table__header-wrapper th:nth-child(3)),
  .table-card :deep(.el-table__body-wrapper td:nth-child(3)) {
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

  /* 对话框 */
  .edit-dialog :deep(.el-dialog) {
    width: 92% !important;
    max-width: 480px;
    margin: 5vh auto !important;
  }

  .edit-dialog :deep(.el-dialog__body) {
    padding: 16px 20px;
  }

  /* 对话框表单两列变一列 */
  .edit-dialog :deep(.el-col-12) {
    max-width: 100%;
    flex: 0 0 100%;
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

  .search-result {
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

  /* 隐藏采购信息和换算列 */
  .table-card :deep(.el-table__header-wrapper th:nth-child(2)),
  .table-card :deep(.el-table__body-wrapper td:nth-child(2)),
  .table-card :deep(.el-table__header-wrapper th:nth-child(3)),
  .table-card :deep(.el-table__body-wrapper td:nth-child(3)) {
    display: none;
  }

  .ingredient-name {
    font-size: 14px;
  }

  /* 操作按钮 */
  .action-btns {
    gap: 6px;
  }

  .action-btn {
    padding: 6px 12px;
    font-size: 13px;
    min-width: 50px;
  }

  /* 操作列 */
  .table-card :deep(.el-table__fixed-right) {
    right: 0 !important;
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

  /* 对话框 */
  .edit-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 3vh auto !important;
    border-radius: 12px;
  }

  .edit-dialog :deep(.el-dialog__header) {
    padding: 14px 16px 12px;
  }

  .edit-dialog :deep(.el-dialog__title) {
    font-size: 16px;
  }

  .edit-dialog :deep(.el-dialog__body) {
    padding: 12px 16px;
  }

  .edit-dialog :deep(.el-dialog__footer) {
    padding: 12px 16px 16px;
  }

  .edit-dialog :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  .edit-dialog :deep(.el-form-item__label) {
    font-size: 13px;
    padding-bottom: 4px;
  }

  .edit-dialog :deep(.el-divider) {
    margin: 16px 0;
  }

  .edit-dialog :deep(.el-divider__text) {
    font-size: 12px;
    padding: 0 8px;
  }

  .conversion-preview {
    padding: 10px 12px;
    font-size: 13px;
    border-radius: 6px;
  }

  /* 对话框按钮 */
  .edit-dialog :deep(.el-dialog__footer .el-button) {
    padding: 10px 16px;
    font-size: 14px;
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

  .ingredient-name {
    font-size: 13px;
  }

  .action-btn {
    padding: 5px 10px;
    font-size: 12px;
    min-width: 44px;
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

  /* 对话框 */
  .edit-dialog :deep(.el-dialog) {
    width: 98% !important;
    margin: 2vh auto !important;
  }

  .edit-dialog :deep(.el-dialog__header) {
    padding: 12px 14px 10px;
  }

  .edit-dialog :deep(.el-dialog__body) {
    padding: 10px 14px;
  }

  .edit-dialog :deep(.el-dialog__footer) {
    padding: 10px 14px 14px;
  }

  .edit-dialog :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  .conversion-preview {
    padding: 8px 10px;
    font-size: 12px;
    gap: 6px;
  }

  .edit-dialog :deep(.el-dialog__footer .el-button) {
    padding: 8px 14px;
    font-size: 13px;
  }
}
</style>
