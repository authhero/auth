import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { nanoid } from "nanoid";
import randomString from "../../utils/random-string";
import { Env, Ticket, Var } from "../../types";
import { HTTPException } from "hono/http-exception";
import { getClient } from "../../services/clients";
import { loginWithPassword } from "../../authentication-flows/password";

const TICKET_EXPIRATION_TIME = 30 * 60 * 1000;

export const authenticateRoutes = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
  // --------------------------------
  // GET /co/authenticate
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["oauth"],
      method: "post",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                credential_type: z.enum([
                  "http://auth0.com/oauth/grant-type/passwordless/otp",
                  "http://auth0.com/oauth/grant-type/password-realm",
                ]),
                otp: z.string().optional(),
                client_id: z.string(),
                username: z.string().transform((v) => v.toLowerCase()),
                password: z.string().optional(),
                realm: z.enum(["email", "Username-Password-Authentication"]),
                scope: z.string().optional(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "List of tenants",
        },
      },
    }),
    async (ctx) => {
      const { client_id, username, otp, password } = ctx.req.valid("json");
      const client = await getClient(ctx.env, client_id);

      const email = username.toLocaleLowerCase();

      let ticket: Ticket = {
        id: nanoid(),
        tenant_id: client.tenant_id,
        client_id: client.id,
        email: email,
        created_at: new Date(),
        expires_at: new Date(Date.now() + TICKET_EXPIRATION_TIME),
      };

      if (otp) {
        const otps = await ctx.env.data.OTP.list(client.tenant_id, email);
        const matchingOtp = otps.find((o) => o.code === otp);

        if (!matchingOtp) {
          throw new HTTPException(403, {
            res: new Response(
              JSON.stringify({
                error: "access_denied",
                error_description: "Wrong email or verification code.",
              }),
              {
                status: 403, // without this it returns a 200
                headers: {
                  "Content-Type": "application/json",
                },
              },
            ),
            message: "Wrong email or verification code.",
          });
        }

        // TODO - use validateCode() helper common code here
        await ctx.env.data.OTP.remove(client.tenant_id, matchingOtp.id);

        ticket.authParams = matchingOtp.authParams;
      } else if (password) {
        // This will throw if the login fails
        await loginWithPassword(ctx, client, {
          username,
          password,
          client_id,
        });
      } else {
        throw new HTTPException(400, { message: "Code or password required" });
      }

      await ctx.env.data.tickets.create(ticket);

      return ctx.json({
        login_ticket: ticket.id,
        // TODO: I guess these should be validated when accepting the ticket
        co_verifier: randomString(32),
        co_id: randomString(12),
      });
    },
  );
