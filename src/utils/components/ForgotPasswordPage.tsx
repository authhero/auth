import type { FC } from "hono/jsx";
import Layout from "./Layout";
import { VendorSettings } from "../../types";
import i18next from "i18next";
import ErrorMessage from "./ErrorMessage";
import DisabledSubmitButton from "./DisabledSubmitButton";
import Form from "./Form";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
};

const ForgotPasswordPage: FC<Props> = ({ error, vendorSettings }) => {
  return (
    <Layout
      title={i18next.t("forgot_password_title")}
      vendorSettings={vendorSettings}
    >
      <div class="mb-4 text-lg font-medium sm:text-2xl">
        {i18next.t("forgot_password_title")}
      </div>
      <div class="mb-6 text-gray-300">
        {i18next.t("forgot_password_description")}
      </div>
      <div class="flex flex-1 flex-col justify-center">
        <Form>
          <input
            type="email"
            name="username"
            placeholder={i18next.t("email_placeholder")}
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
            required
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <DisabledSubmitButton className="sm:mt-4">
            {i18next.t("forgot_password_cta")}
          </DisabledSubmitButton>
        </Form>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage;
