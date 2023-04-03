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

export const app = new Router<Env>();

app.use(corsMiddleware);
app.use(errorHandler);

app.get("/", async () => {
  return new Response(
    JSON.stringify({
      name: packageJson.name,
      version: packageJson.version,
    })
  );
});

app.get("/spec", async () => {
  return new Response(JSON.stringify(swagger));
});

app.get("/docs", swaggerUi);

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
      }
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
      }
    );
  }
});

app.get("/static/:file*", serve);

app.get("/test", async () => {
  return new Response("Test redirect", {
    status: 302,
    headers: {
      location:
        "/authorize?client_id=default&redirect_uri=https://auth2.sesamy.dev/u/info&scope=profile%20email%20openid&state=1234&response_type=implicit",
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
