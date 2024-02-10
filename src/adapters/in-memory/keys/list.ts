import { Certificate } from "../../../types";

export function list(certificateStorage: Certificate[]) {
  return async (): Promise<Certificate[]> => {
    return certificateStorage;
  };
}
