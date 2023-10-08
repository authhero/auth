import { getAdminToken } from "../helpers/token";
import { start } from "../start";

describe("tenants", () => {
  let worker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  it("should return an empty list of tenants", async () => {
    const token = await getAdminToken();

    console.log("Token: " + token);

    const response = await worker.fetch("/tenants", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const text = await response.text();
    expect(text).toBe("[]");

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual([]);
  });
});
