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
    );

    expect(response.status).toBe(200);
    const body = await response.text();

    console.log(body);

    expect(body).not.toContain("Login required");

    // assert access token in here
    // expect(body).toContain("Login required");
  });
});
