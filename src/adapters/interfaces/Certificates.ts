import { Certificate } from "../../models";

export interface CertificatesAdapter {
  listCertificates: () => Promise<Certificate[]>;
  upsertCertificates: (keys: Certificate[]) => Promise<void>;
}
