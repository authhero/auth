import { Context } from "hono";
import { Env } from "../../types";
import { Var } from "../../types/Var";
import ResetPasswordPage from "../../utils/components/ResetPasswordPage";
import validatePassword from "../../utils/validatePassword";
import { getUserByEmailAndProvider } from "../../utils/users";
import { getClient } from "../../services/clients";
import { HTTPException } from "hono/http-exception";
import { VendorSettings } from "../../types";

export async function getResetPassword(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
) {
  const state = ctx.req.query("state");
  if (!state) {
    throw new HTTPException(400, { message: "State required" });
  }

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

  // fetch from https://api.sesamy.dev/profile/vendors/{tenant_id}/style

  // getting weird!
  const tenantNameInVendorStyles = tenant.name.toLowerCase();
  const vendorSettings = await env.fetchVendorSettings(
    tenantNameInVendorStyles,
  );

  return ctx.html(<ResetPasswordPage vendorSettings={vendorSettings} />);
}

export async function postResetPassword(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
) {
  const contentType = ctx.req.header("content-type");

  const state = ctx.req.query("state");
  if (!state) {
    throw new HTTPException(400, { message: "State required" });
  }

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
      throw new HTTPException(400, { message: "Password must be a string" });
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

  if (password !== reEnterPassword) {
    return ctx.html(
      <ResetPasswordPage
        error="Passwords do not match"
        vendorSettings={vendorSettings}
      />,
      400,
    );
  }

  if (!validatePassword(password)) {
    return ctx.html(
      <ResetPasswordPage
        error="Password does not meet the requirements"
        vendorSettings={vendorSettings}
      />,
      400,
    );
  }

  if (!session.authParams.username) {
    throw new HTTPException(400, { message: "Username required" });
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
      />,
      400,
    );
  }

  // need JSX success here
  return ctx.text("The password has been reset", 200);
}
