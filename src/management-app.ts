import { OpenAPIHono } from "@hono/zod-openapi";
import { Env, Var } from "./types";
import { addDataHooks } from "./hooks";
import { CreateAuthParams } from "./app";
import { brandingRoutes } from "./routes/management-api/branding";
import { domainRoutes } from "./routes/management-api/domains";
import { userRoutes } from "./routes/management-api/users";
import { keyRoutes } from "./routes/management-api/keys";
import { usersByEmailRoutes } from "./routes/management-api/users-by-email";
import { applicationRoutes } from "./routes/management-api/applications";
import { tenantRoutes } from "./routes/management-api/tenants";
import { logRoutes } from "./routes/management-api/logs";
import { hooksRoutes } from "./routes/management-api/hooks";
import { connectionRoutes } from "./routes/management-api/connections";
import { registerComponent } from "./middlewares/register-component";

export default function create(params: CreateAuthParams) {
  const app = new OpenAPIHono<{
    Bindings: Env;
    Variables: Var;
  }>();

  app.use(async (ctx, next) => {
    ctx.env.data = addDataHooks(ctx, params.dataAdapter);
    return next();
  });

  const managementApp = app
    .route("/api/v2/branding", brandingRoutes)
    .route("/api/v2/domains", domainRoutes)
    .route("/api/v2/users", userRoutes)
    .route("/api/v2/keys/signing", keyRoutes)
    .route("/api/v2/users-by-email", usersByEmailRoutes)
    .route("/api/v2/applications", applicationRoutes)
    .route("/api/v2/tenants", tenantRoutes)
    .route("/api/v2/logs", logRoutes)
    .route("/api/v2/hooks", hooksRoutes)
    .route("/api/v2/connections", connectionRoutes);

  registerComponent(managementApp);

  managementApp.doc("/api/v2/spec", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Management api",
    },
  });

  return managementApp;
}
