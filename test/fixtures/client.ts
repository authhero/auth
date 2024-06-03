import { Connection } from "../../src/types/Connection";
import { Domain } from "../../src/types/Domain";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
  Application,
  Tenant,
} from "../../src/types";

export const APPLICATION_FIXTURE: Application = {
  id: "clientId",
  name: "clientName",
  allowed_callback_urls: "http://localhost:3000, https://example.com",
  allowed_logout_urls: "http://localhost:3000, https://example.com",
  allowed_web_origins: "http://localhost:3000, https://example.com",
  email_validation: "enabled",
  client_secret: "clientSecret",
  created_at: "created_at",
  updated_at: "updated_at",
  disable_sign_ups: false,
};

export const TENANT_FIXTURE: Tenant = {
  id: "tenantId",
  name: "tenantName",
  audience: "audience",
  sender_email: "senderEmail",
  sender_name: "senderName",
  created_at: "created_at",
  updated_at: "updated_at",
};

export const CONNECTIONS_FIXTURE: Connection[] = [
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
];

export const DOMAINS_FIXTURE: Domain[] = [
  {
    id: "domainId",
    domain: "example2.com",
    email_api_key: "",
    email_service: "mailgun",
    created_at: "created_at",
    updated_at: "updated_at",
    dkim_private_key: "dkimPrivateKey",
    dkim_public_key: "",
  },
];
