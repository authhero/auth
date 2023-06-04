import { CreateIDTokenParams } from "../../src/services/token-factory";

export class MockedTokenFactory {
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
    return "access_token";
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
  }: CreateIDTokenParams): Promise<string | null> {
    return "id_token";
  }
}
