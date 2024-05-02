import { Context } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { Env, Var } from "./types";
import swagger from "../build/swagger.json";
import packageJson from "../package.json";
import swaggerUi from "./routes/swagger-ui";
import loggerMiddleware from "./middlewares/logger";
import renderOauthRedirectHtml from "./routes/oauth2-redirect";
import { validateUrl } from "./utils/validate-redirect-url";
import { login } from "./routes/tsx/routes";
import { wellKnown } from "./routes/oauth2/well-known";
import { users } from "./routes/management-api/users";
import { registerComponent } from "./middlewares/register-component";
import { usersByEmail } from "./routes/management-api/users-by-email";
import { tenants } from "./routes/management-api/tenants";
import { logs } from "./routes/management-api/logs";
import { applications } from "./routes/management-api/applications";
import { callback } from "./routes/oauth2/callback";
import { connections } from "./routes/management-api/connections";
import { domains } from "./routes/management-api/domains";
import { keys } from "./routes/management-api/keys";
import { tailwindCss } from "./styles/tailwind";
import { logoutRoutes } from "./routes/oauth2/logout";
import { dbConnectionRoutes } from "./routes/oauth2/dbconnections";
import { passwordlessRoutes } from "./routes/oauth2/passwordless";
import { tokenRoutes } from "./routes/oauth2/token";
import { authenticateRoutes } from "./routes/oauth2/authenticate";
import { authorizeRoutes } from "./routes/oauth2/authorize";
import { userinfoRoutes } from "./routes/oauth2/userinfo";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://login2.sesamy.dev",
  "https://login2.sesamy.dev",
  "https://*.vercel.sesamy.dev",
  "https://login2.sesamy.com",
  "https://appleid.apple.com",
  "https://auth-admin.sesamy.dev",
  "https://auth-admin.sesamy.com",
];

const rootApp = new OpenAPIHono<{ Bindings: Env; Variables: Var }>();

registerComponent(rootApp);

const app = rootApp
  .onError((err, ctx) => {
    if (err instanceof HTTPException) {
      // Get the custom response
      return err.getResponse();
    }

    return ctx.text(err.message, 500);
  })
  .use(
    "/*",
    cors({
      origin: (origin) => {
        if (!origin) return "";
        if (validateUrl(ALLOWED_ORIGINS, origin)) {
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
  )
  .use(loggerMiddleware)
  .get("/", async (ctx: Context<{ Bindings: Env; Variables: Var }>) => {
    const url = new URL(ctx.req.url);
    const tenantId = url.hostname.split(".")[0];
    return ctx.json({
      name: tenantId,
      version: packageJson.version,
    });
  });

export const loginApp = rootApp
  .route("/u", login)
  .route("/.well-known", wellKnown)
  .route("/authorize", authorizeRoutes)
  .route("/callback", callback)
  .route("/userinfo", userinfoRoutes)
  .route("/oauth/token", tokenRoutes)
  .route("/dbconnections", dbConnectionRoutes)
  .route("/passwordless", passwordlessRoutes)
  .route("/co/authenticate", authenticateRoutes)
  .route("/v2/logout", logoutRoutes)
  .route("/api/v2/domains", domains)
  .route("/api/v2/users", users)
  .route("/api/v2/keys/signing", keys)
  .route("/api/v2/users-by-email", usersByEmail)
  .route("/api/v2/applications", applications)
  .route("/api/v2/tenants", tenants)
  .route("/api/v2/logs", logs)
  .route("/api/v2/connections", connections);

loginApp.doc("/u/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Login spec",
  },
});

app.get("/spec", async () => {
  return new Response(JSON.stringify(swagger));
});

app.get(
  "/css/tailwind.css",
  async (ctx: Context<{ Bindings: Env; Variables: Var }>) => {
    const css = tailwindCss;

    return ctx.text(css, 200, {
      "content-type": "text/css",
    });
  },
);

app.get("/docs", swaggerUi);
app.get("/oauth2-redirect.html", renderOauthRedirectHtml);

export default app;
