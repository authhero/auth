import { Context } from "cloudworker-router";
import { Env } from "../types/Env";
import { JWKS_CACHE_TIMEOUT_IN_SECONDS } from "../constants";

export interface Certificate {
  privateKey: string;
  publicKey: JsonWebKey;
  kid: string;
  createdAt: number;
}

export async function getCertificate(ctx: Context<Env>): Promise<Certificate> {
  const certificatesString = await ctx.env.CERTIFICATES.get("default");
  if (!certificatesString) {
    throw new Error("No Certificate Found");
  }

  const certificate: Certificate = JSON.parse(certificatesString)
    // Wait for the cache to be cleared
    .filter(
      (c: Certificate) =>
        c.createdAt + JWKS_CACHE_TIMEOUT_IN_SECONDS * 1000 < Date.now()
    )
    .pop();

  return certificate;
}
