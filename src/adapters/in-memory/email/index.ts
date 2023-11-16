import { Client } from "../../../types";
import { EmailAdapter } from "../../interfaces/Email";
import { list } from "./list";
import { sendLink, sendCode } from "./send";

export interface EmailDTO {
  client: Client;
  to: string;
  code: string;
  magicLink?: string;
}

export function emailAdapter(): EmailAdapter {
  const emailStorage: EmailDTO[] = [];

  return {
    sendLink: sendLink(emailStorage),
    sendCode: sendCode(emailStorage),
    list: list(emailStorage),
  };
}
