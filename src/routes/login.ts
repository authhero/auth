import { Context } from "cloudworker-router";
import mime from "mime/lite";
import { Env } from "../types/Env";
import { Liquid, Template } from "liquidjs";

const engine = new Liquid();

// let mainTemplate: Template[];

// async function getMainTemplate(bucket: R2Bucket) {
//   if (!mainTemplate) {
//     let response = await bucket.get(`templates/default.liquid`);

//     if (!response) {
//       throw new Error("Main template not found");
//     }

//     const templateString = await response.text();
//     mainTemplate = engine.parse(templateString);
//   }

//   return mainTemplate;
// }

// async function getLoginTemplate(bucket: R2Bucket) {
//   let response = await bucket.get(`templates/login.liquid`);

//   if (!response) {
//     throw new Error("Login template not found");
//   }

//   const templateString = await response.text();
//   return engine.parse(templateString);
// }

// async function serveLiquid(ctx: Context<Env>) {
//   try {
//     const mainTemplate = await getMainTemplate(ctx.env.AUTH_TEMPLATES);
//     const loginTemplate = await getLoginTemplate(ctx.env.AUTH_TEMPLATES);
//     const body = await engine.render(loginTemplate);
//     const mainText = await engine.render(mainTemplate, {
//       body,
//       head: '<script src="/u/login.js" defer=""></script><link rel="stylesheet" type="text/css" href="/u/login.css">',
//     });

//     return new Response(mainText, {
//       headers: {
//         "content-type": "text/html",
//       },
//     });
//   } catch (err: any) {
//     return new Response(err.message, {
//       status: 404,
//       headers: {
//         "content-type": "text/plain",
//       },
//     });
//   }
// }

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
    },
  });
}
