import { Code } from "@authhero/adapter-interfaces";
import { Kysely } from "kysely";
import { Database } from "../db";

export function list(db: Kysely<Database>) {
  return async (tenant_id: string, user_id: string): Promise<Code[]> => {
    const now = new Date().toISOString();

    const codes = await db
      .selectFrom("codes")
      .where("codes.tenant_id", "=", tenant_id)
      .where("codes.user_id", "=", user_id)
      .where("codes.used_at", "is", null)
      .where("codes.expires_at", ">", now)
      .selectAll()
      .execute();

    return codes.map((code) => {
      const { tenant_id, ...rest } = code;
      return rest;
    });
  };
}
