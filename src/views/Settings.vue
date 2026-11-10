<template>
  <div class="settings-container">
    <el-card shadow="never" class="box-card">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold; font-size: 18px;">数据备份与恢复</span>
        </div>
      </template>

      <div class="action-area">
        <div class="action-item">
          <h3>备份数据</h3>
          <p>将当前的台账、库存等所有数据备份到外部文件夹或 U 盘，防止硬盘损坏导致数据丢失。</p>
          <el-button type="primary" size="large" icon="Download" @click="handleBackup">选择保存位置</el-button>
        </div>

        <el-divider />

        <div class="action-item">
          <h3 style="color: #f56c6c;">导入数据</h3>
          <p>警告：导入会覆盖当前软件里的所有数据！请确保选择的是正确的备份文件（.db）。</p>
          <el-button type="danger" plain size="large" icon="Upload" @click="handleRestore">选择文件导入</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { invoke } from '@tauri-apps/api/core'
import { save, open } from '@tauri-apps/plugin-dialog'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useLedgerStore } from '../stores/ledger'

const ledgerStore = useLedgerStore()

const handleBackup = async () => {
  try {
    const filePath = await save({
      title: '选择要保存备份的文件夹或路径',
      defaultPath: `海尔专卖店数据备份_${new Date().toLocaleDateString().replace(/\//g, '-')}.db`,
      filters: [{ name: '数据库文件', extensions: ['db'] }]
    })

    if (filePath) {
      await invoke('backup_db', { destination: filePath })
      ElMessage.success('备份成功！数据已安全保存。')
    }
  } catch (error) {
    ElMessage.error('备份出错: ' + error)
  }
}

const handleRestore = async () => {
  try {
    const filePath = await open({
      title: '选择要导入的备份文件',
      multiple: false,
      filters: [{ name: '数据库文件', extensions: ['db'] }]
    })

    if (filePath) {
      await ElMessageBox.confirm(
        '导入数据将覆盖当前电脑上的所有数据，且无法撤销！确定要导入吗？',
        '高危操作',
        { type: 'warning', confirmButtonText: '确定导入', cancelButtonText: '取消' }
      )

      await invoke('restore_db', { source: filePath })
      await ledgerStore.loadFromDb()
      ElMessage.success('数据导入成功！界面已刷新。')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('导入出错: ' + error)
    }
  }
}
</script>

<style scoped>
.settings-container { padding: 24px; background-color: #f0f2f5; height: calc(100vh - 60px); }
.box-card { max-width: 800px; margin: 0 auto; border-radius: 8px; }
.action-item { text-align: center; padding: 20px 0; }
.action-item h3 { font-size: 18px; color: #303133; margin-bottom: 10px; }
.action-item p { color: #909399; font-size: 14px; margin-bottom: 20px; }
</style>