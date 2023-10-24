import { Member } from "../../../types";
import { MembersDataAdapter } from "../../../adapters/interfaces/Members";
import { listMembers } from "./list";

export function createMembersAdapter(): MembersDataAdapter {
  const members: Member[] = [];

  return {
    list: listMembers(members),
  };
}
