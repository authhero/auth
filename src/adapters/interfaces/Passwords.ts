import { PasswordParams, PasswordResponse } from "../../types/Password";

export interface PasswordsAdapter {
  create: (tenant_id: string, params: PasswordParams) => Promise<void>;
  update: (tenant_id: string, params: PasswordParams) => Promise<boolean>;
  validate: (
    tenant_id: string,
    params: PasswordParams,
  ) => Promise<PasswordResponse>;
}
