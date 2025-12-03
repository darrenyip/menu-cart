import { createApp } from 'vue'
import { createPinia } from 'pinia'
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
