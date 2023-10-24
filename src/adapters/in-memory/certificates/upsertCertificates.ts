import { Certificate } from "../../../models";

export function upsertCertificates(certificatesStorage: Certificate[]) {
  return async (certificates: Certificate[]): Promise<void> => {
    certificatesStorage.length = 0;
    certificatesStorage.push(...certificates);
  };
}
