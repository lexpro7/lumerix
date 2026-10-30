import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  worker: { format: "es" },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "LightDNA — Photo Color Studio",
        short_name: "LightDNA",
        description: "Private, offline-first photo color grading.",
        theme_color: "#141416",
        background_color: "#141416",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        globIgnores: ["ai/**", "**/*.wasm"],
        maximumFileSizeToCacheInBytes: 5000000,
        runtimeCaching: [
          {
            urlPattern: /\/ai\/mediapipe\//,
            handler: "CacheFirst",
            options: {
              cacheName: "lightdna-ai-runtime-v1",
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(wasm|mjs)(\?.*)?$/,
            handler: "CacheFirst",
            options: {
              cacheName: "lightdna-inference-runtime-v1",
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
