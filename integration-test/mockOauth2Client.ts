import {
  IOAuth2ClientFactory,
  OAuthProviderParams,
  IOAuth2Client,
} from "../src/services/oauth2-client";
import { createToken } from "../src/utils/jwt";
import { getCertificate } from "./helpers/token";

function createTokenExample(payload: {
  [key: string]: string | string[] | number;
}) {
  return createToken({
    alg: "RS256",
    headerAdditions: {
      kid: "test",
    },
    payload,
    // Would be good to use different certificates for each social provider and then test we are verifying the signature
    pemKey: getCertificate().privateKey,
  });
}

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
      const otherClientIdToken = await createTokenExample({
        iss: "https://opther-auth.example.com",
        sub: "test-new-sub",
        aud: "client123",
        exp: 1616470948,
        iat: 1616467348,
        name: "John Doe",
        email: "john.doe@example.com",
        picture: "https://example.com/john.jpg",
        nonce: "abc123",
        // can't actually use boolean... what should happen here then?
        // email_verified: true,
        // is this a problem with the library?
      });
      return {
        access_token: "otherClientAccessToken",
        id_token: otherClientIdToken,
        token_type: "tokenType",
        expires_in: 1000,
        refresh_token: "refreshToken",
      };
    }
    const clientIdToken = await createTokenExample({
      iss: "https://auth.example.com",
      sub: "1234567890",
      aud: "client123",
      exp: 1616470948,
      iat: 1616467348,
      name: "John Doe",
      email: "john.doe@example.com",
      picture: "https://example.com/john.jpg",
      nonce: "abc123",
      email_verified: true,
    });
    return {
      access_token: "accessToken",
      id_token: clientIdToken,
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
