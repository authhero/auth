import {
  IOAuth2Client,
  AuthProviderParams,
  TokenResponse,
  UserProfile,
} from "../../src/services/oauth2-client";

export function oAuth2ClientFactory(
  params: AuthProviderParams,
  redirectUri: string,
  scopes?: string[]
): IOAuth2Client {
  return new MockedOAuth2Client(params, redirectUri, scopes);
}

export class MockedOAuth2Client implements IOAuth2Client {
  private readonly params: AuthProviderParams;
  private readonly scopes: string[];
  private readonly redirectUri: string;

  constructor(
    params: AuthProviderParams,
    redirectUri: string,
    scopes: string[] = []
  ) {
    this.params = params;
    this.redirectUri = redirectUri;
    this.scopes = scopes;
  }

  async getAuthorizationUrl(state: string): Promise<string> {
    return "https://example.com";
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    return {
      access_token: "access_token",
      token_type: "token_type",
      expires_in: 3600,
      refresh_token: "refresh_token",
    };
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    return {
      id: "id",
      email: "email",
      name: "name",
    };
  }
}
