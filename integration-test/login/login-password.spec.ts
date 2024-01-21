import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";

describe("Login with password user", () => {
  let worker: UnstableDevWorker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  it("should login with password", async () => {
    const searchParams = new URLSearchParams();

    searchParams.set("client_id", "clientId");
    searchParams.set("response_type", "token id_token");
    searchParams.set("scope", "openid");
    searchParams.set("redirect_uri", "http://localhost:3000/callback");
    searchParams.set("state", "state");
    const response = await worker.fetch(
      `/authorize?${searchParams.toString()}`,
      {
        headers: {
          "tenant-id": "tenantId",
        },
        redirect: "manual",
      },
    );

    expect(response.status).toBe(302);
    const location = response.headers.get("location");

    if (!location) {
      throw new Error("No location header found");
    }

    expect(location.startsWith("/u/login")).toBeTruthy;

    // Open login page
    const loginFormResponse = await worker.fetch(location, {});
    expect(loginFormResponse.status).toBe(200);
    const loginSearchParams = new URLSearchParams(location.split("?")[1]);

    const postLoginResponse = await worker.fetch(
      `/u/login?${loginSearchParams.toString()}`,
      {
        method: "POST",
        body: JSON.stringify({
          username: "foo@example.com",
          password: "Test!",
        }),
        headers: {
          "content-type": "application/json",
        },
        redirect: "manual",
      },
    );

    expect(postLoginResponse.status).toBe(302);
    const loginLocation = postLoginResponse.headers.get("location");

    if (!loginLocation) {
      throw new Error("No login location header found");
    }

    const redirectUrl = new URL(loginLocation);
    expect(redirectUrl.pathname).toBe("/callback");
    const accessToken = redirectUrl.searchParams.get("access_token");
    expect(accessToken).toBeTruthy();
    const idToken = redirectUrl.searchParams.get("id_token");
    expect(idToken).toBeTruthy();
  });
});
