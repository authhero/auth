import { tsoaApp } from "../../../src/app";
import { getAdminToken } from "../../../integration-test/helpers/token";
import { getEnv } from "../helpers/test-client";
import { testClient } from "hono/testing";

describe("Register password user", () => {
  let token;

  beforeEach(async () => {
    token = await getAdminToken();
  });

  it("should register a new user with password", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const searchParams = {
      client_id: "clientId",
      response_type: "token id_token",
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
    };

    const response = await client.authorize.$get(
      {
        query: searchParams,
      },
      {
        headers: {
          "tenant-id": "test",
        },
      },
    );

    expect(response.status).toBe(302);
    const location: string = response.headers.get("location")!;
    expect(location.startsWith("/u/login")).toBeTruthy;

    // // Open login page
    // const loginFormResponse = await worker.fetch(location, {});
    // expect(loginFormResponse.status).toBe(200);
    // const loginSearchParams = new URLSearchParams(location.split("?")[1]);

    // // Open signup page
    // const getSignupResponse = await worker.fetch(
    //   // I think we should follow the link here from the login page... get the href from that URL and visit it!
    //   `/u/signup?${loginSearchParams.toString()}`,
    // );
    // expect(getSignupResponse.status).toBe(200);

    // // Signup
    // const postSignupResponse = await worker.fetch(
    //   `/u/signup?${loginSearchParams.toString()}`,
    //   {
    //     method: "POST",
    //     body: JSON.stringify({
    //       username: "test@example.com",
    //       password: "password",
    //     }),
    //     headers: {
    //       "content-type": "application/json",
    //     },
    //     redirect: "manual",
    //   },
    // );

    // expect(postSignupResponse.status).toBe(302);
    // const signupLocation: string = postSignupResponse.headers.get("location")!;
    // const redirectUrl = new URL(signupLocation);
    // expect(redirectUrl.pathname).toBe("/callback");
    // const accessToken = redirectUrl.searchParams.get("access_token");
    // expect(accessToken).toBeTruthy();
    // const idToken = redirectUrl.searchParams.get("id_token");
    // expect(idToken).toBeTruthy();
  });
});
