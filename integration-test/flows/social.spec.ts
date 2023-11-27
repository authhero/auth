import { setup } from "../helpers/setup";
import { start } from "../start";
import { parseJwt } from "../../src/utils/parse-jwt";

describe("code-flow", () => {
  let worker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  it("should allow a new social signup", async () => {
    await setup(worker);

    // https://auth.sesamy.dev/authorize?client_id=0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW&response_type=token%20id_token&redirect_uri=https%3A%2F%2Flogin2.sesamy.dev%2Fcallback&scope=openid%20profile%20email&connection=google-oauth2&state=_7lvvz2iVJ7bQBqayN9ZsER5mt1VdGcx&nonce=MnjcTg0ay3xqf3JVqIL05ib.n~~eZcL_&auth0Client=eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yMy4wIn0%3D

    const socialSignOnQuery = new URLSearchParams({
      client_id: "clientId",
      response_type: "token id_token",
      redirect_uri: "https://login2.sesamy.dev/callback",
      scope: "openid profile email",
      connection: "fake-social-connection",
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

    // expect(socialSignOnResponse.status).toBe(302);
    // expect(socialSignOnResponse.headers.get("location")).toContain(
    //   "https://accounts.google.com/o/oauth2/v2/auth",
    // );

    console.log(await socialSignOnResponse.text());
  });
});
