import { nanoid } from "nanoid";
import { CreateApplicationParams } from "../../interfaces/Applications";
import { Application } from "../../../types";

export function create(applications: Application[]) {
  return async (tenant_id: string, params: CreateApplicationParams) => {
    const application = {
      ...params,
      tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    applications.push(application);

    return application;
  };
}
