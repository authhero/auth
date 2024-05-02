import { Liquid } from "liquidjs";
import { UniversalLoginSession } from "../adapters/interfaces/UniversalLoginSession";
import {
  layout,
  forgotPassword,
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

export async function renderSignup(
  context: UniversalLoginSession,
  errorMessage?: string,
) {
  const layoutTemplate = engine.parse(layout);

  const template = engine.parse(signup);

  const content = await engine.render(template, { ...context, errorMessage });
  return engine.render(layoutTemplate, {
    ...context,
    content,
  });
}

export async function renderMessage(
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
