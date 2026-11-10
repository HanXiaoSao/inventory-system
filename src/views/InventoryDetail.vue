<template>
  <div class="page-container">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button icon="ArrowLeft" @click="goBack" circle style="margin-right: 12px;" />
        <span class="title">{{ currentCategory?.name || '库存详情' }}</span>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索型号/名称/备注"
          prefix-icon="Search"
          clearable
          style="width: 260px; margin-right: 12px;"
        />
        <el-button type="primary" icon="Plus" @click="handleAdd">新增商品</el-button>
      </div>
    </div>

    <!-- 库存表格 -->
    <el-table :data="filteredItems" border style="width: 100%" height="calc(100vh - 150px)" stripe>
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="name" label="商品型号/名称" min-width="300" show-overflow-tooltip />
      
      <el-table-column label="当前数量" width="120" align="center">
        <template #default="scope">
          <span :style="{ color: scope.row.quantity <= 1 ? '#f56c6c' : '', fontWeight: 'bold', fontSize: '16px' }">
            {{ scope.row.quantity }}
          </span>
        </template>
      </el-table-column>
      
      <el-table-column label="进货价" width="120" align="right">
        <template #default="scope">{{ formatMoney(scope.row.purchasePrice) }}</template>
      </el-table-column>
      
      <el-table-column prop="remark" label="备注" min-width="200" align="center" show-overflow-tooltip />
      
      <el-table-column label="操作" width="380" fixed="right" align="center">
        <template #default="scope">
          <div class="action-buttons">
            <el-button type="success" plain icon="Plus" @click="handleStockChange(scope.row, 'in')">入库</el-button>
            <el-button type="warning" plain icon="Minus" @click="handleStockChange(scope.row, 'out')">出库</el-button>
            <el-button type="primary" plain icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" plain icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </div>
        </template>
      </el-table-column>

      <template #empty>
        <el-empty description="暂无库存商品，请点击新增" />
      </template>
    </el-table>

    <!-- 新增/编辑商品弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isAdding ? '新增商品' : '编辑商品'" width="500px" :close-on-click-modal="false">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="型号/名称" required>
          <el-input v-model="formData.name" placeholder="请输入商品型号或名称" />
        </el-form-item>
        <el-form-item label="进货价">
          <el-input v-model="formData.purchasePrice" placeholder="输入数字" type="text" />
        </el-form-item>
        <el-form-item label="当前数量" v-if="!isAdding">
          <el-input v-model="formData.quantity" placeholder="直接修改数量" type="text" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" placeholder="如：在二楼仓库" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveForm">确认保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 入库/出库弹窗 -->
    <el-dialog v-model="stockDialogVisible" :title="stockAction === 'in' ? '入库' : '出库'" width="400px" :close-on-click-modal="false">
      <div style="text-align: center; margin-bottom: 20px;">
        当前商品：<strong>{{ currentStockItem?.name }}</strong>
      </div>
      <el-form label-width="80px">
        <el-form-item :label="stockAction === 'in' ? '入库数量' : '出库数量'">
          <el-input-number v-model="stockNumber" :min="1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="stockDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmStockChange">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLedgerStore } from '../stores/ledger'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const ledgerStore = useLedgerStore()
const { inventoryCategories } = storeToRefs(ledgerStore)

const currentId = route.params.categoryId
const currentCategory = computed(() => inventoryCategories.value.find(c => c.id === currentId))
const currentItems = computed(() => currentCategory.value?.items || [])

const goBack = () => router.push('/inventory')

const formatMoney = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const num = Number(val);
  if (isNaN(num)) return val;
  return parseFloat(num.toFixed(2));
}

const searchKeyword = ref('')
const filteredItems = computed(() => {
  if (!searchKeyword.value) return currentItems.value
  const kw = searchKeyword.value.toLowerCase()
  return currentItems.value.filter(item => 
    (item.name && item.name.toLowerCase().includes(kw)) ||
    (item.remark && item.remark.toLowerCase().includes(kw))
  )
})

const dialogVisible = ref(false)
const isAdding = ref(false)
const formData = ref({})
const currentEditIndex = ref(-1)

const handleAdd = () => {
  isAdding.value = true
  currentEditIndex.value = -1
  formData.value = { name: '', quantity: 1, purchasePrice: '', remark: '' }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isAdding.value = false
  formData.value = JSON.parse(JSON.stringify(row))
  currentEditIndex.value = currentItems.value.indexOf(row)
  dialogVisible.value = true
}

const saveForm = () => {
  if (!formData.value.name) {
    ElMessage.warning('请输入商品名称')
    return
  }
  if (Number(formData.value.quantity) < 0) {
    ElMessage.warning('库存数量不能为负数')
    return
  }

  const data = {
    ...formData.value,
    quantity: Number(formData.value.quantity) || 0,
    purchasePrice: Number(formData.value.purchasePrice) || 0,
    id: isAdding.value ? `I_${Date.now()}` : formData.value.id
  }

  if (isAdding.value) {
    currentCategory.value.items.push(data)
    ElMessage.success('新增商品成功')
  } else {
    if (currentEditIndex.value > -1) {
      currentCategory.value.items[currentEditIndex.value] = data
      ElMessage.success('修改成功')
    }
  }
  
  ledgerStore.saveToDb()
  dialogVisible.value = false
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除【${row.name}】吗？可在回收站找回。`, '删除确认', { type: 'error' }).then(() => {
    const index = currentItems.value.indexOf(row)
    if (index > -1) {
      const data = currentCategory.value.items.splice(index, 1)[0]
      ledgerStore.moveToRecycleBin('item', data.name, data, currentCategory.value.id)
      ElMessage.success('已移入回收站')
    }
  }).catch(() => {})
}

const stockDialogVisible = ref(false)
const stockAction = ref('in')
const stockNumber = ref(1)
const currentStockItem = ref(null)

const handleStockChange = (row, action) => {
  currentStockItem.value = row
  stockAction.value = action
  stockNumber.value = 1
  stockDialogVisible.value = true
}

const confirmStockChange = () => {
  if (stockNumber.value <= 0) {
    ElMessage.warning('数量必须大于0')
    return
  }

  if (stockAction.value === 'in') {
    currentStockItem.value.quantity += stockNumber.value
    ElMessage.success(`成功入库 ${stockNumber.value} 台`)
  } else {
    if (currentStockItem.value.quantity < stockNumber.value) {
      ElMessage.warning(`当前库存只有 ${currentStockItem.value.quantity} 台，不能出库这么多！`)
      return
    }
    currentStockItem.value.quantity -= stockNumber.value
    ElMessage.success(`成功出库 ${stockNumber.value} 台`)
  }

  ledgerStore.saveToDb()
  stockDialogVisible.value = false
}
</script>

<style scoped>
.page-container { padding: 8px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.toolbar-left { display: flex; align-items: center; }
.toolbar-right { display: flex; align-items: center; }
.title { font-size: 18px; font-weight: bold; }
.action-buttons { display: flex; justify-content: center; align-items: center; gap: 6px; flex-wrap: nowrap; }
</style>