import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  OAuth2Client,
  OAuthProviderParams,
} from "../../src/services/oauth2-client";

const oauth2ClientParams: OAuthProviderParams = {
  authorization_endpoint: "https://example.com/oauth2/authorize",
  token_endpoint: "https://example.com/oauth2/token",
  client_id: "your_client_id",
  client_secret: "your_client_secret",
  scope: "scope1 scope2",
};

const redirectUri = "https://your-redirect-uri.com/callback";

// Mock the fetch function to return a successful response with a JSON body
const mockFetch = (data: unknown, status = 200) => {
  return vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(data),
    }),
  );
};

describe("OAuth2Client", () => {
  let client: OAuth2Client;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    client = new OAuth2Client(oauth2ClientParams, redirectUri);
  });

  describe("getAuthorizationUrl", () => {
    it("generates a valid authorization URL", async () => {
      const state = "some_random_state_value";
      const url = await client.getAuthorizationUrl(state);

      expect(url).toContain("response_type=code");
      expect(url).toContain(`client_id=${oauth2ClientParams.client_id}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`);
      expect(url).toContain(`scope=scope1+scope2`);
      expect(url).toContain(`state=${encodeURIComponent(state)}`);
    });
  });

  describe("exchangeCodeForTokenResponse", () => {
    it("exchanges an authorization code for an access token", async () => {
      global.fetch = mockFetch({ access_token: "some_access_token" });

      const code = "some_authorization_code";
      const tokenResponse = await client.exchangeCodeForTokenResponse(code);

      expect(tokenResponse).toEqual({ access_token: "some_access_token" });
    });

    it("throws an error if the token request fails", async () => {
      // Setup global.fetch with the mock
      global.fetch = mockFetch("invalid_grant", 400);

      // (global as any).fetch = mockFetch("invalid_grant", 400);

      const code = "some_authorization_code";
      await expect(client.exchangeCodeForTokenResponse(code)).rejects.toThrow(
        "Error exchanging code for token: invalid_grant",
      );
    });
  });
});
