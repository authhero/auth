import { sendCode, sendLink } from "../../controllers/email";
import { Env } from "../../types";
import { DataAdapters } from "../interfaces";
export default function createEmailAdapter(): Partial<DataAdapters> {
  return {
    email: {
      sendCode: async (env, client, to, code) => {
        return sendCode(env, client, to, code);
      },
      sendLink: async (env, client, to, code, magicLink) => {
        console.log("sendLink", env, client, to, code, magicLink);

        return sendLink(env, client, to, code, magicLink);
      },
    },
  };
}
