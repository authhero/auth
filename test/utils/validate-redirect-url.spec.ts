import { validateRedirectUrl } from "../../src/utils/validate-redirect-url";

describe("validateRedirectUrl", () => {
  it("should allow valid redirectUri with wildcard", () => {
    const allowedUrls = ["https://*.example.com"];
    const redirectUri = "https://sub.example.com";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("should allow valid redirectUri with a wildcard and a path", () => {
    const allowedUrls = ["https://*.example.com/path"];
    const redirectUri = "https://sub.example.com/path";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("should allow wildcard to span multiple subdomains?", () => {
    const allowedUrls = ["https://*.example.com/path"];
    const redirectUri = "https://sub.sub.example.com/path";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("should allow domain wildcard like this?", () => {
    const allowedUrls = ["https://*.com"];
    const redirectUri = "https://anything.com";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("should allow wildcard like this?", () => {
    const allowedUrls = ["https://*"];
    const redirectUri = "https://*";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("really should not allow this", () => {
    const allowedUrls = ["*"];
    const redirectUri = "*";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("should disallow redirectUri with wildcard subdomain specified but not existing", () => {
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

  it("should handle bad URLs without wildcards", () => {
    const allowedUrls = ["https://sub.example.com"];
    const redirectUri = "https://bad.example.com";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).toThrow();
  });

  it("should handle exact matches of urls with ports", () => {
    const allowedUrls = ["http://localhost:3000"];
    const redirectUri = "http://localhost:3000";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("should fail when no exact match of urls with ports", () => {
    const allowedUrls = ["http://localhost:3000"];
    const redirectUri = "http://localhost:3001";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).toThrow();
  });

  it("should throw error for URLs that don't exactly match", () => {
    const allowedUrls = ["https://sub.example.com"];
    const redirectUri = "https://sub2.example.com";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).toThrow(
      "Invalid redirectUri",
    );
  });

  it("should throw if the path isn't specified", () => {
    const allowedUrls = ["https://example.com"];
    const redirectUri = "https://example.com/path";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).toThrow(
      "Invalid redirectUri",
    );
  });

  it("should throw if the path does not match", () => {
    const allowedUrls = ["https://example.com/foo"];
    const redirectUri = "https://example.com/bar";
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

  it("should match one of the URLs in the list", () => {
    const allowedUrls = [
      "http://foo.com",
      "http://example.com",
      "http://bar.com",
    ];
    const redirectUri = "http://example.com";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  // these tests increase the code coverage
  it("should return nothing if no redirect uri is provided", () => {
    const allowedUrls = ["http://foo.com"];
    const redirectUri = undefined;
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).not.toThrow();
  });

  it("should throw an exception if the allowed uri is not valid", () => {
    // could also test multiple allowed urls
    // I still think there'll be some hack in this regex!
    const allowedUrls = ["this is not a real url"];
    const redirectUri = "http://foo.com";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).toThrow();
  });
});
