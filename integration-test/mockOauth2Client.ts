import {
  IOAuth2ClientFactory,
  OAuthProviderParams,
  IOAuth2Client,
} from "../src/services/oauth2-client";
import { createToken } from "../src/utils/jwt";
import { getCertificate } from "./helpers/token";

function createTokenExample(payload: {
  [key: string]: string | string[] | number | boolean;
}) {
  return createToken({
    alg: "RS256",
    headerAdditions: {
      kid: "test",
    },
    payload,
    // Would be good to use different certificates for each social provider and then test we are verifying the signature
    pemKey: getCertificate().private_key,
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
        // copied from Facebook id_token
        iss: "https://www.facebook.com",
        sub: "10451045104510451",
        aud: "250848680337272",
        exp: 1616470948,
        iat: 1616467348,
        name: "John Doe",
        given_name: "John",
        family_name: "Doe",
        at_hash: "atHash",
        email: "john.doe@example.com",
        picture:
          "https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=1010",
        nonce: "abc123",
        email_verified: true,
        jti: "jti",
      });
      return {
        access_token: "otherClientAccessToken",
        id_token: otherClientIdToken,
        token_type: "tokenType",
        expires_in: 1000,
        refresh_token: "refreshToken",
      };
    }
    if (this.params.client_id === "socialClientId") {
      const clientIdToken = await createTokenExample({
        // TODO - copy from Google id_token
        iss: "https://accounts.google.com",
        sub: "123456789012345678901",
        azp: "195867377305-j00komjaq7etk3ua9oab69klhlli4uk7.apps.googleusercontent.com",
        aud: "195867377305-j00komjaq7etk3ua9oab69klhlli4uk7.apps.googleusercontent.com",
        hd: "sesamy.com",
        at_hash: "86RwWzFmP08wVtVDo1qk1A",
        locale: "es-ES",
        exp: 1616470948,
        iat: 1616467348,
        name: "John Doe",
        given_name: "John",
        family_name: "Doe",
        email: "john.doe@example.com",
        picture:
          "https://lh3.googleusercontent.com/a/ACg8ocKL2otiYIMIrdJso1GU8GtpcY9laZFqo7pfeHAPkU5J=s96-c",
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
    throw new Error("Unknown client_id");
    // TODO - mock Apple id_token
    /*
    {
      "iss": "https://appleid.apple.com",
      "aud": "dev.sesamy.auth2",
      "exp": 1702398561,
      "iat": 1702312161,
      "sub": "123456.1234abcd1234abcd1234abcd1234abcd.1234",
      "at_hash": "X4g-4Ig31fptNYMcMQARfQ",
      "email": "john.do@example.com",
      "email_verified": "true",
      "auth_time": 1702312158,
      "nonce_supported": true
    }
    */
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
