import { VendorSettings } from "../../types";
import type { FC } from "hono/jsx";

type AppLogoProps = {
  vendorSettings: VendorSettings;
};

const AppLogo: FC<AppLogoProps> = ({ vendorSettings }) => {
  if (vendorSettings?.logoUrl) {
    return (
      <div class="flex h-9 items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={vendorSettings.logoUrl}
          class="max-h-full"
          // do we not have the vendor name?
          alt="Vendor logo"
        />
      </div>
    );
  }

  // We shouldn't be doing sesamy branded stuff
  // can't return undefined in hono/jsx? so just empty div?
  return <div />;

  //   return (
  //     <div class="mb-9 flex h-9 items-center">
  //       <Icon class="text-xl text-white" name="sesamy" />
  //     </div>
  //   );
};

export default AppLogo;
