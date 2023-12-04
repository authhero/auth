import { setup } from "../helpers/setup";
import { start } from "../start";
import { parseJwt } from "../../src/utils/parse-jwt";
import { getAdminToken } from "../helpers/token";

describe("social sign on", () => {
  let worker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  it("should create a new user from a new social signup", async () => {
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

    const socialStateParam = btoa(
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

    const location = new URL(socialSignOnResponse.headers.get("location"));
    expect(location.host).toBe("example.com");
    expect(location.pathname).toBe("/o/oauth2/v2/auth");
    const socialSignOnQuery2 = location.searchParams;
    expect(socialSignOnQuery2.get("scope")).toBe("openid profile email");
    expect(socialSignOnQuery2.get("state")).toBe(socialStateParam);
    expect(socialSignOnQuery2.get("redirect_uri")).toBe(
      "https://example.com/callback",
    );
    expect(socialSignOnQuery2.get("client_id")).toBe("socialClientId");
    expect(socialSignOnQuery2.get("response_type")).toBe("code");
    expect(socialSignOnQuery2.get("response_mode")).toBe("query");

    const socialCallbackQuery = new URLSearchParams({
      state: socialStateParam,
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
    // TODO - use id_token that has this set
    expect(idTokenPayload.email_verified).toBe(false);
    // the same that we passed in
    expect(idTokenPayload.nonce).toBe("MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_");
    expect(idTokenPayload.iss).toBe("https://example.com/");

    const token = await getAdminToken();

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

    expect(newSocialUser.email).toBe("john.doe@example.com");
    expect(newSocialUser.tenant_id).toBe("tenantId");
    expect(newSocialUser.name).toBe("john.doe@example.com");
    expect(newSocialUser.provider).toBe("demo-social-provider");
    expect(newSocialUser.connection).toBe("demo-social-provider");
    expect(newSocialUser.email_verified).toBe(true);
    expect(newSocialUser.last_ip).toBe("");
    expect(newSocialUser.login_count).toBe(0);
    expect(newSocialUser.is_social).toBe(true);
    expect(newSocialUser.last_login).toBeDefined();
    expect(newSocialUser.created_at).toBeDefined();
    expect(newSocialUser.updated_at).toBeDefined();
    // wait, we don't want to return this? do we?
    expect(newSocialUser.profileData).toBe(
      '{"name":"John Doe","picture":"https://example.com/john.jpg"}',
    );
    expect(newSocialUser.identities).toEqual([
      {
        connection: "demo-social-provider",
        provider: "demo-social-provider",
        user_id: "1234567890",
        isSocial: true,
      },
    ]);
    expect(newSocialUser.user_id).toBe("demo-social-provider|1234567890");

    // NEXT TESTS
    // - account linking
    // - logging in SSO with existing user
    // - POST to /callback endpoint e.g. Apple SSO
    // - malicious call to /callback! Are we verifying anything here?
  });
});
