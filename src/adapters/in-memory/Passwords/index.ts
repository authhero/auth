import { PasswordParams } from "../../../types";
import { PasswordsAdapter } from "../../interfaces/Passwords";
import { create } from "./create";
import { validate } from "./validate";

export interface PasswordStorage extends PasswordParams {
  tenant_id: string;
}

export function createPasswordsAdapter(): PasswordsAdapter {
  const passwordsStorage: PasswordStorage[] = [];

  return {
    create: create(passwordsStorage),
    validate: validate(passwordsStorage),
  };
}
