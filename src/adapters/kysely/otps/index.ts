import { OTPAdapter } from "../../interfaces/OTP";
import { Database } from "../../../types";
import { list } from "./list";
import { create } from "./create";
import { Kysely } from "kysely";

export function createOTPAdapter(db: Kysely<Database>): OTPAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
