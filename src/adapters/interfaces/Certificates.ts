import { Certificate } from "../../models";

// Deprecated, use keys instead
export interface CertificatesAdapter {
  listCertificates: () => Promise<Certificate[]>;
  upsertCertificates: (keys: Certificate[]) => Promise<void>;
}
