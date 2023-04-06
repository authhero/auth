import { AuthParams } from "./AuthParams";

export interface LoginState {
  username?: string;
  connection?: string;
  authParams: AuthParams;
}
