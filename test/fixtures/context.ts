import { Context } from "cloudworker-router";
// This is to make Request and other browser stuff work
import "isomorphic-fetch";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
  Client,
  Env,
} from "../../src/types";
import { oAuth2ClientFactory } from "./oauth2Client";
import { mockedR2Bucket } from "./mocked-r2-bucket";
import { kvStorageFixture } from "./kv-storage";
import { EmailOptions } from "../../src/services/email/EmailOptions";
import { InvalidCodeError, UnauthenticatedError } from "../../src/errors";
import { userRouter } from "../../src/models/User";

const caller = userRouter.createCaller({
  req: new Request("http://localhost:8787"),
  resHeaders: new Headers(),
  env: {} as Env,
  state: {} as DurableObjectState,
});

type ValidateAuthenticationCodeParams = Parameters<
  typeof caller.validateAuthenticationCode
>[0];

export interface ContextFixtureParams {
  stateData?: { [key: string]: string };
  clients?: KVNamespace;
  userData?: { [key: string]: string | boolean };
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
      modified_at: "modified_at",
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
      modified_at: "modified_at",
    },
  ],
  domains: [],
};

export function contextFixture(params?: ContextFixtureParams): Context<Env> {
  const { stateData = {}, userData = {}, logs = [], clients } = params || {};

  return {
    headers: new URLSearchParams(),
    env: {
      AUTH_TEMPLATES: mockedR2Bucket(),
      ISSUER: "https://auth.example.com/",
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
          validateAuthenticationCode: {
            mutate: async (input: ValidateAuthenticationCodeParams) => {
              const { code, email, tenantId } = input;
              if (code === "000000") {
                throw new InvalidCodeError();
              }

              caller.validateAuthenticationCode;

              return {
                client_id: "clientId",
                email: "test@example.com",
              };
            },
          },
        }),
      },
      STATE: {
        newUniqueId: () => "newUniqueId",
      },
      CERTIFICATES: kvStorageFixture({
        default: certificate,
      }),
      CLIENTS:
        clients ||
        kvStorageFixture({
          clientId: JSON.stringify(client),
        }),
      IMAGE_PROXY_URL: "https://imgproxy.dev.sesamy.cloud",
    },
  } as unknown as Context<Env>;
}

const certificate = JSON.stringify([
  {
    privateKey:
      "-----BEGIN s45bQJ933dwqmrB92ee-l-----\r\n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\r\nZGmvO8nFDd8aA1glVFSFUNcpd2uD\r\n-----END s45bQJ933dwqmrB92ee-l-----\r\n",
    publicKey: {
      alg: "RS256",
      e: "AQAB",
      kty: "RSA",
      n: "voTRJhX6-iV19z6Dy0Ewav4N-MKsv0DDg_j20ojC06rL1Wbnd4y_4aAsPXE37iCXEKhdo54ZEudYyD0MCnyaqFnbtOx_KmC1wnctqyejs4QbwLLAB2wGiiMJw7-e3V7lQONLKcDETlwy-GVFaZQOpI8n4Gr5CdrLcmpVzHFisaOq4kYZL11g6S9PS-W2RIlpIgoY6OIfp7d_kwehlOYy7YUnbgftgt-tO3-KSEb_KT0eA1PicmJH_7KpFbebPL1dv9bujan31gu0tKkuPpPdpmTbUeLLJ6r43b2UFJ2aZbAKRHtai9bmdkwKXbzuM_gByo0xpH8Hy5FfhWdFAoF2b8Mp3ZXeNzak6-kBoXzemzkz1CqVLA2LubP4BQ4AkjEAXDtQcl_1VVcS88c7r377dF3Y_hCTbXeg7LQ6e-KUlMX7azztHb84CSDmFj4a-Kj_zDe35dhQoEi2oThKHvfFETO9UYgNbu4GkmU1xUu_a0gBbt1rn74KeCC5I85ERX0x_VqfyNV37rPROgUoM_b6MP9swBCY4IC-L5SBpkU0EAuIcc2Sk6hKMa4T2umfX1eJK6n06OKqv6QzjlUNSw1tjA0FvbPoDAss-_71Xkse4_KWUyhInZQfhfHTQs-qrwedmIdO9Tb2EGqbofe0GA_YpBv0ShEzKnnxOHC99ZFijt8",
      use: "sig",
    },
    kid: "s45bQJ933dwqmrB92ee-l",
    created_at: 1672953186457,
  },
]);
