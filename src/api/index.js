import PocketBase from 'pocketbase'

// 根据当前环境选择合适的PocketBase服务器地址
// 开发环境使用VITE_PB_URL，生产环境使用VITE_PB_PRODUCTION
const pbUrl =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_PB_PRODUCTION
    : import.meta.env.VITE_PB_URL

// 创建PocketBase客户端实例
const pb = new PocketBase(pbUrl)

// 禁用自动取消请求
pb.autoCancellation(false)

/**
 * 自增计数器，确保并发请求的 requestKey 绝对唯一
 */
let reqCounter = 0

/**
 * 生成唯一的请求选项，彻底避免请求被自动取消
 * 使用自增计数器 + 随机字符串，即使在 Promise.all 并发场景下也能保证唯一性
 */
export function uniqueReq() {
  return { requestKey: `r_${++reqCounter}_${Math.random().toString(36).slice(2, 8)}` }
}

export default pb
