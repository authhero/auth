import { Database, Member } from "../../../types";
import { Kysely } from "kysely";

export function listMembers(db: Kysely<Database>) {
  return async (tenantId: string) => {
    let query = db
      .selectFrom("members")
      .where("members.tenant_id", "=", tenantId);

    const members: Member[] = await query.selectAll().execute();

    return {
      members,
    };
  };
}
