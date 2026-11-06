import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const projectRoot = path.resolve(__dirname, "..");
  const env = loadEnv(mode, projectRoot, "");
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3000";
  return {
    root: __dirname,
    base: "/admin/",
    // Do not share Vite's dependency cache with the concurrently running
    // uni-app development server in the repository root.
    cacheDir: path.resolve(projectRoot, "node_modules/.vite-admin"),
    plugins: [vue()],
    build: {
      outDir: path.resolve(__dirname, "../dist/admin"),
      emptyOutDir: true,
    },
    server: {
      host: env.VITE_ADMIN_DEV_HOST || "0.0.0.0",
      port: Number(env.VITE_ADMIN_DEV_PORT) || 5174,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/uploads": { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
