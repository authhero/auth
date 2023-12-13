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
// name all these SCREAMING_SNAKE
import {
  application,
  tenant,
  connections as connectionsFixture,
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

  const seedingClient = !!applications || !!tenants || !!connections;

  if (!seedingClient) {
    // TODO - we need to also accept these as fixtures...
    // and then not populate them I think
    data.tenants.create(tenant);
    data.applications.create(tenant.id, application);
    data.connections.create(tenant.id, connectionsFixture[0]);
    data.connections.create(tenant.id, connectionsFixture[1]);
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
