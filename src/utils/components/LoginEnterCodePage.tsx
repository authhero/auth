import type { FC } from "hono/jsx";
import Layout from "./Layout";
import Button from "./Button";
import { VendorSettings } from "../../types";
import i18next from "i18next";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
  email: string;
};

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
        <form method="post">
          <input
            type="text"
            name="code"
            placeholder="******"
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
          />
          {error && <em class="mb-2 bg-red">{error}</em>}
          <Button>{i18next.t("validate_code")}</Button>
        </form>
      </div>
    </Layout>
  );
};

export default LoginEnterCodePage;
