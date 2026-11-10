<template>
  <div class="ledger-list-container">
    <div class="header-toolbar">
      <h2>库存分类</h2>
      <el-button type="primary" icon="Plus" @click="handleAddCategory">新增分类</el-button>
    </div>

    <!-- 分类卡片列表 -->
    <div class="cards-grid">
      <el-card 
        v-for="category in inventoryCategories" 
        :key="category.id" 
        class="ledger-card"
        shadow="hover"
        @click="goToDetail(category.id)"
      >
        <div class="card-actions" @click.stop>
          <el-button link type="primary" icon="Edit" @click="handleEditCategory(category)">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDeleteCategory(category)">删除</el-button>
        </div>
        
        <div class="card-content">
          <div class="card-year">{{ category.name }}</div>
          <div class="card-count">共 {{ category.items.length }} 种商品</div>
        </div>
      </el-card>
    </div>

    <el-empty v-if="inventoryCategories.length === 0" description="还没有分类，点击右上角新增吧" />

    <!-- 新增/修改分类弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? '修改分类名称' : '新增库存分类'" width="400px" :close-on-click-modal="false">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="分类名称">
          <el-input v-model="formData.name" placeholder="如：空调、冰箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLedgerStore } from '../stores/ledger'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'

const router = useRouter()
const ledgerStore = useLedgerStore()
const { inventoryCategories } = storeToRefs(ledgerStore)

const goToDetail = (id) => {
  router.push(`/inventory/${id}`)
}

// --- 分类的新增与修改 ---
const dialogVisible = ref(false)
const isEditing = ref(false)
const formData = ref({ name: '' })
const currentEditId = ref('')

const handleAddCategory = () => {
  isEditing.value = false
  formData.value = { name: '' }
  dialogVisible.value = true
}

const handleEditCategory = (category) => {
  isEditing.value = true
  currentEditId.value = category.id
  formData.value = { name: category.name }
  dialogVisible.value = true
}

const saveCategory = () => {
  if (!formData.value.name) {
    ElMessage.warning('请输入分类名称')
    return
  }

  if (isEditing.value) {
    const category = inventoryCategories.value.find(c => c.id === currentEditId.value)
    if (category) category.name = formData.value.name
  } else {
    inventoryCategories.value.push({
      id: `C_${Date.now()}`,
      name: formData.value.name,
      items: []
    })
  }
  
  ledgerStore.saveToDb() // 保存到数据库
  dialogVisible.value = false
  ElMessage.success('操作成功')
}

// --- 删除分类 ---
const handleDeleteCategory = (category) => {
  if (category.items.length > 0) return ElMessage.warning('请先清空分类下的商品')
  ElMessageBox.confirm(`确定要删除分类【${category.name}】吗？`, '删除确认', { type: 'error' }).then(() => {
    const index = inventoryCategories.value.findIndex(c => c.id === category.id)
    if (index > -1) {
      const data = inventoryCategories.value.splice(index, 1)[0]
      ledgerStore.moveToRecycleBin('category', category.name, data)
      ElMessage.success('分类已移入回收站')
    }
  }).catch(() => {})
}
</script>

<style scoped>
/* 样式直接复用台账目录的 */
.ledger-list-container {
  padding: 24px;
  background-color: #f0f2f5;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

.header-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background-color: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-toolbar h2 {
  margin: 0;
  color: #303133;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.ledger-card {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  border: none;
}

.ledger-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.card-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
}

.ledger-card:hover .card-actions {
  opacity: 1;
}

.card-content {
  padding: 20px 10px;
  text-align: center;
}

.card-year {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 12px;
}

.card-count {
  font-size: 14px;
  color: #909399;
  background-color: #f4f4f5;
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
}
</style>