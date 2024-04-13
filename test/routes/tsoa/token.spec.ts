import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";
import { parseJwt } from "../../../src/utils/parse-jwt";
import { TokenRoutes } from "../../../src/routes/tsoa/token";
import { CreateAccessTokenParams } from "../../../src/services/token-factory";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
  CodeChallengeMethod,
  PKCEAuthorizationCodeGrantTypeParams,
  RequestWithContext,
  ClientCredentialGrantTypeParams,
  Tenant,
  Application,
} from "../../../src/types";
import { GrantType } from "../../../src/types";
import { contextFixture } from "../../fixtures/context";
import { ConnectionInsert } from "../../../src/types/Connection";

describe("token", () => {
  const date = new Date();

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(date);
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  const tenant: Tenant = {
    id: "tenantId",
    name: "tenantName",
    audience: "audience",
    sender_email: "senderEmail",
    sender_name: "senderName",
    support_url: "supportUrl",
    created_at: "created_at",
    updated_at: "updated_at",
  };

  const connection: ConnectionInsert = {
    id: "connectionId",
    name: "google-oauth2",
    client_id: "googleClientId",
    client_secret: "googleClientSecret",
    authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    token_endpoint: "https://oauth2.googleapis.com/token",
    response_mode: AuthorizationResponseMode.QUERY,
    response_type: AuthorizationResponseType.CODE,
    scope: "openid email profile",
  };

  const application: Application = {
    id: "publisherClientId",
    name: "clientName",
    tenant_id: "tenantId",
    allowed_callback_urls: "http://localhost:3000, https://example.com",
    allowed_logout_urls: "http://localhost:3000, https://example.com",
    allowed_web_origins: "http://localhost:3000, https://example.com",
    email_validation: "enabled",
    client_secret: "clientSecret",
    created_at: "created_at",
    updated_at: "updated_at",
  };

  describe("code grant with PKCE", () => {
    it("should return tokens as querystring for a valid code and response_type query using actual params", async () => {
      const stateParams = {
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
      };

      const ctx = await contextFixture({
        applications: [application],
        tenants: [tenant],
        connections: [connection],
      });

      const controller = new TokenRoutes();

      const tokenParams: PKCEAuthorizationCodeGrantTypeParams = {
        grant_type: GrantType.AuthorizationCode,
        code: btoa(JSON.stringify(stateParams)),
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

      const tokenData: CreateAccessTokenParams = parseJwt(body.access_token);

      expect(tokenData.iss).toBe("https://auth.example.com/");
      expect(tokenData.scope).toEqual("profile");
      expect(tokenData.sub).toBe("userId");

      expect(body.id_token).toBeDefined();

      // should this type be IDTokenPayload? CreateIDTokenParams? has params that are not either
      const idToken: any = parseJwt(body.id_token!);

      expect(idToken.aud).toBe("publisherClientId");
      expect(idToken.sub).toBe("userId");
      expect(idToken.email).toBe("email");
      expect(idToken.iss).toBe("https://auth.example.com/");
      expect(idToken.sid).toBe("sid");
      expect(idToken.iat).toBeGreaterThan(0);
      expect(idToken.exp).toBeGreaterThan(0);
    });

    it("should throw if the code_verfier does not match the hash of the challenge", async () => {
      const ctx = await contextFixture({
        applications: [application],
        tenants: [tenant],
        connections: [connection],
      });

      const controller = new TokenRoutes();

      const tokenParams: PKCEAuthorizationCodeGrantTypeParams = {
        grant_type: GrantType.AuthorizationCode,
        code: btoa(
          JSON.stringify({
            userId: "userId",
            authParams: {
              client_id: "publisherClientId",
              redirect_uri: "https://example.com",
              state: "state",
              scope: "profile",
              vendorId: "vendorId",
              code_challenge: "345kZVZlcmlma123",
              code_challenge_method: CodeChallengeMethod.S265,
            },
            user: {
              sub: "userId",
              email: "email",
            },
            sid: "sid",
          }),
        ),
        client_id: "publisherClientId",
        redirect_uri: "https://example.com",
        code_verifier: "codeVerifier",
      };

      await expect(
        controller.token({ ctx } as RequestWithContext, tokenParams),
      ).rejects.toThrowError("Invalid Code Challange");
    });

    it("should use the userId from the state to set the silent auth cookie", async () => {
      const ctx = await contextFixture({
        applications: [application],
        tenants: [tenant],
        connections: [connection],
      });

      const controller = new TokenRoutes();

      const tokenParams: PKCEAuthorizationCodeGrantTypeParams = {
        grant_type: GrantType.AuthorizationCode,
        code: btoa(
          JSON.stringify({
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
        ),
        client_id: "publisherClientId",
        redirect_uri: "https://commerce-dadr3pmvk.vercel.sesamy.dev/sv/",
        code_verifier: "CEjRJEa30AnfFut3TpAeHmxyIjTvYq.rQRURQHfiALe",
      };

      await controller.token({ ctx } as RequestWithContext, tokenParams);

      const cookie = controller.getHeader("set-cookie");

      expect(typeof cookie).toBe("string");
    });

    it("should throw an error if the vendorId in the state does not match the vendorId of the client", async () => {
      const ctx = await contextFixture({
        applications: [application],
        tenants: [tenant],
        connections: [connection],
      });

      const controller = new TokenRoutes();

      const tokenParams: PKCEAuthorizationCodeGrantTypeParams = {
        grant_type: GrantType.AuthorizationCode,
        code: btoa(
          JSON.stringify({
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
        ),
        client_id: "publisherClientId",
        redirect_uri: "https://example.com",
        code_verifier: "codeVerifier",
      };

      await expect(
        controller.token({ ctx } as RequestWithContext, tokenParams),
      ).rejects.toThrowError("Invalid Client");
    });
  });

  describe("client credentials", () => {
    it("should return a token for a sesamy api client", async () => {
      const ctx = await contextFixture();

      const controller = new TokenRoutes();

      const tokenParams: ClientCredentialGrantTypeParams = {
        grant_type: GrantType.ClientCredential,
        scope: "profile",
        client_secret: "clientSecret",
        client_id: "clientId",
      };

      const body = await controller.token(
        { ctx } as RequestWithContext,
        tokenParams,
      );

      if (!("access_token" in body)) {
        throw new Error("Should be Token");
      }

      const tokenData: CreateAccessTokenParams = parseJwt(body.access_token);

      expect(tokenData.iss).toBe("https://auth.example.com/");
      expect(tokenData.scope).toEqual("profile");
      expect(tokenData.azp).toBe(undefined);
      expect(tokenData.sub).toBe("clientId");
    });
  });
});
