import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8000,
    allowedHosts: true,
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true, secure: false },
    },
  },
  build: { outDir: "dist", sourcemap: false },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
