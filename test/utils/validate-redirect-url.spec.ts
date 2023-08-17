import { validateRedirectUrl } from "../../src/utils/validate-redirect-url";

describe("validateRedirectUrl", () => {
  it("should allow valid redirectUri", () => {
    const allowedUrls = ["https://*.example.com"];
    const redirectUri = "https://sub.example.com";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("should allow valid redirectUri with a path", () => {
    const allowedUrls = ["https://*.example.com/path"];
    const redirectUri = "https://sub.example.com/path";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("should disallow invalid redirectUri", () => {
    const allowedUrls = ["https://*.example.com"];
    const redirectUri = "https://notexample.com";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).toThrow(
      "Invalid redirectUri",
    );
  });

  it("should be case insensitive", () => {
    const allowedUrls = ["https://*.EXAMPLE.com"];
    const redirectUri = "https://sub.example.com";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("should handle URLs without wildcards", () => {
    const allowedUrls = ["https://sub.example.com"];
    const redirectUri = "https://sub.example.com";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("should handle exact matches of urls with ports", () => {
    const allowedUrls = ["http://localhost:3000"];
    const redirectUri = "http://localhost:3000";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("should throw error for URLs that don't exactly match", () => {
    const allowedUrls = ["https://sub.example.com"];
    const redirectUri = "https://sub2.example.com";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).toThrow(
      "Invalid redirectUri",
    );
  });

  it("should throw if the path isn't matching", () => {
    const allowedUrls = ["https://example.com"];
    const redirectUri = "https://example.com/path";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).toThrow(
      "Invalid redirectUri",
    );
  });

  it("should not accept wildcards in the path", () => {
    const allowedUrls = ["https://example.com/*"];
    const redirectUri = "https://example.com/path";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).toThrow(
      "Invalid redirectUri",
    );
  });

  it("should should handle trailing slashes on the allowed url", () => {
    const allowedUrls = ["http://example.com"];
    const redirectUri = "http://example.com/";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("should should ignore query strings", () => {
    const allowedUrls = ["http://example.com"];
    const redirectUri = "http://example.com?foo=bar";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });
});
