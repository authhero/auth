// TODO - move this file to src/routes/oauth2/login.ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Env, User, AuthorizationResponseType } from "../../types";
import ResetPasswordPage from "../../utils/components/ResetPasswordPage";
import validatePassword from "../../utils/validatePassword";
import { getUserByEmailAndProvider } from "../../utils/users";
import { getClient } from "../../services/clients";
import { HTTPException } from "hono/http-exception";
import i18next from "i18next";
import en from "../../localesLogin2/en/default.json";
import it from "../../localesLogin2/it/default.json";
import nb from "../../localesLogin2/nb/default.json";
import sv from "../../localesLogin2/sv/default.json";
import LoginPage from "../../utils/components/LoginPage";
import LoginWithCodePage from "../../utils/components/LoginWithCodePage";
import LoginEnterCodePage from "../../utils/components/LoginEnterCodePage";
import SignupPage from "../../utils/components/SignUpPage";
import { renderMessage } from "../../templates/render";
import { UniversalLoginSession } from "../../adapters/interfaces/UniversalLoginSession";
import { nanoid } from "nanoid";
import { generateAuthResponse } from "../../helpers/generate-auth-response";
import { getTokenResponseRedirectUri } from "../../helpers/apply-token-response";
import { Context } from "hono";
import ForgotPasswordPage from "../../utils/components/ForgotPasswordPage";
import generateOTP from "../../utils/otp";
import { sendResetPassword, sendLink } from "../../controllers/email";
import { validateCode } from "../../authentication-flows/passwordless";
import { getUsersByEmail } from "../../utils/users";
import userIdGenerate from "../../utils/userIdGenerate";

// duplicated from /passwordless route
const CODE_EXPIRATION_TIME = 30 * 60 * 1000;

function initI18n(lng: string) {
  i18next.init({
    lng,
    resources: {
      en: { translation: en },
      it: { translation: it },
      nb: { translation: nb },
      sv: { translation: sv },
    },
  });
}

async function handleLogin(
  env: Env,
  user: User,
  session: UniversalLoginSession,
  ctx: Context<{ Bindings: Env }>,
) {
  if (session.authParams.redirect_uri) {
    const responseType =
      session.authParams.response_type ||
      AuthorizationResponseType.TOKEN_ID_TOKEN;

    const authResponse = await generateAuthResponse({
      env,
      tenantId: session.tenant_id,
      userId: user.id,
      sid: nanoid(),
      responseType,
      authParams: session.authParams,
      user,
    });

    const redirectUrl = getTokenResponseRedirectUri(
      authResponse,
      session.authParams,
    );

    return ctx.redirect(redirectUrl.href);
  }

  // This is just a fallback in case no redirect was present
  return renderMessage({
    ...session,
    page_title: "Logged in",
    message: "You are logged in",
  });
}

export const login = new OpenAPIHono<{ Bindings: Env }>()
  // --------------------------------
  // GET /u/login
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/login",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");

      const { env } = ctx;

      const session = await env.data.universalLoginSessions.get(state);
      if (!session) {
        throw new HTTPException(400, { message: "Session not found" });
      }

      const client = await getClient(env, session.authParams.client_id);
      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }

      const tenant = await env.data.tenants.get(client.tenant_id);
      if (!tenant) {
        throw new HTTPException(400, { message: "Tenant not found" });
      }

      const vendorSettings = await env.fetchVendorSettings(
        session.authParams.client_id,
      );

      initI18n(tenant.language || "sv");

      return ctx.html(<LoginPage vendorSettings={vendorSettings} />);
    },
  )
  // --------------------------------
  // POST /u/login
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/login",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
        body: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: z.object({
                username: z.string(),
                password: z.string(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { env } = ctx;
      const { state } = ctx.req.valid("query");
      const { username, password } = ctx.req.valid("form");

      const session = await env.data.universalLoginSessions.get(state);
      if (!session) {
        throw new HTTPException(400, { message: "Session not found" });
      }

      const client = await getClient(env, session.authParams.client_id);

      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }

      const vendorSettings = await env.fetchVendorSettings(
        session.authParams.client_id,
      );

      const user = await getUserByEmailAndProvider({
        userAdapter: env.data.users,
        tenant_id: client.tenant_id,
        email: username,
        provider: "auth2",
      });

      if (!user) {
        throw new HTTPException(400, { message: "User not found" });
      }

      try {
        const { valid } = await env.data.passwords.validate(client.tenant_id, {
          user_id: user.id,
          password: password,
        });

        if (!valid) {
          return ctx.html(
            <LoginPage
              vendorSettings={vendorSettings}
              error="Invalid password"
            />,
          );
        }

        return handleLogin(env, user, session, ctx);
      } catch (err: any) {
        return ctx.html(
          <LoginPage vendorSettings={vendorSettings} error={err.message} />,
        );
      }
    },
  )
  // --------------------------------
  // GET /u/reset-password
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/reset-password",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
          code: z.string().openapi({
            description: "The code parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");

      const { env } = ctx;

      const session = await env.data.universalLoginSessions.get(state);
      if (!session) {
        throw new HTTPException(400, { message: "Session not found" });
      }

      const client = await getClient(env, session.authParams.client_id);
      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }

      const tenant = await env.data.tenants.get(client.tenant_id);
      if (!tenant) {
        throw new HTTPException(400, { message: "Tenant not found" });
      }

      const vendorSettings = await env.fetchVendorSettings(
        // Note this will not be correct because in login2 we are styling based on vendor_id
        // the tenant IDs here are nanoids, where as the vendor ids in HQ are human readable albeit lower case
        // I figure we can worry about this as we do it and don't get styled flows
        session.authParams.client_id,
      );

      if (!session.authParams.username) {
        throw new HTTPException(400, { message: "Username required" });
      }
      initI18n(tenant.language || "sv");

      return ctx.html(
        <ResetPasswordPage
          vendorSettings={vendorSettings}
          email={session.authParams.username}
        />,
      );
    },
  )
  // --------------------------------
  // POST /u/reset-password
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/reset-password",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
          code: z.string().openapi({
            description: "The code parameter from the authorization request",
          }),
        }),
        body: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: z.object({
                password: z.string(),
                "re-enter-password": z.string(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state, code } = ctx.req.valid("query");
      const { password, "re-enter-password": reEnterPassword } =
        ctx.req.valid("form");

      const { env } = ctx;

      const session = await env.data.universalLoginSessions.get(state);
      if (!session) {
        throw new HTTPException(400, { message: "Session not found" });
      }

      const client = await getClient(env, session.authParams.client_id);
      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }

      const tenant = await env.data.tenants.get(client.tenant_id);
      if (!tenant) {
        throw new HTTPException(400, { message: "Tenant not found" });
      }

      initI18n(tenant.language || "sv");

      const tenantNameInVendorStyles = tenant.name.toLowerCase();

      const vendorSettings = await env.fetchVendorSettings(
        tenantNameInVendorStyles,
      );

      if (!session.authParams.username) {
        throw new HTTPException(400, { message: "Username required" });
      }

      if (password !== reEnterPassword) {
        return ctx.html(
          <ResetPasswordPage
            error="Passwords do not match"
            vendorSettings={vendorSettings}
            email={session.authParams.username}
          />,
          400,
        );
      }

      if (!validatePassword(password)) {
        return ctx.html(
          <ResetPasswordPage
            error="Password does not meet the requirements"
            vendorSettings={vendorSettings}
            email={session.authParams.username}
          />,
          400,
        );
      }

      // Note! we don't use the primary user here. Something to be careful of
      // this means the primary user could have a totally different email address
      const user = await getUserByEmailAndProvider({
        userAdapter: env.data.users,
        tenant_id: client.tenant_id,
        email: session.authParams.username,
        provider: "auth2",
      });

      if (!user) {
        throw new HTTPException(400, { message: "User not found" });
      }

      try {
        const codes = await env.data.codes.list(client.tenant_id, user.id);
        const foundCode = codes.find((storedCode) => storedCode.code === code);

        if (!foundCode) {
          // surely we should check this on the GET rather than have the user waste time entering a new password?
          // THEN we can assume here it works and throw a hono exception if it doesn't... because it's an issue with our system
          // ALTHOUGH the user could have taken a long time to enter the password...
          return ctx.html(
            <ResetPasswordPage
              error="Code not found or expired"
              vendorSettings={vendorSettings}
              email={session.authParams.username}
            />,
            400,
          );
        }

        await env.data.passwords.update(client.tenant_id, {
          user_id: user.id,
          password,
        });

        // we could do this on the GET...
        if (!user.email_verified) {
          await env.data.users.update(client.tenant_id, user.id, {
            email_verified: true,
          });
        }
      } catch (err) {
        // seems like we should not do this catch... try and see what happens
        return ctx.html(
          <ResetPasswordPage
            error="The password could not be reset"
            vendorSettings={vendorSettings}
            email={session.authParams.username}
          />,
          400,
        );
      }

      // need JSX success here
      return ctx.text("The password has been reset", 200);
    },
  )
  // --------------------------------
  // GET /u/forgot-password
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/forgot-password",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");

      const { env } = ctx;
      const session = await env.data.universalLoginSessions.get(state);
      if (!session) {
        throw new HTTPException(400, { message: "Session not found" });
      }

      const vendorSettings = await env.fetchVendorSettings(
        session.authParams.client_id,
      );

      return ctx.html(<ForgotPasswordPage vendorSettings={vendorSettings} />);
    },
  )
  // -------------------------------
  // POST /u/forgot-password
  // -------------------------------

  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/forgot-password",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
        body: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: z.object({
                username: z.string(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");
      const { username } = ctx.req.valid("form");

      const { env } = ctx;

      const session = await env.data.universalLoginSessions.get(state);
      if (!session) {
        throw new HTTPException(400, { message: "Session not found" });
      }

      const client = await getClient(env, session.authParams.client_id);
      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }

      if (session.authParams.username !== username) {
        session.authParams.username = username;
        await env.data.universalLoginSessions.update(session.id, session);
      }

      const user = await getUserByEmailAndProvider({
        userAdapter: env.data.users,
        tenant_id: client.tenant_id,
        email: username,
        provider: "auth2",
      });

      if (user) {
        const code = generateOTP();

        await env.data.codes.create(client.tenant_id, {
          id: nanoid(),
          code,
          type: "password_reset",
          user_id: user.id,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME).toISOString(),
        });

        // Get typescript errors here but works on the mgmt api users route...
        // ctx.set("log", `Code: ${code}`);

        await sendResetPassword(env, client, username, code, state);
      } else {
        console.log("User not found");
      }

      return ctx.html(
        renderMessage({
          ...session,
          page_title: "Password reset",
          message: "A code has been sent to your email address",
        }),
      );
    },
  )
  // --------------------------------
  // GET /u/code
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/code",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");

      const { env } = ctx;
      const session = await env.data.universalLoginSessions.get(state);
      if (!session) {
        throw new HTTPException(400, { message: "Session not found" });
      }

      const vendorSettings = await env.fetchVendorSettings(
        session.authParams.client_id,
      );

      return ctx.html(<LoginWithCodePage vendorSettings={vendorSettings} />);
    },
  )
  // --------------------------------
  // POST /u/code
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/code",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
        body: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: z.object({
                username: z.string(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");
      // backwards compatible to maintain pasted code
      const params = ctx.req.valid("form");

      const { env } = ctx;
      const session = await env.data.universalLoginSessions.get(state);
      if (!session) {
        throw new HTTPException(400, { message: "Session not found" });
      }

      const client = await getClient(env, session.authParams.client_id);

      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }

      const code = generateOTP();

      // fields in universalLoginSessions don't match fields in OTP
      const {
        audience,
        code_challenge_method,
        code_challenge,
        username,
        ...otpAuthParams
      } = session.authParams;

      await env.data.OTP.create({
        id: nanoid(),
        code,
        // is this a reasonable assumption?
        email: params.username,
        client_id: session.authParams.client_id,
        send: "code",
        authParams: otpAuthParams,
        tenant_id: client.tenant_id,
        created_at: new Date(),
        expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME),
      });

      // request.ctx.set("log", `Code: ${code}`);

      // Add the username to the state
      session.authParams.username = params.username;
      await env.data.universalLoginSessions.update(session.id, session);

      const magicLink = new URL(env.ISSUER);
      magicLink.pathname = "passwordless/verify_redirect";
      if (session.authParams.scope) {
        magicLink.searchParams.set("scope", session.authParams.scope);
      }
      if (session.authParams.response_type) {
        magicLink.searchParams.set(
          "response_type",
          session.authParams.response_type,
        );
      }
      if (session.authParams.redirect_uri) {
        magicLink.searchParams.set(
          "redirect_uri",
          session.authParams.redirect_uri,
        );
      }
      if (session.authParams.audience) {
        magicLink.searchParams.set("audience", session.authParams.audience);
      }
      if (session.authParams.state) {
        magicLink.searchParams.set("state", session.authParams.state);
      }
      if (session.authParams.nonce) {
        magicLink.searchParams.set("nonce", session.authParams.nonce);
      }

      magicLink.searchParams.set("connection", "email");
      magicLink.searchParams.set("client_id", session.authParams.client_id);
      magicLink.searchParams.set("email", session.authParams.username);
      magicLink.searchParams.set("verification_code", code);

      await sendLink(env, client, params.username, code, magicLink.href);

      return ctx.redirect(
        `/u/enter-code?state=${state}&username=${params.username}`,
      );
    },
  )
  // --------------------------------
  // GET /u/enter-code
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/enter-code",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");

      const { env } = ctx;
      const session = await env.data.universalLoginSessions.get(state);
      if (!session) {
        throw new HTTPException(400, { message: "Session not found" });
      }

      const vendorSettings = await env.fetchVendorSettings(
        session.authParams.client_id,
      );

      return ctx.html(<LoginEnterCodePage vendorSettings={vendorSettings} />);
    },
  )
  // --------------------------------
  // POST /u/enter-code
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/enter-code",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state",
          }),
        }),
        body: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: z.object({
                code: z.string(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");
      const { code } = ctx.req.valid("form");

      const { env } = ctx;
      const session = await env.data.universalLoginSessions.get(state);
      if (!session) {
        throw new HTTPException(400, { message: "Session not found" });
      }

      if (!session.authParams.username) {
        throw new HTTPException(400, {
          message: "Username not found in state",
        });
      }

      try {
        const user = await validateCode(env, {
          client_id: session.authParams.client_id,
          email: session.authParams.username,
          verification_code: code,
        });

        const authResponse = await generateAuthResponse({
          env,
          tenantId: session.tenant_id,
          userId: user.id,
          sid: nanoid(),
          responseType:
            session.authParams.response_type ||
            AuthorizationResponseType.TOKEN_ID_TOKEN,
          authParams: session.authParams,
          user,
        });

        const redirectUrl = getTokenResponseRedirectUri(
          authResponse,
          session.authParams,
        );

        return ctx.redirect(redirectUrl.href);
      } catch (err) {
        const vendorSettings = await env.fetchVendorSettings(
          session.authParams.client_id,
        );

        return ctx.html(
          <LoginEnterCodePage
            vendorSettings={vendorSettings}
            error="Invalid code"
          />,
        );
      }
    },
  )
  // --------------------------------
  // GET /u/signup
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/signup",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");
      const { env } = ctx;
      const session = await env.data.universalLoginSessions.get(state);
      if (!session) {
        throw new HTTPException(400, { message: "Session not found" });
      }

      const vendorSettings = await env.fetchVendorSettings(
        session.authParams.client_id,
      );

      // TODO - we need to go through and initialise i18n in all the routes...
      // we should have tests for this

      return ctx.html(<SignupPage vendorSettings={vendorSettings} />);
    },
  )
  // --------------------------------
  // POST /u/signup
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "post",
      path: "/signup",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
        }),
        body: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: z.object({
                username: z.string(),
                password: z.string(),
                // TODO - something like this
                // "re-enter-password": z.string(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");
      const loginParams = ctx.req.valid("form");
      const { env } = ctx;
      const session = await env.data.universalLoginSessions.get(state);
      if (!session) {
        throw new HTTPException(400, { message: "Session not found" });
      }

      const client = await getClient(env, session.authParams.client_id);
      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }

      if (session.authParams.username !== loginParams.username) {
        session.authParams.username = loginParams.username;
        await env.data.universalLoginSessions.update(session.id, session);
      }

      try {
        // TODO - filter by primary user
        let [user] = await getUsersByEmail(
          env.data.users,
          client.tenant_id,
          loginParams.username,
        );

        if (!user) {
          // Create the user if it doesn't exist
          user = await env.data.users.create(client.tenant_id, {
            id: `auth2|${userIdGenerate()}`,
            email: loginParams.username,
            name: loginParams.username,
            provider: "auth2",
            connection: "Username-Password-Authentication",
            email_verified: false,
            last_ip: "",
            login_count: 0,
            is_social: false,
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        await env.data.passwords.create(client.tenant_id, {
          user_id: user.id,
          password: loginParams.password,
        });

        // if (client.email_validation === "enforced") {
        //   // Update the username in the state
        //   await setLoginState(env, state, {
        //     ...loginState,
        //     authParams: {
        //       ...loginState.authParams,
        //       username: loginParams.username,
        //     },
        //   });

        //   return renderEmailValidation(env.AUTH_TEMPLATES, this, loginState);
        // }

        return handleLogin(env, user, session, ctx);
      } catch (err: any) {
        const vendorSettings = await env.fetchVendorSettings(
          session.authParams.client_id,
        );
        return ctx.html(
          <SignupPage vendorSettings={vendorSettings} error={err.message} />,
        );
      }
    },
  )
  // --------------------------------
  // GET /u/validate-email
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/validate-email",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
          code: z.string().openapi({
            description: "The code parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state, code } = ctx.req.valid("query");

      const { env } = ctx;

      const session = await env.data.universalLoginSessions.get(state);
      if (!session) {
        throw new HTTPException(400, { message: "Session not found" });
      }

      const email = session.authParams.username;
      if (!email) {
        throw new HTTPException(400, {
          message: "Username not found in state",
        });
      }

      const client = await getClient(env, session.authParams.client_id);
      if (!client) {
        throw new HTTPException(400, { message: "Client not found" });
      }

      const user = await getUserByEmailAndProvider({
        userAdapter: env.data.users,
        tenant_id: client.tenant_id,
        email,
        provider: "auth2",
      });
      if (!user) {
        throw new HTTPException(500, { message: "No user found" });
      }

      const codes = await env.data.codes.list(client.tenant_id, user.id);
      const foundCode = codes.find((storedCode) => storedCode.code === code);

      if (!foundCode) {
        throw new HTTPException(400, { message: "Code not found or expired" });
      }

      await env.data.users.update(client.tenant_id, user.id, {
        email_verified: true,
      });

      const usersWithSameEmail = await getUsersByEmail(
        env.data.users,
        client.tenant_id,
        email,
      );
      const usersWithSameEmailButNotUsernamePassword =
        usersWithSameEmail.filter((user) => user.provider !== "auth2");

      if (usersWithSameEmailButNotUsernamePassword.length > 0) {
        const primaryUsers = usersWithSameEmailButNotUsernamePassword.filter(
          (user) => !user.linked_to,
        );

        // these cases are currently not handled! if we think they're edge cases and we release this, we should at least inform datadog!
        if (primaryUsers.length > 1) {
          console.error("More than one primary user found for email", email);
        }

        if (primaryUsers.length === 0) {
          console.error("No primary user found for email", email);
          // so here we should ... hope there is only one usersWithSameEmailButNotUsernamePassword
          // and then follow that linked_to chain?
        }

        // now actually link this username-password user to the primary user
        if (primaryUsers.length === 1) {
          await env.data.users.update(client.tenant_id, user.id, {
            linked_to: primaryUsers[0].id,
          });
        }
      }

      // what should we actually do here?
      return ctx.text("email validated");
    },
  )

  // --------------------------------
  // GET /u/info
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["login"],
      method: "get",
      path: "/info",
      request: {
        query: z.object({
          state: z.string().openapi({
            description: "The state parameter from the authorization request",
          }),
          code: z.string().openapi({
            description: "The code parameter from the authorization request",
          }),
        }),
      },
      responses: {
        200: {
          description: "Response",
        },
      },
    }),

    async (ctx) => {
      return ctx.text(
        await renderMessage({
          page_title: "User info",
          message: `Not implemented`,
        }),
      );
    },
  );
