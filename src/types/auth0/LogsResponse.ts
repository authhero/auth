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

  SUCCESS_EXCHANGE_AUTHORIZATION_CODE_FOR_ACCESS_TOKEN = "seacft",
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
  "seacft", // SUCCESS_EXCHANGE_AUTHORIZATION_CODE_FOR_ACCESS_TOKEN
]);

export type LogType = z.infer<typeof LogType>;

export const Auth0Client = z.object({
  name: z.string(),
  version: z.string(),
  env: z
    .object({
      node: z.string().optional(),
    })
    .optional(),
});

export const logSchema = z.object({
  type: LogType,
  date: z.string(),
  description: z.string().optional(),
  log_id: z.string().optional(),
  _id: z.string().optional(),
  ip: z.string(),
  user_agent: z.string(),
  details: z.any().optional(), // Using z.any() as a placeholder for "details" type
  isMobile: z.boolean(),
  user_id: z.string().optional(),
  user_name: z.string().optional(),
  connection: z.string().optional(),
  connection_id: z.string().optional(),
  client_id: z.string().optional(),
  client_name: z.string().optional(),
  audience: z.string().optional(),
  scope: z.array(z.string()).optional(),
  strategy: z.string().optional(),
  strategy_type: z.string().optional(),
  hostname: z.string().optional(),
  auth0_client: Auth0Client.optional(),
});

export type Log = z.infer<typeof logSchema>;

export type LogsResponse = Log & {
  log_id: string;
  _id: string;
};
