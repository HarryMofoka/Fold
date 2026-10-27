import react from "@vitejs/plugin-react-swc";
import { compression, defineAlgorithm } from "vite-plugin-compression2";
import fs from "node:fs/promises";
import path, { resolve } from "node:path";
import { constants, brotliCompress, gzip } from "node:zlib";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { iconSvgr } from "./scripts/icons/svgrOptions.mts";
import { viteStaticCopy } from "vite-plugin-static-copy";

const gzipPromise = promisify(gzip);
const brotliPromise = promisify(brotliCompress);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function compressStaticCopyPlugin(): PluginOption {
  return {
    name: "compress-static-copy",
    apply: "build" as const,
    async closeBundle() {
      const distDir = path.resolve(__dirname, "dist");
      const targets = ["pdfium", "vendor", "pdfjs"];

      const excludedExtensions = [
        ".gz",
        ".br",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".woff",
        ".woff2",
      ];

      async function walkAndCompress(dirOrFile: string) {
        let stat;
        try {
          stat = await fs.stat(dirOrFile);
        } catch {
          return;
        }

        if (stat.isFile()) {
          const ext = path.extname(dirOrFile).toLowerCase();
          if (stat.size >= 1024 && !excludedExtensions.includes(ext)) {
            const content = await fs.readFile(dirOrFile);

            const gzipped = await gzipPromise(content, { level: 9 });
            await fs.writeFile(`${dirOrFile}.gz`, gzipped);

            const brotlied = await brotliPromise(content, {
              params: {
                [constants.BROTLI_PARAM_QUALITY]: 11,
              },
            });
            await fs.writeFile(`${dirOrFile}.br`, brotlied);
          }
        } else if (stat.isDirectory()) {
          const entries = await fs.readdir(dirOrFile);
          await Promise.all(
            entries.map((entry) =>
              walkAndCompress(path.join(dirOrFile, entry)),
            ),
          );
        }
      }

      await Promise.all(
        targets.map((target) => walkAndCompress(path.join(distDir, target))),
      );
    },
  };
}

export default defineConfig(() => {
  return {
    cacheDir: resolve(__dirname, "node_modules", ".vite"),
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@app": resolve(__dirname, "src"),
        "@core": resolve(__dirname, "src"),
        "@proprietary": resolve(__dirname, "src"),
        "@portal": resolve(__dirname, "src/portal"),
        "@desktop": resolve(__dirname, "src/desktop"),
      },
    },
    define: {
      __DEV_WORKTREE_LABEL__: JSON.stringify("fold"),
    },
    plugins: [
      iconSvgr(),
      react(),
      tsconfigPaths(),
      compression({
        threshold: 1024,
        exclude: [/\.(png|jpg|jpeg|gif|webp|woff|woff2)$/],
        algorithms: [
          defineAlgorithm("gzip", { level: 9 }),
          defineAlgorithm("brotliCompress", {
            params: {
              [constants.BROTLI_PARAM_QUALITY]: 11,
            },
          }),
        ],
      }),
      viteStaticCopy({
        targets: [
          {
            src: "node_modules/@embedpdf/pdfium/dist/pdfium.wasm",
            dest: "pdfium",
          },
          {
            src: "public/vendor/jscanify/*",
            dest: "vendor/jscanify",
          },
          {
            src: "node_modules/pdfjs-dist/cmaps/*",
            dest: "pdfjs/cmaps",
          },
          {
            src: "node_modules/pdfjs-dist/standard_fonts/*",
            dest: "pdfjs/standard_fonts",
          },
          {
            src: "src/assets/brand/modern-logo/*",
            dest: "modern-logo",
          },
        ],
      }),
      compressStaticCopyPlugin(),
    ],
    worker: {
      plugins: () => [tsconfigPaths()],
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      watch: {
        ignored: ["**/src-tauri/**"],
      },
    },
    preview: {
      host: true,
      port: 5173,
      strictPort: true,
    },
    build: {
      target: "esnext",
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules")) {
              if (id.includes("pdfjs-dist")) return "vendor-pdfjs";
              if (id.includes("@embedpdf")) return "vendor-embedpdf";
              if (id.includes("react") || id.includes("@mantine")) {
                return "vendor-ui";
              }
              if (id.includes("@cantoo/pdf-lib") || id.includes("pdf-lib"))
                return "vendor-pdflib";
              if (
                id.includes("recharts") ||
                id.includes("d3") ||
                id.includes("decimal.js")
              )
                return "vendor-charts";
              if (id.includes("jszip") || id.includes("pako"))
                return "vendor-zip";
              if (id.includes("i18next")) return "vendor-i18n";
            }
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ["@embedpdf/pdfium"],
    },
    base: "./",
  };
});
