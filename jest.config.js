export default {
  testEnvironment: "jsdom",
  transform: {},
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.js", "!src/**/*.test.js", "!src/test/**"],
  moduleFileExtensions: ["js"],
  setupFiles: ["<rootDir>/src/test/setupTests.js"],
  testMatch: ["**/?(*.)+(test).js"]
};
