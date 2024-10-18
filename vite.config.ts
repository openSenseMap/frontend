/**
 * epic-stack: https://github.com/epicweb-dev/epic-stack/blob/main/vite.config.ts
 */

import mdx from "@mdx-js/rollup";
import { vitePlugin as remix } from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import preserveDirectives from "rollup-preserve-directives";

const MODE = process.env.NODE_ENV;

export default defineConfig({
  build: {
    cssMinify: MODE === "production",

    rollupOptions: {
      external: [/node:.*/, "fsevents"],
    },

    sourcemap: true, // not sure if we really should use it
  },
  plugins: [
    mdx({
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
    }),
    preserveDirectives(),
    tsconfigPaths(),
    remix({
      ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
      future: {
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
  ],
});
