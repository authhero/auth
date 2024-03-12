import { RequestWithContext } from "../../../src/types/RequestWithContext";
import { contextFixture } from "../../fixtures";
import {
  AuthenticateController,
  CodeAuthenticateParams,
  PasswordAuthenticateParams,
} from "../../../src/routes/tsoa/authenticate";
import { SqlLog, PasswordParams, User } from "../../../src/types";

describe("Authenticated", () => {
  describe("password", () => {
    it("should login using a correct password", async () => {
      const controller = new AuthenticateController();

      const body: PasswordAuthenticateParams = {
        client_id: "clientId",
        username: "test@example.com",
        password: "Test!",
        realm: "Username-Password-Authentication",
        credential_type: "http://auth0.com/oauth/grant-type/password-realm",
      };

      const logs: SqlLog[] = [];

      const user: User = {
        id: "userId",
        email: "test@example.com",
        last_ip: "1.1.1.1",
        login_count: 0,
        last_login: new Date().toISOString(),
        is_social: false,
        provider: "auth2",
        connection: "Username-Password-Authentication",
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const password: PasswordParams = {
        user_id: "userId",
        password: "Test!",
      };

      const ctx = await contextFixture({
        stateData: {},
        users: [user],
        passwords: [password],
        logs,
      });

      const actual = await controller.authenticate(body, {
        ctx,
      } as RequestWithContext);

      // Should return something like this
      // {"login_ticket":"uvfFxiqrv_DxNck4t3W8CtBxzMazNGUu","co_verifier":"fuwh_mhhncJyd3oCPcUs7psX5XIhBgZd","co_id":"oe5nra2nOLZy"}

      if (typeof actual === "string") {
        throw new Error("Actual should not be string");
      }

      if (!("login_ticket" in actual)) {
        throw new Error("Ticket missing in response");
      }
    });

    it("should throw an error if the password is incorrect", async () => {
      const controller = new AuthenticateController();

      const body: PasswordAuthenticateParams = {
        client_id: "clientId",
        username: "test@example.com",
        password: "Test!",
        realm: "Username-Password-Authentication",
        credential_type: "http://auth0.com/oauth/grant-type/password-realm",
      };

      const logs: SqlLog[] = [];

      const ctx = await contextFixture({
        stateData: {},
        userData: {
          validatePassword: "UnauthenticatedError",
        },
        logs,
      });

      await expect(
        controller.authenticate(body, {
          ctx,
        } as RequestWithContext),
      ).rejects.toThrow();
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

        const logs: SqlLog[] = [];

        const ctx = await contextFixture({
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

        if (typeof actual === "string") {
          throw new Error("Actual should not be string");
        }

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

        const logs: SqlLog[] = [];

        const ctx = await contextFixture({
          logs,
        });

        await expect(
          controller.authenticate(body, {
            ctx,
          } as RequestWithContext),
        ).rejects.toThrow();
      });
    });
  });
});
