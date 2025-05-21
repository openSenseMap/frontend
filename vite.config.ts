import { reactRouter } from "@react-router/dev/vite";
import preserveDirectives from "rollup-preserve-directives";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      external: [/node:.*/, "fsevents"],
      output: {
        format: "es",
      },
    },
  },
  plugins: [
    // https://github.com/remix-run/remix/issues/9871 prevents this from
    // being enabled in test mode...
    process.env.NODE_ENV === 'test' ? null : reactRouter(),
    preserveDirectives(), // makes sure directives such as "use client" are present in the output bundle
    tsconfigPaths(), // enables paths in tsconfig such as ~/ as a shortcut for ./app    
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
  },
});
