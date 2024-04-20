import { OTPAdapter } from "../../interfaces/OTP";
import { Database } from "../../../types";
import { list } from "./list";
import { create } from "./create";
import { remove } from "./remove";
import { Kysely } from "kysely";

export function createOTPAdapter(db: Kysely<Database>): OTPAdapter {
  return {
    create: create(db),
    list: list(db),
    remove: remove(db),
  };
}
