import { Certificate } from "../../../types";

export function revoke(certificateStorage: Certificate[]) {
  return async (kid: string, revoke_at: Date): Promise<boolean> => {
    const key = certificateStorage.find((key) => key.kid === kid);
    if (!key) {
      return false;
    }

    key.revoked_at = revoke_at.toISOString();
    return true;
  };
}
