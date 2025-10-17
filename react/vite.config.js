import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/main.jsx",
      name: "HomePortalPlugin",
      fileName: () => "js/script.js",
      formats: ["iife"],
    },
    outDir: "../src/assets", // ✅ output base folder
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "js/script.js", // ✅ JS in /js
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "css/main[extname]"; // ✅ force name to main.css
          }
          return "js/[name][extname]";
        },
      },
    },
  },
  define: {
    "process.env": {},
  },
});
