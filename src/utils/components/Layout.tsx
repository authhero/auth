import type { FC } from "hono/jsx";

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
        <div className="row min-h-full w-full overflow-hidden bg-cover bg-center text-sm sm:bg-fixed sm:bg-left-top">
          <div className="row-up-left w-[calc(100%-theme(space.2)-theme(space.2))] max-w-[1295px] !flex-nowrap sm:w-[calc(100%-theme(space.16)-theme(space.16))]">
            <div className="column-left w-full sm:w-auto">
              <div className="relative flex w-full flex-col rounded-2xl bg-white px-5 py-10 dark:bg-gray-800 dark:text-white sm:min-h-[700px] sm:max-w-md sm:px-14 sm:py-14 md:min-w-[448px] short:min-h-[558px] min-h-[calc(100vh-83px)]">
                {/* <div className="mb-16">
                    <AppLogo />
                  </div> */}
                <div className="flex flex-1 flex-col">
                  {children}
                  {/* <Footer vendorSettings={vendorSettings} /> */}
                </div>
              </div>

              <div className="flex w-full items-center px-6 pb-8 pt-4 justify-between">
                <div className="flex justify-center space-x-2 text-xs text-white sm:justify-normal md:text-xs">
                  <a
                    className="text-xs text-white hover:underline md:text-xs"
                    // href={supportUrl}
                    href="https://sesamy.com"
                  >
                    {t("contact_support")}
                  </a>
                  <span className="text-gray-300">|</span>{" "}
                  <span>copyright_sesamy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default Layout;
