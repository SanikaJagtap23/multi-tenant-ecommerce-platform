module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  setupFiles: ["./__tests__/env.setup.js"],
  testTimeout: 30000,
  maxWorkers: 1,
};
