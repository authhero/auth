// can we just initialise this once? It's very globally
import i18next from "i18next";
import { VendorSettings } from "../../types";

type Props = {
  vendorSettings?: VendorSettings;
};
const Footer = ({ vendorSettings }: Props) => {
  const { termsAndConditionsUrl, name } = vendorSettings || {};

  return (
    <div className="mt-8">
      <div className="text-xs text-gray-300">
        {i18next.t("agree_to")}{" "}
        <a
          href={
            termsAndConditionsUrl ||
            "https://store.sesamy.com/pages/terms-of-service"
          }
          className="text-primary hover:underline"
          target="_blank"
        >
          {i18next.t("terms")}
        </a>
        {name === "sesamy" && (
          <>
            {" "}
            {i18next.t("and")}{" "}
            <a
              href={"https://store.sesamy.com/pages/privacy-policy"}
              className="text-primary hover:underline"
              target="_blank"
            >
              {i18next.t("privacy_policy")}
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default Footer;
