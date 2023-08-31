import { getClientLogoPngGreyBg } from "./clientLogos";

describe("getClientLogoPngGreyBg", () => {
  it("should return the correct logo for sesamy", () => {
    const expectedOutput =
      "https://image-proxy.sesamy.com/unsafe/format:png/rs:fill:166/aHR0cHM6Ly9hc3NldHMuc2VzYW15LmNvbS9zdGF0aWMvaW1hZ2VzL3Nlc2FteS9sb2dvLXRyYW5zbHVjZW50LnBuZw==";

    expect(getClientLogoPngGreyBg("sesamy")).toBe(expectedOutput);
  });
});
