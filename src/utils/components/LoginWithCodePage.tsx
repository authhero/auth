import type { FC } from "hono/jsx";
import Layout from "./Layout";
import Button from "./Button";
import { VendorSettings } from "../../types";
import i18next from "i18next";
import cn from "classnames";
import Icon from "./Icon";
import ErrorMessage from "./ErrorMessage";
import SocialButton from "./SocialButton";
import Google from "./GoogleLogo";
import { UniversalLoginSession } from "../../adapters/interfaces/UniversalLoginSession";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
  session: UniversalLoginSession;
};

// this page is called enter-email on login2... maybe we should copy those page names
const LoginWithCodePage: FC<Props> = ({ error, vendorSettings, session }) => {
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
            required
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button className="text-base sm:mt-4 md:text-base">
            <div className="flex items-center space-x-2">
              <span>{i18next.t("continue")}</span>
              <Icon className="text-xs" name="arrow-right" />
            </div>
          </Button>
        </form>
        <div class="relative mb-5 block text-center text-gray-300 dark:text-gray-300">
          <div class="absolute left-0 right-0 top-1/2 border-b border-gray-200 dark:border-gray-600" />
          <div class="relative inline-block bg-white px-2 dark:bg-gray-800">
            {i18next.t("continue_social_login")}
          </div>
        </div>

        <div class="flex space-x-4 sm:flex-col sm:space-x-0 sm:space-y-4 short:flex-row short:space-x-4 short:space-y-0">
          <SocialButton
            social="facebook"
            text={i18next.t("continue_with", { provider: "Facebook" })}
            canResize={true}
            icon={
              <Icon
                className="text-xl text-[#1196F5] sm:absolute sm:left-4 sm:top-1/2 sm:-translate-y-1/2 sm:text-2xl short:static short:left-auto short:top-auto short:translate-y-0 short:text-xl"
                name="facebook"
              />
            }
            session={session}
          />
          <SocialButton
            social="google"
            text={i18next.t("continue_with", { provider: "Google" })}
            canResize={true}
            icon={
              <Google className="h-5 w-5 sm:absolute sm:left-4 sm:top-1/2 sm:h-6 sm:w-6 sm:-translate-y-1/2 short:static short:left-auto short:top-auto short:h-5 short:w-5 short:translate-y-0" />
            }
            session={session}
          />
          <SocialButton
            social="apple"
            text={i18next.t("continue_with", { provider: "Apple" })}
            canResize={true}
            icon={
              <Icon
                className="text-xl text-black dark:text-white sm:absolute sm:left-4 sm:top-1/2 sm:-translate-y-1/2 sm:text-2xl short:static short:left-auto short:top-auto short:translate-y-0 short:text-xl"
                name="apple"
              />
            }
            session={session}
          />
        </div>
      </div>
    </Layout>
  );
};

export default LoginWithCodePage;
