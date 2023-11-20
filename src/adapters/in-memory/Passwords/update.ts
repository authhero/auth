import { PasswordStorage } from ".";
import { PasswordParams } from "../../../types";

export function update(passwordsStorage: PasswordStorage[]) {
  return async (
    tenant_id: string,
    params: PasswordParams,
  ): Promise<boolean> => {
    const item = passwordsStorage.find((i) => i.user_id === params.user_id);
    if (!item) {
      return false;
    }
    item.password = params.password;
    return true;
  };
}
