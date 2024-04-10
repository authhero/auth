import { Context, Hono } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { Env } from "./types/Env";
import { RegisterRoutes } from "../build/routes";
import swagger from "../build/swagger.json";
import packageJson from "../package.json";
import swaggerUi from "./routes/swagger-ui";
import loggerMiddleware from "./middlewares/logger";
import renderOauthRedirectHtml from "./routes/oauth2-redirect";
import { validateUrl } from "./utils/validate-redirect-url";
import { Var } from "./types/Var";
import { login } from "./routes/tsx/routes";
import { wellKnown } from "./routes/oauth2/well-known";
import { users } from "./routes/management-api/users";
import { registerComponent } from "./middlewares/register-component";

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

const rootApp = new OpenAPIHono<{ Bindings: Env }>();

registerComponent(rootApp);

export const app = rootApp
  .onError((err, ctx) => {
    console.error(err);

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
  .route("/api/v2/users", users);

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
    const response = await ctx.env.AUTH_TEMPLATES.get(
      "templates/static/stylesheets/tailwind.css",
    );

    if (!response) {
      throw new Error("Template not found");
    }

    const templateString = await response.text();

    return ctx.text(templateString, 200, {
      "content-type": "text/css",
    });
  },
);

app.get("/docs", swaggerUi);
app.get("/oauth2-redirect.html", renderOauthRedirectHtml);

app.get("/test", async (ctx: Context<{ Bindings: Env }>) => {
  const response = await ctx.env.data.applications.list(
    // This is the tenant id in dev
    "VpE9qtb4Gt_iCahTM0FYg",
    {
      per_page: 1,
      page: 1,
      include_totals: true,
    },
  );

  const [application] = response.applications;

  const url = new URL(ctx.req.url);

  return new Response("Test redirect", {
    status: 302,
    headers: {
      location: `/authorize?client_id=${application?.id}&redirect_uri=${url.protocol}//${url.host}/u/info&scope=profile%20email%20openid&state=1234&response_type=code`,
    },
  });
});

export const tsoaApp = RegisterRoutes(app as unknown as Hono);

export default app;
