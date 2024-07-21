import type { FC } from "hono/jsx";
import Layout from "./Layout";
import { VendorSettings } from "@authhero/adapter-interfaces";
import ErrorMessage from "./ErrorMessage";
import i18next from "i18next";
import DisabledSubmitButton from "./DisabledSubmitButton";
import Form from "./Form";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
  email?: string;
};

const SignupPage: FC<Props> = ({ error, vendorSettings, email }) => {
  return (
    <Layout
      title={i18next.t("create_account_title")}
      vendorSettings={vendorSettings}
    >
      <div class="mb-4 text-lg font-medium sm:text-2xl">
        {i18next.t("create_account_title")}
      </div>
      <div class="mb-6 text-gray-300">
        {i18next.t("create_account_description")}
      </div>
      <div class="flex flex-1 flex-col justify-center">
        <Form>
          <input
            type="email"
            name="username"
            placeholder={i18next.t("email_placeholder")}
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
            required
            value={email}
          />
          <input
            type="password"
            name="password"
            placeholder={i18next.t("password")}
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <DisabledSubmitButton className="text-base sm:mt-2 md:text-base">
            {i18next.t("continue")}
          </DisabledSubmitButton>
        </Form>
      </div>
    </Layout>
  );
};

export default SignupPage;
