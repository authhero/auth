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
  exchangeCodeForTokenResponse(code: string): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve({
        access_token: "accessToken",
        // copy-pasted from chat GPT into jwt.io - should create programmatically here?
        id_token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJzdWIiOiIxMjM0NTY3ODkwIiwiYXVkIjoiY2xpZW50MTIzIiwiZXhwIjoxNjE2NDcwOTQ4LCJpYXQiOjE2MTY0NjczNDgsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJwaWN0dXJlIjoiaHR0cHM6Ly9leGFtcGxlLmNvbS9qb2huLmpwZyIsIm5vbmNlIjoiYWJjMTIzIn0.yw00sUxyb4FnkJHu05Q_uPgP9c63izvrNjvYissY-kY",
        token_type: "tokenType",
        expires_in: 1000,
        refresh_token: "refreshToken",
      });
    });
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
