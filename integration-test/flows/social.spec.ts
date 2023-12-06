import { setup } from "../helpers/setup";
import { start } from "../start";
import { parseJwt } from "../../src/utils/parse-jwt";
import { getAdminToken } from "../helpers/token";
import type { UnstableDevWorker } from "wrangler";
import { UserResponse } from "../../src/types/auth0";

const SOCIAL_STATE_PARAM_AUTH_PARAMS = {
  redirect_uri: "https://login2.sesamy.dev/callback",
  scope: "openid profile email",
  state: "_7lvvz2iVJ7bQBqayN9ZsER5mt1VdGcx",
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

const EXPECTED_NEW_USER = {
  tenant_id: "tenantId",
  name: "john.doe@example.com",
  provider: "demo-social-provider",
  connection: "demo-social-provider",
  email: "john.doe@example.com",
  email_verified: true,
  last_ip: "",
  identities: [
    {
      connection: "demo-social-provider",
      provider: "demo-social-provider",
      user_id: "1234567890",
      isSocial: true,
    },
  ],
  login_count: 0,
  is_social: true,
  profileData: '{"name":"John Doe","picture":"https://example.com/john.jpg"}',
  user_id: "demo-social-provider|1234567890",
};

describe("social sign on", () => {
  let worker: UnstableDevWorker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  describe("Primary user", () => {
    it("should create correct args for social sign on from hitting /authorize with connection", async () => {
      await setup(worker);

      const socialSignOnQuery = new URLSearchParams({
        client_id: "clientId",
        response_type: "token id_token",
        redirect_uri: "https://login2.sesamy.dev/callback",
        scope: "openid profile email",
        connection: "demo-social-provider",
        state: "_7lvvz2iVJ7bQBqayN9ZsER5mt1VdGcx",
        nonce: "MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_",
        auth0Client: "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
      });

      const socialSignOnResponse = await worker.fetch(
        `/authorize?${socialSignOnQuery.toString()}`,
        {
          redirect: "manual",
        },
      );

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
        await setup(worker);

        const socialCallbackQuery = new URLSearchParams({
          state: SOCIAL_STATE_PARAM,
          code: "code",
        });

        const socialCallbackResponse = await worker.fetch(
          `/callback?${socialCallbackQuery.toString()}`,
          {
            redirect: "manual",
          },
        );

        expect(socialCallbackResponse.status).toBe(302);

        const location2 = new URL(
          socialCallbackResponse.headers.get("location")!,
        );

        expect(location2.host).toBe("login2.sesamy.dev");

        const socialCallbackQuery2 = location2.searchParams;
        expect(socialCallbackQuery2.get("access_token")).toBeDefined();
        expect(socialCallbackQuery2.get("id_token")).toBeDefined();
        expect(socialCallbackQuery2.get("expires_in")).toBe("86400");
        expect(socialCallbackQuery2.get("state")).toBe(
          "_7lvvz2iVJ7bQBqayN9ZsER5mt1VdGcx",
        );

        const idToken = socialCallbackQuery2.get("id_token");

        if (!idToken) {
          throw new Error("idToken not found");
        }

        const idTokenPayload = parseJwt(idToken);

        expect(idTokenPayload.aud).toBe("clientId");
        expect(idTokenPayload.sub).toBe("demo-social-provider|1234567890");
        expect(idTokenPayload.name).toBe("john.doe@example.com");
        expect(idTokenPayload.email).toBe("john.doe@example.com");
        expect(idTokenPayload.email_verified).toBe(true);
        // the same that we passed in
        expect(idTokenPayload.nonce).toBe("MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_");
        expect(idTokenPayload.iss).toBe("https://example.com/");

        const token = await getAdminToken();

        // now check that the user was created was properly in the data providers
        const newSocialUserRes = await worker.fetch(
          `/api/v2/users/demo-social-provider|1234567890`,
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
        await setup(worker);

        const token = await getAdminToken();

        // check this user isn't already created from the previous test
        const checkNoExistingUser = await worker.fetch(
          `/api/v2/users/demo-social-provider|1234567890`,
          {
            headers: {
              authorization: `Bearer ${token}`,
              "tenant-id": "tenantId",
            },
          },
        );

        // this checks that the integration test persistence is correctly reset every test
        expect(checkNoExistingUser.status).toBe(404);

        const socialCallbackResponse = await worker.fetch(`/callback`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            state: SOCIAL_STATE_PARAM,
            code: "code",
          }),
          redirect: "manual",
        });

        expect(socialCallbackResponse.status).toBe(302);

        const location2 = new URL(
          socialCallbackResponse.headers.get("location")!,
        );

        expect(location2.host).toBe("login2.sesamy.dev");

        const socialCallbackQuery2 = location2.searchParams;
        expect(socialCallbackQuery2.get("access_token")).toBeDefined();
        expect(socialCallbackQuery2.get("id_token")).toBeDefined();
        expect(socialCallbackQuery2.get("expires_in")).toBe("86400");
        expect(socialCallbackQuery2.get("state")).toBe(
          "_7lvvz2iVJ7bQBqayN9ZsER5mt1VdGcx",
        );

        const idToken = socialCallbackQuery2.get("id_token");

        const idTokenPayload = parseJwt(idToken!);

        expect(idTokenPayload.aud).toBe("clientId");
        expect(idTokenPayload.sub).toBe("demo-social-provider|1234567890");
        expect(idTokenPayload.name).toBe("john.doe@example.com");
        expect(idTokenPayload.email).toBe("john.doe@example.com");
        expect(idTokenPayload.email_verified).toBe(true);
        // the same that we passed in
        expect(idTokenPayload.nonce).toBe("MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_");
        expect(idTokenPayload.iss).toBe("https://example.com/");

        // now check that the user was created was properly in the data providers
        const newSocialUserRes = await worker.fetch(
          `/api/v2/users/${idTokenPayload.sub}`,
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
    // BUT FIRST
    // social sign on for existing email/password user
    // check that we return same info we get from email/password user... e.g.? just the id?
    // then how to return an id_token with the same?
    it("should return existing primary account when login with new social sign on with same email address", async () => {
      // ---------------------------------------------
      // create new user with same email as we have hardcoded on the mock id_token responses
      // ---------------------------------------------
      await setup(worker);

      const token = await getAdminToken();

      const createEmailUserResponse = await worker.fetch(`/api/v2/users`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "john.doe@example.com",
          connection: "email",
          // password: "Test!",
          // will this have email_verfied though? as this is a code account that has never been used...
          // this does nothing. doesn't complain either
          email_verified: true,
        }),
      });

      expect(createEmailUserResponse.status).toBe(201);

      const createEmailUser =
        (await createEmailUserResponse.json()) as UserResponse;

      expect(createEmailUser.email).toBe("john.doe@example.com");
      // TODO - do we need to be able to set this true from mgmt API? OR should I actually verify it...
      // maybe use code user?
      // expect(createEmailUser.email_verified).toBe(true);

      // ---------------------------------------------
      // now do social sign on with same email
      // ---------------------------------------------

      const socialCallbackQuery = new URLSearchParams({
        state: SOCIAL_STATE_PARAM,
        code: "code",
      });

      const socialCallbackResponse = await worker.fetch(
        `/callback?${socialCallbackQuery.toString()}`,
        {
          redirect: "manual",
        },
      );

      expect(socialCallbackResponse.status).toBe(302);

      const location2 = new URL(
        socialCallbackResponse.headers.get("location")!,
      );

      expect(location2.host).toBe("login2.sesamy.dev");

      const socialCallbackQuery2 = location2.searchParams;
      expect(socialCallbackQuery2.get("access_token")).toBeDefined();

      const accessTokenPayload = parseJwt(
        socialCallbackQuery2.get("access_token")!,
      );

      // This is the big change here
      expect(accessTokenPayload.sub).not.toBe(
        "demo-social-provider|1234567890",
      );
      expect(accessTokenPayload.sub).toBe(createEmailUser.user_id);

      const idTokenPayload = parseJwt(socialCallbackQuery2.get("id_token")!);
      expect(idTokenPayload.aud).toBe("clientId");

      // This is the big change here
      expect(idTokenPayload.sub).not.toBe("demo-social-provider|1234567890");
      expect(idTokenPayload.sub).toBe(createEmailUser.user_id);
      expect(idTokenPayload.name).toBe("john.doe@example.com");
      expect(idTokenPayload.email).toBe("john.doe@example.com");
      // TODO - we are pretending that the email is always verified
      // expect(idTokenPayload.email_verified).toBe(true);

      // ---------------------------------------------
      // now check that the user was created was properly in the data providers
      // ---------------------------------------------

      // ---------------------------------------------
      // finally do silent auth to check we're getting the primary user back
      // ---------------------------------------------

      // ---------------------------------------------
      // now sign in with same social user again and check we get the same primary user back
      // ---------------------------------------------
    });

    // social sign in again with existing account... maybe do above?

    // this test can handle multiple different providers
    it.skip("should create linked users when creating multiple social users with same email address", async () => {
      const token = await getAdminToken();
      await setup(worker);

      // create first social user on demo-social-provider
      const socialCallbackQuery = new URLSearchParams({
        state: SOCIAL_STATE_PARAM,
        code: "code",
      });

      const socialCallbackResponse = await worker.fetch(
        `/callback?${socialCallbackQuery.toString()}`,
        {
          redirect: "manual",
        },
      );

      expect(socialCallbackResponse.status).toBe(302);

      // now check that the user only has one identity
      const newSocialUserRes = await worker.fetch(
        `/api/v2/users/demo-social-provider|1234567890`,
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );

      const newSocialUser = (await newSocialUserRes.json()) as UserResponse;

      // this should only have its own identity
      expect(newSocialUser.identities).toEqual([
        {
          connection: "demo-social-provider",
          provider: "demo-social-provider",
          user_id: "1234567890",
          isSocial: true,
        },
      ]);

      // ---------------------------
      // Now create user with same email for other-social-provider
      // ---------------------------

      const socialCallbackQuery2 = new URLSearchParams({
        state: btoa(
          JSON.stringify({
            authParams: SOCIAL_STATE_PARAM_AUTH_PARAMS,
            connection: "other-social-provider",
          }),
        ).replace("==", ""),
        code: "code",
      });

      const socialCallbackResponse2 = await worker.fetch(
        `/callback?${socialCallbackQuery2.toString()}`,
        {
          redirect: "manual",
        },
      );

      // this means we know login successful
      expect(socialCallbackResponse2.status).toBe(302);

      // ----------
      // now check that the original user has two identities
      // ----------
      const newSocialUserResAgain = await worker.fetch(
        `/api/v2/users/demo-social-provider|1234567890`,
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );
      const newSocialUserAgain =
        (await newSocialUserResAgain.json()) as UserResponse;

      // this should have both identities
      expect(newSocialUserAgain.identities).toEqual([
        {
          connection: "demo-social-provider",
          provider: "demo-social-provider",
          user_id: "1234567890",
          isSocial: true,
        },
        {
          connection: "other-social-provider",
          provider: "other-social-provider",
          // this is correct as per the encoded id_token for this SSO provider
          user_id: "test-new-sub",
          isSocial: true,
        },
      ]);
    });
  });
});
