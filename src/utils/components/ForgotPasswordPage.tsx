import type { FC } from "hono/jsx";
import Layout from "./Layout";
import Button from "./Button";
import { VendorSettings } from "../../types";

type Props = {
  error?: string;
  vendorSettings: VendorSettings;
};

const ForgotPasswordPage: FC<Props> = ({ error, vendorSettings }) => {
  return (
    <Layout title="Login" vendorSettings={vendorSettings}>
      <div class="mb-4 text-lg font-medium sm:text-2xl">Login</div>
      <div class="mb-6 text-gray-300">Forgot password?</div>
      <div class="flex flex-1 flex-col justify-center">
        <form method="post">
          <input
            type="text"
            name="email"
            placeholder="email"
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
          />
          {error && <em class="mb-2 bg-red">{error}</em>}
          <Button>Continue</Button>
        </form>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage;