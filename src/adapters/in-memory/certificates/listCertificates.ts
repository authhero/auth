import { Certificate } from "../../../types";

export function listCertificates(certificateStorage: Certificate[]) {
  return async (): Promise<Certificate[]> => {
    return certificateStorage;
  };
}
