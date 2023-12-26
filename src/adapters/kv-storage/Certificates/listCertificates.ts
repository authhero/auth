import { Certificate } from "../../../types";

export function listCertificates(namespace: KVNamespace<string>) {
  return async (): Promise<Certificate[]> => {
    const certificateJson = await namespace.get("default");

    if (!certificateJson) {
      return [];
    }

    const parsed = JSON.parse(certificateJson);

    return {
      ...parsed,
      private_key: JSON.stringify(parsed.private_key),
    };
  };
}
