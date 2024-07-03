import type { FC } from "hono/jsx";
import Layout from "./Layout";
import Button from "./Button";
import { VendorSettings } from "../types";
import i18next from "i18next";
import Icon from "./Icon";

type Props = {
  vendorSettings: VendorSettings;
  state: string;
};

const EmailValidatedPage: FC<Props> = ({ vendorSettings, state }) => {
  const loginLinkParams = new URLSearchParams({
    state,
  });

  return (
    <Layout
      title={i18next.t("email_validated")}
      vendorSettings={vendorSettings}
    >
      <div class="mb-4 text-lg font-medium sm:text-2xl">
        {i18next.t("email_validated")}
      </div>
      <div class="flex flex-1 flex-col justify-center mb-7">
        <Button
          Component="a"
          href={`/u/enter-password?${loginLinkParams}`}
          className="text-base sm:mt-4 md:text-base"
        >
          <div className="flex items-center space-x-2">
            <span>{i18next.t("email_validated_cta")}</span>
            <Icon className="text-xs" name="arrow-right" />
          </div>
        </Button>
      </div>
    </Layout>
  );
};

export default EmailValidatedPage;
