import { Context } from "cloudworker-router";
import { Env } from "../types/Env";
import {
  AuthorizationCodeGrantTypeParams,
  TokenResponse,
} from "../types/Token";

export async function authorizationCodeGrant(
  ctx: Context<Env>,
  params: AuthorizationCodeGrantTypeParams
): Promise<TokenResponse | null> {
  throw new Error("Not implemented");
}
