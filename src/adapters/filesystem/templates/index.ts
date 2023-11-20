import { readFile } from "fs/promises";

export function createTemplatesAdapter() {
  return {
    get: (file: string) => {
      return readFile(`src/templates/${file}.liquid`, { encoding: "utf8" });
    },
  };
}
