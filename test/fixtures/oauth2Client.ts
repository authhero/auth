import {
  IOAuth2Client,
  OAuthProviderParams,
  TokenResponse,
} from "../../src/services/oauth2-client";

export function oAuth2ClientFactory(
  params: OAuthProviderParams,
  redirectUri: string,
): IOAuth2Client {
  return new OAuth2ClientFixture(params, redirectUri);
}

class OAuth2ClientFixture implements IOAuth2Client {
  //@ts-ignore
  private readonly params: OAuthProviderParams;
  //@ts-ignore
  private readonly redirectUri: string;

  constructor(params: OAuthProviderParams, redirectUri: string) {
    this.params = params;
    this.redirectUri = redirectUri;
  }

  //@ts-ignore
  async getAuthorizationUrl(state: string): Promise<string> {
    return "https://example.com";
  }

  //@ts-ignore
  async exchangeCodeForTokenResponse(code: string): Promise<TokenResponse> {
    return {
      access_token: "access_token",
      token_type: "token_type",
      expires_in: 3600,
      refresh_token: "refresh_token",
    };
  }

  async getUserProfile(
    //@ts-ignore
    accessToken: string,
  ): Promise<{ [key: string]: string }> {
    return {
      id: "id",
      email: "email",
      name: "name",
    };
  }
}
