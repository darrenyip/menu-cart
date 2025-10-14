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
        <el-button type="success"
          ><el-icon><Download /></el-icon>导出原料清单</el-button
        >
        <el-button type="primary"
          ><el-icon><Plus /></el-icon>新增原料</el-button
        >
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card style="margin-bottom: 20px">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input placeholder="搜索原料名称" v-model="searchText" clearable>
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="8">
          <el-select v-model="categoryFilter" placeholder="原料分类" style="width: 100%">
            <el-option label="全部分类" value=""></el-option>
            <el-option label="蔬菜类" value="vegetables"></el-option>
            <el-option label="肉类" value="meat"></el-option>
            <el-option label="海鲜类" value="seafood"></el-option>
            <el-option label="豆制品" value="tofu"></el-option>
            <el-option label="调料" value="seasoning"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-button type="primary">查询</el-button>
          <el-button>重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 原料列表 -->
    <el-card>
      <el-table :data="ingredientList" style="width: 100%">
        <el-table-column prop="name" label="原料名称" width="150"></el-table-column>
        <el-table-column prop="category" label="分类" width="120" align="center">
          <template #default="scope">
            <el-tag size="small" :type="getCategoryTagType(scope.row.category)">
              {{ getCategoryText(scope.row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="80" align="center"></el-table-column>
        <el-table-column prop="avgPrice" label="平均价格" width="120" align="center">
          <template #default="scope">
            <span>¥{{ scope.row.avgPrice }}/{{ scope.row.unit }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastPurchase" label="最后采购" width="120"></el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <el-button size="small" text>查看</el-button>
            <el-button size="small" text>编辑</el-button>
            <el-button size="small" text>采购</el-button>
            <el-button size="small" text style="color: #f56c6c">删除</el-button>
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
  </div>
</template>

<script>
import { Plus, Search, Download } from '@element-plus/icons-vue'

export default {
  name: 'Ingredients',
  components: {
    Plus,
    Search,
    Download,
  },
  data() {
    return {
      searchText: '',
      categoryFilter: '',
      currentPage: 1,
      pageSize: 10,
      total: 0,
      ingredientList: [
        {
          id: 1,
          name: '番茄',
          category: 'vegetables',
          unit: '斤',
          avgPrice: 3.5,
          lastPurchase: '2024-01-15',
        },
        {
          id: 2,
          name: '鸡蛋',
          category: 'other',
          unit: '个',
          avgPrice: 0.8,
          lastPurchase: '2024-01-14',
        },
        {
          id: 3,
          name: '五花肉',
          category: 'meat',
          unit: '斤',
          avgPrice: 28,
          lastPurchase: '2024-01-10',
        },
        {
          id: 4,
          name: '冬瓜',
          category: 'vegetables',
          unit: '斤',
          avgPrice: 2.2,
          lastPurchase: '2024-01-15',
        },
        {
          id: 5,
          name: '排骨',
          category: 'meat',
          unit: '斤',
          avgPrice: 35,
          lastPurchase: '2024-01-14',
        },
      ],
    }
  },
  methods: {
    getCategoryText(category) {
      const categoryMap = {
        vegetables: '蔬菜类',
        meat: '肉类',
        seafood: '海鲜类',
        tofu: '豆制品',
        seasoning: '调料',
        other: '其他',
      }
      return categoryMap[category] || category
    },
    getCategoryTagType(category) {
      const typeMap = {
        vegetables: 'success',
        meat: 'danger',
        seafood: 'primary',
        tofu: 'warning',
        seasoning: 'info',
        other: '',
      }
      return typeMap[category] || ''
    },
    handleSizeChange(val) {
      this.pageSize = val
    },
    handleCurrentChange(val) {
      this.currentPage = val
    },
  },
}
</script>

<style scoped></style>
