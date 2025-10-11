const path = require("path");

const rootDir = path.resolve(__dirname, "..");

module.exports = {
  rootDir,
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.js$": [
      "babel-jest",
      { configFile: path.join(rootDir, "babel.config.js") },
    ],
  },
  moduleFileExtensions: ["js", "json"],
  roots: ["<rootDir>/src"],
  collectCoverageFrom: ["src/**/*.js", "!src/**/*.test.js"],
};
