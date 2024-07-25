import { Context } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import i18next from "i18next";
import { Env, Var } from "./types";
import packageJson from "../package.json";
import swaggerUi from "./routes/swagger-ui";
import loggerMiddleware from "./middlewares/logger";
import renderOauthRedirectHtml from "./routes/oauth2-redirect";
import { validateUrl } from "./utils/validate-redirect-url";
import { tailwindCss } from "./styles/tailwind";
import en from "./localesLogin2/en/default.json";
import it from "./localesLogin2/it/default.json";
import nb from "./localesLogin2/nb/default.json";
import sv from "./localesLogin2/sv/default.json";
import pl from "./localesLogin2/pl/default.json";
import { DataAdapters } from "@authhero/adapter-interfaces";
import createOauthApp from "./oauth-app";
import createManagementApp from "./management-app";

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

i18next.init({
  resources: {
    en: { translation: en },
    it: { translation: it },
    nb: { translation: nb },
    sv: { translation: sv },
    pl: { translation: pl },
  },
});

export interface CreateAuthParams {
  dataAdapter: DataAdapters;
}

export default function create(params: CreateAuthParams) {
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

  rootApp.route("/", createOauthApp(params));

  const oauthApp = createOauthApp(params);
  const managementApp = createManagementApp(params);
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

  return {
    app,
    oauthApp,
    managementApp,
  };
}
