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
  email: string;
};

const CODE_LENGTH = 6;

const LoginEnterCodePage: FC<Props> = ({ error, vendorSettings, email }) => {
  return (
    <Layout
      title={i18next.t("verify_your_email")}
      vendorSettings={vendorSettings}
    >
      <div class="mb-4 text-2xl font-medium">
        {i18next.t("verify_your_email")}
      </div>
      <div class="mb-8 text-gray-300">
        {/* 
          not sure how to do this in i18next. translation string looks like 
          "Please check your email at <0>{{email}}</0> and enter the six-digit code that we've sent you."
          I'm not sure if this is just a react-i18next thing or if it's possible with i18next...
        */}
        {/* <Trans
          i18nKey="we_sent_a_code_to"
          components={[
            <span className="text-black dark:text-white" key="span" />,
          ]}
          values={{ email }}
        /> */}
        {i18next
          .t("we_sent_a_code_to", {
            // email: `<span class="text-black dark:text-white">${email}</span>`,
            email,
          })
          // this strips out what may be react-i18next specific syntax
          .replace("<0>", "")
          .replace("</0>", "")}
      </div>
      <div class="flex flex-1 flex-col justify-center">
        <form method="post" class="pt-2">
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
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <div class="text-center sm:mt-2">
            <Button
            // how to do this without clientside JS?
            // disabled={when 6 digits are not entered}
            >
              {i18next.t("validate_code")}
            </Button>
          </div>
          <div class="my-4 flex space-x-2 text-sm text-[#B2B2B2]">
            <Icon className="text-base" name="info-bubble" />
            <div class="text-sm text-gray-300 md:text-sm">
              {i18next.t("sent_code_spam")}
            </div>
          </div>
          <a
            className="mx-auto block text-primary hover:text-primaryHover"
            href="javascript:history.go(-1)"
          >
            {i18next.t("go_back")}
          </a>
        </form>
      </div>
    </Layout>
  );
};

export default LoginEnterCodePage;
