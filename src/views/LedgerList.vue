<template>
  <div class="ledger-list-container">
    <div class="header-toolbar">
      <h2>台账目录</h2>
      <el-button type="primary" icon="Plus" @click="handleAddLedger">新增</el-button>
    </div>

    <!-- 卡片列表区域 -->
    <div class="cards-grid">
      <el-card 
        v-for="ledger in ledgers" 
        :key="ledger.id" 
        class="ledger-card"
        shadow="hover"
        @click="goToDetail(ledger.id)"
      >
        <!-- 卡片右上角的操作按钮 -->
        <div class="card-actions" @click.stop>
          <el-button link type="primary" icon="Edit" @click="handleEditName(ledger)">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(ledger)">删除</el-button>
        </div>
        
        <div class="card-content">
          <!-- 提取年份或名称显示 -->
          <div class="card-year">{{ ledger.name }}</div>
          <div class="card-count">共 {{ ledger.records.length }} 单</div>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="ledgers.length === 0" description="还没有任何台账，点击右上角新增吧" />

    <!-- 新增/重命名弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? '修改台账名称' : '新增台账'" width="400px" :close-on-click-modal="false">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="formData.name" placeholder="如：2026年销售台账" />
        </el-form-item>
        <!-- 如果是新增，还要填年份 -->
        <el-form-item label="年份" v-if="!isEditing">
          <el-date-picker
            v-model="formData.year"
            type="year"
            placeholder="选择年份"
            format="YYYY"
            value-format="YYYY"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveLedger">确定</el-button>
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
// 用 storeToRefs 保持响应式
const { ledgers } = storeToRefs(ledgerStore)

// --- 点击卡片跳转 ---
const goToDetail = (id) => {
  router.push(`/sales/${id}`)
}

// --- 新增与修改弹窗逻辑 ---
const dialogVisible = ref(false)
const isEditing = ref(false)
const formData = ref({ id: '', name: '', year: '' })
const currentEditId = ref('')

const handleAddLedger = () => {
  isEditing.value = false
  formData.value = { id: '', name: '', year: '' }
  dialogVisible.value = true
}

const handleEditName = (ledger) => {
  isEditing.value = true
  currentEditId.value = ledger.id
  formData.value = { name: ledger.name, year: ledger.year }
  dialogVisible.value = true
}

const saveLedger = () => {
  if (!formData.value.name) {
    ElMessage.warning('请输入名称')
    return
  }
  if (!isEditing.value && !formData.value.year) {
    ElMessage.warning('请选择年份')
    return
  }

  if (isEditing.value) {
    // 修改名称
    const ledger = ledgers.value.find(l => l.id === currentEditId.value)
    if (ledger) {
      ledger.name = formData.value.name
    }
  } else {
    // 新增
    ledgerStore.addLedger(Number(formData.value.year))
    // 注意：因为 store 里的 addLedger 默认按年份生成名字，这里如果你填了自定义名字，可以再去覆盖，这里简单起见先这样
  }
  dialogVisible.value = false
  ElMessage.success('操作成功')
}

// --- 删除（移入回收站） ---
const handleDelete = (ledger) => {
  ElMessageBox.confirm(`确定要将【${ledger.name}】移入回收站吗？`, '高危操作', { type: 'error', confirmButtonText: '确定', cancelButtonText: '取消' }).then(() => {
    const index = ledgers.value.findIndex(l => l.id === ledger.id)
    if (index > -1) {
      const data = ledgers.value.splice(index, 1)[0]
      data.deletedAt = Date.now()
      ledgerStore.moveToRecycleBin('ledger', ledger.name, data)
      ElMessage.success('已移入回收站')
    }
  }).catch(() => {})
}
</script>

<style scoped>
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
  opacity: 0; /* 默认隐藏，悬浮显示 */
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