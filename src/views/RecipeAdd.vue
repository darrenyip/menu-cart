<template>
  <div class="recipe-add-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" class="back-btn" text>
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h2 class="page-title">{{ pageTitle }}</h2>
      </div>
      <div class="header-actions">
        <el-button @click="goBack">
          <el-icon><Close /></el-icon>取消
        </el-button>
        <el-button v-if="!isViewMode" type="primary" @click="saveRecipe" :loading="saving">
          <el-icon><Check /></el-icon>保存菜谱
        </el-button>
        <el-button v-if="isViewMode" type="primary" @click="switchToEdit">
          <el-icon><Edit /></el-icon>编辑菜谱
        </el-button>
      </div>
    </div>

    <!-- 菜谱基本信息 -->
    <el-card class="info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="card-icon"><Document /></el-icon>
          <span>菜谱信息</span>
        </div>
      </template>
      <el-form :model="recipeForm" label-position="top">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="菜谱名称" required>
              <el-input
                v-model="recipeForm.name"
                placeholder="请输入菜谱名称"
                size="large"
                :disabled="isViewMode"
                clearable
              >
                <template #prefix>
                  <el-icon><Dish /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜品分类">
              <el-select
                v-model="recipeForm.category"
                placeholder="选择分类（可选）"
                style="width: 100%"
                size="large"
                :disabled="isViewMode"
                clearable
              >
                <el-option
                  v-for="cat in dishCategories"
                  :key="cat"
                  :label="cat"
                  :value="cat"
                >
                  <span :style="{ color: getCategoryColor(cat) }">{{ getCategoryIcon(cat) }}</span> {{ cat }}
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
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
    <el-card class="ingredients-card" shadow="hover" v-loading="loadingData">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon class="card-icon"><ShoppingBag /></el-icon>
            <span>原材料配方</span>
            <el-tag type="info" size="small" style="margin-left: 8px">
              {{ recipeForm.ingredients.length }} 种原料
            </el-tag>
          </div>
          <el-button v-if="!isViewMode" type="primary" @click="addIngredient">
            <el-icon><Plus /></el-icon>添加原料
          </el-button>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-if="recipeForm.ingredients.length === 0" class="empty-state">
        <el-empty description="暂无原料，点击上方按钮添加">
          <el-button v-if="!isViewMode" type="primary" @click="addIngredient">
            <el-icon><Plus /></el-icon>添加第一项原料
          </el-button>
        </el-empty>
      </div>

      <!-- 原料列表 -->
      <div v-else class="ingredients-list">
        <div
          v-for="(ingredient, index) in recipeForm.ingredients"
          :key="index"
          class="ingredient-row"
        >
          <div class="ingredient-index">
            <span class="index-badge">{{ index + 1 }}</span>
          </div>
          <div class="ingredient-name">
            <el-autocomplete
              v-model="ingredient.name"
              :fetch-suggestions="searchIngredients"
              placeholder="搜索原料或输入新原料"
              @select="(item) => selectIngredient(index, item)"
              :disabled="isViewMode"
              clearable
              size="default"
            />
          </div>
          <div class="ingredient-quantity">
            <el-input-number
              v-model="ingredient.quantity"
              :min="0"
              :precision="2"
              placeholder="数量"
              controls-position="right"
              :disabled="isViewMode"
              size="default"
            />
          </div>
          <div class="ingredient-unit">
            <el-select
              v-model="ingredient.unit"
              placeholder="单位"
              filterable
              :disabled="isViewMode"
              size="default"
            >
              <el-option-group
                v-for="group in groupedUnits"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="unit in group.options"
                  :key="unit.value"
                  :label="unit.label"
                  :value="unit.value"
                />
              </el-option-group>
            </el-select>
          </div>
          <div class="ingredient-remark">
            <el-input
              v-model="ingredient.remark"
              placeholder="备注（可选）"
              :disabled="isViewMode"
              size="default"
            />
          </div>
          <div class="ingredient-actions">
            <el-button
              v-if="!isViewMode"
              type="danger"
              text
              size="small"
              @click="removeIngredient(index)"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import {
  Plus,
  ArrowLeft,
  Close,
  Check,
  Document,
  Dish,
  ShoppingBag,
  Edit,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import recipesApi from '@/api/recipes'
import materialsApi from '@/api/materials'
import { DISH_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '@/constants/dishCategories'

export default {
  name: 'RecipeAdd',
  components: {
    Plus,
    ArrowLeft,
    Close,
    Check,
    Document,
    Dish,
    ShoppingBag,
    Edit,
  },
  data() {
    return {
      saving: false,
      loadingData: false,
      recipeId: null,
      // 菜品分类（引用统一配置）
      dishCategories: DISH_CATEGORIES,
      recipeForm: {
        name: '',
        category: '',
        description: '',
        ingredients: [],
      },
      // 从后端加载的原料列表
      ingredientList: [],
      // 分组单位数据
      groupedUnits: [
        {
          label: '重量',
          options: [
            { value: '克', label: '克' },
            { value: '千克', label: '千克' },
            { value: '公斤', label: '公斤' },
            { value: '斤', label: '斤' },
            { value: '两', label: '两' },
          ],
        },
        {
          label: '数量',
          options: [
            { value: '个', label: '个' },
            { value: '只', label: '只' },
            { value: '根', label: '根' },
            { value: '片', label: '片' },
            { value: '块', label: '块' },
            { value: '颗', label: '颗' },
            { value: '粒', label: '粒' },
            { value: '瓣', label: '瓣' },
          ],
        },
        {
          label: '容量',
          options: [
            { value: '毫升', label: '毫升' },
            { value: '升', label: '升' },
            { value: '勺', label: '勺' },
            { value: '汤匙', label: '汤匙' },
            { value: '茶匙', label: '茶匙' },
            { value: '杯', label: '杯' },
            { value: '碗', label: '碗' },
          ],
        },
        {
          label: '包装',
          options: [
            { value: '盒', label: '盒' },
            { value: '包', label: '包' },
            { value: '袋', label: '袋' },
            { value: '瓶', label: '瓶' },
            { value: '罐', label: '罐' },
            { value: '份', label: '份' },
          ],
        },
      ],
    }
  },
  computed: {
    isEdit() {
      return this.$route.name === 'RecipeEdit'
    },
    isViewMode() {
      return this.$route.name === 'RecipeView'
    },
    pageTitle() {
      if (this.isViewMode) {
        return '查看菜谱'
      } else if (this.isEdit) {
        return '编辑菜谱'
      } else {
        return '新增菜谱'
      }
    },
  },
  mounted() {
    this.loadIngredients()
    this.initPage()
  },
  methods: {
    // 获取分类图标（使用统一配置）
    getCategoryIcon(category) {
      return CATEGORY_ICONS[category] || ''
    },
    // 获取分类颜色（使用统一配置）
    getCategoryColor(category) {
      return CATEGORY_COLORS[category] || '#6b7280'
    },
    // 兼容旧的英文分类值转换为新的中文值
    convertOldCategory(category) {
      if (!category) return ''
      const oldToNew = {
        'meat': '荤菜',
        'vegetable': '素菜',
        'soup': '炖汤',
        'staple': '主食',
      }
      return oldToNew[category] || category
    },
    // 加载原料列表
    async loadIngredients() {
      try {
        const materials = await materialsApi.getAll()
        this.ingredientList = materials.map((m) => ({
          value: m.name,
          id: m.id,
          name: m.name,
          unit: m.base_unit || m.unit || '克',
        }))
      } catch (error) {
        console.error('加载原料数据失败:', error)
      }
    },

    // 初始化页面
    initPage() {
      this.recipeId = this.$route.params.id

      if (this.isEdit || this.isViewMode) {
        this.loadRecipe()
      } else {
        // 新增模式，添加一个空的原料行
        this.addIngredient()
      }
    },

    // 加载菜谱数据
    async loadRecipe() {
      this.loadingData = true
      try {
        const recipe = await recipesApi.getOne(this.recipeId)
        
        this.recipeForm.name = recipe.name
        // 兼容旧的英文分类值
        this.recipeForm.category = this.convertOldCategory(recipe.category) || ''
        this.recipeForm.description = recipe.description || ''
        
        // 加载原料
        if (recipe.materials && recipe.materials.length > 0) {
          this.recipeForm.ingredients = recipe.materials.map((m) => ({
            name: m.name,
            materialId: m.material || null,
            quantity: m.quantity,
            unit: m.unit || '',
            remark: m.remark || '',
          }))
        } else {
          this.addIngredient()
        }
      } catch (error) {
        console.error('加载菜谱数据失败:', error)
        ElMessage.error('加载菜谱数据失败')
        this.goBack()
      } finally {
        this.loadingData = false
      }
    },

    // 添加原料
    addIngredient() {
      this.recipeForm.ingredients.push({
        name: '',
        materialId: null,
        quantity: null,
        unit: '',
        remark: '',
      })
    },

    // 删除原料
    removeIngredient(index) {
      if (this.recipeForm.ingredients.length === 1) {
        ElMessage.warning('至少保留一项原料')
        return
      }
      this.recipeForm.ingredients.splice(index, 1)
    },

    // 搜索原料
    searchIngredients(queryString, cb) {
      const results = queryString
        ? this.ingredientList.filter((ingredient) =>
            ingredient.name.toLowerCase().includes(queryString.toLowerCase())
          )
        : this.ingredientList
      cb(results)
    },

    // 选择原料
    selectIngredient(index, ingredient) {
      this.recipeForm.ingredients[index].name = ingredient.name
      this.recipeForm.ingredients[index].materialId = ingredient.id
      if (!this.recipeForm.ingredients[index].unit) {
        this.recipeForm.ingredients[index].unit = ingredient.unit || '克'
      }
    },

    // 保存菜谱
    async saveRecipe() {
      // 验证菜谱名称
      if (!this.recipeForm.name?.trim()) {
        ElMessage.error('请输入菜谱名称')
        return
      }

      // 验证原料
      const validIngredients = this.recipeForm.ingredients.filter(
        (ing) => ing.name?.trim() && ing.quantity > 0
      )

      if (validIngredients.length === 0) {
        ElMessage.error('请至少添加一项有效的原料')
        return
      }

      this.saving = true

      try {
        // 处理原料数据 - 确保新原料被创建到原料库
        const materials = []
        
        for (const ing of validIngredients) {
          let materialId = ing.materialId

          // 如果没有 materialId，说明是新输入的原料，需要创建
          if (!materialId && ing.name?.trim()) {
            try {
              const newMaterial = await materialsApi.create({
                name: ing.name,
                base_unit: ing.unit || '克',
                purchase_unit: '斤',
                purchase_price: 0,
                conversion_rate: 500,
                unit: ing.unit || '克',
                price: 0,
              })
              materialId = newMaterial.id

              // 更新本地原料列表
              this.ingredientList.push({
                value: newMaterial.name,
                id: newMaterial.id,
                name: newMaterial.name,
                unit: newMaterial.base_unit || '克',
              })
            } catch (error) {
              console.error('创建原料失败:', ing.name, error)
            }
          }

          materials.push({
            name: ing.name,
            materialId: materialId || null,
            quantity: ing.quantity,
            unit: ing.unit || '',
            remark: ing.remark || '',
          })
        }

        // 准备菜谱数据
        const recipeData = {
          name: this.recipeForm.name,
          category: this.recipeForm.category || '',
          description: this.recipeForm.description || '',
        }

        if (this.isEdit) {
          await recipesApi.update(this.recipeId, recipeData, materials)
          ElMessage.success('菜谱更新成功！')
        } else {
          await recipesApi.create(recipeData, materials)
          ElMessage.success('菜谱保存成功！')
        }

        setTimeout(() => {
          this.goBack()
        }, 800)
      } catch (error) {
        console.error('保存菜谱失败:', error)
        ElMessage.error('保存失败，请重试')
      } finally {
        this.saving = false
      }
    },

    // 返回列表
    goBack() {
      this.$router.push('/recipes')
    },

    // 切换到编辑模式
    switchToEdit() {
      this.$router.push(`/recipes/edit/${this.recipeId}`)
    },
  },
}
</script>

<style scoped>
.recipe-add-page {
  padding: 0;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(16, 185, 129, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  font-size: 20px;
  padding: 8px;
  border-radius: 8px;
  color: #64748b;
}

.back-btn:hover {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions .el-button {
  border-radius: 8px;
}

.header-actions .el-button--primary {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.header-actions .el-button--primary:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* 卡片样式 */
.info-card,
.ingredients-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.info-card :deep(.el-card__header) {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.ingredients-card :deep(.el-card__header) {
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%);
  border-bottom: 1px solid rgba(16, 185, 129, 0.15);
}

.info-card :deep(.el-card__body),
.ingredients-card :deep(.el-card__body) {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
}

.card-icon {
  font-size: 18px;
  color: #10b981;
  margin-right: 8px;
}

.card-header span {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

/* 表单样式 */
.info-card :deep(.el-form-item__label) {
  font-weight: 500;
  color: #4b5563;
}

/* 空状态 */
.empty-state {
  padding: 40px 0;
}

.empty-state .el-button--primary {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  border: none;
}

/* 原料列表 */
.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ingredient-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(248, 250, 252, 1) 100%);
  border-radius: 10px;
  border: 1px solid rgba(16, 185, 129, 0.1);
  transition: all 0.2s ease;
}

.ingredient-row:hover {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(241, 245, 249, 1) 100%);
  border-color: rgba(16, 185, 129, 0.2);
}

.index-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  color: #fff;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
}

.ingredient-index {
  flex: 0 0 28px;
}

.ingredient-name {
  flex: 1 1 200px;
  min-width: 150px;
}

.ingredient-quantity {
  flex: 0 0 100px;
}

.ingredient-unit {
  flex: 0 0 90px;
}

.ingredient-remark {
  flex: 1 1 150px;
  min-width: 100px;
}

.ingredient-actions {
  flex: 0 0 32px;
}

/* 按钮样式 */
.ingredients-card .card-header .el-button--primary {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}

.ingredients-card .card-header .el-button--primary:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

/* 响应式 */
@media (max-width: 992px) {
  .ingredient-row {
    flex-wrap: wrap;
    gap: 10px;
  }

  .ingredient-index {
    order: 0;
  }

  .ingredient-actions {
    order: 0;
    margin-left: auto;
  }

  .ingredient-name {
    width: calc(100% - 80px);
    flex: none;
    order: 1;
  }

  .ingredient-quantity {
    flex: none;
    width: 110px;
    order: 2;
  }

  .ingredient-unit {
    flex: none;
    width: 100px;
    order: 3;
  }

  .ingredient-remark {
    flex: 1;
    min-width: 120px;
    order: 4;
  }
}

@media (max-width: 576px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .ingredient-row {
    padding: 12px;
    gap: 8px;
  }

  .ingredient-index {
    order: 0;
  }

  .ingredient-actions {
    order: 0;
    margin-left: auto;
  }

  .ingredient-name {
    width: 100%;
    flex: none;
    order: 1;
    margin-top: 4px;
  }

  .ingredient-quantity {
    flex: 1;
    min-width: 0;
    order: 2;
  }

  .ingredient-unit {
    flex: 1;
    min-width: 0;
    order: 3;
  }

  .ingredient-remark {
    width: 100%;
    flex: none;
    order: 4;
  }

  .index-badge {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }
}
</style>
