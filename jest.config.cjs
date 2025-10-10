module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/index.js'],
};
