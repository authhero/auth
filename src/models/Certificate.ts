import { Env } from "../types/Env";
import { JWKS_CACHE_TIMEOUT_IN_SECONDS } from "../constants";
import { Certificate } from "../types";

export async function getCertificate(env: Env): Promise<Certificate> {
  const certificates = await env.data.certificates.listCertificates();

  const certificate = certificates
    // Wait for the cache to be cleared
    .filter(
      (c: Certificate) =>
        c.created_at + JWKS_CACHE_TIMEOUT_IN_SECONDS * 1000 < Date.now(),
    )
    .pop();

  if (!certificate) {
    throw new Error("No Valid Certificate Found");
  }

  return certificate;
}
