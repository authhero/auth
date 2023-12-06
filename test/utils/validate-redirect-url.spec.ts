import { validateRedirectUrl } from "../../src/utils/validate-redirect-url";

describe("validateRedirectUrl", () => {
  it("should match when valid redirectUri with wildcard", () => {
    const allowedUrls = ["https://*.example.com"];
    const redirectUri = "https://sub.example.com";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(true);
  });

  it("should match when valid redirectUri with a wildcard and a path", () => {
    const allowedUrls = ["https://*.example.com/path"];
    const redirectUri = "https://sub.example.com/path";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(true);
  });

  it("should not match when wildcard spans multiple subdomains", () => {
    const allowedUrls = ["https://*.example.com/path"];
    const redirectUri = "https://sub.sub.example.com/path";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(false);
  });

  // should this throw an exception to say not allowed?
  it("should not match with domain wildcards", () => {
    const allowedUrls = ["https://*.com"];
    const redirectUri = "https://anything.com";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(false);
  });

  // should this throw an exception to say not allowed?
  it("should not match wildcard for full URL", () => {
    const allowedUrls = ["https://*"];
    const redirectUri = "https://*";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(false);
  });

  it("should not allow bad URLs with just wildcards", () => {
    const allowedUrls = ["*"];
    const redirectUri = "*";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).toThrow();
  });

  it("should not match redirectUri with wildcard subdomain specified on redirect uri that odes not have this", () => {
    const allowedUrls = ["https://*.example.com"];
    const redirectUri = "https://notexample.com";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(false);
  });

  it("should be case insensitive", () => {
    const allowedUrls = ["https://*.EXAMPLE.com"];
    const redirectUri = "https://sub.example.com";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(true);
  });

  it("should handle URLs without wildcards", () => {
    const allowedUrls = ["https://sub.example.com"];
    const redirectUri = "https://sub.example.com";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(true);
  });

  it("should match exact on ports", () => {
    const allowedUrls = ["http://localhost:3000"];
    const redirectUri = "http://localhost:3000";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(true);
  });

  it("should fail when no exact match of urls with ports", () => {
    const allowedUrls = ["http://localhost:3000"];
    const redirectUri = "http://localhost:3001";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(false);
  });

  it("should no match when subdomain is different", () => {
    const allowedUrls = ["https://sub.example.com"];
    const redirectUri = "https://sub2.example.com";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(false);
  });

  it("should not match if contains path", () => {
    const allowedUrls = ["https://example.com"];
    const redirectUri = "https://example.com/path";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(false);
  });

  it("should not match if the path is different", () => {
    const allowedUrls = ["https://example.com/foo"];
    const redirectUri = "https://example.com/bar";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(false);
  });

  it("should not match on wildcards in the path", () => {
    const allowedUrls = ["https://example.com/*"];
    const redirectUri = "https://example.com/path";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(false);
  });

  it("should match when trailing slashes in the allowed url", () => {
    const allowedUrls = ["http://example.com"];
    const redirectUri = "http://example.com/";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(true);
  });

  it("should ignore query strings", () => {
    const allowedUrls = ["http://example.com"];
    const redirectUri = "http://example.com?foo=bar";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(true);
  });

  it("should ignore hash fragments", () => {
    const allowedUrls = ["http://example.com"];
    const redirectUri = "http://example.com#hey=ho";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(true);
  });

  it("should match one of the URLs in the allowed list", () => {
    const allowedUrls = [
      "http://foo.com",
      "http://example.com",
      "http://bar.com",
    ];
    const redirectUri = "http://example.com";
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(true);
  });

  it("should return true if no redirect uri is provided", () => {
    const allowedUrls = ["http://foo.com"];
    const redirectUri = undefined;
    expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(true);
  });

  it("should throw an exception if redirectUri is no a real URL", () => {
    const allowedUrls = ["this is not a real url"];
    const redirectUri = "this is not a real url";
    expect(() => validateRedirectUrl(allowedUrls, redirectUri)).toThrow();
  });

  describe("should read values from ALLOWED_CALLBACK_URLS", () => {
    test("example.com", () => {
      const allowedUrls: string[] = [];
      const redirectUri = "http://example.com";
      expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(true);
    });
    test("http://localhost:3000#auth_token=foo-bar", () => {
      const allowedUrls: string[] = [];
      const redirectUri = "http://localhost:3000/sv";
      expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(true);
    });
    test("A Vercel preview domain in Swedish", () => {
      const allowedUrls: string[] = [];
      const redirectUri =
        "https://test-test.vercel.sesamy.dev/sv/callback?auth_token=foo-bar";
      expect(validateRedirectUrl(allowedUrls, redirectUri)).toBe(true);
    });
  });
});
