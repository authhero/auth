import { parseJwt } from "../../../src/utils/parse-jwt";
import type { Email } from "../../../src/types/Email";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";
import { getEnv } from "../helpers/test-client";
import { getAdminToken } from "../../../integration-test/helpers/token";
import { testClient } from "hono/testing";
import { tsoaApp } from "../../../src/app";

describe("code-flow", () => {
  describe("should log in using the sent magic link, when", () => {
    it("is a new sign up", async () => {
      const token = await getAdminToken();
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      const AUTH_PARAMS = {
        nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
        redirect_uri: "https://login.example.com/sv/callback",
        response_type: "token id_token",
        scope: "openid profile email",
        state: "state",
      };

      // -----------------
      // Doing a new signup here, so expect this email not to exist
      // -----------------
      const resInitialQuery = await client.api.v2["users-by-email"].$get(
        {
          query: {
            email: "new-user@example.com",
          },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );
      expect(resInitialQuery.status).toBe(404);

      const response = await client.passwordless.start.$post(
        {
          // ouch! this was param body... no typesafety...
          json: {
            authParams: AUTH_PARAMS,
            client_id: "clientId",
            connection: "email",
            email: "new-user@example.com",
            send: "link",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(await response.text());
      }

      const [{ to, magicLink }] = await env.data.email.list!();

      //       const emailResponse = await worker.fetch("/test/email");
      //       const [sentEmail] = (await emailResponse.json()) as Email[];
      expect(to).toBe("new-user@example.com");

      const link = magicLink!;

      const authenticatePath = link?.split("https://example.com")[1];

      // Authenticate using the magic link
      //       const authenticateResponse = await worker.fetch(authenticatePath, {
      //         redirect: "manual",
      //       });

      //       if (authenticateResponse.status !== 302) {
      //         const errorMessage = `Failed to verify redirect with status: ${
      //           authenticateResponse.status
      //         } and message: ${await response.text()}`;
      //         throw new Error(errorMessage);
      //       }

      //       const redirectUri = new URL(
      //         authenticateResponse.headers.get("location")!,
      //       );
      //       expect(redirectUri.hostname).toBe("login.example.com");

      //       const accessToken = redirectUri.searchParams.get("access_token");

      //       const accessTokenPayload = parseJwt(accessToken!);
      //       expect(accessTokenPayload.aud).toBe("default");
      //       expect(accessTokenPayload.iss).toBe("https://example.com/");
      //       expect(accessTokenPayload.scope).toBe("openid profile email");

      //       const idToken = redirectUri.searchParams.get("id_token");
      //       const idTokenPayload = parseJwt(idToken!);
      //       expect(idTokenPayload.email).toBe("new-user@example.com");
      //       expect(idTokenPayload.aud).toBe("clientId");

      //       const authCookieHeader = authenticateResponse.headers.get("set-cookie")!;

      //       // now check silent auth works when logged in with magic link----------------------------------------
      //       const {
      //         accessToken: silentAuthAccessTokenPayload,
      //         idToken: silentAuthIdTokenPayload,
      //       } = await doSilentAuthRequestAndReturnTokens(
      //         authCookieHeader,
      //         worker,
      //         AUTH_PARAMS.nonce,
      //         "clientId",
      //       );

      //       const {
      //         // these are the fields that change on every test run
      //         exp,
      //         iat,
      //         sid,
      //         sub,
      //         ...restOfIdTokenPayload
      //       } = silentAuthIdTokenPayload;

      //       expect(sub).toContain("email|");
      //       expect(sid).toHaveLength(21);
      //       expect(restOfIdTokenPayload).toEqual({
      //         aud: "clientId",
      //         name: "new-user@example.com",
      //         email: "new-user@example.com",
      //         email_verified: true,
      //         nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
      //         iss: "https://example.com/",
      //       });
    });
    //     it("is an existing user", async () => {
    //       const token = await getAdminToken();

    //       const AUTH_PARAMS = {
    //         nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
    //         redirect_uri: "https://login.example.com/sv/callback",
    //         response_type: "token id_token",
    //         scope: "openid profile email",
    //         state: "state",
    //       };

    //       // -----------------
    //       // User should already exist in default fixture
    //       // -----------------
    //       const resInitialQuery = await worker.fetch(
    //         "/api/v2/users-by-email?email=foo@example.com",
    //         {
    //           headers: {
    //             authorization: `Bearer ${token}`,
    //             "tenant-id": "tenantId",
    //           },
    //         },
    //       );
    //       expect(resInitialQuery.status).toBe(200);

    //       // -----------------
    //       // Now get magic link emailed
    //       // -----------------
    //       await worker.fetch("/passwordless/start", {
    //         headers: {
    //           "content-type": "application/json",
    //         },
    //         method: "POST",
    //         body: JSON.stringify({
    //           authParams: AUTH_PARAMS,
    //           client_id: "clientId",
    //           connection: "email",
    //           email: "foo@example.com",
    //           send: "link",
    //         }),
    //       });

    //       const emailResponse = await worker.fetch("/test/email");
    //       const [sentEmail] = (await emailResponse.json()) as Email[];
    //       expect(sentEmail.to).toBe("foo@example.com");

    //       const link = sentEmail.magicLink;

    //       const authenticatePath = link?.split("https://example.com")[1];

    //       // -----------------
    //       // Authenticate using the magic link for the existing user
    //       // -----------------
    //       const authenticateResponse = await worker.fetch(authenticatePath, {
    //         redirect: "manual",
    //       });

    //       const redirectUri = new URL(
    //         authenticateResponse.headers.get("location")!,
    //       );
    //       expect(redirectUri.hostname).toBe("login.example.com");

    //       const accessToken = redirectUri.searchParams.get("access_token");

    //       const accessTokenPayload = parseJwt(accessToken!);
    //       expect(accessTokenPayload.aud).toBe("default");
    //       expect(accessTokenPayload.iss).toBe("https://example.com/");
    //       expect(accessTokenPayload.scope).toBe("openid profile email");
    //       expect(accessTokenPayload.sub).toBe("userId");

    //       const idToken = redirectUri.searchParams.get("id_token");
    //       const idTokenPayload = parseJwt(idToken!);
    //       expect(idTokenPayload.email).toBe("foo@example.com");
    //       expect(idTokenPayload.aud).toBe("clientId");
    //       expect(idTokenPayload.sub).toBe("userId");

    //       const authCookieHeader = authenticateResponse.headers.get("set-cookie")!;

    //       // ----------------------------------------
    //       // now check silent auth works when logged in with magic link for existing user
    //       // ----------------------------------------
    //       const { idToken: silentAuthIdTokenPayload } =
    //         await doSilentAuthRequestAndReturnTokens(
    //           authCookieHeader,
    //           worker,
    //           AUTH_PARAMS.nonce,
    //           "clientId",
    //         );

    //       const { exp, iat, sid, ...restOfIdTokenPayload } =
    //         silentAuthIdTokenPayload;

    //       expect(sid).toHaveLength(21);
    //       expect(restOfIdTokenPayload).toEqual({
    //         sub: "userId",
    //         aud: "clientId",
    //         name: "Åkesson Þorsteinsson",
    //         nickname: "Åkesson Þorsteinsson",
    //         picture: "https://example.com/foo.png",
    //         email: "foo@example.com",
    //         email_verified: true,
    //         nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
    //         iss: "https://example.com/",
    //       });
    //     });
    //   });

    //   it("should log in with the same magic link multiple times", async () => {
    //     const AUTH_PARAMS = {
    //       nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
    //       redirect_uri: "https://login.example.com/sv/callback",
    //       response_type: "token id_token",
    //       scope: "openid profile email",
    //       state: "state",
    //     };

    //     // -----------
    //     // get code to log in
    //     // -----------
    //     await worker.fetch("/passwordless/start", {
    //       headers: {
    //         "content-type": "application/json",
    //       },
    //       method: "POST",
    //       body: JSON.stringify({
    //         authParams: AUTH_PARAMS,
    //         client_id: "clientId",
    //         connection: "email",
    //         email: "test@example.com",
    //         send: "link",
    //       }),
    //     });

    //     const emailResponse = await worker.fetch("/test/email");
    //     const [sentEmail] = (await emailResponse.json()) as Email[];
    //     const link = sentEmail.magicLink;
    //     const authenticatePath = link?.split("https://example.com")[1];

    //     // ------------
    //     // Authenticate using the magic link the first time
    //     // ----------------
    //     const authenticateResponse = await worker.fetch(authenticatePath, {
    //       redirect: "manual",
    //     });
    //     expect(authenticateResponse.status).toBe(302);

    //     // ------------
    //     // Authenticate using the magic link the second time
    //     // ----------------
    //     const authenticateResponse2 = await worker.fetch(authenticatePath, {
    //       redirect: "manual",
    //     });
    //     expect(authenticateResponse2.status).toBe(302);
    //   });

    //   it("should not accept any invalid params on the magic link", async () => {
    //     const AUTH_PARAMS = {
    //       nonce: "ehiIoMV7yJCNbSEpRq513IQgSX7XvvBM",
    //       redirect_uri: "https://login.example.com/sv/callback",
    //       response_type: "token id_token",
    //       scope: "openid profile email",
    //       state: "state",
    //     };

    //     // -----------
    //     // get code to log in
    //     // -----------
    //     await worker.fetch("/passwordless/start", {
    //       headers: {
    //         "content-type": "application/json",
    //       },
    //       method: "POST",
    //       body: JSON.stringify({
    //         authParams: AUTH_PARAMS,
    //         client_id: "clientId",
    //         connection: "email",
    //         email: "test@example.com",
    //         send: "link",
    //       }),
    //     });

    //     const emailResponse = await worker.fetch("/test/email");
    //     const [sentEmail] = (await emailResponse.json()) as Email[];
    //     const link = sentEmail.magicLink;

    //     // ------------
    //     // Overwrite the magic link with a bad code, and try and use it
    //     // ----------------
    //     const magicLinkWithBadCode = new URL(link!);
    //     magicLinkWithBadCode.searchParams.set("verification_code", "123456");

    //     const authenticatePath = magicLinkWithBadCode.href.split(
    //       "https://example.com",
    //     )[1];

    //     const authenticateResponse = await worker.fetch(authenticatePath, {
    //       redirect: "manual",
    //     });

    //     // we are still getting a redirect but to a page on login2 saying the code is expired
    //     expect(authenticateResponse.status).toBe(302);

    //     const redirectUri = new URL(authenticateResponse.headers.get("location")!);

    //     expect(redirectUri.hostname).toBe("login2.sesamy.dev");
    //     expect(redirectUri.pathname).toBe("/sv/expired-code");
    //     expect(redirectUri.searchParams.get("email")).toBe(
    //       encodeURIComponent("test@example.com"),
    //     );

    //     // ------------
    //     // Overwrite the magic link with a bad email, and try and use it
    //     // ----------------
    //     const magicLinkWithBadEmail = new URL(link!);
    //     magicLinkWithBadEmail.searchParams.set("email", "another@email.com");

    //     const authenticatePath2 = magicLinkWithBadEmail.href.split(
    //       "https://example.com",
    //     )[1];

    //     const authenticateResponse2 = await worker.fetch(authenticatePath2, {
    //       redirect: "manual",
    //     });

    //     expect(authenticateResponse2.status).toBe(302);

    //     const redirectUri2 = new URL(
    //       authenticateResponse2.headers.get("location")!,
    //     );

    //     expect(redirectUri2.hostname).toBe("login2.sesamy.dev");
    //     expect(redirectUri2.pathname).toBe("/sv/expired-code");
    //     expect(redirectUri2.searchParams.get("email")).toBe(
    //       encodeURIComponent("another@email.com"),
    //     );
  });
  //   // TO TEST
  //   // like code-flow
  //   // it("should return existing primary account when logging in with new code sign on with same email address", async () => {
});
