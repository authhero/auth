import {
  sendCode,
  sendLink,
  sendResetPassword,
  sendValidateEmailAddress,
} from "../../controllers/email";
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
      sendPasswordReset: async (env, client, to, code, state) => {
        console.log("sendPasswordReset", env, client, to, code, state);

        return sendResetPassword(env, client, to, code, state);
      },
      sendValidateEmailAddress: async (env, client, to, code, state) => {
        console.log("sendValidateEmailAddress", env, client, to, code, state);

        return sendValidateEmailAddress(env, client, to, code, state);
      },
    },
  };
}
