import { Context, ContextWithBody } from "cloudworker-router";
import { Env } from "../types/Env";

function instanceToJson(instance: any): any {
  return [...instance].reduce((obj, item) => {
    const prop: any = {};
    // eslint-disable-next-line prefer-destructuring
    prop[item[0]] = item[1];
    return { ...obj, ...prop };
  }, {});
}

async function log(
  ctx: ContextWithBody<Env>,
  response: Response,
  message?: string
) {
  const ddApiKey = ctx.env.DD_API_KEY;

  if (!ddApiKey.length) {
    console.log("No datadog api key available");
    return;
  }

  // Get our key from secrets
  const dd_logsEndpoint = "https://http-intake.logs.datadoghq.eu/api/v2/logs";

  const { request } = ctx;
  const hostname = request.headers.get("host") || "";
  const headers = instanceToJson(ctx.headers);

  if (headers.cookie) {
    headers.cookie = "REDACTED";
  }

  if (headers.authorization) {
    headers.authorization = "REDACTED";
  }

  // data to log
  const data = {
    ddsource: "cloudflare",
    ddtags: "service:auth2, source:cloudflare, site:" + hostname,
    hostname: hostname,
    level: "info",
    message: message || `${request.method} ${request.url}`,
    date_access: Date.now(),
    http: {
      protocol: request.headers.get("X-Forwarded-Proto") || "",
      host: request.headers.get("host") || "",
      headers,
      status_code: response.status,
      method: request.method,
      url_details: request.url,
      referer: request.headers.get("referer") || "",
      body: ctx.body,
    },
    useragent_details: {
      ua: request.headers.get("user-agent") || "",
    },
    network: {
      cc: request.headers.get("Cf-Ipcountry") || "",
    },
    cloudflare: {
      ray: request.headers.get("cf-ray") || "",
      visitor: request.headers.get("cf-visitor") || "",
    },
    app: {
      user: ctx.state.user,
      vendorId: ctx.state.vendorId,
    },
    version: ctx.state.version,
    state: ctx.state,
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

async function err(ctx: Context<Env>, err: Error, message?: string) {
  const ddApiKey = ctx.env.DD_API_KEY;

  if (!ddApiKey.length) {
    console.log("No datadog api key available");
    return;
  }

  const { request } = ctx;

  // Get our key from secrets
  const dd_logsEndpoint = "https://http-intake.logs.datadoghq.eu/api/v2/logs";

  const hostname = request.headers.get("host") || "";

  const data = {
    ddsource: "cloudflare",
    ddtags: "service:token-service, source:cloudflare, site:" + hostname,
    hostname: hostname,
    level: "error",
    message:
      message ||
      "Error processing call to route " +
        request.method +
        " " +
        request.url +
        ":" +
        err.message,
    date_access: Date.now(),
    http: {
      protocol: request.headers.get("X-Forwarded-Proto") || "",
      host: request.headers.get("host") || "",
      status_code: 500,
      message: err.message,
      method: request.method,
      url_details: request.url,
      referer: request.headers.get("referer") || "",
    },
    useragent_details: {
      ua: request.headers.get("user-agent") || "",
    },
    network: {
      cc: request.headers.get("Cf-Ipcountry") || "",
    },
    cloudflare: {
      ray: request.headers.get("cf-ray") || "",
      visitor: request.headers.get("cf-visitor") || "",
    },
    error: {
      message: err.message,
      stack: err.stack,
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
