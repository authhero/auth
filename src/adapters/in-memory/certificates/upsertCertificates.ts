import { Certificate } from "../../../types";

export function upsertCertificates(certificatesStorage: Certificate[]) {
  return async (certificates: Certificate[]): Promise<void> => {
    certificatesStorage.length = 0;
    certificatesStorage.push(...certificates);
  };
}
