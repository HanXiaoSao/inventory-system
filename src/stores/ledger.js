import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

// 检查并清理过期数据（超过7天）
const checkExpiredItems = (items) => {
  const now = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return items.filter(item => {
    if (item.deletedAt && now - item.deletedAt > sevenDays) {
      return false // 丢弃过期项
    }
    return true
  })
}

export const useLedgerStore = defineStore('ledger', () => {
  const ledgers = ref([])
  const recycleBin = ref([])
  const inventoryCategories = ref([])
  const isLoaded = ref(false)

  const loadFromDb = async () => {
    try {
      const jsonStr = await invoke('load_data')
      if (jsonStr) {
        const data = JSON.parse(jsonStr)
        ledgers.value = data.ledgers || []
        recycleBin.value = checkExpiredItems(data.recycleBin || []) // 加载时过滤过期
        if (data.inventoryCategories) inventoryCategories.value = data.inventoryCategories
      } else {
        ledgers.value = [{ id: 'L_2026', year: 2026, name: '2026补贴销售台账', records: [] }]
        inventoryCategories.value = [
          { id: 'C_1', name: '空调', items: [] },
          { id: 'C_2', name: '冰箱', items: [] },
          { id: 'C_3', name: '洗衣机', items: [] },
          { id: 'C_4', name: '电视', items: [] }
        ]
      }
      isLoaded.value = true
    } catch (e) {
      console.error("读取数据库失败", e)
      isLoaded.value = true
    }
  }

  const saveToDb = async () => {
    if (!isLoaded.value) return
    try {
      const dataToSave = {
        ledgers: ledgers.value,
        recycleBin: recycleBin.value,
        inventoryCategories: inventoryCategories.value
      }
      await invoke('save_data', { jsonContent: JSON.stringify(dataToSave) })
    } catch (e) {
      console.error("保存数据库失败", e)
    }
  }

  // 🔥 统一的移入回收站方法
  const moveToRecycleBin = (type, title, data, parentId = '') => {
    recycleBin.value.push({
      rbId: `RB_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type, // 'ledger' | 'record' | 'category' | 'item'
      title,
      data,
      parentId,
      deletedAt: Date.now()
    })
    saveToDb()
  }

  // 🔥 统一的恢复方法
  const restoreFromRecycleBin = (rbItem) => {
    if (rbItem.type === 'ledger') {
      // 恢复台账
      delete rbItem.data.deletedAt
      ledgers.value.push(rbItem.data)
    } else if (rbItem.type === 'record') {
      // 恢复销售记录（必须找到它原本的账本）
      const parentLedger = ledgers.value.find(l => l.id === rbItem.parentId)
      if (!parentLedger) return '原账本已不存在，无法恢复'
      parentLedger.records.push(rbItem.data)
    } else if (rbItem.type === 'category') {
      // 恢复库存分类
      inventoryCategories.value.push(rbItem.data)
    } else if (rbItem.type === 'item') {
      // 恢复库存商品（必须找到它原本的分类）
      const parentCategory = inventoryCategories.value.find(c => c.id === rbItem.parentId)
      if (!parentCategory) return '原分类已不存在，无法恢复'
      parentCategory.items.push(rbItem.data)
    }

    // 从回收站移除
    const index = recycleBin.value.findIndex(r => r.rbId === rbItem.rbId)
    if (index > -1) recycleBin.value.splice(index, 1)
    
    saveToDb()
    return null // null表示没有报错
  }

  // 彻底删除
  const permanentDelete = (rbIds) => {
    if (Array.isArray(rbIds)) {
      recycleBin.value = recycleBin.value.filter(r => !rbIds.includes(r.rbId))
    } else {
      const index = recycleBin.value.findIndex(r => r.rbId === rbIds)
      if (index > -1) recycleBin.value.splice(index, 1)
    }
    saveToDb()
  }

  const addLedger = (year) => {
    const newId = `L_${year}_${Date.now()}`
    ledgers.value.push({ id: newId, year: year, name: `${year}年销售台账`, records: [] })
    saveToDb()
  }

  return {
    ledgers, recycleBin, inventoryCategories, isLoaded,
    loadFromDb, saveToDb, addLedger, 
    moveToRecycleBin, restoreFromRecycleBin, permanentDelete
  }
})