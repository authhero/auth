import type { FC } from "hono/jsx";
import Layout from "./Layout";
import Button from "./Button";
import { VendorSettings, Env, Client } from "../types";
import i18next from "i18next";
import cn from "classnames";
import Icon from "./Icon";
import ErrorMessage from "./ErrorMessage";
import DisabledSubmitButton from "./DisabledSubmitButton";
import Form from "./Form";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
  email: string;
  state: string;
  client: Client;
};

const CODE_LENGTH = 6;

const EnterCodePage: FC<Props> = ({
  error,
  vendorSettings,
  email,
  state,
  client,
}) => {
  const i18nText = i18next.t("we_sent_a_code_to", { email });
  const startText = i18nText.slice(0, i18nText.indexOf("<0>"));
  const endText = i18nText.slice(i18nText.indexOf("</0>") + 4);

  const passwordLoginLinkParams = new URLSearchParams({
    state,
  });

  const connections = client.connections.map(({ name }) => name);
  const showPasswordLogin = connections.includes("auth2");

  return (
    <Layout
      title={i18next.t("verify_your_email")}
      vendorSettings={vendorSettings}
    >
      <div class="mb-4 text-2xl font-medium">
        {i18next.t("verify_your_email")}
      </div>
      <div class="mb-8 text-gray-300">
        {startText}
        <span class="text-black dark:text-white">{email}</span>
        {endText}
      </div>
      <div class="flex flex-1 flex-col justify-center">
        <Form className="pt-2">
          <input
            autoFocus
            type="text"
            pattern="[0-9]*"
            maxLength={CODE_LENGTH}
            inputMode="numeric"
            name="code"
            placeholder="******"
            class={cn(
              "mb-2 w-full rounded-lg border bg-gray-100 px-4 pb-2 pt-2.5 text-center indent-[5px] font-mono text-3xl placeholder:text-gray-300 dark:bg-gray-600 md:text-3xl",
              {
                "border-red": error,
                "border-gray-100 dark:border-gray-500": !error,
              },
            )}
            minLength={CODE_LENGTH}
            required
            id="code-input"
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <div class="text-center sm:mt-2">
            <DisabledSubmitButton>
              {i18next.t("validate_code")}
            </DisabledSubmitButton>
          </div>
          <div class="my-4 flex space-x-2 text-sm text-[#B2B2B2]">
            <Icon className="text-base" name="info-bubble" />
            <div class="text-sm text-gray-300 md:text-sm">
              {i18next.t("sent_code_spam")}
            </div>
          </div>
          {showPasswordLogin && (
            <div className="text-center mb-12">
              <div className="relative mb-5 block text-center text-gray-300 dark:text-gray-300">
                <div className="absolute left-0 right-0 top-1/2 border-b border-gray-200 dark:border-gray-600" />
                <div className="relative inline-block bg-white px-2 dark:bg-gray-800">
                  {i18next.t("or")}
                </div>
              </div>
              <Button
                Component="a"
                href={`/u/login?${passwordLoginLinkParams.toString()}`}
                variant="secondary"
                className="block"
              >
                {i18next.t("enter_your_password_btn")}
              </Button>
            </div>
          )}
          <a
            className="block text-primary hover:text-primaryHover text-center"
            // TODO - when we release password login, "back" might mean going back to the password login page
            href={`/u/code?${passwordLoginLinkParams.toString()}`}
          >
            {i18next.t("go_back")}
          </a>
        </Form>
      </div>
    </Layout>
  );
};

export default EnterCodePage;
