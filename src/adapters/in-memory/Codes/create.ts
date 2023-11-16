import { Code } from "../../../types/Code";

export function create(codesStorgage: Code[]) {
  return async (code: Code): Promise<void> => {
    codesStorgage.push(code);
  };
}
