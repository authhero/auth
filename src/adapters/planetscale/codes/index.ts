import { CodesAdapter } from "../../interfaces/Codes";
import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { list } from "./list";
import { create } from "./create";

export function createCodesAdapter(env: Env): CodesAdapter {
  const db = getDb(env);

  return {
    create: create(db),
    list: list(db),
  };
}
