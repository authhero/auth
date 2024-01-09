module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  testTimeout: 10000,
  testEnvironment: "jest-environment-jsdom",
  testRegex: "/test/.*\\.spec\\.ts$",
  collectCoverageFrom: ["src/**/*.{ts,js}"],
  setupFilesAfterEnv: ["./jest.setup.js"],
};
