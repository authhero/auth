import { Controller } from "tsoa";
import { Liquid } from "liquidjs";
import { encode } from "../utils/base64";

const engine = new Liquid();

async function getTemplate(bucket: R2Bucket, templateName: string) {
  let response = await bucket.get(`templates/${templateName}.liquid`);

  if (!response) {
    throw new Error("Template not found");
  }

  const templateString = await response.text();

  return engine.parse(templateString);
}

export async function renderAuthIframe(
  bucket: R2Bucket,
  controller: Controller,
  context: { targetOrigin: string; state: string }
) {
  const template = await getTemplate(bucket, "auth-iframe");

  controller.setHeader("content-type", "text/html");
  controller.setStatus(200);

  return engine.render(template, context);
}

export async function renderForgotPassword(
  bucket: R2Bucket,
  controller: Controller,
  context: {
    username?: string;
    clientId: string;
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
  username?: string;
  clientId: string;
  errorMessage?: string;
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

  const state = encode(JSON.stringify(context));
  const content = await engine.render(template, { ...context, state });
  return engine.render(layoutTemplate, {
    ...context,
    content,
  });
}

export interface RenderSignupContext {
  username?: string;
  clientId: string;
  state: string;
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
  clientId: string;
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
