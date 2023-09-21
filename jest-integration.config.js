module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
  testRegex: "/integration-test/.*\\.spec\\.ts$",
  collectCoverageFrom: ["src/**/*.{ts,js}"],
};
