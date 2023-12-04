import {
  IOAuth2ClientFactory,
  OAuthProviderParams,
  IOAuth2Client,
} from "../src/services/oauth2-client";

class MockOAuth2Client implements IOAuth2Client {
  private readonly params: OAuthProviderParams;
  private readonly redirectUri: string;

  constructor(params: OAuthProviderParams, redirectUri: string) {
    this.params = params;
    this.redirectUri = redirectUri;
  }

  getAuthorizationUrl(state: string): Promise<string> {
    throw new Error("getAuthorizationUrl method not implemented.");
  }
  async exchangeCodeForTokenResponse(code: string) {
    if (this.params.client_id === "otherSocialClientId") {
      return {
        access_token: "otherClientAccessToken",
        // TODO - create a new id_token - same but with different sub
        id_token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL29wdGhlci1hdXRoLmV4YW1wbGUuY29tIiwic3ViIjoidGVzdC1uZXctc3ViIiwiYXVkIjoiY2xpZW50MTIzIiwiZXhwIjoxNjE2NDcwOTQ4LCJpYXQiOjE2MTY0NjczNDgsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obi5kb2UuZXhhbXBsZS5jb20iLCJwaWN0dXJlIjoiaHR0cHM6Ly9leGFtcGxlLmNvbS9qb2huLmpwZyIsIm5vbmNlIjoiYWJjMTIzIiwiZW1haWxfdmVyaWZpZWQiOnRydWV9.7GhGwUagcim1sIHyw-3ZrxOYyS2Nccq8vNc1nH-KR3M",

        token_type: "tokenType",
        expires_in: 1000,
        refresh_token: "refreshToken",
      };
    }
    return {
      access_token: "accessToken",
      id_token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiIxMjM0NTY3ODkwIiwiYXVkIjoiY2xpZW50MTIzIiwiZXhwIjoxNjE2NDcwOTQ4LCJpYXQiOjE2MTY0NjczNDgsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJwaWN0dXJlIjoiaHR0cHM6Ly9leGFtcGxlLmNvbS9qb2huLmpwZyIsIm5vbmNlIjoiYWJjMTIzIiwiZW1haWxfdmVyaWZpZWQiOnRydWV9.RvMi_pqbLRorEfLfkhMVZg8Ff0y2Cj0dyqIRnYkRBWU",
      token_type: "tokenType",
      expires_in: 1000,
      refresh_token: "refreshToken",
    };
  }
  getUserProfile(accessToken: string): Promise<any> {
    throw new Error("getUserProfile method not implemented.");
  }
}

export const mockOAuth2ClientFactory: IOAuth2ClientFactory = {
  create(params: OAuthProviderParams, redirectUrl: string): IOAuth2Client {
    return new MockOAuth2Client(params, redirectUrl);
  },
};
