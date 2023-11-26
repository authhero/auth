// This is to make Request and other browser stuff work
import "isomorphic-fetch";
import { Context } from "hono";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
  Client,
  Env,
  PasswordParams,
  SqlUser,
  User,
} from "../../src/types";
import { oAuth2ClientFactory } from "./oauth2Client";
import { mockedR2Bucket } from "./mocked-r2-bucket";
import { kvStorageFixture } from "./kv-storage";
import { EmailOptions } from "../../src/services/email/EmailOptions";
import { UnauthenticatedError } from "../../src/errors";
import { Var } from "../../src/types/Var";
import createAdapters from "../../src/adapters/in-memory";
import { getCertificate } from "../../integration-test/helpers/token";
import { sendLink, sendCode } from "../../src/controllers/email";
import { Ticket } from "../../src/types/Ticket";
import { OTP } from "../../src/types/OTP";
import { Session } from "../../src/types/Session";
export interface ContextFixtureParams {
  headers?: { [key: string]: string };
  stateData?: { [key: string]: string };
  tickets?: Ticket[];
  sessions?: Session[];
  otps?: OTP[];
  passwords?: PasswordParams[];
  users?: User[];
  clients?: KVNamespace;
  userData?: { [key: string]: string | boolean };
  email?: {
    sendLink?: typeof sendLink;
    sendCode?: typeof sendCode;
  };
  logs?: any[];
}

interface stateInput {
  state: string;
  ttl?: number;
}

export const client: Client = {
  id: "id",
  name: "clientName",
  client_secret: "clientSecret",
  tenant_id: "tenantId",
  allowed_callback_urls: ["http://localhost:3000", "https://example.com"],
  allowed_logout_urls: ["http://localhost:3000", "https://example.com"],
  allowed_web_origins: ["http://localhost:3000", "https://example.com"],
  email_validation: "enabled",
  tenant: {
    sender_email: "senderEmail",
    sender_name: "senderName",
    audience: "audience",
  },
  connections: [
    {
      id: "connectionId1",
      name: "google-oauth2",
      client_id: "googleClientId",
      client_secret: "googleClientSecret",
      authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      token_endpoint: "https://oauth2.googleapis.com/token",
      response_mode: AuthorizationResponseMode.QUERY,
      response_type: AuthorizationResponseType.CODE,
      scope: "openid profile email",
      created_at: "created_at",
      updated_at: "updated_at",
    },
    {
      id: "connectionId2",
      name: "facebook",
      client_id: "facebookClientId",
      client_secret: "facebookClientSecret",
      authorization_endpoint: "https://graph.facebook.com/oauth/access_token",
      token_endpoint: "https://www.facebook.com/dialog/oauth",
      response_mode: AuthorizationResponseMode.QUERY,
      response_type: AuthorizationResponseType.CODE,
      scope: "email public_profile",
      created_at: "created_at",
      updated_at: "updated_at",
    },
  ],
  domains: [],
};

export function contextFixture(
  params?: ContextFixtureParams,
): Context<{ Bindings: Env; Variables: Var }> {
  const {
    stateData = {},
    userData = {},
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

  // Add a known certificate
  data.certificates.upsertCertificates([getCertificate()]);
  // A test client
  if (!data.clients.create) {
    throw new Error("Missing create method on clients adapter");
  }
  data.clients.create({
    id: "clientId",
    name: "Test Client",
    connections: [
      {
        id: "connectionId1",
        name: "google-oauth2",
        client_id: "googleClientId",
        client_secret: "googleClientSecret",
        authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        token_endpoint: "https://oauth2.googleapis.com/token",
        response_mode: AuthorizationResponseMode.QUERY,
        response_type: AuthorizationResponseType.CODE,
        scope: "openid profile email",
        created_at: "created_at",
        updated_at: "updated_at",
      },
    ],
    domains: [],
    tenant_id: "tenantId",
    allowed_callback_urls: [
      "https://login.example.com/sv/callback",
      "https://example.com",
    ],
    allowed_logout_urls: [],
    allowed_web_origins: [],
    email_validation: "enforced",
    client_secret: "XjI8-WPndjtNHDu4ybXrD",
    tenant: {
      audience: "https://example.com",
      sender_email: "login@example.com",
      sender_name: "SenderName",
    },
  });

  return {
    set: () => {},
    req: {
      header: (key) => headers[key],
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
      stateFactory: {
        getInstanceById: (id: string) => ({
          getState: {
            query: async () => {
              return stateData[id];
            },
          },
          createState: {
            mutate: async (value: stateInput) => {
              stateData[id] = value.state;
            },
          },
        }),
      },
      userFactory: {
        getInstanceByName: () => ({
          getProfile: {
            query: async () => {
              const userProfile = {
                email: "foo@bar.com",
              };

              return userProfile;
            },
          },
          createAuthenticationCode: {
            mutate: async () => ({ code: "123456" }),
          },
          validatePassword: {
            mutate: async () => {
              if (userData.validatePassword === "UnauthenticatedError") {
                throw new UnauthenticatedError();
              }

              return true;
            },
          },
        }),
      },
      STATE: {
        newUniqueId: () => "newUniqueId",
      },
      CLIENTS:
        clients ||
        kvStorageFixture({
          clientId: JSON.stringify(client),
        }),
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
