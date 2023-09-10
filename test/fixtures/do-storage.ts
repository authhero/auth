// TODO: this should really implement DurableObjectStorage, but for now we'll do a unsafe casting
export class DOStorageFixture {
  data = new Map<string, string>();

  async get<T = unknown>(key: string) {
    return this.data.get(key) ?? null;
  }

  // This is only available in the fixture and not in the actual storage. Only use in tests
  getSync(key: string) {
    if (!this.data.has(key)) {
      throw new Error("Key not set");
    }

    return this.data.get(key) as string;
  }

  async put<T = unknown>(key: string, value: string) {
    this.data.set(key, value);
  }

  async delete(key: string) {
    this.data.delete(key);
  }

  async deleteAll() {
    this.data.clear();
  }
}
