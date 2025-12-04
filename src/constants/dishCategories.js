/**
 * 菜品分类配置
 * 统一管理所有菜品分类相关的数据
 * 修改此文件后，所有使用分类的地方都会同步更新
 */

// 分类列表
export const DISH_CATEGORIES = ['荤菜', '半荤', '素菜', '炖汤', '主食', '套餐']

// 分类对应的标签颜色 (Element Plus tag type)
export const CATEGORY_TAG_TYPES = {
  '荤菜': 'danger',    // 红色
  '半荤': 'warning',   // 橙色
  '素菜': 'success',   // 绿色
  '炖汤': 'info',      // 蓝色
  '主食': '',          // 默认灰色
  '套餐': 'primary',   // 主题蓝色
  '未分类': 'info',
}

// 分类对应的图标 emoji（用于下拉选择器显示）
export const CATEGORY_ICONS = {
  '荤菜': '🥩',
  '半荤': '🍳',
  '素菜': '🥬',
  '炖汤': '🍲',
  '主食': '🍚',
  '套餐': '🍱',
}

// 分类对应的颜色（用于自定义样式）
export const CATEGORY_COLORS = {
  '荤菜': '#ef4444',
  '半荤': '#f59e0b',
  '素菜': '#22c55e',
  '炖汤': '#3b82f6',
  '主食': '#6b7280',
  '套餐': '#8b5cf6',
}

/**
 * 获取分类的标签类型
 * @param {string} category 分类名称
 * @returns {string} Element Plus tag type
 */
export function getCategoryTagType(category) {
  return CATEGORY_TAG_TYPES[category] || ''
}

/**
 * 获取分类的图标
 * @param {string} category 分类名称
 * @returns {string} emoji icon
 */
export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || ''
}

/**
 * 获取分类的颜色
 * @param {string} category 分类名称
 * @returns {string} color hex
 */
export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || '#6b7280'
}

export default {
  DISH_CATEGORIES,
  CATEGORY_TAG_TYPES,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  getCategoryTagType,
  getCategoryIcon,
  getCategoryColor,
}

