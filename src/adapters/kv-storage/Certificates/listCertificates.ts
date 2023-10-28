import { Certificate } from "../../../models";

export function listCertificates(namespace: KVNamespace<string>) {
  return async (): Promise<Certificate[]> => {
    const certificateJson = await namespace.get("default");

    if (!certificateJson) {
      return [];
    }

    return JSON.parse(certificateJson);
  };
}
