export interface MockedKVStorageData {
  [key: string]: string;
}

export function kvStorageFixture(initalData: MockedKVStorageData = {}) {
  const data: MockedKVStorageData = initalData;

  return {
    get: async (key: string) => {
      return data[key];
    },
  } as KVNamespace;
}
