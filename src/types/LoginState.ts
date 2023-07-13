import { AuthParams } from "./AuthParams";

export interface LoginState {
  connection?: string;
  authParams: AuthParams;
  state: string;
  errorMessage?: string;
}
