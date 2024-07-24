import Layout from "./Layout";
import Icon from "./Icon";
import i18next from "i18next";
import type { FC } from "hono/jsx";
import { VendorSettings } from "@authhero/adapter-interfaces";
import { GoBack } from "./GoBack";

type Props = {
  vendorSettings: VendorSettings;
  state: string;
};

const UnverifiedEmailPage: FC<Props> = ({ vendorSettings, state }) => {
  return (
    <Layout
      title={i18next.t("unverified_email")}
      vendorSettings={vendorSettings}
    >
      <div className="flex flex-1 flex-col justify-center">
        <p className="mb-8 text-gray-300 text-lg">
          {i18next.t("unverified_email")}
        </p>
        <div className="my-4 flex space-x-2 text-sm text-[#B2B2B2]">
          <Icon className="text-base" name="info-bubble" />
          <div className="text-sm text-gray-300 md:text-sm">
            {/* translation string should just be sent_spam */}
            {i18next.t("sent_code_spam")}
          </div>
        </div>
        <GoBack state={state} />
      </div>
      <GoBack state={state} />
    </Layout>
  );
};

export default UnverifiedEmailPage;
