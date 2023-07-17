import { CERTIFICATE_EXPIRE_IN_SECONDS } from "../constants";
import { Certificate } from "../models/Certificate";
import { Env } from "../types/Env";
import { create } from "../services/rsa-key";

export default async function rotateKeys(env: Env) {
  const certificatesString = await env.CERTIFICATES.get("default");
  const certificates: Certificate[] = certificatesString
    ? JSON.parse(certificatesString)
    : [];

  const newCertificate = await create();
  certificates.push(newCertificate);

  const filteredCertificates: Certificate[] = certificates.filter(
    (certificate: any) =>
      certificate.createdAt > Date.now() - CERTIFICATE_EXPIRE_IN_SECONDS * 1000,
  );

  await env.CERTIFICATES.put("default", JSON.stringify(filteredCertificates));
}
