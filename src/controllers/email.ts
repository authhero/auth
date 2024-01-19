import { Liquid } from "liquidjs";
import { translate } from "../utils/i18n";
import { Client, Env } from "../types";
import sendEmail from "../services/email";
import { getClientLogoPngGreyBg } from "../utils/clientLogos";
import en from "../locales/en/default.json";
import sv from "../locales/sv/default.json";
import nb from "../locales/nb/default.json";
import it from "../locales/it/default.json";

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

// exportasync function sendEmailValidation(
//   env: Env,
//   client: Client,
//   to: string,
//   code: string,
// ) {
//   if (client.email_validation === "disabled") {
//     return;
//   }

//   const response = await env.AUTH_TEMPLATES.get(
//     "templates/email/verify-email.liquid",
//   );
//   if (!response) {
//     throw new Error("Verify email template not found");
//   }

//   const templateString = await response.text();

//   const language = client.tenant.language || "sv";

//   const logo = getClientLogoPngGreyBg(
//     client.tenant.logo ||
//       "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
//     env.IMAGE_PROXY_URL,
//   );

//   // TODO - implement i18n
//   const sendCodeTemplate = engine.parse(templateString);
//   const codeEmailBody = await engine.render(sendCodeTemplate, {
//     code,
//     vendorName: client.name,
//     logo,
//   });

//   await sendEmail(client, {
//     to: [{ email: to, name: to }],
//     from: {
//       email: client.tenant.sender_email,
//       name: client.tenant.sender_name,
//     },
//     content: [
//       {
//         type: "text/html",
//         value: codeEmailBody,
//       },
//     ],
//     subject: translate(language, "codeEmailTitle")
//       .replace("{{vendorName}}", client.name)
//       .replace("{{code}}", code),
//   });
// }

export async function sendCode(
  env: Env,
  client: Client,
  to: string,
  code: string,
) {
  const response = await env.AUTH_TEMPLATES.get(
    "templates/email/code-v2.liquid",
  );
  if (!response) {
    throw new Error("Code template not found");
  }

  const templateString = await response.text();

  const language = client.tenant.language || "sv";
  const locale = getLocale(language);

  const logo = getClientLogoPngGreyBg(
    client.tenant.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
    env.IMAGE_PROXY_URL,
  );

  const sendCodeUniversalTemplate = engine.parse(templateString);
  const sendCodeTemplateString = await engine.render(
    sendCodeUniversalTemplate,
    {
      ...locale,
      code,
      vendorName: client.name,
      logo,
      supportUrl: client.tenant.support_url || "https://support.sesamy.com",
      buttonColor: client.tenant.primary_color || "#7d68f4",
    },
  );
  const sendCodeTemplate = engine.parse(sendCodeTemplateString);
  const codeEmailBody = await engine.render(sendCodeTemplate, {
    code,
    vendorName: client.name,
    logo,
    supportUrl: client.tenant.support_url || "https://support.sesamy.com",
    buttonColor: client.tenant.primary_color || "#7d68f4",
  });

  await sendEmail(client, {
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
      .replace("{{vendorName}}", client.name)
      .replace("{{code}}", code),
  });
}

export async function sendLink(
  env: Env,
  client: Client,
  to: string,
  code: string,
  magicLink: string,
) {
  const response = await env.AUTH_TEMPLATES.get(
    "templates/email/link-v2.liquid",
  );
  if (!response) {
    throw new Error("Code template not found");
  }

  const templateString = await response.text();

  const language = client.tenant.language || "sv";
  const locale = getLocale(language);

  const logo = getClientLogoPngGreyBg(
    client.tenant.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
    env.IMAGE_PROXY_URL,
  );

  const sendCodeUniversalTemplate = engine.parse(templateString);
  const sendCodeTemplateString = await engine.render(
    sendCodeUniversalTemplate,
    {
      ...locale,
      // pass in variables twice! no harm to overdo it
      code,
      vendorName: client.name,
      logo,
      supportUrl: client.tenant.support_url || "https://support.sesamy.com",
      magicLink,
      buttonColor: client.tenant.primary_color || "#7d68f4",
    },
  );
  const sendCodeTemplate = engine.parse(sendCodeTemplateString);
  const codeEmailBody = await engine.render(sendCodeTemplate, {
    code,
    vendorName: client.name,
    logo,
    supportUrl: client.tenant.support_url || "https://support.sesamy.com",
    magicLink,
    buttonColor: client.tenant.primary_color || "#7d68f4",
  });

  await sendEmail(client, {
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
  const response = await env.AUTH_TEMPLATES.get(
    "templates/email/password-reset.liquid",
  );

  if (!response) {
    throw new Error("Code template not found");
  }

  const templateString = await response.text();

  const language = client.tenant.language || "sv";

  const logo = getClientLogoPngGreyBg(
    client.tenant.logo ||
      "https://assets.sesamy.com/static/images/sesamy/logo-translucent.png",
    env.IMAGE_PROXY_URL,
  );

  // TODO - implement i18n
  const sendCodeTemplate = engine.parse(templateString);
  const codeEmailBody = await engine.render(sendCodeTemplate, {
    passwordResetUrl: `${env.ISSUER}u/reset-password?code=${code}&state=${state}`,
    vendorName: client.name,
    logo,
    primaryColor: client.tenant.primary_color || "#007bff",
  });

  await sendEmail(client, {
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
    subject: translate(language, "passwordResetTitle").replace(
      "{{vendorName}}",
      client.name,
    ),
  });
}
