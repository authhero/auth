import { test, expect } from "vitest";
import { SesamyPasswordLoginSelection } from "../../../src/utils/authCookies";
import { getTestServer } from "../helpers/test-server";
import { testClient } from "hono/testing";
import cookie from "cookie";
import {
  AuthorizationResponseType,
  LoginInsert,
} from "@authhero/adapter-interfaces";

const SESSION_FIXTURE: LoginInsert = {
  expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  authParams: {
    client_id: "clientId",
    response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
    scope: "openid",
    redirect_uri: "http://localhost:3000/callback",
    state: "state",
    username: "test@example.com",
  },
};

test("after entering email should go to enter code step if no cookie set", async () => {
  const { oauthApp, env } = await getTestServer();
  const oauthClient = testClient(oauthApp, env);

  // shortcut instead of visiting the /authorize endpoint
  const session = await env.data.logins.create("tenantId", SESSION_FIXTURE);

  const enterEmailResponse = await oauthClient.u["enter-email"].$post({
    query: { state: session.login_id },
    form: {
      username: "test@example.com",
    },
  });

  const enterEmailResponseLocation = enterEmailResponse.headers.get("location");

  // this is the default functionality
  expect(enterEmailResponseLocation!.startsWith("/u/enter-code")).toBeTruthy();
});

test("after entering email should go to enter code step if code cookie is set", async () => {
  const { oauthApp, env } = await getTestServer();
  const oauthClient = testClient(oauthApp, env);

  const session = await env.data.logins.create("tenantId", SESSION_FIXTURE);

  const enterEmailResponse = await oauthClient.u["enter-email"].$post(
    {
      query: { state: session.login_id },
      form: {
        username: "test@example.com",
      },
    },
    {
      headers: {
        cookie: "sesamy-password-login-selection-clientId=code",
      },
    },
  );

  const enterEmailResponseLocation = enterEmailResponse.headers.get("location");

  // this is the default functionality
  expect(enterEmailResponseLocation!.startsWith("/u/enter-code")).toBeTruthy();
});

test("after entering email should go to enter password step if password cookie is set", async () => {
  const { oauthApp, env } = await getTestServer();
  const oauthClient = testClient(oauthApp, env);

  const session = await env.data.logins.create("tenantId", SESSION_FIXTURE);

  const enterEmailResponse = await oauthClient.u["enter-email"].$post(
    {
      query: { state: session.login_id },
      form: {
        username: "foo@example.com",
      },
    },
    {
      headers: {
        cookie: "sesamy-password-login-selection-clientId=password",
      },
    },
  );

  const enterEmailResponseLocation = enterEmailResponse.headers.get("location");

  expect(
    enterEmailResponseLocation!.startsWith("/u/enter-password"),
  ).toBeTruthy();
});

test("after entering email should go to enter code step if password cookie is set but no password user is available", async () => {
  const { oauthApp, env } = await getTestServer();
  const oauthClient = testClient(oauthApp, env);

  const session = await env.data.logins.create("tenantId", SESSION_FIXTURE);

  const enterEmailResponse = await oauthClient.u["enter-email"].$post(
    {
      query: { state: session.login_id },
      form: {
        username: "test@example.com",
      },
    },
    {
      headers: {
        cookie: "sesamy-password-login-selection-clientId=password",
      },
    },
  );

  const enterEmailResponseLocation = enterEmailResponse.headers.get("location");

  expect(enterEmailResponseLocation!.startsWith("/u/enter-code")).toBeTruthy();
});

test("after entering email should go to enter code step if password cookie is set BUT have posted up login_selection code override", async () => {
  const { oauthApp, env } = await getTestServer();
  const oauthClient = testClient(oauthApp, env);

  const session = await env.data.logins.create("tenantId", SESSION_FIXTURE);

  const enterEmailResponse = await oauthClient.u["enter-email"].$post(
    {
      query: { state: session.login_id },
      form: {
        username: "test@example.com",
        // this is the override
        login_selection: SesamyPasswordLoginSelection.code,
      },
    },
    {
      headers: {
        cookie: "sesamy-password-login-selection-clientId=password",
      },
    },
  );

  const enterEmailResponseLocation = enterEmailResponse.headers.get("location");

  expect(enterEmailResponseLocation!.startsWith("/u/enter-code")).toBeTruthy();
});

test("should set cookie as code when visit enter code page", async () => {
  const { oauthApp, env } = await getTestServer();
  const oauthClient = testClient(oauthApp, env);

  const session = await env.data.logins.create("tenantId", SESSION_FIXTURE);

  const enterCodeForm = await oauthClient.u["enter-code"].$get({
    query: { state: session.login_id },
  });
  expect(enterCodeForm.status).toBe(200);

  const cookies = cookie.parse(enterCodeForm.headers.get("set-cookie")!);

  // check we are setting this here
  expect(cookies["sesamy-password-login-selection-clientId"]).toBe("code");
});

test("should set cookie as password when visit password page", async () => {
  const { oauthApp, env } = await getTestServer();
  const oauthClient = testClient(oauthApp, env);

  // shortcut instead of visiting the /authorize endpoint
  const session = await env.data.logins.create("tenantId", SESSION_FIXTURE);

  const enterPasswordForm = await oauthClient.u["enter-password"].$get({
    query: {
      state: session.login_id,
    },
  });
  expect(enterPasswordForm.status).toBe(200);

  const cookies = cookie.parse(enterPasswordForm.headers.get("set-cookie")!);

  // check we are setting this here
  expect(cookies["sesamy-password-login-selection-clientId"]).toBe("password");
});
