/**
 * epic-stack: https://github.com/epicweb-dev/epic-stack/blob/main/vite.config.ts
 */

import { reactRouter } from "@react-router/dev/vite";
import preserveDirectives from "rollup-preserve-directives";
import { defineConfig } from "vite";
// import { flatRoutes } from "remix-flat-routes";

import tsconfigPaths from "vite-tsconfig-paths";

const MODE = process.env.NODE_ENV;

// declare module "@remix-run/node" {
//   // or cloudflare, deno, etc.
//   interface Future {
//     v3_singleFetch: true;
//   }
// }

export default defineConfig({
  esbuild: {
    target: "es2022",
  },
  build: {
    target: "es2022",
    cssMinify: MODE === "production",
    rollupOptions: {
      external: [/node:.*/, "fsevents"],
      output: {
        format: "es",
      },
    },
    sourcemap: true, // not sure if we really should use it
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
  },
  plugins: [
    preserveDirectives(),
    tsconfigPaths(),
    process.env.NODE_ENV === "test" ? null : reactRouter(),
  ],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./test/setup-test-env.ts"],
    include: ["./app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      ".*\\/node_modules\\/.*",
      ".*\\/build\\/.*",
      ".*\\/postgres-data\\/.*",
    ],
  },
});
