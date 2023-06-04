import { readFileSync } from "fs";
import { join } from "path";

export function mockedR2Bucket() {
  return {
    get: async (path: string) => {
      const file = readFileSync(join(__dirname, "../../src", path));

      return {
        text: async () => {
          return file.toString();
        },
      };
    },
  } as R2Bucket;
}
