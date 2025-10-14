<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="24">
        <h1 style="margin-bottom: 30px; color: #303133">欢迎使用菜单购物车系统</h1>
      </el-col>
    </el-row>

    <!-- 数据统计卡片区域 -->
    <el-row :gutter="20" style="margin-bottom: 30px">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background-color: #409eff">
              <el-icon style="color: white; font-size: 24px"><Menu /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">--</div>
              <div class="stats-label">本月菜单数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background-color: #67c23a">
              <el-icon style="color: white; font-size: 24px"><ShoppingBag /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">--</div>
              <div class="stats-label">本月订购量</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background-color: #e6a23c">
              <el-icon style="color: white; font-size: 24px"><Coin /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">--</div>
              <div class="stats-label">本月开销</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background-color: #f56c6c">
              <el-icon style="color: white; font-size: 24px"><Document /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">--</div>
              <div class="stats-label">菜谱总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域占位 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <div slot="header">
            <span>本月订购趋势</span>
          </div>
          <div
            style="
              height: 300px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #909399;
            "
          >
            <div>
              <el-icon style="font-size: 48px; margin-bottom: 10px"><PieChart /></el-icon>
              <div>图表组件待添加</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <div slot="header">
            <span>热门菜品排行</span>
          </div>
          <div
            style="
              height: 300px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #909399;
            "
          >
            <div>
              <el-icon style="font-size: 48px; margin-bottom: 10px"><DataLine /></el-icon>
              <div>图表组件待添加</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { Menu, ShoppingBag, Coin, Document, PieChart, DataLine } from '@element-plus/icons-vue'

export default {
  name: 'Home',
  components: {
    Menu,
    ShoppingBag,
    Coin,
    Document,
    PieChart,
    DataLine,
  },
}
</script>

<style scoped>
.stats-card {
  margin-bottom: 20px;
}

.stats-content {
  display: flex;
  align-items: center;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}
</style>
