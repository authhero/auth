import Layout from "./Layout";
import Icon from "./Icon";
import i18next from "i18next";
import type { FC } from "hono/jsx";
import { VendorSettings } from "@authhero/adapter-interfaces";

type Props = {
  vendorSettings: VendorSettings;
};

const UnverifiedEmail: FC<Props> = ({ vendorSettings }) => {
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
      </div>
    </Layout>
  );
};

export default UnverifiedEmail;
