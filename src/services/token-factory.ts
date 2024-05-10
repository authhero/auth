import { pemToBuffer } from "../utils/jwt";
import { createJWT } from "oslo/jwt";

const DAY_IN_SECONDS = 60 * 60 * 24;

interface AccessTokenPayload {
  aud: string;
  azp?: string;
  scope?: string;
  sub: string;
  iss: string;
  permissions?: string[];
}

interface IDTokenPayload {
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

interface CreateAccessTokenParams {
  sub: string;
  iss: string;
  scope?: string;
  aud?: string;
  azp?: string;
  permissions?: string[];
}

interface CreateIDTokenParams {
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

  async getJwt(payload: AccessTokenPayload): Promise<string> {
    const keyBuffer = pemToBuffer(this.privateKeyPEM);

    return createJWT("RS256", keyBuffer, payload, {
      headers: {
        kid: this.keyId,
        expiresIn: DAY_IN_SECONDS,
      },
    });
  }

  async createAccessToken({
    scope,
    sub,
    iss,
    aud = "default",
    azp,
    permissions,
  }: CreateAccessTokenParams): Promise<string> {
    const payload: AccessTokenPayload = {
      aud,
      scope,
      sub,
      iss,
      azp,
      permissions,
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
      iss,
      sid,
      given_name,
      family_name,
      nickname,
      picture,
      locale,
      name,
      email,
      nonce,
      email_verified,
    };

    return this.getJwt(payload);
  }
}
