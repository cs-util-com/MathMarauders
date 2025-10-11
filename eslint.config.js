import js from "@eslint/js";
import jestPlugin from "eslint-plugin-jest";

export default [
  {
    ...js.configs.recommended,
    files: ["src/**/*.js"],
    languageOptions: {
      sourceType: "module",
      globals: {
        console: "readonly",
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        global: "readonly"
      }
    },
    plugins: {
      jest: jestPlugin
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["error", { args: "none", ignoreRestSiblings: true }]
    }
  },
  {
    files: ["src/**/*.test.js"],
    plugins: {
      jest: jestPlugin
    },
    languageOptions: {
      globals: {
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly"
      }
    },
    rules: {
      "jest/expect-expect": "warn",
      "jest/no-identical-title": "error"
    }
  }
];
