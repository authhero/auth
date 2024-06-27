import type { FC } from "hono/jsx";
import Layout from "./Layout";
import { VendorSettings } from "../types";

type Props = {
  message: string;
  vendorSettings: VendorSettings;
  pageTitle: string;
};

const MessagePage: FC<Props> = ({ message, vendorSettings, pageTitle }) => {
  return (
    <Layout title="Login" vendorSettings={vendorSettings}>
      <div class="mb-6 text-gray-300">{pageTitle}</div>
      <div class="flex flex-1 flex-col justify-center">{message}</div>
    </Layout>
  );
};

export default MessagePage;
