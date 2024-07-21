import { AuthParams } from "@authhero/adapter-interfaces";

export interface LoginState {
  connection?: string;
  authParams: AuthParams;
  state: string;
  errorMessage?: string;
}
