import { PasswordStorage } from ".";
import { PasswordParams, PasswordResponse } from "../../../types";

export function validate(passwordsStorage: PasswordStorage[]) {
  return async (
    tenant_id: string,
    params: PasswordParams,
  ): Promise<PasswordResponse> => {
    const password = passwordsStorage.find(
      (p) => p.tenant_id === tenant_id && p.user_id === params.user_id,
    );

    if (!password) {
      return {
        valid: false,
        message: "No password exists",
      };
    }

    if (password.password !== params.password) {
      return {
        valid: false,
        message: "Incorrect password",
      };
    }

    return {
      valid: true,
      message: "",
    };
  };
}
