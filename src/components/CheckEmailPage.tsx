import type { FC, JSXNode } from "hono/jsx";
import Layout from "./Layout";
import { VendorSettings } from "@authhero/adapter-interfaces";
import i18next, { t } from "i18next";
import Trans from "./Trans";
import { User } from "@authhero/adapter-interfaces";
import Form from "./Form";
import DisabledSubmitButton from "./DisabledSubmitButton";

type Props = {
  vendorSettings: VendorSettings;
  state: string;
  user: User;
};

const CheckEmailPage: FC<Props> = ({ vendorSettings, state, user }) => {
  return (
    <Layout title="Test" vendorSettings={vendorSettings}>
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-8 text-gray-300">
          <Trans
            i18nKey="currently_logged_in_as"
            components={[
              (
                <span className="text-black dark:text-white" key="span" />
              ) as unknown as JSXNode,
            ]}
            values={{ email: user.email }}
          />
          .<br />
          {t("continue_with_sso_provider_headline")}
        </div>

        <div className="space-y-6">
          <Form>
            <DisabledSubmitButton className="text-base sm:mt-4 md:text-base">
              <div className="flex items-center space-x-2">
                <span>{i18next.t("yes_continue_with_existing_account")}</span>
              </div>
            </DisabledSubmitButton>
          </Form>
          <a
            className="mx-auto block text-primary hover:text-primaryHover"
            href={`/u/enter-email?state=${state}`}
          >
            {i18next.t("no_use_another")}
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default CheckEmailPage;
