import { DomainsAdapter } from "../../interfaces/Domains";
import { SqlDomain } from "../../../types";
import { create } from "./create";

export function createDomainsAdapter(domains: SqlDomain[]): DomainsAdapter {
  return {
    create: create(domains),
  };
}
