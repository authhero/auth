import { OTPAdapter } from "../../interfaces/OTP";
import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { list } from "./list";
import { create } from "./create";

export function createOTPAdapter(env: Env): OTPAdapter {
  const db = getDb(env);

  return {
    create: create(db),
    list: list(db),
  };
}
