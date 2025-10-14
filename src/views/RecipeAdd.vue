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
      <h2 style="margin: 0; color: #303133">{{ getPageTitle() }}</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button v-if="!isViewMode" type="primary" @click="saveRecipe">保存菜谱</el-button>
        <el-button v-if="isViewMode" type="primary" @click="switchToEdit">编辑菜谱</el-button>
      </div>
    </div>

    <!-- 菜谱基本信息 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>菜谱信息</span>
      </template>
      <el-form :model="recipeForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="菜谱名称" required>
              <el-input
                v-model="recipeForm.name"
                placeholder="请输入菜谱名称"
                :disabled="isViewMode"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜品分类" required>
              <el-select
                v-model="recipeForm.category"
                placeholder="选择分类"
                style="width: 100%"
                :disabled="isViewMode"
              >
                <el-option label="荤菜" value="meat"></el-option>
                <el-option label="素菜" value="vegetable"></el-option>
                <el-option label="汤品" value="soup"></el-option>
                <el-option label="主食" value="staple"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="菜谱描述">
              <el-input
                v-model="recipeForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入菜谱描述（可选）"
                :disabled="isViewMode"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 原材料列表 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>原材料配方</span>
          <el-button v-if="!isViewMode" type="primary" size="small" @click="addIngredient">
            <el-icon><Plus /></el-icon>添加原料
          </el-button>
        </div>
      </template>

      <el-table :data="recipeForm.ingredients" style="width: 100%">
        <el-table-column type="index" label="序号" width="80" align="center"></el-table-column>
        <el-table-column label="原料名称" width="300">
          <template #default="scope">
            <el-autocomplete
              v-model="scope.row.name"
              :fetch-suggestions="searchIngredients"
              placeholder="搜索原料或输入新原料"
              style="width: 100%"
              @select="(item) => selectIngredient(scope.$index, item)"
              clearable
              :disabled="isViewMode"
            />
          </template>
        </el-table-column>
        <el-table-column label="用量" width="150">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.quantity"
              :min="0"
              :precision="2"
              placeholder="数量"
              style="width: 100%"
              :disabled="isViewMode"
            />
          </template>
        </el-table-column>
        <el-table-column label="单位" width="150">
          <template #default="scope">
            <el-select
              v-model="scope.row.unit"
              placeholder="单位"
              style="width: 100%"
              filterable
              :disabled="isViewMode"
            >
              <el-option
                v-for="unit in unitList"
                :key="unit.value"
                :label="unit.label"
                :value="unit.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="200">
          <template #default="scope">
            <el-input
              v-model="scope.row.remark"
              placeholder="备注（可选）"
              style="width: 100%"
              :disabled="isViewMode"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="scope">
            <el-button
              v-if="!isViewMode"
              type="danger"
              size="small"
              text
              @click="removeIngredient(scope.$index)"
            >
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { Plus, Delete, Picture } from '@element-plus/icons-vue'

export default {
  name: 'RecipeAdd',
  components: {
    Plus,
    Delete,
    Picture,
  },
  data() {
    return {
      isEdit: false,
      isViewMode: false,
      recipeId: null,
      recipeForm: {
        name: '',
        category: '',
        description: '',
        image: '',
        ingredients: [],
        steps: [],
      },
      // 模拟原料数据
      ingredientList: [
        { value: '番茄', name: '番茄', unit: '个' },
        { value: '鸡蛋', name: '鸡蛋', unit: '个' },
        { value: '五花肉', name: '五花肉', unit: '克' },
        { value: '冬瓜', name: '冬瓜', unit: '克' },
        { value: '排骨', name: '排骨', unit: '克' },
        { value: '生抽', name: '生抽', unit: '勺' },
        { value: '老抽', name: '老抽', unit: '勺' },
        { value: '盐', name: '盐', unit: '克' },
        { value: '糖', name: '糖', unit: '克' },
        { value: '料酒', name: '料酒', unit: '勺' },
        { value: '生姜', name: '生姜', unit: '片' },
        { value: '大蒜', name: '大蒜', unit: '瓣' },
        { value: '葱', name: '葱', unit: '根' },
      ],
      // 单位数据
      unitList: [
        { value: '克', label: '克' },
        { value: '斤', label: '斤' },
        { value: '公斤', label: '公斤' },
        { value: '千克', label: '千克' },
        { value: '两', label: '两' },
        { value: '个', label: '个' },
        { value: '只', label: '只' },
        { value: '根', label: '根' },
        { value: '片', label: '片' },
        { value: '块', label: '块' },
        { value: '颗', label: '颗' },
        { value: '粒', label: '粒' },
        { value: '瓣', label: '瓣' },
        { value: '毫升', label: '毫升' },
        { value: '升', label: '升' },
        { value: '勺', label: '勺' },
        { value: '汤匙', label: '汤匙' },
        { value: '茶匙', label: '茶匙' },
        { value: '杯', label: '杯' },
        { value: '碗', label: '碗' },
        { value: '盒', label: '盒' },
        { value: '包', label: '包' },
        { value: '袋', label: '袋' },
        { value: '瓶', label: '瓶' },
        { value: '罐', label: '罐' },
        { value: '份', label: '份' },
      ],
    }
  },
  mounted() {
    this.initPage()
  },
  methods: {
    initPage() {
      // 检查页面模式
      this.recipeId = this.$route.params.id
      const routeName = this.$route.name

      this.isEdit = routeName === 'RecipeEdit'
      this.isViewMode = routeName === 'RecipeView'

      if (this.isEdit || this.isViewMode) {
        this.loadRecipe()
      } else {
        // 新增模式，添加默认的原料和步骤
        this.addIngredient()
        this.addStep()
      }
    },

    loadRecipe() {
      // 模拟加载菜谱数据
      // 实际开发中这里应该调用API获取菜谱详情
      const mockRecipe = {
        id: this.recipeId,
        name: '番茄炒蛋',
        category: 'vegetable',
        description: '经典家常菜，营养丰富，制作简单',
        image: '',
        ingredients: [
          { name: '番茄', quantity: 2, unit: '个', remark: '选择成熟的' },
          { name: '鸡蛋', quantity: 3, unit: '个', remark: '' },
          { name: '盐', quantity: 3, unit: '克', remark: '' },
          { name: '糖', quantity: 5, unit: '克', remark: '提鲜用' },
        ],
        steps: [
          { description: '将番茄洗净，用开水烫一下，去皮切块', image: '' },
          { description: '鸡蛋打散，加少许盐调味', image: '' },
          { description: '热锅下油，倒入蛋液炒熟盛起', image: '' },
          { description: '锅中留底油，下番茄块炒出汁水', image: '' },
          { description: '加入炒蛋，调味炒匀即可', image: '' },
        ],
      }

      this.recipeForm = { ...mockRecipe }
    },

    addIngredient() {
      this.recipeForm.ingredients.push({
        name: '',
        quantity: null,
        unit: '',
        remark: '',
      })
    },

    removeIngredient(index) {
      this.recipeForm.ingredients.splice(index, 1)
    },

    addStep() {
      this.recipeForm.steps.push({
        description: '',
        image: '',
      })
    },

    removeStep(index) {
      this.recipeForm.steps.splice(index, 1)
    },

    searchIngredients(queryString, cb) {
      const results = queryString
        ? this.ingredientList.filter((ingredient) =>
            ingredient.name.toLowerCase().includes(queryString.toLowerCase()),
          )
        : this.ingredientList
      cb(results)
    },

    selectIngredient(index, ingredient) {
      this.recipeForm.ingredients[index].name = ingredient.name
      // 只有当前单位为空时才自动填入，否则保持用户选择的单位
      if (!this.recipeForm.ingredients[index].unit) {
        this.recipeForm.ingredients[index].unit = ingredient.unit
      }
    },

    beforeUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isImage) {
        this.$message.error('只能上传图片文件!')
        return false
      }
      if (!isLt2M) {
        this.$message.error('图片大小不能超过 2MB!')
        return false
      }
      return true
    },

    handleUpload(file) {
      // 模拟图片上传
      // 实际开发中这里应该调用文件上传API
      const reader = new FileReader()
      reader.onload = (e) => {
        this.recipeForm.image = e.target.result
      }
      reader.readAsDataURL(file.file)
    },

    handleStepImageUpload(file, stepIndex) {
      // 模拟步骤图片上传
      const reader = new FileReader()
      reader.onload = (e) => {
        this.recipeForm.steps[stepIndex].image = e.target.result
      }
      reader.readAsDataURL(file.file)
    },

    saveRecipe() {
      // 验证表单
      if (!this.recipeForm.name) {
        this.$message.error('请输入菜谱名称')
        return
      }

      if (!this.recipeForm.category) {
        this.$message.error('请选择菜品分类')
        return
      }

      if (this.recipeForm.ingredients.length === 0) {
        this.$message.error('请至少添加一个原料')
        return
      }

      // 验证原料信息
      for (let i = 0; i < this.recipeForm.ingredients.length; i++) {
        const ingredient = this.recipeForm.ingredients[i]
        if (!ingredient.name || !ingredient.quantity || !ingredient.unit) {
          this.$message.error(`第${i + 1}个原料信息不完整`)
          return
        }
      }

      if (this.recipeForm.steps.length === 0) {
        this.$message.error('请至少添加一个制作步骤')
        return
      }

      // 验证步骤信息
      for (let i = 0; i < this.recipeForm.steps.length; i++) {
        const step = this.recipeForm.steps[i]
        if (!step.description.trim()) {
          this.$message.error(`第${i + 1}个制作步骤描述不能为空`)
          return
        }
      }

      // 构造保存数据
      const recipeData = {
        ...this.recipeForm,
        id: this.isEdit ? this.recipeId : Date.now(), // 模拟ID生成
        creator: '当前用户', // 实际开发中从用户信息获取
        createTime: this.isEdit ? undefined : new Date().toLocaleString(),
        updateTime: new Date().toLocaleString(),
      }

      console.log('保存菜谱数据:', recipeData)
      this.$message.success(this.isEdit ? '菜谱更新成功！' : '菜谱保存成功！')

      // 这里应该调用后端API保存数据
      // 保存成功后返回列表页
      setTimeout(() => {
        this.goBack()
      }, 1500)
    },

    goBack() {
      this.$router.push('/recipes')
    },

    getPageTitle() {
      if (this.isViewMode) {
        return '查看菜谱'
      } else if (this.isEdit) {
        return '编辑菜谱'
      } else {
        return '新增菜谱'
      }
    },

    switchToEdit() {
      this.$router.push(`/recipes/edit/${this.recipeId}`)
    },
  },
}
</script>

<style scoped>
.el-form-item {
  margin-bottom: 20px;
}

.avatar-uploader .avatar {
  width: 100px;
  height: 100px;
  display: block;
  border-radius: 4px;
  object-fit: cover;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: 0.2s;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.step-image-uploader .el-upload {
  display: inline-block;
}

/* 表格内输入框样式 */
.el-table .el-input,
.el-table .el-input-number,
.el-table .el-select,
.el-table .el-autocomplete {
  border: none;
  box-shadow: none;
}

.el-table .el-input:focus,
.el-table .el-input-number:focus,
.el-table .el-select:focus,
.el-table .el-autocomplete:focus {
  border: 1px solid #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 表格行高调整 */
.el-table .el-table__row {
  height: auto;
}

.el-table .el-table__cell {
  padding: 12px 0;
  vertical-align: top;
}
</style>
