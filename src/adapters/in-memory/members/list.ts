import { Member } from "../../../types";

export function listMembers(members: Member[]) {
  return async (tenantId) => {
    return {
      members,
    };
  };
}
