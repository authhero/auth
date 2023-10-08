import { CertificatesAdapter } from "../../interfaces/Certificates";
import { listCertificates } from "./listCertificates";
import { upsertCertificates } from "./upsertCertificates";
import { Certificate } from "../../../models";

export function createCertificateAdapter(): CertificatesAdapter {
  const certificateStorage: Certificate[] = [];

  return {
    listCertificates: listCertificates(certificateStorage),
    upsertCertificates: async (cert) => {
      const func = upsertCertificates(certificateStorage);

      return await func(cert);
    },
  };
}
