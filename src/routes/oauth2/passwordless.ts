import { nanoid } from "nanoid";
import { authParamsSchema } from "../../types/AuthParams";
import generateOTP from "../../utils/otp";
import { getClient } from "../../services/clients";
import { sendCode, sendLink } from "../../controllers/email";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Env, Var } from "../../types";
import { HTTPException } from "hono/http-exception";

const OTP_EXPIRATION_TIME = 30 * 60 * 1000;

export const passwordlessRoutes = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
  // --------------------------------
  // POST /passwordless
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["dbconnections"],
      method: "post",
      path: "/start",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                client_id: z.string(),
                client_secret: z.string().optional(),
                connection: z.string(),
                email: z.string(),
                send: z.enum(["link", "code"]),
                authParams: authParamsSchema.omit({ client_id: true }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const { client_id, email, send, authParams, connection } =
        ctx.req.valid("json");
      const client = await getClient(ctx.env, client_id);

      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }

      const code = generateOTP();

      await ctx.env.data.OTP.create({
        id: nanoid(),
        code,
        email: email.toLowerCase(),
        client_id: client_id,
        send: send,
        authParams: authParams,
        tenant_id: client.tenant_id,
        created_at: new Date(),
        expires_at: new Date(Date.now() + OTP_EXPIRATION_TIME),
      });

      if (send === "link") {
        const magicLink = new URL(ctx.env.ISSUER);
        magicLink.pathname = "passwordless/verify_redirect";
        if (authParams.scope) {
          magicLink.searchParams.set("scope", authParams.scope);
        }
        if (authParams.response_type) {
          magicLink.searchParams.set("response_type", authParams.response_type);
        }
        if (authParams.redirect_uri) {
          magicLink.searchParams.set("redirect_uri", authParams.redirect_uri);
        }
        if (authParams.audience) {
          magicLink.searchParams.set("audience", authParams.audience);
        }
        if (authParams.state) {
          magicLink.searchParams.set("state", authParams.state);
        }
        if (authParams.nonce) {
          magicLink.searchParams.set("nonce", authParams.nonce);
        }

        magicLink.searchParams.set("connection", connection);
        magicLink.searchParams.set("client_id", client_id);
        magicLink.searchParams.set("email", email);
        magicLink.searchParams.set("verification_code", code);

        await sendLink(ctx.env, client, email, code, magicLink.href);
      } else {
        await sendCode(ctx.env, client, email, code);
      }

      return ctx.html("OK");
    },
  );
