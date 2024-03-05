import { Client, Env } from "../../types";
import { Email } from "../../types/Email";

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
  sendPasswordReset: (
    env: Env,
    client: Client,
    to: string,
    // this is called "ticket" in auth0
    state: string,
  ) => Promise<void>;
  // Only for testing
  list?: () => Promise<Email[]>;
}
