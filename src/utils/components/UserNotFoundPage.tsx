import Button from "./Button";
import { VendorSettings } from "../../types";
import Layout from "./Layout";
import i18next from "i18next";
import type { FC } from "hono/jsx";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
  state: string;
};

const UserNotFound: FC<Props> = ({ vendorSettings, state }) => {
  const linkParams = new URLSearchParams({
    state,
  });
  const enterCodeLink = `/u/code?${linkParams}`;

  return (
    <Layout vendorSettings={vendorSettings} title={i18next.t("user_not_found")}>
      <div className="flex flex-1 flex-col justify-center">
        <p className="mb-8 text-gray-300 text-lg">
          {i18next.t("user_not_found_body")}
        </p>
        <Button Component="a" href={enterCodeLink}>
          {i18next.t("user_not_found_cta")}
        </Button>
      </div>
    </Layout>
  );
};

export default UserNotFound;
