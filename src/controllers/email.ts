import { Context } from "hono";
import { Liquid } from "liquidjs";
import { t } from "i18next";
import { Client, Env, Var } from "../types";
import { getClientLogoPngGreyBg } from "../utils/clientLogos";
import {
  codeV2,
  linkV2,
  passwordReset,
  verifyEmail,
} from "../templates/email/ts";
import { createMagicLink } from "../utils/magicLink";
import { createLogMessage } from "../utils/create-log-message";
import { waitUntil } from "../utils/wait-until";
import { AuthParams, LogTypes } from "@authhero/adapter-interfaces";

const engine = new Liquid();

export async function sendCode(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  client: Client,
  to: string,
  code: string,
) {
  const { env } = ctx;

  const logo = getClientLogoPngGreyBg(
    client.tenant.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
    env.IMAGE_PROXY_URL,
  );

  const sendCodeUniversalTemplate = engine.parse(codeV2);

  const options = {
    code,
    vendorName: client.tenant.name,
    lng: client.tenant.language || "sv",
  };

  const codeEmailBody = await engine.render(sendCodeUniversalTemplate, {
    code,
    vendorName: client.tenant.name,
    logo,
    supportUrl: client.tenant.support_url || "https://support.sesamy.com",
    buttonColor: client.tenant.primary_color || "#7d68f4",
    welcomeToYourAccount: t("welcome_to_your_account", options),
    codeEmailEnterCode: t("code_email_enter_code", options),
    codeEmailTitle: t("code_email_title", options),
    codeValid30Mins: t("code_valid_30_minutes", options),
    contactUs: t("contact_us", options),
    copyright: t("copyright", options),
    supportInfo: t("support_info", options),
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
    subject: t("code_email_subject", options),
  });

  const log = createLogMessage(ctx, {
    type: LogTypes.CODE_LINK_SENT,
    description: to,
  });
  waitUntil(ctx, ctx.env.data.logs.create(client.tenant_id, log));
}

export async function sendLink(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  client: Client,
  to: string,
  code: string,
  authParams: AuthParams,
) {
  const { env } = ctx;

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

  const options = {
    vendorName: client.tenant.name,
    code,
    lng: client.tenant.language || "sv",
  };

  const codeEmailBody = await engine.render(sendCodeUniversalTemplate, {
    code,
    vendorName: client.tenant.name,
    logo,
    supportUrl: client.tenant.support_url || "https://support.sesamy.com",
    magicLink,
    buttonColor: client.tenant.primary_color || "#7d68f4",
    welcomeToYourAccount: t("welcome_to_your_account", options),
    linkEmailClickToLogin: t("link_email_click_to_login", options),
    linkEmailLogin: t("link_email_login", options),
    linkEmailOrEnterCode: t("link_email_or_enter_code", options),
    codeValid30Mins: t("code_valid_30_minutes", options),
    supportInfo: t("support_info", options),
    contactUs: t("contact_us", options),
    copyright: t("copyright", options),
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
    subject: t("code_email_subject", options),
  });

  const log = createLogMessage(ctx, {
    type: LogTypes.CODE_LINK_SENT,
    description: to,
  });
  waitUntil(ctx, ctx.env.data.logs.create(client.tenant_id, log));
}

export async function sendResetPassword(
  env: Env,
  client: Client,
  to: string,
  // auth0 just has a ticket, but we have a code and a state
  code: string,
  state: string,
) {
  const logo = getClientLogoPngGreyBg(
    client.tenant.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
    env.IMAGE_PROXY_URL,
  );

  // the auth0 link looks like this:  https://auth.sesamy.dev/u/reset-verify?ticket={ticket}#
  const passwordResetUrl = `${env.ISSUER}u/reset-password?state=${state}&code=${code}`;

  const sendPasswordResetUniversalTemplate = engine.parse(passwordReset);

  const options = {
    vendorName: client.tenant.name,
    lng: client.tenant.language || "sv",
  };

  const passwordResetBody = await engine.render(
    sendPasswordResetUniversalTemplate,
    {
      vendorName: client.tenant.name,
      logo,
      passwordResetUrl,
      supportUrl: client.tenant.support_url || "https://support.sesamy.com",
      buttonColor: client.tenant.primary_color || "#7d68f4",
      passwordResetTitle: t("password_reset_title", options),
      resetPasswordEmailClickToReset: t(
        "reset_password_email_click_to_reset",
        options,
      ),
      resetPasswordEmailReset: t("reset_password_email_reset", options),
      supportInfo: t("support_info", options),
      contactUs: t("contact_us", options),
      copyright: t("copyright", options),
    },
  );

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
    subject: t("password_reset_subject", options),
  });
}

export async function sendValidateEmailAddress(
  env: Env,
  client: Client,
  to: string,
  code: string,
  state: string,
) {
  const logo = getClientLogoPngGreyBg(
    client.tenant.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
    env.IMAGE_PROXY_URL,
  );

  // we have not checked the route name that auth0 uses
  const emailValidationUrl = `${env.ISSUER}u/validate-email?state=${state}&code=${code}`;

  const sendEmailValidationUniversalTemplate = engine.parse(verifyEmail);

  const options = {
    vendorName: client.tenant.name,
    lng: client.tenant.language || "sv",
  };

  const emailValidationBody = await engine.render(
    sendEmailValidationUniversalTemplate,
    {
      vendorName: client.tenant.name,
      logo,
      emailValidationUrl,
      supportUrl: client.tenant.support_url || "https://support.sesamy.com",
      buttonColor: client.tenant.primary_color || "#7d68f4",
      welcomeToYourAccount: t("welcome_to_your_account", options),
      verifyEmailVerify: t("verify_email_verify", options),
      supportInfo: t("support_info", options),
      contactUs: t("contact_us", options),
      copyright: t("copyright", options),
    },
  );

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
    subject: t("verify_email_subject", options),
  });
}
