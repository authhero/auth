import { list } from "./list";
import { Certificate } from "../../../types";
import { KeysAdapter } from "../../interfaces/Keys";
import { create } from "./create";
import { revoke } from "./revoke";

export function createKeysAdapter(): KeysAdapter {
  const keysStorage: Certificate[] = [];

  return {
    create: create(keysStorage),
    list: list(keysStorage),
    revoke: revoke(keysStorage),
  };
}
