import { z } from "zod";

export enum LogTypes {
  SUCCESS_API_OPERATION = "sapi",
  //
  SUCCESS_SILENT_AUTH = "ssa",
  FAILED_SILENT_AUTH = "fsa",
  //
  SUCCESS_SIGNUP = "ss",
  // we don't have this in the logs yet
  // FAILED_SIGNUP = "fs",
  //
  SUCCESS_LOGIN = "s",
  FAILED_LOGIN = "f",
  FAILED_LOGIN_INCORRECT_PASSWORD = "fp",
  // we don't have this in the logs yet
  // FAILED_LOGIN_INVALID_EMAIL_USERNAME = "fu",
  //
  SUCCESS_LOGOUT = "slo",
  //
  SUCCESS_CROSS_ORIGIN_AUTHENTICATION = "scoa",
  FAILED_CROSS_ORIGIN_AUTHENTICATION = "fcoa",
  // TODO - not implemented - just for completion as we do get this in our latest auth0 logs
  NOT_IMPLEMENTED_1 = "seccft",
  NOT_IMPLEMENTED_2 = "cls",
}

// Enum for LogTypes
const LogType = z.enum([
  "sapi", // SUCCESS_API_OPERATION
  // "ssa", SUCCESS_SILENT_AUTH - omitted for brevity and since it's clear from context
  "fsa", // FAILED_SILENT_AUTH
  "ss", // SUCCESS_SIGNUP
  "ssa", /// SUCCESS_SILENT_AUTH
  // FAILED_SIGNUP = "fs", - we don't have this in the logs yet
  "s", // SUCCESS_LOGIN
  "f", // FAILED_LOGIN
  "fp", // FAILED_LOGIN_INCORRECT_PASSWORD
  // FAILED_LOGIN_INVALID_EMAIL_USERNAME = "fu", - we don't have this in the logs yet
  "slo", // SUCCESS_LOGOUT
  "scoa", // SUCCESS_CROSS_ORIGIN_AUTHENTICATION
  "fcoa", // FAILED_CROSS_ORIGIN_AUTHENTICATION
  "seccft", // NOT_IMPLEMENTED_1 - not implemented - just for completion as we do get this in our latest auth0 logs
  "cls", // NOT_IMPLEMENTED_2
]);

export type LogType = z.infer<typeof LogType>;

const auth0ClientSchema = z.object({
  name: z.string(),
  version: z.string(),
  env: z
    .object({
      node: z.string().optional(),
    })
    .optional(),
});
export type Auth0Client = z.infer<typeof auth0ClientSchema>;

const logCommonFieldsSchema = z.object({
  type: LogType,
  date: z.string(),
  description: z.string().optional(),
  log_id: z.string().optional(),
  _id: z.string().optional(),
  ip: z.string(),
  user_agent: z.string(),
  details: z.any().optional(), // Using z.any() as a placeholder for "details" type
  isMobile: z.boolean(),
});
export type LogCommonFields = z.infer<typeof logCommonFieldsSchema>;

const browserLogCommonFieldSchema = logCommonFieldsSchema.extend({
  user_id: z.string(),
  user_name: z.string(),
  // do not have this field yet in SQL
  connection: z.string().optional(),
  connection_id: z.string(),
  client_id: z.string().optional(),
  client_name: z.string(),
});

const successfulExchangeOfAccessTokenForAClientCredentialsGrantSchema =
  browserLogCommonFieldSchema.extend({
    type: z.literal("seccft"),
    audience: z.string().optional(),
    scope: z.union([z.array(z.string()), z.string()]).optional(), // notice how this can be both in auth0! interesting
    strategy: z.string().optional(),
    strategy_type: z.string().optional(),
    hostname: z.string(),
    auth0_client: auth0ClientSchema,
  });
export type SuccessfulExchangeOfAccessTokenForAClientCredentialsGrant = z.infer<
  typeof successfulExchangeOfAccessTokenForAClientCredentialsGrantSchema
>;

const successCrossOriginAuthenticationSchema =
  browserLogCommonFieldSchema.extend({
    type: z.literal("scoa"),
    hostname: z.string(),
    auth0_client: auth0ClientSchema,
  });
export type SuccessCrossOriginAuthentication = z.infer<
  typeof successCrossOriginAuthenticationSchema
>;

const failedCrossOriginAuthenticationSchema = logCommonFieldsSchema.extend({
  type: z.literal("fcoa"),
  hostname: z.string(),
  connection_id: z.string(),
  auth0_client: auth0ClientSchema,
});
export type FailedCrossOriginAuthentication = z.infer<
  typeof failedCrossOriginAuthenticationSchema
>;

const successApiOperationSchema = logCommonFieldsSchema.extend({
  type: z.literal("sapi"),
  client_id: z.string().optional(),
  client_name: z.string(),
});
export type SuccessApiOperation = z.infer<typeof successApiOperationSchema>;

const failedLoginSchema = logCommonFieldsSchema.extend({
  type: z.literal("f"),
});
export type FailedLogin = z.infer<typeof failedLoginSchema>;

const failedLoginIncorrectPasswordSchema = browserLogCommonFieldSchema.extend({
  type: z.literal("fp"),
  strategy: z.string(),
  strategy_type: z.string(),
});
export type FailedLoginIncorrectPassword = z.infer<
  typeof failedLoginIncorrectPasswordSchema
>;

const codeLinkSentSchema = browserLogCommonFieldSchema.extend({
  type: z.literal("cls"),
  strategy: z.string(),
  strategy_type: z.string(),
});
export type CodeLinkSent = z.infer<typeof codeLinkSentSchema>;

const failedSilentAuthSchema = logCommonFieldsSchema.extend({
  type: z.literal("fsa"),
  hostname: z.string(),
  audience: z.string(),
  scope: z.array(z.string()),
  client_id: z.string().optional(),
  client_name: z.string(),
  auth0_client: auth0ClientSchema,
});
export type FailedSilentAuth = z.infer<typeof failedSilentAuthSchema>;

const successLogoutSchema = browserLogCommonFieldSchema.extend({
  type: z.literal("slo"),
  hostname: z.string(),
});
export type SuccessLogout = z.infer<typeof successLogoutSchema>;

const successLoginSchema = browserLogCommonFieldSchema.extend({
  type: z.literal("s"),
  strategy: z.string(),
  strategy_type: z.string(),
  hostname: z.string(),
});
export type SuccessLogin = z.infer<typeof successLoginSchema>;

const successSilentAuthSchema = logCommonFieldsSchema.extend({
  type: z.literal("ssa"),
  hostname: z.string(),
  client_id: z.string().optional(),
  client_name: z.string(),
  session_connection: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  auth0_client: auth0ClientSchema,
});
export type SuccessSilentAuth = z.infer<typeof successSilentAuthSchema>;

const successSignupSchema = browserLogCommonFieldSchema.extend({
  type: z.literal("ss"),
  hostname: z.string(),
  strategy: z.string(),
  strategy_type: z.string(),
});
export type SuccessSignup = z.infer<typeof successSignupSchema>;

export const logSchema = z.union([
  successfulExchangeOfAccessTokenForAClientCredentialsGrantSchema,
  successCrossOriginAuthenticationSchema,
  successApiOperationSchema,
  failedLoginIncorrectPasswordSchema,
  failedCrossOriginAuthenticationSchema,
  codeLinkSentSchema,
  failedSilentAuthSchema,
  successLogoutSchema,
  successLoginSchema,
  successSilentAuthSchema,
  successSignupSchema,
  failedLoginSchema,
]);

export type Log = z.infer<typeof logSchema>;

export type LogsResponse = Log & {
  log_id: string;
  _id: string;
};
