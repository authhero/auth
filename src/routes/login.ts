import { Context } from "cloudworker-router";
import mime from "mime/lite";
import { Env } from "../types/Env";

export async function serve(ctx: Context<Env>) {
  const path = ctx.params.file;

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
