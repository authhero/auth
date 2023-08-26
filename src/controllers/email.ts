import { Client, Env } from "../types";
import { Liquid } from "liquidjs";

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
  // here goes the MJML template into liquidJS!  8-0
  const message = `Here is your login code: ${code}`;
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
    subject: "Login Code",
  });

  // what is this bucket?
  // bucket: R2Bucket,
  let response = await bucket.get(`email-templates/code.liquid`);
  const templateString = await response.text();

  const sendCodeTemplate = engine.parse(templateString);

  const renderedCodeEmail = await engine.render(sendCodeTemplate, {
    code,
    // TODO
    // i. host somewhere proper
    // ii. store client logo in KV store
    logo: 'https://checkout.sesamy.com/images/kvartal-logo.svg'
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
