import { OpenAPIHono } from "@hono/zod-openapi";
import { Env, Var } from "./types";
import { addDataHooks } from "./hooks";
import { CreateAuthParams } from "./app";
import { loginRoutes } from "./routes/universal-login/routes";
import { wellKnownRoutes } from "./routes/oauth2/well-known";
import { authorizeRoutes } from "./routes/oauth2/authorize";
import { callbackRoutes } from "./routes/oauth2/callback";
import { userinfoRoutes } from "./routes/oauth2/userinfo";
import { tokenRoutes } from "./routes/oauth2/token";
import { dbConnectionRoutes } from "./routes/oauth2/dbconnections";
import { passwordlessRoutes } from "./routes/oauth2/passwordless";
import { authenticateRoutes } from "./routes/oauth2/authenticate";
import { logoutRoutes } from "./routes/oauth2/logout";

export default function create(params: CreateAuthParams) {
  const app = new OpenAPIHono<{ Bindings: Env; Variables: Var }>();

  app.use(async (ctx, next) => {
    ctx.env.data = addDataHooks(ctx, params.dataAdapter);
    return next();
  });

  const oauthApp = app
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

  return oauthApp;
}
