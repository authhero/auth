import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Env } from "../../types";
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
import { Liquid } from "liquidjs";
import { layout, message } from "../../templates/universal";

function initI18n(lng: string) {
  i18next.init({
    lng,
    debug: true,
    resources: {
      en: { translation: en },
      it: { translation: it },
      nb: { translation: nb },
      sv: { translation: sv },
    },
  });
}

const engine = new Liquid();

// temp cloned
async function renderMessage(
  env: Env,
  // controller: Controller,
  // context: UniversalLoginSession | { page_title: string; message: string },
  context: { page_title: string; message: string },
) {
  const layoutTemplate = engine.parse(layout);

  const template = engine.parse(message);

  // controller.setHeader("content-type", "text/html");
  // controller.setStatus(200);

  const content = await engine.render(template, context);
  return engine.render(layoutTemplate, {
    ...context,
    content,
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
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const { state } = ctx.req.valid("query");

      const { env } = ctx;

      const vendorSettings = {
        name: "Kvartal",
        companyName: "Kvartal",
        logoUrl: "https://checkout.sesamy.com/images/kvartal-logo.svg",
        style: {
          primaryColor: "#4F3985",
          buttonTextColor: "#ffffff",
          primaryHoverColor: "#5F44A0",
        },
        loginBackgroundImage:
          "https://assets.sesamy.com/vendors/kvartal/kvartal-bg.jpg",
        checkoutHideSocial: true,
        supportEmail: "support@kvartal.se",
        supportUrl: "https://kvartal.se/kundtjanst",
        siteUrl: "https://kvartal.se",
        termsAndConditionsUrl: "https://kvartal.se/kopvillkor/",
      };

      initI18n("sv");

      return ctx.html(
        <LoginPage
          vendorSettings={vendorSettings}
          email={"test@example.com"}
        />,
      );
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
        }),
      },
      security: [
        {
          Bearer: [],
        },
      ],
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
        }),
      },
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          description: "Response",
        },
      },
    }),
    async (ctx) => {
      const contentType = ctx.req.header("content-type");
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

      initI18n(tenant.language || "sv");

      const tenantNameInVendorStyles = tenant.name.toLowerCase();

      const vendorSettings = await env.fetchVendorSettings(
        tenantNameInVendorStyles,
      );

      if (
        contentType !== "application/json" &&
        contentType !== "application/x-www-form-urlencoded"
      ) {
        throw new HTTPException(400, {
          message:
            "Content-Type must be application/json or application/x-www-form-urlencoded",
        });
      }

      let password = "";
      let reEnterPassword = "";

      if (contentType === "application/json") {
        // in our tests we are POSTing up JSON, which previously worked
        const json = await ctx.req.json();
        password = json.password;
        reEnterPassword = json["re-enter-password"];
      }

      if (contentType === "application/x-www-form-urlencoded") {
        // but in the browser we are doing a POST with form data
        const body = await ctx.req.parseBody();

        const bodyPassword = body.password;
        const bodyReEnterPassword = body["re-enter-password"];
        if (
          typeof bodyPassword !== "string" ||
          typeof bodyReEnterPassword !== "string"
        ) {
          throw new HTTPException(400, {
            message: "Password must be a string",
          });
        }

        password = bodyPassword;
        reEnterPassword = bodyReEnterPassword;
      }

      const code = ctx.req.query("code");

      if (!password) {
        throw new HTTPException(400, { message: "Password required" });
      }
      if (!code) {
        throw new HTTPException(400, { message: "Code required" });
      }

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
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          description: "Response",
        },
      },
    }),

    async (ctx) => {
      return ctx.text(
        await renderMessage(ctx.env, {
          page_title: "User info",
          message: `Not implemented`,
        }),
      );
    },
  );
