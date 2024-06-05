import { Liquid } from "liquidjs";
import { translate } from "../utils/i18n";
import { Client, Env } from "../types";
import { getClientLogoPngGreyBg } from "../utils/clientLogos";
import en from "../locales/en/default.json";
import sv from "../locales/sv/default.json";
import nb from "../locales/nb/default.json";
import it from "../locales/it/default.json";
import {
  codeV2,
  linkV2,
  passwordReset,
  verifyEmail,
} from "../templates/email/ts";
import { createMagicLink } from "../utils/magicLink";
import { UniversalLoginSession } from "../adapters/interfaces/UniversalLoginSession";

const SUPPORTED_LOCALES: { [key: string]: object } = {
  en,
  sv,
  nb,
  it,
};

function getLocale(language: string) {
  if (SUPPORTED_LOCALES[language]) {
    return SUPPORTED_LOCALES[language];
  }
  return en;
}

const engine = new Liquid();

export async function sendCode(
  env: Env,
  client: Client,
  to: string,
  code: string,
) {
  const language = client.tenant.language || "sv";
  const locale = getLocale(language);

  const logo = getClientLogoPngGreyBg(
    client.tenant.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
    env.IMAGE_PROXY_URL,
  );

  const sendCodeUniversalTemplate = engine.parse(codeV2);
  const sendCodeTemplateString = await engine.render(
    sendCodeUniversalTemplate,
    {
      ...locale,
      code,
      vendorName: client.tenant.name,
      logo,
      supportUrl: client.tenant.support_url || "https://support.sesamy.com",
      buttonColor: client.tenant.primary_color || "#7d68f4",
    },
  );
  const sendCodeTemplate = engine.parse(sendCodeTemplateString);
  const codeEmailBody = await engine.render(sendCodeTemplate, {
    code,
    vendorName: client.tenant.name,
    logo,
    supportUrl: client.tenant.support_url || "https://support.sesamy.com",
    buttonColor: client.tenant.primary_color || "#7d68f4",
  });

  await env.sendEmail(client, {
    to: [{ email: to, name: to }],
    from: {
      email: client.tenant.sender_email,
      name: client.tenant.sender_name,
    },
    content: [
      {
        type: "text/html",
        value: codeEmailBody,
      },
    ],
    subject: translate(language, "codeEmailTitle")
      .replace("{{vendorName}}", client.tenant.name)
      .replace("{{code}}", code),
  });
}

export async function sendLink(
  env: Env,
  client: Client,
  to: string,
  code: string,
  session: UniversalLoginSession,
) {
  const language = client.tenant.language || "sv";
  const locale = getLocale(language);

  const magicLink = createMagicLink({
    issuer: env.ISSUER,
    session,
    code,
  });

  const logo = getClientLogoPngGreyBg(
    client.tenant.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
    env.IMAGE_PROXY_URL,
  );

  const sendCodeUniversalTemplate = engine.parse(linkV2);
  const sendCodeTemplateString = await engine.render(
    sendCodeUniversalTemplate,
    {
      ...locale,
      // pass in variables twice! no harm to overdo it
      code,
      vendorName: client.tenant.name,
      logo,
      supportUrl: client.tenant.support_url || "https://support.sesamy.com",
      magicLink,
      buttonColor: client.tenant.primary_color || "#7d68f4",
    },
  );
  const sendCodeTemplate = engine.parse(sendCodeTemplateString);
  const codeEmailBody = await engine.render(sendCodeTemplate, {
    code,
    vendorName: client.tenant.name,
    logo,
    supportUrl: client.tenant.support_url || "https://support.sesamy.com",
    magicLink,
    buttonColor: client.tenant.primary_color || "#7d68f4",
  });

  await env.sendEmail(client, {
    to: [{ email: to, name: to }],
    from: {
      email: client.tenant.sender_email,
      name: client.tenant.sender_name,
    },
    content: [
      {
        type: "text/html",
        value: codeEmailBody,
      },
    ],
    subject: translate(language, "codeEmailTitle")
      .replace("{{vendorName}}", client.tenant.name)
      .replace("{{code}}", code),
  });
}

export async function sendResetPassword(
  env: Env,
  client: Client,
  to: string,
  // auth0 just has a ticket, but we have a code and a state
  code: string,
  state: string,
) {
  const language = client.tenant.language || "sv";
  const locale = getLocale(language);

  const logo = getClientLogoPngGreyBg(
    client.tenant.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
    env.IMAGE_PROXY_URL,
  );

  // the auth0 link looks like this:  https://auth.sesamy.dev/u/reset-verify?ticket={ticket}#
  const passwordResetUrl = `${env.ISSUER}u/reset-password?state=${state}&code=${code}`;

  const sendPasswordResetUniversalTemplate = engine.parse(passwordReset);
  const sendPasswordResetTemplateString = await engine.render(
    sendPasswordResetUniversalTemplate,
    {
      ...locale,
      vendorName: client.tenant.name,
      logo,
      passwordResetUrl,
      supportUrl: client.tenant.support_url || "https://support.sesamy.com",
      buttonColor: client.tenant.primary_color || "#7d68f4",
    },
  );
  const sendPasswordResetTemplate = engine.parse(
    sendPasswordResetTemplateString,
  );
  const passwordResetBody = await engine.render(sendPasswordResetTemplate, {
    passwordResetUrl,
    vendorName: client.tenant.name,
    logo,
    supportUrl: client.tenant.support_url || "https://support.sesamy.com",
    buttonColor: client.tenant.primary_color || "#7d68f4",
  });

  await env.sendEmail(client, {
    to: [{ email: to, name: to }],
    from: {
      email: client.tenant.sender_email,
      name: client.tenant.sender_name,
    },
    content: [
      {
        type: "text/html",
        value: passwordResetBody,
      },
    ],
    subject: translate(language, "passwordResetTitle").replace(
      "{{vendorName}}",
      client.tenant.name,
    ),
  });
}

export async function sendValidateEmailAddress(
  env: Env,
  client: Client,
  to: string,
  code: string,
  state: string,
) {
  // const response = await env.AUTH_TEMPLATES.get(
  //   "templates/email/verify-email.liquid",
  // );

  const language = client.tenant.language || "sv";
  const locale = getLocale(language);

  const logo = getClientLogoPngGreyBg(
    client.tenant.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
    env.IMAGE_PROXY_URL,
  );

  // we have not checked the route name that auth0 uses
  const emailValidationUrl = `${env.ISSUER}u/validate-email?state=${state}&code=${code}`;

  const sendEmailValidationUniversalTemplate = engine.parse(verifyEmail);
  const sendEmailValidationTemplateString = await engine.render(
    sendEmailValidationUniversalTemplate,
    {
      ...locale,
      vendorName: client.tenant.name,
      logo,
      emailValidationUrl,
      supportUrl: client.tenant.support_url || "https://support.sesamy.com",
      buttonColor: client.tenant.primary_color || "#7d68f4",
    },
  );
  const sendEmailValidationTemplate = engine.parse(
    sendEmailValidationTemplateString,
  );
  const emailValidationBody = await engine.render(sendEmailValidationTemplate, {
    emailValidationUrl,
    vendorName: client.tenant.name,
    logo,
    supportUrl: client.tenant.support_url || "https://support.sesamy.com",
    buttonColor: client.tenant.primary_color || "#7d68f4",
  });

  await env.sendEmail(client, {
    to: [{ email: to, name: to }],
    from: {
      email: client.tenant.sender_email,
      name: client.tenant.sender_name,
    },
    content: [
      {
        type: "text/html",
        value: emailValidationBody,
      },
    ],
    subject: translate(language, "verifyEmailTitle").replace(
      "{{vendorName}}",
      client.tenant.name,
    ),
  });
}
