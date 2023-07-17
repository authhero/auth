import { getToken } from "@sagi.io/workers-jwt";

const DAY_IN_SECONDS = 60 * 60 * 24;

export interface GetTokenParams {
  privateKeyPEM: string;
  payload: {
    iat: number;
    exp: number;
  };
  alg: "RS256";
  headerAdditions: {
    kid: string;
  };
}

interface AccessTokenPayload {
  aud: string;
  azp?: string;
  kid: string;
  scope: string;
  sub: string;
  iss: string;
}

export interface IDTokenPayload {
  aud: string;
  sub: string;
  sid: string;
  iss: string;
  nonce?: string;
  email?: string;
  email_verified?: boolean;
  locale?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
}

export interface CreateAccessTokenParams {
  scope: string;
  sub: string;
  iss: string;
  azp?: string;
}

export interface CreateIDTokenParams {
  clientId: string;
  userId: string;
  // Issuer
  iss: string;
  // Session ID
  sid: string;
  nonce?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  locale?: string;
}

export class TokenFactory {
  privateKeyPEM: string;

  keyId: string;

  constructor(privateKeyPEM: string, keyId: string) {
    this.privateKeyPEM = privateKeyPEM;
    this.keyId = keyId;
  }

  async getJwt(payload: any): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    return getToken({
      privateKeyPEM: this.privateKeyPEM,
      payload: {
        ...payload,
        iat: now,
        exp: now + DAY_IN_SECONDS,
      },
      alg: "RS256",
      headerAdditions: {
        kid: this.keyId,
      },
    });
  }

  async createAccessToken({
    scope,
    sub,
    iss,
    azp,
  }: CreateAccessTokenParams): Promise<string> {
    const payload: AccessTokenPayload = {
      aud: "default",
      scope,
      sub,
      kid: this.keyId,
      iss,
      azp,
    };

    return this.getJwt(payload);
  }

  async createIDToken({
    clientId,
    userId,
    given_name,
    family_name,
    nickname,
    picture,
    locale,
    name,
    email,
    email_verified,
    nonce,
    iss,
    sid,
  }: CreateIDTokenParams): Promise<string> {
    const payload: IDTokenPayload = {
      // The audience for an id token is the client id
      aud: clientId,
      sub: userId,
      given_name,
      family_name,
      nickname,
      name,
      email,
      email_verified,
      nonce,
      iss,
      picture,
      locale,
      sid,
    };

    return this.getJwt(payload);
  }
}
