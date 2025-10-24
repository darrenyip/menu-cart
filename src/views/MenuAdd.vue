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
      <h2 style="margin: 0; color: #303133">新增菜单</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="saveMenu">保存菜单</el-button>
      </div>
    </div>

    <!-- 菜单基本信息 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>菜单信息</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="菜单名称">
            <el-input
              v-model="menuForm.name"
              placeholder="点击修改菜单名称"
              @focus="onMenuNameFocus"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="菜单日期">
            <el-date-picker
              v-model="menuForm.date"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
              @change="onDateChange"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-card>

    <!-- 菜品列表 -->
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>菜品列表</span>
          <el-button type="primary" size="small" @click="addDish">
            <el-icon><Plus /></el-icon>添加菜品
          </el-button>
        </div>
      </template>

      <el-table :data="dishList" style="width: 100%" :row-style="{ height: 'auto' }">
        <el-table-column type="index" label="序号" width="80" align="center"></el-table-column>
        <el-table-column label="菜品名称" width="200">
          <template #default="scope">
            <el-autocomplete
              v-model="scope.row.name"
              :fetch-suggestions="searchRecipes"
              placeholder="搜索菜谱或输入新菜品"
              style="width: 100%"
              @select="(item) => selectRecipe(scope.$index, item)"
              clearable
            />
          </template>
        </el-table-column>
        <el-table-column label="份数" width="100" align="center">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.portions"
              :min="1"
              :max="999"
              placeholder="份数"
              style="width: 100%"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="原材料" min-width="500">
          <template #default="scope">
            <div
              style="
                margin-bottom: 12px;
                padding: 8px;
                border: 1px solid #f0f0f0;
                border-radius: 4px;
                background-color: #fafafa;
              "
              v-for="(ingredient, index) in scope.row.ingredients"
              :key="index"
            >
              <el-row :gutter="12">
                <el-col :span="9">
                  <el-autocomplete
                    v-model="ingredient.name"
                    :fetch-suggestions="searchIngredients"
                    placeholder="搜索原料或输入新原料"
                    style="width: 100%"
                    @select="(item) => selectIngredient(scope.$index, index, item)"
                    clearable
                    size="small"
                  />
                </el-col>
                <el-col :span="6">
                  <el-input-number
                    v-model="ingredient.quantity"
                    :min="0"
                    :precision="2"
                    placeholder="数量"
                    style="width: 100%"
                    size="small"
                  />
                </el-col>
                <el-col :span="5">
                  <el-select
                    v-model="ingredient.unit"
                    placeholder="单位"
                    style="width: 100%"
                    filterable
                    size="small"
                  >
                    <el-option
                      v-for="unit in unitList"
                      :key="unit.value"
                      :label="unit.label"
                      :value="unit.value"
                    />
                  </el-select>
                </el-col>
                <el-col :span="4">
                  <el-button
                    type="danger"
                    size="small"
                    text
                    @click="removeIngredient(scope.$index, index)"
                    style="width: 100%"
                  >
                    <el-icon><Delete /></el-icon>删除
                  </el-button>
                </el-col>
              </el-row>
            </div>
            <el-button type="primary" size="small" text @click="addIngredient(scope.$index)">
              <el-icon><Plus /></el-icon>添加原料
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="scope">
            <el-button type="danger" size="small" text @click="removeDish(scope.$index)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 原料汇总 -->
    <el-card v-if="ingredientSummary.length > 0">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>原料汇总</span>
          <el-button type="primary" size="small" @click="copyToClipboard">
            <el-icon><CopyDocument /></el-icon>复制到剪切板
          </el-button>
        </div>
      </template>
      <el-table :data="ingredientSummary" style="width: 100%">
        <el-table-column prop="name" label="原料名称" width="200"></el-table-column>
        <el-table-column prop="totalQuantity" label="总需求量" width="120" align="center">
          <template #default="scope">
            {{ scope.row.displayQuantity }} {{ scope.row.displayUnit }}
          </template>
        </el-table-column>
        <el-table-column prop="dishes" label="用于菜品" min-width="350">
          <template #default="scope">
            <el-tag
              v-for="dish in scope.row.dishes"
              :key="dish.name + dish.portions"
              size="small"
              style="margin-right: 5px; margin-bottom: 5px"
            >
              {{ dish.name }} {{ dish.portions }}份 ({{ dish.displayQuantity
              }}{{ dish.displayUnit }})
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { Plus, Delete, CopyDocument } from '@element-plus/icons-vue'

export default {
  name: 'MenuAdd',
  components: {
    Plus,
    Delete,
    CopyDocument,
  },
  data() {
    return {
      menuForm: {
        name: '',
        date: null,
      },
      dishList: [],
      // 模拟菜谱数据
      recipeList: [
        {
          value: '番茄炒蛋',
          name: '番茄炒蛋',
          ingredients: [
            { name: '番茄', quantity: 2, unit: '个' },
            { name: '鸡蛋', quantity: 3, unit: '个' },
          ],
        },
        {
          value: '红烧肉',
          name: '红烧肉',
          ingredients: [
            { name: '五花肉', quantity: 500, unit: '克' },
            { name: '生抽', quantity: 2, unit: '勺' },
            { name: '老抽', quantity: 1, unit: '勺' },
          ],
        },
        {
          value: '冬瓜排骨汤',
          name: '冬瓜排骨汤',
          ingredients: [
            { name: '冬瓜', quantity: 300, unit: '克' },
            { name: '排骨', quantity: 400, unit: '克' },
          ],
        },
      ],
      // 模拟原料数据
      ingredientList: [
        { value: '番茄', name: '番茄', unit: '个' },
        { value: '鸡蛋', name: '鸡蛋', unit: '个' },
        { value: '五花肉', name: '五花肉', unit: '克' },
        { value: '冬瓜', name: '冬瓜', unit: '克' },
        { value: '排骨', name: '排骨', unit: '克' },
        { value: '生抽', name: '生抽', unit: '勺' },
        { value: '老抽', name: '老抽', unit: '勺' },
      ],
      // 模拟单位数据
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
  computed: {
    ingredientSummary() {
      const summary = {}

      this.dishList.forEach((dish) => {
        // 获取菜品份数，默认为1
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
            }
          }

          // 计算实际需要的数量：原料数量 × 份数
          const actualQuantity = ingredient.quantity * portions
          summary[key].totalQuantity += actualQuantity
          summary[key].dishes.push({
            name: dish.name,
            quantity: actualQuantity,
            unit: ingredient.unit || '份',
            portions: portions, // 记录份数信息
          })
        })
      })

      // 转换重量单位为公斤并格式化显示
      return Object.values(summary).map((item) => {
        const converted = this.convertToKilogram(item.totalQuantity, item.originalUnit)
        return {
          ...item,
          displayQuantity: converted.quantity,
          displayUnit: converted.unit,
          dishes: item.dishes.map((dish) => {
            const dishConverted = this.convertToKilogram(dish.quantity, dish.unit)
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
    this.generateDefaultMenuName()
    this.addDish() // 默认添加一个菜品行
    this.loadUnits() // 加载单位数据
  },
  methods: {
    generateDefaultMenuName() {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const month = tomorrow.getMonth() + 1
      const date = tomorrow.getDate()
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      const weekday = weekdays[tomorrow.getDay()]

      this.menuForm.name = `${month}月${date}日${weekday}菜单`
      this.menuForm.date = tomorrow
    },

    onMenuNameFocus() {
      // 当用户点击菜单名称输入框时，可以自由编辑
    },

    onDateChange(date) {
      if (date) {
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
        portions: 1, // 默认1份
        ingredients: [{ name: '', quantity: null, unit: '' }],
      })
    },

    removeDish(index) {
      this.dishList.splice(index, 1)
    },

    addIngredient(dishIndex) {
      this.dishList[dishIndex].ingredients.push({
        name: '',
        quantity: null,
        unit: '',
      })
    },

    removeIngredient(dishIndex, ingredientIndex) {
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
      // 选择菜谱后自动填入原料信息
      this.dishList[dishIndex].name = recipe.name
      this.dishList[dishIndex].ingredients = recipe.ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
      }))
      // 保持份数不变，如果没有份数则设为1
      if (!this.dishList[dishIndex].portions) {
        this.dishList[dishIndex].portions = 1
      }
    },

    selectIngredient(dishIndex, ingredientIndex, ingredient) {
      // 选择原料后自动填入单位
      this.dishList[dishIndex].ingredients[ingredientIndex].name = ingredient.name
      // 只有当前单位为空时才自动填入，否则保持用户选择的单位
      if (!this.dishList[dishIndex].ingredients[ingredientIndex].unit) {
        this.dishList[dishIndex].ingredients[ingredientIndex].unit = ingredient.unit
      }
    },

    saveMenu() {
      if (!this.menuForm.name) {
        this.$message.error('请输入菜单名称')
        return
      }

      if (this.dishList.length === 0) {
        this.$message.error('请至少添加一个菜品')
        return
      }

      // 验证菜品信息
      for (let i = 0; i < this.dishList.length; i++) {
        const dish = this.dishList[i]
        if (!dish.name) {
          this.$message.error(`请输入第${i + 1}个菜品的名称`)
          return
        }

        if (!dish.portions || dish.portions < 1) {
          this.$message.error(`请输入第${i + 1}个菜品的正确份数`)
          return
        }

        for (let j = 0; j < dish.ingredients.length; j++) {
          const ingredient = dish.ingredients[j]
          if (!ingredient.name || !ingredient.quantity) {
            this.$message.error(`第${i + 1}个菜品的第${j + 1}个原料信息不完整`)
            return
          }
        }
      }

      // 构造保存数据
      const menuData = {
        name: this.menuForm.name,
        date: this.menuForm.date,
        dishes: this.dishList,
        ingredientSummary: this.ingredientSummary,
      }

      console.log('保存菜单数据:', menuData)
      this.$message.success('菜单保存成功！')

      // 这里应该调用后端API保存数据
      // 保存成功后返回列表页
      setTimeout(() => {
        this.goBack()
      }, 1500)
    },

    goBack() {
      this.$router.push('/menu')
    },

    // 从后端加载单位数据
    async loadUnits() {
      try {
        // 这里应该调用后端API获取单位数据
        // const response = await this.$http.get('/api/units')
        // this.unitList = response.data

        // 目前使用模拟数据，实际开发时替换为真实API调用
        console.log('加载单位数据完成')
      } catch (error) {
        console.error('加载单位数据失败:', error)
        this.$message.error('加载单位数据失败')
      }
    },

    // 重量单位转换为公斤
    convertToKilogram(quantity, unit) {
      // 定义重量单位转换比例（转换为公斤）
      const weightUnits = {
        克: 0.001,
        千克: 1,
        公斤: 1,
        斤: 0.5,
        两: 0.05,
      }

      // 如果是重量单位，进行转换
      if (weightUnits[unit]) {
        const kgQuantity = quantity * weightUnits[unit]

        // 根据数量大小选择合适的单位显示
        if (kgQuantity >= 1) {
          // 大于等于1公斤，显示公斤，保留2位小数
          return {
            quantity: parseFloat(kgQuantity.toFixed(2)),
            unit: '公斤',
          }
        } else if (kgQuantity >= 0.001) {
          // 小于1公斤但大于等于1克，显示克，取整
          return {
            quantity: Math.round(kgQuantity * 1000),
            unit: '克',
          }
        } else {
          // 非常小的量，显示原始数量和单位
          return {
            quantity: quantity,
            unit: unit,
          }
        }
      }

      // 非重量单位，保持原样
      return {
        quantity: quantity,
        unit: unit,
      }
    },

    // 复制原料汇总到剪切板
    async copyToClipboard() {
      try {
        // 生成复制文本，格式：原料名称 数量单位
        const copyText = this.ingredientSummary
          .map((item) => `${item.name} ${item.displayQuantity}${item.displayUnit}`)
          .join('\n')

        // 使用现代浏览器的剪切板API
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(copyText)
        } else {
          // 降级方案：使用传统的document.execCommand
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

        this.$message.success('原料清单已复制到剪切板')
      } catch (error) {
        console.error('复制失败:', error)
        this.$message.error('复制失败，请手动复制')
      }
    },
  },
}
</script>

<style scoped>
.el-form-item {
  margin-bottom: 20px;
}

.el-table .el-input,
.el-table .el-input-number {
  border: none;
  box-shadow: none;
}

.el-table .el-input:focus,
.el-table .el-input-number:focus {
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

/* 原材料区域样式优化 */
.ingredient-item {
  margin-bottom: 12px;
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.ingredient-item:hover {
  border-color: #409eff;
  background-color: #f0f8ff;
}

/* 表格内按钮样式 */
.el-table .el-button--small {
  padding: 5px 8px;
  font-size: 12px;
}

/* 输入框在表格中的样式 */
.el-table .el-autocomplete,
.el-table .el-select,
.el-table .el-input-number {
  width: 100%;
}
</style>
