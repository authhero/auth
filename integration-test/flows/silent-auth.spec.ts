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

  it("should return a 403 for an invalid silent auth request", async () => {
    await setup(worker);

    const response = await worker.fetch(
      "/authorize?client_id=clientId&response_type=token%20id_token&redirect_uri=https%3A%2F%2Flogin2.sesamy.dev%2Fsv%2Fcallback&scope=openid%20profile%20email&state=vaaQLli49FhEg894zjZXT1w.f~1gOEt0&nonce=Mh3lSnGeCS3mIjQuofbSjULzJn~GCfdN&response_mode=web_message&prompt=none&auth0Client=eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0%3D",
    );

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("Login required");
  });
});
