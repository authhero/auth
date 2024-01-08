import { Database, Certificate } from "../../../types";
import { Kysely } from "kysely";

export function create(db: Kysely<Database>) {
  return async (cert: Certificate) => {
    await db.insertInto("keys").values(cert).execute();
  };
}
