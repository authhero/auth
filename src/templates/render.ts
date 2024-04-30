import { Controller } from "tsoa";
import { Liquid } from "liquidjs";
import { UniversalLoginSession } from "../adapters/interfaces/UniversalLoginSession";
import { Env } from "../types";
import {
  layout,
  forgotPassword,
  login,
  emailValidation,
  code,
  enterCode,
  signup,
  message,
} from "./universal";

const engine = new Liquid();

export async function renderForgotPassword(
  context: UniversalLoginSession,
  state: string,
): Promise<string> {
  const layoutTemplate = engine.parse(layout);

  const template = engine.parse(forgotPassword);

  const content = await engine.render(template, { ...context, state });
  return engine.render(layoutTemplate, {
    ...context,
    state, // seems inconsistent doing this here... does it need doing in both places?
    content,
  });
}

export async function renderLogin(
  context: UniversalLoginSession,
  state: string,
  errorMessage?: string,
) {
  const layoutTemplate = engine.parse(layout);

  const template = engine.parse(login);

  const socialLoginQuery = new URLSearchParams({
    ...context.authParams,
  });

  // TODO: pull from client instead
  const connections = [
    {
      connection: "apple",
      href: `/authorize?connection=apple&${socialLoginQuery.toString()}`,
      icon_class: "apple",
      bg_class: "bg1",
    },
    {
      connection: "facebook",
      href: `/authorize?connection=facebook&${socialLoginQuery.toString()}`,
      icon_class: "facebook",
      bg_class: "bg2",
    },
    {
      connection: "google-oauth2",
      href: `/authorize?connection=google-oauth2&${socialLoginQuery.toString()}`,
      icon_class: "google",
      bg_class: "bg3",
    },
  ];

  const content = await engine.render(template, {
    ...context,
    connections,
    errorMessage,
    state,
  });

  // Liquid JS returns any here! typeScript did not pick up the issue
  const renderedLogin: string = await engine.render(layoutTemplate, {
    context,
    content,
  });

  return renderedLogin;
}

export async function renderLoginWithCode(context: UniversalLoginSession) {
  const layoutTemplate = engine.parse(layout);

  const template = engine.parse(code);

  const content = await engine.render(template, context);

  return engine.render(layoutTemplate, {
    context,
    content,
  });
}

export async function renderEnterCode(
  context: UniversalLoginSession,
  errorMessage?: string,
) {
  const layoutTemplate = engine.parse(layout);

  const template = engine.parse(enterCode);

  const content = await engine.render(template, {
    ...context,
    errorMessage,
  });

  return engine.render(layoutTemplate, {
    context,
    content,
  });
}

export async function renderEmailValidation(
  env: Env,
  controller: Controller,
  context: UniversalLoginSession,
  errorMessage?: string,
) {
  const layoutTemplate = engine.parse(layout);

  const template = engine.parse(emailValidation);

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const content = await engine.render(template, { ...context, errorMessage });

  return engine.render(layoutTemplate, {
    context,
    content,
  });
}

export async function renderSignup(
  env: Env,
  controller: Controller,
  context: UniversalLoginSession,
  state: string,
  errorMessage?: string,
) {
  const layoutTemplate = engine.parse(layout);

  const template = engine.parse(signup);

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const content = await engine.render(template, { ...context, errorMessage });
  return engine.render(layoutTemplate, {
    ...context,
    content,
  });
}

export async function renderMessage(
  env: Env,
  controller: Controller,
  context: UniversalLoginSession | { page_title: string; message: string },
) {
  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  return renderMessageInner(context);
}

export async function renderMessageInner(
  context: UniversalLoginSession | { page_title: string; message: string },
) {
  const layoutTemplate = engine.parse(layout);

  const template = engine.parse(message);

  const content = await engine.render(template, context);
  return engine.render(layoutTemplate, {
    ...context,
    content,
  });
}
