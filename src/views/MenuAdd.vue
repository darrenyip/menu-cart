<template>
  <div class="menu-add-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" class="back-btn" text>
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h2 class="page-title">{{ isEdit ? '编辑菜单' : '新增菜单' }}</h2>
      </div>
      <div class="header-actions">
        <el-button @click="goBack">
          <el-icon><Close /></el-icon>取消
        </el-button>
        <el-button type="primary" @click="saveMenu" :loading="saving">
          <el-icon><Check /></el-icon>保存菜单
        </el-button>
      </div>
    </div>

    <!-- 菜单基本信息 -->
    <el-card class="info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon class="card-icon"><Document /></el-icon>
            <span>菜单信息</span>
            <el-tag v-if="dishNames.length > 0" type="success" size="small" style="margin-left: 8px">
              {{ dishNames.length }} 道菜
            </el-tag>
          </div>
        </div>
      </template>
      <el-form :model="menuForm" label-position="top">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="菜单名称" required>
              <el-input
                v-model="menuForm.name"
                placeholder="输入菜单名称"
                size="large"
                clearable
              >
                <template #prefix>
                  <el-icon><Edit /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单日期" required>
              <el-date-picker
                v-model="menuForm.date"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                size="large"
                value-format="YYYY-MM-DD"
                @change="onDateChange"
                :shortcuts="dateShortcuts"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 菜品名称快览（按分类显示） -->
        <div v-if="dishNames.length > 0" class="dish-names-preview">
          <div class="dish-names-label">
            <el-icon><Dish /></el-icon>
            <span>今日菜品</span>
          </div>
          <div class="dish-names-grouped">
            <div 
              v-for="(group, category) in groupedDishes" 
              :key="category"
              class="dish-category-group"
            >
              <span class="category-label">{{ category }}</span>
              <el-tag 
                v-for="(dish, index) in group" 
                :key="index"
                class="dish-name-tag"
                :type="getCategoryTagType(category)"
                effect="plain"
              >
                {{ dish.name }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-form>
    </el-card>

    <!-- 菜品列表 -->
    <el-card class="dishes-card" shadow="hover" v-loading="loadingData">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon class="card-icon"><Dish /></el-icon>
            <span>菜品列表</span>
            <el-tag type="info" size="small" style="margin-left: 8px">
              {{ dishList.length }} 道菜
            </el-tag>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-if="dishList.length === 0" class="empty-state">
        <el-empty description="暂无菜品，点击上方按钮添加">
          <el-button type="primary" @click="addDish">
            <el-icon><Plus /></el-icon>添加第一道菜
          </el-button>
        </el-empty>
      </div>

      <!-- 菜品卡片列表 -->
      <div v-else class="dish-list">
        <div v-for="(dish, dishIndex) in dishList" :key="dishIndex" class="dish-item">
          <div class="dish-header">
            <div class="dish-index">
              <span class="index-badge">{{ dishIndex + 1 }}</span>
            </div>
            <div class="dish-category">
              <el-select
                v-model="dish.category"
                placeholder="分类"
                size="default"
                style="width: 90px"
                clearable
              >
                <el-option
                  v-for="cat in dishCategories"
                  :key="cat"
                  :label="cat"
                  :value="cat"
                />
              </el-select>
            </div>
            <div class="dish-main">
              <el-autocomplete
                v-model="dish.name"
                :fetch-suggestions="searchRecipes"
                placeholder="搜索菜谱或输入菜品名称"
                class="dish-name-input"
                @select="(item) => selectRecipe(dishIndex, item)"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-autocomplete>
            </div>
            <div class="dish-portions">
              <span class="portions-label">份数</span>
              <el-input-number
                v-model="dish.portions"
                :min="1"
                :max="999"
                size="default"
                controls-position="right"
              />
            </div>
            <div class="dish-actions">
              <el-button type="danger" text @click="removeDish(dishIndex)">
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </div>
          </div>

          <!-- 原材料区域 -->
          <div class="ingredients-section">
            <div class="ingredients-header">
              <span class="ingredients-title">
                <el-icon><ShoppingBag /></el-icon>
                原材料清单
              </span>
              <el-button type="primary" text size="small" @click="addIngredient(dishIndex)">
                <el-icon><Plus /></el-icon>添加原料
              </el-button>
            </div>

            <div v-if="dish.ingredients.length === 0" class="no-ingredients">
              <span>暂无原料，请添加原料</span>
            </div>

            <div v-else class="ingredients-list">
              <div
                v-for="(ingredient, ingredientIndex) in dish.ingredients"
                :key="ingredientIndex"
                class="ingredient-row"
              >
                <div class="ingredient-name">
                  <el-autocomplete
                    v-model="ingredient.name"
                    :fetch-suggestions="searchIngredients"
                    placeholder="原料名称"
                    @select="(item) => selectIngredient(dishIndex, ingredientIndex, item)"
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
                    size="default"
                  />
                </div>
                <div class="ingredient-unit">
                  <el-select v-model="ingredient.unit" placeholder="单位" filterable size="default">
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
                <div class="ingredient-actions">
                  <el-button
                    type="danger"
                    text
                    size="small"
                    @click="removeIngredient(dishIndex, ingredientIndex)"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部添加菜品按钮 -->
        <div class="add-dish-bottom" @click="addDish">
          <el-icon><Plus /></el-icon>
          <span>添加菜品</span>
        </div>
      </div>
    </el-card>

    <!-- 悬浮添加按钮 -->
    <div class="fab-container" v-show="dishList.length > 0">
      <el-tooltip content="添加菜品" placement="left">
        <el-button type="primary" circle class="fab-btn" @click="addDish">
          <el-icon :size="24"><Plus /></el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <!-- 其他原料采购 -->
    <el-card class="extra-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon class="card-icon extra-icon"><ShoppingCart /></el-icon>
            <span>其他原料采购</span>
            <el-tag type="warning" size="small" style="margin-left: 8px">
              {{ extraPurchases.length }} 项
            </el-tag>
          </div>
        </div>
      </template>

      <div class="extra-list">
        <div
          v-for="(item, index) in extraPurchases"
          :key="index"
          class="extra-row"
        >
          <div class="extra-name">
            <el-autocomplete
              v-model="item.name"
              :fetch-suggestions="searchIngredients"
              placeholder="原料名称"
              @select="(selected) => selectExtraIngredient(index, selected)"
              clearable
              size="default"
            />
          </div>
          <div class="extra-quantity">
            <el-input-number
              v-model="item.quantity"
              :min="0"
              :precision="2"
              placeholder="数量"
              controls-position="right"
              size="default"
            />
          </div>
          <div class="extra-unit">
            <el-select v-model="item.unit" placeholder="单位" filterable allow-create size="default">
              <el-option-group label="采购单位">
                <el-option label="斤" value="斤" />
                <el-option label="公斤" value="公斤" />
                <el-option label="个" value="个" />
                <el-option label="瓶" value="瓶" />
                <el-option label="袋" value="袋" />
                <el-option label="包" value="包" />
                <el-option label="盒" value="盒" />
              </el-option-group>
              <el-option-group label="重量单位">
                <el-option label="克" value="克" />
                <el-option label="千克" value="千克" />
              </el-option-group>
            </el-select>
          </div>
          <div class="extra-remark">
            <el-input v-model="item.remark" placeholder="备注（可选）" size="default" />
          </div>
          <div class="extra-actions">
            <el-button type="danger" text size="small" @click="removeExtraPurchase(index)">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 底部添加采购项按钮 -->
        <div class="add-extra-bottom" @click="addExtraPurchase">
          <el-icon><Plus /></el-icon>
          <span>添加采购项</span>
        </div>
      </div>
    </el-card>

    <!-- 原料汇总 -->
    <el-card v-if="ingredientSummary.length > 0 || extraPurchases.length > 0" class="summary-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon class="card-icon"><DataAnalysis /></el-icon>
            <span>原料汇总</span>
            <el-tag type="success" size="small" style="margin-left: 8px">
              {{ ingredientSummary.length }} 种原料
            </el-tag>
          </div>
          <div class="summary-actions">
            <el-button type="primary" @click="copyToClipboard">
              <el-icon><CopyDocument /></el-icon>复制清单
            </el-button>
            <el-button type="success" @click="exportToExcel">
              <el-icon><Download /></el-icon>导出Excel
            </el-button>
          </div>
        </div>
      </template>

      <div class="summary-grid">
        <div 
          v-for="item in ingredientSummary" 
          :key="item.isExtra ? `${item.name}_${item.displayUnit}` : item.name" 
          class="summary-item"
          :class="{ 'is-extra': item.isExtra }"
        >
          <div class="summary-item-header">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-quantity">{{ item.displayQuantity }} {{ item.displayUnit }}</span>
          </div>
          <div class="summary-item-dishes">
            <span 
              v-for="dish in item.dishes" 
              :key="dish.name + dish.portions"
              class="dish-source"
            >
              {{ dish.name }} <span class="dish-detail">×{{ dish.portions }}份 ({{ dish.displayQuantity }}{{ dish.displayUnit }})</span>
            </span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import {
  Plus,
  Delete,
  CopyDocument,
  ArrowLeft,
  Close,
  Check,
  Document,
  Edit,
  Dish,
  Search,
  ShoppingBag,
  ShoppingCart,
  DataAnalysis,
  Download,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { DISH_CATEGORIES, getCategoryTagType } from '@/constants/dishCategories'
import { loadXLSX } from '@/utils/xlsx'
import menusApi from '@/api/menus'
import recipesApi from '@/api/recipes'
import materialsApi from '@/api/materials'

export default {
  name: 'MenuAdd',
  components: {
    Plus,
    Delete,
    CopyDocument,
    ArrowLeft,
    Close,
    Check,
    Document,
    Edit,
    Dish,
    Search,
    ShoppingBag,
    ShoppingCart,
    DataAnalysis,
    Download,
  },
  data() {
    return {
      saving: false,
      loadingData: false,
      menuId: null,
      menuForm: {
        name: '',
        date: null,
      },
      dishList: [],
      // 其他原料采购
      extraPurchases: [],
      // 从后端加载的数据
      recipeList: [],
      ingredientList: [],
      // 日期快捷选项
      dateShortcuts: [
        {
          text: '今天',
          value: new Date(),
        },
        {
          text: '明天',
          value: () => {
            const date = new Date()
            date.setTime(date.getTime() + 3600 * 1000 * 24)
            return date
          },
        },
        {
          text: '后天',
          value: () => {
            const date = new Date()
            date.setTime(date.getTime() + 3600 * 1000 * 24 * 2)
            return date
          },
        },
        {
          text: '下周一',
          value: () => {
            const date = new Date()
            const day = date.getDay()
            const diff = day === 0 ? 1 : 8 - day
            date.setTime(date.getTime() + 3600 * 1000 * 24 * diff)
            return date
          },
        },
      ],
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
      // 菜品分类（引用统一配置）
      dishCategories: DISH_CATEGORIES,
    }
  },
  computed: {
    isEdit() {
      return !!this.$route.params.id
    },
    // 获取已填写的菜品名称列表
    dishNames() {
      return this.dishList
        .filter(dish => dish.name && dish.name.trim())
        .map(dish => dish.name.trim())
    },
    // 按分类分组的菜品
    groupedDishes() {
      const groups = {}
      this.dishList
        .filter(dish => dish.name && dish.name.trim())
        .forEach(dish => {
          const category = dish.category || '未分类'
          if (!groups[category]) {
            groups[category] = []
          }
          groups[category].push({
            name: dish.name.trim(),
            portions: dish.portions,
          })
        })
      
      // 按照 dishCategories 的顺序排列，未分类放最后
      const orderedGroups = {}
      this.dishCategories.forEach(cat => {
        if (groups[cat]) {
          orderedGroups[cat] = groups[cat]
        }
      })
      if (groups['未分类']) {
        orderedGroups['未分类'] = groups['未分类']
      }
      return orderedGroups
    },
    ingredientSummary() {
      const summary = {}

      // 处理菜品原料
      this.dishList.forEach((dish) => {
        const portions = dish.portions || 1

        dish.ingredients.forEach((ingredient) => {
          if (!ingredient.name || !ingredient.quantity) return

          const key = ingredient.name
          if (!summary[key]) {
            summary[key] = {
              name: ingredient.name,
              originalUnit: ingredient.unit || '份',
              totalQuantity: 0,
              dishes: [],
              isExtra: false,
            }
          }

          const actualQuantity = ingredient.quantity * portions
          summary[key].totalQuantity += actualQuantity
          summary[key].dishes.push({
            name: dish.name,
            quantity: actualQuantity,
            unit: ingredient.unit || '份',
            portions: portions,
          })
        })
      })

      // 处理其他原料采购（与菜品原料合并）
      this.extraPurchases.forEach((item) => {
        if (!item.name || !item.quantity) return

        const key = item.name
        
        // 如果已经存在该原料（来自菜品），则合并
        if (summary[key]) {
          // 将其他采购的数量转换为与已有原料相同的单位后合并
          // 先转换为克，再加到总量中
          const existingUnit = summary[key].originalUnit
          const itemUnit = item.unit || '份'
          
          // 如果单位相同，直接加
          if (existingUnit === itemUnit) {
            summary[key].totalQuantity += item.quantity
          } else {
            // 单位不同，尝试转换（将采购单位转为已有单位）
            const convertedQuantity = this.convertUnits(item.quantity, itemUnit, existingUnit)
            summary[key].totalQuantity += convertedQuantity
          }
          
          summary[key].dishes.push({
            name: '其他采购' + (item.remark ? `(${item.remark})` : ''),
            quantity: item.quantity,
            unit: itemUnit,
            portions: 1,
          })
        } else {
          // 不存在该原料，新建条目
          summary[key] = {
            name: item.name,
            originalUnit: item.unit || '份',
            totalQuantity: item.quantity,
            dishes: [{
              name: '其他采购' + (item.remark ? `(${item.remark})` : ''),
              quantity: item.quantity,
              unit: item.unit || '份',
              portions: 1,
            }],
            isExtra: true,
          }
        }
      })

      return Object.values(summary).map((item) => {
        const converted = this.convertToJin(item.totalQuantity, item.originalUnit)
        return {
          ...item,
          displayQuantity: converted.quantity,
          displayUnit: converted.unit,
          dishes: item.dishes.map((dish) => {
            const dishConverted = this.convertToJin(dish.quantity, dish.unit)
            return {
              ...dish,
              displayQuantity: dishConverted.quantity,
              displayUnit: dishConverted.unit,
            }
          }),
        }
      })
    },
  },
  mounted() {
    this.loadData()
    if (this.isEdit) {
      this.menuId = this.$route.params.id
      this.loadMenuData()
    } else {
      this.generateDefaultMenuName()
      this.addDish()
    }
  },
  methods: {
    // 获取分类对应的标签颜色（使用统一配置）
    getCategoryTagType,
    // 加载菜谱和原料数据
    async loadData() {
      try {
        // 并行加载菜谱和原料
        const [recipesResult, materialsResult] = await Promise.all([
          recipesApi.getAllWithMaterials(),
          materialsApi.getAll(),
        ])

        console.log('加载到的菜谱:', recipesResult)
        console.log('加载到的原料:', materialsResult)

        // 格式化菜谱数据用于自动补全
        this.recipeList = recipesResult.map((recipe) => ({
          value: recipe.name,
          id: recipe.id,
          name: recipe.name,
          ingredients: recipe.ingredients || [],
        }))

        // 格式化原料数据用于自动补全（使用基础单位）
        this.ingredientList = materialsResult.map((material) => ({
          value: material.name,
          id: material.id,
          name: material.name,
          unit: material.base_unit || material.unit || '克', // 优先使用基础单位
        }))

        console.log('格式化后的菜谱列表:', this.recipeList)
        console.log('格式化后的原料列表:', this.ingredientList)
      } catch (error) {
        console.error('加载数据失败:', error)
        // 如果加载失败，使用空数组，允许用户手动输入
      }
    },

    // 加载菜单数据（编辑模式）
    async loadMenuData() {
      this.loadingData = true
      try {
        const menuData = await menusApi.getOne(this.menuId)

        // 设置菜单基本信息
        this.menuForm.name = menuData.name
        this.menuForm.date = menuData.date

        // 设置菜品列表
        if (menuData.dishes && menuData.dishes.length > 0) {
          this.dishList = menuData.dishes.map((dish) => ({
            name: dish.name,
            recipeId: dish.recipe || null,
            category: dish.category || '',
            portions: dish.portions || 1,
            ingredients: dish.ingredients.map((ing) => ({
              name: ing.name,
              materialId: ing.materialId || null,
              quantity: ing.quantity,
              unit: ing.unit || '',
            })),
          }))
        } else {
          this.addDish()
        }

        // 设置其他原料采购
        if (menuData.extra_purchases && menuData.extra_purchases.length > 0) {
          this.extraPurchases = menuData.extra_purchases.map((item) => ({
            name: item.name || '',
            materialId: item.materialId || null,
            quantity: item.quantity || 0,
            unit: item.unit || '斤',
          }))
        }
      } catch (error) {
        console.error('加载菜单数据失败:', error)
        ElMessage.error('加载菜单数据失败')
        this.goBack()
      } finally {
        this.loadingData = false
      }
    },

    generateDefaultMenuName() {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const month = tomorrow.getMonth() + 1
      const date = tomorrow.getDate()
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      const weekday = weekdays[tomorrow.getDay()]

      this.menuForm.name = `${month}月${date}日${weekday}菜单`
      // 格式化日期为 YYYY-MM-DD
      const year = tomorrow.getFullYear()
      this.menuForm.date = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    },

    onDateChange(dateStr) {
      if (dateStr) {
        const date = new Date(dateStr)
        const month = date.getMonth() + 1
        const dateNum = date.getDate()
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
        const weekday = weekdays[date.getDay()]

        this.menuForm.name = `${month}月${dateNum}日${weekday}菜单`
      }
    },

    addDish() {
      this.dishList.push({
        name: '',
        recipeId: null,
        category: '',
        portions: 1,
        ingredients: [{ name: '', materialId: null, quantity: null, unit: '' }],
      })
    },

    removeDish(index) {
      if (this.dishList.length === 1) {
        ElMessage.warning('至少保留一道菜品')
        return
      }
      this.dishList.splice(index, 1)
    },

    addIngredient(dishIndex) {
      this.dishList[dishIndex].ingredients.push({
        name: '',
        materialId: null,
        quantity: null,
        unit: '',
      })
    },

    removeIngredient(dishIndex, ingredientIndex) {
      if (this.dishList[dishIndex].ingredients.length === 1) {
        ElMessage.warning('至少保留一项原料')
        return
      }
      this.dishList[dishIndex].ingredients.splice(ingredientIndex, 1)
    },

    searchRecipes(queryString, cb) {
      const results = queryString
        ? this.recipeList.filter((recipe) =>
            recipe.name.toLowerCase().includes(queryString.toLowerCase())
          )
        : this.recipeList
      cb(results)
    },

    searchIngredients(queryString, cb) {
      const results = queryString
        ? this.ingredientList.filter((ingredient) =>
            ingredient.name.toLowerCase().includes(queryString.toLowerCase())
          )
        : this.ingredientList
      cb(results)
    },

    selectRecipe(dishIndex, recipe) {
      this.dishList[dishIndex].name = recipe.name
      this.dishList[dishIndex].recipeId = recipe.id
      // 同步菜谱的分类
      if (recipe.category) {
        this.dishList[dishIndex].category = recipe.category
      }
      this.dishList[dishIndex].ingredients = recipe.ingredients.map((ing) => ({
        name: ing.name,
        materialId: null,
        quantity: ing.quantity,
        unit: ing.unit,
      }))
      if (!this.dishList[dishIndex].portions) {
        this.dishList[dishIndex].portions = 1
      }
      ElMessage.success(`已选择菜谱「${recipe.name}」，原料已自动填入`)
    },

    selectIngredient(dishIndex, ingredientIndex, ingredient) {
      this.dishList[dishIndex].ingredients[ingredientIndex].name = ingredient.name
      this.dishList[dishIndex].ingredients[ingredientIndex].materialId = ingredient.id
      // 使用基础单位（克），如果没有设置则默认克
      if (!this.dishList[dishIndex].ingredients[ingredientIndex].unit) {
        this.dishList[dishIndex].ingredients[ingredientIndex].unit = ingredient.unit || '克'
      }
    },

    // 其他原料采购相关方法
    addExtraPurchase() {
      this.extraPurchases.push({
        name: '',
        materialId: null,
        quantity: null,
        unit: '斤',
        remark: '',
      })
    },

    removeExtraPurchase(index) {
      this.extraPurchases.splice(index, 1)
    },

    selectExtraIngredient(index, ingredient) {
      this.extraPurchases[index].name = ingredient.name
      this.extraPurchases[index].materialId = ingredient.id
      // 额外采购使用采购单位，默认斤
    },

    async saveMenu() {
      // 验证菜单名称
      if (!this.menuForm.name?.trim()) {
        ElMessage.error('请输入菜单名称')
        return
      }

      // 验证菜单日期
      if (!this.menuForm.date) {
        ElMessage.error('请选择菜单日期')
        return
      }

      // 验证菜品
      if (this.dishList.length === 0) {
        ElMessage.error('请至少添加一个菜品')
        return
      }

      // 验证每个菜品信息
      for (let i = 0; i < this.dishList.length; i++) {
        const dish = this.dishList[i]
        if (!dish.name?.trim()) {
          ElMessage.error(`请输入第 ${i + 1} 道菜的名称`)
          return
        }

        if (!dish.portions || dish.portions < 1) {
          ElMessage.error(`请设置第 ${i + 1} 道菜的份数`)
          return
        }

        // 检查原料完整性
        const validIngredients = dish.ingredients.filter(
          (ing) => ing.name?.trim() && ing.quantity > 0
        )
        if (validIngredients.length === 0) {
          ElMessage.error(`请为「${dish.name}」添加至少一项原料`)
          return
        }
      }

      // 开始保存
      this.saving = true

      try {
        // 用于缓存已创建的原料，避免重复创建
        const materialCache = new Map()

        // 第一步：处理所有原料，确保都存入原料库
        for (const dish of this.dishList) {
          for (const ing of dish.ingredients) {
            if (!ing.name?.trim() || !ing.quantity) continue

            // 如果已经有 materialId，说明是从原料库选择的，跳过
            if (ing.materialId) continue

            // 检查缓存中是否已有同名原料
            const cacheKey = `${ing.name}_${ing.unit}`
            if (materialCache.has(cacheKey)) {
              ing.materialId = materialCache.get(cacheKey)
              continue
            }

            // 创建新原料到原料库（使用新的字段结构）
            try {
              const newMaterial = await materialsApi.create({
                name: ing.name,
                // 基础单位（配菜用）
                base_unit: ing.unit || '克',
                // 采购单位（默认斤）
                purchase_unit: '斤',
                purchase_price: 0,
                // 换算比例（1斤=500克）
                conversion_rate: 500,
                // 兼容旧字段
                unit: ing.unit || '克',
                price: 0,
              })
              ing.materialId = newMaterial.id
              materialCache.set(cacheKey, newMaterial.id)

              // 同时更新本地原料列表供后续使用
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
        }

        // 第二步：处理其他原料采购，同步到原料库
        for (const item of this.extraPurchases) {
          if (!item.name?.trim() || !item.quantity) continue

          // 如果已经有 materialId，跳过
          if (item.materialId) continue

          // 检查缓存中是否已有同名原料
          const cacheKey = `${item.name}_${item.unit}`
          if (materialCache.has(cacheKey)) {
            item.materialId = materialCache.get(cacheKey)
            continue
          }

          // 创建新原料到原料库（额外采购用采购单位）
          try {
            const newMaterial = await materialsApi.create({
              name: item.name,
              // 采购单位（用户输入的单位）
              purchase_unit: item.unit || '斤',
              purchase_price: 0,
              // 基础单位默认克
              base_unit: '克',
              conversion_rate: 500,
              // 兼容旧字段
              unit: '克',
              price: 0,
            })
            item.materialId = newMaterial.id
            materialCache.set(cacheKey, newMaterial.id)

            // 同时更新本地原料列表
            this.ingredientList.push({
              value: newMaterial.name,
              id: newMaterial.id,
              name: newMaterial.name,
              unit: '克',
            })
          } catch (error) {
            console.error('创建原料失败:', item.name, error)
          }
        }

        // 第三步：处理所有菜品，确保都存入菜谱库
        for (const dish of this.dishList) {
          if (!dish.name?.trim()) continue

          // 如果已经有 recipeId，说明是从菜谱库选择的，跳过
          if (dish.recipeId) continue

          // 准备菜谱的原料数据
          const recipeMaterials = dish.ingredients
            .filter((ing) => ing.name?.trim() && ing.quantity > 0)
            .map((ing) => ({
              name: ing.name,
              materialId: ing.materialId || null,
              quantity: ing.quantity,
              unit: ing.unit || '',
            }))

          // 创建新菜谱到菜谱库（包含分类信息）
          try {
            const newRecipe = await recipesApi.create(
              { 
                name: dish.name,
                category: dish.category || '',
              },
              recipeMaterials
            )
            dish.recipeId = newRecipe.id

            // 同时更新本地菜谱列表供后续使用
            this.recipeList.push({
              value: newRecipe.name,
              id: newRecipe.id,
              name: newRecipe.name,
              category: dish.category || '',
              ingredients: recipeMaterials,
            })
          } catch (error) {
            console.error('创建菜谱失败:', dish.name, error)
          }
        }

        // 第四步：准备最终的菜品数据
        const dishes = this.dishList.map((dish) => ({
          name: dish.name,
          recipeId: dish.recipeId || null,
          category: dish.category || '',
          portions: dish.portions,
          ingredients: dish.ingredients
            .filter((ing) => ing.name?.trim() && ing.quantity > 0)
            .map((ing) => ({
              name: ing.name,
              materialId: ing.materialId || null,
              quantity: ing.quantity,
              unit: ing.unit || '',
            })),
        }))

        // 第五步：准备其他原料采购数据
        const extraPurchases = this.extraPurchases
          .filter((item) => item.name?.trim() && item.quantity > 0)
          .map((item) => ({
            name: item.name,
            materialId: item.materialId || null,
            quantity: item.quantity,
            unit: item.unit || '斤',
          }))

        // 第六步：创建或更新菜单
        if (this.isEdit) {
          await menusApi.update(
            this.menuId,
            {
              name: this.menuForm.name,
              date: this.menuForm.date,
              extra_purchases: extraPurchases,
            },
            dishes
          )
          ElMessage.success('菜单更新成功！')
        } else {
          await menusApi.create(
            {
              name: this.menuForm.name,
              date: this.menuForm.date,
              extra_purchases: extraPurchases,
            },
            dishes
          )
          ElMessage.success('菜单保存成功！')
        }

        // 提示同步信息
        const newMaterialsCount = materialCache.size
        const newRecipesCount = this.dishList.filter((d) => !d.recipeId || d.recipeId).length
        if (newMaterialsCount > 0 || newRecipesCount > 0) {
          console.log(`已同步: ${newMaterialsCount} 个新原料, ${newRecipesCount} 个新菜谱`)
        }

        setTimeout(() => {
          this.goBack()
        }, 800)
      } catch (error) {
        console.error('保存菜单失败:', error)
        ElMessage.error('保存失败，请重试')
      } finally {
        this.saving = false
      }
    },

    goBack() {
      this.$router.push('/menu')
    },

    // 将各种重量单位统一转换为斤显示
    convertToJin(quantity, unit) {
      // 各单位转换为克的系数
      const toGram = {
        克: 1,
        千克: 1000,
        公斤: 1000,
        斤: 500,
        两: 50,
      }

      if (toGram[unit]) {
        // 先统一转换为克
        const gramQuantity = quantity * toGram[unit]
        // 再转换为斤（1斤 = 500克）
        const jinQuantity = gramQuantity / 500

        if (jinQuantity >= 1) {
          // >= 1斤时显示斤，保留1位小数
          return {
            quantity: parseFloat(jinQuantity.toFixed(1)),
            unit: '斤',
          }
        } else if (gramQuantity >= 1) {
          // < 1斤时显示克
          return {
            quantity: Math.round(gramQuantity),
            unit: '克',
          }
        } else {
          return {
            quantity: quantity,
            unit: unit,
          }
        }
      }

      // 非重量单位保持原样
      return {
        quantity: quantity,
        unit: unit,
      }
    },

    // 单位转换（将源单位转换为目标单位）
    convertUnits(quantity, fromUnit, toUnit) {
      // 各单位转换为克的系数
      const toGram = {
        克: 1,
        千克: 1000,
        公斤: 1000,
        斤: 500,
        两: 50,
      }

      // 如果单位相同，直接返回
      if (fromUnit === toUnit) return quantity

      // 都是重量单位，进行转换
      if (toGram[fromUnit] && toGram[toUnit]) {
        const gramQuantity = quantity * toGram[fromUnit]
        return gramQuantity / toGram[toUnit]
      }

      // 无法转换，直接返回原数量
      return quantity
    },

    async copyToClipboard() {
      try {
        const copyText = this.ingredientSummary
          .map((item) => `${item.name} ${item.displayQuantity}${item.displayUnit}`)
          .join('\n')

        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(copyText)
        } else {
          const textArea = document.createElement('textarea')
          textArea.value = copyText
          textArea.style.position = 'fixed'
          textArea.style.left = '-999999px'
          textArea.style.top = '-999999px'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          document.execCommand('copy')
          textArea.remove()
        }

        ElMessage.success('原料清单已复制到剪切板')
      } catch (error) {
        console.error('复制失败:', error)
        ElMessage.error('复制失败，请手动复制')
      }
    },

    async exportToExcel() {
      try {
        if (this.ingredientSummary.length === 0) {
          ElMessage.warning('暂无原料数据可导出')
          return
        }

        const XLSX = await loadXLSX()

        // 准备 Excel 数据 - 汇总表
        const summaryData = this.ingredientSummary.map((item, index) => ({
          '序号': index + 1,
          '原料名称': item.name,
          '数量': item.displayQuantity,
          '单位': item.displayUnit,
          '类型': item.isExtra ? '其他采购' : '菜品原料',
          '来源': item.dishes.map(d => `${d.name}×${d.portions}份`).join('、'),
        }))

        // 准备明细表 - 每个菜品的原料详情
        const detailData = []
        this.dishList.forEach((dish, dishIndex) => {
          dish.ingredients.forEach((ing, ingIndex) => {
            if (ing.name && ing.quantity) {
              const portions = dish.portions || 1
              const totalQuantity = ing.quantity * portions
              const converted = this.convertToJin(totalQuantity, ing.unit || '份')
              detailData.push({
                '序号': detailData.length + 1,
                '菜品名称': dish.name,
                '份数': portions,
                '原料名称': ing.name,
                '单份用量': ing.quantity,
                '单位': ing.unit || '',
                '总用量': converted.quantity,
                '总用量单位': converted.unit,
              })
            }
          })
        })

        // 其他采购明细
        this.extraPurchases.forEach((item, index) => {
          if (item.name && item.quantity) {
            const converted = this.convertToJin(item.quantity, item.unit || '份')
            detailData.push({
              '序号': detailData.length + 1,
              '菜品名称': '其他采购',
              '份数': 1,
              '原料名称': item.name,
              '单份用量': item.quantity,
              '单位': item.unit || '',
              '总用量': converted.quantity,
              '总用量单位': converted.unit,
            })
          }
        })

        // 创建工作簿
        const wb = XLSX.utils.book_new()

        // 创建汇总表
        const ws1 = XLSX.utils.json_to_sheet(summaryData)
        // 设置列宽
        ws1['!cols'] = [
          { wch: 6 },   // 序号
          { wch: 15 },  // 原料名称
          { wch: 10 },  // 数量
          { wch: 8 },   // 单位
          { wch: 10 },  // 类型
          { wch: 40 },  // 来源
        ]
        XLSX.utils.book_append_sheet(wb, ws1, '原料汇总')

        // 创建明细表
        const ws2 = XLSX.utils.json_to_sheet(detailData)
        ws2['!cols'] = [
          { wch: 6 },   // 序号
          { wch: 15 },  // 菜品名称
          { wch: 6 },   // 份数
          { wch: 15 },  // 原料名称
          { wch: 10 },  // 单份用量
          { wch: 8 },   // 单位
          { wch: 10 },  // 总用量
          { wch: 10 },  // 总用量单位
        ]
        XLSX.utils.book_append_sheet(wb, ws2, '原料明细')

        // 生成文件名
        const menuName = this.menuForm.name || '采购清单'
        const dateStr = this.menuForm.date || new Date().toISOString().split('T')[0]
        const fileName = `${menuName}_${dateStr}.xlsx`

        // 导出文件
        XLSX.writeFile(wb, fileName)

        ElMessage.success('Excel文件已导出')
      } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('导出失败，请重试')
      }
    },
  },
}
</script>

<style scoped>
.menu-add-page {
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
.dishes-card,
.summary-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* 菜单信息卡片 - 翡翠绿风格 */
.info-card :deep(.el-card__header) {
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%);
  border-bottom: 1px solid rgba(16, 185, 129, 0.15);
}

.summary-card :deep(.el-card__header) {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

/* 菜品列表卡片 - 翡翠绿风格 */
.dishes-card :deep(.el-card__header) {
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%);
  border-bottom: 1px solid rgba(16, 185, 129, 0.15);
}

.info-card :deep(.el-card__body),
.dishes-card :deep(.el-card__body),
.summary-card :deep(.el-card__body) {
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

/* 菜品名称快览 */
.dish-names-preview {
  margin-top: 8px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(6, 182, 212, 0.03) 100%);
  border-radius: 10px;
  border: 1px solid rgba(16, 185, 129, 0.12);
}

.dish-names-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.dish-names-label .el-icon {
  color: #10b981;
  font-size: 16px;
}

.dish-names-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.dish-names-grouped {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dish-category-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.category-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: rgba(107, 114, 128, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  white-space: nowrap;
  min-width: 48px;
  text-align: center;
}

.dish-name-tag {
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.dish-name-tag:hover {
  transform: translateY(-1px);
}

/* 空状态 */
.empty-state {
  padding: 40px 0;
}

/* 菜品列表 */
.dish-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 底部添加菜品按钮 */
.add-dish-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  border: 2px dashed rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, rgba(6, 182, 212, 0.02) 100%);
  color: #10b981;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-dish-bottom:hover {
  border-color: rgba(16, 185, 129, 0.5);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%);
  transform: translateY(-2px);
}

.add-dish-bottom .el-icon {
  font-size: 20px;
}

/* 底部添加采购项按钮 */
.add-extra-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px;
  border: 2px dashed rgba(245, 158, 11, 0.3);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.02) 0%, rgba(251, 191, 36, 0.02) 100%);
  color: #f59e0b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 12px;
}

.add-extra-bottom:hover {
  border-color: rgba(245, 158, 11, 0.5);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(251, 191, 36, 0.05) 100%);
  transform: translateY(-2px);
}

.add-extra-bottom .el-icon {
  font-size: 18px;
}

/* 悬浮添加按钮 */
.fab-container {
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 100;
}

.fab-btn {
  width: 56px !important;
  height: 56px !important;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
  transition: all 0.3s ease;
}

.fab-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5);
}

.dish-item {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border: 1px solid rgba(16, 185, 129, 0.12);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.dish-item:hover {
  border-color: rgba(16, 185, 129, 0.35);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.12);
}

.dish-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(6, 182, 212, 0.04) 100%);
  border-bottom: 1px solid rgba(16, 185, 129, 0.1);
}

.dish-index {
  flex-shrink: 0;
}

.index-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.dish-category {
  flex-shrink: 0;
}

.dish-category :deep(.el-select__wrapper) {
  border-radius: 8px;
}

.dish-main {
  flex: 1;
  min-width: 150px;
}

.dish-name-input {
  width: 100%;
}

.dish-name-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.dish-portions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.portions-label {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}

.dish-actions {
  flex-shrink: 0;
}

/* 原材料区域 */
.ingredients-section {
  padding: 16px 20px;
}

.ingredients-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ingredients-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
}

.ingredients-title .el-icon {
  color: #10b981;
}

.no-ingredients {
  padding: 20px;
  text-align: center;
  color: #64748b;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(6, 182, 212, 0.03) 100%);
  border-radius: 8px;
  font-size: 13px;
  border: 1px dashed rgba(16, 185, 129, 0.25);
}

.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ingredient-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(248, 250, 252, 1) 100%);
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.1);
  transition: all 0.2s ease;
}

.ingredient-row:hover {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(241, 245, 249, 1) 100%);
  border-color: rgba(16, 185, 129, 0.2);
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

.ingredient-actions {
  flex: 0 0 32px;
}

/* 原料汇总卡片 */
.summary-card :deep(.el-card__header) {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%);
  border-bottom: 1px solid rgba(16, 185, 129, 0.2);
}

/* 原料汇总网格布局 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.summary-item {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.25s ease;
}

.summary-item:hover {
  border-color: rgba(16, 185, 129, 0.35);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.1);
  transform: translateY(-2px);
}

.summary-item.is-extra {
  background: linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%);
  border-color: rgba(245, 158, 11, 0.25);
}

.summary-item.is-extra:hover {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.1);
}

.summary-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(16, 185, 129, 0.1);
}

.summary-item.is-extra .summary-item-header {
  border-bottom-color: rgba(245, 158, 11, 0.15);
}

.item-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.item-quantity {
  font-size: 15px;
  font-weight: 700;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}

.summary-item.is-extra .item-quantity {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
}

.summary-item-dishes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dish-source {
  font-size: 13px;
  color: #475569;
  padding: 6px 10px;
  background: rgba(16, 185, 129, 0.04);
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-item.is-extra .dish-source {
  background: rgba(245, 158, 11, 0.06);
}

.dish-detail {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

/* 菜品列表卡片按钮 */
.dishes-card .card-header .el-button--primary {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}

.dishes-card .card-header .el-button--primary:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

/* 空状态按钮 */
.empty-state .el-button--primary {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  border: none;
}

/* 原料汇总操作按钮组 */
.summary-actions {
  display: flex;
  gap: 10px;
}

.summary-card .card-header .el-button--primary {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}

.summary-card .card-header .el-button--primary:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

.summary-card .card-header .el-button--success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.25);
}

.summary-card .card-header .el-button--success:hover {
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.35);
}

/* 其他原料采购 */
.extra-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.extra-card :deep(.el-card__header) {
  padding: 16px 20px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-bottom: 1px solid #fcd34d;
}

.extra-card :deep(.el-card__body) {
  padding: 20px;
}

.extra-icon {
  color: #f59e0b !important;
}

.extra-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.extra-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #fffbeb;
  border-radius: 8px;
  border: 1px solid #fef3c7;
  transition: all 0.2s ease;
}

.extra-row:hover {
  background-color: #fef3c7;
  border-color: #fcd34d;
}

.extra-name {
  flex: 2;
  min-width: 150px;
}

.extra-quantity {
  flex: 1;
  min-width: 100px;
}

.extra-unit {
  flex: 1;
  min-width: 90px;
}

.extra-remark {
  flex: 2;
  min-width: 120px;
}

.extra-actions {
  flex-shrink: 0;
}

/* 响应式 - 平板 */
@media (max-width: 992px) {
  .ingredient-row,
  .extra-row {
    flex-wrap: wrap;
    gap: 10px;
  }

  .ingredient-name,
  .extra-name {
    flex: 2;
    min-width: 140px;
  }

  .ingredient-quantity,
  .extra-quantity {
    flex: none;
    width: 100px;
  }

  .ingredient-unit,
  .extra-unit {
    flex: none;
    width: 90px;
  }

  .extra-remark {
    flex: 1;
    min-width: 100px;
  }
}

/* 响应式 - 手机 */
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

  .dish-header {
    flex-wrap: wrap;
    gap: 10px;
  }

  .dish-index {
    order: 0;
  }

  .dish-category {
    order: 1;
  }

  .dish-actions {
    order: 0;
    margin-left: auto;
  }

  .dish-main {
    width: 100%;
    flex: none;
    order: 2;
  }

  .dish-portions {
    order: 3;
    width: auto;
    justify-content: flex-start;
  }

  .ingredient-row,
  .extra-row {
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px;
  }

  .ingredient-name,
  .extra-name {
    width: 100%;
    flex: none;
    order: 1;
  }

  .ingredient-quantity,
  .extra-quantity {
    flex: 1;
    min-width: 0;
    order: 2;
  }

  .ingredient-unit,
  .extra-unit {
    flex: 1;
    min-width: 0;
    order: 3;
  }

  .ingredient-actions,
  .extra-actions {
    order: 0;
    margin-left: auto;
  }

  .extra-remark {
    width: 100%;
    flex: none;
    order: 4;
  }

  /* 汇总操作按钮移动端适配 */
  .summary-actions {
    flex-direction: column;
    gap: 8px;
  }

  .summary-actions .el-button {
    margin: 0;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>

