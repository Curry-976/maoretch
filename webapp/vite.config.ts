import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
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
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.jpg", "logo-mark.svg", "favicon.ico"],
      manifest: {
        name: "Maore-Tech CRM",
        short_name: "Maore-Tech",
        description:
          "CRM revente de téléphones — Maore-Tech, Mamoudzou (Mayotte).",
        lang: "fr",
        dir: "ltr",
        theme_color: "#FAF8F3",
        background_color: "#FAF8F3",
        display: "standalone",
        orientation: "portrait",
        start_url: "/dashboard",
        scope: "/",
        categories: ["business", "productivity"],
        icons: [
          {
            src: "/logo.jpg",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "/logo.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "/logo.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Ajouter un téléphone",
            short_name: "Ajouter",
            description: "Enregistrer un nouveau téléphone",
            url: "/add-phone",
          },
          {
            name: "Pipeline",
            short_name: "Pipeline",
            description: "Voir le pipeline visuel",
            url: "/pipeline",
          },
          {
            name: "Clients",
            short_name: "Clients",
            description: "Carnet de clients",
            url: "/clients",
          },
        ],
      },
      workbox: {
        // Never serve cached pages for the API — always go to network.
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ["**/*.{js,css,html,jpg,png,svg,woff,woff2,ico}"],
        // Be generous; the bundle is comfortably under 5 MB.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Cache the OS font files for snappy reloads.
            urlPattern: /^https:\/\/api\.fontshare\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "fontshare-css",
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-files",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
