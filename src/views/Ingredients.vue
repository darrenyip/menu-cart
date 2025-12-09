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
          <el-tag type="info" size="small" effect="plain"> 找到 {{ total }} 个原料 </el-tag>
          <el-button text type="primary" size="small" @click="clearSearch"> 清除搜索 </el-button>
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
                <span class="price"
                  >¥{{ formatPrice(scope.row.purchase_price || scope.row.price) }}</span
                >
                <span class="unit">/{{ scope.row.purchase_unit || scope.row.unit || '份' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="换算" min-width="150" align="center">
            <template #default="scope">
              <div class="conversion-info" v-if="scope.row.conversion_rate">
                <span class="from">1{{ scope.row.purchase_unit || '份' }}</span>
                <el-icon class="arrow"><Right /></el-icon>
                <span class="to"
                  >{{ scope.row.conversion_rate }}{{ scope.row.base_unit || '克' }}</span
                >
              </div>
              <span v-else class="no-data">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="220" align="center">
            <template #default="scope">
              <div class="action-btns">
                <el-button class="action-btn history-btn" @click="openPriceHistory(scope.row)">
                  <el-icon><TrendCharts /></el-icon>
                </el-button>
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

    <!-- 新增/编辑原料对话框（抽成独立组件） -->
    <MaterialEditDialog
      v-model="editDialogVisible"
      :material="editMaterial"
      :supplier-options="supplierOptions"
      @saved="loadData"
    />

    <!-- 价格历史对话框 -->
    <el-dialog
      v-model="priceHistoryVisible"
      :title="`${currentMaterial?.name || ''} - 价格历史`"
      width="700px"
      class="price-history-dialog"
      destroy-on-close
    >
      <div class="price-history-content" v-loading="priceHistoryLoading">
        <!-- 价格趋势图表 -->
        <div class="chart-section" v-if="priceHistoryData.length > 0">
          <h4 class="section-title">
            <el-icon><TrendCharts /></el-icon>
            <span>价格趋势</span>
          </h4>
          <div class="chart-container">
            <v-chart :option="chartOption" autoresize style="height: 250px" />
          </div>
        </div>

        <!-- 价格统计 -->
        <div class="stats-section" v-if="priceHistoryData.length > 0">
          <div class="stat-item">
            <span class="stat-label">当前价格</span>
            <span class="stat-value current"
              >¥{{ formatPrice(currentMaterial?.purchase_price) }}</span
            >
          </div>
          <div class="stat-item">
            <span class="stat-label">最高价格</span>
            <span class="stat-value high">¥{{ formatPrice(priceStats.max) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最低价格</span>
            <span class="stat-value low">¥{{ formatPrice(priceStats.min) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均价格</span>
            <span class="stat-value avg">¥{{ formatPrice(priceStats.avg) }}</span>
          </div>
        </div>

        <!-- 历史记录列表 -->
        <div class="history-list-section">
          <h4 class="section-title">
            <el-icon><List /></el-icon>
            <span>历史记录</span>
            <el-button
              type="primary"
              size="small"
              text
              @click="showAddPriceForm = true"
              v-if="!showAddPriceForm"
            >
              <el-icon><Plus /></el-icon>手动记录
            </el-button>
          </h4>

          <!-- 添加价格表单 -->
          <div class="add-price-form" v-if="showAddPriceForm">
            <div class="form-header">
              <el-icon class="form-icon"><Plus /></el-icon>
              <span>记录新价格</span>
            </div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :xs="12" :sm="6">
                  <el-form-item label="价格 (元)" required>
                    <el-input-number
                      v-model="newPriceForm.price"
                      :min="0"
                      :precision="2"
                      :step="0.5"
                      placeholder="0.00"
                      style="width: 100%"
                      controls-position="right"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="12" :sm="6">
                  <el-form-item label="日期" required>
                    <el-date-picker
                      v-model="newPriceForm.date"
                      type="date"
                      placeholder="选择日期"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="12" :sm="6">
                  <el-form-item label="供应商/来源">
                    <el-select
                      v-model="newPriceForm.supplier"
                      placeholder="选择或输入"
                      filterable
                      allow-create
                      clearable
                      style="width: 100%"
                    >
                      <el-option v-for="s in supplierOptions" :key="s" :label="s" :value="s" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :xs="12" :sm="6">
                  <el-form-item label="备注">
                    <el-input v-model="newPriceForm.note" placeholder="可选" clearable />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="form-actions">
                <el-button @click="showAddPriceForm = false">取消</el-button>
                <el-button type="primary" @click="handleAddPrice" :loading="addingPrice">
                  <el-icon><Check /></el-icon>确认添加
                </el-button>
              </div>
            </el-form>
          </div>

          <el-table
            :data="priceHistoryData"
            style="width: 100%"
            max-height="300"
            empty-text="暂无价格记录"
          >
            <el-table-column prop="date" label="日期" width="110">
              <template #default="scope">
                {{ formatDate(scope.row.date) }}
              </template>
            </el-table-column>
            <el-table-column prop="price" label="价格" width="90">
              <template #default="scope">
                <span class="price-cell">¥{{ formatPrice(scope.row.price) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="supplier" label="供应商" min-width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.supplier" size="small" type="info" effect="plain">
                  {{ scope.row.supplier }}
                </el-tag>
                <span v-else class="note-cell">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="note" label="备注" min-width="120">
              <template #default="scope">
                <span class="note-cell">{{ scope.row.note || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="scope">
                <el-button type="danger" size="small" text @click="handleDeletePrice(scope.row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="!priceHistoryLoading && priceHistoryData.length === 0"
          description="暂无价格历史记录"
        >
          <el-button type="primary" @click="showAddPriceForm = true">
            <el-icon><Plus /></el-icon>记录第一条价格
          </el-button>
        </el-empty>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Plus, Search, Right, TrendCharts, List, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  MarkPointComponent,
  MarkLineComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import materialsApi from '@/api/materials'
import materialPricesApi from '@/api/materialPrices'
import MaterialEditDialog from '@/components/MaterialEditDialog.vue'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  MarkPointComponent,
  MarkLineComponent,
])

export default {
  name: 'Ingredients',
  components: {
    Plus,
    Search,
    Right,
    TrendCharts,
    List,
    Check,
    VChart,
    MaterialEditDialog,
  },
  data() {
    return {
      loading: false,
      currentPage: 1,
      pageSize: 20,
      total: 0,
      ingredientList: [],
      searchKeyword: '',
      // 新增/编辑对话框
      editDialogVisible: false,
      editMaterial: null, // null = 新增模式，有值 = 编辑模式
      // 价格历史相关
      priceHistoryVisible: false,
      priceHistoryLoading: false,
      priceHistoryData: [],
      currentMaterial: null,
      showAddPriceForm: false,
      addingPrice: false,
      newPriceForm: {
        price: 0,
        date: '',
        supplier: '',
        note: '',
      },
      // 供应商选项（从历史记录中自动提取）
      supplierOptions: ['乐禾', '快驴', '超市'],
    }
  },
  computed: {
    // 价格统计
    priceStats() {
      if (this.priceHistoryData.length === 0) {
        return { min: 0, max: 0, avg: 0 }
      }
      const prices = this.priceHistoryData.map((item) => item.price)
      const min = Math.min(...prices)
      const max = Math.max(...prices)
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length
      return { min, max, avg }
    },
    // 图表配置
    chartOption() {
      const dates = this.priceHistoryData.map((item) => this.formatDate(item.date))
      const prices = this.priceHistoryData.map((item) => item.price)

      return {
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const data = params[0]
            return `${data.name}<br/>价格: ¥${data.value.toFixed(2)}`
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '10%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLabel: {
            fontSize: 11,
            color: '#64748b',
          },
          axisLine: {
            lineStyle: { color: '#e2e8f0' },
          },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            fontSize: 11,
            color: '#64748b',
            formatter: '¥{value}',
          },
          axisLine: { show: false },
          splitLine: {
            lineStyle: { color: '#f1f5f9', type: 'dashed' },
          },
        },
        series: [
          {
            name: '价格',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: {
              color: '#10b981',
              width: 3,
            },
            itemStyle: {
              color: '#10b981',
              borderColor: '#fff',
              borderWidth: 2,
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                  { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
                ],
              },
            },
            markPoint: {
              data: [
                { type: 'max', name: '最高' },
                { type: 'min', name: '最低' },
              ],
              symbolSize: 50,
              label: {
                formatter: '¥{c}',
                fontSize: 10,
              },
            },
            markLine: {
              data: [{ type: 'average', name: '平均' }],
              label: {
                formatter: '平均: ¥{c}',
                fontSize: 10,
              },
              lineStyle: {
                color: '#f59e0b',
                type: 'dashed',
              },
            },
            data: prices,
          },
        ],
      }
    },
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
      this.editMaterial = null
      this.editDialogVisible = true
    },

    openEditDialog(row) {
      this.editMaterial = row
      this.editDialogVisible = true
    },

    async handleDelete(row) {
      try {
        await ElMessageBox.confirm(`确定要删除原料"${row.name}"吗？`, '删除确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })

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

    // 价格历史相关方法
    async openPriceHistory(row) {
      this.currentMaterial = row
      this.priceHistoryVisible = true
      this.showAddPriceForm = false
      this.resetNewPriceForm()
      await this.loadPriceHistory()
    },

    async loadPriceHistory() {
      if (!this.currentMaterial) return

      this.priceHistoryLoading = true
      try {
        const result = await materialPricesApi.getAll(this.currentMaterial.id)
        this.priceHistoryData = result
        this.updateSupplierOptions()
      } catch (error) {
        console.error('加载价格历史失败:', error)
        ElMessage.error('加载价格历史失败')
      } finally {
        this.priceHistoryLoading = false
      }
    },

    resetNewPriceForm() {
      this.newPriceForm = {
        price: this.currentMaterial?.purchase_price || 0,
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        note: '',
      }
    },

    // 从历史记录中提取供应商选项
    updateSupplierOptions() {
      const defaultOptions = ['乐禾', '快驴', '超市']
      const fromHistory = this.priceHistoryData
        .map((item) => item.supplier)
        .filter((s) => s && !defaultOptions.includes(s))
      // 合并去重
      this.supplierOptions = [...new Set([...defaultOptions, ...fromHistory])]
    },

    async handleAddPrice() {
      // 显式检查 null/undefined，允许价格为 0
      if (
        this.newPriceForm.price === null ||
        this.newPriceForm.price === undefined ||
        this.newPriceForm.price === ''
      ) {
        ElMessage.warning('请输入价格')
        return
      }
      if (!this.newPriceForm.date) {
        ElMessage.warning('请选择日期')
        return
      }

      this.addingPrice = true
      try {
        await materialPricesApi.create({
          material: this.currentMaterial.id,
          price: this.newPriceForm.price,
          date: this.newPriceForm.date,
          supplier: this.newPriceForm.supplier,
          note: this.newPriceForm.note,
        })
        ElMessage.success('价格记录添加成功')
        this.showAddPriceForm = false
        this.resetNewPriceForm()
        await this.loadPriceHistory()
      } catch (error) {
        console.error('添加价格记录失败:', error)
        ElMessage.error('添加失败')
      } finally {
        this.addingPrice = false
      }
    },

    async handleDeletePrice(row) {
      try {
        await ElMessageBox.confirm('确定要删除这条价格记录吗？', '删除确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })

        await materialPricesApi.delete(row.id)
        ElMessage.success('删除成功')
        await this.loadPriceHistory()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除价格记录失败:', error)
          ElMessage.error('删除失败')
        }
      }
    },

    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

.history-btn {
  background-color: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #6366f1;
  min-width: 40px;
  padding: 8px 10px;
}

.history-btn:hover {
  background-color: rgba(99, 102, 241, 0.2);
  border-color: #6366f1;
  color: #4f46e5;
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
}

/* ================================
   价格历史弹窗样式
   ================================ */
.price-history-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.price-history-content {
  min-height: 300px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.section-title .el-button {
  margin-left: auto;
}

.chart-section {
  margin-bottom: 24px;
}

.chart-container {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 16px;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
}

.stat-value.current {
  color: #10b981;
}

.stat-value.high {
  color: #ef4444;
}

.stat-value.low {
  color: #3b82f6;
}

.stat-value.avg {
  color: #f59e0b;
}

.history-list-section {
  margin-top: 20px;
}

.add-price-form {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.add-price-form .form-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(16, 185, 129, 0.3);
  font-size: 15px;
  font-weight: 600;
  color: #059669;
}

.add-price-form .form-header .form-icon {
  font-size: 18px;
}

.add-price-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.add-price-form :deep(.el-form-item__label) {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  padding-bottom: 6px;
}

.add-price-form :deep(.el-input__wrapper),
.add-price-form :deep(.el-input-number) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.add-price-form :deep(.el-input-number .el-input__wrapper) {
  padding-left: 11px;
}

.add-price-form .form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px dashed rgba(16, 185, 129, 0.2);
}

.add-price-form .form-actions .el-button--primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
}

.add-price-form .form-actions .el-button--primary:hover {
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
}

.price-cell {
  color: #ef4444;
  font-weight: 600;
}

.note-cell {
  color: #64748b;
  font-size: 13px;
}

/* 价格历史弹窗响应式 */
@media (max-width: 768px) {
  .price-history-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-item {
    padding: 12px;
  }

  .stat-value {
    font-size: 16px;
  }

  .add-price-form {
    padding: 16px;
  }

  .add-price-form .form-header {
    font-size: 14px;
    margin-bottom: 14px;
    padding-bottom: 10px;
  }

  .add-price-form :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  .add-price-form .form-actions {
    justify-content: stretch;
  }

  .add-price-form .form-actions .el-button {
    flex: 1;
  }
}

@media (max-width: 576px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .stat-item {
    padding: 10px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-value {
    font-size: 14px;
  }

  .section-title {
    font-size: 14px;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chart-container {
    padding: 10px;
  }

  .add-price-form {
    padding: 14px;
  }

  .add-price-form .form-header {
    font-size: 13px;
    margin-bottom: 12px;
    padding-bottom: 8px;
  }

  .add-price-form :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  .add-price-form :deep(.el-form-item__label) {
    font-size: 12px;
    padding-bottom: 4px;
  }
}
</style>
