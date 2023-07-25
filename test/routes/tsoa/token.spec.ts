import {
  InvalidClientError,
  InvalidCodeVerifierError,
} from "../../../src/errors";
import { TokenRoutes } from "../../../src/routes/tsoa/token";
import { CreateAccessTokenParams } from "../../../src/services/token-factory";
import {
  AuthorizationResponseType,
  CodeChallengeMethod,
  PKCEAuthorizationCodeGrantTypeParams,
  RequestWithContext,
} from "../../../src/types";
import { GrantType } from "../../../src/types";
import { base64ToHex } from "../../../src/utils/base64";
import { contextFixture } from "../../fixtures/context";
import { kvStorageFixture } from "../../fixtures/kv-storage";

describe("token", () => {
  const date = new Date();

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(date);
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  describe("code grant with PKCE", () => {
    it("should return tokens as querystring for a valid code and response_type query using actual params", async () => {
      const code = "m78fmbZ-WAiH9ZjzM_-9xTUBFTLtGOSmhikcK7mGmv8";
      const stateId = base64ToHex(code);

      const ctx = contextFixture({
        clients: kvStorageFixture({
          publisherClientId: JSON.stringify({
            id: "publisherClientId",
            callbackUrls: ["https://example.com"],
            scopes: ["profile", "email", "openid"],
            secrets: [
              {
                id: "secretId",
                hash: "clientSecret",
              },
            ],
          }),
        }),
        stateData: {
          [stateId]: JSON.stringify({
            userId: "userId",
            authParams: {
              client_id: "publisherClientId",
              redirect_uri: "https://example.com",
              state: "state",
              scope: "profile",
              vendorId: "vendorId",
              // This is an actual challenge passed'
              code_challenge: "y6r7l7bgQFjQpSI76Frc6US0GPNMJuuUm7iaotOZqxc",
              code_challenge_method: CodeChallengeMethod.S265,
              response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
            },
            user: {
              sub: "userId",
              email: "email",
            },
            sid: "sid",
          }),
        },
      });

      const controller = new TokenRoutes();

      const tokenParams: PKCEAuthorizationCodeGrantTypeParams = {
        grant_type: GrantType.AuthorizationCode,
        code: "m78fmbZ-WAiH9ZjzM_-9xTUBFTLtGOSmhikcK7mGmv8",
        client_id: "publisherClientId",
        redirect_uri: "https://example.com",
        // This is the actual verifier passed'
        code_verifier: "GDrh75rWN3SeR97kO7HG0WvvowJq54MqAP2JqS7HxK8",
      };

      const body = await controller.token(
        { ctx } as RequestWithContext,
        tokenParams,
      );

      if (!("access_token" in body)) {
        throw new Error("Should be Token");
      }

      // This is a debug token with just json
      const tokenData: CreateAccessTokenParams = JSON.parse(body.access_token);

      expect(tokenData.iss).toBe("https://auth.example.com/");
      expect(tokenData.scope).toEqual("profile");
      expect(tokenData.sub).toBe("userId");

      expect(body.id_token).toBeDefined();

      // should this type be IDTokenPayload? CreateIDTokenParams? has params that are not either
      const idToken: any = JSON.parse(body.id_token!);

      expect(idToken.aud).toBe("publisherClientId");
      expect(idToken.sub).toBe("userId");
      expect(idToken.email).toBe("email");
      expect(idToken.iss).toBe("https://auth.example.com/");
      expect(idToken.sid).toBe("sid");
      expect(idToken.iat).toBeGreaterThan(0);
      expect(idToken.exp).toBeGreaterThan(0);
    });

    it("should throw if the code_verfier does not match the hash of the challenge", async () => {
      const code = "m78fmbZ-WAiH9ZjzM_-9xTUBFTLtGOSmhikcK7mGmv8";
      const stateId = base64ToHex(code);

      const ctx = contextFixture({
        clients: kvStorageFixture({
          publisherClientId: JSON.stringify({
            id: "publisherClientId",
            vendorId: "vendorId",
            callbackUrls: ["https://example.com"],
            scopes: ["profile", "email", "openid"],
            secrets: [
              {
                id: "secretId",
                hash: "clientSecret",
              },
            ],
          }),
        }),
        stateData: {
          [stateId]: JSON.stringify({
            userId: "userId",
            authParams: {
              client_id: "publisherClientId",
              redirect_uri: "https://example.com",
              state: "state",
              scope: "profile",
              vendorId: "vendorId",
              // So this is NOT the base64 hash of 'codeVerifier' (which is the code verifier that we are sending up)
              code_challenge: "345kZVZlcmlma123",
              code_challenge_method: CodeChallengeMethod.S265,
            },
            user: {
              sub: "userId",
              email: "email",
            },
            sid: "sid",
          }),
        },
      });

      const controller = new TokenRoutes();

      const tokenParams: PKCEAuthorizationCodeGrantTypeParams = {
        grant_type: GrantType.AuthorizationCode,
        // This is a valid base64 encoded hex id for a durable object
        code: "m78fmbZ-WAiH9ZjzM_-9xTUBFTLtGOSmhikcK7mGmv8",
        client_id: "publisherClientId",
        redirect_uri: "https://example.com",
        code_verifier: "codeVerifier",
      };

      await expect(
        controller.token({ ctx } as RequestWithContext, tokenParams),
      ).rejects.toThrowError(InvalidCodeVerifierError);
    });

    it("should user the userId from the state to set the silent auth cookie", async () => {
      const code = "Rs61geRREBPhb2U0MlsEpIqvxv8ajjRGuwyp4wkkzCE";
      const stateId = base64ToHex(code);

      const ctx = contextFixture({
        clients: kvStorageFixture({
          publisherClientId: JSON.stringify({
            id: "publisherClientId",
            callbackUrls: ["https://example.com"],
            scopes: ["profile", "email", "openid"],
            secrets: [
              {
                id: "secretId",
                hash: "clientSecret",
              },
            ],
          }),
        }),
        stateData: {
          [stateId]: JSON.stringify({
            userId: "google-oauth2|108791004671072817794",
            authParams: {
              client_id: "publisherClientId",
              state:
                "T0JoZUZkLUVtYmQ0MWtWYXN2bE01TXRZVEszZDFhLUoyU0hYRDJlUmNUMQ==",
              redirect_uri: "https://commerce-dadr3pmvk.vercel.sesamy.dev/sv/",
              scope: "openid profile email",
              nonce:
                "RHpuTFp1bU5xTmNXR0FpZ1VCZWZVV2VLb3RtVjEzdlhhMVU1dkdnUzBnSQ==",
              response_type: "code",
              response_mode: "query",
              code_challenge_method: "S256",
              code_challenge: "guZR0oupmz2Nod7krmlgdk07T3sBFogH0UJObQVsGeE",
              vendorId: "sesamy",
            },
            user: {
              sub: "google-oauth2|108791004671072817794",
              email: "foo@bar.com",
            },
            nonce:
              "cVBlOXFzNVI1Ml9vYmE0dmZOZ2Q1b3doVktIUXpOdVBKRUZvUHR0V01NcA==",
            state:
              "OVpqMUQwbFhtaDFneWVHMlhyNU9DNEhJN1B4cGNHS1owY1V3RXNSQmVMWQ==",
            sid: "Gdo0zGQ6GbqrjihxReKe_pdfkSbbS6Y_CRyi_U4ukME",
          }),
        },
      });

      const controller = new TokenRoutes();

      const tokenParams: PKCEAuthorizationCodeGrantTypeParams = {
        grant_type: GrantType.AuthorizationCode,
        // This is a valid base64 encoded hex id for a durable object
        code,
        client_id: "publisherClientId",
        redirect_uri: "https://commerce-dadr3pmvk.vercel.sesamy.dev/sv/",
        code_verifier: "CEjRJEa30AnfFut3TpAeHmxyIjTvYq.rQRURQHfiALe",
      };

      await controller.token({ ctx } as RequestWithContext, tokenParams);

      const cookie = controller.getHeader("set-cookie");

      expect(typeof cookie).toBe("string");
    });

    it("should throw an error if the vendorId in the state does not match the vendorId of the client", async () => {
      const code = "m78fmbZ-WAiH9ZjzM_-9xTUBFTLtGOSmhikcK7mGmv8";
      const stateId = base64ToHex(code);

      const ctx = contextFixture({
        clients: kvStorageFixture({
          publisherClientId: JSON.stringify({
            vendorId: "vendorId1",
            callbackUrls: ["https://example.com"],
            scopes: ["profile", "email", "openid"],
            secrets: [
              {
                id: "secretId",
                hash: "clientSecret",
              },
            ],
          }),
        }),
        stateData: {
          [stateId]: JSON.stringify({
            userId: "userId",
            authParams: {
              client_id: "clientId2",
              redirect_uri: "https://example.com",
              state: "state",
              scope: "profile",
              vendorId: "vendorId2",
            },
            user: {
              sub: "userId",
              email: "email",
            },
            sid: "sid",
          }),
        },
      });

      const controller = new TokenRoutes();

      const tokenParams: PKCEAuthorizationCodeGrantTypeParams = {
        grant_type: GrantType.AuthorizationCode,
        // This is a valid base64 encoded hex id for a durable object
        code: "m78fmbZ-WAiH9ZjzM_-9xTUBFTLtGOSmhikcK7mGmv8",
        client_id: "publisherClientId",
        redirect_uri: "https://example.com",
        code_verifier: "codeVerifier",
      };

      await expect(
        controller.token({ ctx } as RequestWithContext, tokenParams),
      ).rejects.toThrowError(InvalidClientError);
    });
  });
});
