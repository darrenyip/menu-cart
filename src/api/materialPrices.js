import pb from './index'

const COLLECTION = 'cart_material_prices'

/**
 * 原料价格历史 API
 * 注意：所有请求都添加 requestKey: null 来禁用 PocketBase 的自动取消功能
 */
export const materialPricesApi = {
  /**
   * 获取某原料的价格历史列表
   * @param {string} materialId 原料ID
   * @param {number} page 页码
   * @param {number} perPage 每页数量
   */
  async getList(materialId, page = 1, perPage = 50) {
    return await pb.collection(COLLECTION).getList(page, perPage, {
      filter: `material = "${materialId}"`,
      sort: '-date,-created',
      requestKey: null,
    })
  },

  /**
   * 获取某原料的所有价格历史（不分页，用于图表）
   * @param {string} materialId 原料ID
   */
  async getAll(materialId) {
    return await pb.collection(COLLECTION).getFullList({
      filter: `material = "${materialId}"`,
      sort: 'date,created',
      requestKey: null,
    })
  },

  /**
   * 获取某原料最近一条价格记录
   * @param {string} materialId 原料ID
   */
  async getLatest(materialId) {
    try {
      const result = await pb.collection(COLLECTION).getList(1, 1, {
        filter: `material = "${materialId}"`,
        sort: '-date,-created',
        requestKey: null,
      })
      return result.items[0] || null
    } catch {
      return null
    }
  },

  /**
   * 记录价格变化
   * @param {object} data 价格数据 { material, price, date, supplier, note }
   */
  async create(data) {
    return await pb.collection(COLLECTION).create(
      {
        material: data.material,
        price: data.price,
        date: data.date || new Date().toISOString().split('T')[0],
        supplier: data.supplier || '',
        note: data.note || '',
      },
      { requestKey: null }
    )
  },

  /**
   * 检查并记录价格变化（如果价格有变化才记录）
   * @param {string} materialId 原料ID
   * @param {number} newPrice 新价格
   * @param {string} supplier 供应商
   * @param {string} note 备注
   */
  async recordIfChanged(materialId, newPrice, supplier = '', note = '') {
    const latest = await this.getLatest(materialId)
    
    // 如果没有历史记录，或者价格有变化，就记录
    if (!latest || latest.price !== newPrice) {
      return await this.create({
        material: materialId,
        price: newPrice,
        supplier: supplier,
        note: note || (latest ? '价格更新' : '初始价格'),
      })
    }
    return null
  },

  /**
   * 删除价格记录
   * @param {string} id 记录ID
   */
  async delete(id) {
    return await pb.collection(COLLECTION).delete(id, { requestKey: null })
  },

  /**
   * 更新价格记录
   * @param {string} id 记录ID
   * @param {object} data 更新数据
   */
  async update(id, data) {
    return await pb.collection(COLLECTION).update(id, data, { requestKey: null })
  },
}

export default materialPricesApi

