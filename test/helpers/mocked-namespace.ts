import randomString from "../../src/utils/random-string";

export class MockedDurabableObjectId implements DurableObjectId {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  equals(other: DurableObjectId): boolean {
    return other.toString() === this.id;
  }
}

export class MockedNamespaceStub implements DurableObjectStub {
  readonly id: DurableObjectId;
  readonly name?: string;

  constructor(id: DurableObjectId, name?: string) {
    this.id = id;
    this.name = name;
  }

  async fetch(input: RequestInfo, init?: RequestInit) {
    return new Response("Hello");
  }
}

export function mockedNamespace<T>(instance: any) {
  return {
    getInstanceById: () => {
      return instance;
    },
  } as T;
}
