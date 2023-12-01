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

    /*
      this is the id_token payload that is hardcoded on OAuth2ClientMock - should encode this like this manually
      "iss": "https://auth.example.com",         
      "sub": "1234567890",                       
      "aud": "client123",                        
      "exp": 1616470948,                         
      "iat": 1616467348,                         
      "name": "John Doe",                        
      "email": "john.doe@example.com",           
      "picture": "https://example.com/john.jpg", 
      "nonce": "abc123"   
    */

    /*
      this is the id_token payload we're getting back from auth2 here

      aud: 'clientId',
      sub: 'demo-social-provider|1234567890',
      name: 'john.doe@example.com',
      email: 'john.doe@example.com',
      email_verified: false,
      nonce: 'MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_',
      iss: 'https://example.com/',
      sid: 'qSkfbtK9waitfKLEdo7fo',
      iat: 1701439942,
      exp: 1701526342
    */

    expect(idTokenPayload.aud).toBe("clientId");
    expect(idTokenPayload.sub).toBe("demo-social-provider|1234567890");
    expect(idTokenPayload.name).toBe("john.doe@example.com");
    expect(idTokenPayload.email).toBe("john.doe@example.com");
    // oh wow, shouldn't this be true? we must need to include this in our mock id_token!
    expect(idTokenPayload.email_verified).toBe(false);
    // is this the same that we passed in?
    expect(idTokenPayload.nonce).toBe("MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_");
    expect(idTokenPayload.iss).toBe("https://example.com/");
    // don't think other fields are as important...

    // To test
    // - fetch the user from env.data.users and check it exists!

    const token = await getAdminToken();

    const newSocialUserRes = await worker.fetch(
      // note we fetch with the user_id prefixed with provider as per the Auth0 standard
      `/api/v2/users/${idTokenPayload.sub}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "tenantId",
        },
      },
    );

    const newSocialUser = await newSocialUserRes.json();

    /*
        email: 'john.doe@example.com',
      tenant_id: 'tenantId',
      name: 'john.doe@example.com',
      provider: 'demo-social-provider',
      connection: 'demo-social-provider',
      email_verified: false,
      last_ip: '',
      login_count: 0,
      is_social: false,
      last_login: '2023-12-01T14:19:10.518Z',
      created_at: '2023-12-01T14:19:10.518Z',
      updated_at: '2023-12-01T14:19:10.518Z',
      profileData: '{"name":"John Doe","picture":"https://example.com/john.jpg"}',
      identities: [
        {
          connection: 'demo-social-provider',
          provider: 'demo-social-provider',
          user_id: '1234567890',
          isSocial: false
        }
      ],
      user_id: 'demo-social-provider|1234567890'
    */

    expect(newSocialUser.email).toBe("john.doe@example.com");
    expect(newSocialUser.tenant_id).toBe("tenantId");
    expect(newSocialUser.name).toBe("john.doe@example.com");
    expect(newSocialUser.provider).toBe("demo-social-provider");
    expect(newSocialUser.connection).toBe("demo-social-provider");
    // I think we want to be testing that this is true... I thought all SSO accounts had this
    expect(newSocialUser.email_verified).toBe(false);
    expect(newSocialUser.last_ip).toBe("");
    expect(newSocialUser.login_count).toBe(0);
    // ooooo, what? surely this is wrong!
    expect(newSocialUser.is_social).toBe(false);
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
        isSocial: false,
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
