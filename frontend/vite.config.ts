import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 开发时前端跑在 5173，后端在 8000；用代理把 /api 转给后端。
// 生产构建后由 FastAPI 统一托管（同域，无需代理）。
// GitHub Pages 等静态托管通过 VITE_BASE 设置子路径（如 /repo/），默认 "/"。
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  build: {
    outDir: "dist",
  },
});
