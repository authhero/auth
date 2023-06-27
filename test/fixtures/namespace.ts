export class MockedDurabableObjectId implements DurableObjectId {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  equals(other: DurableObjectId): boolean {
    return other.toString() === this.id;
  }
}

export function mockedNamespace<T>(instance: any) {
  return {
    newUniqueId: () => instance,
    getInstance: () => instance,
    getInstanceById: () => instance,
    getInstanceByName: () => instance,
  } as T;
}
