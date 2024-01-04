module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  testTimeout: 15000,
  testRegex: "/integration-test/.*\\.spec\\.ts$",
  setupFilesAfterEnv: ["./jest-integration.setup.js"],
};
