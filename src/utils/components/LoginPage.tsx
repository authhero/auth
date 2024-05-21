import type { FC } from "hono/jsx";
import Layout from "./Layout";
import Button from "./Button";
import { VendorSettings } from "../../types";
import i18next from "i18next";
import ErrorMessage from "./ErrorMessage";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
  email?: string;
};

const LoginPage: FC<Props> = ({ error, vendorSettings, email }) => {
  return (
    <Layout title="Login" vendorSettings={vendorSettings}>
      <div class="mb-4 text-lg font-medium sm:text-2xl">
        {i18next.t("enter_password")}
      </div>
      <div class="mb-6 text-gray-300">
        {i18next.t("enter_password_description")}
      </div>
      <div class="flex flex-1 flex-col justify-center">
        <form method="post">
          <input
            type="text"
            name="username"
            placeholder={i18next.t("email_placeholder")}
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
            value={email}
            disabled
          />
          <input
            type="password"
            name="password"
            placeholder={i18next.t("password") || ""}
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button>{i18next.t("login")}</Button>
        </form>
      </div>
    </Layout>
  );
};

export default LoginPage;
