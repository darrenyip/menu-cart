import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/components/Layout.vue'
import Home from '@/views/Home.vue'
import Menu from '@/views/Menu.vue'
import MenuAdd from '@/views/MenuAdd.vue'
import Recipes from '@/views/Recipes.vue'
import RecipeAdd from '@/views/RecipeAdd.vue'
import Ingredients from '@/views/Ingredients.vue'
import Login from '@/views/Login.vue'
import authApi from '@/api/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 登录页面（不需要认证）
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { title: '登录', requiresAuth: false },
    },
    // 主布局（需要认证）
    {
      path: '/',
      component: Layout,
      redirect: '/',
      meta: { requiresAuth: true },
      children: [
        {
          path: '/',
          name: 'Home',
          component: Home,
          meta: { title: '主页' },
        },
        {
          path: '/menu',
          name: 'Menu',
          component: Menu,
          meta: { title: '菜单管理' },
        },
        {
          path: '/menu/add',
          name: 'MenuAdd',
          component: MenuAdd,
          meta: { title: '新增菜单' },
        },
        {
          path: '/menu/edit/:id',
          name: 'MenuEdit',
          component: MenuAdd,
          meta: { title: '编辑菜单' },
        },
        {
          path: '/recipes',
          name: 'Recipes',
          component: Recipes,
          meta: { title: '菜谱管理' },
        },
        {
          path: '/recipes/add',
          name: 'RecipeAdd',
          component: RecipeAdd,
          meta: { title: '新增菜谱' },
        },
        {
          path: '/recipes/edit/:id',
          name: 'RecipeEdit',
          component: RecipeAdd,
          meta: { title: '编辑菜谱' },
        },
        {
          path: '/recipes/view/:id',
          name: 'RecipeView',
          component: RecipeAdd,
          meta: { title: '查看菜谱' },
        },
        {
          path: '/ingredients',
          name: 'Ingredients',
          component: Ingredients,
          meta: { title: '原料管理' },
        },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查路由是否需要认证
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth !== false)

  if (requiresAuth && !authApi.isLoggedIn()) {
    // 需要认证但未登录，跳转到登录页
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  } else if (to.path === '/login' && authApi.isLoggedIn()) {
    // 已登录但访问登录页，跳转到首页
    next('/')
  } else {
    next()
  }
})

export default router
