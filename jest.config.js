module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  testEnvironment: "jest-environment-jsdom",
  testRegex: "/test/.*\\.spec\\.ts$",
  collectCoverageFrom: ["src/**/*.{ts,js}"],
};
