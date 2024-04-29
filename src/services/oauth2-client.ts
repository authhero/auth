import { HTTPException } from "hono/http-exception";
import { createToken } from "../utils/jwt";

export interface TokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  state?: string;
  scope?: string;
}
export interface OAuthProviderParams {
  client_id: string;
  client_secret?: string;
  kid?: string;
  team_id?: string;
  private_key?: string;
  authorization_endpoint: string;
  token_endpoint: string;
  scope: string;
  userinfo_endpoint?: string;
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
  exchangeCodeForTokenResponse(
    code: string,
    token_exchange_basic_auth?: boolean,
  ): Promise<TokenResponse>;
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
      client_id: this.params.client_id,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: this.params.scope,
      state,
    });

    return `${this.params.authorization_endpoint}?${params.toString()}`;
  }

  async generateAppleClientSecret() {
    if (!(this.params.private_key && this.params.kid && this.params.team_id)) {
      throw new Error("Private key, kid, and teamId required");
    }

    const now = Math.floor(Date.now() / 1000);

    const DAY_IN_SECONDS = 60 * 60 * 24;

    return createToken({
      pemKey: this.params.private_key,
      alg: "ES256",
      payload: {
        iss: this.params.team_id,
        aud: "https://appleid.apple.com",
        sub: this.params.client_id,
        iat: now,
        exp: now + DAY_IN_SECONDS,
      },
      headerAdditions: {
        kid: this.params.kid,
      },
    });
  }

  async exchangeCodeForTokenResponse(
    code: string,
    token_exchange_basic_auth = true,
  ): Promise<TokenResponse> {
    const clientSecret = this.params.private_key
      ? await this.generateAppleClientSecret()
      : this.params.client_secret;

    if (!clientSecret) {
      throw new Error("Client secret  or private key required");
    }

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.redirectUri,
    });

    const headers = new Headers({
      "Content-Type": "application/x-www-form-urlencoded",
    });

    if (token_exchange_basic_auth) {
      headers.set(
        "Authorization",
        `Basic ${btoa(`${this.params.client_id}:${clientSecret}`)}`,
      );
    } else {
      params.append("client_id", this.params.client_id);
      params.append("client_secret", clientSecret);
    }

    const response = await fetch(this.params.token_endpoint, {
      method: "POST",
      headers,
      body: params.toString(),
    });

    if (!response.ok) {
      throw new HTTPException(400, {
        message: `Error exchanging code for token: ${await response.text()}`,
      });
    }

    return response.json();
  }

  async getUserProfile(
    accessToken: string,
  ): Promise<{ [key: string]: string }> {
    if (!this.params.userinfo_endpoint) {
      throw new Error("No userinfo endpoint configured");
    }

    const response = await fetch(this.params.userinfo_endpoint, {
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
