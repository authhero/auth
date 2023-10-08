import { Certificate } from "../../../models";

export function upsertCertificates(namespace: KVNamespace<string>) {
  return async (keys: Certificate[]): Promise<void> => {
    await namespace.put("default", JSON.stringify(keys));
  };
}
