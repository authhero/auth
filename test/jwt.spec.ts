import { createJWT, parseJWT, validateJWT } from "oslo/jwt";
import { RSASSAPKCS1v1_5 } from "oslo/crypto";
import { describe, expect, it } from "vitest";
import { TimeSpan } from "oslo";

describe("oslo", () => {
  it("should create a token with correct payload and headers", async () => {
    const rs256 = new RSASSAPKCS1v1_5("SHA-256");

    const { publicKey, privateKey } = await rs256.generateKeyPair();

    const jwt = await createJWT(
      "RS256",
      privateKey,
      { foo: "bar" },
      {
        includeIssuedTimestamp: true,
        expiresIn: new TimeSpan(1, "d"),
        headers: {
          kid: "test",
        },
      },
    );

    const valid = await validateJWT("RS256", publicKey, jwt);

    expect(valid).toBeTruthy();

    const payload = parseJWT(jwt);

    expect(payload?.header).toEqual({
      alg: "RS256",
      kid: "test",
      typ: "JWT",
    });

    // @ts-ignore
    const { exp, iat, ...rest } = payload?.payload;

    expect(rest).toEqual({
      foo: "bar",
    });
    expect(iat).toBeTypeOf("number");
    expect(exp).toBeTypeOf("number");
  });
});
