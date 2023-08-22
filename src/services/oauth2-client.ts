import { createToken } from "../utils/jwt";

export interface TokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}
export interface OAuthProviderParams {
  clientId: string;
  clientSecret?: string;
  kid?: string;
  teamId?: string;
  privateKey?: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string;
  profileEndpoint?: string;
}

export interface IOAuth2ClientFactory {
  create(params: OAuthProviderParams, redirectUrl: string): IOAuth2Client;
}

export function oAuth2ClientFactory(
  params: OAuthProviderParams,
  redirectUri: string,
): IOAuth2Client {
  return new OAuth2Client(params, redirectUri);
}

export interface IOAuth2Client {
  getAuthorizationUrl(state: string): Promise<string>;
  exchangeCodeForTokenResponse(code: string): Promise<TokenResponse>;
  getUserProfile(accessToken: string): Promise<{ [key: string]: string }>;
}

export class OAuth2Client implements IOAuth2Client {
  private readonly params: OAuthProviderParams;
  private readonly redirectUri: string;

  constructor(params: OAuthProviderParams, redirectUri: string) {
    this.params = params;
    this.redirectUri = redirectUri;
  }

  async getAuthorizationUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.params.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: this.params.scope,
      state,
    });

    return `${this.params.authorizationEndpoint}?${params.toString()}`;
  }

  async generateAppleClientSecret() {
    if (!(this.params.privateKey && this.params.kid && this.params.teamId)) {
      throw new Error("Private key, kid, and teamId required");
    }

    const now = Math.floor(Date.now() / 1000);

    const DAY_IN_SECONDS = 60 * 60 * 24;

    return createToken({
      pemKey: this.params.privateKey,
      alg: "ES256",
      payload: {
        iss: this.params.teamId,
        aud: "https://appleid.apple.com",
        sub: this.params.clientId,
        iat: now,
        exp: now + DAY_IN_SECONDS,
      },
      headerAdditions: {
        kid: this.params.kid,
      },
    });
  }

  async exchangeCodeForTokenResponse(code: string): Promise<TokenResponse> {
    const clientSecret = this.params.privateKey
      ? await this.generateAppleClientSecret()
      : this.params.clientSecret;

    if (!clientSecret) {
      throw new Error("Client secret  or private key required");
    }

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: this.params.clientId,
      client_secret: clientSecret,
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
        `Error exchanging code for token: ${await response.text()}`,
      );
    }

    return response.json();
  }

  async getUserProfile(
    accessToken: string,
  ): Promise<{ [key: string]: string }> {
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
