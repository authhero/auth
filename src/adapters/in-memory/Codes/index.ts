import { CodesAdapter } from "../../interfaces/Codes";
import { Code } from "../../../types";
import { create } from "./create";
import { list } from "./list";

export function createCodesAdapter(): CodesAdapter {
  const codesStorage: Code[] = [];

  return {
    create: create(codesStorage),
    list: list(codesStorage),
  };
}
