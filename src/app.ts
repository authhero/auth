import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { Env } from "./types/Env";
import { RegisterRoutes } from "../build/routes";
import swagger from "../build/swagger.json";
import packageJson from "../package.json";
import swaggerUi from "./routes/swagger-ui";
import { serve } from "./routes/login";
import loggerMiddleware from "./middlewares/logger";
import renderOauthRedirectHtml from "./routes/oauth2-redirect";
import { validateUrl } from "./utils/validate-redirect-url";
import { Var } from "./types/Var";

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

const app = new Hono<{ Bindings: Env }>()
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

app.get("/spec", async () => {
  return new Response(JSON.stringify(swagger));
});

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
