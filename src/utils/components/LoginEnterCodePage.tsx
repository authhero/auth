import type { FC } from "hono/jsx";
import Layout from "./Layout";
import Button from "./Button";
import { VendorSettings } from "../../types";
import i18next from "i18next";
import cn from "classnames";

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
            className={cn(
              "mb-2 w-full rounded-lg border bg-gray-100 px-4 pb-2 pt-2.5 text-center indent-[5px] font-mono text-3xl placeholder:text-gray-300 dark:bg-gray-600 md:text-3xl",
              {
                "border-red": error,
                "border-gray-100 dark:border-gray-500": !error,
              },
            )}
          />
          {error && <em class="mb-2 bg-red">{error}</em>}
          <Button>{i18next.t("validate_code")}</Button>
        </form>
      </div>
    </Layout>
  );
};

export default LoginEnterCodePage;
