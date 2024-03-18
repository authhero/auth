import type { FC } from "hono/jsx";
import { Context } from "hono";
import { Var } from "../types/Var";
import { Env } from "../types/Env";
// import {html} from "hono/jsx";
import { html } from "hono/html";

const ReactThing: FC<{}> = (props: {}) => {
  return (
    <html>
      <body>
        <h1>Hello Hono!</h1>
        <p>this is JSX</p>
      </body>
    </html>
  );
};

export async function renderReactThing(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
) {
  // cannot do this! need to return string
  // return ctx.html(<p>Hello world</p>);

  // this just renders a string in quotes
  // return html`<p>Hello world</p>`;

  // try using actual react components
  // return ctx.html(<ReactThing />);

  // just renders a string. no knowledge of HTML
  return html`<ReactThing />`;
}
