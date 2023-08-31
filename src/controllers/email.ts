import { Liquid } from "liquidjs";
import { translate } from "../utils/i18n";
import { Client, Env } from "../types";
import sendEmail from "../services/email";
import { getClientLogoPngGreyBg } from "../utils/clientLogos";

const engine = new Liquid();

export async function sendEmailValidation(
  env: Env,
  client: Client,
  to: string,
  code: string,
) {
  if (client.emailValidation === "disabled") {
    return;
  }

  const message = `Here is the code to validate your email: ${code}`;
  await sendEmail(client, {
    to: [{ email: to, name: to }],
    dkim: client.domains[0]?.dkimPrivateKey,
    from: {
      email: client.senderEmail,
      name: client.senderName,
    },
    content: [
      {
        type: "text/plain",
        value: message,
      },
      {
        type: "text/html",
        value: message,
      },
    ],
    subject: "Validate email",
  });
}

export async function sendCode(
  env: Env,
  client: Client,
  to: string,
  code: string,
) {
  let response = await env.AUTH_TEMPLATES.get("templates/email/code.liquid");
  if (!response) {
    throw new Error("Code template not found");
  }

  const templateString = await response.text();

  const language = client.language || "en";

  const logo = getClientLogoPngGreyBg(client.id);

  const sendCodeTemplate = engine.parse(templateString);
  const codeEmailBody = await engine.render(sendCodeTemplate, {
    code,
    vendorName: client.name,
    logo,
  });

  await sendEmail(client, {
    to: [{ email: to, name: to }],
    dkim: client.domains[0]?.dkimPrivateKey,
    from: {
      email: client.senderEmail,
      name: client.senderName,
    },
    content: [
      {
        type: "text/html",
        value: codeEmailBody,
      },
    ],
    subject: translate(language, "codeEmailTitle")
      .replace("{{vendorName}}", client.name)
      .replace("{{code}}", code),
  });
}

export async function sendResetPassword(
  env: Env,
  client: Client,
  to: string,
  code: string,
  state: string,
) {
  const message = `Click this link to reset your password: ${env.ISSUER}u/reset-password?state=${state}&code=${code}`;
  await sendEmail(client, {
    to: [{ email: to, name: to }],
    dkim: client.domains[0]?.dkimPrivateKey,
    from: {
      email: client.senderEmail,
      name: client.senderName,
    },
    content: [
      {
        type: "text/plain",
        value: message,
      },
    ],
    subject: "Reset password",
  });
}
