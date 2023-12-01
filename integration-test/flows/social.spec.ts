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

    console.log(await socialSignOnResponse.text());

    expect(socialSignOnResponse.status).toBe(302);

    // expect(socialSignOnResponse.headers.get("location")).toContain(
    //   "https://accounts.google.com/o/oauth2/v2/auth",
    // );

    console.log(socialSignOnResponse.headers.get("location"));

    // this is this
    // https://example.com/o/oauth2/v2/auth?scope=openid+profile+email&state=eyJhdXRoUGFyYW1zIjp7InJlZGlyZWN0X3VyaSI6Imh0dHBzOi8vbG9naW4yLnNlc2FteS5kZXYvY2FsbGJhY2siLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwic3RhdGUiOiJfN2x2dnoyaVZKN2JRQnFheU45WnNFUjVtdDFWZEdjeCIsImNsaWVudF9pZCI6ImNsaWVudElkIiwibm9uY2UiOiJNbmpjVGcwYXkzeHFmM0pWcUlMMDVpYi5ufn5lWmNMXyIsInJlc3BvbnNlX3R5cGUiOiJ0b2tlbiBpZF90b2tlbiJ9LCJjb25uZWN0aW9uIjoiZGVtby1zb2NpYWwtcHJvdmlkZXIifQ%3D%3D&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&client_id=socialClientId&response_type=code&response_mode=query

    const location = new URL(socialSignOnResponse.headers.get("location"));
    expect(location.host).toBe("example.com");
    expect(location.pathname).toBe("/o/oauth2/v2/auth");
    const socialSignOnQuery2 = location.searchParams;
    expect(socialSignOnQuery2.get("scope")).toBe("openid profile email");
    expect(socialSignOnQuery2.get("state")).toBe(
      // can we encode this to test it properly deterministically?
      "eyJhdXRoUGFyYW1zIjp7InJlZGlyZWN0X3VyaSI6Imh0dHBzOi8vbG9naW4yLnNlc2FteS5kZXYvY2FsbGJhY2siLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwic3RhdGUiOiJfN2x2dnoyaVZKN2JRQnFheU45WnNFUjVtdDFWZEdjeCIsImNsaWVudF9pZCI6ImNsaWVudElkIiwibm9uY2UiOiJNbmpjVGcwYXkzeHFmM0pWcUlMMDVpYi5ufn5lWmNMXyIsInJlc3BvbnNlX3R5cGUiOiJ0b2tlbiBpZF90b2tlbiJ9LCJjb25uZWN0aW9uIjoiZGVtby1zb2NpYWwtcHJvdmlkZXIifQ",
    );
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
  });
});
