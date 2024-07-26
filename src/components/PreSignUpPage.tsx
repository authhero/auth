import type { FC } from "hono/jsx";
import Layout from "./Layout";
import { VendorSettings } from "@authhero/adapter-interfaces";
import i18next from "i18next";
import DisabledSubmitButton from "./DisabledSubmitButton";
import Form from "./Form";
import { GoBack } from "./GoBack";

type Props = {
  state: string;
  vendorSettings: VendorSettings;
  email?: string;
};

const PreSignupPage: FC<Props> = ({ vendorSettings, email, state }) => {
  return (
    <Layout
      title={i18next.t("create_password_account_title")}
      vendorSettings={vendorSettings}
    >
      <div class="mb-4 text-lg font-medium sm:text-2xl">
        {i18next.t("create_password_account_title")}
      </div>
      <div class="mb-6 text-gray-300">
        {i18next.t("enter_email_for_verification_description")}
      </div>
      <div class="flex flex-1 flex-col justify-center">
        <Form className="pt-2">
          <input
            type="email"
            name="username"
            placeholder={i18next.t("email_placeholder")}
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
            required
            value={email}
            disabled
          />
          <DisabledSubmitButton className="text-base sm:mt-4 md:text-base">
            <div className="flex items-center space-x-2">
              <span>{i18next.t("send")}</span>
            </div>
          </DisabledSubmitButton>
        </Form>
      </div>
      <GoBack state={state} />
    </Layout>
  );
};

export default PreSignupPage;
