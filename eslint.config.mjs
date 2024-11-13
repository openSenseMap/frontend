import unicorn from "eslint-plugin-unicorn";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends(
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest-testing-library",
    "prettier",
), {
    plugins: {
        unicorn,
    },

    languageOptions: {
        globals: {},
    },

    settings: {
        jest: {
            version: 28,
        },
    },

    rules: {
        "unicorn/filename-case": ["error", {
            case: "kebabCase",
        }],
    },
}, {
    files: [
        "app/routes/**/*.ts",
        "app/routes/**/*.js",
        "app/routes/**/*.tsx",
        "app/routes/**/*.jsx",
    ],

    rules: {
        "unicorn/filename-case": "off",
    },
}];