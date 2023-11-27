import { setup } from "../helpers/setup";
import { start } from "../start";

describe("silent-auth", () => {
  let worker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  it("should return a 200 when not logged in, with a login_required error", async () => {
    await setup(worker);

    const response = await worker.fetch(
      "/authorize?client_id=clientId&response_type=token%20id_token&redirect_uri=https%3A%2F%2Flogin2.sesamy.dev%2Fsv%2Fcallback&scope=openid%20profile%20email&state=vaaQLli49FhEg894zjZXT1w.f~1gOEt0&nonce=Mh3lSnGeCS3mIjQuofbSjULzJn~GCfdN&response_mode=web_message&prompt=none&auth0Client=eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0%3D",
    );

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("Login required");
  });

  it("should return a 200 for a valid silent auth request", async () => {
    await setup(worker);

    // first need to log in, and persist the cookie we get back
    const loginSearchParams = new URLSearchParams();
    // I think this matches the seeded data..
    loginSearchParams.set("client_id", "app");
    loginSearchParams.set("response_type", "token id_token");
    loginSearchParams.set("scope", "openid");
    loginSearchParams.set("redirect_uri", "http://localhost:3000/callback");
    loginSearchParams.set("state", "state");

    // auth2.sesamy.dev/authorize?client_id=kvartal&response_type=token%20id_token&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=openid&state=state

    // this seems overly complex and somewhat of a nightmare
    // I could do this in playwright really quickly (like with login2)

    const postLoginResponse = await worker.fetch(
      `/u/login?${loginSearchParams.toString()}`,
      {
        method: "POST",
        body: JSON.stringify({
          username: "test@example.com",
          password: "password",
        }),
        headers: {
          "content-type": "application/json",
        },
        redirect: "manual",
      },
    );

    expect(postLoginResponse.status).toBe(302);
    const location: string = postLoginResponse.headers.get("location");

    console.log(location);

    const cookies = postLoginResponse.headers.get("set-cookie");
    console.log(cookies);

    // https://auth2.sesamy.dev/u/login?state=B61uJrzEOyWIgxU3xZ7zb
    // form data
    // username: julian+test@sesamy.com
    // password: TestPass-123
    // querystring param
    // state: B61uJrzEOyWIgxU3xZ7zb

    return;

    // need to store a session here... how to do actually do that? no public API to create a session...
    // have to actually just log in?

    // create this URL using an URL() object for clarity
    // "/authorize?client_id=clientId&response_type=token%20id_token&redirect_uri=https%3A%2F%2Flogin2.sesamy.dev%2Fsv%2Fcallback&scope=openid%20profile%20email&state=vaaQLli49FhEg894zjZXT1w.f~1gOEt0&nonce=Mh3lSnGeCS3mIjQuofbSjULzJn~GCfdN&response_mode=web_message&prompt=none&auth0Client=eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0%3D",
    const searchParams = new URLSearchParams();
    searchParams.set("client_id", "clientId");
    searchParams.set("response_type", "token id_token");
    searchParams.set("redirect_uri", "https://login2.sesamy.dev/sv/callback");
    searchParams.set("scope", "openid profile email");
    searchParams.set("state", "vaaQLli49FhEg894zjZXT1w.f~1gOEt0");
    searchParams.set("nonce", "Mh3lSnGeCS3mIjQuofbSjULzJn~GCfdN");
    searchParams.set("response_mode", "web_message");
    searchParams.set("prompt", "none");
    searchParams.set(
      "auth0Client",
      "eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0=",
    );
    const response = await worker.fetch(
      `/authorize?${searchParams.toString()}`,
      {
        cookies: "auth-token=foobar",
      },
    );

    expect(response.status).toBe(200);
    const body = await response.text();

    console.log(body);

    // uncomment this assertion
    // expect(body).not.toContain("Login required");

    // assert access token in here
  });
});
