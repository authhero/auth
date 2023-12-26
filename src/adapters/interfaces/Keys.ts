import { SigningKey } from "../../types/SigningKey";

export interface KeysAdapter {
  list: () => Promise<SigningKey[]>;
}
