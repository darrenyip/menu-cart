<template>
  <div class="menu-add-page">
    <div class="page-container">
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
              <el-tag
                v-if="dishNames.length > 0"
                type="success"
                size="small"
                style="margin-left: 8px"
              >
                {{ dishNames.length }} 道菜
              </el-tag>
            </div>
          </div>
        </template>
        <el-form :model="menuForm" label-position="top">
          <el-form-item label="菜单名称" required>
            <el-input v-model="menuForm.name" placeholder="输入菜单名称" size="large" clearable>
              <template #prefix>
                <el-icon><Edit /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <!-- 菜品名称快览（按分类显示） -->
          <div v-if="dishNames.length > 0" class="dish-names-preview">
            <div class="dish-names-label">
              <el-icon><Dish /></el-icon>
              <span>菜单列表</span>
              <span class="total-cost" v-if="totalMenuCost > 0">
                合计：¥{{ totalMenuCost.toFixed(2) }}
              </span>
            </div>
            <div class="dish-names-grouped">
              <div
                v-for="(group, category) in groupedDishes"
                :key="category"
                class="dish-category-group"
              >
                <span class="category-label">{{ category }}</span>
                <el-tooltip
                  v-for="(dish, index) in group"
                  :key="index"
                  :content="getDishCostTooltip(dish)"
                  placement="top"
                  :disabled="!getDishCost(dish)"
                >
                  <el-tag
                    class="dish-name-tag with-price clickable"
                    :type="getCategoryTagType(category)"
                    effect="plain"
                    @click="scrollToDish(dish.originalIndex)"
                  >
                    <span class="dish-tag-name">{{ dish.name }}</span>
                    <span class="dish-tag-portions" v-if="dish.portions > 1"
                      >×{{ dish.portions }}</span
                    >
                    <span class="dish-tag-price" v-if="getDishCost(dish)">
                      ¥{{ getDishCost(dish).toFixed(2) }}
                    </span>
                  </el-tag>
                </el-tooltip>
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
          <div
            v-for="(dish, dishIndex) in dishList"
            :key="dishIndex"
            class="dish-item"
            :id="`dish-item-${dishIndex}`"
          >
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
                  <el-option v-for="cat in dishCategories" :key="cat" :label="cat" :value="cat" />
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
                    <el-select
                      v-model="ingredient.unit"
                      placeholder="单位"
                      filterable
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
                  <!-- 总量和价格显示 -->
                  <div class="ingredient-summary" v-if="ingredient.quantity || ingredient.name">
                    <div class="ingredient-total" v-if="ingredient.quantity && dish.portions > 1">
                      <span class="total-label">合计</span>
                      <span class="total-value">{{
                        formatIngredientTotal(ingredient, dish.portions)
                      }}</span>
                    </div>
                    <!-- 价格显示（点击编辑） -->
                    <div
                      class="ingredient-price-btn"
                      v-if="ingredient.name"
                      @click="openMaterialEditDialog(ingredient)"
                    >
                      <template v-if="getIngredientPrice(ingredient.name)">
                        <span class="price-text">{{
                          getIngredientPrice(ingredient.name).priceText
                        }}</span>
                        <el-icon class="edit-icon"><Edit /></el-icon>
                      </template>
                      <template v-else>
                        <span class="price-text no-price">设置价格</span>
                        <el-icon class="edit-icon"><Edit /></el-icon>
                      </template>
                    </div>
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
          <div v-for="(item, index) in extraPurchases" :key="index" class="extra-row">
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
              <el-select
                v-model="item.unit"
                placeholder="单位"
                filterable
                allow-create
                size="default"
              >
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
      <el-card
        v-if="ingredientSummary.length > 0 || extraPurchases.length > 0"
        class="summary-card"
        shadow="hover"
      >
        <template #header>
          <div class="card-header">
            <div class="header-title">
              <el-icon class="card-icon"><DataAnalysis /></el-icon>
              <span>采购清单</span>
              <el-tag type="success" size="small" style="margin-left: 8px">
                {{ ingredientSummary.length }} 种原料
              </el-tag>
            </div>
            <div class="summary-actions">
              <el-button type="primary" @click="copyToClipboard">
                <el-icon><CopyDocument /></el-icon>复制
              </el-button>
              <el-button type="success" @click="exportToExcel">
                <el-icon><Download /></el-icon>导出
              </el-button>
            </div>
          </div>
        </template>

        <!-- 采购清单表格 -->
        <div class="purchase-list">
          <!-- 表头 -->
          <div class="purchase-header">
            <span class="col-name">原料名称</span>
            <span class="col-quantity">采购量</span>
            <span class="col-source">来源</span>
          </div>

          <!-- 原料行 -->
          <div
            v-for="(item, index) in ingredientSummary"
            :key="item.isExtra ? `${item.name}_${item.displayUnit}` : item.name"
            class="purchase-row"
            :class="{ 'is-extra': item.isExtra, 'is-even': index % 2 === 1 }"
          >
            <div class="col-name">
              <span class="ingredient-name">{{ item.name }}</span>
            </div>
            <div class="col-quantity">
              <span class="quantity-value">{{ item.displayQuantity }}</span>
              <span class="quantity-unit">{{ item.displayUnit }}</span>
            </div>
            <div class="col-source">
              <div class="source-tags">
                <el-tooltip
                  v-for="dish in item.dishes"
                  :key="dish.name + dish.portions"
                  :content="`${dish.displayQuantity}${dish.displayUnit}`"
                  placement="top"
                >
                  <el-tag
                    :type="dish.name === '其他采购' ? 'warning' : 'info'"
                    size="small"
                    effect="plain"
                    class="source-tag"
                  >
                    {{ dish.name }}
                    <span v-if="dish.portions > 1" class="portions-badge"
                      >×{{ dish.portions }}</span
                    >
                  </el-tag>
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 编辑原料对话框（使用统一组件） -->
    <MaterialEditDialog
      v-model="materialEditDialog.visible"
      :material="materialEditDialog.editMaterial"
      :supplier-options="supplierOptions"
      @saved="onMaterialSaved"
    />
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
import MaterialEditDialog from '@/components/MaterialEditDialog.vue'

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
    MaterialEditDialog,
  },
  data() {
    return {
      saving: false,
      loadingData: false,
      menuId: null,
      menuForm: {
        name: '',
      },
      dishList: [],
      // 其他原料采购
      extraPurchases: [],
      // 从后端加载的数据
      recipeList: [],
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
      // 编辑原料对话框
      materialEditDialog: {
        visible: false,
        editMaterial: null, // 当前编辑的原料
        ingredient: null, // 当前编辑的原料引用（用于更新单位）
      },
      // 供应商选项
      supplierOptions: ['乐禾', '快驴', '超市'],
    }
  },
  computed: {
    isEdit() {
      return !!this.$route.params.id
    },
    // 获取已填写的菜品名称列表
    dishNames() {
      return this.dishList
        .filter((dish) => dish.name && dish.name.trim())
        .map((dish) => dish.name.trim())
    },
    // 按分类分组的菜品
    groupedDishes() {
      const groups = {}
      // 先映射出原始索引，再过滤，避免 indexOf 在重名情况下找错
      this.dishList
        .map((dish, index) => ({ dish, originalIndex: index }))
        .filter(({ dish }) => dish.name && dish.name.trim())
        .forEach(({ dish, originalIndex }) => {
          const category = dish.category || '未分类'
          if (!groups[category]) {
            groups[category] = []
          }
          groups[category].push({
            name: dish.name.trim(),
            portions: dish.portions,
            ingredients: dish.ingredients || [],
            originalIndex, // 保存原始索引，用于跳转定位
          })
        })

      // 按照 dishCategories 的顺序排列，未分类放最后
      const orderedGroups = {}
      this.dishCategories.forEach((cat) => {
        if (groups[cat]) {
          orderedGroups[cat] = groups[cat]
        }
      })
      if (groups['未分类']) {
        orderedGroups['未分类'] = groups['未分类']
      }
      return orderedGroups
    },
    // 菜单总成本（所有菜品的成本总和）
    totalMenuCost() {
      let total = 0
      this.dishList.forEach((dish) => {
        if (!dish.name?.trim()) return
        const cost = this.calculateDishCost(dish.ingredients)
        if (cost > 0) {
          total += cost * (dish.portions || 1)
        }
      })
      return total
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
            name: '其他采购',
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
            dishes: [
              {
                name: '其他采购',
                quantity: item.quantity,
                unit: item.unit || '份',
                portions: 1,
              },
            ],
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

    // 计算单道菜的原料成本（一份）
    calculateDishCost(ingredients) {
      if (!ingredients || ingredients.length === 0) return 0

      let totalCost = 0
      ingredients.forEach((ing) => {
        if (!ing.name || !ing.quantity) return

        // 从原料列表中查找该原料的价格信息
        const material = this.ingredientList.find((m) => m.name === ing.name)
        if (!material || typeof material.purchase_price !== 'number') return

        // 计算成本：先将原料用量转换为采购单位，再乘以采购单价
        // 原料用量单位 -> 克 -> 采购单位
        const toGram = {
          克: 1,
          千克: 1000,
          公斤: 1000,
          斤: 500,
          两: 50,
        }

        const ingredientUnit = ing.unit || '克'
        const conversionRate = material.conversion_rate || 500 // 采购单位对应的克数

        // 如果原料单位是重量单位，进行换算
        if (toGram[ingredientUnit]) {
          // 先转换为克
          const gramQuantity = ing.quantity * toGram[ingredientUnit]
          // 再转换为采购单位数量
          const purchaseQuantity = gramQuantity / conversionRate
          // 计算成本
          totalCost += purchaseQuantity * material.purchase_price
        } else {
          // 非重量单位（个、根等），假设直接使用采购单价
          totalCost += ing.quantity * material.purchase_price
        }
      })

      return totalCost
    },

    // 获取菜品成本（一份）
    getDishCost(dish) {
      return this.calculateDishCost(dish.ingredients)
    },

    // 获取菜品成本提示信息
    getDishCostTooltip(dish) {
      const cost = this.calculateDishCost(dish.ingredients)
      if (!cost) return ''
      const portions = dish.portions || 1
      if (portions > 1) {
        return `单份成本: ¥${cost.toFixed(2)} | ${portions}份合计: ¥${(cost * portions).toFixed(2)}`
      }
      return `单份成本: ¥${cost.toFixed(2)}`
    },
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
          category: recipe.category || '',
          ingredients: recipe.ingredients || [],
        }))

        // 格式化原料数据用于自动补全（使用基础单位，包含价格信息）
        this.ingredientList = materialsResult.map((material) => ({
          value: material.name,
          id: material.id,
          name: material.name,
          unit: material.base_unit || material.unit || '克', // 优先使用基础单位
          // 价格相关字段
          purchase_price: material.purchase_price || 0,
          purchase_unit: material.purchase_unit || '斤',
          conversion_rate: material.conversion_rate || 500, // 默认 1斤=500克
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
      // 菜单名称用当天日期（下单日）
      const today = new Date()
      const todayMonth = today.getMonth() + 1
      const todayDate = today.getDate()
      this.menuForm.name = `${todayMonth}月${todayDate}日订单`
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
            recipe.name.toLowerCase().includes(queryString.toLowerCase()),
          )
        : this.recipeList
      cb(results)
    },

    searchIngredients(queryString, cb) {
      const results = queryString
        ? this.ingredientList.filter((ingredient) =>
            ingredient.name.toLowerCase().includes(queryString.toLowerCase()),
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
          (ing) => ing.name?.trim() && ing.quantity > 0,
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

        // 先获取原料库中已存在的所有原料，建立名称到ID的映射
        const existingMaterials = await materialsApi.getAll()
        const existingMaterialMap = new Map()
        for (const material of existingMaterials) {
          // 以原料名称为 key（忽略单位差异，同名原料视为同一个）
          existingMaterialMap.set(material.name, material)
        }

        // 第一步：处理所有原料，确保都存入原料库
        for (const dish of this.dishList) {
          for (const ing of dish.ingredients) {
            if (!ing.name?.trim() || !ing.quantity) continue

            // 检查原料库中是否已有同名原料
            if (existingMaterialMap.has(ing.name)) {
              const existingMaterial = existingMaterialMap.get(ing.name)
              ing.materialId = existingMaterial.id

              // 如果用户输入了价格且原料库中没有价格，则更新价格
              if (ing.price && ing.price > 0 && !existingMaterial.purchase_price) {
                try {
                  await materialsApi.update(existingMaterial.id, {
                    purchase_price: ing.price,
                  })
                  // 更新本地缓存
                  existingMaterial.purchase_price = ing.price
                  const localMaterial = this.ingredientList.find(
                    (m) => m.id === existingMaterial.id,
                  )
                  if (localMaterial) {
                    localMaterial.purchase_price = ing.price
                  }
                  console.log(`已更新原料「${ing.name}」的价格: ¥${ing.price}`)
                } catch (error) {
                  console.error('更新原料价格失败:', ing.name, error)
                }
              }
              continue
            }

            // 检查缓存中是否已有同名原料（当前保存操作中新创建的）
            const cacheKey = ing.name
            if (materialCache.has(cacheKey)) {
              ing.materialId = materialCache.get(cacheKey)
              continue
            }

            // 创建新原料到原料库（使用新的字段结构，包含用户输入的价格）
            try {
              const newMaterial = await materialsApi.create({
                name: ing.name,
                // 基础单位（配菜用）
                base_unit: ing.unit || '克',
                // 采购单位（默认斤）
                purchase_unit: '斤',
                // 使用用户输入的价格
                purchase_price: ing.price || 0,
                // 换算比例（1斤=500克）
                conversion_rate: 500,
                // 兼容旧字段
                unit: ing.unit || '克',
                price: ing.price || 0,
              })
              ing.materialId = newMaterial.id
              materialCache.set(ing.name, newMaterial.id)
              // 同时更新 existingMaterialMap，避免后续重复创建
              existingMaterialMap.set(ing.name, newMaterial)

              // 同时更新本地原料列表供后续使用
              this.ingredientList.push({
                value: newMaterial.name,
                id: newMaterial.id,
                name: newMaterial.name,
                unit: newMaterial.base_unit || '克',
                purchase_price: ing.price || 0,
                purchase_unit: '斤',
                conversion_rate: 500,
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

          // 检查原料库中是否已有同名原料
          if (existingMaterialMap.has(item.name)) {
            item.materialId = existingMaterialMap.get(item.name).id
            continue
          }

          // 检查缓存中是否已有同名原料（当前保存操作中新创建的）
          const cacheKey = item.name
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
            materialCache.set(item.name, newMaterial.id)
            // 同时更新 existingMaterialMap，避免后续重复创建
            existingMaterialMap.set(item.name, newMaterial)

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

        // 第三步：处理所有菜品，同步到菜谱库
        for (const dish of this.dishList) {
          if (!dish.name?.trim()) continue

          // 准备菜谱的原料数据
          const recipeMaterials = dish.ingredients
            .filter((ing) => ing.name?.trim() && ing.quantity > 0)
            .map((ing) => ({
              name: ing.name,
              materialId: ing.materialId || null,
              quantity: ing.quantity,
              unit: ing.unit || '',
            }))

          // 如果已经有 recipeId，更新已存在的菜谱
          if (dish.recipeId) {
            try {
              await recipesApi.update(
                dish.recipeId,
                {
                  name: dish.name,
                  category: dish.category || '',
                },
                recipeMaterials,
              )
              console.log(`菜谱「${dish.name}」已同步更新`)
            } catch (error) {
              console.error('更新菜谱失败:', dish.name, error)
            }
          } else {
            // 创建新菜谱到菜谱库（包含分类信息）
            try {
              const newRecipe = await recipesApi.create(
                {
                  name: dish.name,
                  category: dish.category || '',
                },
                recipeMaterials,
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
              extra_purchases: extraPurchases,
            },
            dishes,
          )
          ElMessage.success('菜单更新成功！')
        } else {
          await menusApi.create(
            {
              name: this.menuForm.name,
              extra_purchases: extraPurchases,
            },
            dishes,
          )
          ElMessage.success('菜单保存成功！')
        }

        // 提示同步信息
        const newMaterialsCount = materialCache.size
        if (newMaterialsCount > 0) {
          console.log(`已同步: ${newMaterialsCount} 个新原料到原料库`)
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

    // 滚动到指定菜品
    scrollToDish(dishIndex) {
      const element = document.getElementById(`dish-item-${dishIndex}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // 添加高亮动画效果
        element.classList.add('dish-highlight')
        setTimeout(() => {
          element.classList.remove('dish-highlight')
        }, 1500)
      }
    },

    // 格式化原料总量显示
    formatIngredientTotal(ingredient, portions) {
      if (!ingredient.quantity || !portions) return ''
      const totalQuantity = ingredient.quantity * portions
      const unit = ingredient.unit || '份'
      const converted = this.convertToJin(totalQuantity, unit)
      return `${converted.quantity}${converted.unit}`
    },

    // 获取原料价格信息
    getIngredientPrice(ingredientName) {
      if (!ingredientName) return null
      const material = this.ingredientList.find((m) => m.name === ingredientName)
      if (!material || !material.purchase_price) return null
      return {
        price: material.purchase_price,
        unit: material.purchase_unit || '斤',
        conversionRate: material.conversion_rate || 500,
        priceText: `¥${material.purchase_price}/${material.purchase_unit || '斤'}`,
      }
    },

    // 获取原料的采购单位
    getIngredientUnit(ingredientName) {
      if (!ingredientName) return '斤'
      const material = this.ingredientList.find((m) => m.name === ingredientName)
      return material?.purchase_unit || '斤'
    },

    // 打开编辑原料对话框
    openMaterialEditDialog(ingredient) {
      const material = this.ingredientList.find((m) => m.name === ingredient.name)

      // 构造编辑用的原料数据
      this.materialEditDialog.editMaterial = {
        id: material?.id || null,
        name: ingredient.name,
        purchase_unit: material?.purchase_unit || '斤',
        purchase_price: material?.purchase_price || 0,
        supplier: material?.supplier || '',
        base_unit: ingredient.unit || material?.unit || '克',
        conversion_rate: material?.conversion_rate || 500,
      }
      this.materialEditDialog.ingredient = ingredient
      this.materialEditDialog.visible = true
    },

    // 原料保存成功后的回调
    async onMaterialSaved() {
      // 重新加载原料列表以获取最新数据
      await this.loadData()
      
      // 更新当前编辑的原料单位
      const ingredient = this.materialEditDialog.ingredient
      if (ingredient) {
        const updatedMaterial = this.ingredientList.find((m) => m.name === ingredient.name)
        if (updatedMaterial) {
          ingredient.unit = updatedMaterial.unit
          ingredient.materialId = updatedMaterial.id
        }
      }
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
        // 第一部分：采购汇总
        const summaryLines = ['【采购清单】']
        this.ingredientSummary.forEach((item) => {
          summaryLines.push(`${item.name} ${item.displayQuantity}${item.displayUnit}`)
        })

        // 第二部分：菜品明细
        const detailLines = ['\n【菜品明细】']

        // 按菜品分组显示原料
        this.dishList.forEach((dish) => {
          if (!dish.name?.trim()) return

          const portions = dish.portions || 1
          const category = dish.category ? `[${dish.category}]` : ''
          detailLines.push(`\n${dish.name} ${category} ×${portions}份`)

          // 获取有效原料
          const validIngredients = dish.ingredients.filter(
            (ing) => ing.name?.trim() && ing.quantity > 0,
          )

          if (validIngredients.length > 0) {
            // 单份用量
            detailLines.push('  📋 单份用量:')
            validIngredients.forEach((ing) => {
              const singleConverted = this.convertToJin(ing.quantity, ing.unit || '份')
              detailLines.push(
                `     ${ing.name} ${singleConverted.quantity}${singleConverted.unit}`,
              )
            })

            // 采购总量（仅当份数大于1时显示）
            if (portions > 1) {
              detailLines.push(`  🛒 采购总量 (×${portions}份):`)
              validIngredients.forEach((ing) => {
                const totalQuantity = ing.quantity * portions
                const totalConverted = this.convertToJin(totalQuantity, ing.unit || '份')
                detailLines.push(
                  `     ${ing.name} ${totalConverted.quantity}${totalConverted.unit}`,
                )
              })
            }
          }
        })

        // 其他采购
        const validExtraPurchases = this.extraPurchases.filter(
          (item) => item.name?.trim() && item.quantity > 0,
        )
        if (validExtraPurchases.length > 0) {
          detailLines.push('\n其他采购')
          validExtraPurchases.forEach((item) => {
            const converted = this.convertToJin(item.quantity, item.unit || '份')
            detailLines.push(`  - ${item.name} ${converted.quantity}${converted.unit}`)
          })
        }

        // 合并两部分
        const copyText = [...summaryLines, ...detailLines].join('\n')

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

        ElMessage.success('采购清单已复制到剪切板')
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
          序号: index + 1,
          原料名称: item.name,
          数量: item.displayQuantity,
          单位: item.displayUnit,
          类型: item.isExtra ? '其他采购' : '菜品原料',
          来源: item.dishes.map((d) => `${d.name}×${d.portions}份`).join('、'),
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
                序号: detailData.length + 1,
                菜品名称: dish.name,
                份数: portions,
                原料名称: ing.name,
                单份用量: ing.quantity,
                单位: ing.unit || '',
                总用量: converted.quantity,
                总用量单位: converted.unit,
              })
            }
          })
        })

        // 其他采购明细
        this.extraPurchases.forEach((item, index) => {
          if (item.name && item.quantity) {
            const converted = this.convertToJin(item.quantity, item.unit || '份')
            detailData.push({
              序号: detailData.length + 1,
              菜品名称: '其他采购',
              份数: 1,
              原料名称: item.name,
              单份用量: item.quantity,
              单位: item.unit || '',
              总用量: converted.quantity,
              总用量单位: converted.unit,
            })
          }
        })

        // 创建工作簿
        const wb = XLSX.utils.book_new()

        // 创建汇总表
        const ws1 = XLSX.utils.json_to_sheet(summaryData)
        // 设置列宽
        ws1['!cols'] = [
          { wch: 6 }, // 序号
          { wch: 15 }, // 原料名称
          { wch: 10 }, // 数量
          { wch: 8 }, // 单位
          { wch: 10 }, // 类型
          { wch: 40 }, // 来源
        ]
        XLSX.utils.book_append_sheet(wb, ws1, '原料汇总')

        // 创建明细表
        const ws2 = XLSX.utils.json_to_sheet(detailData)
        ws2['!cols'] = [
          { wch: 6 }, // 序号
          { wch: 15 }, // 菜品名称
          { wch: 6 }, // 份数
          { wch: 15 }, // 原料名称
          { wch: 10 }, // 单份用量
          { wch: 8 }, // 单位
          { wch: 10 }, // 总用量
          { wch: 10 }, // 总用量单位
        ]
        XLSX.utils.book_append_sheet(wb, ws2, '原料明细')

        // 生成文件名
        const menuName = this.menuForm.name || '采购清单'
        const fileName = `${menuName}.xlsx`

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

/* 按钮文字（用于响应式隐藏） */
.btn-text-cancel,
.btn-text-save {
  margin-left: 4px;
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

.dish-names-label .total-cost {
  margin-left: auto;
  font-size: 15px;
  font-weight: 700;
  color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%);
  padding: 4px 12px;
  border-radius: 16px;
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

.dish-name-tag.with-price {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px 6px 12px;
}

.dish-tag-name {
  font-weight: 500;
}

.dish-tag-price {
  font-size: 12px;
  font-weight: 600;
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
}

/* 不同分类的价格颜色 */
.el-tag--danger .dish-tag-price {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}

.el-tag--warning .dish-tag-price {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}

.el-tag--success .dish-tag-price {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
}

.el-tag--primary .dish-tag-price {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.12);
}

.dish-name-tag:hover {
  transform: translateY(-1px);
}

/* 菜品份数显示 */
.dish-tag-portions {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-left: 2px;
}

/* 可点击的菜品标签 */
.dish-name-tag.clickable {
  cursor: pointer;
}

.dish-name-tag.clickable:active {
  transform: scale(0.95);
}

/* 菜品高亮动画 */
.dish-item.dish-highlight {
  animation: highlightPulse 1.5s ease-out;
}

@keyframes highlightPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
    border-color: #10b981;
  }
  50% {
    box-shadow: 0 0 20px 4px rgba(16, 185, 129, 0.3);
    border-color: #10b981;
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    border-color: rgba(16, 185, 129, 0.12);
  }
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
  flex: 1 1 55%;
  min-width: 0;
}

.ingredient-quantity {
  flex: 0 0 20%;
  min-width: 150px;
}

.ingredient-quantity :deep(.el-input-number) {
  width: 100%;
}

.ingredient-unit {
  flex: 0 0 15%;
  min-width: 120px;
}

/* 原料汇总区域（总量+价格） */
.ingredient-summary {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 原料总量显示 */
.ingredient-total {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.1) 100%);
  border-radius: 16px;
  white-space: nowrap;
}

.ingredient-total .total-label {
  font-size: 12px;
  color: #6b7280;
}

.ingredient-total .total-value {
  font-size: 14px;
  font-weight: 600;
  color: #10b981;
}

/* 原料价格按钮 */
.ingredient-price-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(251, 191, 36, 0.1) 100%);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.ingredient-price-btn:hover {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.18) 100%);
  transform: translateY(-1px);
}

.ingredient-price-btn .price-text {
  font-size: 13px;
  font-weight: 600;
  color: #f59e0b;
}

.ingredient-price-btn .price-text.no-price {
  font-weight: 500;
  color: #92400e;
}

.ingredient-price-btn .edit-icon {
  font-size: 12px;
  color: #92400e;
  opacity: 0.6;
}

.ingredient-price-btn:hover .edit-icon {
  opacity: 1;
}

.ingredient-actions {
  flex: 0 0 auto;
}

/* 原料汇总卡片 */
.summary-card :deep(.el-card__header) {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%);
  border-bottom: 1px solid rgba(16, 185, 129, 0.2);
}

/* 采购清单表格样式 */
.purchase-list {
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 10px;
  overflow: hidden;
}

.purchase-header {
  display: grid;
  grid-template-columns: 1fr 120px 1fr;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%);
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid rgba(16, 185, 129, 0.15);
}

.purchase-row {
  display: grid;
  grid-template-columns: 1fr 120px 1fr;
  gap: 12px;
  padding: 14px 16px;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background-color 0.2s ease;
}

.purchase-row:last-child {
  border-bottom: none;
}

.purchase-row:hover {
  background-color: rgba(16, 185, 129, 0.04);
}

.purchase-row.is-even {
  background-color: rgba(0, 0, 0, 0.01);
}

.purchase-row.is-even:hover {
  background-color: rgba(16, 185, 129, 0.06);
}

.purchase-row.is-extra {
  background-color: rgba(245, 158, 11, 0.04);
}

.purchase-row.is-extra:hover {
  background-color: rgba(245, 158, 11, 0.08);
}

.col-name {
  display: flex;
  align-items: center;
}

.ingredient-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.col-quantity {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.quantity-value {
  font-size: 18px;
  font-weight: 700;
  color: #10b981;
}

.purchase-row.is-extra .quantity-value {
  color: #f59e0b;
}

.quantity-unit {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.col-source {
  display: flex;
  align-items: center;
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.source-tag {
  cursor: default;
  border-radius: 12px;
}

.source-tag .portions-badge {
  margin-left: 2px;
  font-weight: 600;
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
  flex: 1 1 45%;
  min-width: 0;
}

.extra-quantity {
  flex: 0 0 18%;
  min-width: 150px;
}

.extra-quantity :deep(.el-input-number) {
  width: 100%;
}

.extra-unit {
  flex: 0 0 15%;
  min-width: 120px;
}

.extra-actions {
  flex: 0 0 auto;
}

/* ================================
   响应式样式
   ================================ */

/* 平板端 (768px - 1024px) */
@media (max-width: 1024px) {
  .page-container {
    max-width: 100%;
  }

  .dish-header {
    gap: 12px;
    padding: 14px 16px;
  }

  .fab-container {
    right: 20px;
    bottom: 20px;
  }

  .fab-btn {
    width: 50px !important;
    height: 50px !important;
  }
}

/* 小平板 (576px - 768px) */
@media (max-width: 768px) {
  .page-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
  }

  .page-title {
    font-size: 18px;
  }

  .header-actions {
    gap: 8px;
  }

  .header-actions .el-button {
    padding: 8px 12px;
  }

  /* 卡片样式调整 */
  .info-card,
  .dishes-card,
  .summary-card,
  .extra-card {
    margin-bottom: 16px;
    border-radius: 10px;
  }

  .info-card :deep(.el-card__header),
  .dishes-card :deep(.el-card__header),
  .summary-card :deep(.el-card__header),
  .extra-card :deep(.el-card__header) {
    padding: 12px 16px;
  }

  .info-card :deep(.el-card__body),
  .dishes-card :deep(.el-card__body),
  .summary-card :deep(.el-card__body),
  .extra-card :deep(.el-card__body) {
    padding: 16px;
  }

  .card-header span {
    font-size: 15px;
  }

  .card-icon {
    font-size: 16px;
  }

  /* 菜品卡片 */
  .dish-list {
    gap: 16px;
  }

  .dish-item {
    border-radius: 10px;
  }

  .dish-header {
    gap: 10px;
    padding: 12px 14px;
    flex-wrap: wrap;
  }

  .index-badge {
    width: 28px;
    height: 28px;
    font-size: 13px;
    border-radius: 6px;
  }

  .dish-category :deep(.el-select) {
    width: 80px !important;
  }

  .portions-label {
    font-size: 12px;
  }

  /* 原料区域 */
  .ingredients-section {
    padding: 12px 14px;
  }

  .ingredients-title {
    font-size: 13px;
  }

  .ingredient-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    grid-template-rows: auto auto;
    padding: 10px;
    gap: 8px;
  }

  .ingredient-name {
    grid-column: 1 / -1;
    grid-row: 1;
  }

  .ingredient-quantity {
    grid-column: 1;
    grid-row: 2;
    min-width: 0;
  }

  .ingredient-unit {
    grid-column: 2;
    grid-row: 2;
    min-width: 90px;
  }

  .ingredient-summary {
    grid-column: 1 / -1;
    grid-row: 3;
    justify-self: start;
    flex-wrap: wrap;
    gap: 6px;
  }

  .ingredient-total {
    padding: 4px 10px;
  }

  .ingredient-total .total-label {
    font-size: 11px;
  }

  .ingredient-total .total-value {
    font-size: 13px;
  }

  .ingredient-price-btn {
    padding: 4px 10px;
  }

  .ingredient-price-btn .price-text {
    font-size: 12px;
  }

  .ingredient-actions {
    grid-column: 3;
    grid-row: 2;
    justify-self: end;
  }

  .extra-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    grid-template-rows: auto auto;
    gap: 8px;
    padding: 10px;
  }

  .extra-name {
    grid-column: 1 / -1;
    grid-row: 1;
  }

  .extra-quantity {
    grid-column: 1;
    grid-row: 2;
  }

  .extra-unit {
    grid-column: 2;
    grid-row: 2;
    min-width: 90px;
  }

  .extra-actions {
    grid-column: 3;
    grid-row: 2;
    justify-self: end;
  }

  /* 采购清单响应式 */
  .purchase-header {
    grid-template-columns: 1fr 100px 1fr;
    padding: 10px 14px;
    font-size: 12px;
  }

  .purchase-row {
    grid-template-columns: 1fr 100px 1fr;
    padding: 12px 14px;
  }

  .ingredient-name {
    font-size: 14px;
  }

  .quantity-value {
    font-size: 16px;
  }

  /* 添加按钮 */
  .add-dish-bottom {
    padding: 18px;
    font-size: 14px;
  }

  .add-extra-bottom {
    padding: 14px;
    font-size: 13px;
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

  .header-left {
    gap: 6px;
  }

  .back-btn {
    font-size: 18px;
    padding: 6px;
  }

  .page-title {
    font-size: 17px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .header-actions .el-button {
    flex: 1;
    justify-content: center;
  }

  /* 卡片调整 */
  .info-card,
  .dishes-card,
  .summary-card,
  .extra-card {
    margin-bottom: 12px;
    border-radius: 8px;
  }

  .info-card :deep(.el-card__header),
  .dishes-card :deep(.el-card__header),
  .summary-card :deep(.el-card__header),
  .extra-card :deep(.el-card__header) {
    padding: 10px 12px;
  }

  .info-card :deep(.el-card__body),
  .dishes-card :deep(.el-card__body),
  .summary-card :deep(.el-card__body),
  .extra-card :deep(.el-card__body) {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .card-header span {
    font-size: 14px;
  }

  /* 菜品名称快览 */
  .dish-names-preview {
    padding: 12px;
    margin-top: 6px;
  }

  .dish-names-label {
    font-size: 13px;
    margin-bottom: 10px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .dish-names-label .total-cost {
    font-size: 13px;
    padding: 3px 10px;
    margin-left: 0;
    flex-basis: 100%;
    text-align: center;
  }

  .dish-category-group {
    gap: 6px;
  }

  .category-label {
    font-size: 11px;
    padding: 3px 8px;
  }

  .dish-name-tag {
    font-size: 12px;
    padding: 4px 10px;
  }

  .dish-name-tag.with-price {
    padding: 4px 8px 4px 10px;
    gap: 4px;
  }

  .dish-tag-price {
    font-size: 10px;
    padding: 1px 5px;
  }

  .dish-tag-portions {
    font-size: 10px;
  }

  /* 菜品卡片 */
  .dish-list {
    gap: 12px;
  }

  .dish-item {
    border-radius: 8px;
  }

  /* 菜品头部布局：
     第一行: [序号] [菜谱名称 ─────────────]
     第二行: [分类] [份数] ────── [删除] */
  .dish-header {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    grid-template-rows: auto auto;
    gap: 8px;
    padding: 10px 12px;
    align-items: center;
  }

  .dish-index {
    grid-column: 1;
    grid-row: 1;
  }

  .index-badge {
    width: 26px;
    height: 26px;
    font-size: 12px;
    border-radius: 6px;
  }

  .dish-main {
    grid-column: 2 / -1;
    grid-row: 1;
    width: 100%;
  }

  .dish-category {
    grid-column: 1;
    grid-row: 2;
  }

  .dish-category :deep(.el-select) {
    width: 72px !important;
  }

  .dish-portions {
    grid-column: 2 / 4;
    grid-row: 2;
    justify-self: start;
    gap: 6px;
  }

  .portions-label {
    font-size: 12px;
  }

  .dish-portions :deep(.el-input-number) {
    width: 100px;
  }

  .dish-actions {
    grid-column: 4;
    grid-row: 2;
    justify-self: end;
  }

  .dish-actions .el-button {
    padding: 6px 12px;
    font-size: 13px;
    min-height: 32px;
  }

  /* 原料区域 */
  .ingredients-section {
    padding: 10px 12px;
  }

  .ingredients-header {
    margin-bottom: 10px;
  }

  .ingredients-title {
    font-size: 12px;
    gap: 4px;
  }

  .no-ingredients {
    padding: 14px;
    font-size: 12px;
  }

  .ingredients-list {
    gap: 8px;
  }

  /* 原料行布局：
     第一行: [原料名称]
     第二行: [数量] [单位] [删除] */
  .ingredient-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    grid-template-rows: auto auto;
    gap: 8px;
    padding: 10px;
  }

  .ingredient-name {
    grid-column: 1 / -1;
    grid-row: 1;
  }

  .ingredient-quantity {
    grid-column: 1;
    grid-row: 2;
  }

  .ingredient-quantity :deep(.el-input-number) {
    width: 100%;
  }

  .ingredient-unit {
    grid-column: 2;
    grid-row: 2;
    min-width: 80px;
  }

  .ingredient-summary {
    grid-column: 1 / -1;
    grid-row: 3;
    justify-self: start;
    flex-wrap: wrap;
    gap: 4px;
  }

  .ingredient-total {
    padding: 3px 8px;
  }

  .ingredient-total .total-label {
    font-size: 10px;
  }

  .ingredient-total .total-value {
    font-size: 12px;
  }

  .ingredient-price-btn {
    padding: 3px 8px;
  }

  .ingredient-price-btn .price-text {
    font-size: 11px;
  }

  .ingredient-price-btn .edit-icon {
    font-size: 10px;
  }

  .ingredient-actions {
    grid-column: 3;
    grid-row: 2;
    align-self: center;
  }

  .ingredient-actions .el-button {
    padding: 8px 10px;
    font-size: 16px;
    min-width: 36px;
    min-height: 36px;
  }

  /* 其他采购布局：
     第一行: [原料名称]
     第二行: [数量] [单位] [删除]
     第三行: [备注] */
  .extra-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    grid-template-rows: auto auto auto;
    gap: 8px;
    padding: 10px;
  }

  .extra-name {
    grid-column: 1 / -1;
    grid-row: 1;
  }

  .extra-quantity {
    grid-column: 1;
    grid-row: 2;
  }

  .extra-quantity :deep(.el-input-number) {
    width: 100%;
  }

  .extra-unit {
    grid-column: 2;
    grid-row: 2;
    min-width: 80px;
  }

  .extra-actions {
    grid-column: 3;
    grid-row: 2;
    align-self: center;
  }

  .extra-actions .el-button {
    padding: 8px 10px;
    font-size: 16px;
    min-width: 36px;
    min-height: 36px;
  }

  /* 汇总操作按钮 */
  .summary-actions {
    flex-direction: row;
    gap: 8px;
    width: 100%;
  }

  .summary-actions .el-button {
    margin: 0;
    flex: 1;
    padding: 8px 10px;
    font-size: 13px;
  }

  /* 采购清单手机端样式 */
  .purchase-header {
    display: none;
  }

  .purchase-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .purchase-row .col-name {
    flex: 1 1 50%;
    min-width: 0;
  }

  .purchase-row .col-quantity {
    flex: 0 0 auto;
    background: rgba(16, 185, 129, 0.1);
    padding: 4px 10px;
    border-radius: 16px;
  }

  .purchase-row.is-extra .col-quantity {
    background: rgba(245, 158, 11, 0.1);
  }

  .purchase-row .col-source {
    flex: 1 1 100%;
    margin-top: 4px;
  }

  .ingredient-name {
    font-size: 14px;
  }

  .quantity-value {
    font-size: 14px;
  }

  .quantity-unit {
    font-size: 12px;
  }

  .source-tags {
    gap: 4px;
  }

  .source-tag {
    font-size: 11px;
    padding: 2px 8px;
  }

  /* 添加按钮 */
  .add-dish-bottom {
    padding: 16px;
    font-size: 13px;
    border-radius: 8px;
  }

  .add-dish-bottom .el-icon {
    font-size: 18px;
  }

  .add-extra-bottom {
    padding: 12px;
    font-size: 12px;
    border-radius: 8px;
    margin-top: 10px;
  }

  /* 悬浮按钮 */
  .fab-container {
    right: 16px;
    bottom: 16px;
  }

  .fab-btn {
    width: 48px !important;
    height: 48px !important;
  }

  .fab-btn :deep(.el-icon) {
    font-size: 20px !important;
  }

  /* 空状态 */
  .empty-state {
    padding: 30px 0;
  }
}

/* 超小屏幕 (<400px) */
@media (max-width: 400px) {
  .page-title {
    font-size: 16px;
  }

  .header-actions .el-button {
    padding: 6px 10px;
    font-size: 13px;
  }

  .dish-header {
    padding: 8px 10px;
    gap: 6px;
  }

  .index-badge {
    width: 24px;
    height: 24px;
    font-size: 11px;
  }

  .dish-category :deep(.el-select) {
    width: 64px !important;
  }

  .dish-portions :deep(.el-input-number) {
    width: 90px;
  }

  .ingredients-section {
    padding: 8px 10px;
  }

  .ingredient-row,
  .extra-row {
    padding: 8px;
    gap: 6px;
  }

  .ingredient-unit,
  .extra-unit {
    min-width: 70px;
  }

  .ingredient-actions .el-button,
  .extra-actions .el-button {
    padding: 6px 8px;
    min-width: 32px;
    min-height: 32px;
    font-size: 14px;
  }

  .purchase-row {
    padding: 10px;
  }

  .ingredient-name {
    font-size: 13px;
  }

  .quantity-value {
    font-size: 13px;
  }

  .add-dish-bottom {
    padding: 14px;
    font-size: 12px;
  }

  .fab-container {
    right: 12px;
    bottom: 12px;
  }

  .fab-btn {
    width: 44px !important;
    height: 44px !important;
  }
}
</style>
