import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import { default as swc } from "unplugin-swc";

export default defineConfig({
  build: {
    license: true,
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        vite: resolve(__dirname, "src/vite.ts"),
        router: resolve(__dirname, "src/router.ts"),
        query: resolve(__dirname, "src/data-fetching.ts"),
        state: resolve(__dirname, "src/state.ts"),
        batching: resolve(__dirname, "src/batching.ts"),
      },
      name: "NitroJS",
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        const extension = format === "es" ? "mjs" : "cjs";
        return `${entryName}.${extension}`;
      }
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react-router",
        "react-router/dom",
        "vite",
        "node:async_hooks",
        "node:path",
        "node:url",
        "node:fs",
        "lru-cache",
        "@vitejs/plugin-react",
        "@remix-run/node-fetch-server",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react-router": "ReactRouter",
          "react-router/dom": "ReactRouterDOM"
        },
        // Preserve module structure
        preserveModules: false,
        // Ensure proper exports
        exports: "named"
      }
    },

    target: "esnext",
    minify: false, // Keep readable for debugging
    sourcemap: true,
    outDir: "dist",
    emptyOutDir: true
  },

  plugins: [
    swc.vite(),
    
    // Generate TypeScript declaration files
    dts({
      include: ["src/**/*"],
      exclude: [
        "src/**/*.test.ts", 
        "src/**/*.spec.ts", 
        "examples/**/*",
        "**/examples/**/*",
        "**/*.example.*"
      ],
      outDir: "dist/types",
      insertTypesEntry: true,
      rollupTypes: true,
      bundledPackages: ["lru-cache"]
    })
  ],

  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "lru-cache"],
    exclude: ["vite"]
  },

  // Define for build-time constants
  define: {
    __DEV__: "process.env.NODE_ENV !== 'production'",
    __VERSION__: JSON.stringify(process.env.npm_package_version || "0.5.0")
  },

  // Ensure proper resolution for library build
  resolve: {
    conditions: ["import", "module", "browser", "default"]
  },

  // Explicitly exclude examples from any processing
  server: {
    fs: {
      deny: ["examples/**"]
    }
  }
});