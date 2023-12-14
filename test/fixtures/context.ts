// This is to make Request and other browser stuff work
import "isomorphic-fetch";
import { Context } from "hono";
import {
  Application,
  Env,
  PasswordParams,
  Tenant,
  User,
  SqlConnection,
  SqlDomain,
} from "../../src/types";
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
import {
  APPLICATION_FIXTURE,
  TENANT_FIXTURE,
  CONNECTIONS_FIXTURE,
  DOMAINS_FIXTURE,
} from "./client";

export interface ContextFixtureParams {
  headers?: { [key: string]: string };
  stateData?: { [key: string]: string };
  tickets?: Ticket[];
  sessions?: Session[];
  otps?: OTP[];
  passwords?: PasswordParams[];
  users?: User[];
  userData?: { [key: string]: string | boolean };
  email?: {
    sendLink?: typeof sendLink;
    sendCode?: typeof sendCode;
  };
  logs?: any[];
  applications?: Application[];
  tenants?: Tenant[];
  connections?: SqlConnection[];
  domains?: SqlDomain[];
}

export function contextFixture(
  params?: ContextFixtureParams,
): Context<{ Bindings: Env; Variables: Var }> {
  const {
    headers = {},
    logs = [],
    tickets,
    sessions,
    users,
    otps,
    passwords,
    email,
    connections,
    applications,
    tenants,
    domains,
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

  // seed default settings------------------
  data.tenants.create({
    id: "DEFAULT_SETTINGS",
    name: "Default Settings",
    sender_email: "foo@sesamy.com",
    sender_name: "Sesamy",
    audience: "https://sesamy.com",
  });
  data.applications.create("DEFAULT_SETTINGS", {
    id: "DEFAULT_CLIENT",
    name: "Default Client",
    allowed_web_origins: "https://sesamy.com",
    allowed_callback_urls: "https://sesamy.com",
    allowed_logout_urls: "https://sesamy.com",
    email_validation: "enabled",
    client_secret: "secret",
  });
  //----------------------------------------

  const seedingClient = !!applications || !!tenants || !!connections;

  if (!seedingClient) {
    data.tenants.create(TENANT_FIXTURE);
    data.applications.create(TENANT_FIXTURE.id, APPLICATION_FIXTURE);
    data.connections.create(TENANT_FIXTURE.id, CONNECTIONS_FIXTURE[0]);
    data.connections.create(TENANT_FIXTURE.id, CONNECTIONS_FIXTURE[1]);
    data.domains.create(TENANT_FIXTURE.id, DOMAINS_FIXTURE[0]);
  } else {
    if (applications) {
      applications.forEach((application) => {
        data.applications.create(application.tenant_id, application);
      });
    }

    if (tenants) {
      tenants.forEach((tenant) => {
        data.tenants.create(tenant);
      });
    }

    if (connections) {
      connections.forEach((connection) => {
        data.connections.create(connection.tenant_id, connection);
      });
    }
    if (domains) {
      domains.forEach((domain) => {
        data.domains.create(domain.tenant_id, domain);
      });
    }
  }

  // Add a known certificate
  data.certificates.upsertCertificates([getCertificate()]);

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
