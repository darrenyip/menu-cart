<template>
  <div class="ingredients-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2 class="page-title">原料管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon>新增原料
        </el-button>
        <el-button @click="importDialogVisible = true">
          <el-icon><Upload /></el-icon>批量导入
        </el-button>
      </div>
    </div>

    <!-- 搜索和统计 -->
    <el-row :gutter="16" class="filter-row">
      <el-col :span="8">
        <div class="stat-card stat-card-total">
          <div class="stat-icon">
            <el-icon :size="28"><ShoppingBag /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ total }}</div>
            <div class="stat-label">全部原料</div>
          </div>
        </div>
      </el-col>
      <el-col :span="16">
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索原料名称..."
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
            size="large"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button @click="handleSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
      </el-col>
    </el-row>

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
            <div class="ingredient-name">
              <el-icon class="ingredient-icon"><Apple /></el-icon>
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="编码" width="100" align="center">
          <template #default="scope">
            <span class="code-text">{{ scope.row.code || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="采购单位" width="100" align="center">
          <template #default="scope">
            <el-tag type="warning" size="small" effect="plain">
              {{ scope.row.purchase_unit || scope.row.unit || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="采购单价" width="120" align="center">
          <template #default="scope">
            <span class="price-text">
              ¥{{ formatPrice(scope.row.purchase_price || scope.row.price) }}/{{ scope.row.purchase_unit || scope.row.unit || '份' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="基础单位" width="100" align="center">
          <template #default="scope">
            <el-tag type="info" size="small" effect="plain">
              {{ scope.row.base_unit || '克' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="换算比例" width="140" align="center">
          <template #default="scope">
            <span class="conversion-text" v-if="scope.row.conversion_rate">
              1{{ scope.row.purchase_unit || '份' }} = {{ scope.row.conversion_rate }}{{ scope.row.base_unit || '克' }}
            </span>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="140" align="center">
          <template #default="scope">
            <el-button size="small" text type="primary" @click="openEditDialog(scope.row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button size="small" text type="danger" @click="handleDelete(scope.row)">
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

    <!-- 新增/编辑原料对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isEdit ? '编辑原料' : '新增原料'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="90px"
        label-position="left"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="原料名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入原料名称" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品编码" prop="code">
              <el-input v-model="form.code" placeholder="可选" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">
          <el-icon><Money /></el-icon> 采购信息
        </el-divider>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="采购单位" prop="purchase_unit">
              <el-select v-model="form.purchase_unit" placeholder="选择采购单位" filterable allow-create style="width: 100%">
                <el-option label="斤" value="斤" />
                <el-option label="公斤" value="公斤" />
                <el-option label="千克" value="千克" />
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

        <el-divider content-position="left">
          <el-icon><Goods /></el-icon> 配菜单位（用于菜单录入）
        </el-divider>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="基础单位" prop="base_unit">
              <el-select v-model="form.base_unit" placeholder="选择基础单位" style="width: 100%">
                <el-option-group label="重量（推荐）">
                  <el-option label="克" value="克" />
                  <el-option label="千克" value="千克" />
                </el-option-group>
                <el-option-group label="数量">
                  <el-option label="个" value="个" />
                  <el-option label="只" value="只" />
                  <el-option label="根" value="根" />
                  <el-option label="片" value="片" />
                  <el-option label="块" value="块" />
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
              <div class="form-tip" v-if="form.purchase_unit && form.base_unit && form.conversion_rate">
                1{{ form.purchase_unit }} = {{ form.conversion_rate }}{{ form.base_unit }}
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ isEdit ? '保存修改' : '确认添加' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入原料" width="600px">
      <div>
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <p style="margin: 5px 0">请上传包含以下列的 Excel 文件：</p>
            <ul style="margin: 5px 0; padding-left: 20px">
              <li>原单据号</li>
              <li>商品编码</li>
              <li>公司商品名称</li>
              <li>单位（作为采购单位）</li>
              <li>单价（作为采购单价）</li>
            </ul>
            <p style="margin: 5px 0; color: #e6a23c">
              导入后基础单位默认为「克」，换算比例默认为 500（1斤=500克）
            </p>
          </template>
        </el-alert>

        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="1"
          accept=".xlsx,.xls"
          drag
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">仅支持 Excel 文件（.xlsx, .xls）</div>
          </template>
        </el-upload>

        <div v-if="importPreviewData.length > 0" style="margin-top: 20px">
          <el-divider>预览数据（前5条）</el-divider>
          <el-table :data="importPreviewData" size="small" max-height="300">
            <el-table-column prop="code" label="编码" width="100"></el-table-column>
            <el-table-column prop="name" label="名称" min-width="120"></el-table-column>
            <el-table-column prop="purchase_unit" label="采购单位" width="80"></el-table-column>
            <el-table-column prop="purchase_price" label="采购单价" width="90">
              <template #default="scope">
                ¥{{ formatPrice(scope.row.purchase_price) }}
              </template>
            </el-table-column>
            <el-table-column prop="base_unit" label="基础单位" width="80"></el-table-column>
          </el-table>
          <div style="margin-top: 10px; color: #909399; font-size: 12px">
            共解析到 {{ totalImportCount }} 条数据
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeImportDialog">取消</el-button>
          <el-button
            type="primary"
            @click="handleImport"
            :disabled="importData.length === 0"
            :loading="importing"
          >
            确认导入
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  Plus,
  Upload,
  UploadFilled,
  ShoppingBag,
  Apple,
  Edit,
  Delete,
  Search,
  Money,
  Goods,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import materialsApi from '@/api/materials'

export default {
  name: 'Ingredients',
  components: {
    Plus,
    Upload,
    UploadFilled,
    ShoppingBag,
    Apple,
    Edit,
    Delete,
    Search,
    Money,
    Goods,
  },
  data() {
    return {
      loading: false,
      saving: false,
      importing: false,
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
        code: '',
        purchase_unit: '斤',
        purchase_price: 0,
        base_unit: '克',
        conversion_rate: 500,
        remark: '',
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
      // 批量导入
      importDialogVisible: false,
      importData: [],
      importPreviewData: [],
      totalImportCount: 0,
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    // 格式化价格
    formatPrice(price) {
      if (price === null || price === undefined) return '0.00'
      return Number(price).toFixed(2)
    },

    // 加载数据
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

    // 搜索
    handleSearch() {
      this.currentPage = 1
      this.loadData()
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

    // 打开新增对话框
    openAddDialog() {
      this.isEdit = false
      this.editId = null
      this.form = {
        name: '',
        code: '',
        purchase_unit: '斤',
        purchase_price: 0,
        base_unit: '克',
        conversion_rate: 500,
        remark: '',
      }
      this.editDialogVisible = true
    },

    // 打开编辑对话框
    openEditDialog(row) {
      this.isEdit = true
      this.editId = row.id
      this.form = {
        name: row.name || '',
        code: row.code || '',
        purchase_unit: row.purchase_unit || row.unit || '斤',
        purchase_price: row.purchase_price || row.price || 0,
        base_unit: row.base_unit || '克',
        conversion_rate: row.conversion_rate || 500,
        remark: row.remark || '',
      }
      this.editDialogVisible = true
    },

    // 重置表单
    resetForm() {
      this.$refs.formRef?.resetFields()
    },

    // 保存原料
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
          code: this.form.code?.trim() || '',
          // 采购信息
          purchase_unit: this.form.purchase_unit || '斤',
          purchase_price: this.form.purchase_price || 0,
          // 基础单位信息
          base_unit: this.form.base_unit || '克',
          conversion_rate: this.form.conversion_rate || 500,
          // 兼容旧字段
          unit: this.form.base_unit || '克',
          price: this.form.purchase_price || 0,
          // 备注
          remark: this.form.remark?.trim() || '',
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

    // 删除原料
    async handleDelete(row) {
      try {
        await ElMessageBox.confirm(
          `确定要删除原料"${row.name}"吗？删除后无法恢复！`,
          '删除警告',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )

        this.loading = true
        await materialsApi.delete(row.id)
        ElMessage.success('原料删除成功！')
        this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除原料失败:', error)
          ElMessage.error('删除失败，请重试')
        }
      } finally {
        this.loading = false
      }
    },

    // 处理文件选择
    handleFileChange(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })

          // 读取第一个工作表
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]

          // 从第4行开始读取（跳过前3行的公司信息）
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 3 })

          if (jsonData.length === 0) {
            ElMessage.warning('Excel 文件中没有数据')
            return
          }

          // 解析数据，使用新的字段结构
          const parsedData = jsonData.map((row) => {
            const order_no = row['原单据号'] || ''
            const code = row['商品编码'] || ''
            const name = row['公司商品名称'] || row['商品名称'] || ''
            const purchase_unit = row['单位'] || '斤'
            const priceValue = row['单价'] || row['含税单价'] || 0
            const purchase_price = parseFloat(priceValue) || 0

            return {
              order_no,
              code,
              name,
              // 采购信息
              purchase_unit,
              purchase_price,
              // 基础单位默认为克，换算比例默认 500（1斤=500克）
              base_unit: '克',
              conversion_rate: 500,
              // 兼容旧字段
              unit: '克',
              price: purchase_price,
            }
          })

          // 过滤无效数据
          this.importData = parsedData.filter((item) => item.name && item.name.trim() !== '')

          this.totalImportCount = this.importData.length
          this.importPreviewData = this.importData.slice(0, 5)

          if (this.totalImportCount === 0) {
            ElMessage.error('未能解析到有效数据，请检查 Excel 文件格式')
          } else {
            ElMessage.success(`成功解析 ${this.totalImportCount} 条数据`)
          }
        } catch (error) {
          console.error('解析 Excel 文件失败：', error)
          ElMessage.error('解析文件失败，请检查文件格式')
        }
      }
      reader.readAsArrayBuffer(file.raw)
    },

    // 关闭导入对话框
    closeImportDialog() {
      this.importDialogVisible = false
      this.importData = []
      this.importPreviewData = []
      this.totalImportCount = 0
      this.$refs.uploadRef?.clearFiles()
    },

    // 确认导入
    async handleImport() {
      if (this.importData.length === 0) {
        ElMessage.warning('没有可导入的数据')
        return
      }

      this.importing = true
      try {
        // 批量创建原料
        const results = await materialsApi.createMany(this.importData)
        ElMessage.success(`成功导入 ${results.length} 条数据`)

        // 关闭对话框并重置
        this.closeImportDialog()

        // 重新加载数据
        this.currentPage = 1
        this.loadData()
      } catch (error) {
        console.error('导入原料失败:', error)
        ElMessage.error('导入失败，请重试')
      } finally {
        this.importing = false
      }
    },
  },
}
</script>

<style scoped>
.ingredients-page {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions .el-button {
  border-radius: 8px;
  font-weight: 500;
}

/* 搜索和统计行 */
.filter-row {
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
  height: 100%;
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
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
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

/* 搜索框 */
.search-box {
  height: 100%;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
}

.search-input :deep(.el-input-group__append) {
  border-radius: 0 10px 10px 0;
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

.ingredient-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ingredient-icon {
  color: #10b981;
  font-size: 18px;
}

.code-text {
  color: #6b7280;
  font-family: 'Consolas', monospace;
  font-size: 12px;
}

.price-text {
  color: #ef4444;
  font-weight: 600;
  font-size: 13px;
}

.conversion-text {
  color: #6b7280;
  font-size: 12px;
}

.no-data {
  color: #c0c4cc;
}

/* 分页 */
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 表单样式 */
.el-form-item {
  margin-bottom: 18px;
}

.el-divider {
  margin: 20px 0;
}

.el-divider :deep(.el-divider__text) {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 13px;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #67c23a;
}

/* 响应式 */
@media (max-width: 1200px) {
  .filter-row .el-col {
    margin-bottom: 12px;
  }
}
</style>
