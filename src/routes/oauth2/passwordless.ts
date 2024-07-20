import { nanoid } from "nanoid";
import {
  AuthParams,
  AuthorizationResponseType,
  authParamsSchema,
} from "../../types/AuthParams";
import generateOTP from "../../utils/otp";
import { getClient } from "../../services/clients";
import { sendCode, sendLink } from "../../controllers/email";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Env, Var } from "../../types";
import { HTTPException } from "hono/http-exception";
import { validateCode } from "../../authentication-flows/passwordless";
import { validateRedirectUrl } from "../../utils/validate-redirect-url";
import { setSilentAuthCookies } from "../../helpers/silent-auth-cookie";
import { generateAuthResponse } from "../../helpers/generate-auth-response";
import { setSearchParams } from "../../utils/url";

const OTP_EXPIRATION_TIME = 30 * 60 * 1000;

export const passwordlessRoutes = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
  // --------------------------------
  // POST /passwordless/start
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["passwordless"],
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
                email: z.string().transform((u) => u.toLowerCase()),
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
      const body = ctx.req.valid("json");
      const { client_id, email, send, authParams } = body;
      const client = await getClient(ctx.env, client_id);

      const code = generateOTP();

      await ctx.env.data.OTP.create(client.tenant_id, {
        id: nanoid(),
        code,
        // TODO: this will be removed in next adapter version
        tenant_id: client.tenant_id,
        email: email,
        client_id: client_id,
        send: send,
        authParams: { ...authParams, client_id },
        ip: ctx.req.header("x-real-ip"),
        expires_at: new Date(Date.now() + OTP_EXPIRATION_TIME).toISOString(),
      });

      if (send === "link") {
        await sendLink(ctx, client, email, code, {
          ...authParams,
          client_id,
        });
      } else {
        await sendCode(ctx, client, email, code);
      }

      return ctx.html("OK");
    },
  )
  // --------------------------------
  // GET /passwordless/verify_redirect
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["passwordless"],
      method: "get",
      path: "/verify_redirect",
      request: {
        query: z.object({
          scope: z.string(),
          response_type: z.nativeEnum(AuthorizationResponseType),
          redirect_uri: z.string(),
          state: z.string(),
          nonce: z.string().optional(),
          verification_code: z.string(),
          connection: z.string(),
          client_id: z.string(),
          email: z.string().transform((u) => u.toLowerCase()),
          audience: z.string().optional(),
        }),
      },
      responses: {
        302: {
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const { env } = ctx;
      const {
        client_id,
        email,
        verification_code,
        redirect_uri,
        state,
        scope,
        audience,
        response_type,
        nonce,
      } = ctx.req.valid("query");
      const client = await getClient(env, client_id);

      try {
        const user = await validateCode(ctx, {
          client_id,
          email,
          verification_code,
          ip: ctx.req.header("x-real-ip"),
        });

        if (!validateRedirectUrl(client.allowed_callback_urls, redirect_uri)) {
          throw new HTTPException(400, {
            message: `Invalid redirect URI - ${redirect_uri}`,
          });
        }

        const authParams: AuthParams = {
          client_id,
          redirect_uri,
          state,
          nonce,
          scope,
          audience,
          response_type,
        };

        return generateAuthResponse({
          ctx,
          client,
          user,
          authParams,
        });
      } catch (e) {
        // Ideally here only catch AuthenticationCodeExpiredError
        // redirect here always to login2.sesamy.dev/expired-code

        const locale = client.tenant.language || "sv";

        const login2ExpiredCodeUrl = new URL(`${env.LOGIN2_URL}/expired-code`);

        const stateDecoded = new URLSearchParams(state);
        setSearchParams(login2ExpiredCodeUrl, {
          email,
          lang: locale,
          redirect_uri: stateDecoded.get("redirect_uri"),
          audience: stateDecoded.get("audience"),
          nonce: stateDecoded.get("nonce"),
          scope: stateDecoded.get("scope"),
          response_type,
          state,
          client_id: stateDecoded.get("client_id"),
          connection: stateDecoded.get("connection"),
          vendor_id: stateDecoded.get("vendor_id"),
        });

        return ctx.redirect(login2ExpiredCodeUrl.toString());
      }
    },
  );
