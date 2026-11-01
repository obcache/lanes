import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "dist/renderer", emptyOutDir: true },
  test: { include: ["tests/**/*.test.ts"] },
  server: { port: 5173, strictPort: true },
});
