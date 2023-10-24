import { Env } from "../../../types";
import { CertificatesAdapter } from "../../interfaces/Certificates";
import { listCertificates } from "./listCertificates";
import { upsertCertificates } from "./upsertCertificates";

export function createCertificatesAdapter(env: Env): CertificatesAdapter {
  return {
    listCertificates: listCertificates(env.CERTIFICATES),
    upsertCertificates: upsertCertificates(env.CERTIFICATES),
  };
}
