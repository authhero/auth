import { Context } from "hono";
import { Env } from "../types/Env";
import { Var } from "../types/Var";
import packageJson from "../../package.json";

function instanceToJson(instance: any): any {
  return [...instance].reduce((obj, item) => {
    const prop: any = {};
    // eslint-disable-next-line prefer-destructuring
    prop[item[0]] = item[1];
    return { ...obj, ...prop };
  }, {});
}

async function log(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  response: Response,
  message?: string,
) {
  const ddApiKey = ctx.env.DD_API_KEY;

  if (!ddApiKey?.length) {
    return;
  }

  // Get our key from secrets
  const dd_logsEndpoint = "https://http-intake.logs.datadoghq.eu/api/v2/logs";

  const { req } = ctx;
  const hostname = req.header("host") || "";
  const headers = instanceToJson(ctx.req.raw.headers);

  if (headers.cookie) {
    headers.cookie = "REDACTED";
  }

  if (headers.authorization) {
    headers.authorization = "REDACTED";
  }

  const body = ctx.req.header("content-type")?.startsWith("application/json")
    ? await ctx.req.json()
    : {};

  // data to log
  const data = {
    ddsource: "cloudflare",
    ddtags: "service:auth2, source:cloudflare, site:" + hostname,
    hostname: hostname,
    level: "info",
    message: message || `${req.method} ${req.url}`,
    date_access: Date.now(),
    http: {
      protocol: req.header("X-Forwarded-Proto") || "",
      host: req.header("host") || "",
      path: req.path,
      query: req.queries(),
      headers,
      method: req.method,
      url_details: req.url,
      referer: req.header("referer") || "",
      body,
      status_code: response.status,
      response_headers: instanceToJson(response.headers),
    },
    useragent_details: {
      ua: req.header("user-agent") || "",
    },
    network: {
      cc: req.header("Cf-Ipcountry") || "",
    },
    cloudflare: {
      ray: req.header("cf-ray") || "",
      visitor: req.header("cf-visitor") || "",
    },
    app: ctx.var,
    version: packageJson.version,
  };

  const logResponse = await fetch(dd_logsEndpoint, {
    method: "POST",
    body: JSON.stringify(data),
    headers: new Headers({
      "Content-Type": "application/json",
      "DD-API-KEY": ddApiKey,
    }),
  });

  if (!logResponse.ok) {
    console.log("Repsonse status: " + logResponse.status);
    console.log("Repsonse message: " + (await logResponse.text()));
  }
}

async function err(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  err: Error,
  message?: string,
) {
  const ddApiKey = ctx.env.DD_API_KEY;

  if (!ddApiKey?.length) {
    console.log("No datadog api key available");
    return;
  }

  const { req } = ctx;

  const headers = instanceToJson(ctx.req.raw.headers);

  if (headers.cookie) {
    headers.cookie = "REDACTED";
  }

  if (headers.authorization) {
    headers.authorization = "REDACTED";
  }

  const body = ctx.req.header("content-type")?.startsWith("application/json")
    ? await ctx.req.json()
    : {};

  // Get our key from secrets
  const dd_logsEndpoint = "https://http-intake.logs.datadoghq.eu/api/v2/logs";

  const hostname = req.header("host") || "";

  const data = {
    ddsource: "cloudflare",
    ddtags: "service:token-service, source:cloudflare, site:" + hostname,
    hostname: hostname,
    level: "error",
    message:
      message ||
      "Error processing call to route " +
        req.method +
        " " +
        req.url +
        ":" +
        err.message,
    date_access: Date.now(),
    http: {
      protocol: req.header("X-Forwarded-Proto") || "",
      host: req.header("host") || "",
      path: req.path,
      query: req.queries(),
      headers,
      status_code: ctx.res.status,
      status_text: ctx.res.statusText,
      method: req.method,
      url_details: req.url,
      referer: req.header("referer") || "",
      body,
    },
    useragent_details: {
      ua: req.header("user-agent") || "",
    },
    network: {
      cc: req.header("Cf-Ipcountry") || "",
    },
    cloudflare: {
      ray: req.header("cf-ray") || "",
      visitor: req.header("cf-visitor") || "",
    },
    error: {
      message: err.message,
      stack: err.stack,
      // body: await ctx.res.text(),
    },
  };

  const logResponse = await fetch(dd_logsEndpoint, {
    method: "POST",
    body: JSON.stringify(data),
    headers: new Headers({
      "Content-Type": "application/json",
      "DD-API-KEY": ddApiKey,
    }),
  });

  if (!logResponse.ok) {
    console.log("Repsonse status: " + logResponse.status);
    console.log("Repsonse message: " + (await logResponse.text()));
  }
}

export default {
  log,
  err,
};
