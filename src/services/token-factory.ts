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

export interface GetToken {
  (getTokenParams: GetTokenParams): string;
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
  sid: string;
  iss: string;
  nonce?: string;
  email?: string;
  email_verified?: boolean;
  locale: string;
  updated_at: string;
  picture: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
}

export interface CreateIDTokenParams {
  clientId: string;
  userId: string;
  iss: string;
  nonce?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
}

export function createTokenFactory(getToken: GetToken) {
  return class TokenFactory {
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

      return this.getJwt(payload);
    }

    async createIDToken({
      clientId,
      userId,
      given_name,
      family_name,
      nickname,
      name,
      nonce,
      iss,
      email,
    }: CreateIDTokenParams): Promise<string | null> {
      const payload: IDTokenPayload = {
        // The audience for an id token is the client id
        aud: clientId,
        sub: userId,
        kid: this.keyId,
        given_name,
        family_name,
        nickname,
        name,
        nonce,
        iss,
        picture:
          "https://lh3.googleusercontent.com/a/AGNmyxahgsZ1mBDfjYbydgtNDWgS78AvYk68SSoF1it-=s96-c",
        locale: "en",
        sid: "BVhF_cwjxxUN5dKFU9b9dc9N9-VyPuLf",
        updated_at: "2023-04-11T20:33:16.226Z",
        email,
      };

      return this.getJwt(payload);
    }
  };
}
