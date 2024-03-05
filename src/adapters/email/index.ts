import { sendCode, sendLink } from "../../controllers/email";
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
      sendPasswordReset: async (env, client, to, state) => {
        console.log("sendPasswordReset", env, client, to, state);
      },
    },
  };
}
