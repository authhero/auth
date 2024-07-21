import { Certificate } from "@authhero/adapter-interfaces";
import { Kysely } from "kysely";
import { Database } from "../../../types";

export function create(db: Kysely<Database>) {
  return async (cert: Certificate) => {
    await db.insertInto("keys").values(cert).execute();
  };
}
