import { Application } from "../../types";
import { Totals } from "../../types/auth0/Totals";
import { ListParams } from "./ListParams";

export interface CreateApplicaionParams {
  name: string;
  allowed_web_origins: string;
  allowed_callback_urls: string;
  allowed_logout_urls: string;
  email_validation: "enabled" | "disabled" | "enforced";
  client_secret: string;
  id?: string;
}

export interface ApplicationsAdapter {
  create(
    tenant_id: string,
    params: CreateApplicaionParams,
  ): Promise<Application>;
  // get(tenant_id: string, id: string): Promise<Application | undefined>;
  // list(
  //   tenant_id: string,
  //   params: ListParams,
  // ): Promise<{ applications: Application[]; totals?: Totals }>;
  // update(
  //   tenant_id: string,
  //   id: string,
  //   application: Partial<Application>,
  // ): Promise<void>;
}
