import { setup } from "../helpers/setup";
import { start } from "../start";
import { parseJwt } from "../../src/utils/parse-jwt";
import { getAdminToken } from "../helpers/token";

// same on each test
const SOCIAL_STATE_PARAM = btoa(
  JSON.stringify({
    authParams: {
      redirect_uri: "https://login2.sesamy.dev/callback",
      scope: "openid profile email",
      state: "_7lvvz2iVJ7bQBqayN9ZsER5mt1VdGcx",
      client_id: "clientId",
      nonce: "MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_",
      response_type: "token id_token",
    },
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
  let worker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

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

    const location = new URL(socialSignOnResponse.headers.get("location"));
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

  describe("should create a new user from a new user social callback", () => {
    // like most of the providers
    it("GET to /callback", async () => {
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

      const location2 = new URL(socialCallbackResponse.headers.get("location"));

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

      const newSocialUser = await newSocialUserRes.json();

      const {
        created_at,
        updated_at,
        last_login,
        ...newSocialUserWithoutDates
      } = newSocialUser;

      expect(newSocialUserWithoutDates).toEqual(EXPECTED_NEW_USER);
    });

    // like apple
    it("POST to /callback", async () => {
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

      const location2 = new URL(socialCallbackResponse.headers.get("location"));

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

      const newSocialUser = await newSocialUserRes.json();

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
