// /**
//  * @type {import('@remix-run/dev').AppConfig}
//  */
// module.exports = {
//   cacheDirectory: "./node_modules/.cache/remix",
//   ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
//   serverDependenciesToBundle: ["chartjs-adapter-date-fns", "maplibre-gl", "supercluster", "use-supercluster", "kdbush", "postgres"],
//   serverModuleFormat: "cjs",
//   browserNodeBuiltinsPolyfill: { modules: { events: true } }
// };

import mdx from "@mdx-js/rollup";
import { vitePlugin as remix } from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";

export default defineConfig({
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
