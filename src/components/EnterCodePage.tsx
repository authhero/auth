import type { FC, JSXNode } from "hono/jsx";
import Layout from "./Layout";
import Button from "./Button";
import i18next from "i18next";
import cn from "classnames";
import Icon from "./Icon";
import ErrorMessage from "./ErrorMessage";
import DisabledSubmitButton from "./DisabledSubmitButton";
import Form from "./Form";
import { GoBack } from "./GoBack";
import { Client, VendorSettings } from "@authhero/adapter-interfaces";
import Trans from "./Trans";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
  email: string;
  state: string;
  client: Client;
  hasPasswordLogin: boolean;
};

const CODE_LENGTH = 6;

const EnterCodePage: FC<Props> = ({
  error,
  vendorSettings,
  email,
  state,
  client,
  hasPasswordLogin,
}) => {
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
        <Trans
          i18nKey="we_sent_a_code_to"
          components={[
            (
              <span className="text-black dark:text-white" key="span" />
            ) as unknown as JSXNode,
          ]}
          values={{ email }}
        />
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
            <DisabledSubmitButton className="text-base sm:mt-4 md:text-base">
              <div className="flex items-center space-x-2">
                <span>{i18next.t("login")}</span>
                <Icon className="text-xs" name="arrow-right" />
              </div>
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
                href={`/u/${hasPasswordLogin ? "enter-password" : "pre-signup"}?${passwordLoginLinkParams.toString()}`}
                variant="secondary"
                className="block"
              >
                {i18next.t("enter_your_password_btn")}
              </Button>
            </div>
          )}
        </Form>
        <GoBack state={state} />
      </div>
    </Layout>
  );
};

export default EnterCodePage;
