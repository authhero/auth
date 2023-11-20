import { nanoid } from "nanoid";
import { CreateApplicaionParams } from "../../interfaces/Applications";
import { Application } from "../../../types";

export function create(applications: Application[]) {
  return async (tenant_id: string, params: CreateApplicaionParams) => {
    const application = {
      id: nanoid(),
      ...params,
      tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    applications.push(application);

    return application;
  };
}
