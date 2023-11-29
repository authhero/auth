import { setup } from "../helpers/setup";
import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";

describe("Login with code on liquidjs template", () => {
  let worker: UnstableDevWorker;

  beforeEach(async () => {
    worker = await start();

    await setup(worker);
  });

  afterEach(() => {
    worker.stop();
  });

  it("should login with code", async () => {
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

    // Open send code page - would be cool to get the URL from the login page template to test that we're passing in the state correctly
    const stateParam = new URLSearchParams(location.split("?")[1]);

    const postSendCodeResponse = await worker.fetch(
      `/u/code?${stateParam.toString()}`,
      {
        method: "POST",
        body: JSON.stringify({
          username: "foo@example.com",
        }),
        headers: {
          "content-type": "application/json",
        },
        redirect: "manual",
      },
    );

    expect(postSendCodeResponse.status).toBe(302);
    const enterCodeLocation = postSendCodeResponse.headers.get("location");

    if (!enterCodeLocation) {
      throw new Error("No login location header found");
    }

    const enterCodeParams = enterCodeLocation.split("?")[1];

    const emailResponse = await worker.fetch("/test/email");
    // would be cool to have proper types returned from this...
    const [sentEmail]: any = await emailResponse.json();
    expect(sentEmail.to).toBe("foo@example.com");

    const code = sentEmail.code;

    const formData = new FormData();
    formData.append("code", code);

    // Authenticate using the code
    const authenticateResponse = await worker.fetch(
      `/u/enter-code?${enterCodeParams}`,
      {
        headers: {
          "content-type": "multipart/form-data",
        },
        method: "POST",
        // this should be of type formData... how to do here?
        // is this the issue? hmmm
        // WTF is FormData_2??? needed here...
        body: formData,
        // body: JSON.stringify({
        //   code,
        // }),
        redirect: "manual",
      },
    );

    console.log(await authenticateResponse.text());
    console.log(authenticateResponse);

    console.log(authenticateResponse.headers.get("location"));

    // NOW - should be on the redirect_uri... Hmmmmmm
  });
});
