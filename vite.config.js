import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  // 1. 禁止 Vite 清空终端屏幕，防止 Tauri 识别不到信号
  clearScreen: false,
  
  server: {
    // 2. 锁定 5173 端口，如果被占用了直接报错，而不是悄悄换端口导致 Tauri 找不到
    port: 5173,
    strictPort: true,
    watch: {
      // 3. 告诉 Vite 别去偷看 Rust 的文件夹
      ignored: ["**/src-tauri/**"],
    },
  },
});