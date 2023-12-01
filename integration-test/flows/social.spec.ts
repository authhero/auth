import { setup } from "../helpers/setup";
import { start } from "../start";

describe("social sign on", () => {
  let worker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  it("should allow a new social signup", async () => {
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

    // Nice! SO NEXT we should call the callback endpoint with the correct params...

    // and see if we can trick it into creating a new user...

    // the issue will be on the /callback that the oauth2ClientFactory wants to do the token exchange...
    // hmmmmm, can we mock this? but then we're going to start punching holes in reality...
    // INSTEAD can we have something running locally that returns some kind of token? just needs to return an id_token right?

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

    console.log("location2", location2);

    expect(location2.host).toBe("login2.sesamy.dev");
  });
});
