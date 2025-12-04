import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 手动引入 Element Plus 服务型组件的样式（这些组件通过 JS 调用，样式不会自动按需加载）
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/loading/style/css'
import 'element-plus/es/components/notification/style/css'

import {
  Apple,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CirclePlus,
  Close,
  CopyDocument,
  DataAnalysis,
  Delete,
  Dish,
  Document,
  Download,
  Edit,
  Expand,
  Fold,
  Goods,
  Grid,
  HomeFilled,
  InfoFilled,
  Message,
  Money,
  Notebook,
  Plus,
  Refresh,
  Search,
  ShoppingBag,
  ShoppingCart,
  SwitchButton,
  Upload,
  UploadFilled,
  User,
  View,
} from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

const elementPlusIcons = {
  Apple,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CirclePlus,
  Close,
  CopyDocument,
  DataAnalysis,
  Delete,
  Dish,
  Document,
  Download,
  Edit,
  Expand,
  Fold,
  Goods,
  Grid,
  HomeFilled,
  InfoFilled,
  Message,
  Money,
  Notebook,
  Plus,
  Refresh,
  Search,
  ShoppingBag,
  ShoppingCart,
  SwitchButton,
  Upload,
  UploadFilled,
  User,
  View,
}

for (const [key, component] of Object.entries(elementPlusIcons)) {
  app.component(key, component)
}

app.mount('#app')
