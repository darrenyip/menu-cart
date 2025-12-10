import pb from './index'

const COLLECTION = 'cart_menus'
const DISHES_COLLECTION = 'cart_menu_dishes'
const DISH_MATERIALS_COLLECTION = 'cart_menu_dish_materials'

/**
 * 菜单 API
 * 注意：所有请求都添加 requestKey: null 来禁用 PocketBase 的自动取消功能
 */
export const menusApi = {
  /**
   * 获取菜单列表
   * @param {number} page 页码
   * @param {number} perPage 每页数量
   * @param {object} options 其他选项
   */
  async getList(page = 1, perPage = 20, options = {}) {
    const result = await pb.collection(COLLECTION).getList(page, perPage, {
      sort: '-created',
      requestKey: null,
      ...options,
    })

    // 为每个菜单计算菜品数量
    const menusWithCount = await Promise.all(
      result.items.map(async (menu) => {
        const dishes = await pb.collection(DISHES_COLLECTION).getFullList({
          filter: `menu = "${menu.id}"`,
          requestKey: null,
        })
        return {
          ...menu,
          dishCount: dishes.length,
        }
      })
    )

    return {
      ...result,
      items: menusWithCount,
    }
  },

  /**
   * 获取单个菜单详情（包含菜品和原料）
   * @param {string} id 菜单ID
   */
  async getOne(id) {
    const menu = await pb.collection(COLLECTION).getOne(id, { requestKey: null })

    // 获取菜单的所有菜品
    const dishes = await pb.collection(DISHES_COLLECTION).getFullList({
      filter: `menu = "${id}"`,
      sort: 'sort',
      expand: 'recipe',
      requestKey: null,
    })

    // 获取每个菜品的原料
    const dishesWithMaterials = await Promise.all(
      dishes.map(async (dish) => {
        const materials = await pb.collection(DISH_MATERIALS_COLLECTION).getFullList({
          filter: `menu_dish = "${dish.id}"`,
          expand: 'material',
          requestKey: null,
        })
        return {
          ...dish,
          ingredients: materials.map((m) => ({
            id: m.id,
            materialId: m.material,
            name: m.name,
            quantity: m.quantity,
            unit: m.unit,
          })),
        }
      })
    )

    return {
      ...menu,
      dishes: dishesWithMaterials,
    }
  },

  /**
   * 创建菜单
   * @param {object} data 菜单数据 { name, extra_purchases }
   * @param {array} dishes 菜品列表
   */
  async create(data, dishes = []) {
    // 创建菜单（包含额外采购数据）
    const menu = await pb.collection(COLLECTION).create(
      {
        name: data.name,
        extra_purchases: data.extra_purchases || [],
      },
      { requestKey: null }
    )

    // 创建菜品和原料
    for (let i = 0; i < dishes.length; i++) {
      const dish = dishes[i]

      // 创建菜品
      const createdDish = await pb.collection(DISHES_COLLECTION).create(
        {
          menu: menu.id,
          recipe: dish.recipeId || null,
          name: dish.name,
          category: dish.category || '',
          portions: dish.portions || 1,
          sort: i,
        },
        { requestKey: null }
      )

      // 创建菜品原料
      if (dish.ingredients && dish.ingredients.length > 0) {
        for (const ingredient of dish.ingredients) {
          if (ingredient.name && ingredient.quantity) {
            await pb.collection(DISH_MATERIALS_COLLECTION).create(
              {
                menu_dish: createdDish.id,
                material: ingredient.materialId || null,
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit || '',
              },
              { requestKey: null }
            )
          }
        }
      }
    }

    return menu
  },

  /**
   * 更新菜单
   * @param {string} id 菜单ID
   * @param {object} data 更新数据 { name, extra_purchases }
   * @param {array} dishes 菜品列表
   */
  async update(id, data, dishes = []) {
    // 更新菜单基本信息（包含额外采购数据）
    const menu = await pb.collection(COLLECTION).update(
      id,
      {
        name: data.name,
        extra_purchases: data.extra_purchases || [],
      },
      { requestKey: null }
    )

    // 删除旧的菜品和原料
    const oldDishes = await pb.collection(DISHES_COLLECTION).getFullList({
      filter: `menu = "${id}"`,
      requestKey: null,
    })

    for (const oldDish of oldDishes) {
      // 删除菜品的原料
      const oldMaterials = await pb.collection(DISH_MATERIALS_COLLECTION).getFullList({
        filter: `menu_dish = "${oldDish.id}"`,
        requestKey: null,
      })
      for (const oldMaterial of oldMaterials) {
        await pb.collection(DISH_MATERIALS_COLLECTION).delete(oldMaterial.id, { requestKey: null })
      }
      // 删除菜品
      await pb.collection(DISHES_COLLECTION).delete(oldDish.id, { requestKey: null })
    }

    // 创建新的菜品和原料
    for (let i = 0; i < dishes.length; i++) {
      const dish = dishes[i]

      const createdDish = await pb.collection(DISHES_COLLECTION).create(
        {
          menu: id,
          recipe: dish.recipeId || null,
          name: dish.name,
          category: dish.category || '',
          portions: dish.portions || 1,
          sort: i,
        },
        { requestKey: null }
      )

      if (dish.ingredients && dish.ingredients.length > 0) {
        for (const ingredient of dish.ingredients) {
          if (ingredient.name && ingredient.quantity) {
            await pb.collection(DISH_MATERIALS_COLLECTION).create(
              {
                menu_dish: createdDish.id,
                material: ingredient.materialId || null,
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit || '',
              },
              { requestKey: null }
            )
          }
        }
      }
    }

    return menu
  },

  /**
   * 删除菜单
   * @param {string} id 菜单ID
   */
  async delete(id) {
    // 获取菜单的所有菜品
    const dishes = await pb.collection(DISHES_COLLECTION).getFullList({
      filter: `menu = "${id}"`,
      requestKey: null,
    })

    // 删除每个菜品的原料和菜品本身
    for (const dish of dishes) {
      const materials = await pb.collection(DISH_MATERIALS_COLLECTION).getFullList({
        filter: `menu_dish = "${dish.id}"`,
        requestKey: null,
      })
      for (const material of materials) {
        await pb.collection(DISH_MATERIALS_COLLECTION).delete(material.id, { requestKey: null })
      }
      await pb.collection(DISHES_COLLECTION).delete(dish.id, { requestKey: null })
    }

    // 删除菜单
    return await pb.collection(COLLECTION).delete(id, { requestKey: null })
  },

  /**
   * 计算菜单的原料汇总
   * @param {string} id 菜单ID
   */
  async getIngredientSummary(id) {
    const menuData = await this.getOne(id)
    const summary = {}

    for (const dish of menuData.dishes) {
      const portions = dish.portions || 1

      for (const ingredient of dish.ingredients) {
        if (!ingredient.name || !ingredient.quantity) continue

        const key = ingredient.name
        if (!summary[key]) {
          summary[key] = {
            name: ingredient.name,
            unit: ingredient.unit || '',
            totalQuantity: 0,
            dishes: [],
          }
        }

        const actualQuantity = ingredient.quantity * portions
        summary[key].totalQuantity += actualQuantity
        summary[key].dishes.push({
          name: dish.name,
          portions,
          quantity: actualQuantity,
          unit: ingredient.unit,
        })
      }
    }

    return Object.values(summary)
  },
}

export default menusApi

