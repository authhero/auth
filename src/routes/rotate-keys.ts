import { Context } from "hono";
import { CERTIFICATE_EXPIRE_IN_SECONDS } from "../constants";
import { Certificate } from "../models/Certificate";
import { Env } from "../types/Env";
import { create } from "../services/rsa-key";
import { Var } from "../types/Var";

export async function rotateKeysRoute(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
) {
  await rotateKeys(ctx.env);

  return ctx.text("OK");
}

export async function rotateKeys(env: Env) {
  const certificates = await env.data.certificates.listCertificates();

  const newCertificate = await create();
  certificates.push(newCertificate);

  const filteredCertificates: Certificate[] = certificates.filter(
    (certificate: any) =>
      certificate.created_at >
      Date.now() - CERTIFICATE_EXPIRE_IN_SECONDS * 1000,
  );

  await env.data.certificates.upsertCertificates(filteredCertificates);
}
