// This is to make Request and other browser stuff work
import "isomorphic-fetch";
import { Context } from "hono";
import { Env, PartialClient, PasswordParams, User } from "../../src/types";
import { oAuth2ClientFactory } from "./oauth2Client";
import { mockedR2Bucket } from "./mocked-r2-bucket";
import { EmailOptions } from "../../src/services/email/EmailOptions";
import { Var } from "../../src/types/Var";
import createAdapters from "../../src/adapters/in-memory";
import { getCertificate } from "../../integration-test/helpers/token";
import { sendLink, sendCode } from "../../src/controllers/email";
import { Ticket } from "../../src/types/Ticket";
import { OTP } from "../../src/types/OTP";
import { Session } from "../../src/types/Session";
import { client } from "./client";

export interface ContextFixtureParams {
  headers?: { [key: string]: string };
  stateData?: { [key: string]: string };
  tickets?: Ticket[];
  sessions?: Session[];
  otps?: OTP[];
  passwords?: PasswordParams[];
  users?: User[];
  clients?: PartialClient[];
  userData?: { [key: string]: string | boolean };
  email?: {
    sendLink?: typeof sendLink;
    sendCode?: typeof sendCode;
  };
  logs?: any[];
}

export function contextFixture(
  params?: ContextFixtureParams,
): Context<{ Bindings: Env; Variables: Var }> {
  const {
    headers = {},
    logs = [],
    clients,
    tickets,
    sessions,
    users,
    otps,
    passwords,
    email,
  } = params || {};

  const data = createAdapters();

  if (tickets) {
    tickets.forEach((ticket) => {
      data.tickets.create(ticket);
    });
  }

  if (otps) {
    otps.forEach((otp) => {
      data.OTP.create(otp);
    });
  }

  if (sessions) {
    sessions.forEach((session) => {
      data.sessions.create(session);
    });
  }

  if (users) {
    users.forEach((user) => {
      data.users.create(user.tenant_id, user);
    });
  }

  if (passwords) {
    passwords.forEach((password) => {
      data.passwords.create("tenantId", password);
    });
  }

  if (clients) {
    clients.forEach((client) => {
      data.clients.create!(client);
    });
  } else {
    data.clients.create!(client);
  }

  // Add a known certificate
  data.certificates.upsertCertificates([getCertificate()]);
  // A test client
  if (!data.clients.create) {
    throw new Error("Missing create method on clients adapter");
  }

  return {
    set: () => {},
    req: {
      header: (key: string) => headers[key],
    },
    env: {
      AUTH_TEMPLATES: mockedR2Bucket(),
      ISSUER: "https://auth.example.com/",
      LOGIN2_URL: "https://login2.sesamy.dev",
      oauth2ClientFactory: {
        create: oAuth2ClientFactory,
      },
      sendEmail: async (emailOptions: EmailOptions) => {
        logs.push(emailOptions);
      },
      IMAGE_PROXY_URL: "https://imgproxy.dev.sesamy.cloud",
      data: {
        ...data,
        email,
        logs: {
          create: () => {},
        },
      },
    },
  } as unknown as Context<{ Bindings: Env; Variables: Var }>;
}
