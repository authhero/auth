import { Controller } from "tsoa";
import { Liquid } from "liquidjs";
import { encode } from "../utils/base64";
import { AuthParams } from "../types";

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
  context: {
    username?: string;
    client_id: string;
    state: string;
  }
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

export interface RenderLoginContext {
  authParams: AuthParams;
  username?: string;
  errorMessage?: string;
  connection?: string;
}

export async function renderLogin(
  bucket: R2Bucket,
  controller: Controller,
  context: RenderLoginContext
) {
  const layoutTemplate = await getTemplate(bucket, "layout");

  const template = await getTemplate(bucket, "login");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  const socialLoginQuery = new URLSearchParams();
  Object.keys(context.authParams).forEach((key) =>
    socialLoginQuery.set(key, context.authParams[key])
  );

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
    ...context.authParams,
    connections,
  });

  return engine.render(layoutTemplate, {
    ...context,
    content,
  });
}

export interface RenderSignupContext {
  username?: string;
  client_id: string;
  state: string;
  errorMessage?: string;
}

export async function renderSignup(
  bucket: R2Bucket,
  controller: Controller,
  context: RenderSignupContext
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

export interface RenderMessageContext {
  page_title: string;
  message: string;
}

export async function renderMessage(
  bucket: R2Bucket,
  controller: Controller,
  context: RenderMessageContext
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

export interface RenderResetPasswordContext {
  username: string;
  code: string;
  state: string;
  client_id: string;
  errorMessage?: string;
}

export async function renderResetPassword(
  bucket: R2Bucket,
  controller: Controller,
  context: RenderResetPasswordContext
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
