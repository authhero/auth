import { getToken } from "@sagi.io/workers-jwt";

const DAY_IN_SECONDS = 60 * 60 * 24;

export async function getJwt(
  privateKeyPEM: string,
  kid: string,
  payload: any
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return getToken({
    privateKeyPEM,
    payload: {
      ...payload,
      iat: now,
      exp: now + DAY_IN_SECONDS,
    },
    alg: "RS256",
    headerAdditions: {
      kid,
    },
  });
}

interface AcessTokenPayload {
  aud: string;
  azp?: string;
  kid: string;
  scope: string;
  sub: string;
  iss: string;
}

interface IDTokenPayload {
  aud: string;
  kid: string;
  sub: string;
  iss: string;
  nonce?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
}

export class TokenFactory {
  privateKeyPEM: string;

  keyId: string;

  constructor(privateKeyPEM: string, keyId: string) {
    this.privateKeyPEM = privateKeyPEM;
    this.keyId = keyId;
  }

  async createAccessToken({
    scopes,
    userId,
    iss,
  }: {
    scopes: string[];
    userId: string;
    iss: string;
  }): Promise<string | null> {
    const payload: AcessTokenPayload = {
      aud: "default",
      scope: scopes.join(" "),
      sub: userId,
      kid: this.keyId,
      iss,
    };

    return getJwt(this.privateKeyPEM, this.keyId, payload);
  }

  async createIDToken({
    userId,
    nonce,
    iss,
  }: {
    userId: string;
    nonce?: string;
    iss: string;
  }): Promise<string | null> {
    const payload: IDTokenPayload = {
      aud: "default",
      sub: userId,
      kid: this.keyId,
      nonce,
      iss,
    };

    return getJwt(this.privateKeyPEM, this.keyId, payload);
  }
}
