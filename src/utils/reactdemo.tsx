import type { FC } from "hono/jsx";
import { Context } from "hono";
import { Var } from "../types/Var";
import { Env } from "../types/Env";
import Layout from "./components/Layout";

const Button: FC<{}> = ({ children }) => {
  return (
    <button
      class="relative w-full rounded-lg text-center px-4 py-5 bg-primary text-textOnPrimary hover:bg-primaryHover text-base sm:mt-4 md:text-base"
      type="submit"
    >
      <span class="flex items-center justify-center space-x-2">{children}</span>
    </button>
  );
};

export const ResetPasswordPage: FC<{ error?: string }> = ({ error }) => {
  return (
    <Layout title="Reset Password">
      <div class="mb-8 text-2xl font-medium">Reset password</div>
      <div class="flex flex-1 flex-col justify-center">
        <form method="post">
          <input
            type="text"
            name="password"
            placeholder="enter new password"
            class="mb-2 w-full rounded-lg bg-gray-100 px-4 py-5 text-base placeholder:text-gray-300 dark:bg-gray-600 md:text-base"
          />
          {error && <em class="mb-2 bg-red">{error}</em>}
          <Button>Change password</Button>
        </form>
      </div>
    </Layout>
  );
};
