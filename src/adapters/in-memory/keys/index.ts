import { list } from "./list";
import { Certificate } from "../../../types";
import { KeysAdapter } from "../../interfaces/Keys";
import { create } from "./create";

export function createKeysAdapter(): KeysAdapter {
  const keysStorage: Certificate[] = [];

  return {
    create: create(keysStorage),
    list: list(keysStorage),
  };
}
