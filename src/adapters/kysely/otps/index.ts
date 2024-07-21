import { OTPAdapter } from "@authhero/adapter-interfaces";
import { list } from "./list";
import { create } from "./create";
import { remove } from "./remove";
import { Kysely } from "kysely";
import { Database } from "../db";

export function createOTPAdapter(db: Kysely<Database>): OTPAdapter {
  return {
    create: create(db),
    list: list(db),
    remove: remove(db),
  };
}
