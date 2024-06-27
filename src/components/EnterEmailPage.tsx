import type { FC } from "hono/jsx";
import Layout from "./Layout";
import { VendorSettings, Client } from "../types";
import i18next from "i18next";
import cn from "classnames";
import Icon from "./Icon";
import ErrorMessage from "./ErrorMessage";
import SocialButton from "./SocialButton";
import Google from "./GoogleLogo";
import { UniversalLoginSession } from "../adapters/interfaces/UniversalLoginSession";
import { getSendParamFromAuth0ClientHeader } from "../utils/getSendParamFromAuth0ClientHeader";
import DisabledSubmitButton from "./DisabledSubmitButton";
import Form from "./Form";
import VippsLogo from "./VippsLogo";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
  session: UniversalLoginSession;
  email?: string;
  client: Client;
};

const EnterEmailPage: FC<Props> = ({
  error,
  vendorSettings,
  session,
  email,
  client,
}) => {
  const sendType = getSendParamFromAuth0ClientHeader(session.auth0Client);

  const connections = client.connections.map(({ name }) => name);
  const showFacebook = connections.includes("facebook");
  const showGoogle = connections.includes("google-oauth2");
  const showApple = connections.includes("apple");
  const showVipps = connections.includes("vipps");
  const anySocialLogin = showFacebook || showGoogle || showApple || showVipps;

  const loginDescriptionText =
    sendType === "code"
      ? i18next.t("login_description_code")
      : i18next.t("login_description_link");

  return (
    <Layout title={i18next.t("welcome")} vendorSettings={vendorSettings}>
      <div class="mb-4 text-lg font-medium sm:text-2xl">
        {i18next.t("welcome")}
      </div>
      <div class="mb-8 text-gray-300">{loginDescriptionText}</div>
      <div class="flex flex-1 flex-col justify-center">
        <Form className="mb-7">
          <input
            type="email"
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
            value={email || ""}
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <DisabledSubmitButton className="text-base sm:mt-4 md:text-base">
            <div className="flex items-center space-x-2">
              <span>{i18next.t("continue")}</span>
              <Icon className="text-xs" name="arrow-right" />
            </div>
          </DisabledSubmitButton>
        </Form>
        {anySocialLogin && (
          <div class="relative mb-5 block text-center text-gray-300 dark:text-gray-300">
            <div class="absolute left-0 right-0 top-1/2 border-b border-gray-200 dark:border-gray-600" />
            <div class="relative inline-block bg-white px-2 dark:bg-gray-800">
              {i18next.t("continue_social_login")}
            </div>
          </div>
        )}
        <div class="flex space-x-4 sm:flex-col sm:space-x-0 sm:space-y-4 short:flex-row short:space-x-4 short:space-y-0">
          {showFacebook && (
            <SocialButton
              connection="facebook"
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
          )}
          {showGoogle && (
            <SocialButton
              connection="google-oauth2"
              text={i18next.t("continue_with", { provider: "Google" })}
              canResize={true}
              icon={
                <Google className="h-5 w-5 sm:absolute sm:left-4 sm:top-1/2 sm:h-6 sm:w-6 sm:-translate-y-1/2 short:static short:left-auto short:top-auto short:h-5 short:w-5 short:translate-y-0" />
              }
              session={session}
            />
          )}
          {showApple && (
            <SocialButton
              connection="apple"
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
          )}
          {showVipps && (
            <SocialButton
              connection="vipps"
              text={i18next.t("continue_with", { provider: "Vipps" })}
              canResize={true}
              icon={
                <VippsLogo className="h-5 w-5 sm:absolute sm:left-4 sm:top-1/2 sm:h-6 sm:w-6 sm:-translate-y-1/2 short:static short:left-auto short:top-auto short:h-5 short:w-5 short:translate-y-0" />
              }
              session={session}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EnterEmailPage;
