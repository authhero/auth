import { Client } from "../../types";

export interface EmailAdapter {
  sendLink: (
    client: Client,
    to: string,
    code: string,
    magicLink: string,
  ) => Promise<void>;
  sendCode: (client: Client, to: string, code: string) => Promise<void>;
  // Only for testing
  list?: () => Promise<
    { client: Client; to: string; code: string; magicLink?: string }[]
  >;
}
