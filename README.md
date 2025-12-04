# menu-cart

## 项目简介

`menu-cart`（菜单购物车）是一套基于 Vue 3 + Vite 的前端应用，聚焦于餐饮业务的菜单排产与采购协同。项目内置 PocketBase 数据源，提供登录鉴权、菜单/菜谱/原料的全链路管理，以及一键汇总采购清单、导出 Excel、移动端自适应等体验，适合中小型厨房或配餐团队快速上线。

## 功能特性

- PocketBase 邮箱登录、路由守卫与自动重定向，支持记住登录状态。
- 自适应仪表盘：展示菜单/菜谱/原料数量、近期菜单时间线、快捷入口及「今日菜单」提醒弹窗。
- 菜单构建器：可视化编排菜品与分类、份数调整、菜谱自动补全、原料联想、其他采购项登记、材料汇总、复制与 Excel 导出。
- 菜单管理：桌面端表格 + 移动端卡片双布局，统计菜品总数，支持分页、编辑、删除。
- 菜谱库：支持按菜名或原料模糊搜索并高亮结果，查看/新增/编辑菜谱，新增原料可同步回原料库。
- 原料库：维护采购单价、采购单位与配菜基础单位、换算比例，可快速新增或编辑并同步到菜单/菜谱填写体验。
- 响应式布局：定制侧边栏、移动端遮罩、悬浮添加按钮，PC 与移动端保持一致的操作链路。

## 技术栈

- Vue 3、Vite、Pinia、Vue Router
- Element Plus（含 @element-plus/icons-vue）
- PocketBase SDK
- XLSX（延迟加载，仅在导出时引入）

## 环境要求

- Node.js ^20.19.0 或 >=22.12.0
- pnpm 8+
- 可访问的 PocketBase 服务（本地或线上）

## 快速开始

1. 安装依赖
   ```sh
   pnpm install
   ```
2. 配置环境变量（在项目根目录创建 `.env.local`，示例）
   ```ini
   VITE_PB_URL=http://127.0.0.1:8090          # 开发 PocketBase 地址
   VITE_PB_PRODUCTION=https://pb.example.com  # 生产 PocketBase 地址
   ```
3. 启动 PocketBase（需先在其控制台创建数据库，见下节）
4. 启动前端
   ```sh
   pnpm dev
   ```
5. 生产构建与预览
   ```sh
   pnpm build
   pnpm preview
   ```

## PocketBase 与数据结构

- 必须先在 PocketBase 中创建 `cart_materials / cart_recipes / cart_recipe_materials / cart_menus / cart_menu_dishes / cart_menu_dish_materials` 等集合，权限规则可参考文档中为登录用户开放。
- 详细字段、表关系及 API 规则已经记录在 `dbStruct.md`，请按照该文档初始化字段及关系。
- 登录用户来自 PocketBase 内置 `users` 集合，前端使用邮箱 + 密码进行密码登录。

## 目录导航

```
src/
  api/           # PocketBase API 封装（auth、menus、recipes、materials）
  components/    # 全局布局、侧边栏等
  constants/     # 菜品分类、标签配置
  utils/         # 工具函数（如 XLSX 动态加载）
  views/         # Login、Home、Menu、MenuAdd、Recipes、RecipeAdd、Ingredients 等页面
```

## 常用脚本

- `pnpm dev`：启动开发服务器（默认 http://localhost:5173）
- `pnpm build`：构建生产包
- `pnpm preview`：本地预览打包产物
- `pnpm format`：对 `src/` 目录执行 Prettier

## 开发提示

- 菜单/菜谱在保存时会自动回写缺失的原料、菜谱数据，避免重复维护；如需调整字段结构，务必同步更新 `materialsApi`、`recipesApi` 相关逻辑。
- Excel 导出依赖浏览器下载能力，若在移动端受限，可先使用「复制清单」功能，将汇总文本粘贴到其他 IM/表格工具。
- 默认 UI 以中文为主，如需多语言可在 `App.vue` 中扩展 `el-config-provider`。
