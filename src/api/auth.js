import pb from './index'

/**
 * 认证 API
 */
export const authApi = {
  /**
   * 用户登录
   * @param {string} email 邮箱
   * @param {string} password 密码
   */
  async login(email, password) {
    const authData = await pb.collection('users').authWithPassword(email, password)
    return authData
  },

  /**
   * 用户登出
   */
  logout() {
    pb.authStore.clear()
  },

  /**
   * 检查是否已登录
   */
  isLoggedIn() {
    return pb.authStore.isValid
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser() {
    return pb.authStore.model
  },

  /**
   * 获取认证 token
   */
  getToken() {
    return pb.authStore.token
  },

  /**
   * 用户注册
   * @param {object} data 用户数据
   */
  async register(data) {
    const user = await pb.collection('users').create({
      email: data.email,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
      name: data.name || '',
    })
    return user
  },

  /**
   * 监听认证状态变化
   * @param {function} callback 回调函数
   */
  onAuthStateChange(callback) {
    pb.authStore.onChange((token, model) => {
      callback(token, model)
    })
  },
}

export default authApi

