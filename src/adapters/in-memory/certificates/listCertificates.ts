import { Certificate } from "../../../models";

export function listCertificates(certificateStorage: Certificate[]) {
  return async (): Promise<Certificate[]> => {
    return certificateStorage;
  };
}
