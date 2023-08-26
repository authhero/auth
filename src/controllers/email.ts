import { Client, Env } from "../types";
import { Liquid } from "liquidjs";

const engine = new Liquid();

export async function sendEmailValidation(
  env: Env,
  client: Client,
  to: string,
  code: string
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
    ],
    subject: "Validate email",
  });
}

export async function sendCode(
  env: Env,
  client: Client,
  to: string,
  code: string
) {
  // here goes the MJML template into liquidJS!  8-0

  console.log("loading template");
  // what is this bucket?
  // bucket: R2Bucket,
  let response = await env.EMAIL_TEMPLATES.get(`email-templates/code.liquid`);
  if (!response) {
    throw new Error("Code template not found");
  }

  const templateString = await response.text();

  console.log("template string ok");

  const sendCodeTemplate = engine.parse(templateString);

  console.log("parse template ok");

  const codeEmailBody = await engine.render(sendCodeTemplate, {
    code,
    // TODO
    // i. host somewhere proper
    // ii. store client logo in KV store
    logo: "https://checkout.sesamy.com/images/kvartal-logo.svg",
  });

  console.log("render template ok");

  await env.sendEmail({
    to: [{ email: to, name: to }],
    dkim: client.domains[0],
    from: {
      email: client.senderEmail,
      name: client.senderName,
    },
    content: [
      {
        // what to do here? it's HTML but need to ALSO send text/plain?
        type: "text/plain",
        // can I just put the rendered output into here? TRY IT OUT! push to dev
        value: codeEmailBody,
      },
    ],
    // this will improve things a lot BUT what copy?
    subject: `Login Code - ${code}`,
  });

  console.log("send email ok");
}

export async function sendResetPassword(
  env: Env,
  client: Client,
  to: string,
  code: string,
  state: string
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
