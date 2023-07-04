import { Controller } from "@tsoa/runtime";
import { AuthParams, Env } from "../types";
import { headers } from "../constants";
import { encode, hexToBase64 } from "../utils/base64";

export interface UniversalAuthParams {
  env: Env;
  controller: Controller;
  authParams: AuthParams;
}

export async function universalAuth({
  env,
  controller,
  authParams,
}: UniversalAuthParams) {
  const stateId = env.STATE.newUniqueId().toString();
  const stateInstance = env.stateFactory.getInstanceById(stateId);
  const state = hexToBase64(stateId);
  await stateInstance.createState.mutate({
    state: JSON.stringify({ authParams, state }),
  });

  controller.setStatus(302);
  controller.setHeader(headers.location, `/u/login?state=${state}`);
  return "Redirect to login";
}
