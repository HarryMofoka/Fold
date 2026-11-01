import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { iconSvgr } from "./scripts/icons/svgrOptions.mts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths(), iconSvgr()],
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "src"),
      "@core": path.resolve(__dirname, "src"),
      "@proprietary": path.resolve(__dirname, "src"),
      "@portal": path.resolve(__dirname, "src/portal"),
      "@desktop": path.resolve(__dirname, "src/desktop"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/setupTests.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
