import { Context, Hono } from "hono";
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
import { renderReactThing } from "./utils/reactdemo";
import validatePassword from "./utils/validatePassword";
import { getUserByEmailAndProvider } from "./utils/users";
import { getClient } from "./services/clients";

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

app.get(
  "/u/reset-password",
  async (ctx: Context<{ Bindings: Env; Variables: Var }>) => {
    return renderReactThing(ctx);
  },
);

app.post(
  "/u/reset-password",
  async (ctx: Context<{ Bindings: Env; Variables: Var }>) => {
    // in our tests we are POSTing up JSON, which previously worked
    const json = await ctx.req.json();
    const jsonPassword = json.password;

    // but in the browser we are doing a POST with form data
    const body = await ctx.req.parseBody();
    const password = body.password || jsonPassword;

    const state = ctx.req.query("state");
    const code = ctx.req.query("code");

    if (!password) {
      throw new HTTPException(400, { message: "Password required" });
    }
    if (typeof password !== "string") {
      throw new HTTPException(400, { message: "Password must be a string" });
    }
    if (!state) {
      throw new HTTPException(400, { message: "State required" });
    }
    if (!code) {
      throw new HTTPException(400, { message: "Code required" });
    }

    const { env } = ctx;
    const session = await env.data.universalLoginSessions.get(state);
    if (!session) {
      throw new HTTPException(400, { message: "Session not found" });
    }

    if (!validatePassword(password)) {
      return renderReactThing(
        ctx,
        "Password does not meet the requirements",
        400,
      );
    }

    if (!session.authParams.username) {
      throw new HTTPException(400, { message: "Username required" });
    }

    const client = await getClient(env, session.authParams.client_id);
    if (!client) {
      throw new HTTPException(400, { message: "Client not found" });
    }

    // Note! we don't use the primary user here. Something to be careful of
    // this means the primary user could have a totally different email address
    const user = await getUserByEmailAndProvider({
      userAdapter: env.data.users,
      tenant_id: client.tenant_id,
      email: session.authParams.username,
      provider: "auth2",
    });

    if (!user) {
      throw new HTTPException(400, { message: "User not found" });
    }

    try {
      const codes = await env.data.codes.list(client.tenant_id, user.id);
      const foundCode = codes.find((storedCode) => storedCode.code === code);

      if (!foundCode) {
        // surely we should check this on the GET rather than have the user waste time entering a new password?
        // THEN we can assume here it works and throw a hono exception if it doesn't... because it's an issue with our system
        // ALTHOUGH the user could have taken a long time to enter the password...
        return renderReactThing(ctx, "Code not found or expired", 400);
      }

      await env.data.passwords.update(client.tenant_id, {
        user_id: user.id,
        password,
      });
    } catch (err) {
      // seems like we should not do this catch... try and see what happens
      return renderReactThing(ctx, "The password could not be reset", 400);
    }

    // need JSX success here
    return ctx.text("The password has been reset", 200);
  },
);

app.get(
  "/css/default.css",
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
