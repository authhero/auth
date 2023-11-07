import { PasswordStorage } from ".";
import { PasswordParams } from "../../../types";

export function create(passwordsStorage: PasswordStorage[]) {
  return async (tenant_id: string, params: PasswordParams): Promise<void> => {
    passwordsStorage.push({ tenant_id, ...params });
  };
}
