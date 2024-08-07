/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest-testing-library",
    "prettier",
  ],
  env: {
    "cypress/globals": true,
  },
  plugins: ["cypress", "unicorn"],
  // We're using vitest which has a very similar API to jest
  // (so the linting plugins work nicely), but we have to
  // set the jest version explicitly.
  settings: {
    jest: {
      version: 28,
    },
  },
  // Enable kebabCase filename convention for all files
  rules: {
    "unicorn/filename-case": [
      "error",
      {
        case: "kebabCase",
      },
    ],
  },
  // But disable kebabCase filename convention for all files
  // in /app/routes because of remix.run filename conventions
  overrides: [
    {
      files: [
        "app/routes/**/*.ts",
        "app/routes/**/*.js",
        "app/routes/**/*.tsx",
        "app/routes/**/*.jsx",
      ],
      rules: {
        "unicorn/filename-case": "off",
      },
    },
  ],
};
