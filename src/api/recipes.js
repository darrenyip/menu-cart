import pb from './index'

const COLLECTION = 'cart_recipes'
const MATERIALS_COLLECTION = 'cart_recipe_materials'

/**
 * 菜谱 API
 */
export const recipesApi = {
  /**
   * 获取菜谱列表
   * @param {number} page 页码
   * @param {number} perPage 每页数量
   * @param {object} options 其他选项
   */
  async getList(page = 1, perPage = 20, options = {}) {
    return await pb.collection(COLLECTION).getList(page, perPage, {
      sort: '-created',
      ...options,
    })
  },

  /**
   * 获取所有菜谱（不分页）
   */
  async getAll() {
    return await pb.collection(COLLECTION).getFullList({
      sort: 'name',
    })
  },

  /**
   * 搜索菜谱
   * @param {string} keyword 搜索关键词
   */
  async search(keyword) {
    return await pb.collection(COLLECTION).getFullList({
      filter: `name ~ "${keyword}"`,
      sort: 'name',
    })
  },

  /**
   * 获取单个菜谱（包含原料）
   * @param {string} id 菜谱ID
   */
  async getOne(id) {
    const recipe = await pb.collection(COLLECTION).getOne(id)
    // 获取菜谱的原料
    const materials = await pb.collection(MATERIALS_COLLECTION).getFullList({
      filter: `recipe = "${id}"`,
      expand: 'material',
    })
    return {
      ...recipe,
      materials,
    }
  },

  /**
   * 获取菜谱及其原料列表（用于自动补全）
   */
  async getAllWithMaterials() {
    const recipes = await pb.collection(COLLECTION).getFullList({
      sort: 'name',
    })

    // 获取所有菜谱的原料
    const recipesWithMaterials = await Promise.all(
      recipes.map(async (recipe) => {
        const materials = await pb.collection(MATERIALS_COLLECTION).getFullList({
          filter: `recipe = "${recipe.id}"`,
        })
        return {
          ...recipe,
          ingredients: materials.map((m) => ({
            name: m.name,
            quantity: m.quantity,
            unit: m.unit,
          })),
        }
      })
    )

    return recipesWithMaterials
  },

  /**
   * 创建菜谱
   * @param {object} data 菜谱数据
   * @param {array} materials 原料列表
   */
  async create(data, materials = []) {
    // 创建菜谱
    const recipe = await pb.collection(COLLECTION).create(data)

    // 创建菜谱原料关联
    if (materials.length > 0) {
      for (const material of materials) {
        await pb.collection(MATERIALS_COLLECTION).create({
          recipe: recipe.id,
          material: material.materialId || null,
          name: material.name,
          quantity: material.quantity,
          unit: material.unit,
        })
      }
    }

    return recipe
  },

  /**
   * 更新菜谱
   * @param {string} id 菜谱ID
   * @param {object} data 更新数据
   * @param {array} materials 原料列表
   */
  async update(id, data, materials = []) {
    // 更新菜谱基本信息
    const recipe = await pb.collection(COLLECTION).update(id, data)

    // 删除旧的原料关联
    const oldMaterials = await pb.collection(MATERIALS_COLLECTION).getFullList({
      filter: `recipe = "${id}"`,
    })
    for (const old of oldMaterials) {
      await pb.collection(MATERIALS_COLLECTION).delete(old.id)
    }

    // 创建新的原料关联
    if (materials.length > 0) {
      for (const material of materials) {
        await pb.collection(MATERIALS_COLLECTION).create({
          recipe: id,
          material: material.materialId || null,
          name: material.name,
          quantity: material.quantity,
          unit: material.unit,
        })
      }
    }

    return recipe
  },

  /**
   * 删除菜谱
   * @param {string} id 菜谱ID
   */
  async delete(id) {
    // 先删除关联的原料（如果没有设置级联删除）
    const materials = await pb.collection(MATERIALS_COLLECTION).getFullList({
      filter: `recipe = "${id}"`,
    })
    for (const material of materials) {
      await pb.collection(MATERIALS_COLLECTION).delete(material.id)
    }

    // 删除菜谱
    return await pb.collection(COLLECTION).delete(id)
  },
}

export default recipesApi

