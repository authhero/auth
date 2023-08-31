import { getClientLogoPngGreyBg } from "../../src/utils/clientLogos";

const IMAGE_PROXY_URL = "https://imgproxy.prod.sesamy.cloud";

describe("getClientLogoPngGreyBg", () => {
  it("should return the correct logo for sesamy", () => {
    const expectedOutput =
      "https://imgproxy.prod.sesamy.cloud/unsafe/format:png/rs:fill:166/aHR0cHM6Ly9hc3NldHMuc2VzYW15LmNvbS9zdGF0aWMvaW1hZ2VzL3Nlc2FteS9sb2dvLXRyYW5zbHVjZW50LnBuZw==";

    expect(getClientLogoPngGreyBg("sesamy", IMAGE_PROXY_URL)).toBe(
      expectedOutput,
    );
  });

  it("should return the correct logo for kvartal", () => {
    const expectedOutput =
      "https://imgproxy.prod.sesamy.cloud/unsafe/format:png/rs:fill:166/aHR0cHM6Ly9jaGVja291dC5zZXNhbXkuY29tL2ltYWdlcy9rdmFydGFsLWxvZ28uc3Zn";

    expect(getClientLogoPngGreyBg("kvartal", IMAGE_PROXY_URL)).toBe(
      expectedOutput,
    );
  });

  it("should return the correct logo for breakit", () => {
    const expectedOutput =
      "https://imgproxy.prod.sesamy.cloud/unsafe/format:png/rs:fill:166/aHR0cHM6Ly9hc3NldHMuc2VzYW15LmNvbS9sb2dvcy9icmVha2l0LnN2Zw==";

    expect(getClientLogoPngGreyBg("breakit", IMAGE_PROXY_URL)).toBe(
      expectedOutput,
    );
  });

  it('fall back to the sesamy logo for "unknown"', () => {
    const expectedOutput =
      "https://imgproxy.prod.sesamy.cloud/unsafe/format:png/rs:fill:166/aHR0cHM6Ly9hc3NldHMuc2VzYW15LmNvbS9zdGF0aWMvaW1hZ2VzL3Nlc2FteS9sb2dvLXRyYW5zbHVjZW50LnBuZw==";

    expect(getClientLogoPngGreyBg("unknown", IMAGE_PROXY_URL)).toBe(
      expectedOutput,
    );
  });
});
