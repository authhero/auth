import { HTTPException } from "hono/http-exception";
import { nanoid } from "nanoid";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import userIdGenerate from "../../utils/userIdGenerate";
import { getClient } from "../../services/clients";
import { getPrimaryUserByEmailAndProvider } from "../../utils/users";
import { AuthParams, Env, LogTypes, Var } from "../../types";
import { sendEmailVerificationEmail } from "../../authentication-flows/passwordless";
import validatePassword from "../../utils/validatePassword";
import { createLogMessage } from "../../utils/create-log-message";
import { requestPasswordReset } from "../../authentication-flows/password";
import { UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS } from "../../constants";
import { UniversalLoginSession } from "@authhero/adapter-interfaces";

export const dbConnectionRoutes = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
  // --------------------------------
  // POST /dbconnections/signup
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["dbconnections"],
      method: "post",
      path: "/signup",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                client_id: z.string(),
                connection: z.literal("Username-Password-Authentication"),
                email: z.string().transform((u) => u.toLowerCase()),
                password: z.string(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({
                _id: z.string(),
                email: z.string(),
                email_verified: z.boolean(),
                app_metadata: z.object({}),
                user_metadata: z.object({}),
              }),
            },
          },
          description: "Created user",
        },
      },
    }),
    async (ctx) => {
      const { email, password, client_id } = ctx.req.valid("json");

      // auth0 returns a detailed JSON response with the way the password does match the strength rules
      if (!validatePassword(password)) {
        throw new HTTPException(400, {
          message: "Password does not meet the requirements",
        });
      }

      const client = await getClient(ctx.env, client_id);
      ctx.set("client_id", client.id);

      const existingUser = await getPrimaryUserByEmailAndProvider({
        userAdapter: ctx.env.data.users,
        tenant_id: client.tenant_id,
        email,
        provider: "auth2",
      });

      if (existingUser) {
        // Auth0 doesn't inform that the user already exists
        throw new HTTPException(400, { message: "Invalid sign up" });
      }

      const newUser = await ctx.env.data.users.create(client.tenant_id, {
        user_id: `auth2|${userIdGenerate()}`,
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_verified: false,
        provider: "auth2",
        connection: "Username-Password-Authentication",
        is_social: false,
        login_count: 0,
      });

      ctx.set("userId", newUser.user_id);
      ctx.set("userName", newUser.email);
      ctx.set("connection", newUser.connection);

      // Store the password
      await ctx.env.data.passwords.create(client.tenant_id, {
        user_id: newUser.user_id,
        password,
      });

      await sendEmailVerificationEmail({
        env: ctx.env,
        client,
        user: newUser,
      });

      const log = createLogMessage(ctx, {
        type: LogTypes.SUCCESS_SIGNUP,
        description: "Successful signup",
      });
      await ctx.env.data.logs.create(client.tenant_id, log);

      return ctx.json({
        _id: newUser.user_id,
        email: newUser.email,
        email_verified: false,
        app_metadata: {},
        user_metadata: {},
      });
    },
  ) // --------------------------------
  // POST /dbconnections/change_password
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["dbconnections"],
      method: "post",
      path: "/change_password",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                client_id: z.string(),
                connection: z.literal("Username-Password-Authentication"),
                email: z.string().transform((u) => u.toLowerCase()),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Redirect to the client's redirect uri",
        },
      },
    }),
    async (ctx) => {
      const { email, client_id } = ctx.req.valid("json");

      const client = await getClient(ctx.env, client_id);

      const authParams: AuthParams = {
        client_id: client_id,
        username: email,
      };

      const session: UniversalLoginSession = {
        id: nanoid(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: new Date(
          Date.now() + UNIVERSAL_AUTH_SESSION_EXPIRES_IN_SECONDS * 1000,
        ).toISOString(),
        authParams,
      };

      await ctx.env.data.universalLoginSessions.create(
        client.tenant_id,
        session,
      );

      await requestPasswordReset(ctx, client, email, session.id);

      return ctx.html("We've just sent you an email to reset your password.");
    },
  );
