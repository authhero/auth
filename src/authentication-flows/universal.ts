import { Controller } from "@tsoa/runtime";
import { AuthParams } from "../types";
import { headers } from "../constants";
import { encode } from "../utils/base64";

export interface UniversalAuthParams {
  controller: Controller;
  authParams: AuthParams;
}

export async function universalAuth({
  controller,
  authParams,
}: UniversalAuthParams) {
  const encodedAuthParams = encode(JSON.stringify({ authParams }));

  const querystring = new URLSearchParams();
  querystring.set("state", encodedAuthParams);

  controller.setStatus(302);
  controller.setHeader(headers.location, `/u/login?state=${encodedAuthParams}`);
  return "Redirect to login";
}
