import PocketBase from 'pocketbase'

// 根据当前环境选择合适的PocketBase服务器地址
// 开发环境使用VITE_PB_URL，生产环境使用VITE_PB_PRODUCTION
const pbUrl =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_PB_PRODUCTION
    : import.meta.env.VITE_PB_URL

// 创建PocketBase客户端实例
const pb = new PocketBase(pbUrl)

// 禁用自动取消请求（可选）
pb.autoCancellation(false)

export default pb
