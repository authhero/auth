import { base64UrlEncode } from "../../src/utils/base64";
import { getCertificate } from "../../integration-test/helpers/token";
import {
  pemToBuffer,
  getKeyFormat,
  getAlgorithm,
  createToken,
} from "../../src/utils/jwt";
import { decodeBase64, parseJwt } from "../../src/utils/parse-jwt";

describe("pemToBuffer", () => {
  it("converts PEM string to ArrayBuffer", () => {
    const pem =
      "-----BEGIN PRIVATE KEY-----\nEXAMPLEKEYHERE\n-----END PRIVATE KEY-----";
    const result = pemToBuffer(pem);
    expect(result).toBeInstanceOf(ArrayBuffer);
  });
});

describe("getKeyFormat", () => {
  it("detects PKCS#8 format", () => {
    const pem = "-----BEGIN PRIVATE KEY-----EXAMPLE-----END PRIVATE KEY-----";
    expect(getKeyFormat(pem)).toBe("pkcs8");
  });

  it("detects SubjectPublicKeyInfo format", () => {
    const pem = "-----BEGIN PUBLIC KEY-----EXAMPLE-----END PUBLIC KEY-----";
    expect(getKeyFormat(pem)).toBe("spki");
  });

  it("detects RAW format", () => {
    const pem =
      "-----BEGIN RSA PRIVATE KEY-----EXAMPLE-----END RSA PRIVATE KEY-----";
    expect(getKeyFormat(pem)).toBe("raw");
  });

  it("throws error for unsupported key", () => {
    const pem =
      "-----BEGIN UNSUPPORTED KEY-----EXAMPLE-----END UNSUPPORTED KEY-----";
    expect(() => getKeyFormat(pem)).toThrow("Unsupported key");
  });
});

describe("getAlgorithm", () => {
  it("returns RS256 algorithm for signing", () => {
    expect(getAlgorithm("RS256", "sign")).toEqual({
      name: "RSASSA-PKCS1-v1_5",
      hash: { name: "SHA-256" },
    });
  });

  it("throws error for unsupported JWT algorithm", () => {
    expect(() => getAlgorithm("unsupported-algorithm" as any, "sign")).toThrow(
      "Unsupported JWT algorithm: unsupported-algorithm",
    );
  });
});

describe("payload", () => {
  it("should return a JWT with correct encoding for special characters", async () => {
    const certificate = getCertificate();

    const encoder = new TextEncoder();

    const token = await createToken({
      pemKey: certificate.privateKey,
      payload: {
        name: "ÅÄÖ",
      },
      alg: "RS256",
      headerAdditions: {},
    });

    const parsedToken = parseJwt(token);
    expect(parsedToken.name).toBe("ÅÄÖ");
  });
});
