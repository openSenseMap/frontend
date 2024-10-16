/**
 * epic-stack: https://github.com/epicweb-dev/epic-stack/blob/main/vite.config.ts
 */

import mdx from "@mdx-js/rollup";
import { vitePlugin as remix } from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";

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
    remix({
      ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
    }),
    tsconfigPaths(),
  ],
});
