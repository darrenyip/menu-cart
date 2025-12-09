根据代码中的 API 实现，以下是之前为你设计的 **PocketBase 数据库结构**：

---

## 📦 PocketBase 数据库表设计

### 1. `cart_materials` - 原料表

| 字段名            | 类型      | 说明                              |
| ----------------- | --------- | --------------------------------- |
| `id`              | text (PK) | 自动生成                          |
| `name`            | text      | 原料名称                          |
| `code`            | text      | 商品编码（可选）                  |
| `purchase_unit`   | text      | 采购单位（斤、公斤、个等）        |
| `purchase_price`  | number    | 采购单价                          |
| `supplier`        | text      | 常用供应商/来源（如：乐禾、快驴） |
| `base_unit`       | text      | 基础单位（克，用于配菜计算）      |
| `conversion_rate` | number    | 换算比例（如 1斤=500克）          |
| `unit`            | text      | 兼容旧字段                        |
| `price`           | number    | 兼容旧字段                        |
| `created`         | datetime  | 自动生成                          |
| `updated`         | datetime  | 自动生成                          |

---

### 2. `cart_recipes` - 菜谱表

| 字段名        | 类型      | 说明                              |
| ------------- | --------- | --------------------------------- |
| `id`          | text (PK) | 自动生成                          |
| `name`        | text      | 菜谱名称                          |
| `category`    | text      | 菜品分类（荤菜/半荤/素菜/炖汤等） |
| `description` | text      | 描述（可选）                      |
| `created`     | datetime  | 自动生成                          |
| `updated`     | datetime  | 自动生成                          |

---

### 3. `cart_recipe_materials` - 菜谱原料关联表

| 字段名     | 类型      | 说明                          |
| ---------- | --------- | ----------------------------- |
| `id`       | text (PK) | 自动生成                      |
| `recipe`   | relation  | 关联 `cart_recipes`           |
| `material` | relation  | 关联 `cart_materials`（可选） |
| `name`     | text      | 原料名称（冗余存储）          |
| `quantity` | number    | 用量                          |
| `unit`     | text      | 单位                          |
| `created`  | datetime  | 自动生成                      |

---

### 4. `cart_menus` - 菜单表

| 字段名            | 类型      | 说明                 |
| ----------------- | --------- | -------------------- |
| `id`              | text (PK) | 自动生成             |
| `name`            | text      | 菜单名称             |
| `date`            | text/date | 菜单日期             |
| `extra_purchases` | json      | 其他原料采购（数组） |
| `created`         | datetime  | 自动生成             |
| `updated`         | datetime  | 自动生成             |

**`extra_purchases` JSON 结构：**

```json
[
  {
    "name": "大蒜",
    "materialId": "xxx",
    "quantity": 2,
    "unit": "斤"
  }
]
```

---

### 5. `cart_menu_dishes` - 菜单菜品关联表

| 字段名     | 类型      | 说明                              |
| ---------- | --------- | --------------------------------- |
| `id`       | text (PK) | 自动生成                          |
| `menu`     | relation  | 关联 `cart_menus`                 |
| `recipe`   | relation  | 关联 `cart_recipes`（可选）       |
| `name`     | text      | 菜品名称                          |
| `category` | text      | 菜品分类（荤菜/半荤/素菜/炖汤等） |
| `portions` | number    | 份数                              |
| `sort`     | number    | 排序序号                          |
| `created`  | datetime  | 自动生成                          |

---

### 6. `cart_menu_dish_materials` - 菜单菜品原料关联表

| 字段名      | 类型      | 说明                          |
| ----------- | --------- | ----------------------------- |
| `id`        | text (PK) | 自动生成                      |
| `menu_dish` | relation  | 关联 `cart_menu_dishes`       |
| `material`  | relation  | 关联 `cart_materials`（可选） |
| `name`      | text      | 原料名称（冗余存储）          |
| `quantity`  | number    | 单份用量                      |
| `unit`      | text      | 单位                          |
| `created`   | datetime  | 自动生成                      |

---

### 7. `cart_material_prices` - 原料价格历史表

| 字段名     | 类型      | 说明                              |
| ---------- | --------- | --------------------------------- |
| `id`       | text (PK) | 自动生成                          |
| `material` | relation  | 关联 `cart_materials`             |
| `price`    | number    | 当时的采购价格                    |
| `date`     | date      | 记录日期                          |
| `supplier` | text      | 供应商/来源（如：菜市场、超市等） |
| `note`     | text      | 备注（可选）                      |
| `created`  | datetime  | 自动生成                          |

---

### 8. `users` - 用户表（PocketBase 内置）

| 字段名     | 类型      | 说明             |
| ---------- | --------- | ---------------- |
| `id`       | text (PK) | 自动生成         |
| `email`    | text      | 邮箱（登录用）   |
| `password` | text      | 密码（加密）     |
| `name`     | text      | 用户名称（可选） |
| `verified` | bool      | 是否验证         |
| `created`  | datetime  | 自动生成         |

---

## 🔗 表关系图

```
users (内置)
    |
cart_materials (原料库)
    |
    +-----> cart_recipe_materials <----- cart_recipes (菜谱库)
    |
    +-----> cart_menu_dish_materials <----- cart_menu_dishes <----- cart_menus
```

---

## ⚙️ API Rules 配置

每个表都需要配置以下规则（在 PocketBase Admin 中设置）：

| 操作            | 规则                            |
| --------------- | ------------------------------- |
| **List/Search** | `@request.auth.id != ""` 或留空 |
| **View**        | `@request.auth.id != ""` 或留空 |
| **Create**      | `@request.auth.id != ""` 或留空 |
| **Update**      | `@request.auth.id != ""` 或留空 |
| **Delete**      | `@request.auth.id != ""` 或留空 |

> 留空 = 允许所有人访问；`@request.auth.id != ""` = 需要登录

---

这就是完整的数据库设计！你可以在 PocketBase Admin 后台 (`http://127.0.0.1:8090/_/`) 创建这些 Collection。

```json
[
  {
    "name": "大蒜",
    "materialId": "xxx",
    "quantity": 2,
    "unit": "斤"
  }
]
```

```plaintext
users (内置)
    |
cart_materials (原料库)
    |
    +-----> cart_material_prices (价格历史)
    |
    +-----> cart_recipe_materials <----- cart_recipes (菜谱库)
    |
    +-----> cart_menu_dish_materials <----- cart_menu_dishes <----- cart_menus
```

---
