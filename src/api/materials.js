import pb from './index'

const COLLECTION = 'cart_materials'

/**
 * 原料 API
 */
export const materialsApi = {
  /**
   * 获取原料列表
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
   * 获取所有原料（不分页）
   */
  async getAll() {
    return await pb.collection(COLLECTION).getFullList({
      sort: 'name',
    })
  },

  /**
   * 搜索原料
   * @param {string} keyword 搜索关键词
   */
  async search(keyword) {
    return await pb.collection(COLLECTION).getFullList({
      filter: `name ~ "${keyword}"`,
      sort: 'name',
    })
  },

  /**
   * 获取单个原料
   * @param {string} id 原料ID
   */
  async getOne(id) {
    return await pb.collection(COLLECTION).getOne(id)
  },

  /**
   * 创建原料
   * @param {object} data 原料数据
   */
  async create(data) {
    return await pb.collection(COLLECTION).create(data)
  },

  /**
   * 批量创建原料
   * @param {array} items 原料数组
   */
  async createMany(items) {
    const results = []
    for (const item of items) {
      try {
        const result = await pb.collection(COLLECTION).create(item)
        results.push(result)
      } catch (error) {
        console.error('创建原料失败:', item, error)
      }
    }
    return results
  },

  /**
   * 更新原料
   * @param {string} id 原料ID
   * @param {object} data 更新数据
   */
  async update(id, data) {
    return await pb.collection(COLLECTION).update(id, data)
  },

  /**
   * 删除原料
   * @param {string} id 原料ID
   */
  async delete(id) {
    return await pb.collection(COLLECTION).delete(id)
  },
}

export default materialsApi

