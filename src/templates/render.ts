import { Liquid } from "liquidjs";
import { UniversalLoginSession } from "../adapters/interfaces/UniversalLoginSession";
import { layout, message } from "./universal";

const engine = new Liquid();

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
