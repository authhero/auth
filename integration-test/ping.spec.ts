import { start } from "./start";

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

    const body = await response.json();
    expect(body.name).toBe("auth2");
  });
});
