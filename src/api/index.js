import PocketBase from 'pocketbase'

// 根据当前环境选择合适的PocketBase服务器地址
// 开发环境使用VITE_PB_URL，生产环境使用VITE_PB_PRODUCTION
const pbUrl =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_PB_PRODUCTION
    : import.meta.env.VITE_PB_URL

// 创建PocketBase客户端实例
const pb = new PocketBase(pbUrl)

// 完全禁用自动取消请求
pb.autoCancellation(false)

/**
 * 自增计数器，确保并发请求的 requestKey 绝对唯一
 */
let reqCounter = 0

/**
 * 生成唯一的请求选项，彻底避免请求被自动取消
 */
export function uniqueReq() {
  const key = `r_${++reqCounter}_${Math.random().toString(36).slice(2, 8)}`
  return { requestKey: null }
}

/**
 * 请求队列 - 确保请求按顺序执行，解决移动端并发问题
 */
let requestQueue = Promise.resolve()

/**
 * 检测是否为 iOS 设备
 */
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * 将请求加入队列，确保串行执行
 * 即使某个请求失败，队列也能恢复并继续处理后续请求
 * @param {Function} requestFn - 返回 Promise 的请求函数
 * @param {number} timeout - 超时时间（毫秒），iOS 默认 60 秒
 * @returns {Promise} 请求结果
 */
export function queueRequest(requestFn, timeout = 60000) {
  return new Promise((resolve, reject) => {
    // iOS Safari 特殊处理：添加超时保护
    let timeoutId = null
    let isCompleted = false
    
    const cleanup = () => {
      isCompleted = true
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }
    
    // 设置超时（主要针对 iOS Safari）
    if (isIOS()) {
      timeoutId = setTimeout(() => {
        if (!isCompleted) {
          cleanup()
          reject(new Error('请求超时，请检查网络后重试'))
        }
      }, timeout)
    }
    
    // 无论上一个请求成功还是失败，都继续执行当前请求
    // 使用 .then() 而不是 .catch() 来确保队列不会因为错误而卡住
    requestQueue = requestQueue
      .catch(() => {}) // 忽略之前的错误，确保队列能继续
      .then(() => {
        if (isCompleted) return Promise.reject(new Error('请求已超时'))
        return requestFn()
      })
      .then((result) => {
        if (!isCompleted) {
          cleanup()
          resolve(result)
        }
      })
      .catch((error) => {
        if (!isCompleted) {
          cleanup()
          reject(error)
        }
        // 不要 throw error，让队列继续
      })
  })
}

export default pb
