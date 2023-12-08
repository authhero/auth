import { UserResponse } from "../../src/types/auth0";
import { getAdminToken } from "../helpers/token";
import { start } from "../start";
import type { UnstableDevWorker } from "wrangler";

describe("users by email", () => {
  let worker: UnstableDevWorker;
  let token;

  beforeEach(async () => {
    worker = await start();

    token = await getAdminToken();
    await worker.fetch("/api/v2/tenants", {
      method: "POST",
      body: JSON.stringify({
        name: "test",
        audience: "test",
        sender_name: "test",
        sender_email: "test@example.com",
      }),
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
    });
  });

  afterEach(() => {
    worker.stop();
  });

  it("should return 404 for non existent email address?", async () => {
    const token = await getAdminToken();

    const response = await worker.fetch(
      "/api/v2/users-by-email/?email=i-do-not-exist@all.com",
      {
        headers: {
          authorization: `Bearer ${token}`,
          "tenant-id": "test",
        },
      },
    );

    expect(response.status).toBe(404);
  });

  /* 
  TO TEST
  * simple get by email - no linked accounts
  * multiple simple primary not linked accounts
  * a primary account with multiple linked accounts - some on different email addresses
   
  
  TO INVESTIGATE
  * what happens when search for an email address on a linked account?
  Test this out on Auth0 mgmt API!
  */
});
