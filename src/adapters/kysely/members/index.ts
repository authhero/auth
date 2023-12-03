import { MembersDataAdapter } from "../../interfaces/Members";
import { Database } from "../../../types";
import { listMembers } from "./list";
import { Kysely } from "kysely";

export function createMembersAdapter(db: Kysely<Database>): MembersDataAdapter {
  return {
    list: listMembers(db),
  };
}
