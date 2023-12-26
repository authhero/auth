import { Certificate } from "../../types";

// Deprecated, use keys instead
export interface CertificatesAdapter {
  listCertificates: () => Promise<Certificate[]>;
  upsertCertificates: (keys: Certificate[]) => Promise<void>;
}
