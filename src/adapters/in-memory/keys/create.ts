import { Certificate } from "../../../types";

export function create(certificateStorage: Certificate[]) {
  return async (key: Certificate): Promise<void> => {
    certificateStorage.push(key);
  };
}
