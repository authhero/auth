module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  testTimeout: 20000,
  testRegex: "/integration-test/.*\\.spec\\.ts$",
  setupFilesAfterEnv: ["./jest-integration.setup.js"],
};
