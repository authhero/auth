import { Certificate } from "@authhero/adapter-interfaces";
import { Kysely } from "kysely";
import { Database } from "../db";

export function create(db: Kysely<Database>) {
  return async (cert: Certificate) => {
    await db.insertInto("keys").values(cert).execute();
  };
}
