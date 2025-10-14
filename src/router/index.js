import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/components/Layout.vue'
import Home from '@/views/Home.vue'
import Menu from '@/views/Menu.vue'
import MenuAdd from '@/views/MenuAdd.vue'
import Recipes from '@/views/Recipes.vue'
import RecipeAdd from '@/views/RecipeAdd.vue'
import Ingredients from '@/views/Ingredients.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/',
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

export default router
