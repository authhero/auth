import { base64UrlEncode } from "./base64";
import { encodeToBase64 } from "./parse-jwt";

export function pemToBuffer(pem: string): ArrayBuffer {
  const base64String = pem
    .replace(/^-----BEGIN RSA PRIVATE KEY-----/, "")
    .replace(/-----END RSA PRIVATE KEY-----/, "")
    .replace(/^-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/^-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s/g, "");

  return Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0)).buffer;
}

export function getKeyFormat(pemString: string): "pkcs8" | "spki" | "raw" {
  if (pemString.startsWith("-----BEGIN PRIVATE KEY-----")) {
    return "pkcs8"; // PKCS#8 format for private keys
  } else if (pemString.startsWith("-----BEGIN PUBLIC KEY-----")) {
    return "spki"; // SubjectPublicKeyInfo for public keys
  } else if (pemString.startsWith("-----BEGIN RSA PRIVATE KEY-----")) {
    return "raw";
  }

  throw new Error("Unsupported key");
}

export type JwtAlgorithm =
  | "RS256"
  | "RS384"
  | "RS512"
  | "ES256"
  | "ES384"
  | "ES512";

export interface CreateTokenParams {
  pemKey: string;
  payload: { [key: string]: string | string[] | number | boolean };
  alg: JwtAlgorithm;
  headerAdditions: { [key: string]: string | string[] | number };
}

export function getAlgorithm(
  alg: JwtAlgorithm,
  operation: "sign" | "import",
): any {
  switch (alg) {
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" },
      };
    case "RS384":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-384" },
      };
    case "RS512":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-512" },
      };
    case "ES256":
      return {
        name: "ECDSA",
        namedCurve: operation === "import" ? "P-256" : undefined,
        hash: { name: "SHA-256" },
      };
    case "ES384":
      return {
        name: "ECDSA",
        namedCurve: operation === "import" ? "P-384" : undefined,
        hash: { name: "SHA-384" },
      };
    case "ES512":
      return {
        name: "ECDSA",
        namedCurve: operation === "import" ? "P-521" : undefined,
        hash: { name: "SHA-512" },
      };
    default:
      throw new Error(`Unsupported JWT algorithm: ${alg}`);
  }
}

export async function createToken(params: CreateTokenParams) {
  const keyBuffer = pemToBuffer(params.pemKey);

  const algorithm = getAlgorithm(params.alg, "import");

  const key = await crypto.subtle.importKey(
    getKeyFormat(params.pemKey),
    keyBuffer,
    algorithm,
    false, // Not extractable
    ["sign"],
  );

  const header = {
    alg: params.alg,
    typ: "JWT",
    ...params.headerAdditions,
  };

  // Convert header and payload to base64Url-encoded strings
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = encodeToBase64(JSON.stringify(params.payload));

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const unsignedTokenBuffer = new TextEncoder().encode(unsignedToken);
  const signature = await crypto.subtle.sign(
    getAlgorithm(params.alg, "sign"),
    key,
    unsignedTokenBuffer,
  );

  // Concatenate the unsignedToken with the base64Url-encoded signature to get the JWT
  const signedToken = `${unsignedToken}.${base64UrlEncode(
    String.fromCharCode.apply(null, Array.from(new Uint8Array(signature))),
  )}`;

  return signedToken;
}
