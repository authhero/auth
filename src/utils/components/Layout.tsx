import type { FC } from "hono/jsx";
import { Context } from "hono";
import { Var } from "../../types/Var";
import { Env } from "../../types/Env";

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

export default Layout;
