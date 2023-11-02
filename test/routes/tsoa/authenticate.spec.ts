import { RequestWithContext } from "../../../src/types/RequestWithContext";
import { contextFixture } from "../../fixtures";
import {
  AuthenticateController,
  CodeAuthenticateParams,
  PasswordAuthenticateParams,
} from "../../../src/routes/tsoa/authenticate";

describe("Authenticated", () => {
  describe.skip("password", () => {
    it("should login using a correct password", async () => {
      const controller = new AuthenticateController();

      const body: PasswordAuthenticateParams = {
        client_id: "clientId",
        username: "test@example.com",
        password: "Test!",
        realm: "Username-Password-Authentication",
        credential_type: "http://auth0.com/oauth/grant-type/password-realm",
      };

      const logs = [];

      const ctx = contextFixture({
        stateData: {},
        logs,
      });

      const actual = await controller.authenticate(body, {
        ctx,
      } as RequestWithContext);

      // Should return something like this
      // {"login_ticket":"uvfFxiqrv_DxNck4t3W8CtBxzMazNGUu","co_verifier":"fuwh_mhhncJyd3oCPcUs7psX5XIhBgZd","co_id":"oe5nra2nOLZy"}

      if ("error" in actual) {
        throw new Error("should not return error");
      }

      expect(typeof actual.login_ticket).toBe("string");
    });

    it("should send an error if the password is incorrect", async () => {
      const controller = new AuthenticateController();

      const body: PasswordAuthenticateParams = {
        client_id: "clientId",
        username: "test@example.com",
        password: "Test!",
        realm: "Username-Password-Authentication",
        credential_type: "http://auth0.com/oauth/grant-type/password-realm",
      };

      const logs = [];

      const ctx = contextFixture({
        stateData: {},
        userData: {
          validatePassword: "UnauthenticatedError",
        },
        logs,
      });

      const actual = await controller.authenticate(body, {
        ctx,
      } as RequestWithContext);

      if (!("error" in actual)) {
        throw new Error("should return error");
      }

      expect(controller.getStatus()).toBe(403);
      expect(JSON.stringify(actual)).toBe(
        JSON.stringify({
          error: "access_denied",
          error_description: "Wrong email or password.",
        }),
      );
    });
  });

  describe("code", () => {
    it("should login using a correct code", async () => {
      const controller = new AuthenticateController();

      const body: CodeAuthenticateParams = {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp: "111111",
        realm: "email",
        username: "test@example.com",
      };

      const logs = [];

      const ctx = contextFixture({
        otps: [
          {
            id: "id",
            code: "111111",
            email: "test@example.com",
            tenant_id: "tenantId",
            client_id: "clientId",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 1000 * 60),
            send: "link",
            authParams: {},
          },
        ],
        logs,
      });

      const actual = await controller.authenticate(body, {
        ctx,
      } as RequestWithContext);

      // Should return something like this
      // {"login_ticket":"uvfFxiqrv_DxNck4t3W8CtBxzMazNGUu","co_verifier":"fuwh_mhhncJyd3oCPcUs7psX5XIhBgZd","co_id":"oe5nra2nOLZy"}

      if ("error" in actual) {
        throw new Error("should not return error");
      }

      expect(typeof actual.login_ticket).toBe("string");
    });

    it("should send an error if the code is incorrect", async () => {
      const controller = new AuthenticateController();

      const body: CodeAuthenticateParams = {
        client_id: "clientId",
        credential_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
        otp: "000000",
        realm: "email",
        username: "test@example.com",
      };

      const logs = [];

      const ctx = contextFixture({
        logs,
      });

      await expect(
        controller.authenticate(body, {
          ctx,
        } as RequestWithContext),
      ).rejects.toThrow("Code not found or expired");
    });
  });
});
