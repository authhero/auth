import { Controller } from "tsoa";
import { Liquid } from "liquidjs";
import { UniversalLoginSession } from "../adapters/interfaces/UniversalLoginSession";
import { Env } from "../types";

const engine = new Liquid();

async function getTemplate(env: Env, templateName: string) {
  let templateString = await env.data.templates.get(templateName);
  if (!templateString) {
    throw new Error(`Template ${templateName} not found`);
  }

  return engine.parse(templateString);
}

export async function renderForgotPassword(
  env: Env,
  controller: Controller,
  context: UniversalLoginSession,
  state: string,
) {
  const layoutTemplate = await getTemplate(env, "layout");

  const template = await getTemplate(env, "forgot-password");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const content = await engine.render(template, context);
  return engine.render(layoutTemplate, {
    ...context,
    state,
    content,
  });
}

export async function renderLogin(
  env: Env,
  controller: Controller,
  context: UniversalLoginSession,
  errorMessage?: string,
) {
  const layoutTemplate = await getTemplate(env, "layout");

  const template = await getTemplate(env, "login");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const socialLoginQuery = new URLSearchParams();
  Object.keys(context.authParams)
    .filter((key) => context.authParams[key])
    .forEach((key) => socialLoginQuery.set(key, context.authParams[key]));

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
  });

  return engine.render(layoutTemplate, {
    context,
    content,
  });
}

export async function renderLoginWithCode(
  env: Env,
  controller: Controller,
  context: UniversalLoginSession,
) {
  const layoutTemplate = await getTemplate(env, "layout");

  const template = await getTemplate(env, "code");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const content = await engine.render(template, context);

  return engine.render(layoutTemplate, {
    context,
    content,
  });
}

export async function renderEnterCode(
  env: Env,
  controller: Controller,
  context: UniversalLoginSession,
  errorMessage?: string,
) {
  const layoutTemplate = await getTemplate(env, "layout");

  const template = await getTemplate(env, "enter-code");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

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
  const layoutTemplate = await getTemplate(env, "layout");

  const template = await getTemplate(env, "email-validation");

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
  errorMessage?: string,
) {
  const layoutTemplate = await getTemplate(env, "layout");

  const template = await getTemplate(env, "signup");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const content = await engine.render(template, context);
  return engine.render(layoutTemplate, {
    ...context,
    content,
    errorMessage,
  });
}

export async function renderMessage(
  env: Env,
  controller: Controller,
  context: UniversalLoginSession | { page_title: string; message: string },
) {
  const layoutTemplate = await getTemplate(env, "layout");

  const template = await getTemplate(env, "message");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const content = await engine.render(template, context);
  return engine.render(layoutTemplate, {
    ...context,
    content,
  });
}

export async function renderResetPassword(
  env: Env,
  controller: Controller,
  context: UniversalLoginSession,
) {
  const layoutTemplate = await getTemplate(env, "layout");

  const template = await getTemplate(env, "reset-password");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const content = await engine.render(template, context);
  return engine.render(layoutTemplate, {
    ...context,
    content,
  });
}
