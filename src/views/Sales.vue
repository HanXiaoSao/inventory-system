<template>
  <div class="page-container">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button icon="ArrowLeft" @click="goBack" circle style="margin-right: 12px;" />
        <span class="title">{{ currentLedger?.name || '销售台账' }}</span>
      </div>
      <div class="toolbar-right">
        <el-input v-model="searchKeyword" placeholder="搜索姓名/商品/SN码/电话" prefix-icon="Search" clearable style="width: 260px; margin-right: 12px;" @input="handleSearch" />
        <el-upload class="upload-demo" action="#" :auto-upload="false" :show-file-list="false" :on-change="handleFileChange" accept=".xlsx,.xls">
          <el-button icon="Upload">导入台账</el-button>
        </el-upload>
        <el-button icon="Download" style="margin-left: 12px;" @click="handleExport">导出 Excel</el-button>
        <el-button type="primary" icon="Plus" style="margin-left: 12px;" @click="handleAdd">新增开单</el-button>
      </div>
    </div>

    <el-table 
      ref="tableRef"
      :data="tableData" 
      border 
      style="width: 100%" 
      height="calc(100vh - 210px)"
      stripe
      highlight-current-row
      :default-sort="{ prop: sortProp, order: sortOrder }"
      @sort-change="handleSortChange"
    >
      <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
      
      <el-table-column 
        prop="date" 
        label="日期" 
        width="110" 
        align="center" 
        sortable="custom" 
        :sort-orders="['ascending', 'descending']" 
      />
      
      <el-table-column prop="customerName" label="客户姓名" width="85" align="center" />
      <el-table-column prop="productName" label="商品名称/型号" min-width="220" show-overflow-tooltip />
      
      <el-table-column label="SN码" width="200" show-overflow-tooltip>
        <template #default="scope">
          <div v-if="!scope.row.snCode || scope.row.snCode.trim() === ''" class="sn-missing">
            未填写
          </div>
          <div v-else>
            {{ scope.row.snCode }}
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="originalPrice" label="原价" width="75" align="right">
        <template #default="scope">{{ formatMoney(scope.row.originalPrice) }}</template>
      </el-table-column>
      <el-table-column prop="subsidy" label="补贴" width="75" align="right">
        <template #default="scope">{{ formatMoney(scope.row.subsidy) }}</template>
      </el-table-column>
      <el-table-column prop="actualPrice" label="实付" width="75" align="right">
        <template #default="scope">{{ formatMoney(scope.row.actualPrice) }}</template>
      </el-table-column>
      <el-table-column prop="phone" label="电话" width="120" align="center" />
      <el-table-column prop="address" label="安装地址" min-width="200" show-overflow-tooltip />
      
      <el-table-column label="开票" width="100" align="center">
        <template #default="scope">
          <span :style="{ color: scope.row.isInvoiced ? '#67c23a' : '#f56c6c', fontWeight: 'bold' }">
            {{ scope.row.isInvoiced ? '已开票' : '未开票' }}
          </span>
        </template>
      </el-table-column>
      
      <el-table-column prop="remark" label="备注" width="120" align="center">
        <template #default="scope">
          <span :style="{ color: scope.row.remark === '图片齐全' ? '#67c23a' : '#f56c6c' }">
            {{ scope.row.remark || '-' }}
          </span>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template #default="scope">
          <div class="action-buttons">
            <el-button type="primary" plain size="small" icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" plain size="small" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
      
      <template #empty>
        <el-empty description="暂无台账数据" />
      </template>
    </el-table>

    <div class="pagination-container">
      <el-pagination 
        v-model:current-page="currentPage" 
        v-model:page-size="pageSize" 
        :page-sizes="[50, 100, 200]" 
        :total="filteredData.length" 
        layout="total, sizes, prev, pager, next, jumper" 
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="isAdding ? '新增台账记录' : '编辑台账记录'" width="650px" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="日期" required>
              <el-date-picker v-model="pickerDate" type="date" placeholder="选择日期" format="M月D日" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户姓名" required>
              <el-input v-model="editForm.customerName" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="商品名称/型号" required>
          <el-input v-model="editForm.productName" />
        </el-form-item>
        
        <el-form-item label="SN码">
          <el-input v-model="editForm.snCode" />
        </el-form-item>
        
        <el-row :gutter="10">
          <el-col :span="8">
            <el-form-item label="原价">
              <el-input v-model="editForm.originalPrice" type="text" @input="calculateActual" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="补贴">
              <el-input v-model="editForm.subsidy" type="text" @input="calculateActual" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="实付">
              <el-input v-model="editForm.actualPrice" disabled style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row>
          <el-col :span="12">
            <el-form-item label="电话">
              <el-input v-model="editForm.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开票状态">
              <el-radio-group v-model="editForm.isInvoiced">
                <el-radio :value="true">已开票</el-radio>
                <el-radio :value="false">未开票</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="安装地址">
          <el-input v-model="editForm.address" />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-select v-model="editForm.remark" placeholder="请选择或输入备注" filterable allow-create style="width: 100%">
            <el-option label="图片齐全" value="图片齐全" />
            <el-option label="图片缺失" value="图片缺失" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveForm">{{ isAdding ? '确认新增' : '保存修改' }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLedgerStore } from '../stores/ledger'
import { storeToRefs } from 'pinia'
import * as XLSX from 'xlsx'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const ledgerStore = useLedgerStore()
const { ledgers } = storeToRefs(ledgerStore)

const currentId = route.params.id
const currentLedger = computed(() => ledgers.value.find(l => l.id === currentId))
const salesData = computed(() => currentLedger.value?.records || [])

const goBack = () => router.push('/ledgers')

const tableRef = ref(null)
const currentPage = ref(1)
const pageSize = ref(50)
const searchKeyword = ref('')

const sortProp = ref('date')
const sortOrder = ref('ascending')

onMounted(() => {
  const savedSort = localStorage.getItem(`ledger_sort_${currentId}`)
  if (savedSort) {
    const { prop, order } = JSON.parse(savedSort)
    sortProp.value = prop
    sortOrder.value = order
    nextTick(() => {
      if (tableRef.value) {
        tableRef.value.sort(prop, order)
      }
    })
  }
})

const handleSortChange = ({ prop, order }) => {
  sortProp.value = prop
  sortOrder.value = order
  localStorage.setItem(`ledger_sort_${currentId}`, JSON.stringify({ prop, order }))
}

const filteredData = computed(() => {
  let data = salesData.value

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    data = data.filter(item => 
      (item.customerName && item.customerName.includes(kw)) ||
      (item.productName && item.productName.toLowerCase().includes(kw)) ||
      (item.snCode && item.snCode.toLowerCase().includes(kw)) ||
      (item.phone && item.phone.includes(kw))
    )
  }

  if (sortProp.value && sortOrder.value) {
    data = [...data].sort((a, b) => {
      let valA = a[sortProp.value]
      let valB = b[sortProp.value]

      if (sortProp.value === 'date') {
        const parseDate = (str) => {
          if (!str) return 0;
          const match = str.match(/(\d+)月(\d+)日/);
          if (match) return parseInt(match[1]) * 100 + parseInt(match[2]);
          return 0;
        };
        valA = parseDate(a.date);
        valB = parseDate(b.date);
      }

      if (sortOrder.value === 'ascending') return valA - valB;
      if (sortOrder.value === 'descending') return valB - valA;
      return 0;
    })
  }

  return data
})

const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const handleSearch = () => {
  currentPage.value = 1
}

const indexMethod = (index) => (currentPage.value - 1) * pageSize.value + index + 1

const formatMoney = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const num = Number(val);
  if (isNaN(num)) return val;
  return parseFloat(num.toFixed(2));
}

const handleExport = () => {
  const exportData = filteredData.value.map(item => ({
    "日期": item.date, "客户姓名": item.customerName, "商品名称/型号": item.productName,
    "SN码": item.snCode, "原价": formatMoney(item.originalPrice), 
    "补贴": formatMoney(item.subsidy), "实付": formatMoney(item.actualPrice), 
    "电话": item.phone, "安装地址": item.address,
    "开票": item.isInvoiced ? '已开票' : '未开票', "备注": item.remark
  }))
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "销售台账")
  XLSX.writeFile(wb, `海尔专卖店_销售台账_${new Date().getTime()}.xlsx`)
  ElMessage.success('导出成功！')
}

const handleFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array', cellDates: true })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawData = XLSX.utils.sheet_to_json(worksheet)
      
      if (!rawData || rawData.length === 0) return ElMessage.error('导入失败：Excel 里没有数据')
      const firstRow = rawData[0]
      if (!firstRow['日期'] && !firstRow['客户姓名']) return ElMessage.error('导入失败：Excel 表头不匹配')

      const mappedData = rawData.map(row => {
        let rawDate = row['日期']
        let formattedDate = ''
        if (rawDate instanceof Date) formattedDate = `${rawDate.getMonth() + 1}月${rawDate.getDate()}日`
        else if (typeof rawDate === 'number') {
          const d = new Date(Math.round((rawDate - 25569) * 86400 * 1000))
          const utcD = new Date(d.getTime() + d.getTimezoneOffset() * 60000)
          formattedDate = `${utcD.getMonth() + 1}月${utcD.getDate()}日`
        } else formattedDate = rawDate || ''

        return {
          date: formattedDate, customerName: row['客户姓名'] || '', productName: row['商品名称/型号'] || row['商品名称'] || '',
          snCode: row['SN码'] || '', originalPrice: row['原价'] || 0, subsidy: row['补贴'] || 0, actualPrice: row['实付'] || 0,
          phone: row['电话'] || '', address: row['安装地址'] || '', isInvoiced: row['开票'] === '已开票', remark: row['备注'] || ''
        }
      })
      
      ElMessageBox.confirm('导入成功！请选择如何处理这批数据：', '导入确认', { distinguishCancelAndClose: true, confirmButtonText: '覆盖现有台账', cancelButtonText: '追加到末尾', type: 'warning' })
      .then(() => {
        currentLedger.value.records = mappedData
        currentPage.value = 1
        ledgerStore.saveToDb()
        ElMessage.success('已覆盖现有台账！')
      }).catch((action) => {
        if (action === 'cancel') {
          currentLedger.value.records.push(...mappedData)
          currentPage.value = 1
          ledgerStore.saveToDb()
          ElMessage.success('已追加到台账末尾！')
        }
      })
    } catch (err) {
      ElMessage.error('文件解析失败')
    }
  }
  reader.readAsArrayBuffer(file.raw)
}

const dialogVisible = ref(false)
const isAdding = ref(false)
const editForm = ref({})
const currentEditIndex = ref(-1)
const pickerDate = ref('') 

const calculateActual = () => {
  const orig = Number(editForm.value.originalPrice) || 0;
  const subs = Number(editForm.value.subsidy) || 0;
  editForm.value.actualPrice = parseFloat((orig - subs).toFixed(2));
}

const handleAdd = () => {
  isAdding.value = true
  currentEditIndex.value = -1
  editForm.value = { date: '', customerName: '', productName: '', snCode: '', originalPrice: '', subsidy: '', actualPrice: '', phone: '', address: '', isInvoiced: false, remark: '图片齐全' }
  pickerDate.value = new Date().toISOString().split('T')[0]
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isAdding.value = false
  editForm.value = JSON.parse(JSON.stringify(row))
  currentEditIndex.value = currentLedger.value.records.indexOf(row)
  const match = row.date.match(/(\d+)月(\d+)日/)
  if (match) pickerDate.value = `2026-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`
  else pickerDate.value = ''
  dialogVisible.value = true
}

const saveForm = () => {
  if (!pickerDate.value) return ElMessage.warning('请先选择日期')
  if (!editForm.value.customerName || !editForm.value.productName) return ElMessage.warning('请填写完整信息')

  const d = new Date(pickerDate.value)
  editForm.value.date = `${d.getMonth() + 1}月${d.getDate()}日`

  const formattedData = {
    ...editForm.value,
    originalPrice: Number(editForm.value.originalPrice) || 0,
    subsidy: Number(editForm.value.subsidy) || 0,
    actualPrice: Number(editForm.value.actualPrice) || 0,
  }

  if (isAdding.value) {
    currentLedger.value.records.push(formattedData)
    const totalPages = Math.ceil(currentLedger.value.records.length / pageSize.value)
    currentPage.value = totalPages
    ElMessage.success('新增成功！')
  } else {
    if (currentEditIndex.value > -1) {
      currentLedger.value.records[currentEditIndex.value] = formattedData
      ElMessage.success('修改成功！')
    }
  }
  ledgerStore.saveToDb()
  dialogVisible.value = false
}

// 🔥 核心：删除并移入回收站
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除这条销售记录吗？可在回收站找回。', '删除确认', { type: 'error' }).then(() => {
    const index = currentLedger.value.records.indexOf(row)
    if (index > -1) {
      const data = currentLedger.value.records.splice(index, 1)[0]
      const title = `${data.date} - ${data.customerName} - ${data.productName}`
      ledgerStore.moveToRecycleBin('record', title, data, currentLedger.value.id)
      ElMessage.success('已移入回收站')
    }
  }).catch(() => {})
}
</script>

<style scoped>
.page-container { padding: 8px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.toolbar-left { display: flex; align-items: center; }
.toolbar-right { display: flex; align-items: center; }
.title { font-size: 18px; font-weight: bold; }
.action-buttons { display: flex; justify-content: center; align-items: center; gap: 8px; }
.pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }

.sn-missing {
  background-color: #fef0f0; 
  color: #f56c6c;            
  font-weight: bold;         
  font-size: 12px;
  text-align: center;
  padding: 2px 4px;
  border-radius: 4px;
  width: 80%;                
  margin: 0 auto;
}

:deep(.el-table__body tr.current-row > td.el-table__cell) {
  background-color: #fde047 !important; 
  color: #333 !important; 
}

html.dark .sn-missing {
  background-color: #422222;
  color: #ff7875;
}
html.dark :deep(.el-table__body tr.current-row > td.el-table__cell) {
  background-color: #4b4b23 !important;
  color: #fff !important;
}
</style>