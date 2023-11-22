module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  testTimeout: 40000,
  testRegex: "/integration-test/management-api/use.*\\.spec\\.ts$",
  setupFilesAfterEnv: ["./jest-integration.setup.js"],
};
