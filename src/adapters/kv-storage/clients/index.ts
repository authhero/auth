import { Env } from "../../../types";
import { get } from "./get";

export function createClientsAdapter(env: Env) {
  return {
    get: get(env.CLIENTS),
  };
}
