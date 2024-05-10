import { describe, it, expect } from "vitest";
import { pemToBuffer } from "../../src/utils/jwt";

describe("pemToBuffer", () => {
  it("converts PEM string to ArrayBuffer", () => {
    const pem =
      "-----BEGIN PRIVATE KEY-----\nEXAMPLEKEYHERE\n-----END PRIVATE KEY-----";
    const result = pemToBuffer(pem);
    expect(result).toBeInstanceOf(ArrayBuffer);
  });
});
