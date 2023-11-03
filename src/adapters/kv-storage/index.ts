import { Env } from "../../types";
import { DataAdapters } from "../interfaces";
import { createCertificatesAdapter } from "./Certificates";
import { createClientsAdapter } from "./clients";

export default function createAdapters(env: Env): Partial<DataAdapters> {
  return {
    certificates: createCertificatesAdapter(env),
    clients: createClientsAdapter(env),
  };
}
