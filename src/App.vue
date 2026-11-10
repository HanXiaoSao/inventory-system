<template>
  <el-container class="layout-container">
    <!-- 左侧菜单栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside" :class="{ 'is-dark': isDark }">
      <div class="logo">
        <el-icon size="24" color="#409eff"><Shop /></el-icon>
        <span v-show="!isCollapse">海尔专卖店</span>
      </div>
      
      <!-- 菜单容器 -->
      <div class="menu-container">
        <el-menu
          :default-active="currentRoute"
          class="el-menu-vertical"
          :collapse="isCollapse"
          :background-color="isDark ? '#1d1e1f' : '#ffffff'"
          :text-color="isDark ? '#e5eaf3' : '#606266'"
          active-text-color="#409eff"
          :router="true"
          :collapse-transition="false"
        >
          <el-menu-item index="/ledgers">
            <el-icon><Tickets /></el-icon>
            <template #title>台账目录</template>
          </el-menu-item>
          <el-menu-item index="/inventory">
            <el-icon><ShoppingCart /></el-icon>
            <template #title>商品库存</template>
          </el-menu-item>
          <el-menu-item index="/invoice">
            <el-icon><Printer /></el-icon>
            <template #title>开票大厅</template>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Download /></el-icon>
            <template #title>数据备份</template>
          </el-menu-item>
          <el-menu-item index="/recycle-bin">
            <el-icon><Delete /></el-icon>
            <template #title>回收站</template>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 🔥 折叠按钮：移到了侧边栏底部 -->
      <div class="sidebar-footer" @click="toggleCollapse">
        <el-icon size="20">
          <Fold v-if="!isCollapse" />
          <Expand v-else />
        </el-icon>
        <span v-show="!isCollapse" style="margin-left: 10px; font-size: 14px;">收起侧边栏</span>
      </div>
    </el-aside>

    <!-- 右侧内容区 -->
    <el-container>
      <el-header class="header">
        <!-- 左侧：只保留标题 -->
        <div class="header-left">
          <div class="header-title">门店进销存系统</div>
        </div>

        <!-- 右侧：主题切换 + 管理员 -->
        <div class="header-right">
          <el-switch
            v-model="isDark"
            inline-prompt
            :active-icon="Moon"
            :inactive-icon="Sunny"
            @change="toggleDark"
            style="margin-right: 20px;"
          />
          <div class="header-user">管理员</div>
        </div>
      </el-header>
      
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useLedgerStore } from './stores/ledger'
import { Moon, Sunny, Fold, Expand } from '@element-plus/icons-vue'

const route = useRoute()
const ledgerStore = useLedgerStore()
const currentRoute = computed(() => route.path)

const isCollapse = ref(false)
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const isDark = ref(false)
const toggleDark = () => {
  const html = document.documentElement
  if (isDark.value) {
    html.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    html.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else if (savedTheme === 'light') {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = prefersDark
    if (prefersDark) document.documentElement.classList.add('dark')
  }
  ledgerStore.loadFromDb()
})
</script>

<style>
body { margin: 0; padding: 0; font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Microsoft YaHei", sans-serif; }
.layout-container { height: 100vh; }

/* ================= 侧边栏样式 ================= */
.aside {
  display: flex;
  flex-direction: column; /* 垂直排列，让底部按钮沉底 */
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  border-right: 1px solid #ebeef5;
  background-color: #ffffff;
  transition: width 0.3s, background-color 0.3s;
  overflow: hidden;
}
.aside.is-dark {
  background-color: #1d1e1f;
  border-right: 1px solid #333;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  gap: 10px;
  border-bottom: 1px solid #ebeef5;
  color: #303133;
  white-space: nowrap;
  flex-shrink: 0;
}
.aside.is-dark .logo { border-bottom: 1px solid #333; color: #ffffff; }

.menu-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.el-menu-vertical { border-right: none; }
.el-menu--collapse .el-menu-item { justify-content: center; }

/* 🔥 底部折叠按钮样式 */
.sidebar-footer {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-top: 1px solid #ebeef5;
  color: #606266;
  transition: all 0.3s;
  flex-shrink: 0;
}
.sidebar-footer:hover {
  background-color: #f5f7fa;
  color: #409eff;
}
.aside.is-dark .sidebar-footer {
  border-top: 1px solid #333;
  color: #a3a6ad;
}
.aside.is-dark .sidebar-footer:hover {
  background-color: #2b2b2b;
  color: #409eff;
}

/* ================= 顶栏样式 ================= */
.header { background-color: transparent; display: flex; justify-content: space-between; align-items: center; padding: 0 24px; height: 64px; }
.header-left { display: flex; align-items: center; }
.header-title { font-size: 20px; font-weight: 600; color: #303133; }
html.dark .header-title { color: #e5eaf3; }
.header-right { display: flex; align-items: center; }
.header-user { color: #606266; font-size: 14px; font-weight: 500; }
html.dark .header-user { color: #a3a6ad; }
.main { padding: 12px 24px 24px 24px; overflow-y: auto; }
</style>