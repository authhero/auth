module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  testRegex: "/integration-test/flows/code-flow.spec\\.ts$",
  setupFilesAfterEnv: ["./jest-integration.setup.js"],
};
