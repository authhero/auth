import type { FC } from "hono/jsx";
import Layout from "./Layout";
import Button from "./Button";
import { Client, VendorSettings } from "../types";
import i18next from "i18next";
import ErrorMessage from "./ErrorMessage";
import DisabledSubmitButton from "./DisabledSubmitButton";
import Icon from "./Icon";
import Form from "./Form";
import { GoBack } from "./GoBack";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
  email: string;
  state: string;
  client: Client;
};

const EnterPasswordPage: FC<Props> = ({
  error,
  vendorSettings,
  email,
  state,
  client,
}) => {
  const loginLinkParams = new URLSearchParams({
    state,
  });

  return (
    <Layout title={i18next.t("enter_password")} vendorSettings={vendorSettings}>
      <div class="mb-4 text-lg font-medium sm:text-2xl">
        {i18next.t("enter_password")}
      </div>
      <div class="mb-6 text-gray-300">
        {i18next.t("enter_password_description")}
      </div>
      <div class="flex flex-1 flex-col justify-center">
        <Form className="mb-7">
          <input
            type="text"
            name="username"
            placeholder={i18next.t("email_placeholder")}
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
            value={email}
          />
          <input
            type="password"
            name="password"
            placeholder={i18next.t("password") || ""}
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
            required
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <DisabledSubmitButton className="text-base sm:mt-4 md:text-base">
            <div className="flex items-center space-x-2">
              <span>{i18next.t("login")}</span>
              <Icon className="text-xs" name="arrow-right" />
            </div>
          </DisabledSubmitButton>
        </Form>
        <a
          href={`/u/forgot-password?${loginLinkParams.toString()}`}
          className="text-primary hover:underline mb-4"
        >
          {i18next.t("forgot_password_link")}
        </a>
        <div className="text-center mb-12">
          <div className="relative mb-5 block text-center text-gray-300 dark:text-gray-300">
            <div className="absolute left-0 right-0 top-1/2 border-b border-gray-200 dark:border-gray-600" />
            <div className="relative inline-block bg-white px-2 dark:bg-gray-800">
              {i18next.t("or")}
            </div>
          </div>
          <form
            method="post"
            action={`/u/enter-email?${loginLinkParams.toString()}`}
          >
            <input type="hidden" name="login_selection" value="code" />
            <input type="hidden" name="username" value={email} />
            <Button variant="secondary" className="block">
              {i18next.t("enter_a_code_btn")}
            </Button>
          </form>
        </div>
        <GoBack state={state} />
      </div>
    </Layout>
  );
};

export default EnterPasswordPage;
