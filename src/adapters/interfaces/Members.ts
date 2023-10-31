import { Member } from "../../types";
import { Totals } from "../../types/auth0/Totals";

export interface MembersDataAdapter {
  list(tenantId?: string): Promise<{ members: Member[]; totals?: Totals }>;
}
