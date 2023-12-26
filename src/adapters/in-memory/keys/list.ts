import { SigningKey } from "../../../types/SigningKey";

export function list(certificateStorage: SigningKey[]) {
  return async (): Promise<SigningKey[]> => {
    return certificateStorage;
  };
}
