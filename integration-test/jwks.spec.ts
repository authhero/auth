import { start } from "./start";

describe("jwks", () => {
  let worker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  it("should return a list with the test certificate", async () => {
    const response = await worker.fetch("/.well-known/jwks.json");

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.keys.length).toBe(1);
  });

  it("should create a new rsa-key and return it", async () => {
    const createKeyResponse = await worker.fetch("/create-key", {
      method: "POST",
    });

    expect(createKeyResponse.status).toBe(200);

    const response = await worker.fetch("/.well-known/jwks.json");

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.keys.length).toBe(2);
  });

  it("should return an openid-configuration with the current issues", async () => {
    const response = await worker.fetch("/.well-known/openid-configuration");

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.issuer).toBe("https://example.com/");
  });
});
