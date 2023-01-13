import { Router, bodyparser, Context } from "cloudworker-router";

import { Env } from "./types/Env";
import { RegisterRoutes } from "../build/routes";
import swagger from "../build/swagger.json";
import packageJson from "../package.json";
import swaggerUi from "./routes/swagger-ui";
import rotateKeys from "./routes/rotate-keys";

export const app = new Router<Env>();

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

app.get("/login", async (ctx: Context<Env>) => {
  const response = await ctx.env.AUTH_TEMPLATES.get("login.html");

  if (!response) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "content-type": "text/plain",
      },
    });
  }

  return new Response(await response.text(), {
    headers: {
      "content-type": "text/html",
    },
  });
});

app.get("/register", async (ctx: Context<Env>) => {
  const response = await ctx.env.AUTH_TEMPLATES.get("register.html");

  if (!response) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "content-type": "text/plain",
      },
    });
  }

  return new Response(await response.text(), {
    headers: {
      "content-type": "text/html",
    },
  });
});

app.get("/style.css", async (ctx: Context<Env>) => {
  const response = await ctx.env.AUTH_TEMPLATES.get("style.css");

  if (!response) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "content-type": "text/plain",
      },
    });
  }

  return new Response(await response.text(), {
    headers: {
      "content-type": "text/css",
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
