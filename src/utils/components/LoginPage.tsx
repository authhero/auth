import type { FC } from "hono/jsx";
import Layout from "./Layout";
import Button from "./Button";
import { VendorSettings } from "../../types";
import i18next from "i18next";
import ErrorMessage from "./ErrorMessage";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
  email: string;
  state: string;
};

const LoginPage: FC<Props> = ({ error, vendorSettings, email, state }) => {
  const loginLinkParams = new URLSearchParams({
    state,
    username: email,
  });

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
        <a
          href={`/u/forgot-password?${loginLinkParams.toString()}`}
          className="text-primary hover:underline mb-4"
        >
          {i18next.t("forgot_password_link")}
        </a>
        <a
          // How does a user get to this step then without having entered an email address?
          href={`/u/signup?${loginLinkParams.toString()}`}
          className="text-primary hover:underline font-bold"
        >
          {i18next.t("create_new_account_link")}
        </a>
        <div className="text-center mb-12">
          <div className="relative mb-5 block text-center text-gray-300 dark:text-gray-300">
            <div className="absolute left-0 right-0 top-1/2 border-b border-gray-200 dark:border-gray-600" />
            <div className="relative inline-block bg-white px-2 dark:bg-gray-800">
              {i18next.t("or")}
            </div>
          </div>
          <Button
            Component="a"
            // TODO - if we persist the cookie and the user comes straight here, then we need to also SEND
            // a code email when clicking this link...
            // we don't want to send the code email everytime we refresh the enter-code page
            // as we previously did that BUT then we changed it, but I think we should really
            // otherwise we end up not resending (we've had this a few times)
            // the downside is we send lots of emails when developing...
            href={`/u/enter-code?${loginLinkParams.toString()}`}
            variant="secondary"
            className="block"
          >
            {i18next.t("enter_your_password_btn")}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
