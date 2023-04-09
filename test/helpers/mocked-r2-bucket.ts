import { readFileSync } from "fs";

export function mockedR2Bucket(sourcePath: string) {
  return {
    get: async (path: string) => {
      const file = readFileSync(`${sourcePath}/${path}`);

      return {
        text: async () => {
          return file.toString();
        },
      };
    },
  } as R2Bucket;
}
