import { PasswordParams, PasswordResponse } from "../../types/Password";

export interface PasswordsAdapter {
  create: (tenant_id, params: PasswordParams) => Promise<void>;
  validate: (
    tenant_id: string,
    params: PasswordParams,
  ) => Promise<PasswordResponse>;
}
