import { MembersDataAdapter } from "../../../adapters/interfaces/Members";
import { getDb } from "../../../services/db";
import { Env } from "../../../types";
import { listMembers } from "./list";

export function createMembersAdapter(env: Env): MembersDataAdapter {
  const db = getDb(env);

  return {
    list: listMembers(db),
  };
}
