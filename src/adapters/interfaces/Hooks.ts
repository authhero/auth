import { Totals } from "../../types";
import { Hook, HookInsert } from "../../types/Hooks";
import { ListParams } from "./ListParams";

export interface ListHooksResponse extends Totals {
  hooks: Hook[];
}

export interface HooksAdapter {
  create: (tenant_id: string, hook: HookInsert) => Promise<Hook>;
  update: (
    tenant_id: string,
    hook_id: string,
    hook: Partial<HookInsert>,
  ) => Promise<boolean>;
  list: (tenant_id: string, params: ListParams) => Promise<ListHooksResponse>;
}