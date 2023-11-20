import { CodesAdapter } from "../../interfaces/Codes";
import { SqlCode } from "../../../types";
import { create } from "./create";
import { list } from "./list";

export function createCodesAdapter(): CodesAdapter {
  const codesStorage: SqlCode[] = [];

  return {
    create: create(codesStorage),
    list: list(codesStorage),
  };
}
