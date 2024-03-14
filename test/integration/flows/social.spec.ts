import { parseJwt } from "../../../src/utils/parse-jwt";
import { getAdminToken } from "../helpers/token";
import { UserResponse } from "../../../src/types/auth0";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";
import { testClient } from "hono/testing";
import { tsoaApp } from "../../../src/app";
import { getEnv } from "../helpers/test-client";

const LOGIN2_STATE = "client_id=clientId&connection=auth2";

const SOCIAL_STATE_PARAM_AUTH_PARAMS = {
  redirect_uri: "https://login2.sesamy.dev/callback",
  scope: "openid profile email",
  state: LOGIN2_STATE,
  client_id: "clientId",
  nonce: "MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_",
  response_type: "token id_token",
};

// same on each test
const SOCIAL_STATE_PARAM = btoa(
  JSON.stringify({
    authParams: SOCIAL_STATE_PARAM_AUTH_PARAMS,
    connection: "demo-social-provider",
  }),
).replace("==", "");

const EXPECTED_PROFILE_DATA = {
  locale: "es-ES",
  name: "Örjan Lindström",
  given_name: "Örjan",
  family_name: "Lindström",
  picture:
    "https://lh3.googleusercontent.com/a/ACg8ocKL2otiYIMIrdJso1GU8GtpcY9laZFqo7pfeHAPkU5J=s96-c",
  email_verified: true,
};

const EXPECTED_NEW_USER = {
  tenant_id: "tenantId",
  name: "örjan.lindström@example.com",
  provider: "demo-social-provider",
  connection: "demo-social-provider",
  email: "örjan.lindström@example.com",
  email_verified: true,
  last_ip: "",
  identities: [
    {
      connection: "demo-social-provider",
      provider: "demo-social-provider",
      user_id: "123456789012345678901",
      isSocial: true,
    },
  ],
  login_count: 0,
  is_social: true,
  profileData: JSON.stringify(EXPECTED_PROFILE_DATA),
  user_id: "demo-social-provider|123456789012345678901",
};

describe("social sign on", () => {
  describe("Primary user", () => {
    /* TO TEST
      * silent auth! have since merged PRs testing silent auth
      * for POST and GET SSO calls to /callback
        assert that we
        - get the auth cookie back
        - can silent auth with it
      */

    it("should create correct args for social sign on from hitting /authorize with connection", async () => {
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      const socialSignOnQuery = {
        ...SOCIAL_STATE_PARAM_AUTH_PARAMS,
        connection: "demo-social-provider",
        auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      };

      const socialSignOnResponse = await client.authorize.$get({
        query: socialSignOnQuery,
      });

      expect(socialSignOnResponse.status).toBe(302);

      const location = new URL(socialSignOnResponse.headers.get("location")!);
      expect(location.host).toBe("example.com");
      expect(location.pathname).toBe("/o/oauth2/v2/auth");
      const socialSignOnQuery2 = location.searchParams;
      expect(socialSignOnQuery2.get("scope")).toBe("openid profile email");
      // previous args should create this state
      expect(socialSignOnQuery2.get("state")).toBe(SOCIAL_STATE_PARAM);
      expect(socialSignOnQuery2.get("redirect_uri")).toBe(
        "https://example.com/callback",
      );
      expect(socialSignOnQuery2.get("client_id")).toBe("socialClientId");
      expect(socialSignOnQuery2.get("response_type")).toBe("code");
      expect(socialSignOnQuery2.get("response_mode")).toBe("query");
    });

    describe("Create a new user from a social callback", () => {
      // like most of the providers
      it("should receive params in the querystring when a GET", async () => {
        const socialCallbackQuery = {
          state: SOCIAL_STATE_PARAM,
          code: "code",
        };
        const env = await getEnv();
        const client = testClient(tsoaApp, env);

        const socialCallbackResponse = await client.callback.$get({
          query: socialCallbackQuery,
        });
        expect(socialCallbackResponse.status).toBe(302);
        const location2 = new URL(
          socialCallbackResponse.headers.get("location")!,
        );
        expect(location2.host).toBe("login2.sesamy.dev");

        const socialCallbackQuery2 = new URLSearchParams(
          location2.hash.slice(1),
        );

        expect(socialCallbackQuery2.get("access_token")).toBeDefined();
        expect(socialCallbackQuery2.get("id_token")).toBeDefined();
        expect(socialCallbackQuery2.get("expires_in")).toBe("86400");
        expect(socialCallbackQuery2.get("state")).toBe(
          encodeURIComponent(LOGIN2_STATE),
        );
        const idToken = socialCallbackQuery2.get("id_token");
        const idTokenPayload = parseJwt(idToken!);
        expect(idTokenPayload.aud).toBe("clientId");
        expect(idTokenPayload.sub).toBe(
          "demo-social-provider|123456789012345678901",
        );
        expect(idTokenPayload.name).toBe("örjan.lindström@example.com");
        expect(idTokenPayload.email).toBe("örjan.lindström@example.com");
        expect(idTokenPayload.email_verified).toBe(true);

        // the same that we passed in
        expect(idTokenPayload.nonce).toBe("MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_");
        expect(idTokenPayload.iss).toBe("https://example.com/");
        const token = await getAdminToken();
        // ---------------------------------------------
        // now do a silent auth check to make sure we are logged in properly
        // ---------------------------------------------
        const setCookiesHeader =
          socialCallbackResponse.headers.get("set-cookie")!;
        const { idToken: silentAuthIdTokenPayload } =
          await doSilentAuthRequestAndReturnTokens(
            setCookiesHeader,
            client,
            "nonce",
            "clientId",
          );
        expect(silentAuthIdTokenPayload).toMatchObject({
          sub: "demo-social-provider|123456789012345678901",
          aud: "clientId",
          name: "örjan.lindström@example.com",
        });
        // ---------------------------------------------
        // now check that the user was created was properly in the data providers
        // ---------------------------------------------
        const newSocialUserRes = await client.api.v2.users[":user_id"].$get(
          {
            param: { user_id: "demo-social-provider|123456789012345678901" },
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
              "tenant-id": "tenantId",
            },
          },
        );
        const newSocialUser = (await newSocialUserRes.json()) as UserResponse;
        const {
          created_at,
          updated_at,
          last_login,
          ...newSocialUserWithoutDates
        } = newSocialUser;
        expect(newSocialUserWithoutDates).toEqual(EXPECTED_NEW_USER);
      });
      // like apple
      it("should receive params in the body when a POST", async () => {
        const token = await getAdminToken();

        const env = await getEnv();
        const client = testClient(tsoaApp, env);

        // check this user isn't already created from the previous test
        const checkNoExistingUser = await client.api.v2.users[":user_id"].$get(
          {
            param: { user_id: "demo-social-provider|1234567890" },
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
              "tenant-id": "tenantId",
            },
          },
        );
        // this checks that the integration test persistence is correctly reset every test
        expect(checkNoExistingUser.status).toBe(404);
        const socialCallbackResponse = await client.callback.$post(
          {
            json: {
              state: SOCIAL_STATE_PARAM,
              code: "code",
            },
          },
          {
            headers: {
              "content-type": "application/json",
            },
          },
        );
        expect(socialCallbackResponse.status).toBe(302);
        const location2 = new URL(
          socialCallbackResponse.headers.get("location")!,
        );
        expect(location2.host).toBe("login2.sesamy.dev");
        const socialCallbackQuery2 = new URLSearchParams(
          location2.hash.slice(1),
        );
        expect(socialCallbackQuery2.get("access_token")).toBeDefined();
        expect(socialCallbackQuery2.get("id_token")).toBeDefined();
        expect(socialCallbackQuery2.get("expires_in")).toBe("86400");
        expect(socialCallbackQuery2.get("state")).toBe(
          encodeURIComponent(LOGIN2_STATE),
        );
        const idToken = socialCallbackQuery2.get("id_token");
        const idTokenPayload = parseJwt(idToken!);
        expect(idTokenPayload.aud).toBe("clientId");
        expect(idTokenPayload.sub).toBe(
          "demo-social-provider|123456789012345678901",
        );
        expect(idTokenPayload.name).toBe("örjan.lindström@example.com");
        expect(idTokenPayload.email).toBe("örjan.lindström@example.com");
        expect(idTokenPayload.email_verified).toBe(true);
        // the same that we passed in
        expect(idTokenPayload.nonce).toBe("MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_");
        expect(idTokenPayload.iss).toBe("https://example.com/");
        // ---------------------------------------------
        // now do a silent auth check to make sure we are logged in properly
        // ---------------------------------------------
        const setCookiesHeader =
          socialCallbackResponse.headers.get("set-cookie")!;
        const { idToken: silentAuthIdTokenPayload } =
          await doSilentAuthRequestAndReturnTokens(
            setCookiesHeader,
            client,
            "nonce",
            "clientId",
          );
        expect(silentAuthIdTokenPayload).toMatchObject({
          sub: "demo-social-provider|123456789012345678901",
          aud: "clientId",
          name: "örjan.lindström@example.com",
        });
        // ---------------------------------------------
        // now check that the user was created was properly in the data providers
        // ---------------------------------------------
        const newSocialUserRes = await client.api.v2.users[":user_id"].$get(
          {
            param: { user_id: "demo-social-provider|123456789012345678901" },
          },
          {
            headers: {
              authorization: `Bearer ${token}`,
              "tenant-id": "tenantId",
            },
          },
        );
        const newSocialUser = (await newSocialUserRes.json()) as UserResponse;
        const {
          created_at,
          updated_at,
          last_login,
          ...newSocialUserWithoutDates
        } = newSocialUser;
        expect(newSocialUserWithoutDates).toEqual(EXPECTED_NEW_USER);
      });
    });
  });

  describe("Secondary user", () => {
    it("should return existing primary account when logging in with new social sign on with same email address", async () => {
      // ---------------------------------------------
      // create new user with same email as we have hardcoded on the mock id_token responses
      // ---------------------------------------------
      const token = await getAdminToken();
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      const createEmailUserResponse = await client.api.v2.users.$post(
        {
          json: {
            email: "örjan.lindström@example.com",
            connection: "email",
            // we are ignoring this for code logins
            email_verified: true,
          },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
            "content-type": "application/json",
          },
        },
      );

      const createEmailUser =
        (await createEmailUserResponse.json()) as UserResponse;
      expect(createEmailUser.email).toBe("örjan.lindström@example.com");
      expect(createEmailUser.identities).toEqual([
        {
          connection: "email",
          provider: "email",
          user_id: createEmailUser.user_id.split("|")[1],
          isSocial: false,
        },
      ]);
      expect(createEmailUser.email_verified).toBe(true);
      // ---------------------------------------------
      // now do social sign on with same email - new user registered
      // ---------------------------------------------
      const socialCallbackQuery = {
        state: SOCIAL_STATE_PARAM,
        code: "code",
      };

      const socialCallbackResponse = await client.callback.$get({
        query: socialCallbackQuery,
      });

      const socialCallbackResponseQuery = new URLSearchParams(
        socialCallbackResponse.headers.get("location")?.split("#")[1]!,
      );
      const accessTokenPayload = parseJwt(
        socialCallbackResponseQuery.get("access_token")!,
      );
      // This is the big change here
      expect(accessTokenPayload.sub).not.toBe(
        "demo-social-provider|1234567890",
      );
      expect(accessTokenPayload.sub).toBe(createEmailUser.user_id);
      const idTokenPayload = parseJwt(
        socialCallbackResponseQuery.get("id_token")!,
      );
      // This is the big change here
      expect(idTokenPayload.sub).not.toBe("demo-social-provider|1234567890");
      expect(idTokenPayload.sub).toBe(createEmailUser.user_id);
      expect(idTokenPayload.name).toBe("örjan.lindström@example.com");
      expect(idTokenPayload.email).toBe("örjan.lindström@example.com");
      // TODO - we are pretending that the email is always verified
      // expect(idTokenPayload.email_verified).toBe(true);
      // ---------------------------------------------
      // now check that the new social user was created was properly in the data providers
      // ---------------------------------------------
      const newSocialUserRes = await client.api.v2.users[":user_id"].$get(
        {
          param: { user_id: createEmailUser.user_id },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );
      const newSocialUser = (await newSocialUserRes.json()) as UserResponse;
      expect(newSocialUser.email).toBe("örjan.lindström@example.com");
      // ---------------------------------------------
      // check that the primary user has new identities
      // ---------------------------------------------
      const primaryUserRes = await client.api.v2.users[":user_id"].$get(
        {
          param: { user_id: createEmailUser.user_id },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );
      const primaryUser = (await primaryUserRes.json()) as UserResponse;
      expect(primaryUser.identities).toEqual([
        {
          connection: "email",
          provider: "email",
          user_id: createEmailUser.user_id.split("|")[1],
          isSocial: false,
        },
        {
          connection: "demo-social-provider",
          provider: "demo-social-provider",
          user_id: "123456789012345678901",
          isSocial: true,
          profileData: {
            name: "Örjan Lindström",
            given_name: "Örjan",
            family_name: "Lindström",
            picture:
              "https://lh3.googleusercontent.com/a/ACg8ocKL2otiYIMIrdJso1GU8GtpcY9laZFqo7pfeHAPkU5J=s96-c",
            email: "örjan.lindström@example.com",
            email_verified: true,
            locale: "es-ES",
          },
        },
      ]);
      // ---------------------------------------------
      // silent auth to check we're getting the primary user back
      // ---------------------------------------------
      const setCookiesHeader =
        socialCallbackResponse.headers.get("set-cookie")!;
      const { idToken: silentAuthIdTokenPayload } =
        await doSilentAuthRequestAndReturnTokens(
          setCookiesHeader,
          client,
          "nonce",
          "clientId",
        );
      expect(silentAuthIdTokenPayload).toMatchObject({
        // testing this means it must be working
        sub: createEmailUser.user_id,
        aud: "clientId",
        email: "örjan.lindström@example.com",
        email_verified: true,
        nonce: "nonce",
        iss: "https://example.com/",
      });
      // ---------------------------------------------
      // now sign in same social user again and check we get the same primary user back
      // ---------------------------------------------
      const socialCallbackResponse2 = await client.callback.$get({
        query: socialCallbackQuery,
      });

      const socialCallbackResponse2Query = new URLSearchParams(
        socialCallbackResponse2.headers.get("location")?.split("#")[1]!,
      );
      expect(
        parseJwt(socialCallbackResponse2Query.get("access_token")!).sub,
      ).toBe(createEmailUser.user_id);
      // ---------------------------------------------
      // now log-in with another SSO account with the same email address
      // ---------------------------------------------
      const socialCallbackQueryAnotherSSO = {
        state: btoa(
          JSON.stringify({
            authParams: SOCIAL_STATE_PARAM_AUTH_PARAMS,
            connection: "other-social-provider",
          }),
        ).replace("==", ""),
        code: "code",
      };
      const socialCallbackResponseAnotherSSO = await client.callback.$get({
        query: socialCallbackQueryAnotherSSO,
      });

      const socialCallbackResponseAnotherSSOQuery = new URLSearchParams(
        socialCallbackResponseAnotherSSO.headers
          .get("location")
          ?.split("#")[1]!,
      );
      // these confirm we are still signing in with the primary user
      expect(
        parseJwt(socialCallbackResponseAnotherSSOQuery.get("access_token")!)
          .sub,
      ).toBe(createEmailUser.user_id);
      expect(
        parseJwt(socialCallbackResponseAnotherSSOQuery.get("id_token")!).sub,
      ).toBe(createEmailUser.user_id);
      // ---------------------------------------------
      // now check that the primary user has new identities
      // ---------------------------------------------
      const primaryUserResAgain = await client.api.v2.users[":user_id"].$get(
        {
          param: { user_id: createEmailUser.user_id },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );
      const primaryUserAgain =
        (await primaryUserResAgain.json()) as UserResponse;
      expect(primaryUserAgain.identities).toEqual([
        {
          connection: "email",
          provider: "email",
          user_id: createEmailUser.user_id.split("|")[1],
          isSocial: false,
        },
        {
          connection: "demo-social-provider",
          provider: "demo-social-provider",
          user_id: "123456789012345678901",
          isSocial: true,
          profileData: {
            name: "Örjan Lindström",
            given_name: "Örjan",
            family_name: "Lindström",
            picture:
              "https://lh3.googleusercontent.com/a/ACg8ocKL2otiYIMIrdJso1GU8GtpcY9laZFqo7pfeHAPkU5J=s96-c",
            email: "örjan.lindström@example.com",
            email_verified: true,
            locale: "es-ES",
          },
        },
        {
          connection: "other-social-provider",
          provider: "other-social-provider",
          user_id: "10451045104510451",
          isSocial: true,
          profileData: {
            name: "Örjan Lindström",
            given_name: "Örjan",
            family_name: "Lindström",
            picture:
              "https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=1010",
            email: "örjan.lindström@example.com",
            email_verified: true,
          },
        },
      ]);
    });
    it("should return existing primary account when logging in with new social sign on with same email address AND there is already another linked social account", async () => {
      const token = await getAdminToken();
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      // What I want here is for the linked social account to be returned FIRST!
      // so this is a bit synthetic by manually writing the users...
      await env.data.users.create("tenantId", {
        name: "örjan.lindström@example.com",
        provider: "other-social-provider",
        connection: "other-social-provider",
        email: "örjan.lindström@example.com",
        email_verified: true,
        last_ip: "",
        login_count: 0,
        is_social: true,
        profileData: JSON.stringify(EXPECTED_PROFILE_DATA),
        id: "other-social-provider|123456789012345678901",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await env.data.users.create("tenantId", {
        name: "örjan.lindström@example.com",
        provider: "email",
        connection: "email",
        email: "örjan.lindström@example.com",
        email_verified: true,
        last_ip: "",
        login_count: 0,
        is_social: true,
        id: "email|7575757575757",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // ---------------------------------------------
      // fetch this email user to sanity check test
      // ---------------------------------------------
      const emailUserRes = await client.api.v2.users[":user_id"].$get(
        {
          param: { user_id: "email|7575757575757" },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );

      const emailUser = (await emailUserRes.json()) as UserResponse;
      expect(emailUser.user_id).toBe("email|7575757575757");

      // ---------------------------------------------
      // now link first social account to this email account
      // ---------------------------------------------
      await env.data.users.update(
        "tenantId",
        "other-social-provider|123456789012345678901",
        {
          linked_to: "email|7575757575757",
        },
      );

      // ---------------------------------------------
      // load this linked user to sanity check rest of test
      // ---------------------------------------------
      const linkedUser = await env.data.users.get(
        "tenantId",
        "other-social-provider|123456789012345678901",
      );

      expect(linkedUser!.linked_to).toBe("email|7575757575757");

      // ---------------------------------------------
      // sanity check that users are entered in database in correct order
      // ---------------------------------------------
      const users = await env.data.users.list("tenantId", {
        page: 0,
        per_page: 10,
        include_totals: false,
      });
      expect(users.length).toBe(3);
      expect(users.users[2].id).toBe("email|7575757575757");

      // ---------------------------------------------
      // now do social sign on with same email - new user registered
      // ---------------------------------------------
      const socialCallbackQuery = {
        state: SOCIAL_STATE_PARAM,
        code: "code",
      };

      const socialCallbackResponse = await client.callback.$get({
        query: socialCallbackQuery,
      });

      const socialCallbackResponseQuery = new URLSearchParams(
        socialCallbackResponse.headers.get("location")?.split("#")[1]!,
      );

      const accessTokenPayload = parseJwt(
        socialCallbackResponseQuery.get("access_token")!,
      );

      expect(accessTokenPayload.sub).toBe("email|7575757575757");
    });

    it("should ignore un-verified account when linking to an existing email account", async () => {
      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      // -----------------
      // signup new user
      // -----------------

      const typesDoNotWorkWithThisSetup___PARAMS = {
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          // matches social sign up we will do next
          email: "örjan.lindström@example.com",
          password: "password",
        },
      };
      const createUserResponse = await client.dbconnections.signup.$post(
        typesDoNotWorkWithThisSetup___PARAMS,
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );
      expect(createUserResponse.status).toBe(200);

      //-----------------
      // sign up new social user that has same email address
      //-----------------

      const socialCallbackQuery = {
        state: SOCIAL_STATE_PARAM,
        code: "code",
      };

      const socialCallbackResponse = await client.callback.$get({
        query: socialCallbackQuery,
      });
      expect(socialCallbackResponse.status).toBe(302);
      const location2 = new URL(
        socialCallbackResponse.headers.get("location")!,
      );
      const socialCallbackQuery2 = new URLSearchParams(location2.hash.slice(1));

      const idToken = socialCallbackQuery2.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.sub).toBe(
        // this shows no account linking is being done to the unvalidated email account...
        "demo-social-provider|123456789012345678901",
      );
      expect(idTokenPayload.email_verified).toBe(true);
    });
  });

  describe("Security", () => {
    describe("auth2 should not create a new user if callback from non-existing social provider", () => {
      it("should not when GET /callback", async () => {
        const env = await getEnv();
        const client = testClient(tsoaApp, env);

        const socialCallbackQuery = {
          // this is the only difference from the other tests
          state: btoa(
            JSON.stringify({
              authParams: {
                redirect_uri: "https://login2.sesamy.dev/callback",
                scope: "openid profile email",
                state: "_7lvvz2iVJ7bQBqayN9ZsER5mt1VdGcx",
                client_id: "clientId",
                nonce: "MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_",
                response_type: "token id_token",
              },
              connection: "non-existing-social-provider",
            }),
          ).replace("==", ""),
          code: "code",
        };
        const socialCallbackResponse = await client.callback.$get({
          query: socialCallbackQuery,
        });
        expect(socialCallbackResponse.status).toBe(403);
        expect(await socialCallbackResponse.text()).toBe(
          "Connection not found",
        );
      });
      it("should not when POST /callback", async () => {
        const env = await getEnv();
        const client = testClient(tsoaApp, env);

        const socialCallbackResponse = await client.callback.$post(
          {
            json: {
              state: btoa(
                JSON.stringify({
                  authParams: {
                    redirect_uri: "https://login2.sesamy.dev/callback",
                    scope: "openid profile email",
                    state: "_7lvvz2iVJ7bQBqayN9ZsER5mt1VdGcx",
                    client_id: "clientId",
                    nonce: "MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_",
                    response_type: "token id_token",
                  },
                  connection: "evil-social-provider",
                }),
              ).replace("==", ""),
              code: "code",
            },
          },
          {
            headers: {
              "content-type": "application/json",
            },
          },
        );

        expect(socialCallbackResponse.status).toBe(403);
        expect(await socialCallbackResponse.text()).toBe(
          "Connection not found",
        );
      });
    });
    // TO TEST
    // - bad params passed to us? e.g. bad redirect-uri, bad client_id?
    // - should not create a new social user IF WE DID NOT FIRST CALL THEM? e.g. check the nonce?

    test("error callback from SSO", async () => {
      // e.g. Facebook hit "not now" button

      const env = await getEnv();
      const client = testClient(tsoaApp, env);

      const errorCallbackResponse = await client.callback.$get({
        query: {
          error: "access_denied",
          error_code: "200",
          error_description: "Permissions error",
          error_reason: "user_denied",
          state: SOCIAL_STATE_PARAM,
        },
      });

      expect(errorCallbackResponse.status).toBe(302);

      const location = new URL(errorCallbackResponse.headers.get("location")!);

      expect(location.host).toBe("login2.sesamy.dev");
      expect(location.pathname).toBe("/callback");
      expect(location.searchParams.get("error")).toBe("access_denied");
      expect(location.searchParams.get("error_description")).toBe(
        "Permissions error",
      );
      expect(location.searchParams.get("error_code")).toBe("200");
      expect(location.searchParams.get("error_reason")).toBe("user_denied");
      expect(location.searchParams.get("state")).toBe(LOGIN2_STATE);
    });
  });
});
