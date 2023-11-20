import { ApplicationsAdapter } from "../../interfaces/Applications";
import { Application } from "../../../types";
import { create } from "./create";
import { listTenants } from "./list";
import { getTenant } from "./get";
import { updateTenant } from "./update";

export function createApplicationsAdapter(): ApplicationsAdapter {
  const applications: Application[] = [];

  return {
    create: create(applications),
    // get: getTenant(applications),
    // list: listTenants(applications),
    // update: updateTenant(applications),
  };
}
