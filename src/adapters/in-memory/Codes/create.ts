import { Code } from "../../../types/Code";

export function create(codesStorgage: Code[]) {
  return async (tenantId: string, code: Code): Promise<void> => {
    codesStorgage.push(code);
  };
}
