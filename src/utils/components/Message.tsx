import type { FC } from "hono/jsx";
import Layout from "./Layout";
import { VendorSettings } from "../../types";

type Props = {
  message: string;
  vendorSettings: VendorSettings;
};

const MessagePage: FC<Props> = ({ message, vendorSettings }) => {
  return (
    <Layout title="Login" vendorSettings={vendorSettings}>
      <div class="mb-6 text-gray-300">{message}</div>
    </Layout>
  );
};

export default MessagePage;
