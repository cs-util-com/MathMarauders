const js = require("@eslint/js");

module.exports = [
  {
    ignores: ["node_modules/*", "dist/*"],
  },
  js.configs.recommended,
  {
    languageOptions: {
      sourceType: "module",
      globals: {
        document: "readonly",
        window: "readonly",
        console: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        performance: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    rules: {
      "no-console": ["warn", { allow: ["info", "error", "warn"] }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["**/*.test.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        jest: "readonly",
      },
    },
  },
  {
    files: ["babel.config.js", "config/**/*.js", "config/**/*.cjs"],
    languageOptions: {
      globals: {
        module: "writable",
        require: "readonly",
        __dirname: "readonly",
      },
    },
  },
];
