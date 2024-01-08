import { getEnv } from "../helpers/test-client";
import { tsoaApp } from "../../../src/app";
import { testClient } from "hono/testing";

describe("Login with code on liquidjs template", () => {
  it("should login with code", async () => {
    const env = await getEnv();
    const client = testClient(tsoaApp, env);

    const searchParams = {
      client_id: "clientId",
      response_type: "token id_token",
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
    };

    const response = await client.authorize.$get({
      query: searchParams,
    });

    expect(response.status).toBe(302);
    const location = response.headers.get("location");

    if (!location) {
      throw new Error("No location header found");
    }

    expect(location.startsWith("/u/login")).toBeTruthy;

    // Open send code page - would be cool to get the URL from the login page template to test that we're passing in the state correctly
    // const stateParam = new URLSearchParams(location.split("?")[1]);

    // const postSendCodeResponse = await worker.fetch(
    //   `/u/code?${stateParam.toString()}`,
    //   {
    //     method: "POST",
    //     body: JSON.stringify({
    //       username: "foo@example.com",
    //     }),
    //     headers: {
    //       "content-type": "application/json",
    //     },
    //     redirect: "manual",
    //   },
    // );

    // expect(postSendCodeResponse.status).toBe(302);
    // const enterCodeLocation = postSendCodeResponse.headers.get("location");

    // if (!enterCodeLocation) {
    //   throw new Error("No login location header found");
    // }

    // const enterCodeParams = enterCodeLocation.split("?")[1];

    // const emailResponse = await worker.fetch("/test/email");
    // // would be cool to have proper types returned from this...
    // const [sentEmail]: any = await emailResponse.json();
    // expect(sentEmail.to).toBe("foo@example.com");

    // const code = sentEmail.code;

    // // Authenticate using the code
    // const authenticateResponse = await worker.fetch(
    //   `/u/enter-code?${enterCodeParams}`,
    //   {
    //     headers: {
    //       "content-type": "application/json",
    //     },
    //     method: "POST",
    //     body: JSON.stringify({
    //       code,
    //     }),
    //     redirect: "manual",
    //   },
    // );

    // const codeLoginRedirectUri = authenticateResponse.headers.get("location");
    // if (!codeLoginRedirectUri) {
    //   throw new Error("No code login redirect uri found");
    // }
    // const redirectUrl = new URL(codeLoginRedirectUri);
    // expect(redirectUrl.pathname).toBe("/callback");
    // const accessToken = redirectUrl.searchParams.get("access_token");
    // expect(accessToken).toBeTruthy();
    // const idToken = redirectUrl.searchParams.get("id_token");
    // expect(idToken).toBeTruthy();
  });
});
