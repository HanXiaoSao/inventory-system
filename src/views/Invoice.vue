<template>
  <div class="invoice-container">
    <!-- ================= 操作界面（平时看到的） ================= -->
    <div class="screen-only">
      <el-card class="box-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span style="font-weight: bold; font-size: 18px;">
              开票大厅 
              <span style="font-size: 12px; color: #909399; font-weight: normal; margin-left: 10px;">
                (A4纸打印上半截，最多支持8行商品)
              </span>
            </span>
            <div>
              <el-button type="primary" icon="Printer" @click="handlePrint">打印预览</el-button>
            </div>
          </div>
        </template>

        <!-- 客户信息表单 -->
        <el-form :model="invoiceData" label-width="80px" class="customer-form">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="收货人">
                <el-input v-model="invoiceData.customerName" placeholder="请输入姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <el-form-item label="收货地址">
                <el-input v-model="invoiceData.address" placeholder="请输入详细地址" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="电话">
                <el-input v-model="invoiceData.phone" placeholder="联系电话" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="日期">
                <el-date-picker v-model="invoiceData.date" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- 商品列表表格 -->
        <el-table :data="invoiceData.items" border style="width: 100%; margin-top: 10px;">
          <el-table-column label="商品名称" min-width="180">
            <template #default="scope">
              <el-input v-model="scope.row.name" placeholder="手敲商品名" />
            </template>
          </el-table-column>
          <el-table-column label="规格型号" min-width="150">
            <template #default="scope">
              <el-input v-model="scope.row.model" placeholder="如：BCD217" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120">
            <template #default="scope">
              <el-input v-model="scope.row.price" type="text" @input="calcAmount(scope.row)" />
            </template>
          </el-table-column>
          <el-table-column label="数量" width="100">
            <template #default="scope">
              <el-input v-model="scope.row.quantity" type="text" @input="calcAmount(scope.row)" />
            </template>
          </el-table-column>
          <el-table-column label="金额" width="120">
            <template #default="scope">
              <span style="font-weight: bold;">{{ formatMoney(scope.row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="120">
            <template #default="scope">
              <el-input v-model="scope.row.remark" placeholder="备注" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="scope">
              <el-button type="danger" link icon="Delete" @click="removeRow(scope.$index)">删</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 底部操作区 -->
        <div class="bottom-actions">
          <el-button type="success" plain icon="Plus" @click="addRow">添加一行</el-button>
          <div class="total-info">
            <span>合计金额：</span>
            <span class="total-number">¥ {{ formatMoney(totalAmount) }}</span>
          </div>
        </div>

        <el-form :model="invoiceData" label-width="80px" style="margin-top: 20px;">
          <el-form-item label="开票人">
            <el-input v-model="invoiceData.issuer" placeholder="填写开票人姓名" style="width: 200px;" />
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- ================= 打印专用区 ================= -->
    <div class="print-only">
      <div class="print-paper">
        <!-- 大标题 -->
        <div class="p-title">海尔专卖店(三桥店)销售单</div>
        
        <!-- 头部信息 -->
        <div class="p-header">
          <div class="p-row">
            <div class="p-col"><strong>收货人员：</strong>{{ invoiceData.customerName }}</div>
            <div class="p-col"><strong>联系方式：</strong>{{ invoiceData.phone }}</div>
            <div class="p-col"><strong>日期：</strong>{{ invoiceData.date }}</div>
          </div>
          <div class="p-row">
            <div class="p-col" style="flex: 2;"><strong>收货地址：</strong>{{ invoiceData.address }}</div>
          </div>
        </div>

        <!-- 表格 -->
        <table class="p-table">
          <thead>
            <tr>
              <th width="26%">商品名称</th>
              <th width="24%">规格型号</th>
              <th width="12%">单价</th>
              <th width="8%">数量</th>
              <th width="12%">金额</th>
              <th width="18%">备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in invoiceData.items" :key="index">
              <td>{{ item.name }}</td>
              <td>{{ item.model }}</td>
              <td>{{ formatMoney(item.price) }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ formatMoney(item.amount) }}</td>
              <td>{{ item.remark }}</td>
            </tr>
            <!-- 自动补齐空白行 -->
            <tr v-for="i in printBlankRows" :key="'blank-'+i">
              <td>&nbsp;</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <!-- 底部信息 -->
        <div class="p-footer">
          <div class="p-total"><strong>合计：</strong> ¥ {{ formatMoney(totalAmount) }}</div>
          <div class="p-sign">
            <div><strong>开票人：</strong>{{ invoiceData.issuer }}</div>
            <div><strong>联系电话：</strong>13839693068</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const getEmptyRow = () => ({
  name: '', model: '', price: '', quantity: 1, amount: '', remark: ''
})

const invoiceData = ref({
  customerName: '', address: '', phone: '',
  date: new Date().toISOString().split('T')[0],
  issuer: '韩龙庆',
  items: [getEmptyRow()] 
})

const formatMoney = (val) => {
  if (!val && val !== 0) return '';
  const num = Number(val);
  return isNaN(num) ? '' : parseFloat(num.toFixed(2));
}

const calcAmount = (row) => {
  const p = Number(row.price) || 0;
  const q = Number(row.quantity) || 0;
  row.amount = p * q;
}

const totalAmount = computed(() => {
  return invoiceData.value.items.reduce((sum, item) => {
    return sum + (Number(item.amount) || 0)
  }, 0)
})

const printBlankRows = computed(() => {
  const currentRows = invoiceData.value.items.length;
  const minRows = 6; 
  return currentRows < minRows ? minRows - currentRows : 0;
})

const addRow = () => {
  if (invoiceData.value.items.length >= 8) {
    ElMessage.warning('A4纸打半截最多支持8行商品明细，无法再添加啦！')
    return
  }
  invoiceData.value.items.push(getEmptyRow())
}

const removeRow = (index) => {
  invoiceData.value.items.splice(index, 1)
}

const handlePrint = () => {
  if (!invoiceData.value.customerName) return ElMessage.warning('请至少填写收货人姓名')
  const hasData = invoiceData.value.items.some(item => item.name && item.name.trim() !== '')
  if (!hasData) return ElMessage.warning('请至少填写一行商品信息')
  window.print()
}
</script>

<style scoped>
.invoice-container { height: 100%; }
.box-card { min-height: calc(100vh - 120px); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.customer-form { background-color: #f8f9fa; padding: 15px 15px 0 15px; border-radius: 6px; margin-bottom: 10px; }
.bottom-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; background-color: #f8f9fa; padding: 15px; border-radius: 6px; }
.total-info { font-size: 18px; display: flex; align-items: center; }
.total-number { color: #f56c6c; font-weight: bold; font-size: 24px; margin-left: 10px; }
.print-only { display: none; }
</style>

<!-- 全局打印样式 -->
<style>
@media print {
  .el-aside, .el-header { display: none !important; }
  .layout-container, .el-container { display: block !important; height: auto !important; overflow: visible !important; }
  .main { padding: 0 !important; margin: 0 !important; }
  .screen-only { display: none !important; }
  .print-only { display: block !important; width: 100%; }

  /* 告诉系统：用 A4 纸纵向，上下左右留 10mm 边距 */
  @page {
    size: A4 portrait; 
    margin: 10mm; 
  }

  body {
    background-color: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    margin: 0;
    padding: 0;
  }

  /* 
    🔥 终极修复溢出问题：
    强制设定宽度为 188mm（系统可用宽度约 190mm，留 2mm 安全余量，绝对不会溢出切边）
    高度设为 130mm（A4 总高 297mm - 20mm 边距 = 277mm。130mm 刚好够打两张，中间留空隙方便裁剪）
  */
  .print-paper {
    width: 188mm; 
    height: 130mm; 
    margin: 0 auto; /* 居中显示 */
    font-family: "SimSun", "宋体", "Microsoft YaHei", sans-serif;
    color: #000;
    display: flex;
    flex-direction: column;
    page-break-inside: avoid; 
    break-inside: avoid;
  }

  .p-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 8px; letter-spacing: 2px; }
  .p-header { margin-bottom: 8px; font-size: 13px; }
  .p-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .p-col { flex: 1; }

  .p-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; table-layout: fixed; flex-grow: 1; }
  .p-table th, .p-table td { border: 1px solid #000; padding: 4px 2px; text-align: center; font-size: 13px; word-wrap: break-word; word-break: break-all; }
  .p-table th { font-weight: bold; height: 26px; }
  .p-table td { height: 26px; }

  .p-footer { display: flex; justify-content: space-between; align-items: flex-end; font-size: 13px; margin-top: auto; }
  .p-total { font-size: 16px; }
  .p-sign { text-align: right; line-height: 1.6; }
}
</style>