import type { FC } from "hono/jsx";
import Layout from "./Layout";
import Button from "./Button";
import { VendorSettings } from "../../types";
import i18next from "i18next";
import cn from "classnames";
import Icon from "./Icon";
import ErrorMessage from "./ErrorMessage";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
};

// this page is called enter-email on login2... maybe we should copy those page names
const LoginWithCodePage: FC<Props> = ({ error, vendorSettings }) => {
  // TODO - get this from auth0header
  const sendType = "code";

  const loginDescriptionText =
    sendType === "code"
      ? i18next.t("login_description_code")
      : i18next.t("login_description_link");

  return (
    <Layout title="Login with Code" vendorSettings={vendorSettings}>
      <div class="mb-4 text-lg font-medium sm:text-2xl">
        {i18next.t("welcome")}
      </div>
      <div class="mb-8 text-gray-300">{loginDescriptionText}</div>
      <div class="flex flex-1 flex-col justify-center">
        <form method="post" className="mb-7">
          <input
            type="text"
            name="username"
            placeholder={i18next.t("email_placeholder")}
            className={cn(
              "mb-2 w-full rounded-lg border bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base",
              {
                "border-red": error,
                "border-gray-100 dark:border-gray-500": !error,
              },
            )}
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button className="text-base sm:mt-4 md:text-base">
            <div className="flex items-center space-x-2">
              <span>{i18next.t("continue")}</span>
              <Icon className="text-xs" name="arrow-right" />
            </div>
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default LoginWithCodePage;
