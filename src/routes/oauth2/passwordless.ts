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
import { setSilentAuthCookies } from "../../helpers/silent-auth-cookie-new";
import { generateAuthData } from "../../helpers/generate-auth-response";
import { applyTokenResponse } from "../../helpers/apply-token-response-new";
import { serializeStateInCookie } from "../../services/cookies";

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
      const {
        client_id,
        email: emailRaw,
        send,
        authParams,
        connection,
      } = ctx.req.valid("json");
      const client = await getClient(ctx.env, client_id);

      const email = emailRaw.toLowerCase();

      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }

      const code = generateOTP();

      await ctx.env.data.OTP.create({
        id: nanoid(),
        code,
        email,
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
  )
  // --------------------------------
  // POST /passwordless/verify_redirect
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
          nonce: z.string(),
          verification_code: z.string(),
          connection: z.string(),
          client_id: z.string(),
          email: z.string(),
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
      if (!client) {
        throw new Error("Client not found");
      }

      try {
        const user = await validateCode(env, {
          client_id,
          email,
          verification_code,
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
          scope,
          audience,
        };

        const sessionId = await setSilentAuthCookies(
          env,
          client.tenant_id,
          client.id,
          user,
        );
        const [sessionCookie] = serializeStateInCookie(sessionId);

        const tokenResponse = await generateAuthData({
          responseType: response_type,
          env,
          tenantId: client.tenant_id,
          userId: user.id,
          sid: sessionId,
          state,
          nonce,
          user,
          authParams,
        });

        return new Response("Redirecting", {
          status: 302,
          headers: {
            location: applyTokenResponse(tokenResponse, authParams),
            "set-cookie": sessionCookie,
          },
        });
      } catch (e) {
        // Ideally here only catch AuthenticationCodeExpiredError
        // redirect here always to login2.sesamy.dev/expired-code

        const locale = client.tenant.language || "sv";

        const login2ExpiredCodeUrl = new URL(`${env.LOGIN2_URL}/expired-code`);

        const stateDecoded = new URLSearchParams(state);

        login2ExpiredCodeUrl.searchParams.set("email", email);

        login2ExpiredCodeUrl.searchParams.set("lang", locale);

        const redirectUri = stateDecoded.get("redirect_uri");
        if (redirectUri) {
          login2ExpiredCodeUrl.searchParams.set("redirect_uri", redirectUri);
        }

        const audience = stateDecoded.get("audience");
        if (audience) {
          login2ExpiredCodeUrl.searchParams.set("audience", audience);
        }

        const nonce = stateDecoded.get("nonce");
        if (nonce) {
          login2ExpiredCodeUrl.searchParams.set("nonce", nonce);
        }

        const scope = stateDecoded.get("scope");
        if (scope) {
          login2ExpiredCodeUrl.searchParams.set("scope", scope);
        }

        const responseType = stateDecoded.get("response_type");
        if (responseType) {
          login2ExpiredCodeUrl.searchParams.set("response_type", responseType);
        }

        const state2 = stateDecoded.get("state");
        if (state2) {
          login2ExpiredCodeUrl.searchParams.set("state", state2);
        }

        const client_id = stateDecoded.get("client_id");
        if (client_id) {
          login2ExpiredCodeUrl.searchParams.set("client_id", client_id);
        }

        // this will always be auth2
        const connection2 = stateDecoded.get("connection");
        if (connection2) {
          login2ExpiredCodeUrl.searchParams.set("connection", connection2);
        }

        const vendorId = stateDecoded.get("vendor_id");
        if (vendorId) {
          login2ExpiredCodeUrl.searchParams.set("vendor_id", vendorId);
        }

        return ctx.redirect(login2ExpiredCodeUrl.toString());
      }
    },
  );
