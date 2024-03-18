import type { FC } from "hono/jsx";
import { Context } from "hono";
import { Var } from "../types/Var";
import { Env } from "../types/Env";

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
  return ctx.html(<ReactThing />);
}
