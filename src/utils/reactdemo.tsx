import type { FC } from "hono/jsx";
import { Context } from "hono";
import { Var } from "../types/Var";
import { Env } from "../types/Env";

const Layout: FC<{ title: string }> = ({ title, children }) => {
  return (
    <html lang="en">
      <head>
        <title>{title}</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta name="robots" content="noindex, follow" />

        <link
          rel="stylesheet"
          type="text/css"
          href="/static/stylesheets/font-awesome.min.css"
        />
        <link
          rel="stylesheet"
          type="text/css"
          href="/static/stylesheets/material-design-iconic-font.min.css"
        />

        <link
          rel="stylesheet"
          type="text/css"
          href="/static/stylesheets/main.css"
        />
        <link
          rel="stylesheet"
          type="text/css"
          href="/static/stylesheets/util.css"
        />
      </head>

      <body>
        <div
          class="container-login100"
          style="background-image: url('/static/images/bg-01.webp');"
        >
          {children}
        </div>
      </body>
    </html>
  );
};

const ResetPasswordPage: FC<{}> = (props: {}) => {
  return (
    <html>
      <body>
        <div class="wrap-login100 p-l-55 p-r-55 p-t-65 p-b-54">
          <form class="login100-form validate-form" method="post">
            <span class="login100-form-title p-b-49">Change password</span>
            <div class="wrap-input100 validate-input m-b-23">
              <span class="label-input100">
                New password - at some point we'll add a second confirmation one
                AND we need to tell the user it has to have whatever rules we
                specify... OR we just echo back error messages from auth2 in
                HTML
              </span>
              <input
                class="input100"
                type="text"
                name="password"
                placeholder="Type your password"
                value="{{password}}"
                required
              />
              <span class="focus-input100" data-symbol=""></span>
            </div>
            {/* TODO */}
            {/* <div>{{ errorMessage }}</div> */}
            <div class="container-login100-form-btn">
              <div class="wrap-login100-form-btn">
                <div class="login100-form-bgbtn"></div>
                <button class="login100-form-btn">Change password</button>
              </div>
            </div>
          </form>
        </div>
      </body>
    </html>
  );
};

export async function renderReactThing(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
) {
  // we could make app.ts into app.tsx and render the JSX there directly...
  // I figure we should have a JSX-only file that adds lots of routes?
  return ctx.html(<ResetPasswordPage />);
}
