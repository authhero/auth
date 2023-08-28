import { Router, bodyparser, Context } from "cloudworker-router";

import { Env } from "./types/Env";
import { RegisterRoutes } from "../build/routes";
import swagger from "../build/swagger.json";
import packageJson from "../package.json";
import swaggerUi from "./routes/swagger-ui";
import rotateKeys from "./routes/rotate-keys";
import { serve } from "./routes/login";
import { migrateDown, migrateToLatest } from "./migrate";
import errorHandler from "./middlewares/errorHandler";
import corsMiddleware from "./middlewares/cors";
import { getDb } from "./services/db";
import loggerMiddleware from "./middlewares/logger";
import renderOauthRedirectHtml from "./routes/oauth2-redirect";
import { Liquid } from "liquidjs";
import { getClient } from "./services/clients";
import { translate } from "./utils/i18n";

export const app = new Router<Env>();

app.use(loggerMiddleware);
app.use(corsMiddleware);
app.use(errorHandler);

app.get("/", async () => {
  return new Response(
    JSON.stringify({
      name: packageJson.name,
      version: packageJson.version,
    }),
  );
});

app.get("/spec", async () => {
  return new Response(JSON.stringify(swagger));
});

// TODO: Remove once we are confident that it's working
// app.get("/send-email", async (ctx: Context<Env>) => {
//   let response = await ctx.env.AUTH_TEMPLATES.get("code.liquid");
//   if (!response) {
//     throw new Error("Code template not found");
//   }

//   const templateString = await response.text();

//   const engine = new Liquid();
//   const sendCodeTemplate = engine.parse(templateString);

//   const code = "1234";
//   const client = await getClient(ctx.env, "kvartal");

//   const codeEmailBody = await engine.render(sendCodeTemplate, {
//     code,
//     // i. host somewhere proper
//     // ii. store client logo in KV store
//     logo: "https://checkout.sesamy.com/images/kvartal-logo.svg",
//     vendorName: "Kvartal",
//   });

//   const emailResponse = await ctx.env.sendEmail({
//     to: [{ email: "markus@ahlstrand.es", name: "Markus" }],
//     dkim: client.domains[0],
//     from: {
//       email: client.senderEmail,
//       name: client.senderName,
//     },
//     content: [
//       {
//         type: "text/plain",
//         value: `Välkommen till SVT Play! ${code} är koden för att logga in`,
//       },
//       {
//         type: "text/html",
//         value: codeEmailBody,
//       },
//     ],
//     subject: translate("sv", "codeEmailTitle")
//       .replace("{{vendorName}}", client.name)
//       .replace("{{code}}", code),
//   });

//   return new Response(await emailResponse.text());
// });

app.get("/docs", swaggerUi);
app.get("/oauth2-redirect.html", renderOauthRedirectHtml);

app.post("/migrate-to-latest", async (ctx: Context<Env>) => {
  try {
    await migrateToLatest(ctx);
    return new Response("OK");
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        message: err.message,
        cause: err.cause,
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }
});

app.post("/migrate-down", async (ctx: Context<Env>) => {
  try {
    await migrateDown(ctx);
    return new Response("OK");
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        message: err.message,
        cause: err.cause,
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }
});

app.get("/static/:file*", serve);

app.get("/test", async (ctx: Context<Env>) => {
  const db = getDb(ctx.env);
  const application = await db
    .selectFrom("applications")
    .selectAll()
    .executeTakeFirst();

  return new Response("Test redirect", {
    status: 302,
    headers: {
      location: `/authorize?client_id=${application?.id}&redirect_uri=${ctx.protocol}//${ctx.host}/u/info&scope=profile%20email%20openid&state=1234&response_type=code`,
    },
  });
});

app.post("/create-key", async (ctx: Context<Env>) => {
  await rotateKeys(ctx.env);

  return new Response("OK");
});

app.use(bodyparser);

RegisterRoutes(app);

app.use(app.allowedMethods());
