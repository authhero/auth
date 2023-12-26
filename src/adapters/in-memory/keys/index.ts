import { list } from "./list";
import { SigningKey } from "../../../types/SigningKey";
import { KeysAdapter } from "../../interfaces/Keys";

export function createKeysAdapter(): KeysAdapter {
  const keysStorage: SigningKey[] = [];

  return {
    list: list(keysStorage),
  };
}
