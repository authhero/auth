import type { FC } from "hono/jsx";
import Layout from "./Layout";
import Button from "./Button";
import { VendorSettings } from "../../types";

type ResetPasswordPageProps = {
  error?: string;
  vendorSettings: VendorSettings;
};

const LoginPage: FC<ResetPasswordPageProps> = ({ error, vendorSettings }) => {
  return (
    <Layout title="Login" vendorSettings={vendorSettings}>
      <div class="mb-4 text-lg font-medium sm:text-2xl">Login</div>
      <div class="mb-6 text-gray-300">
        {`Enter your email and password to login`}
      </div>
      <div class="flex flex-1 flex-col justify-center">
        <form method="post">
          <input
            type="text"
            name="email"
            placeholder="email"
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
          />
          {/*
            this page is not following Auth0's naming. just this field
            auth0 does password matching serverside
            BUT password strength is done clientside
            ALSO the inputs have the eye-button toggle to show the password
          */}
          <input
            type="text"
            name="password"
            placeholder="password"
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
          />
          {error && <em class="mb-2 bg-red">{error}</em>}
          <Button>Login</Button>
        </form>
      </div>
    </Layout>
  );
};

export default LoginPage;
