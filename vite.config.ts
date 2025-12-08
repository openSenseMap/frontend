import { reactRouter } from "@react-router/dev/vite";
import preserveDirectives from "rollup-preserve-directives";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Make .env variables available in tests
  // Might be required only because reactRouter() is disabled in test mode
  if (mode === "test") {
    // Loads .env, .env.test, etc.
    const env = loadEnv(mode, process.cwd(), "");
    Object.assign(process.env, env);
  }

  return {
    server: {
      port: 3000,
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
      mode === "test" ? null : reactRouter(),
      preserveDirectives(), // makes sure directives such as "use client" are present in the output bundle
      tsconfigPaths(), // enables paths in tsconfig such as ~/ as a shortcut for ./app
    ],
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
      include: ["**/*.{test,spec}.{ts,tsx}"],
      coverage: {
        reporter: ["text", "json-summary", "json"],
      },
      testTimeout: 10_000,
    },
  };
});
