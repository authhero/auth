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
    // auth0 uses a ticket not a code...
    code: string,
    state: string,
  ) => Promise<void>;
  sendValidateEmailAddress: (
    env: Env,
    client: Client,
    to: string,
    code: string,
    state: string,
  ) => Promise<void>;
  // Only for testing
  list?: () => Promise<Email[]>;
}
