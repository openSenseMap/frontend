import { defineConfig } from "oxlint";

export default defineConfig({
  rules: {
    "no-alert": "error",
    "oxc/approx-constant": "warn",
    "no-plusplus": "off",
    "eslint/prefer-const": ["error", { destructuring: "any" }],
  },
});
