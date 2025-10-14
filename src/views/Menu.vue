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
      <h2 style="margin: 0; color: #303133">菜单管理</h2>
      <el-button type="primary" @click="goToAdd"
        ><el-icon><Plus /></el-icon>新增菜单</el-button
      >
    </div>

    <!-- 搜索和筛选 -->
    <el-card style="margin-bottom: 20px">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input placeholder="搜索菜单名称" v-model="searchText" clearable>
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="8">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-col>
        <el-col :span="8">
          <el-button type="primary">查询</el-button>
          <el-button>重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 菜单列表 -->
    <el-card>
      <el-table :data="menuList" style="width: 100%">
        <el-table-column prop="date" label="日期" width="120"></el-table-column>
        <el-table-column
          prop="dishCount"
          label="菜品数量"
          width="100"
          align="center"
        ></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="150"></el-table-column>
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="scope">
            <el-button size="small" text>查看</el-button>
            <el-button size="small" text>编辑</el-button>
            <el-button size="small" text>复制</el-button>
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
import { Plus, Search } from '@element-plus/icons-vue'

export default {
  name: 'Menu',
  components: {
    Plus,
    Search,
  },
  data() {
    return {
      searchText: '',
      dateRange: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      menuList: [
        {
          id: 1,
          name: '周一菜单',
          date: '2024-01-15',
          dishCount: 8,
          status: 'published',
          creator: '张师傅',
          createTime: '2024-01-14 10:30',
        },
        {
          id: 2,
          name: '周二菜单',
          date: '2024-01-16',
          dishCount: 10,
          status: 'draft',
          creator: '李师傅',
          createTime: '2024-01-15 09:15',
        },
      ],
    }
  },
  methods: {
    goToAdd() {
      this.$router.push('/menu/add')
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
