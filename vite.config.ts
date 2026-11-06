import { defineConfig, loadEnv } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

export default defineConfig(({ mode }) => {
  const developmentEnv = mode === "development" ? {} : loadEnv("development", process.cwd(), "");
  const env = { ...developmentEnv, ...loadEnv(mode, process.cwd(), "") };
  return {
    // The uni-app and admin Vite servers run together in `npm run dev`.
    // Keep their optimized dependencies separate so one server cannot
    // invalidate the other's browser URLs with an "Outdated Optimize Dep".
    cacheDir: "node_modules/.vite-uni",
    plugins: [uni()],
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(env.VITE_API_BASE_URL || ""),
      "import.meta.env.VITE_MP_API_BASE_URL": JSON.stringify(env.VITE_MP_API_BASE_URL || ""),
    },
    server: {
      host: env.VITE_DEV_HOST || "0.0.0.0",
      port: Number(env.VITE_DEV_PORT) || 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3000",
          changeOrigin: true,
        },
        "/uploads": {
          target: env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3000",
          changeOrigin: true,
        },
      },
    },
  };
});
