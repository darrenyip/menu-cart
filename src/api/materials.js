import pb, { uniqueReq } from './index'
import materialPricesApi from './materialPrices'

const COLLECTION = 'cart_materials'

/**
 * 原料 API
 * 使用 uniqueReq() 为每个请求生成唯一标识，彻底避免请求被自动取消
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
      ...uniqueReq(),
      ...options,
    })
  },

  /**
   * 获取所有原料（不分页）
   */
  async getAll() {
    return await pb.collection(COLLECTION).getFullList({
      sort: 'name',
      ...uniqueReq(),
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
      ...uniqueReq(),
    })
  },

  /**
   * 获取单个原料
   * @param {string} id 原料ID
   */
  async getOne(id) {
    return await pb.collection(COLLECTION).getOne(id, uniqueReq())
  },

  /**
   * 创建原料
   * @param {object} data 原料数据
   */
  async create(data) {
    const result = await pb.collection(COLLECTION).create(data, uniqueReq())
    
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
        const result = await pb.collection(COLLECTION).create(item, uniqueReq())
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
    const result = await pb.collection(COLLECTION).update(id, data, uniqueReq())
    
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
    return await pb.collection(COLLECTION).delete(id, uniqueReq())
  },
}

export default materialsApi

