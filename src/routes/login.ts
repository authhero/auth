import mime from "mime/lite";
import { Env } from "../types/Env";
import { Context } from "hono";

export async function serve(ctx: Context<{ Bindings: Env }>) {
  const path = ctx.req.param("file");

  let response = await ctx.env.AUTH_TEMPLATES.get(`templates/static/${path}`);

  if (!response) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "content-type": "text/plain",
      },
    });
  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "content-type": mime.getType(path) || "text/plain",
      "cache-control": "max-age=2628000,public",
    },
  });
}
