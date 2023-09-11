import { Env } from "../types/Env";
import { JWKS_CACHE_TIMEOUT_IN_SECONDS } from "../constants";

export interface Certificate {
  privateKey: string;
  publicKey: JsonWebKey;
  kid: string;
  created_at: number;
}

export async function getCertificate(env: Env): Promise<Certificate> {
  const certificatesString = await env.CERTIFICATES.get("default");
  if (!certificatesString) {
    throw new Error("No Certificate Found");
  }

  const certificate: Certificate = JSON.parse(certificatesString)
    // Wait for the cache to be cleared
    .filter(
      (c: Certificate) =>
        c.created_at + JWKS_CACHE_TIMEOUT_IN_SECONDS * 1000 < Date.now(),
    )
    .pop();

  return certificate;
}
