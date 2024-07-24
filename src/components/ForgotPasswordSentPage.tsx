import type { FC } from "hono/jsx";
import Layout from "./Layout";
import { VendorSettings } from "@authhero/adapter-interfaces";
import { GoBack } from "./GoBack";
import i18next from "i18next";
import Icon from "./Icon";

type Props = {
  message: string;
  vendorSettings: VendorSettings;
  state: string;
};

const ForgotPasswordSentPage: FC<Props> = ({ vendorSettings, state }) => {
  return (
    <Layout title="Login" vendorSettings={vendorSettings}>
      <div class="flex flex-1 flex-col justify-center">
        <div>{i18next.t("forgot_password_email_sent")}</div>
        <div class="my-4 flex space-x-2 text-sm text-[#B2B2B2]">
          <Icon className="text-base" name="info-bubble" />
          <div class="text-sm text-gray-300 md:text-sm">
            {i18next.t("sent_code_spam")}
          </div>
        </div>
      </div>
      <GoBack state={state} />
    </Layout>
  );
};

export default ForgotPasswordSentPage;
