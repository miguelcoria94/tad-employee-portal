import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  server: {
    // Preferred dev port. strictPort:false lets Vite auto-bump to the next
    // free port if this one is taken (e.g. an orphaned dev server).
    port: 5180,
    strictPort: false,
  },
});