import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { Env } from "./types/Env";
import { RegisterRoutes } from "../build/routes";
import swagger from "../build/swagger.json";
import packageJson from "../package.json";
import swaggerUi from "./routes/swagger-ui";
import { rotateKeysRoute } from "./routes/rotate-keys";
import { serve } from "./routes/login";
import { getDb } from "./services/db";
import loggerMiddleware from "./middlewares/logger";
import renderOauthRedirectHtml from "./routes/oauth2-redirect";
import { Var } from "./types/Var";

export const app = new Hono<{ Bindings: Env }>();

app.onError((err, ctx) => {
  if (err instanceof HTTPException) {
    // Get the custom response
    return err.getResponse();
  }

  return ctx.text(err.message, 500);
});

app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (
        [
          "http://localhost:3000",
          "http://localhost:5173",
          "https://login2.sesamy.dev",
          "https://auth-admin.sesamy.dev",
          "https://login2.sesamy.com",
          "https://auth-admin.sesamy.com",
        ].includes(origin)
      ) {
        return origin;
      }
      return "";
    },
    allowHeaders: [
      "Tenant-Id",
      "Content-Type",
      "Content-Range",
      "Auth0-Client",
      "Authorization",
      "Range",
      "Upgrade-Insecure-Requests",
    ],
    allowMethods: ["POST", "PUT", "GET", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Content-Range"],
    maxAge: 600,
    credentials: true,
  }),
);

app.use(loggerMiddleware);

app.get("/", async (ctx: Context<{ Bindings: Env; Variables: Var }>) => {
  return ctx.json({
    name: packageJson.name,
    version: packageJson.version,
  });
});

app.get("/spec", async () => {
  return new Response(JSON.stringify(swagger));
});

app.get("/docs", swaggerUi);
app.get("/oauth2-redirect.html", renderOauthRedirectHtml);
app.get("/static/:file{.*}", serve);
app.post("/create-key", rotateKeysRoute);

app.get("/test", async (ctx: Context<{ Bindings: Env }>) => {
  const db = getDb(ctx.env);
  const application = await db
    .selectFrom("applications")
    .selectAll()
    .executeTakeFirst();

  const url = new URL(ctx.req.url);

  return new Response("Test redirect", {
    status: 302,
    headers: {
      location: `/authorize?client_id=${application?.id}&redirect_uri=${url.protocol}//${url.host}/u/info&scope=profile%20email%20openid&state=1234&response_type=code`,
    },
  });
});

RegisterRoutes(app as unknown as Hono);
