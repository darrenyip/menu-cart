<template>
  <div>
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      "
    >
      <h2 style="margin: 0; color: #303133">原料管理</h2>
      <div>
        <el-button type="warning" @click="importDialogVisible = true">
          <el-icon><Upload /></el-icon>批量导入
        </el-button>
        <el-button type="success">
          <el-icon><Download /></el-icon>导出原料清单
        </el-button>
        <el-button type="primary">
          <el-icon><Plus /></el-icon>新增原料
        </el-button>
      </div>
    </div>

    <!-- 搜索 -->
    <el-card style="margin-bottom: 20px">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-input placeholder="搜索商品名称" v-model="searchText" clearable>
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="8">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 原料列表 -->
    <el-card>
      <el-table :data="paginatedList" style="width: 100%">
        <el-table-column prop="name" label="商品名称" min-width="200"></el-table-column>
        <el-table-column prop="unit" label="单位" width="120" align="center"></el-table-column>
        <el-table-column prop="price" label="价格" width="150" align="center">
          <template #default="scope">
            <span>¥{{ scope.row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <el-button size="small" text @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" text @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" text style="color: #f56c6c" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="text-align: center; margin-top: 20px">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
        />
      </div>
    </el-card>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入原料" width="600px">
      <div>
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <p style="margin: 5px 0">请上传包含以下列的 Excel 文件：</p>
          <ul style="margin: 5px 0; padding-left: 20px">
            <li>原单据号</li>
            <li>商品编码</li>
            <li>公司商品名称</li>
            <li>单位</li>
            <li>单价</li>
          </ul>
          <p style="margin: 5px 0; color: #E6A23C">系统将自动提取这些字段进行导入</p>
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
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              仅支持 Excel 文件（.xlsx, .xls）
            </div>
          </template>
        </el-upload>

        <div v-if="importPreviewData.length > 0" style="margin-top: 20px">
          <el-divider>预览数据（前5条）</el-divider>
          <el-table :data="importPreviewData" size="small" max-height="300">
            <el-table-column prop="orderNo" label="原单据号" width="120"></el-table-column>
            <el-table-column prop="code" label="商品编码" width="120"></el-table-column>
            <el-table-column prop="name" label="商品名称" min-width="150"></el-table-column>
            <el-table-column prop="unit" label="单位" width="80"></el-table-column>
            <el-table-column prop="price" label="单价" width="100"></el-table-column>
          </el-table>
          <div style="margin-top: 10px; color: #909399; font-size: 12px">
            共解析到 {{ totalImportCount }} 条数据
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleImport" :disabled="importData.length === 0">
            确认导入
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Plus, Search, Download, Upload, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'

export default {
  name: 'Ingredients',
  components: {
    Plus,
    Search,
    Download,
    Upload,
    UploadFilled,
  },
  data() {
    return {
      searchText: '',
      currentPage: 1,
      pageSize: 20,
      ingredientList: [],
      filteredList: [],
      importDialogVisible: false,
      importData: [],
      importPreviewData: [],
      totalImportCount: 0,
    }
  },
  computed: {
    total() {
      return this.filteredList.length
    },
    paginatedList() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredList.slice(start, end)
    },
  },
  mounted() {
    this.filteredList = [...this.ingredientList]
  },
  methods: {
    handleSearch() {
      if (this.searchText.trim()) {
        this.filteredList = this.ingredientList.filter(item =>
          item.name.toLowerCase().includes(this.searchText.toLowerCase())
        )
      } else {
        this.filteredList = [...this.ingredientList]
      }
      this.currentPage = 1
    },
    handleReset() {
      this.searchText = ''
      this.filteredList = [...this.ingredientList]
      this.currentPage = 1
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
    },
    handleCurrentChange(val) {
      this.currentPage = val
    },
    handleView(row) {
      ElMessageBox.alert(
        `<div style="line-height: 2">
          <p><strong>商品名称：</strong>${row.name}</p>
          <p><strong>商品编码：</strong>${row.code || '-'}</p>
          <p><strong>原单据号：</strong>${row.orderNo || '-'}</p>
          <p><strong>单位：</strong>${row.unit}</p>
          <p><strong>价格：</strong>¥${row.price}</p>
        </div>`,
        '商品详情',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确定',
        }
      )
    },
    handleEdit(row) {
      ElMessage.info('编辑功能开发中...')
    },
    handleDelete(row) {
      ElMessageBox.confirm(
        `确定要删除商品"${row.name}"吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
        .then(() => {
          const index = this.ingredientList.findIndex(item => item.id === row.id)
          if (index > -1) {
            this.ingredientList.splice(index, 1)
            this.handleSearch()
            ElMessage.success('删除成功')
          }
        })
        .catch(() => {
          ElMessage.info('已取消删除')
        })
    },
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
          // range: 3 表示从第4行开始（索引从0开始）
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 3 })
          
          if (jsonData.length === 0) {
            ElMessage.warning('Excel 文件中没有数据')
            return
          }
          
          // 打印第一行数据用于调试
          console.log('Excel 表头字段：', Object.keys(jsonData[0]))
          console.log('第一行数据：', jsonData[0])
          
          // 解析数据，提取需要的字段
          const parsedData = jsonData.map((row, index) => {
            // 处理可能的字段名称变化（去除空格、制表符等）
            const orderNo = row['原单据号'] || ''
            const code = row['商品编码'] || ''
            const name = row['公司商品名称'] || row['商品名称'] || ''
            const unit = row['单位'] || ''
            // 尝试多种可能的单价字段名
            const priceValue = row['单价'] || row['含税单价'] || 0
            const price = parseFloat(priceValue) || 0
            
            return {
              id: Date.now() + index,
              orderNo,
              code,
              name,
              unit,
              price,
            }
          })
          
          console.log('解析前总数据：', parsedData.length)
          console.log('前3条解析数据：', parsedData.slice(0, 3))
          
          // 只过滤掉完全无效的数据
          this.importData = parsedData.filter(item => {
            const isValid = item.name && item.name.trim() !== ''
            if (!isValid) {
              console.log('过滤掉的数据：', item)
            }
            return isValid
          })
          
          this.totalImportCount = this.importData.length
          this.importPreviewData = this.importData.slice(0, 5)
          
          if (this.totalImportCount === 0) {
            ElMessage.error('未能解析到有效数据，请检查 Excel 文件中是否包含"公司商品名称"或"商品名称"列')
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
    handleImport() {
      if (this.importData.length === 0) {
        ElMessage.warning('没有可导入的数据')
        return
      }
      
      // 合并导入的数据到列表中
      this.ingredientList.push(...this.importData)
      this.filteredList = [...this.ingredientList]
      
      ElMessage.success(`成功导入 ${this.importData.length} 条数据`)
      
      // 重置导入状态
      this.importDialogVisible = false
      this.importData = []
      this.importPreviewData = []
      this.totalImportCount = 0
      
      // 清空上传组件
      this.$refs.uploadRef?.clearFiles()
    },
  },
}
</script>

<style scoped></style>
