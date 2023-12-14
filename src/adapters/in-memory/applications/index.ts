import { ApplicationsAdapter } from "../../interfaces/Applications";
import { Application } from "../../../types";
import { create } from "./create";
import { list } from "./list";

export function createApplicationsAdapter(
  applications: Application[],
): ApplicationsAdapter {
  return {
    create: create(applications),
    list: list(applications),
  };
}
