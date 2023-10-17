import { UserResponse, Totals } from "../../../types/auth0";
import { ListUserParams } from "../../interfaces/User";
import { Database } from "../../../types";
import { Kysely } from "kysely";

export function listTenants(db: Kysely<Database>) {
  return async () => {
    let query = db.selectFrom("tenants");

    const tenants = await query.selectAll().execute();

    return {
      tenants,
    };
  };
}
