import { setup } from "../helpers/setup";
import { getAdminToken } from "../helpers/token";
import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";

describe("Register password user", () => {
  let worker: UnstableDevWorker;
  let token: string;

  beforeEach(async () => {
    worker = await start();

    token = await setup(worker);
  });

  afterEach(() => {
    worker.stop();
  });

  it("should render error message if password invalid", async () => {
    const searchParams = new URLSearchParams();
    // how are these actually used? interesting....
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
    const location = response.headers.get("location");

    if (!location) {
      throw new Error("No location header found");
    }

    expect(location.startsWith("/u/login")).toBeTruthy;

    // Open login page
    const loginFormResponse = await worker.fetch(location, {});
    expect(loginFormResponse.status).toBe(200);

    const body = await loginFormResponse.text();

    console.log("login form HTML - ", body);
    // this is just
    // <div>Temp</div>
    // what?  ;-)

    // ahhhh, the templates are mocked to return this...
    // why though? if we don't load the templates then what are we testing here?
    // how to test we get error messages, or succesful logins?
    // at least we should JSON.stringify() the inputs
  });
});
