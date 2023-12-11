import { testClient } from "hono/testing";
import app from "../src/app";

describe("ping", () => {
  it("check that the root responds with a json document", async () => {
    const response = await testClient(app, { env: {} }).index.$get();

    const body: any = await response.json();
    expect(body.name).toBe("auth2");
  });
});
