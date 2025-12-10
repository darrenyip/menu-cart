import pb from './index'
import materialPricesApi from './materialPrices'

const COLLECTION = 'cart_materials'

/**
 * 原料 API
 * 注意：所有请求都添加 requestKey: null 来禁用 PocketBase 的自动取消功能
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
      requestKey: null,
      ...options,
    })
  },

  /**
   * 获取所有原料（不分页）
   */
  async getAll() {
    return await pb.collection(COLLECTION).getFullList({
      sort: 'name',
      requestKey: null,
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
      requestKey: null,
    })
  },

  /**
   * 获取单个原料
   * @param {string} id 原料ID
   */
  async getOne(id) {
    return await pb.collection(COLLECTION).getOne(id, { requestKey: null })
  },

  /**
   * 创建原料
   * @param {object} data 原料数据
   */
  async create(data) {
    const result = await pb.collection(COLLECTION).create(data, { requestKey: null })
    
    // 自动记录初始价格
    if (data.purchase_price) {
      try {
        await materialPricesApi.create({
          material: result.id,
          price: data.purchase_price,
          supplier: data.supplier || '',
          note: '初始价格',
        })
      } catch (error) {
        console.warn('记录初始价格失败:', error)
      }
    }
    
    return result
  },

  /**
   * 批量创建原料
   * @param {array} items 原料数组
   */
  async createMany(items) {
    const results = []
    for (const item of items) {
      try {
        const result = await pb.collection(COLLECTION).create(item, { requestKey: null })
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
   * @param {object} options 选项 { recordPriceChange: true }
   */
  async update(id, data, options = { recordPriceChange: true }) {
    const result = await pb.collection(COLLECTION).update(id, data, { requestKey: null })
    
    // 自动记录价格变化
    if (options.recordPriceChange && data.purchase_price !== undefined) {
      try {
        await materialPricesApi.recordIfChanged(id, data.purchase_price, data.supplier || '')
      } catch (error) {
        console.warn('记录价格变化失败:', error)
      }
    }
    
    return result
  },

  /**
   * 删除原料
   * @param {string} id 原料ID
   */
  async delete(id) {
    return await pb.collection(COLLECTION).delete(id, { requestKey: null })
  },
}

export default materialsApi

