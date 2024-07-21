import Button from "./Button";
import Layout from "./Layout";
import i18next from "i18next";
import type { FC } from "hono/jsx";
import { AuthParams, VendorSettings } from "@authhero/adapter-interfaces";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
  authParams: AuthParams;
};

const UserNotFound: FC<Props> = ({ vendorSettings, authParams }) => {
  const linkParams = new URLSearchParams({
    ...authParams,
  });
  const restartFlowLink = `/authorize?${linkParams}`;

  return (
    <Layout vendorSettings={vendorSettings} title={i18next.t("user_not_found")}>
      <div className="flex flex-1 flex-col justify-center">
        <p className="mb-8 text-gray-300 text-lg">
          {i18next.t("user_not_found_body")}
        </p>
        <Button Component="a" href={restartFlowLink}>
          {i18next.t("user_not_found_cta")}
        </Button>
      </div>
    </Layout>
  );
};

export default UserNotFound;
