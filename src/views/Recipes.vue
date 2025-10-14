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
      <h2 style="margin: 0; color: #303133">菜谱管理</h2>
      <el-button type="primary" @click="goToAdd"
        ><el-icon><Plus /></el-icon>新增菜谱</el-button
      >
    </div>

    <!-- 搜索和筛选 -->
    <el-card style="margin-bottom: 20px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input placeholder="搜索菜谱名称" v-model="searchText" clearable>
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="6">
          <el-select v-model="categoryFilter" placeholder="菜品分类" style="width: 100%">
            <el-option label="全部分类" value=""></el-option>
            <el-option label="荤菜" value="meat"></el-option>
            <el-option label="素菜" value="vegetable"></el-option>
            <el-option label="汤品" value="soup"></el-option>
            <el-option label="主食" value="staple"></el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary">查询</el-button>
          <el-button>重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 菜谱列表 -->
    <el-card>
      <el-table :data="recipeList" style="width: 100%">
        <el-table-column prop="name" label="菜谱名称" width="200">
          <template #default="scope">
            <div style="display: flex; align-items: center">
              <img
                :src="scope.row.image || '/placeholder-dish.png'"
                style="
                  width: 40px;
                  height: 40px;
                  border-radius: 4px;
                  margin-right: 10px;
                  object-fit: cover;
                "
                @error="handleImageError"
              />
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" align="center">
          <template #default="scope">
            <el-tag size="small">{{ getCategoryText(scope.row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ingredients" label="主要原料" width="200">
          <template #default="scope">
            <span>{{ scope.row.ingredients.join(', ') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="100"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="150"></el-table-column>
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="scope">
            <el-button size="small" text @click="viewRecipe(scope.row)">查看</el-button>
            <el-button size="small" text @click="editRecipe(scope.row)">编辑</el-button>
            <el-button size="small" text style="color: #f56c6c" @click="deleteRecipe(scope.row)"
              >删除</el-button
            >
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
import { Plus, Search } from '@element-plus/icons-vue'

export default {
  name: 'Recipes',
  components: {
    Plus,
    Search,
  },
  data() {
    return {
      searchText: '',
      categoryFilter: '',
      currentPage: 1,
      pageSize: 10,
      total: 0,
      recipeList: [
        {
          id: 1,
          name: '番茄炒蛋',
          category: 'vegetable',
          ingredients: ['番茄', '鸡蛋'],
          creator: '张师傅',
          createTime: '2024-01-10 14:20',
          image: null,
        },
        {
          id: 2,
          name: '红烧肉',
          category: 'meat',
          ingredients: ['五花肉', '生抽', '老抽', '冰糖'],
          creator: '李师傅',
          createTime: '2024-01-12 11:30',
          image: null,
        },
        {
          id: 3,
          name: '冬瓜排骨汤',
          category: 'soup',
          ingredients: ['冬瓜', '排骨', '生姜'],
          creator: '王师傅',
          createTime: '2024-01-13 16:45',
          image: null,
        },
      ],
    }
  },
  methods: {
    getCategoryText(category) {
      const categoryMap = {
        meat: '荤菜',
        vegetable: '素菜',
        soup: '汤品',
        staple: '主食',
      }
      return categoryMap[category] || category
    },
    handleImageError(e) {
      e.target.style.display = 'none'
    },
    handleSizeChange(val) {
      this.pageSize = val
    },
    handleCurrentChange(val) {
      this.currentPage = val
    },
    goToAdd() {
      this.$router.push('/recipes/add')
    },
    viewRecipe(recipe) {
      this.$router.push(`/recipes/view/${recipe.id}`)
    },
    editRecipe(recipe) {
      this.$router.push(`/recipes/edit/${recipe.id}`)
    },
    deleteRecipe(recipe) {
      this.$confirm(`确定要删除菜谱「${recipe.name}」吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          // 这里应该调用后端API删除菜谱
          console.log('删除菜谱:', recipe.id)
          this.$message.success('删除成功')
          // 重新加载列表
          // this.loadRecipes()
        })
        .catch(() => {
          this.$message.info('已取消删除')
        })
    },
  },
}
</script>

<style scoped></style>
