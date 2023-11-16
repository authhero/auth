import { Client, Env } from "../../types";

export interface EmailAdapter {
  sendLink: (
    env: Env,
    client: Client,
    to: string,
    code: string,
    magicLink: string,
  ) => Promise<void>;
  sendCode: (
    env: Env,
    client: Client,
    to: string,
    code: string,
  ) => Promise<void>;
  // Only for testing
  list?: () => Promise<
    { client: Client; to: string; code: string; magicLink?: string }[]
  >;
}
