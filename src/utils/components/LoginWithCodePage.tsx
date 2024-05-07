import type { FC } from "hono/jsx";
import Layout from "./Layout";
import Button from "./Button";
import { VendorSettings } from "../../types";
import i18next from "i18next";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
};

// this page is called enter-email on login2... maybe we should copy those page names
const LoginWithCodePage: FC<Props> = ({ error, vendorSettings }) => {
  // TODO - get this from auth0header
  const sendType = "code";

  const loginDescriptionText =
    sendType === "code"
      ? i18next.t("login_description_code")
      : i18next.t("login_description_link");

  return (
    <Layout title="Login with Code" vendorSettings={vendorSettings}>
      <div class="mb-4 text-lg font-medium sm:text-2xl">
        {i18next.t("welcome")}
      </div>
      <div class="mb-6 text-gray-300">{loginDescriptionText}</div>
      <div class="flex flex-1 flex-col justify-center">
        <form method="post">
          <input
            type="text"
            name="username"
            placeholder={i18next.t("email_placeholder")}
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
          />
          {error && <em class="mb-2 bg-red">{error}</em>}
          <Button>{i18next.t("continue")}</Button>
        </form>
      </div>
    </Layout>
  );
};

export default LoginWithCodePage;
