import { setup } from "../helpers/setup";
import { getAdminToken } from "../helpers/token";
import { start } from "../start";

describe("login", () => {
  let worker;
  let token;

  beforeEach(async () => {
    worker = await start();

    token = await setup(worker);
  });

  afterEach(() => {
    worker.stop();
  });

  it("should register a new user with password", async () => {
    const token = await getAdminToken();

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
          "tenant-id": "test",
        },
        redirect: "manual",
      },
    );

    expect(response.status).toBe(302);
    const location: string = response.headers.get("location");
    expect(location.startsWith("/u/login")).toBeTruthy;

    // Open login page
    const loginFormResponse = await worker.fetch(location, {});
    expect(loginFormResponse.status).toBe(200);
    const loginSearchParams = new URLSearchParams(location.split("?")[1]);

    // Open signup page
    const getSignupResponse = await worker.fetch(
      `/u/signup?${loginSearchParams.toString()}`,
    );
    expect(getSignupResponse.status).toBe(200);

    // Signup
    const postSignupResponse = await worker.fetch(
      `/u/signup?${loginSearchParams.toString()}`,
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

    expect(postSignupResponse.status).toBe(302);
    const signupLocation: string = postSignupResponse.headers.get("location");
    const redirectUrl = new URL(signupLocation);
    expect(redirectUrl.pathname).toBe("/callback");
    const accessToken = redirectUrl.searchParams.get("access_token");
    expect(accessToken).toBeTruthy();
    const idToken = redirectUrl.searchParams.get("id_token");
    expect(idToken).toBeTruthy();
  });
});
