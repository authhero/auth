interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export interface OauthProviderParams {
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  profileEndpoint?: string;
}

export class OAuth2Client {
  private readonly params: OauthProviderParams;
  private readonly scopes: string[];
  private readonly redirectUri: string;

  constructor(
    params: OauthProviderParams,
    rediectUri: string,
    scopes: string[] = []
  ) {
    this.params = params;
    this.redirectUri = rediectUri;
    this.scopes = scopes;
  }

  async getAuthorizationUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.params.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: this.scopes.join(" "),
      state,
    });

    return `${this.params.authorizationEndpoint}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: this.params.clientId,
      client_secret: this.params.clientSecret,
      redirect_uri: this.redirectUri,
    });

    const response = await fetch(this.params.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(
        `Error exchanging code for token: ${await response.text()}`
      );
    }

    return response.json();
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    if (!this.params.profileEndpoint) {
      throw new Error("No profile endpoint configured");
    }

    const response = await fetch(this.params.profileEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching user profile: ${await response.text()}`);
    }

    return response.json();
  }
}
