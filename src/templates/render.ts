import { Controller } from "tsoa";
import { Liquid } from "liquidjs";
import { encode } from "../utils/base64";
import { LoginState } from "../types";

const engine = new Liquid();

async function getTemplate(bucket: R2Bucket, templateName: string) {
  let response = await bucket.get(`templates/${templateName}.liquid`);

  if (!response) {
    throw new Error("Template not found");
  }

  const templateString = await response.text();

  return engine.parse(templateString);
}

export async function renderForgotPassword(
  bucket: R2Bucket,
  controller: Controller,
  context: LoginState
) {
  const layoutTemplate = await getTemplate(bucket, "layout");

  const template = await getTemplate(bucket, "forgot-password");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const state = encode(JSON.stringify(context));
  const content = await engine.render(template, context);
  return engine.render(layoutTemplate, {
    ...context,
    state,
    content,
  });
}

export async function renderLogin(
  bucket: R2Bucket,
  controller: Controller,
  context: LoginState
) {
  const layoutTemplate = await getTemplate(bucket, "layout");

  const template = await getTemplate(bucket, "login");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const socialLoginQuery = new URLSearchParams();
  Object.keys(context.authParams).forEach((key) =>
    socialLoginQuery.set(key, context.authParams[key])
  );

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
  });

  return engine.render(layoutTemplate, {
    context,
    content,
  });
}

export async function renderLoginWithCode(
  bucket: R2Bucket,
  controller: Controller,
  context: LoginState
) {
  const layoutTemplate = await getTemplate(bucket, "layout");

  const template = await getTemplate(bucket, "code");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const content = await engine.render(template, context);

  return engine.render(layoutTemplate, {
    context,
    content,
  });
}

export async function renderEnterCode(
  bucket: R2Bucket,
  controller: Controller,
  context: LoginState
) {
  const layoutTemplate = await getTemplate(bucket, "layout");

  const template = await getTemplate(bucket, "enter-code");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const content = await engine.render(template, context);

  return engine.render(layoutTemplate, {
    context,
    content,
  });
}

export async function renderSignup(
  bucket: R2Bucket,
  controller: Controller,
  context: LoginState
) {
  const layoutTemplate = await getTemplate(bucket, "layout");

  const template = await getTemplate(bucket, "signup");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const content = await engine.render(template, context);
  return engine.render(layoutTemplate, {
    ...context,
    content,
  });
}

export async function renderMessage(
  bucket: R2Bucket,
  controller: Controller,
  context: LoginState | { page_title: string; message: string }
) {
  const layoutTemplate = await getTemplate(bucket, "layout");

  const template = await getTemplate(bucket, "message");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const content = await engine.render(template, context);
  return engine.render(layoutTemplate, {
    ...context,
    content,
  });
}

export async function renderResetPassword(
  bucket: R2Bucket,
  controller: Controller,
  context: LoginState
) {
  const layoutTemplate = await getTemplate(bucket, "layout");

  const template = await getTemplate(bucket, "reset-password");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const content = await engine.render(template, context);
  return engine.render(layoutTemplate, {
    ...context,
    content,
  });
}
