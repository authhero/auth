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

  let response = await env.AUTH_TEMPLATES.get(
    "templates/email/email-validation.liquid",
  );
  if (!response) {
    throw new Error("Code template not found");
  }

  const templateString = await response.text();

  const language = client.tenant.language || "en";

  const logo = getClientLogoPngGreyBg(
    client.tenant.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
    env.IMAGE_PROXY_URL,
  );

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
      email: client.tenant.senderEmail,
      name: client.tenant.senderName,
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

  const language = client.tenant.language || "en";

  const logo = getClientLogoPngGreyBg(
    client.tenant.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
    env.IMAGE_PROXY_URL,
  );

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
      email: client.tenant.senderEmail,
      name: client.tenant.senderName,
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
      email: client.tenant.senderEmail,
      name: client.tenant.senderName,
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
