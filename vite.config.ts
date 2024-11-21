/**
 * epic-stack: https://github.com/epicweb-dev/epic-stack/blob/main/vite.config.ts
 */

import mdx from "@mdx-js/rollup";
import { vitePlugin as remix } from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
// import { flatRoutes } from "remix-flat-routes";

import preserveDirectives from "rollup-preserve-directives";

const MODE = process.env.NODE_ENV;

declare module "@remix-run/node" {
  // or cloudflare, deno, etc.
  interface Future {
    v3_singleFetch: true;
  }
}

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
    mdx({
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
    }),
    preserveDirectives(),
    tsconfigPaths(),
    process.env.NODE_ENV === "test"
      ? null
      : remix({
          future: {
            v3_fetcherPersist: true,
            v3_relativeSplatPath: true,
            v3_throwAbortReason: true,
            v3_singleFetch: true,
            // v3_lazyRouteDiscovery: true,
            unstable_routeConfig: true,
          },
          ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
        }),
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
