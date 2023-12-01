import { setup } from "../helpers/setup";
import { start } from "../start";
import { parseJwt } from "../../src/utils/parse-jwt";

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
    console.log("idTokenPayload", idTokenPayload);

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

    // console.log("newUser", newUser);

    // NEXT
    // do tests for social account linking
  });
});
