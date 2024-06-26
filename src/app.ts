import { Context } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { Env, Var } from "./types";
import packageJson from "../package.json";
import swaggerUi from "./routes/swagger-ui";
import loggerMiddleware from "./middlewares/logger";
import renderOauthRedirectHtml from "./routes/oauth2-redirect";
import { validateUrl } from "./utils/validate-redirect-url";
import { loginRoutes } from "./routes/tsx/routes";
import { wellKnownRoutes } from "./routes/oauth2/well-known";
import { userRoutes } from "./routes/management-api/users";
import { registerComponent } from "./middlewares/register-component";
import { usersByEmailRoutes } from "./routes/management-api/users-by-email";
import { tenantRoutes } from "./routes/management-api/tenants";
import { logRoutes } from "./routes/management-api/logs";
import { applicationRoutes } from "./routes/management-api/applications";
import { callbackRoutes } from "./routes/oauth2/callback";
import { connectionRoutes } from "./routes/management-api/connections";
import { domainRoutes } from "./routes/management-api/domains";
import { keyRoutes } from "./routes/management-api/keys";
import { tailwindCss } from "./styles/tailwind";
import { logoutRoutes } from "./routes/oauth2/logout";
import { dbConnectionRoutes } from "./routes/oauth2/dbconnections";
import { passwordlessRoutes } from "./routes/oauth2/passwordless";
import { tokenRoutes } from "./routes/oauth2/token";
import { authenticateRoutes } from "./routes/oauth2/authenticate";
import { authorizeRoutes } from "./routes/oauth2/authorize";
import { userinfoRoutes } from "./routes/oauth2/userinfo";
import { brandingRoutes } from "./routes/management-api/branding";

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

export const oauthApp = new OpenAPIHono<{ Bindings: Env; Variables: Var }>()
  .route("/u", loginRoutes)
  .route("/.well-known", wellKnownRoutes)
  .route("/authorize", authorizeRoutes)
  .route("/callback", callbackRoutes)
  .route("/userinfo", userinfoRoutes)
  .route("/oauth/token", tokenRoutes)
  .route("/dbconnections", dbConnectionRoutes)
  .route("/passwordless", passwordlessRoutes)
  .route("/co/authenticate", authenticateRoutes)
  .route("/v2/logout", logoutRoutes);

oauthApp.doc("/spec", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Oauth endpoints",
  },
});

rootApp.route("/", oauthApp);

export const managementApp = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
  .route("/api/v2/branding", brandingRoutes)
  .route("/api/v2/domains", domainRoutes)
  .route("/api/v2/users", userRoutes)
  .route("/api/v2/keys/signing", keyRoutes)
  .route("/api/v2/users-by-email", usersByEmailRoutes)
  .route("/api/v2/applications", applicationRoutes)
  .route("/api/v2/tenants", tenantRoutes)
  .route("/api/v2/logs", logRoutes)
  .route("/api/v2/connections", connectionRoutes);

registerComponent(managementApp);

managementApp.doc("/api/v2/spec", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Management api",
  },
});

rootApp.route("/", oauthApp).route("/", managementApp);

app.get(
  "/css/tailwind.css",
  async (ctx: Context<{ Bindings: Env; Variables: Var }>) => {
    const css = tailwindCss;

    return ctx.text(css, 200, {
      "content-type": "text/css; charset=utf-8",
    });
  },
);

app.get("/docs", swaggerUi);
app.get("/oauth2-redirect.html", renderOauthRedirectHtml);

export default app;
