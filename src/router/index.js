import { createRouter, createWebHashHistory } from 'vue-router'

// 引入页面组件
import LedgerList from '../views/LedgerList.vue'
import Sales from '../views/Sales.vue'
import Inventory from '../views/Inventory.vue'
import InventoryDetail from '../views/InventoryDetail.vue'
import Settings from '../views/Settings.vue'
import RecycleBin from '../views/RecycleBin.vue'
// 引入打印页面
import Invoice from '../views/Invoice.vue'

const routes = [
  // 默认直接进卡片大厅
  { path: '/', redirect: '/ledgers' }, 
  // 卡片大厅
  { path: '/ledgers', component: LedgerList },
  // 台账详情，:id 用来接收点的是哪个账本
  { path: '/sales/:id', component: Sales, props: true },
  
  { path: '/invoice', component: Invoice },
  { path: '/inventory', component: Inventory },
  { path: '/inventory/:categoryId', component: InventoryDetail },
  { path: '/settings', component: Settings },
   { path: '/recycle-bin', component: RecycleBin }
  
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router