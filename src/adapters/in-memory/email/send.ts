import { EmailDTO } from ".";
import { Client, Env } from "../../../types";

export function sendCode(emailStorage: EmailDTO[]) {
  return async (
    env: Env,
    client: Client,
    to: string,
    code: string,
  ): Promise<void> => {
    emailStorage.push({ client, to, code });
  };
}

export function sendLink(emailStorage: EmailDTO[]) {
  return async (
    env: Env,
    client: Client,
    to: string,
    code: string,
    magicLink: string,
  ): Promise<void> => {
    emailStorage.push({ client, to, code, magicLink });
  };
}
