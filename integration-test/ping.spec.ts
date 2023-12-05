import { start } from "./start";
import type { UnstableDevWorker } from "wrangler";

describe("ping", () => {
  let worker: UnstableDevWorker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  it("check that the root responds with a json document", async () => {
    const response = await worker.fetch("/");

    if (!response.ok) {
      throw new Error(`Test failed with ${await response.text()}`);
    }

    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body.name).toBe("auth2");
  });
});
