import { Hook, HookInsert } from "../../types/Hooks";

export interface HooksAdapter {
  create: (tenant_id: string, hook: HookInsert) => Promise<Hook>;
  update: (
    tenant_id: string,
    hook_id: string,
    hook: Partial<HookInsert>,
  ) => Promise<boolean>;
  list: (tenant_id: string) => Promise<Hook[]>;
}
