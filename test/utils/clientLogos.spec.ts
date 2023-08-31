import { getClientLogoPngGreyBg } from "../../src/utils/clientLogos";

const IMAGE_PROXY_URL = "https://imgproxy.prod.sesamy.cloud";

describe("getClientLogoPngGreyBg", () => {
  it("should return the correct logo for kvartal", () => {
    const expectedOutput =
      "https://imgproxy.prod.sesamy.cloud/unsafe/format:png/rs:fill:166/aHR0cHM6Ly9jaGVja291dC5zZXNhbXkuY29tL2ltYWdlcy9rdmFydGFsLWxvZ28uc3Zn";

    expect(
      getClientLogoPngGreyBg(
        "https://checkout.sesamy.com/images/kvartal-logo.svg",
        IMAGE_PROXY_URL,
      ),
    ).toBe(expectedOutput);
  });

  it("should return the correct logo for breakit", () => {
    const expectedOutput =
      "https://imgproxy.prod.sesamy.cloud/unsafe/format:png/rs:fill:166/aHR0cHM6Ly9hc3NldHMuc2VzYW15LmNvbS9sb2dvcy9icmVha2l0LnN2Zw==";

    expect(
      getClientLogoPngGreyBg(
        "https://assets.sesamy.com/logos/breakit.svg",
        IMAGE_PROXY_URL,
      ),
    ).toBe(expectedOutput);
  });
});
