import { EmailDTO } from ".";
import { Client } from "../../../types";

export function sendCode(emailStorage: EmailDTO[]) {
  return async (client: Client, to: string, code: string): Promise<void> => {
    emailStorage.push({ client, to, code });
  };
}

export function sendLink(emailStorage: EmailDTO[]) {
  return async (
    client: Client,
    to: string,
    code: string,
    magicLink: string,
  ): Promise<void> => {
    emailStorage.push({ client, to, code, magicLink });
  };
}
