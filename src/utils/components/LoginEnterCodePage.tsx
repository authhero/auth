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
      <div class="mb-4 text-lg font-medium sm:text-2xl">
        {i18next.t("verify_your_email")}
      </div>
      <div class="mb-6 text-gray-300">
        {/* Enter your code to login */}
        {/* not sure how to do this... see if similar component... or some way to manually do it */}
        <Trans
          i18nKey="we_sent_a_code_to"
          components={[
            <span className="text-black dark:text-white" key="span" />,
          ]}
          values={{ email }}
        />
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
