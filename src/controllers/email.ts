import { Liquid } from "liquidjs";
import { t } from "i18next";
import { translate } from "../utils/i18n";
import { AuthParams, Client, Env } from "../types";
import { getClientLogoPngGreyBg } from "../utils/clientLogos";
import en from "../locales/en/default.json";
import sv from "../locales/sv/default.json";
import nb from "../locales/nb/default.json";
import it from "../locales/it/default.json";
import pl from "../locales/pl/default.json";
import {
  codeV2,
  linkV2,
  passwordReset,
  verifyEmail,
} from "../templates/email/ts";
import { createMagicLink } from "../utils/magicLink";

const SUPPORTED_LOCALES: { [key: string]: object } = {
  en,
  sv,
  nb,
  it,
  pl,
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
  const logo = getClientLogoPngGreyBg(
    client.tenant.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
    env.IMAGE_PROXY_URL,
  );

  const sendCodeUniversalTemplate = engine.parse(codeV2);
  const sendCodeTemplateString = await engine.render(
    sendCodeUniversalTemplate,
    {
      code,
      vendorName: client.tenant.name,
      logo,
      supportUrl: client.tenant.support_url || "https://support.sesamy.com",
      buttonColor: client.tenant.primary_color || "#7d68f4",
      welcomeToYourAccount: t("welcome_to_your_account"),
      codeEmailEnterCode: t("code_email_enter_code"),
      codeEmailTitle: t("code_email_title"),
      codeValid30Mins: t("code_valid_30_minutes"),
      contactUs: t("contact_us"),
      copyright: t("copyright"),
      supportInfo: t("support_info"),
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
    subject: t("code_email_subject", {
      vendorName: client.tenant.name,
      code,
    }),
  });
}

export async function sendLink(
  env: Env,
  client: Client,
  to: string,
  code: string,
  authParams: AuthParams,
) {
  const language = client.tenant.language || "sv";
  const locale = getLocale(language);

  const magicLink = createMagicLink({
    issuer: env.ISSUER,
    code,
    authParams,
    email: to,
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
    subject: t("code_email_subject", {
      vendorName: client.tenant.name,
      code,
    }),
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
    subject: t("password_reset_subject", {
      vendorName: client.tenant.name,
    }),
  });
}

export async function sendValidateEmailAddress(
  env: Env,
  client: Client,
  to: string,
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
    subject: t("verify_email_subject", {
      vendorName: client.tenant.name,
    }),
  });
}
