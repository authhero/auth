import { CERTIFICATE_EXPIRE_IN_SECONDS } from "../constants";
import { Certificate } from "../models/Certificate";
import { Env } from "../types/Env";
import { create } from "../services/rsa-key";

export default async function rotateKeys(env: Env) {
  const certificates = await env.data.certificates.listCertificates();

  const newCertificate = await create();
  certificates.push(newCertificate);

  const filteredCertificates: Certificate[] = certificates.filter(
    (certificate: any) =>
      certificate.created_at >
      Date.now() - CERTIFICATE_EXPIRE_IN_SECONDS * 1000,
  );

  console.log(
    "cert: " +
      JSON.stringify(
        filteredCertificates.map((c) => ({
          created_at: c.created_at,
          kid: c.kid,
        })),
      ),
  );

  await env.data.certificates.upsertCertificates(filteredCertificates);
}
