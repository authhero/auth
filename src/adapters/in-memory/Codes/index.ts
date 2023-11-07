import { CodesAdapter } from "../../interfaces/Codes";
import { Code } from "../../../types";
import { create } from "./create";
import { list } from "./list";

export function createCodesAdapter(): CodesAdapter {
  const otpStorage: Code[] = [];

  return {
    create: create(otpStorage),
    list: list(otpStorage),
  };
}
