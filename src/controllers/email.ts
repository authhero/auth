import { Liquid } from "liquidjs";
import { translate } from "../utils/i18n";
import { Client, Env } from "../types";

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
  await env.sendEmail({
    to: [{ email: to, name: to }],
    dkim: client.domains[0],
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
  let response = await env.AUTH_TEMPLATES.get("code.liquid");
  if (!response) {
    throw new Error("Code template not found");
  }

  const templateString = await response.text();

  const language = client.language || "en";

  const sendCodeTemplate = engine.parse(templateString);
  const codeEmailBody = await engine.render(sendCodeTemplate, {
    code,
    vendorName: client.name,
    logo:
      client.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
  });

  await env.sendEmail({
    to: [{ email: to, name: to }],
    dkim: client.domains[0],
    from: {
      email: client.senderEmail,
      name: client.senderName,
    },
    content: [
      {
        type: "text/plain",
        value: translate(language, "codeEmailTitle")
          .replace("{{vendorName}}", client.name)
          .replace("{{code}}", code),
      },
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
  await env.sendEmail({
    to: [{ email: to, name: to }],
    dkim: client.domains[0],
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
