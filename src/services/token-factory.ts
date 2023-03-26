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

interface Payload {
  aud: string;
  azp?: string;
  kid: string;
  scope: string;
  sub: string;
  iss: string;
}

export class TokenFactory {
  privateKeyPEM: string;

  keyId: string;

  constructor(privateKeyPEM: string, keyId: string) {
    this.privateKeyPEM = privateKeyPEM;
    this.keyId = keyId;
  }

  async createToken({
    scopes,
    userId,
  }: {
    scopes: string[];
    userId: string;
  }): Promise<string | null> {
    const payload: Payload = {
      aud: "https://example.com",
      scope: scopes.join(" "),
      sub: userId,
      kid: this.keyId,
      iss: "client.issuer",
    };

    return getJwt(this.privateKeyPEM, this.keyId, payload);
  }
}
