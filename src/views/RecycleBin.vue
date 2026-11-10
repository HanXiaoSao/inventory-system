<template>
  <div class="page-container">
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="title">回收站 (保留 7 天)</span>
      </div>
      <div class="toolbar-right">
        <el-button type="danger" icon="Delete" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
          批量彻底删除
        </el-button>
      </div>
    </div>

    <el-table 
      :data="recycleBin" 
      border 
      style="width: 100%" 
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="title" label="文件名称" min-width="200" show-overflow-tooltip />
      <el-table-column label="类型" width="120" align="center">
        <template #default="scope">
          <el-tag :type="getTypeTag(scope.row.type)">
            {{ getTypeName(scope.row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="剩余时间" width="150" align="center">
        <template #default="scope">
          <el-tag :type="getRemainingDays(scope.row.deletedAt) <= 3 ? 'danger' : 'warning'">
            {{ getRemainingDays(scope.row.deletedAt) }} 天
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="scope">
          <div class="action-buttons">
            <el-button type="success" plain size="small" icon="RefreshLeft" @click="handleRestore(scope.row)">恢复</el-button>
            <el-button type="danger" plain size="small" icon="Delete" @click="handlePermanentDelete(scope.row)">彻底删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="recycleBin.length === 0" description="回收站空空如也" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useLedgerStore } from '../stores/ledger'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'

const ledgerStore = useLedgerStore()
const { recycleBin } = storeToRefs(ledgerStore)

const selectedRows = ref([])
const handleSelectionChange = (val) => {
  selectedRows.value = val
}

// 类型映射
const getTypeName = (type) => {
  const map = { ledger: '台账', record: '销售记录', category: '库存分类', item: '库存商品' }
  return map[type] || '未知'
}
const getTypeTag = (type) => {
  const map = { ledger: 'primary', record: 'success', category: 'warning', item: 'info' }
  return map[type] || ''
}

// 计算剩余天数
const getRemainingDays = (deletedAt) => {
  if (!deletedAt) return 7;
  const now = Date.now();
  const diff = now - deletedAt;
  const daysPassed = Math.floor(diff / (1000 * 60 * 60 * 24));
  const remaining = 7 - daysPassed;
  return remaining > 0 ? remaining : 0;
}

// 恢复
const handleRestore = (row) => {
  const errorMsg = ledgerStore.restoreFromRecycleBin(row)
  if (errorMsg) {
    ElMessage.error(errorMsg)
  } else {
    ElMessage.success(`【${row.title}】已成功恢复！`)
  }
}

// 单个彻底删除
const handlePermanentDelete = (row) => {
  ElMessageBox.confirm(
    `确定要彻底删除【${row.title}】吗？删除后永远无法找回！`, 
    '极危操作！', 
    { type: 'error', confirmButtonText: '彻底删除', cancelButtonText: '取消' }
  ).then(() => {
    ledgerStore.permanentDelete(row.rbId)
    ElMessage.success('已彻底删除')
  }).catch(() => {})
}

// 批量彻底删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) return
  ElMessageBox.confirm(
    `确定要彻底删除选中的 ${selectedRows.value.length} 个文件吗？删除后永远无法找回！`, 
    '极危操作！', 
    { type: 'error', confirmButtonText: '彻底删除', cancelButtonText: '取消' }
  ).then(() => {
    const ids = selectedRows.value.map(r => r.rbId)
    ledgerStore.permanentDelete(ids)
    ElMessage.success('批量删除成功')
  }).catch(() => {})
}
</script>

<style scoped>
.page-container { background-color: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08); height: calc(100vh - 108px); overflow-y: auto; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.title { font-size: 18px; font-weight: bold; color: #303133; }
.action-buttons { display: flex; justify-content: center; gap: 8px; }

html.dark .page-container { background-color: #1d1e1f; }
html.dark .title { color: #e5eaf3; }
</style>